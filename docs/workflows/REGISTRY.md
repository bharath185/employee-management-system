# Workflow Registry — Employee Management System

> **Version:** 1.0  
> **Date:** 2026-05-24  
> **Author:** Workflow Architect  
> **Status:** Active

---

## View 1: By Workflow — Master List

| Workflow | Spec file | Status | Trigger | Primary actor | Last reviewed |
|---|---|---|---|---|---|---|
| Company Setup | WORKFLOW-company-setup.md | Review | Admin navigates to Company Setup page | Superadmin / Admin | 2026-05-24 |
| Document Template Lifecycle | WORKFLOW-document-template-lifecycle.md | Review | Admin navigates to Document Templates page | Admin | 2026-05-24 |
| Document Generation & Download | WORKFLOW-document-generation-download.md | Review | Admin clicks "Generate" on employee profile | Admin | 2026-05-24 |
| Download Tracking & Reports | WORKFLOW-download-tracking-reports.md | Review | Admin clicks Download Tracking report | Admin | 2026-05-24 |
| Employee document upload | WORKFLOW-employee-document-upload.md | Missing | Admin uploads employee document | Admin | — |
| Employee CRUD | WORKFLOW-employee-crud.md | Missing | Various | Admin | — |
| User authentication | WORKFLOW-user-auth.md | Missing | Login form submit | User | — |

**Status values:** `Approved` | `Review` | `Draft` | `Missing` | `Deprecated`

---

## View 2: By Component — Code to Workflows

| Component | File(s) | Workflows it participates in |
|---|---|---|---|
| CompanyController | `controller/CompanyController.java` ✅ | Company Setup |
| CompanyService | `service/CompanyService.java` ✅ | Company Setup |
| Company | `model/Company.java` ✅ | Company Setup |
| CompanyDocument | `model/CompanyDocument.java` ✅ | Company Setup |
| CompanyRepository | `repository/CompanyRepository.java` ✅ | Company Setup |
| CompanyDocumentRepository | `repository/CompanyDocumentRepository.java` ✅ | Company Setup |
| CompanyDTO | `dto/CompanyDTO.java` ✅ | Company Setup |
| CompanyDocumentDTO | `dto/CompanyDocumentDTO.java` ✅ | Company Setup |
| DocumentTemplateController | `controller/DocumentTemplateController.java` ✅ | Document Template Lifecycle, Document Generation & Download, Download Tracking & Reports |
| DocumentTemplateService | `service/DocumentTemplateService.java` ✅ | Document Template Lifecycle, Document Generation & Download, Download Tracking & Reports |
| DocumentTemplate | `model/DocumentTemplate.java` ✅ | Document Template Lifecycle, Document Generation & Download |
| DocumentTemplateRepository | `repository/DocumentTemplateRepository.java` ✅ | Document Template Lifecycle |
| DocumentTemplateDTO | `dto/DocumentTemplateDTO.java` ✅ | Document Template Lifecycle |
| DocumentDownloadLog | `model/DocumentDownloadLog.java` ✅ | Download Tracking & Reports |
| DocumentDownloadLogDTO | `dto/DocumentDownloadLogDTO.java` ✅ | Download Tracking & Reports |
| DocumentDownloadLogRepository | `repository/DocumentDownloadLogRepository.java` ✅ | Download Tracking & Reports |
| DownloadStatsDTO | `dto/DownloadStatsDTO.java` ✅ | Download Tracking & Reports |
| TemplateEngine | `utils/TemplateEngine.java` ✅ | Document Generation & Download |
| TemplatePlaceholderResolver | `utils/TemplatePlaceholderResolver.java` ✅ | Document Generation & Download |
| DocumentController (existing) | `controller/DocumentController.java` | Employee document upload (separate) |
| DocumentService (existing) | `service/DocumentService.java` | Employee document upload (separate) |
| CompanySetupComponent (UI) | `features/company/company-setup.component.ts` ✅ | Company Setup |
| CompanyService (UI) | `core/services/company.service.ts` ✅ | Company Setup |
| CompanyModel (UI) | `core/models/company.model.ts` ✅ | Company Setup |
| DocumentTemplateListComponent (UI) | `features/document-templates/document-template-list.component.ts` ✅ | Document Template Lifecycle |
| DocumentTemplateFormComponent (UI) | `features/document-templates/document-template-form.component.ts` ✅ | Document Template Lifecycle |
| TemplatePreviewModalComponent (UI) | `features/document-templates/template-preview-modal.component.ts` ✅ | Document Generation & Download |
| DocumentTemplateReportsComponent (UI) | `features/document-templates/document-template-reports.component.ts` ✅ | Download Tracking & Reports |
| DocumentTemplateService (UI) | `core/services/document-template.service.ts` ✅ | Document Template Lifecycle, Document Generation & Download |
| DocumentTemplateModel (UI) | `core/models/document-template.model.ts` ✅ | Document Template Lifecycle, Document Generation & Download |
| DownloadTrackingService (UI) | `core/services/download-tracking.service.ts` ✅ | Download Tracking & Reports |

---

## View 3: By User Journey — User-Facing to Workflows

### Admin Journeys

| What the admin experiences | Underlying workflow(s) | Entry point |
|---|---|---|
| Sets up company profile for the first time | Company Setup (first-time) | `/admin/company` |
| Edits company details, re-uploads logo | Company Setup (edit) | `/admin/company` |
| Uploads a legal document (GST cert, PAN, etc.) | Company Setup (document upload) | `/admin/company` |
| Creates a new document template with placeholders | Document Template Lifecycle (create) | `/admin/document-templates` |
| Edits an existing template | Document Template Lifecycle (edit) | `/admin/document-templates/:id` |
| Deactivates a template (hides from dropdowns) | Document Template Lifecycle (deactivate) | `/admin/document-templates/:id` |
| Deletes a template (soft delete) | Document Template Lifecycle (delete) | `/admin/document-templates` |
| Generates a document for an employee | Document Generation & Download (generate) | `/admin/employees/:id` → Generate tab |
| Previews a filled document before download | Document Generation & Download (preview) | `/admin/employees/:id` → Preview tab |
| Downloads a generated PDF | Document Generation & Download (download) | Preview → Download button |
| Views download statistics and logs | Download Tracking & Reports | `/admin/reports/downloads` |

