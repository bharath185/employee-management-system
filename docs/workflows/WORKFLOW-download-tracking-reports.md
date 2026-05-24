# WORKFLOW: Download Tracking & Reports

**Version:** 0.1  
**Date:** 2026-05-24  
**Author:** Workflow Architect  
**Status:** Draft  
**Implements:** Document Template & Company Setup Module

---

## Overview

The Download Tracking & Reports workflow manages the audit trail of all document downloads. Every time a document is generated and downloaded, a `DownloadLog` record is created with the employee, template, timestamp, and computed financial year. The workflow provides query capabilities for reports — counts per employee, per template, per financial year — and feeds the Download Tracking dashboard/report page.

---

## Actors

| Actor | Role in this workflow |
|---|---|
| Admin | Views reports, filters logs, exports data |
| DocumentTemplateController | `DocumentTemplateController.java` — REST endpoints for logs + stats ✅ IMPLEMENTED (handled by `/download-logs` sub-routes) |
| DocumentTemplateService | `DocumentTemplateService.java` — Business logic, aggregation queries ✅ IMPLEMENTED |
| DocumentDownloadLogRepository | `DocumentDownloadLogRepository.java` — Data access for `document_download_logs` table ✅ IMPLEMENTED |
| Document Generation Workflow | Creates the `DocumentDownloadLog` records (write path) ✅ IMPLEMENTED |

---

## Prerequisites

- `download_logs` table exists in database
- Document Generation & Download workflow is implemented (writes the logs)
- Admin is authenticated with `ROLE_ADMIN`

---

## Trigger

Admin navigates to `/admin/reports/downloads` or clicks "Download Reports" in the Reports section.

---

## Entity: DocumentDownloadLog (Existing)

The entity already exists at `model/DocumentDownloadLog.java`:

```java
@Entity
@Table(name = "document_download_logs", indexes = {
    @Index(name = "idx_download_employee", columnList = "employee_id"),
    @Index(name = "idx_download_template", columnList = "template_id"),
    @Index(name = "idx_download_financial_year", columnList = "financial_year")
})
public class DocumentDownloadLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "template_id", nullable = false)
    private Long templateId;

    @Column(name = "financial_year", length = 20, nullable = false)
    private String financialYear; // "2025-2026"

    @Column(name = "downloaded_at", nullable = false)
    private LocalDateTime downloadedAt;

    @Column(name = "downloaded_by", length = 50)
    private String downloadedBy;
}
```

**Design Decision**: Minimal fields — only FK references (`employeeId`, `templateId`) and metadata. No denormalized names or format field. Queries join with Employee/Template tables for display names, or frontend handles display enrichment. No hard FK constraints to avoid issues with soft-deleted records. The `@PrePersist` annotation sets `downloadedAt` on creation.

**Key departures from the spec proposal**:
| Spec proposed field | Actual field | Status |
|---|---|---|
| `employeeCode` | ❌ Missing | Must JOIN with Employee table or frontend enriches |
| `employeeName` | ❌ Missing | Must JOIN with Employee table or frontend enriches |
| `templateName` | ❌ Missing | Must JOIN with Template table or frontend enriches |
| `templateType` | ❌ Missing | Must JOIN with Template table |
| `format` | ❌ Missing | Not tracked — always "pdf" (implied) |

---

## Workflow Tree

### STEP 1: Load Download Tracking Dashboard / Report Page

**Actor**: Frontend → Backend  
**Action**: Fetch aggregated stats and recent download logs  
**Timeout**: 15s

**Inputs** (parallel):
  - `GET /api/v1/document-templates/download-logs/stats` → summary statistics
  - `GET /api/v1/document-templates/download-logs?page=0&size=10&sort=downloadedAt,desc` → recent log entries
  - `GET /api/v1/document-templates/download-logs/financial-years` → list of available FYs for filter dropdown

