# WORKFLOW: Document Generation & Download

**Version:** 0.1  
**Date:** 2026-05-24  
**Author:** Workflow Architect  
**Status:** Draft  
**Implements:** Document Template & Company Setup Module

---

## Overview

The Document Generation & Download workflow enables an Admin to select an employee, choose an active document template, preview the filled document (with placeholders replaced by actual data), and download the final document as a PDF. Every download is logged for audit and reporting purposes with the current financial year.

---

## Actors

| Actor | Role in this workflow |
|---|---|
| Admin | Selects employee, triggers generation, previews, downloads |
| DocumentTemplateService | `DocumentTemplateService.java` — Placeholder resolution + download logging ✅ IMPLEMENTED |
| CompanyService | `CompanyService.java` — Provides company data for placeholders ✅ IMPLEMENTED |
| EmployeeService (existing) | Provides employee data for placeholders ✅ EXISTING |
| TemplateEngine | `TemplateEngine.java` — Regex-based placeholder replacement ✅ IMPLEMENTED |
| TemplatePlaceholderResolver | `TemplatePlaceholderResolver.java` — Builds employee+company values map ✅ IMPLEMENTED |
| DocumentDownloadLogRepository | Logs download events ✅ IMPLEMENTED |

---

## Prerequisites

- Admin user authenticated with `ROLE_ADMIN`
- At least one active `DocumentTemplate` exists
- Employee record exists (with whatever fields are needed for placeholders)
- Company setup is complete (company name for `{{company_name}}`, etc.)
- PDF generation library is available in the classpath (recommend: Flying Saucer + iText for HTML-to-PDF, or Apache PDFBox for text-to-PDF)

---

## Trigger

Admin navigates to an employee's page (`/admin/employees/{id}`) and clicks the "Documents" or "Generate" tab/button.

---

## Workflow Tree

### STEP 1: Load Employee & Available Templates

**Actor**: Frontend → Backend  
**Action**: On page init, fetch employee details AND list of active templates  
**Timeout**: 15s  
**Inputs**:
  - `GET /api/v1/employees/{employeeId}` (existing)
  - `GET /api/v1/document-templates?active=true&page=0&size=100` (all active templates)

**Output on SUCCESS**: Employee data + active templates list → render "Generate Document" UI  
**Output on FAILURE**:
  - `FAILURE(employee_not_found)`: 404 → "Employee not found" error + back button
  - `FAILURE(template_load_error)`: 500 → toast "Failed to load templates" → retry
  - `FAILURE(timeout)`: retry x2 → error state

**Observable states**:
  - Customer sees: Employee info card + template selection dropdown + Generate/Preview buttons
  - Empty state (no templates): "No active templates available. Please create a template first." + link to template management
  - Loading: Skeleton for employee card + template dropdown
  - Logs: `[DocumentTemplateService] Loading active templates for employee {id}`

### STEP 2: Select Template & Choose Action

**Actor**: Admin  
**Action**: Select a template from dropdown, then choose:
  - **Preview** → GO TO STEP 3 (Preview)
  - **Generate & Download** → GO TO STEP 4 (Generate + Download)

**Template Dropdown**:
  - Lists only active templates (`isActive=true`)
  - Shows: Template name + Type (tag)
  - Sorted alphabetically by name
  - Default: first template selected (if any)

**Edge case: No active templates** → Both buttons disabled, info message shown.

### STEP 3: Preview Filled Document

**Actor**: Frontend → Backend  
**Action**: Trigger placeholder replacement and return rendered HTML preview  
**Timeout**: 20s  
**Input**: `GET /api/v1/document-templates/preview/{templateId}?employeeId={id}`

**Backend Logic**:
  1. Fetch `DocumentTemplate` by ID (verify it exists)
  2. Fetch `Employee` by ID (verify it exists)
  3. Fetch `Company` singleton (for company placeholders)
  4. For each `{{placeholder}}` in template content, resolve with actual data:
     - **Employee placeholders**: Map from `Employee` entity fields
     - **Company placeholders**: Map from `Company` entity fields
     - **System placeholders**: Compute at generation time
       - `{{current_date}}` → `LocalDate.now().toString()`
       - `{{financial_year}}` → computed from today's date (see Download Tracking spec for logic)
       - `{{authorized_signatory}}` → company field
     - `{{company_logo}}` → replaced with an `<img>` tag pointing to logo URL (only for HTML preview)
  5. Return the resolved HTML string

