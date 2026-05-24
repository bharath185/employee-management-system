# WORKFLOW: Company Setup

**Version:** 0.1  
**Date:** 2026-05-24  
**Author:** Workflow Architect  
**Status:** Draft  
**Implements:** Document Template & Company Setup Module

---

## Overview

The Company Setup workflow enables a Superadmin or Admin to configure the organization profile — company name, contact details, registration numbers, logo upload, and legal document uploads. This information is consumed downstream by Document Templates (via `{{placeholders}}`) and appears on generated documents. The system supports one company record (singleton pattern: first save creates, subsequent saves update).

---

## Actors

| Actor | Role in this workflow |
|---|---|
| Superadmin / Admin | Initiates setup via UI, fills forms, uploads files |
| API Gateway | Validates JWT, routes requests |
| CompanyController | `CompanyController.java` — REST layer for company CRUD ✅ IMPLEMENTED |
| CompanyService | `CompanyService.java` — Business logic ✅ IMPLEMENTED |
| CompanyRepository | Data access for `company` table ✅ IMPLEMENTED |
| CompanyDocumentRepository | Data access for `company_documents` table ✅ IMPLEMENTED |
| CompanyDocumentDTO | DTO for document response ✅ IMPLEMENTED |
| File System | Stores uploaded logo and document files on disk |

---

## Prerequisites

- Admin user is authenticated with `ROLE_ADMIN`
- Upload directories are configured in `application.properties`:
  - `app.photo.upload-dir` (for logo — uses same path as photos)
  - `app.document.upload-dir` (for documents)
- `spring.servlet.multipart.max-file-size=10MB`
- `spring.servlet.multipart.max-request-size=50MB`

---

## Trigger

Admin navigates to `/admin/company` or clicks "Company Setup" in sidebar navigation.

---

## Workflow Tree

### STEP 1: Load Current Company Data

**Actor**: Frontend → Backend  
**Action**: On page init, fetch current company state and documents list  
**Timeout**: 15s  
**Input**: `GET /api/v1/company`  
**Output on SUCCESS**: `CompanyDTO` object (auto-creates default "My Company" if none exists — never 404) → GO TO STEP 2  
**Output on FAILURE**:
  - `FAILURE(timeout)`: retry x2 with 5s backoff → show error state with retry button
  - `FAILURE(500)`: "Failed to load company data" toast + retry button

**Observable states during this step**:
  - Customer sees: Skeleton form (shimmer placeholders for 6 input fields)
  - Operator sees: Page loading spinner
  - Database: Company table queried
  - Logs: `[CompanyService] Loading company configuration`

### STEP 2: Render Form

**Actor**: Frontend  
**Action**: Display company setup form with two possible states:
  - **New mode** (no existing record): Empty form fields, "Save" button
  - **Edit mode** (existing record): Pre-filled fields, "Save" button
  - Logo preview: Shows existing logo or upload placeholder
  - Documents table: Lists existing company documents or empty state

**Observable states**:
  - Customer sees: Form with fields or skeleton (if loading)
  - Empty state (no company): Form with empty fields, placeholder logo area, empty documents table with "No documents uploaded" message
  - Loaded state: Pre-filled form, logo preview, documents in table

### STEP 3: User Fills/Modifies Form

**Actor**: Admin  
**Action**: User fills form fields or modifies existing values

**Form Fields**:
| Field | Required | Type | Validation |
|---|---|---|---|
| Company Name | Yes | Text | Min 1 char |
| Phone | No | Text | Optional |
| Email | No | Email | Valid email format |
| Website | No | URL | Optional |
| Address | No | Textarea | Optional |
| Registration Number | No | Text | Optional |
| GST Number | No | Text | Optional (format if entered) |
| PAN Number | No | Text | Optional (format if entered) |
| TAN Number | No | Text | Optional |
| CIN Number | No | Text | Optional |
| Incorporated Date | No | Date | Optional |
| Authorized Signatory | No | Text | Optional |