**Output on SUCCESS**: Stats cards + recent logs table + FY filter options → render page  
**Output on FAILURE**:
  - `FAILURE(timeout)`: retry x2 → error state "Failed to load download reports"
  - `FAILURE(empty)`: No logs yet → empty state "No downloads recorded yet"

**Observable states**:
  - Customer sees:
    - **Stats row**: Total downloads (this FY), Most downloaded template, Most downloaded employee, Monthly trend chart
    - **Recent logs table**: Employee, Template, Type, Format, Downloaded At, Financial Year, Downloaded By
    - **Empty state**: "No documents have been downloaded yet. Downloads will appear here once you generate documents."
  - Loading: Skeleton for stats cards + skeleton table rows
  - Logs: `[DownloadLogService] Loading download stats`

### STEP 1a: Financial Year Filter

**Actor**: Backend  
**Action**: Compute available financial years from data (distinct `financial_year` values in DB)

The frontend populates a filter dropdown with the returned FYs. Default selection: current FY.

### STEP 2: Apply Filters

**Actor**: Admin  
**Action**: Select filter criteria and refresh the log table

**Available Filters**:

| Filter | Type | Source |
|---|---|---|
| Employee | Searchable dropdown | `GET /api/v1/employees?page=0&size=100` (id + name + code) |
| Template Type | Dropdown | `GET /api/v1/document-templates/types` |
| Template Name | Searchable dropdown | `GET /api/v1/document-templates?page=0&size=100` |
| Financial Year | Dropdown | `GET /api/v1/document-templates/download-logs/financial-years` |
| Date Range | Date range picker | Client-side or server-side filter |
| Format | Dropdown | PDF, DOCX, All |

**Timeout**: 15s  
**Input**: `GET /api/v1/document-templates/download-logs?employeeId=123&templateId=1&financialYear=2025-2026&page=0&size=10`

**Output on SUCCESS**: Filtered `DownloadLog` page → table updated  
**Output on FAILURE**:
  - `FAILURE(empty)`: No results match filters → empty state "No downloads match your filters"
  - `FAILURE(timeout)`: retry → toast

### STEP 3: View Employee-Level Download History

**Actor**: Admin  
**Action**: Click on an employee name in the logs table or navigate to employee-specific download history

**Input**: `GET /api/v1/document-templates/download-logs/employee/{employeeId}`

**Timeout**: 10s

**Output**: Full download history for that employee, sorted by most recent

This view can also be embedded in the employee detail page under a "Documents" tab showing:
- List of all downloads for this employee
- Per-template download count
- Per-financial-year download count

### STEP 3a: Employee Detail — Document Downloads Tab

On the employee view page (`/admin/employees/{id}`), a "Document Downloads" tab shows:

```
┌─────────────────────────────────────────────────────────────┐
│  Downloads for John Doe (EMP0001)                           │
│                                                             │
│  ┌──────┬──────────────┬──────────┬───────────┬────────────┐│
│  │ #    │ Template     │ Type     │ Downloaded │ FY         ││
│  ├──────┼──────────────┼──────────┼───────────┼────────────┤│
│  │ 1    │ Exp. Letter  │ PDF      │ 24-May-26 │ 2025-2026  ││
│  │ 2    │ Offer Letter │ PDF      │ 15-Apr-26 │ 2026-2027  ││
│  │ 3    │ ID Card      │ PDF      │ 01-Mar-26 │ 2025-2026  ││
│  └──────┴──────────────┴──────────┴───────────┴────────────┘│
│                                                             │
│  Total downloads for this employee: 3 (this FY: 1)          │
└─────────────────────────────────────────────────────────────┘
```

### STEP 4: Stats Aggregation

**Actor**: Backend  
**Action**: Aggregate download statistics from the log table

**Stats Endpoint**: `GET /api/v1/document-templates/download-logs/stats`

**Actual Implementation** in `DocumentTemplateService.getDownloadStats()`:
The stats endpoint returns three GROUP BY aggregates via the repository:

| Query | SQL | Returns |
|---|---|---|
| Per employee | `GROUP BY employee_id ORDER BY COUNT DESC` | `[{employeeId: 1, count: 10}, ...]` |
| Per template | `GROUP BY template_id ORDER BY COUNT DESC` | `[{templateId: 1, count: 15}, ...]` |
| Per financial year | `GROUP BY financial_year ORDER BY COUNT DESC` | `[{financialYear: "2025-2026", count: 25}, ...]` |

**Output** (actual `DownloadStatsDTO`):
```json
{
  "perEmployee": [
    { "employeeId": 1, "count": 10 },
    { "employeeId": 2, "count": 5 }
  ],
  "perTemplate": [
    { "templateId": 1, "count": 15 }
  ],
  "perFinancialYear": [
    { "financialYear": "2025-2026", "count": 20 },
    { "financialYear": "2026-2027", "count": 5 }
  ]
}
```

**Note**: The actual stats DTO differs significantly from the spec:
- ❌ No `totalDownloadsThisFY` summary
- ❌ No `mostDownloadedTemplate` or `mostDownloadedEmployee` computed field
- ❌ No `monthlyDownloads` trend data
- ✅ Returns raw per-employee, per-template, per-FY counts (frontend must compute display summaries)
- The `employeeId` and `templateId` are numeric — no names included (frontend must enrich)

**Timeout**: 10s  
**Output on FAILURE**:
  - `FAILURE(empty)`: Empty lists returned (no data)
  - `FAILURE(query_error)`: 500 → toast "Failed to load statistics"

### STEP 5: Export Download Logs

**Actor**: Admin  
**Action**: Click "Export" button to download log data as Excel/CSV  
**Timeout**: 30s  
**Input**: `GET /api/v1/document-templates/download-logs/export?financialYear=2025-2026`

**Output**: Excel/CSV file with columns: Employee Code, Employee Name, Template Name, Template Type, Format, Downloaded At, Financial Year, Downloaded By

---

## Financial Year Logic

The financial year in India runs from April 1 to March 31.

```java
public static String computeFinancialYear(LocalDate date) {
    int year = date.getYear();
    if (date.getMonthValue() >= 4) {
        // April to December: FY is year-year+1
        return year + "-" + (year + 1);
    } else {
        // January to March: FY is year-1-year
        return (year - 1) + "-" + year;
    }
}
```

**Examples**:
| Date | Financial Year |
|---|---|
| 01-Apr-2026 | 2026-2027 |
| 31-Mar-2026 | 2025-2026 |
| 15-Dec-2025 | 2025-2026 |
| 01-Jan-2026 | 2025-2026 |

---

## Handoff Contracts

### Frontend → Backend: Get Download Logs (Paginated)

```
GET /api/v1/document-templates/download-logs?page=0&size=10&sort=downloadedAt,desc
  &employeeId=123&templateId=1&financialYear=2025-2026
Authorization: Bearer {jwt}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "content": [
      {
        "id": 1,
        "employeeId": 123,
        "templateId": 1,
        "financialYear": "2025-2026",
        "downloadedAt": "2026-05-24T10:30:00",
        "downloadedBy": "admin"
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 156,
    "totalPages": 16,
    "first": true,
    "last": false
  }
}
```

**Note**: Actual `DocumentDownloadLogDTO` has FEWER fields than spec proposed:
- Has: `id, employeeId, templateId, financialYear, downloadedAt, downloadedBy`
- Missing: `employeeCode, employeeName, templateName, templateType, format`

Frontend must enrich display names by fetching associated Employee/Template data, or join queries must be added to the backend. The frontend `DownloadLog` model includes `employeeName`, `employeeCode`, `templateName`, `templateType`, `format` fields — these will all be `undefined` with current backend response. **FRONTEND-BACKEND MISMATCH.**

### Frontend → Backend: Get Stats

