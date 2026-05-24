# WORKFLOW: Document Template Lifecycle

**Version:** 0.1  
**Date:** 2026-05-24  
**Author:** Workflow Architect  
**Status:** Draft  
**Implements:** Document Template & Company Setup Module

---

## Overview

The Document Template Lifecycle workflow manages the full lifecycle of document templates — from creation (with `{{placeholder}}` variables) through activation, editing, deactivation, and soft-deletion. Templates store reusable document content that gets merged with employee + company data at generation time. The `DocumentTemplate` entity tracks active/inactive state; deletion is a soft-deprecation (isActive=false) to preserve historical download logs.

---

## Actors

| Actor | Role in this workflow |
|---|---|
| Admin | Creates, edits, activates, deactivates, deletes templates |
| DocumentTemplateController | `DocumentTemplateController.java` — REST endpoints ✅ IMPLEMENTED |
| DocumentTemplateService | `DocumentTemplateService.java` — Business logic, template types ✅ IMPLEMENTED |
| DocumentTemplateRepository | Data access for `document_templates` table ✅ IMPLEMENTED |
| Frontend UI | List, form, preview, confirmation dialogs |
| TemplateEngine | `TemplateEngine.java` — placeholder resolution utility ✅ IMPLEMENTED |
| TemplatePlaceholderResolver | `TemplatePlaceholderResolver.java` — maps employee/company data to placeholders ✅ IMPLEMENTED |

---

## Prerequisites

- Admin user authenticated with `ROLE_ADMIN`
- `document_templates` table exists (auto-created by JPA from `DocumentTemplate` entity)
- `template_type` master data exists in master_data table (or uses a fixed enum set)

---

## Trigger

Admin navigates to `/admin/document-templates` (route to be added) or clicks a "Document Templates" menu item.

---

## Workflow Tree

### STEP 1: Load Template List

**Actor**: Frontend → Backend  
**Action**: Fetch all templates with pagination, filtering, and search  
**Timeout**: 15s  
**Input**: `GET /api/v1/document-templates?templateType=OFFER_LETTER&active=true`  
**Output on SUCCESS**: UNPAGINATED list of `DocumentTemplateDTO` objects (backend returns `List<>`, NOT `PagedResponse`) → render table → GO TO STEP 2  
**Output on FAILURE**:
  - `FAILURE(timeout)`: retry x2 with 5s backoff → show error state "Failed to load templates" + retry
  - `FAILURE(500)`: same error state + toast

**Observable states**:
  - Customer sees: Skeleton table (5 shimmer rows), then data rows
  - Empty state: "No templates yet. Create your first template."
  - Operator sees: Table columns — Name, Type, Status (Active/Inactive badge), Updated, Actions
  - Logs: `[DocumentTemplateService] Loading templates`

### STEP 2: List View Actions

**Actor**: Admin  
**Action**: Choose one of:
  - **Create new** → GO TO STEP 3
  - **View/Edit existing** → GO TO STEP 3 (prefilled)
  - **Toggle active/inactive** → GO TO STEP 5
  - **Delete template** → GO TO STEP 6

### STEP 3: Template Form (Create / Edit)

**Actor**: Admin  
**Action**: Fill or modify template form

**Form Fields**:
| Field | Required | Type | Validation |
|---|---|---|---|
| Template Name | Yes | Text | 1-200 chars, unique |
| Template Type | Yes | Dropdown | Must select valid type |
| Description | No | Textarea | Max 500 chars |
| Content | Yes | Rich text / textarea | Min 1 char, must contain content |

**Template Type**: Predefined categories (e.g., `OFFER_LETTER`, `APPOINTMENT_LETTER`, `EXPERIENCE_LETTER`, `CONFIRMATION_LETTER`, `RELIEVING_LETTER`, `SALARY_SLIP`, `ID_CARD`, `OTHER`). Stored as string in `template_type` column. Types should be seeded as master data or configured in a constant.

**Content Editor**:
  - Textarea or rich text editor for template body
  - Admin inserts `{{placeholders}}` manually or via helper buttons
  - Frontend provides placeholder reference panel showing available variables:

**Available Placeholders** (defined in `TEMPLATE_PLACEHOLDERS`):
  - **Employee**: `{{employee_name}}`, `{{employee_code}}`, `{{designation}}`, `{{doj}}`, `{{doe}}`, `{{gender}}`, `{{address}}`, `{{mobile}}`, `{{email}}`
  - **Company**: `{{company_name}}`, `{{company_address}}`, `{{company_logo}}`, `{{company_gst}}`, `{{company_pan}}`, `{{company_cin}}`
  - **System**: `{{current_date}}`, `{{financial_year}}`, `{{authorized_signatory}}`

**Client-side validation**:
  - `FAILURE(missing_name)`: "Template name is required" → inline error
  - `FAILURE(missing_type)`: "Template type is required" → inline error  
  - `FAILURE(missing_content)`: "Template content is required" → inline error
  - `FAILURE(content_too_large)`: If content > 65535 chars (TEXT column limit) → warning

**Branch: Edit Mode (Sub-step 3a)**
  - Form prefilled with existing template data
  - Template name is editable (but uniqueness validation applies to new name)
  - Default state: keep `isActive` unchanged

**Variable Extraction (Sub-step 3b — backend):**
  - On save, backend scans `content` for all `{{variable}}` patterns
  - Extracts unique variable names (without `{{}}`)
  - Stores as JSON array in `variables` column: `["employee_name", "company_name", "current_date"]`
  - This enables client to validate at generation time that all placeholders are resolvable

### STEP 4: Save Template

**Actor**: Admin  
**Action**: Click "Save" (Create) or "Update" (Edit)  
**Timeout**: 15s

**Create Input**: `POST /api/v1/document-templates`  
**Update Input**: `PUT /api/v1/document-templates/{id}`

**Payload**:
```json
{
  "templateName": "Experience Letter",
  "templateType": "EXPERIENCE_LETTER",
  "description": "Standard experience letter format",
  "content": "This is to certify that {{employee_name}} (Code: {{employee_code}}) worked with {{company_name}} from {{doj}} to {{doe}}..."
}
```

**Output on SUCCESS**: Saved `DocumentTemplate` with `isActive=true` (default) → toast "Template created/updated" → navigate back to list → GO TO STEP 1 (refreshed)

**Output on FAILURE**:
  - `FAILURE(validation_error)`: 422 → inline errors on form fields
  - `FAILURE(duplicate_name)`: 409 → toast "A template with this name already exists"
  - `FAILURE(timeout)`: retry x2 → toast "Save timed out. Please try again."
  - `FAILURE(500)`: toast "Error saving template"

**Observable states during this step**:
  - Customer sees: Button spinner "Saving...", fields disabled
  - Database: Row created or updated in `document_templates`
  - Backend: Variables extracted and stored as JSON
  - Logs: `[DocumentTemplateService] Template created: {name}`

### STEP 5: Toggle Active/Inactive — REALITY CHECK

**Reality**: Backend has NO `PATCH` endpoint for toggling status. The only toggle mechanism is:
  - **Deactivate**: `DELETE /api/v1/document-templates/{id}` — sets `isActive=false`
  - **Reactivate**: `PUT /api/v1/document-templates/{id}` with `isActive: true` in body

Frontend must use the update endpoint with `isActive: true` to reactivate templates. No dedicated toggle endpoint exists.

**Behavioral Impact**:
  - Inactive (`isActive=false`) templates are HIDDEN from the generation dropdown in the Document Generation workflow
  - Existing generated documents for this template are NOT affected (download logs reference template by ID)
  - Inactive templates remain visible in the template management list (use `active` filter param)

### STEP 6: Deactivate Template (Delete action)

**Actor**: Admin  
**Action**: Click delete icon on template row → confirmation dialog appears

**Confirmation Dialog**:
```
Title: Deactivate Template?
Message: "Are you sure you want to deactivate '{templateName}'? This template will be hidden from the 
         document generation dropdown. Existing documents will not be affected."
Buttons: [Cancel] [Deactivate] (danger)
```

**Input**: `DELETE /api/v1/document-templates/{id}`

**Backend Behavior**: The `DELETE` endpoint does NOT delete the record — it SETS `isActive=false`. This is a deactivation, not a deletion. There is no `deletedAt` field in the entity. The template remains accessible by ID (for download log references) but is hidden from the active-templates dropdown.