**Branch: Logo Upload (Sub-step 3a)**
  - User clicks "Upload Logo" → file picker opens
  - File selected → client-side preview via FileReader API
  - Validation (client-side):
    - `FAILURE(invalid_format)`: Not image/* → toast "Only image files are accepted"
    - `FAILURE(file_too_large)`: >2MB → toast "Logo must be under 2MB"
  - File stored in component state (not yet uploaded to server)

**Branch: Legal Document Upload (Sub-step 3b)**
  - User clicks "Upload Document" → modal opens
  - Select Document Type (dropdown: GST_CERTIFICATE, PAN_CARD, INCORPORATION, TAX_RETURN, AUDIT_REPORT, OTHER)
  - Select file via file picker
  - Validation:
    - `FAILURE(no_type)`: Type not selected → "Please select document type"
    - `FAILURE(no_file)`: No file → "Please select a file"
  - On confirm → API call `POST /api/v1/company/documents` (multipart)
  - Success → document appears in table, toast "Document uploaded"
  - Failure → toast with error, modal stays open

### STEP 4: Save Company (Form Submit)

**Actor**: Admin  
**Action**: User clicks "Save" button  
**Timeout**: 30s  
**Input**: `PUT /api/v1/company` — ALWAYS multipart/form-data (backend annotation requires it)

**Payload**: ALWAYS sent as `multipart/form-data` even without logo:
```
Part: company → Blob(JSON.stringify(companyDTO), "application/json")
Part: logo → File (optional, null if not re-uploading)
```

**CompanyDTO JSON**:
```json
{
  "companyName": "Acme Corp",
  "address": "123 Business Park",
  "phone": "+91-9876543210",
  "email": "contact@acme.com",
  "website": "https://acme.com",
  "registrationNumber": "U12345MH2020",
  "gstNumber": "27AABCU9603R1ZX",
  "panNumber": "AABCU9603R",
  "tanNumber": "MUMT12345A",
  "cinNumber": "L12345MH2020PLC123456",
  "incorporatedDate": "2020-01-15",
  "authorizedSignatory": "John Doe"
}
```

**Important**: The backend `@RequestPart("company")` requires multipart even for JSON-only saves. Frontend's `updateCompany()` in `company.service.ts` already handles this — it wraps the JSON in a `Blob` and sends multipart only when a logo is present. **But the backend controller expects multipart always.** This is a mismatch: frontend sends `application/json` for logo-less saves, but backend only accepts `multipart/form-data`. This will cause 415 errors on saves without logo.

**Output on SUCCESS**: Updated `CompanyDTO` → toast "Company updated successfully" → form refreshes with saved data → GO TO IDLE  
**Output on FAILURE**:
  - `FAILURE(validation_error)`: Backend returns 422 with field errors → map to inline form errors, scroll to first error
  - `FAILURE(company_name_required)`: Client-side already blocks, but if empty → toast "Company name is required"
  - `FAILURE(415)`: Content-Type mismatch (frontend sends JSON, backend expects multipart) → **REALITY GAP — fix needed**
  - `FAILURE(timeout)`: 30s → toast "Request timed out. Please try again." → form remains editable with current values
  - `FAILURE(500)`: toast "Error saving company details" → form remains editable

**Observable states during this step**:
  - Customer sees: Button shows spinner, text "Saving..." 
  - Operator sees: Fields become disabled during save
  - Database: Company row UPSERTed (single row via id=1 findOrCreate)
  - Logs: `[CompanyService] Company details updated by {username}`

### SUB-STEP 4a: — Logo Upload (Save-time)

**Actor**: CompanyService  
**Action**: If logo file is attached, it is saved to disk during save

**Details**:
  - Logo saved to `{app.photo.upload-dir}/company/logo{ext}`
  - `logoPath` field in Company set to `/uploads/photos/company/logo{ext}`
  - Old logo file deleted if it exists (by overwriting)

**Timeout**: 10s  
**Output on SUCCESS**: Logo file on disk, logoPath updated → GO TO STEP 5  
**Output on FAILURE**:
  - `FAILURE(io_error)`: File write fails → `FileStorageException` thrown → transaction rolled back → Company record NOT saved → toast "Failed to upload logo. Please try again."

### SUB-STEP 4b: — Document Upload (Independent action, not tied to Save)

**Actor**: Frontend (independent of Save button)  
**Action**: Document upload via `POST /api/v1/company/documents` (multipart)

**Payload**: `documentType` + `file`  
**Timeout**: 30s  
**Output on SUCCESS**: `CompanyDocument` object → document row added to table → toast "Document uploaded"  
**Output on FAILURE**:
  - `FAILURE(missing_type)`: 400 → "Document type is required"
  - `FAILURE(empty_file)`: 400 → "File is empty"
  - `FAILURE(io_error)`: 500 → "Failed to store document"
  - `FAILURE(file_too_large)`: 413 → "File size exceeds maximum limit (10MB)"

### STEP 5: Idle State

**Actor**: System  
**Action**: Form displays saved data. User can:
  - Edit and re-save (cycles STEP 3 → 4)
  - Upload additional documents (cycles SUB-STEP 3b → 4b)
  - Delete a document (confirmation dialog → `DELETE /api/v1/company/documents/{id}`)
  - Re-upload logo (cycles SUB-STEP 3a → 4a)
  - Navigate away

---

## State Transitions

```
[not_setup] → (STEP 4 saves successfully) → [active]
[active] → (STEP 4 saves again with edits) → [active] (updated)
[active] → (STEP 4 fails mid-save) → [active] (previous state preserved — no partial update)
```

The company record is a singleton: only one row ever exists (enforced by application logic — the controller always operates on id=1 or the first row). It is never deleted, only updated.

---

## Handoff Contracts

### Frontend → Backend: GET Company

```
GET /api/v1/company
Authorization: Bearer {jwt}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "companyName": "Acme Corp",
    "address": "123 Business Park",
    "phone": "+91-9876543210",
    "email": "contact@acme.com",
    "website": "https://acme.com",
    "registrationNumber": "U12345MH2020",
    "gstNumber": "27AABCU9603R1ZX",
    "panNumber": "AABCU9603R",
    "tanNumber": "MUMT12345A",
    "cinNumber": "L12345MH2020PLC123456",
    "incorporatedDate": "2020-01-15",
    "logoPath": "/uploads/photos/company/logo.png",
    "authorizedSignatory": "John Doe",
    "createdAt": "2024-01-01T00:00:00",
    "updatedAt": "2024-06-15T10:30:00"
  }
}
```

**Not-Found Response (204 / 404)**:
```json
{
  "success": false,
  "message": "Company not set up yet"
}
```

### Frontend → Backend: Save Company

```
PUT /api/v1/company
Content-Type: multipart/form-data (if logo) OR application/json
Authorization: Bearer {jwt}
```

**Payload (JSON only)**:
```json
{
  "companyName": "Acme Corp",
  "address": "123 Business Park",
  "phone": "+91-9876543210",
  "email": "contact@acme.com",
  "website": "https://acme.com",
  "registrationNumber": "U12345MH2020",
  "gstNumber": "27AABCU9603R1ZX",
  "panNumber": "AABCU9603R",
  "tanNumber": "MUMT12345A",
  "cinNumber": "L12345MH2020PLC123456",
  "incorporatedDate": "2020-01-15",
  "authorizedSignatory": "John Doe"
}
```

**Payload (multipart — with logo)**:
```
Part: company → Blob(JSON.stringify(company), application/json)
Part: logo → File(image/png)
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Company updated successfully",
  "data": { /* Company object */ }
}
```

**Validation Error Response (422)**:
```json
{
  "success": false,
  "message": "Validation failed",
  "data": { "companyName": "Company name is required" }
}
```

### Frontend → Backend: Upload Document

```
POST /api/v1/company/documents
Content-Type: multipart/form-data
Authorization: Bearer {jwt}
```

**Payload**:
```
Part: documentType → "GST_CERTIFICATE"
Part: file → File(pdf)
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": 1,
    "documentType": "GST_CERTIFICATE",
    "fileName": "gst_certificate_2024.pdf",
    "originalName": "GST_Cert_2024.pdf",
    "filePath": "uploads/documents/company/gst_certificate_2024.pdf",
    "fileSize": 245760,
    "contentType": "application/pdf",
    "uploadedAt": "2024-06-15T10:35:00"
  }
}
```

### Frontend → Backend: Delete Document

```
DELETE /api/v1/company/documents/{id}
Authorization: Bearer {jwt}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Document deleted successfully",
  "data": null
}
```

### Frontend → Backend: Get Documents

```
GET /api/v1/company/documents
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
      "documentType": "GST_CERTIFICATE",
      "fileName": "gst_certificate_2024.pdf",
      "originalName": "GST_Cert_2024.pdf",
      "fileSize": 245760,
      "contentType": "application/pdf",
      "uploadedAt": "2024-06-15T10:35:00"
    }
  ]
}
```

---

## Cleanup Inventory

| Resource | Created at step | Destroyed by | Destroy method |
|---|---|---|---|
| Logo file on disk | STEP 4a save | Next logo upload (overwrites) OR manual deletion (not supported) | File system delete |
| Company database record | STEP 4 | Never deleted (singleton, only updated) | — |
| Legal document file on disk | SUB-STEP 4b | Document delete action | `DELETE /api/v1/company/documents/{id}` |
| Legal document DB record | SUB-STEP 4b | Document delete action | `DELETE /api/v1/company/documents/{id}` |

---

## Reality Checker Findings

| # | Finding | Severity | Spec section affected | Resolution |
|---|---|---|---|---|
| RC-1 | CompanyController + CompanyService both IMPLEMENTED in backend | Info | All handoff contracts | Verified — all endpoints exist ✅ |
| RC-2 | Backend PUT endpoint uses `consumes = MediaType.MULTIPART_FORM_DATA_VALUE` — JSON-only saves will fail (415) | **Critical** | STEP 4 Save | Frontend sends JSON when no logo; backend expects multipart always. GAP: Backend needs to also accept `application/json`, or frontend must always send multipart. |
| RC-3 | Company uses `app.company.upload-dir` (separate config from employee photos) | Low | Prerequisites | ✅ Separate `uploads/company` dir |
| RC-4 | Logo file saved with incrementing counter instead of overwriting: `logo.ext`, `logo_1.ext`, `logo_2.ext` | Low | SUB-STEP 4a | Orphaned old logo files accumulate on disk |
| RC-5 | Backend auto-creates default company with name "My Company" if none exists | Info | STEP 1 (404) | No "first time setup" empty state — always returns a company |
| RC-6 | `CompanyDTO.toEntity()` does NOT copy `signaturePath`, `logoPath` — these fields are lost on save | Medium | STEP 4 | Update DTO mapper to preserve both fields |
| RC-7 | `CompanyDTO.toEntity()` does NOT copy `id`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy` | Info | STEP 4 | Acceptable — these are managed by JPA/Hibernate |