**Placeholder Resolution Table**:

| Placeholder | Source | Field mapping |
|---|---|---|
| `{{employee_name}}` | Employee | `prefix + " " + firstName + " " + surname` |
| `{{employee_code}}` | Employee | `employeeCode` |
| `{{designation}}` | Employee | `designation` |
| `{{doj}}` | Employee | `doj` (formatted) |
| `{{doe}}` | Employee | `doe` (formatted) |
| `{{gender}}` | Employee | `gender` |
| `{{address}}` | Employee | `presentAddress` |
| `{{mobile}}` | Employee | `mobile` |
| `{{email}}` | Employee | `email` |
| `{{company_name}}` | Company | `companyName` |
| `{{company_address}}` | Company | `address` |
| `{{company_logo}}` | Company | Replaced with inline base64 image or `<img>` tag linking to logo |
| `{{company_gst}}` | Company | `gstNumber` |
| `{{company_pan}}` | Company | `panNumber` |
| `{{company_cin}}` | Company | `cinNumber` |
| `{{current_date}}` | System | `LocalDate.now()` formatted as "dd MMM yyyy" |
| `{{financial_year}}` | System | e.g., "2025-2026" |
| `{{authorized_signatory}}` | Company | `authorizedSignatory` |

**Output on SUCCESS**: HTML string → rendered in preview panel (safe innerHTML or sandboxed iframe) → GO TO STEP 3a  
**Output on FAILURE**:
  - `FAILURE(template_not_found)`: 404 → toast "Template not found or has been deactivated"
  - `FAILURE(employee_not_found)`: 404 → toast "Employee not found"
  - `FAILURE(missing_company)`: 400 → toast "Company not set up. Please configure company details first."
  - `FAILURE(missing_data)`: Some placeholders unresolvable → fill with `[N/A]` + warning icon in preview + toast "Some employee data is missing: DOJ"
  - `FAILURE(timeout)`: retry x2 → toast "Preview generation timed out"

**Observable states**:
  - Customer sees: Loading spinner on preview panel → rendered document HTML
  - Warning state: Yellow banner "Missing data: Date of Joining is not available for this employee"
  - Operator sees: Panel with "Preview" title, scrollable content area

### STEP 3a: Preview Adjustments

**Actor**: Admin  
**Action**: Review the previewed document. Options:
  - **Adjust data**: Edit the employee record if data is missing, then re-preview (goes back to STEP 3)
  - **Download as PDF**: → STEP 4
  - **Download as DOCX**: (optional, v2) → extend format parameter
  - **Go back**: Return to template selection

### STEP 4: Generate & Download Document

**Actor**: Admin  
**Action**: Click "Download as PDF" (from preview) or "Generate & Download" (from template selection)  
**Timeout**: 30s  
**Input**: `POST /api/v1/document-templates/{templateId}/generate/{employeeId}?format=pdf`

**Backend Logic**:
  1. Validates template is active (throws `BadRequestException` if not)
  2. Resolves all placeholders (same logic as STEP 3)
  3. Wraps resolved content with A4 print-friendly HTML/CSS
  4. Creates a `DocumentDownloadLog` record in database (see recording logic below)
  5. Returns the filled HTML string (NOT a PDF binary — frontend handles printing)

**Key Reality Check**: Backend DOES NOT generate PDF. It returns HTML with print styles. The `format` parameter is accepted but not used for conversion — the response always contains HTML. The frontend must call `window.print()` or use a client-side PDF library (jsPDF, html2pdf.js) to convert to PDF.

**Filename**: The file is not generated server-side; the frontend should construct the filename: `{templateType}_{employeeCode}_{date}.pdf`