**Success**: Toast "Template deactivated successfully" → template badge changes to "Inactive" in table
**Failure**:
  - `FAILURE(404)`: toast "Template not found"
  - `FAILURE(500)`: toast "Error deactivating template"

---

## State Transitions

```
[draft] → (STEP 4 save with isActive=true) → [active]
[draft] → (STEP 4 save with isActive=false) → [inactive] (edge case)
[active] → (STEP 5 deactivate) → [inactive]
[inactive] → (STEP 5 activate) → [active]
[active] → (STEP 6 delete) → [archived]
[inactive] → (STEP 6 delete) → [archived]
[archived] → (terminal) → never revived via UI
```

---

## Handoff Contracts

### Frontend → Backend: List Templates

```
GET /api/v1/document-templates?templateType=OFFER_LETTER&active=true
Authorization: Bearer {jwt}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "templateName": "Experience Letter",
      "templateType": "EXPERIENCE_LETTER",
      "description": "Standard experience letter",
      "content": "This is to certify that...",
      "variables": "[\"employee_name\",\"employee_code\",\"company_name\"]",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00",
      "updatedAt": "2024-06-15T10:30:00",
      "createdBy": "admin",
      "updatedBy": "admin"
    }
  ]
}
```

**Note**: Response is a `List`, NOT a `PagedResponse`. The frontend must handle pagination client-side.

### Frontend → Backend: Create Template

```
POST /api/v1/document-templates
Content-Type: application/json
Authorization: Bearer {jwt}
```

**Payload**:
```json
{
  "templateName": "Experience Letter",
  "templateType": "EXPERIENCE_LETTER",
  "description": "Standard experience letter format",
  "content": "This is to certify that {{employee_name}}..."
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "message": "Template created successfully",
  "data": { /* DocumentTemplate object */ }
}
```

### Frontend → Backend: Update Template

```
PUT /api/v1/document-templates/{id}
Content-Type: application/json
Authorization: Bearer {jwt}
```

**Payload** same as create. **Response** same as create (200).

### Frontend → Backend: Reactivate Template (via Update)

```
PUT /api/v1/document-templates/{id}
Content-Type: application/json
Authorization: Bearer {jwt}
```

**Payload** (only `isActive` needed, but PUT expects full object):
```json
{
  "id": 1,
  "templateName": "Experience Letter",
  "templateType": "EXPERIENCE_LETTER",
  "content": "...",
  "isActive": true
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Template updated successfully",
  "data": { /* DocumentTemplateDTO with isActive=true */ }
}
```

### Frontend → Backend: Delete Template

```
DELETE /api/v1/document-templates/{id}
Authorization: Bearer {jwt}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Template deleted successfully",
  "data": null
}
```

### Frontend → Backend: Get Template Types

```
GET /api/v1/document-templates/types
Authorization: Bearer {jwt}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Success",
  "data": ["OFFER_LETTER", "APPOINTMENT_LETTER", "EXPERIENCE_LETTER", "CONFIRMATION_LETTER", "RELIEVING_LETTER", "SALARY_SLIP", "ID_CARD", "OTHER"]
}
```

---

## Cleanup Inventory

| Resource | Created at step | Destroyed by | Destroy method |
|---|---|---|---|
| DocumentTemplate DB record | STEP 4 | STEP 6 | Soft delete (isActive=false) |
| Variables JSON in content | STEP 4 (auto-extracted) | STEP 4 (re-extracted on update) | Overwritten on re-save |
| Template content | STEP 4 | Never (preserved for download history) | — |

---

## Reality Checker Findings