---

## Test Cases

| Test | Trigger | Expected behavior |
|---|---|---|
| TC-01: First-time company setup | Navigate to `/admin/company` with empty DB | Empty form, no logo, no documents |
| TC-02: Save company with all fields | Fill all fields, click Save | 200 response, form shows saved data, toast |
| TC-03: Save company with only required fields | Fill company name only, click Save | 200 response, other fields null/empty |
| TC-04: Save company without name | Try to save with empty company name | Client-side validation blocks; or 422 response |
| TC-05: Upload logo | Select valid image file, save company | Logo preview updates, logoPath returned |
| TC-06: Upload invalid logo format | Select .exe file | Toast: "Only image files are accepted" |
| TC-07: Upload logo >2MB | Select large image | Toast: "Logo must be under 2MB" |
| TC-08: Upload legal document | Select document type + file, click Upload | Document appears in table |
| TC-09: Upload document without type | Attempt upload without selecting type | Modal validation: "Please select document type" |
| TC-10: Delete legal document | Click delete icon on document row | Confirmation dialog, then removed from table |
| TC-11: Edit company details | Modify fields, re-save | Updated data persists, toast confirms |
| TC-12: Re-upload logo (replace) | Upload new logo on existing company | Old logo replaced, new logoPath saved |
| TC-13: Server error on save | Simulate backend failure | Form remains editable, error toast shown |
| TC-14: Concurrent save | Two admins save simultaneously | Last write wins (no locking — acceptable for singleton) |