```
GET /api/v1/document-templates/download-logs/stats
Authorization: Bearer {jwt}
```

**Success Response (200)** — actual implementation:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "perEmployee": [
      { "employeeId": 1, "count": 10 },
      { "employeeId": 2, "count": 5 }
    ],
    "perTemplate": [
      { "templateId": 1, "count": 15 }
    ],
    "perFinancialYear": [
      { "financialYear": "2025-2026", "count": 20 }
    ]
  }
}
```

**Note**: Frontend `DownloadStats` model has `totalDownloadsThisFY`, `mostDownloadedTemplate`, `mostDownloadedEmployee`, `monthlyDownloads` — but backend returns `perEmployee`, `perTemplate`, `perFinancialYear`. **FRONTEND-BACKEND MISMATCH.** The frontend model needs to be updated to match the actual response shape.

### Frontend → Backend: Get Employee Logs

```
GET /api/v1/document-templates/download-logs/employee/{employeeId}
Authorization: Bearer {jwt}
```

**Success Response (200)** — actual:
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "employeeId": 123,
      "templateId": 1,
      "financialYear": "2025-2026",
      "downloadedAt": "2026-05-24T10:30:00",
      "downloadedBy": "admin"
    }
  ]
}
```

**Same field mismatch as paginated logs** — employeeCode, employeeName, templateName, templateType, format are NOT in the response.

### Frontend → Backend: Get Financial Years

```
GET /api/v1/document-templates/download-logs/financial-years
Authorization: Bearer {jwt}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Success",
  "data": ["2024-2025", "2025-2026", "2026-2027"]
}
```

### Frontend → Backend: Export Logs

```
GET /api/v1/document-templates/download-logs/export?financialYear=2025-2026
Authorization: Bearer {jwt}
```