| # | Finding | Severity | Spec section affected | Resolution |
|---|---|---|---|---|
| RC-1 | DocumentTemplateController + DocumentTemplateService BOTH IMPLEMENTED ✅ | Info | All handoff contracts | Verified — all CRUD, generate, preview, logs endpoints exist |
| RC-2 | Frontend `DocumentTemplateService` expects `PagedResponse`, backend returns `List` | **High** | STEP 1, Handoff contracts | FRONTEND-BACKEND MISMATCH. The frontend service uses `PagedResponse<DocumentTemplate>` but backend returns `List<DocumentTemplateDTO>`. Frontend needs to be changed to handle `List<>` or backend needs pagination. |
| RC-3 | `template_types` endpoint returns `List<Map<String,String>>` (code+display pairs) | Info | Handoff contracts | ✅ Matches frontend's `getTemplateTypes()` |
| RC-4 | No `PATCH` toggle endpoint — deactivate via `DELETE`, reactivate via `PUT` | Medium | STEP 5 | Acceptable but inconsistent. Add `PATCH` endpoint for cleaner toggle. |
| RC-5 | No route for `/admin/document-templates` in UI `app.routes.ts` | Medium | Trigger | Route needs to be added |
| RC-6 | Delete is actually deactivate (`isActive=false`) — no soft delete state tracking | Low | STEP 6 | No `deletedAt` field — templates just become inactive |
| RC-7 | DocumentTemplateDTO field is named `isActive` (not `active`) | Medium | Handoff contracts | Frontend model uses `active` (no `is` prefix) — **MISMATCH** |
| RC-8 | Template types are hardcoded enum in service, not from master_data table | Low | STEP 3 | Design decision — fixed set manageable |

---

## Test Cases

| Test | Trigger | Expected behavior |
|---|---|---|
| TC-01: Create template with all fields | Fill name, type, desc, content → Save | 201, appears in list, active=true |
| TC-02: Create template with minimal fields | Name + type + content only → Save | 201, description null |
| TC-03: Create template with duplicate name | Save template with existing name | 409 "Template name already exists" |
| TC-04: Create template without name | Leave name empty → Save | Client-side validation blocks |
| TC-05: Create template without type | Leave type empty | Client-side validation blocks |
| TC-06: Create template without content | Leave content empty | Client-side validation blocks |
| TC-07: Edit template | Modify name, content → Update | 200, changes persisted |
| TC-08: Edit template — keep same name | Update other fields, same name | 200 (same name OK on update) |
| TC-09: Deactivate template | Toggle to inactive | Badge updates, hidden from generation dropdown |
| TC-10: Reactivate template | Toggle to active | Badge updates, visible in generation dropdown |
| TC-11: Delete template | Click delete → confirm | Soft deleted, removed from default list |
| TC-12: Delete template — cancel dialog | Click delete → cancel | No action, template remains |
| TC-13: Template with placeholders | Save content containing `{{employee_name}}` | Variables field extracts: ["employee_name"] |
| TC-14: Template with no placeholders | Save content with no `{{...}}` | Variables field: empty array or null |
| TC-15: List with filters | Filter by type=OFFER_LETTER, active=true | Returns only matching templates |
| TC-16: List with search | Search "experience" | Returns templates with "experience" in name/description |

---

## Assumptions

| # | Assumption | Where verified | Risk if wrong |
|---|---|---|---|
| A1 | Template name uniqueness is enforced at the application layer | Not verified | Duplicate names possible |
| A2 | Variables are extracted and stored as JSON array string | `DocumentTemplate.variables` is TEXT/JSON column | Parsing errors on read |
| A3 | Template types are a fixed set (not dynamic master data) | Frontend `GET /types` endpoint needed | Add seed data or enum |
| A4 | Soft delete is sufficient — no hard delete needed | User requirement | Historical FK integrity |

---

## Open Questions

1. **Template type management**: Should template types come from master data (admins can add new types) or be a fixed enum? Recommend: fixed enum for v1, master data for v2.
2. **Rich content**: Should the content support HTML formatting or plain text only? Recommend: plain text with `\n` for line breaks in v1, rich text via a WYSIWYG editor in v2.
3. **Versioning**: Should edits create a new version? Not needed in v1 — just overwrite. Historical download logs reference the template ID, not the content snapshot. If content changes, regenerated docs use new content. This is acceptable.
4. **Deletion behavior**: Should deleted templates be recoverable via an "Archived" filter? Recommend: Yes, add filter `showArchived=true` to list endpoint.

---

## Spec vs Reality Audit Log

| Date | Finding | Action taken |
|---|---|---|
| 2026-05-24 | Initial spec created — backend IS already implemented ✅ | Verified code |
| 2026-05-24 | RC-2: Frontend expects PagedResponse, backend returns List | Flagged — frontend-backend contract mismatch |
| 2026-05-24 | RC-7: Frontend uses `active`, backend uses `isActive` | Flagged — field name mismatch |