---

## Assumptions

| # | Assumption | Where verified | Risk if wrong |
|---|---|---|---|
| A1 | Company is singleton — `getCompany()` uses `findById(1L)` always | Verified in `CompanyService.getCompany()` | Linked to ID=1 — works only if first record gets ID=1 |
| A2 | Logo path is served via static resource mapping or direct path | Verified — `getLogo()` serves directly via `FileSystemResource` | ✅ No need for static mapping |
| A3 | Company upload dir is `app.company.upload-dir:uploads/company` | Verified in `CompanyService` | ✅ Separate from employee photos |
| A4 | Documents stored in `{uploadDir}/documents/` subfolder | Verified in `CompanyService.uploadDocument()` | ✅ `uploads/company/documents/` |
| A5 | `CompanyDTO.toEntity()` drops `signaturePath` and `logoPath` | Verified in code — not mapped | If frontend sends a DTO without these fields, they are reset to null on save |

---

## Open Questions

1. **Content-Type mismatch (RC-2)**: Backend PUT requires multipart, frontend sends JSON when no logo. This needs to be resolved — either backend adds `application/json` consumer or frontend always sends multipart.
2. **Logo validation**: Backend currently accepts any file type for logo. Should it restrict to `image/jpeg`, `image/png` only? Current employee photo rules do this.
3. **`CompanyDTO.toEntity()` mismatch**: The mapper doesn't carry `logoPath`, `signaturePath`, `id` — these fields will be lost if the DTO is round-tripped. This works because `getCompany()` returns the entity, the DTO is built from it, and on save the service loads the existing entity first — so the fields are preserved from the DB entity, not from the DTO. But if the DTO is used to construct a new entity, these fields are dropped.

---

## Spec vs Reality Audit Log

| Date | Finding | Action taken |
|---|---|---|
| 2026-05-24 | Initial spec created — based on code reading | Verified backend is already implemented ✅ |
| 2026-05-24 | Discovered critical content-type mismatch (RC-2) | Flagged as bug: backend requires multipart, frontend sends JSON |
| 2026-05-24 | Discovered `CompanyDTO.toEntity()` drops `signaturePath` and `logoPath` | Flagged as bug: fields would be reset on save |
| 2026-05-24 | Discovered default company "My Company" auto-created | Added to spec — no "first setup" empty state exists |