**Success Response (200)**:
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="download_logs_2025-2026.xlsx"
```

---

## Cleanup Inventory

| Resource | Created at step | Destroyed by | Destroy method |
|---|---|---|---|
| DownloadLog DB records | Document Generation STEP 4 | Never deleted (append-only) | — |

**Retention policy**: Not needed for v1. Download logs are append-only and lightweight. If cleanup is needed in the future, it can be done via a scheduled job archiving logs older than N years.

---

## Reality Checker Findings

| # | Finding | Severity | Spec section affected | Resolution |
|---|---|---|---|---|
| RC-1 | `DocumentDownloadLog` entity EXISTS ✅ | Info | All steps | Table name: `document_download_logs` |
| RC-2 | `DocumentDownloadLogRepository` EXISTS ✅ | Info | All steps | Full query support |
| RC-3 | Backend download log endpoints exist ✅ | Info | All handoff contracts | All routes under `/document-templates/download-logs/` |
| RC-4 | Frontend `DownloadLog` model has FIELDS THAT DON'T EXIST in backend response | **Critical** | Handoff contracts | FRONTEND-BACKEND MISMATCH: `employeeCode`, `employeeName`, `templateName`, `templateType`, `format`, `downloadCount` are in frontend model but NOT in backend DTO |
| RC-5 | Frontend `DownloadStats` model differs completely from backend `DownloadStatsDTO` | **Critical** | STEP 4 | FRONTEND-BACKEND MISMATCH: Frontend expects `totalDownloadsThisFY` etc; backend returns `perEmployee`, `perTemplate`, `perFinancialYear` lists |
| RC-6 | Frontend `getDownloadLogs()` returns `PagedResponse<DownloadLog>` — backend matches ✅ | Info | Handoff contracts | ✅ Paginated response matches |
| RC-7 | Frontend `getEmployeeLogs()` returns `DownloadLog[]` — backend returns `List` ✅ | Info | Handoff contracts | ✅ Match |
| RC-8 | Frontend `getFinancialYears()` returns `string[]` — backend returns `List<String>` ✅ | Info | Handoff contracts | ✅ Match |
| RC-9 | Backend uses table name `document_download_logs` (not `download_logs`) | Low | Entity design | Consistent naming with existing `document_templates` table |
| RC-10 | No export endpoint in backend | Medium | STEP 5 | Not yet implemented — add export functionality |
| RC-11 | No route in UI for download reports | Medium | Trigger | Add to routes or reports section |

---

## Test Cases

| Test | Trigger | Expected behavior |
|---|---|---|
| TC-01: View download stats | Navigate to download reports | Stats cards show aggregated data |
| TC-02: View download logs table | Navigate to download reports | Paginated table with recent logs |
| TC-03: Empty state (no logs) | No downloads recorded | Empty state with info message |
| TC-04: Filter by employee | Select employee from filter | Table filters to that employee's downloads |
| TC-05: Filter by financial year | Select FY "2025-2026" | Only logs with that FY shown |
| TC-06: Filter by template | Select template | Only logs for that template shown |
| TC-07: Filter by date range | Pick date range | Logs within date range shown |
| TC-08: View employee download history | Click employee name | All logs for that employee |
| TC-09: Financial year computation | Check FY on current date | Correct FY based on Apr-Mar cycle |
| TC-10: Monthly trend chart | Stats loaded | Chart shows monthly counts |
| TC-11: Export logs | Click Export | Excel file downloaded |
| TC-12: Export with filters | Apply filter, then Export | Exported file respects filters |
| TC-13: Multiple filters combined | Employee + FY + template | AND logic applied |
| TC-14: No results after filtering | Filter criteria with no matches | Empty state "No downloads match your filters" |
| TC-15: Same employee downloads same template twice | Two separate download events | Two log records, count shows 2 |

---

## Assumptions

| # | Assumption | Where verified | Risk if wrong |
|---|---|---|---|
| A1 | `DocumentDownloadLog` is append-only — never updated or deleted | Verified in code — no update/delete methods in any path | If logs need correction, manual DB intervention needed |
| A2 | Financial year is computed server-side at write time | Verified in `DocumentTemplateService.calculateFinancialYear()` | ✅ Correct FY logic |
| A3 | Backend does NOT denormalize employee/template names — relies on JOIN enrichment | Verified — `DocumentDownloadLog` has no name fields | Frontend needs to enrich, or backend JOIN queries needed |
| A4 | Stats queries run on every request (no caching) | Verified — `getDownloadStats()` calls GROUP BY queries on every request | Acceptable for <100K rows |
| A5 | Table name is `document_download_logs` (not `download_logs`) | Verified in entity | Spec needs updating |

---

## Open Questions

1. **Report UI placement**: Should download tracking be a separate page (`/admin/reports/downloads`) or a tab within the employee view plus a standalone report? Recommend: both — employee-level in a tab, aggregated stats on a report page.
2. **Export format**: Excel only, or also CSV? Not yet implemented — recommend Excel (.xlsx) using Apache POI (already in classpath).
3. **Stats DTO redesign**: Current `DownloadStatsDTO` returns raw GROUP BY results. Should it be enhanced to include `totalDownloadsThisFY`, `mostDownloadedTemplate`, `monthlyTrend` as the frontend expects? Recommend: enhance the backend DTO.
4. **Log enrichment**: Current `DocumentDownloadLogDTO` lacks employee/template display names. Should backend JOIN to add these fields, or should frontend enrich? Recommend: backend JOIN for employeeCode + employeeName (simple) and templateName + templateType (simple).
5. **Data retention**: Should there be automatic purging of logs older than N years? Not needed in v1.

---

## Spec vs Reality Audit Log

| Date | Finding | Action taken |
|---|---|---|
| 2026-05-24 | Initial spec created — DownloadLog entity + repository + controller + service all missing | Opened issue: Implement download tracking backend |
| 2026-05-24 | Frontend DownloadTrackingService + models exist but no backend | Opened issue: Create all download-tracking endpoints matching frontend expectations |