**Download Log Recording** (actual implementation in `DocumentTemplateService.generateAndLogDocument()`):
```java
String financialYear = calculateFinancialYear();
DocumentDownloadLog logEntry = DocumentDownloadLog.builder()
    .employeeId(employeeId)
    .templateId(templateId)
    .financialYear(financialYear)
    .downloadedAt(LocalDateTime.now())
    .downloadedBy(downloadedBy)
    .build();
downloadLogRepository.save(logEntry);
```

**Note**: Actual `DocumentDownloadLog` entity has FEWER fields than the spec proposed:
- Has: `id, employeeId, templateId, financialYear, downloadedAt, downloadedBy`
- Missing: `employeeCode, employeeName, templateName, templateType, format`
- No `@PrePersist` needed in the entity — it has one that sets `downloadedAt`, but service also sets it explicitly (safe double-set)

**Financial Year Computation**:
```
Input: LocalDate (today)
Logic: IF month >= 4 (APR) THEN financialYear = year + "-" + (year+1)
       ELSE financialYear = (year-1) + "-" + year
Example: 15-May-2026 → "2026-2027"
Example: 15-Mar-2026 → "2025-2026"
```

**Output on SUCCESS**: PDF file binary → browser downloads file → toast "Document downloaded"  
**Output on FAILURE**:
  - `FAILURE(template_not_found)`: 404 → toast
  - `FAILURE(employee_not_found)`: 404 → toast
  - `FAILURE(missing_company)`: 400 → toast "Company setup required for document generation"
  - `FAILURE(pdf_generation_error)`: 500 → toast "Failed to generate PDF" + retry
  - `FAILURE(timeout)`: retry x2 with 10s backoff → toast "Document generation timed out. Try again."
  - `FAILURE(placeholder_unresolvable)`: 400 → toast "Cannot generate: missing required data ({{doj}})" — list unresolvable placeholders in error

**Observable states during this step**:
  - Customer sees: Loading spinner on download button "Generating document..."
  - Download starts: Browser file save dialog for PDF
  - Error: Error toast + button re-enabled for retry
  - Database: New `download_logs` row inserted
  - Logs: `[DocumentTemplateService] Document generated: {templateName} for {employeeCode} — format=pdf`

---

## Edge Cases

### EC-1: Employee has no DOJ (Date of Joining)
- Placeholder `{{doj}}` → resolved to `[Not Available]`
- Warning banner in preview: "Date of Joining is not available for this employee"
- On download: PDF shows "[Not Available]" in the generated document
- Admin can still download, but warned

### EC-2: Company not set up (no logo, no name)
- All `{{company_*}}` placeholders unresolvable → preview shows `[Company Not Configured]`
- Download is blocked: backend returns 400 "Company setup required for document generation"
- UI shows error + "Go to Company Setup" link

### EC-3: Template with unused placeholders
- Template has `{{some_old_field}}` that no longer exists in the data model
- Backend logs a warning but does NOT fail: leaves `{{some_old_field}}` as-is in output
- Preview shows the literal `{{some_old_field}}` — admin can see it's unresolved
- Downloads proceed with the literal placeholder in the document
- Recommendation: add a validation warning when saving a template with unknown placeholders

### EC-4: Template changed after document generated
- Historical download logs still reference template ID but NOT the content snapshot
- If the template is later edited, regenerating the document uses the NEW content
- This is acceptable behavior — no versioning in v1

### EC-5: Employee deleted (soft) after template created
- Employee record has `isDeleted=true`
- Generation attempts → 404 "Employee not found"
- Download log does NOT record (generation failed before log)

### EC-6: Network failure mid-download
- Browser starts downloading PDF stream
- Network drops mid-stream → partial download
- DownloadLog was ALREADY recorded (recorded before streaming)
- Admin re-downloads → new DownloadLog record (duplicate download is intentional — tracking counts)
- No cleanup needed for the partial download

---

## Handoff Contracts

### Frontend → Backend: Preview Document

```
GET /api/v1/document-templates/preview/{templateId}?employeeId=123
Authorization: Bearer {jwt}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Success",
  "data": "<html><body><p>This is to certify that <b>Mr. John Doe</b>...</p></body></html>"
}
```