### System-to-System Journeys

| What happens automatically | Underlying workflow(s) | Trigger |
|---|---|---|
| Financial year computed for download log | Document Generation & Download | Download action |
| Template variables extracted from content | Document Template Lifecycle | Template creation/update |

---

## View 4: By State — Entity State Transitions

### Company States

| State | Entered by | Exited by | Workflows that can trigger exit |
|---|---|---|---|
| not_setup | System default (no record) | Company Setup (first save) | Company Setup |
| active | Company Setup (save) | Company Setup (update) | Company Setup |

### DocumentTemplate States

| State | Entered by | Exited by | Workflows that can trigger exit |
|---|---|---|---|
| draft | Template creation (initial save) | Activate action | Document Template Lifecycle |
| active | Activate / initial save (isActive=true) | Deactivate action | Document Template Lifecycle |
| inactive (deactivated) | Deactivate action | Activate action | Document Template Lifecycle |
| archived (deleted) | Delete action (soft) | (terminal) | Document Template Lifecycle |

### DownloadLog States

| State | Entered by | Exited by |
|---|---|---|
| recorded | Download action completes | (never mutated — append-only) |

---

---

## Cross-Workflow Critical Findings

The following gaps were discovered during the Reality Checker pass (comparing spec against actual code):

### Critical (Production-Blocking):

| # | Finding | Affected Workflows | Root Cause | Action Needed |
|---|---|---|---|---|
| C1 | **Company Save: Content-Type Mismatch** — Backend `PUT /company` requires `multipart/form-data` always, but frontend sends `application/json` when no logo is attached | Company Setup | `@PutMapping(consumes = MULTIPART_FORM_DATA_VALUE)` vs frontend `updateCompany()` sends JSON-only for logo-less saves | Either: (a) backend adds `consumes = APPLICATION_JSON_VALUE` or (b) frontend always sends multipart |
| C2 | **Template List: Pagination Mismatch** — Frontend expects `PagedResponse<DocumentTemplate>`, backend returns `List<DocumentTemplateDTO>` | Document Template Lifecycle | Frontend service typed to `PagedResponse`, backend controller returns un-paginated list | Either: (a) backend paginates or (b) frontend unwraps list response |
| C3 | **Document Generate: Response Type Mismatch** — Frontend `generateDocument()` uses `GET` with `responseType: 'blob'` expecting PDF binary, backend uses `POST` returning JSON with HTML string | Document Generation & Download | Frontend assumes server-side PDF generation, backend returns HTML for client-side printing | Fix frontend to call `POST` and handle HTML response + client-side PDF conversion |
| C4 | **Download Log DTO: Missing Fields** — Frontend `DownloadLog` model has 11 fields (`employeeCode`, `employeeName`, `templateName`, `templateType`, `format`, `downloadCount`), backend `DocumentDownloadLogDTO` has only 5 fields (`id`, `employeeId`, `templateId`, `financialYear`, `downloadedAt`, `downloadedBy`) | Download Tracking & Reports | Backend entity is minimal, frontend model is enriched | Either: (a) backend adds JOINs to enrich DTO or (b) frontend reduces model expectations |
| C5 | **Download Stats: Full Model Mismatch** — Frontend `DownloadStats` has `totalDownloadsThisFY`, `mostDownloadedTemplate`, `mostDownloadedEmployee`, `monthlyDownloads`. Backend `DownloadStatsDTO` has `perEmployee`, `perTemplate`, `perFinancialYear` lists. Both schemas are completely different. | Download Tracking & Reports | Backend returns raw GROUP BY counts, frontend expects computed summaries + monthly trends | Redesign one side to match the other |
| C6 | **Template Field: `active` vs `isActive`** — Frontend `DocumentTemplate` model uses `active`, backend DTO uses `isActive` | Document Template Lifecycle | Jackson serialization: `isActive` getter serializes as `isActive` in JSON | Jackson will actually serialize `isActive` boolean as `active` (Java bean convention strips `is` prefix). **Verify this** — if Jackson serializes as `active`, frontend matches; if as `isActive`, frontend breaks. |

### High Priority:

| # | Finding | Affected Workflows | Action Needed |
|---|---|---|---|
| H1 | No route in `app.routes.ts` for `/admin/document-templates` or `/admin/company` | Company Setup, Document Template Lifecycle | Add lazy-loaded routes for both modules |
| H2 | `{{company_logo}}` and `{{financial_year}}` placeholders not in `TemplatePlaceholderResolver` | Document Generation & Download | Add these two placeholders to the resolver |
| H3 | Template list has no search parameter support (frontend sends `search`, backend ignores it) | Document Template Lifecycle | Add search filtering to backend query |
| H4 | No download log export endpoint | Download Tracking & Reports | Add export endpoint using Apache POI (already in classpath) |

---

## Registry Maintenance Log

| Date | Change | Author |
|---|---|---|
| 2026-05-24 | Initial registry created with 4 workflows | Workflow Architect |
| 2026-05-24 | Reality Checker pass completed — 6 critical mismatches found | Workflow Architect |
| 2026-05-24 | Specs updated from Draft → Review after reality verification | Workflow Architect |