**Warning Response (200 — with missing data notice)**:
```json
{
  "success": true,
  "message": "Success",
  "data": "<html>...{{doj}}...[Not Available]...</html>"
}
```
Note: Warnings about missing data should be communicated via response headers or separate field. Recommend a `warnings` field in the response:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "html": "<html>...</html>",
    "warnings": [
      {
        "placeholder": "doj",
        "message": "Date of Joining is not available for this employee"
      }
    ],
    "unresolvedPlaceholders": ["doj"]
  }
}
```

### Frontend → Backend: Generate Document

```
POST /api/v1/document-templates/{templateId}/generate/{employeeId}?format=pdf
Authorization: Bearer {jwt}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Document generated successfully",
  "data": {
    "html": "<!DOCTYPE html><html lang=\"en\"><head>...</head><body>...</body></html>",
    "format": "pdf",
    "message": "Document generated successfully. Use window.print() or a PDF library to convert to PDF."
  }
}
```

**Note**: Response contains HTML, not PDF. Frontend must handle PDF conversion via `window.print()` or a client-side library (html2pdf.js, jsPDF).

**Error Response (400 — template inactive)**:
```json
{
  "success": false,
  "message": "Template is not active: Experience Letter"
}
```

**Error Response (404)**:
```json
{
  "success": false,
  "message": "Document template not found with id: 999"
}
```

### Frontend → Backend: Preview Document

```
GET /api/v1/document-templates/preview/{templateId}?employeeId=123
Authorization: Bearer {jwt}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Success",
  "data": "<!DOCTYPE html><html lang=\"en\"><head>...</head><body>...</body></html>"
}
```

**Note**: Preview does NOT log a download. It only renders and returns the filled HTML. The `POST generate` endpoint returns the same HTML but also logs.

---

## Cleanup Inventory

| Resource | Created at step | Destroyed by | Destroy method |
|---|---|---|---|
| PDF file in temp/memory | STEP 4 | After HTTP response sent | Garbage collected (not persisted to disk unless caching enabled) |
| DownloadLog DB record | STEP 4 | Never deleted (append-only audit log) | — |

**Note**: PDFs are generated on-the-fly and streamed to the client. They are NOT persisted on the server filesystem (unless caching is implemented in v2). Each download re-generates the PDF.

---

## Reality Checker Findings

| # | Finding | Severity | Spec section affected | Resolution |
|---|---|---|---|---|
| RC-1 | Backend IS fully implemented — preview + generate both exist ✅ | Info | All steps | Verified — `previewDocument()` and `generateAndLogDocument()` in service |
| RC-2 | `DocumentDownloadLog` entity + repository exist ✅ | Info | STEP 4 | Entity has fewer fields than spec (no employeeCode, templateName, format) |
| RC-3 | Backend generates HTML, NOT PDF | **Critical** | STEP 4, Handoff contracts | Frontend must handle PDF conversion. Frontend's `generateDocument()` currently expects `Blob` but backend returns JSON |
| RC-4 | Frontend `generateDocument()` uses `GET` with `responseType: 'blob'` | **Critical** | Handoff contracts | REALITY: Backend `generate` is `POST` returning JSON (HTML). Frontend uses `GET` expecting `Blob` — **MISMATCH** |
| RC-5 | Frontend `previewTemplate()` uses `GET` and expects `APIResponse<string>` | Info | Handoff contracts | ✅ MATCHES backend's `GET /preview/{id}` returning HTML string |
| RC-6 | No `{{company_logo}}` placeholder in `TemplatePlaceholderResolver` | Medium | STEP 3 | PlaceholderResolver does NOT include company logo — it would be left unresolved |
| RC-7 | No `{{financial_year}}` placeholder in `TemplatePlaceholderResolver` | Medium | STEP 3 | Financial year is only computed for download logging, NOT available as template placeholder |
| RC-8 | `TemplatePlaceholderResolver` has additional fields not in spec: `department`, `first_name`, `surname`, `dob`, `bank_name`, `account_number`, `ifsc_code`, `pan_number_employee`, `aadhar_number`, `uan_no`, `pf_no`, `esic_no`, `employee_status`, `company_phone`, `company_email`, `company_website`, `company_tan`, `company_registration`, `current_year` | Info | Placeholder Reference | ✅ More comprehensive than the spec placeholder list |
| RC-9 | Generate endpoint requires template to be active | Info | STEP 4 | ✅ Verified — throws `BadRequestException` if inactive |
| RC-10 | `format` parameter accepted but ignored — always returns HTML | Medium | STEP 4 | Backend accepts format param but doesn't use it for conversion |

---

## Test Cases

| Test | Trigger | Expected behavior |
|---|---|---|
| TC-01: Generate PDF — happy path | Valid employee, active template, all data present | PDF downloaded, download log recorded |
| TC-02: Preview filled document | Valid employee, active template | HTML returned with all placeholders resolved |
| TC-03: Preview with missing employee DOJ | Employee has no DOJ, template uses `{{doj}}` | Preview shows "[Not Available]", warning returned |
| TC-04: Generate with missing company | Company not set up | 400 error: "Company setup required" |
| TC-05: Generate with deactivated template | Template is inactive | Template not in dropdown (not selectable) |
| TC-06: Generate with deleted employee | Employee soft-deleted | 404 error |
| TC-07: Generate with non-existent template ID | Template ID doesn't exist | 404 error |
| TC-08: Download log recorded correctly | After successful download | DB has row with employeeId, templateId, financialYear, downloadedAt |
| TC-09: Financial year computation in April | Generate on 15-Apr-2026 | financialYear = "2026-2027" |
| TC-10: Financial year computation in March | Generate on 15-Mar-2026 | financialYear = "2025-2026" |
| TC-11: Preview with `{{company_logo}}` | Company has logo uploaded | Preview includes logo image |
| TC-12: Generate with unused placeholder | Template has `{{obsolete_field}}` not in data | Placeholder left verbatim in output |
| TC-13: No active templates | All templates inactive | Dropdown empty, buttons disabled |
| TC-14: Multiple template types in dropdown | 5 active templates of different types | All shown, sorted alphabetically |

---

## Assumptions

| # | Assumption | Where verified | Risk if wrong |
|---|---|---|---|
| A1 | PDFs are generated on-the-fly, not cached on server | Design decision | Performance: every download = full regeneration |
| A2 | `{{company_logo}}` is embedded as base64 in HTML for PDF rendering | Not verified — Flying Saucer supports `img src="data:..."` | Logo may not render in PDF |
| A3 | Employee data for placeholders comes from existing `EmployeeService.getEmployeeById()` | Verified in code | Employee DTO has all fields needed |
| A4 | Company data for placeholders comes from `CompanyService.getCompany()` | Not yet implemented | Placeholder resolution fails without it |
| A5 | DownloadLog references Employee by `employeeId` + `employeeCode` (not FK) | Design decision | If employee is deleted, log still has employeeCode for reference |

---

## Open Questions

1. **PDF format**: What library for HTML-to-PDF conversion? Recommend:
   - **Flying Saucer** (`org.xhtmlrenderer`) + iText — best for HTML → PDF with CSS support
   - **Apache PDFBox** — lower-level, for programmatic PDF construction
   - **wkhtmltopdf** — requires system binary, harder to deploy
   - Recommendation: Flying Saucer + OpenPDF (LGPL licensed fork of iText)

2. **DOCX support**: Should DOCX generation be supported in v1? Current design supports `format=pdf` only with `format=docx` as a future extension point.

3. **Async generation**: Should large documents be generated asynchronously with polling? Not needed for v1 — employee documents are typically 1-3 pages, generated in <5s.

4. **Download deduplication**: If admin downloads the same document twice in 5 minutes, should we block or deduplicate? No — each download is a separate event. The tracking log tracks ALL downloads.

---

## Spec vs Reality Audit Log

| Date | Finding | Action taken |
|---|---|---|
| 2026-05-24 | Initial spec created — no backend implementation | Opened issue: Implement document generation service |
| 2026-05-24 | PDF library missing from pom.xml | Opened issue: Add Flying Saucer + OpenPDF dependency |
| 2026-05-24 | DownloadLog entity not created | Opened issue: Create DownloadLog entity + repository |
