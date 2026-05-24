# Document Template & Company Setup Module — Architecture Document

> **Version**: 1.0
> **Status**: Accepted
> **Author**: Software Architect
> **Date**: 2026-05-24

---

## Table of Contents
1. [Domain Overview](#1-domain-overview)
2. [Data Models](#2-data-models)
3. [API Endpoints](#3-api-endpoints)
4. [File Structure](#4-file-structure)
5. [Integration Points](#5-integration-points)
6. [Security Matrix](#6-security-matrix)
7. [Document Generation Strategy](#7-document-generation-strategy)
8. [Download Tracking Logic](#8-download-tracking-logic)
9. [ADRs (Architecture Decision Records)](#9-adrs)
10. [Implementation Sequence](#10-implementation-sequence)

---

## 1. Domain Overview

### 1.1 Bounded Contexts

```
┌─────────────────────────────────────────────────────┐
│               Document Template Context              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Template     │  │ Placeholder  │  │ Download    │ │
│  │ Management   │  │ Resolution   │  │ Tracking    │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
└─────────┼─────────────────┼─────────────────┼───────┘
          │                 │                 │
┌─────────┼─────────────────┼─────────────────┼───────┐
│         ▼                 ▼                 ▼       │
│               Company Setup Context                  │
│  ┌──────────────────────────────────────────────┐   │
│  │  Company Profile (Singleton)                 │   │
│  │  Company Legal Documents                     │   │
│  │  Company Logo                                │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 1.2 Event Flow — Document Download

```
Admin clicks Download
        │
        ▼
[1] Fetch Template (by type + active status)
        │
        ▼
[2] Fetch Employee Data (by employeeId)
        │
        ▼
[3] Fetch Company Data (singleton)
        │
        ▼
[4] Resolve Placeholders
        │
        ▼
[5] Generate PDF (HTML → PDF conversion)
        │
        ▼
[6] Log Download (financial year tracking)
        │
        ▼
[7] Return PDF stream to browser
```

---

## 2. Data Models

### 2.1 Company Entity

**File:** `employee-management-api/src/main/java/com/ems/model/Company.java`

```java
package com.ems.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "company")
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ===== COMPANY PROFILE =====
    @Column(name = "company_name", length = 200, nullable = false)
    private String companyName;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "website", length = 200)
    private String website;

    @Column(name = "registration_number", length = 50)
    private String registrationNumber;

    @Column(name = "gst_number", length = 20)
    private String gstNumber;

    @Column(name = "pan_number", length = 20)
    private String panNumber;

    @Column(name = "tan_number", length = 20)
    private String tanNumber;

    @Column(name = "cin_number", length = 30)
    private String cinNumber;

    @Column(name = "incorporated_date")
    private LocalDate incorporatedDate;

    // ===== LOGO =====
    @Column(name = "logo_path", length = 255)
    private String logoPath;

    // ===== AUTHORIZED SIGNATORY =====
    @Column(name = "authorized_signatory", length = 100)
    private String authorizedSignatory;

    @Column(name = "signatory_designation", length = 100)
    private String signatoryDesignation;

    // ===== AUDIT FIELDS =====
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(name = "created_by", length = 20, updatable = false)
    private String createdBy;

    @LastModifiedBy
    @Column(name = "updated_by", length = 20)
    private String updatedBy;
}
```

**Table:** `company`
| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK | Auto-increment |
| company_name | VARCHAR(200) | NOT NULL |
| address | VARCHAR(500) | |
| phone | VARCHAR(20) | |
| email | VARCHAR(100) | |
| website | VARCHAR(200) | |
| registration_number | VARCHAR(50) | |
| gst_number | VARCHAR(20) | |
| pan_number | VARCHAR(20) | |
| tan_number | VARCHAR(20) | |
| cin_number | VARCHAR(30) | |
| incorporated_date | DATE | |
| logo_path | VARCHAR(255) | URL path like `/api/v1/company/logo` |
| authorized_signatory | VARCHAR(100) | Default signatory name |
| signatory_designation | VARCHAR(100) | e.g., "HR Manager" |
| created_at | DATETIME | |
| updated_at | DATETIME | |
| created_by | VARCHAR(20) | |
| updated_by | VARCHAR(20) | |

**Constraint:** Only one row allowed. Enforced at application layer + unique check on insert.

---

### 2.2 Company Document Entity

**File:** `employee-management-api/src/main/java/com/ems/model/CompanyDocument.java`

```java
package com.ems.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "company_documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "document_type", length = 50, nullable = false)
    private String documentType; // GST_CERTIFICATE, PAN_CARD, INCORPORATION_CERT, etc.

    @Column(name = "file_name", length = 200, nullable = false)
    private String fileName;

    @Column(name = "original_name", length = 200, nullable = false)
    private String originalName;

    @Column(name = "file_path", length = 500, nullable = false)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    @Column(name = "uploaded_by", length = 50)
    private String uploadedBy;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
    }
}
```

**Table:** `company_documents`
| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK | |
| company_id | BIGINT FK → company.id | |
| document_type | VARCHAR(50) | NOT NULL — `GST_CERTIFICATE`, `PAN_CARD`, `INCORPORATION_CERT` |
| file_name | VARCHAR(200) | |
| original_name | VARCHAR(200) | |
| file_path | VARCHAR(500) | |
| file_size | BIGINT | |
| content_type | VARCHAR(100) | |
| uploaded_at | DATETIME | |
| uploaded_by | VARCHAR(50) | |

---

### 2.3 DocumentTemplate Entity

**File:** `employee-management-api/src/main/java/com/ems/model/DocumentTemplate.java`

```java
package com.ems.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "document_templates", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"template_type", "template_name"})
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "template_type", length = 50, nullable = false)
    private String templateType; // JOINING_LETTER, RELIEVING_LETTER, OFFER_LETTER, etc.

    @Column(name = "template_name", length = 200, nullable = false)
    private String templateName; // User-friendly display name

    @Column(name = "description", length = 500)
    private String description;

    @Lob
    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content; // HTML with placeholders like {{employee_name}}

    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;

    @Builder.Default
    @Column(name = "is_default")
    private Boolean isDefault = false; // One default per template_type

    @Column(name = "version")
    @Builder.Default
    private Integer version = 1;

    // ===== AUDIT FIELDS =====
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(name = "created_by", length = 20, updatable = false)
    private String createdBy;

    @LastModifiedBy
    @Column(name = "updated_by", length = 20)
    private String updatedBy;
}
```

**Table:** `document_templates`
| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK | |
| template_type | VARCHAR(50) | NOT NULL — enum-like |
| template_name | VARCHAR(200) | NOT NULL, e.g. "Standard Joining Letter" |
| description | VARCHAR(500) | |
| content | TEXT | NOT NULL — HTML body with `{{placeholder}}` syntax |
| is_active | BIT/BOOLEAN | Default true |
| is_default | BIT/BOOLEAN | Default false, one per type |
| version | INT | Starts at 1, bumped on edit |
| created_at | DATETIME | |
| updated_at | DATETIME | |
| created_by | VARCHAR(20) | |
| updated_by | VARCHAR(20) | |

**Unique Constraint:** `(template_type, template_name)` — no duplicate names within same type.

---

### 2.4 DownloadLog Entity

**File:** `employee-management-api/src/main/java/com/ems/model/DownloadLog.java`

```java
package com.ems.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "download_logs", indexes = {
    @Index(name = "idx_dl_employee_template_fy", columnList = "employee_id, template_id, financial_year"),
    @Index(name = "idx_dl_downloaded_at", columnList = "downloaded_at"),
    @Index(name = "idx_dl_financial_year", columnList = "financial_year")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DownloadLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private DocumentTemplate template;

    @Column(name = "template_type", length = 50, nullable = false)
    private String templateType; // Denormalized for query performance

    @Column(name = "financial_year", length = 15, nullable = false)
    private String financialYear; // e.g. "2025-2026"

    @Column(name = "downloaded_at", nullable = false)
    private LocalDateTime downloadedAt;

    @Column(name = "downloaded_by", length = 50)
    private String downloadedBy; // Username of admin who downloaded

    @Column(name = "employee_code_at_time", length = 20)
    private String employeeCodeAtTime; // Snapshot for reporting

    @PrePersist
    protected void onCreate() {
        downloadedAt = LocalDateTime.now();
    }
}
```

**Table:** `download_logs`
| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK | |
| employee_id | BIGINT FK → employees.id | |
| template_id | BIGINT FK → document_templates.id | |
| template_type | VARCHAR(50) | Denormalized for fast group-by queries |
| financial_year | VARCHAR(15) | NOT NULL — e.g. "2025-2026" |
| downloaded_at | DATETIME | |
| downloaded_by | VARCHAR(50) | Which admin performed the download |
| employee_code_at_time | VARCHAR(20) | Snapshot for historical reporting |

---

## 3. API Endpoints

### 3.1 Company Setup Endpoints

Base path: `/api/v1/company`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/company` | ADMIN | Get company profile (singleton) |
| `PUT` | `/company` | ADMIN | Create or update company profile (upsert) |
| `POST` | `/company/logo` | ADMIN | Upload company logo |
| `GET` | `/company/logo` | All | Serve company logo image |
| `GET` | `/company/documents` | ADMIN | List company legal documents |
| `POST` | `/company/documents` | ADMIN | Upload company legal document (multipart) |
| `GET` | `/company/documents/{id}` | ADMIN | Download a company document |
| `DELETE` | `/company/documents/{id}` | ADMIN | Delete a company document |

**Controller:** `CompanyController.java`

```java
@RestController
@RequestMapping("/company")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping
    public ResponseEntity<APIResponse<CompanyDTO>> getCompany() { ... }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<CompanyDTO>> updateCompany(
            @Valid @RequestBody CompanyDTO dto,
            @AuthenticationPrincipal CustomUserDetails currentUser) { ... }

    @PostMapping("/logo")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<Map<String, Object>>> uploadLogo(
            @RequestParam("logo") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails currentUser) { ... }

    @GetMapping("/logo")
    public ResponseEntity<Resource> getLogo() { ... }

    @GetMapping("/documents")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<List<CompanyDocumentDTO>>> getDocuments() { ... }

    @PostMapping("/documents")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<CompanyDocumentDTO>> uploadDocument(
            @RequestParam("documentType") String documentType,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails currentUser) { ... }

    @GetMapping("/documents/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long id) { ... }

    @DeleteMapping("/documents/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<Void>> deleteDocument(@PathVariable Long id) { ... }
}
```

### 3.2 Document Template Endpoints

Base path: `/api/v1/templates`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/templates` | ADMIN | List all templates (filterable by type, active) |
| `GET` | `/templates/types` | ADMIN | List available template type enum values |
| `GET` | `/templates/{id}` | ADMIN | Get single template with content |
| `POST` | `/templates` | ADMIN | Create new template |
| `PUT` | `/templates/{id}` | ADMIN | Update template (bumps version) |
| `DELETE` | `/templates/{id}` | ADMIN | Soft-delete (set isActive=false) |
| `PATCH` | `/templates/{id}/default` | ADMIN | Set as default for its type |
| `POST` | `/templates/{id}/duplicate` | ADMIN | Clone a template |

**Controller:** `TemplateController.java`

```java
@RestController
@RequestMapping("/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final DocumentTemplateService templateService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<List<DocumentTemplateDTO>>> getTemplates(
            @RequestParam(required = false) String templateType,
            @RequestParam(required = false) Boolean isActive) { ... }

    @GetMapping("/types")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<List<String>>> getTemplateTypes() { ... }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<DocumentTemplateDTO>> getTemplate(@PathVariable Long id) { ... }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<DocumentTemplateDTO>> createTemplate(
            @Valid @RequestBody DocumentTemplateDTO dto,
            @AuthenticationPrincipal CustomUserDetails currentUser) { ... }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<DocumentTemplateDTO>> updateTemplate(
            @PathVariable Long id,
            @Valid @RequestBody DocumentTemplateDTO dto,
            @AuthenticationPrincipal CustomUserDetails currentUser) { ... }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<Void>> deleteTemplate(@PathVariable Long id) { ... }

    @PatchMapping("/{id}/default")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<DocumentTemplateDTO>> setAsDefault(@PathVariable Long id) { ... }

    @PostMapping("/{id}/duplicate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<DocumentTemplateDTO>> duplicateTemplate(
            @PathVariable Long id,
            @RequestParam String newName) { ... }
}
```

### 3.3 Document Generation & Download Endpoints

Base path: `/api/v1/documents`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/documents/employees/{employeeId}/templates` | ADMIN | List available templates for an employee |
| `POST` | `/documents/employees/{employeeId}/generate` | ADMIN | Generate & download a document |
| `GET` | `/documents/download-logs/employee/{employeeId}` | ADMIN | Download stats per employee |
| `GET` | `/documents/download-logs/summary` | ADMIN | Summary report per template per FY |
| `GET` | `/documents/download-logs/export` | ADMIN | Export download logs to Excel |

**Controller:** `DocumentGenerationController.java`

```java
@RestController
@RequestMapping("/documents")
@RequiredArgsConstructor
public class DocumentGenerationController {

    private final DocumentGenerationService generationService;
    private final DownloadLogService downloadLogService;

    @GetMapping("/employees/{employeeId}/templates")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<List<DocumentTemplateDTO>>> getTemplatesForEmployee(
            @PathVariable Long employeeId) {
        // Returns all active templates
        List<DocumentTemplateDTO> templates = generationService.getActiveTemplates();
        return ResponseEntity.ok(APIResponse.success(templates));
    }

    @PostMapping("/employees/{employeeId}/generate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Resource> generateDocument(
            @PathVariable Long employeeId,
            @RequestParam("templateId") Long templateId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        // 1. Resolve placeholders
        // 2. Generate PDF
        // 3. Log download
        // 4. Return PDF stream
        byte[] pdfContent = generationService.generateDocument(
            employeeId, templateId, currentUser.getUsername());

        String filename = "document_" + employeeId + "_" + templateId + ".pdf";
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + filename + "\"")
            .body(new ByteArrayResource(pdfContent));
    }

    @GetMapping("/download-logs/employee/{employeeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<List<DownloadLogDTO>>> getEmployeeDownloadLogs(
            @PathVariable Long employeeId,
            @RequestParam(required = false) String financialYear) { ... }

    @GetMapping("/download-logs/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<APIResponse<List<DownloadSummaryDTO>>> getDownloadSummary(
            @RequestParam(required = false) String financialYear,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String templateType) { ... }

    @GetMapping("/download-logs/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportDownloadLogs(
            @RequestParam(required = false) String financialYear) { ... }
}
```

**Important:** Add the logo serving route to SecurityConfig's permit list:
```java
.requestMatchers("/company/logo").permitAll()
```

---

## 4. File Structure

### 4.1 Backend — New & Modified Files

```
employee-management-api/src/main/java/com/ems/
├── model/
│   ├── Company.java                 ★ NEW
│   ├── CompanyDocument.java         ★ NEW
│   ├── DocumentTemplate.java        ★ NEW
│   └── DownloadLog.java             ★ NEW
│
├── dto/
│   ├── CompanyDTO.java              ★ NEW
│   ├── CompanyDocumentDTO.java      ★ NEW
│   ├── DocumentTemplateDTO.java     ★ NEW
│   ├── DownloadLogDTO.java          ★ NEW
│   └── DownloadSummaryDTO.java      ★ NEW
│
├── repository/
│   ├── CompanyRepository.java       ★ NEW
│   ├── CompanyDocumentRepository.java ★ NEW
│   ├── DocumentTemplateRepository.java ★ NEW
│   └── DownloadLogRepository.java   ★ NEW
│
├── service/
│   ├── CompanyService.java          ★ NEW
│   ├── DocumentTemplateService.java ★ NEW
│   ├── DocumentGenerationService.java ★ NEW
│   └── DownloadLogService.java      ★ NEW
│
├── controller/
│   ├── CompanyController.java       ★ NEW
│   ├── TemplateController.java      ★ NEW
│   └── DocumentGenerationController.java ★ NEW
│
├── enums/
│   └── TemplateType.java            ★ NEW
│
├── config/
│   ├── SecurityConfig.java          ✎ MODIFY (add /company/logo permit)
│   └── WebConfig.java               ✎ MODIFY (add company logo resource handler)
│
└── utils/
    └── FinancialYearUtil.java       ★ NEW
```

### 4.2 Frontend — New Files

```
employee-management-ui/src/app/
├── core/
│   └── models/
│       ├── company.model.ts             ★ NEW
│       ├── company-document.model.ts    ★ NEW
│       ├── document-template.model.ts   ★ NEW
│       ├── download-log.model.ts        ★ NEW
│       └── download-summary.model.ts    ★ NEW
│
├── core/
│   └── services/
│       ├── company.service.ts           ★ NEW
│       ├── document-template.service.ts ★ NEW
│       └── document-generation.service.ts ★ NEW
│
└── features/
    ├── company-setup/
    │   ├── company-setup.component.ts       ★ NEW
    │   ├── company-setup.component.html     ★ NEW
    │   └── company-setup.component.scss     ★ NEW
    │
    ├── document-templates/
    │   ├── template-list.component.ts       ★ NEW
    │   ├── template-list.component.html     ★ NEW
    │   ├── template-list.component.scss     ★ NEW
    │   ├── template-form.component.ts       ★ NEW
    │   ├── template-form.component.html     ★ NEW
    │   └── template-form.component.scss     ★ NEW
    │
    └── download-reports/
        ├── download-reports.component.ts    ★ NEW
        ├── download-reports.component.html  ★ NEW
        └── download-reports.component.scss  ★ NEW
```

### 4.3 Angular Route Additions

**File:** `employee-management-ui/src/app/app.routes.ts` (modify admin children)

```typescript
// Inside admin children array, add:
{
  path: 'company',
  loadComponent: () => import('./features/company-setup/company-setup.component')
    .then(m => m.CompanySetupComponent),
  title: 'Company Setup'
},
{
  path: 'templates',
  loadComponent: () => import('./features/document-templates/template-list.component')
    .then(m => m.TemplateListComponent),
  title: 'Document Templates'
},
{
  path: 'templates/new',
  loadComponent: () => import('./features/document-templates/template-form.component')
    .then(m => m.TemplateFormComponent),
  title: 'New Template'
},
{
  path: 'templates/:id/edit',
  loadComponent: () => import('./features/document-templates/template-form.component')
    .then(m => m.TemplateFormComponent),
  title: 'Edit Template'
},
{
  path: 'download-reports',
  loadComponent: () => import('./features/download-reports/download-reports.component')
    .then(m => m.DownloadReportsComponent),
  title: 'Download Reports'
},
```

### 4.4 Sidebar Menu Additions

**File:** `employee-management-ui/src/app/layouts/admin-layout/admin-layout.component.ts`

Add after the "Registrations" menu item:
```html
<li nz-menu-item routerLink="/admin/company"
    (click)="closeDrawerOnMobile()">
  <i nz-icon nzType="building"></i>
  <span *ngIf="!isCollapsed()">Company</span>
</li>
<li nz-menu-item routerLink="/admin/templates"
    (click)="closeDrawerOnMobile()">
  <i nz-icon nzType="file-text"></i>
  <span *ngIf="!isCollapsed()">Templates</span>
</li>
<li nz-menu-item routerLink="/admin/download-reports"
    (click)="closeDrawerOnMobile()">
  <i nz-icon nzType="bar-chart"></i>
  <span *ngIf="!isCollapsed()">Downloads</span>
</li>
```

---

## 5. Integration Points

### 5.1 Template ↔ Employee Data Flow

```
DocumentGenerationService
│
├── getEmployeePlaceholders(employeeId) → Map<String, String>
│   ├── employee_name     → employee.getFullName()
│   ├── employee_code     → employee.getEmployeeCode()
│   ├── designation       → employee.getDesignation()
│   ├── doj               → employee.getDoj().format(DD/MM/YYYY)
│   ├── doe               → employee.getDoe().format(DD/MM/YYYY)
│   ├── department        → employee.getProcessAssigned()
│   ├── gender            → employee.getGender()
│   ├── address           → employee.getPresentAddress()
│   ├── mobile            → employee.getMobile()
│   └── email             → employee.getEmail()
│
├── getCompanyPlaceholders() → Map<String, String>
│   ├── company_name      → company.getCompanyName()
│   ├── company_address   → company.getAddress()
│   ├── company_logo      → <img src="..."/> HTML tag
│   ├── company_gst       → company.getGstNumber()
│   ├── company_pan       → company.getPanNumber()
│   └── company_cin       → company.getCinNumber()
│
├── getSystemPlaceholders() → Map<String, String>
│   ├── current_date      → LocalDate.now().format(DD/MM/YYYY)
│   ├── financial_year    → FinancialYearUtil.getCurrentFinancialYear()
│   └── authorized_signatory → company.getAuthorizedSignatory()
│
└── resolve(templateContent, allPlaceholders) → resolved HTML
```

### 5.2 Company Logo Serving

**WebConfig.java** — Add resource handler:
```java
@Value("${app.company.upload-dir:uploads/company}")
private String companyUploadDir;

@Override
public void addResourceHandlers(ResourceHandlerRegistry registry) {
    // Existing photos handler...
    Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
    registry.addResourceHandler("/photos/**")
        .addResourceLocations("file:" + uploadPath.toString() + "/")
        .setCachePeriod(3600);

    // Company uploads handler
    Path companyPath = Paths.get(companyUploadDir).toAbsolutePath().normalize();
    registry.addResourceHandler("/company-files/**")
        .addResourceLocations("file:" + companyPath.toString() + "/")
        .setCachePeriod(3600);
}
```

**application.properties additions:**
```properties
# Company Uploads
app.company.upload-dir=${UPLOAD_DIR_COMPANY:uploads/company}
app.company.logo-allowed-types=image/jpeg,image/png
app.company.document-allowed-types=image/jpeg,image/png,application/pdf
```

### 5.3 Employee Detail Page — Download Button

In the employee view page (`staff-master-view.component.ts`), add a "Download" button in the action toolbar that opens a template selection modal.

**Modal flow:**
1. Admin clicks "Download" on employee detail page
2. Modal opens listing active template types
3. Admin selects a type (e.g., "Joining Letter")
4. System auto-selects the default template for that type
5. Admin clicks "Generate & Download"
6. POST to `/documents/employees/{employeeId}/generate?templateId=X`
7. Browser receives PDF file download

---

## 6. Security Matrix

| Endpoint | Superadmin | Admin | Employee | Public |
|----------|:----------:|:-----:|:--------:|:------:|
| `GET /company` | ✅ | ✅ | ❌ | ❌ |
| `PUT /company` | ✅ | ❌ | ❌ | ❌ |
| `POST /company/logo` | ✅ | ❌ | ❌ | ❌ |
| `GET /company/logo` | ✅ | ✅ | ✅ | ✅ |
| `GET/POST/DELETE /company/documents` | ✅ | ❌ | ❌ | ❌ |
| `GET/POST/PUT/DELETE /templates` | ✅ | ✅ | ❌ | ❌ |
| `POST /documents/.../generate` | ✅ | ✅ | ❌ | ❌ |
| `GET /documents/download-logs/**` | ✅ | ✅ | ❌ | ❌ |
| `GET /employees/{id}` | ✅ | ✅ | Self only | ❌ |

### Role Enforcement Strategy

The current system has two roles: `ADMIN` and `EMPLOYEE`. For superadmin-level operations (company profile edits, logo uploads), we have two options:

**Option A (Recommended):** Introduce a `SUPER_ADMIN` role for company-wide settings. The current `ADMIN` role retains access to everything else.

**Option B (Easier):** Use `@PreAuthorize("hasRole('ADMIN')")` for all admin operations. The company editing is only exposed through the UI (which checks a config flag), so the API is admin-only but UI restricts who sees the setup page.

**Decision:** We recommend Option A since it's the correct domain model — but implement Option B as a first iteration to minimize auth changes, with a note that Company Setup will be restricted in the UI via a permission check.

### SecurityConfig Permissions

Add to `SecurityConfig.filterChain()`:
```java
.requestMatchers("/company/logo").permitAll()
```

---

## 7. Document Generation Strategy

### 7.1 Placeholder Resolution Engine

**File:** `employee-management-api/src/main/java/com/ems/service/DocumentGenerationService.java`

Core algorithm:

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentGenerationService {

    private final DocumentTemplateRepository templateRepository;
    private final EmployeeRepository employeeRepository;
    private final CompanyService companyService;
    private final DownloadLogService downloadLogService;

    /**
     * Generates a PDF document by resolving placeholders in the template.
     */
    public byte[] generateDocument(Long employeeId, Long templateId, String downloadedBy) {
        // 1. Fetch entities
        DocumentTemplate template = templateRepository.findById(templateId)
            .orElseThrow(() -> new ResourceNotFoundException("Template not found"));
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        Company company = companyService.getCompanyOrThrow();

        // 2. Build placeholder map
        Map<String, String> placeholders = new HashMap<>();

        // Employee placeholders
        placeholders.put("employee_name", employee.getFullName());
        placeholders.put("employee_code", employee.getEmployeeCode());
        placeholders.put("designation", nullToEmpty(employee.getDesignation()));
        placeholders.put("doj", formatDate(employee.getDoj()));
        placeholders.put("doe", formatDate(employee.getDoe()));
        placeholders.put("department", nullToEmpty(employee.getProcessAssigned()));
        placeholders.put("gender", nullToEmpty(employee.getGender()));
        placeholders.put("address", nullToEmpty(employee.getPresentAddress()));
        placeholders.put("mobile", nullToEmpty(employee.getMobile()));
        placeholders.put("email", nullToEmpty(employee.getEmail()));

        // Company placeholders
        placeholders.put("company_name", nullToEmpty(company.getCompanyName()));
        placeholders.put("company_address", nullToEmpty(company.getAddress()));
        placeholders.put("company_logo", buildLogoHtml(company));
        placeholders.put("company_gst", nullToEmpty(company.getGstNumber()));
        placeholders.put("company_pan", nullToEmpty(company.getPanNumber()));
        placeholders.put("company_cin", nullToEmpty(company.getCinNumber()));

        // System placeholders
        placeholders.put("current_date", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        placeholders.put("financial_year", FinancialYearUtil.getCurrentFinancialYear());
        placeholders.put("authorized_signatory", nullToEmpty(company.getAuthorizedSignatory()));

        // 3. Replace placeholders
        String resolvedContent = template.getContent();
        for (Map.Entry<String, String> entry : placeholders.entrySet()) {
            resolvedContent = resolvedContent.replace(
                "{{" + entry.getKey() + "}}",
                entry.getValue() != null ? entry.getValue() : "");
        }

        // 4. Wrap in complete HTML document
        String fullHtml = buildFullHtml(resolvedContent);

        // 5. Convert HTML to PDF
        byte[] pdfBytes = convertHtmlToPdf(fullHtml);

        // 6. Log the download
        downloadLogService.logDownload(employee, template, downloadedBy);

        return pdfBytes;
    }
}
```

### 7.2 PDF Generation Library Options

**Recommended: OpenPDF (iText fork, LGPL)**
- Add to `pom.xml`:
```xml
<dependency>
    <groupId>com.github.librepdf</groupId>
    <artifactId>openpdf</artifactId>
    <version>1.3.39</version>
</dependency>
```

- HTML → PDF via Flying Saucer (supports CSS):
```xml
<dependency>
    <groupId>org.xhtmlrenderer</groupId>
    <artifactId>flying-saucer-core</artifactId>
    <version>9.7.3</version>
</dependency>
<dependency>
    <groupId>org.xhtmlrenderer</groupId>
    <artifactId>flying-saucer-openpdf</artifactId>
    <version>9.7.3</version>
</dependency>
```

**Conversion method:**
```java
private byte[] convertHtmlToPdf(String html) throws DocumentException {
    String htmlWithHead = "<!DOCTYPE html><html><head>" +
        "<meta charset=\"UTF-8\">" +
        "<style>" +
        "  body { font-family: Arial, sans-serif; font-size: 12pt; margin: 40px; }" +
        "  .header { text-align: center; margin-bottom: 30px; }" +
        "  .logo { max-width: 150px; }" +
        "  .content { line-height: 1.6; }" +
        "  .footer { margin-top: 50px; text-align: right; }" +
        "</style>" +
        "</head><body>" + html + "</body></html>";

    ITextRenderer renderer = new ITextRenderer();
    renderer.setDocumentFromString(htmlWithHead);
    renderer.layout();

    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    renderer.createPDF(baos);
    return baos.toByteArray();
}
```

### 7.3 Backup Strategy: DOCX Fallback

If PDF generation introduces issues with complex layouts, use Apache POI for DOCX generation. The current project already has Apache POI as a dependency (for Excel), so no new dependency is needed.

```java
private byte[] convertHtmlToDocx(String htmlContent) {
    // Use POI to create a simple DOCX with the resolved HTML
    // For complex HTML-to-DOCX, consider docx4j as an additional dependency
}
```

### 7.4 Template Content Format

Templates are stored as HTML fragments. Example joining letter:

```html
<div class="header">
    {{company_logo}}
    <h2>{{company_name}}</h2>
    <p>{{company_address}}</p>
</div>

<div class="content">
    <p><strong>Date:</strong> {{current_date}}</p>
    <p><strong>To,</strong><br>
    {{employee_name}}<br>
    {{employee_code}}<br>
    {{address}}</p>

    <p><strong>Sub: Appointment Letter</strong></p>

    <p>Dear {{employee_name}},</p>

    <p>We are pleased to appoint you as <strong>{{designation}}</strong> 
    at {{company_name}}.</p>

    <p>Your date of joining is <strong>{{doj}}</strong>.</p>

    <!-- Additional letter content -->
</div>

<div class="footer">
    <p>For {{company_name}},</p>
    <br><br>
    <p>{{authorized_signatory}}</p>
</div>
```

---

## 8. Download Tracking Logic

### 8.1 Financial Year Calculation

**File:** `employee-management-api/src/main/java/com/ems/utils/FinancialYearUtil.java`

```java
package com.ems.utils;

import java.time.LocalDate;
import java.time.Month;

public class FinancialYearUtil {

    private FinancialYearUtil() {}

    /**
     * Returns the current financial year string.
     * Indian financial year: April 1 to March 31.
     * If today is before April 1, it's FY previousYear-currentYear.
     * If today is on or after April 1, it's FY currentYear-nextYear.
     *
     * Example: 2025-04-01 → "2025-2026", 2026-03-31 → "2025-2026"
     */
    public static String getCurrentFinancialYear() {
        LocalDate today = LocalDate.now();
        int year = today.getYear();
        if (today.getMonthValue() >= Month.APRIL.getValue()) {
            return year + "-" + (year + 1);
        } else {
            return (year - 1) + "-" + year;
        }
    }

    /**
     * Returns the financial year for a given date.
     */
    public static String getFinancialYear(LocalDate date) {
        int year = date.getYear();
        if (date.getMonthValue() >= Month.APRIL.getValue()) {
            return year + "-" + (year + 1);
        } else {
            return (year - 1) + "-" + year;
        }
    }

    /**
     * Returns start date of a financial year string.
     * "2025-2026" → 2025-04-01
     */
    public static LocalDate getFinancialYearStart(String financialYear) {
        String[] parts = financialYear.split("-");
        int startYear = Integer.parseInt(parts[0]);
        return LocalDate.of(startYear, Month.APRIL, 1);
    }

    /**
     * Returns end date of a financial year string.
     * "2025-2026" → 2026-03-31
     */
    public static LocalDate getFinancialYearEnd(String financialYear) {
        String[] parts = financialYear.split("-");
        int endYear = Integer.parseInt(parts[1]);
        return LocalDate.of(endYear, Month.MARCH, 31);
    }
}
```

### 8.2 Download Logging

**File:** `employee-management-api/src/main/java/com/ems/service/DownloadLogService.java`

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class DownloadLogService {

    private final DownloadLogRepository downloadLogRepository;

    @Transactional
    public void logDownload(Employee employee, DocumentTemplate template, String downloadedBy) {
        DownloadLog logEntry = DownloadLog.builder()
            .employee(employee)
            .template(template)
            .templateType(template.getTemplateType())
            .financialYear(FinancialYearUtil.getCurrentFinancialYear())
            .downloadedAt(LocalDateTime.now())
            .downloadedBy(downloadedBy)
            .employeeCodeAtTime(employee.getEmployeeCode())
            .build();

        downloadLogRepository.save(logEntry);
        log.info("Download logged: emp={}, template={}, fy={}",
            employee.getEmployeeCode(), template.getTemplateName(), logEntry.getFinancialYear());
    }

    /**
     * Get download count for an employee + template + financial year
     */
    public long getDownloadCount(Long employeeId, Long templateId, String financialYear) {
        return downloadLogRepository.countByEmployeeIdAndTemplateIdAndFinancialYear(
            employeeId, templateId, financialYear);
    }

    /**
     * Get per-employee download summary for a given FY
     */
    public List<DownloadSummaryDTO> getDownloadSummary(String financialYear, Long employeeId, String templateType) {
        // Use repository queries with GROUP BY
        if (financialYear == null) {
            financialYear = FinancialYearUtil.getCurrentFinancialYear();
        }
        return downloadLogRepository.getDownloadSummary(financialYear, employeeId, templateType);
    }
}
```

### 8.3 Repository Queries

**File:** `employee-management-api/src/main/java/com/ems/repository/DownloadLogRepository.java`

```java
public interface DownloadLogRepository extends JpaRepository<DownloadLog, Long> {

    long countByEmployeeIdAndTemplateIdAndFinancialYear(
        Long employeeId, Long templateId, String financialYear);

    List<DownloadLog> findByEmployeeIdAndFinancialYearOrderByDownloadedAtDesc(
        Long employeeId, String financialYear);

    List<DownloadLog> findByFinancialYearOrderByDownloadedAtDesc(String financialYear);

    @Query("SELECT new com.ems.dto.DownloadSummaryDTO(" +
           "  d.employee.id, d.employee.employeeCode, d.employee.firstName, d.employee.surname, " +
           "  d.template.id, d.templateType, d.template.templateName, " +
           "  d.financialYear, COUNT(d.id)) " +
           "FROM DownloadLog d " +
           "WHERE (:financialYear IS NULL OR d.financialYear = :financialYear) " +
           "  AND (:employeeId IS NULL OR d.employee.id = :employeeId) " +
           "  AND (:templateType IS NULL OR d.templateType = :templateType) " +
           "GROUP BY d.employee.id, d.employee.employeeCode, d.employee.firstName, " +
           "         d.employee.surname, d.template.id, d.templateType, " +
           "         d.template.templateName, d.financialYear " +
           "ORDER BY d.employee.employeeCode, d.templateType")
    List<DownloadSummaryDTO> getDownloadSummary(
        @Param("financialYear") String financialYear,
        @Param("employeeId") Long employeeId,
        @Param("templateType") String templateType);
}
```

### 8.4 DownloadSummaryDTO

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DownloadSummaryDTO {
    private Long employeeId;
    private String employeeCode;
    private String firstName;
    private String surname;
    private Long templateId;
    private String templateType;
    private String templateName;
    private String financialYear;
    private Long downloadCount;
}
```

---

## 9. ADRs

### ADR-001: Company as Singleton Upsert Pattern

**Status:** Accepted

**Context:** The company record should be a single row — there is only one company. Using separate create/update endpoints creates unnecessary complexity and edge cases (what if company is deleted? what if two admins try to create simultaneously?).

**Decision:** Use an upsert pattern: `PUT /company` always creates if no row exists, or updates the existing row. The endpoint is idempotent — calling it multiple times yields the same result.

**Consequences:**
- ✅ Eliminates "company not found" edge cases
- ✅ Simplifies frontend logic — no need to check if company exists before showing form
- ✅ Clean idempotent API
- ⚠️ Must ensure only one row exists (application-level check before insert; unique constraint not possible on a table designed for a single row)

---

### ADR-002: Template Content as HTML with Placeholders

**Status:** Accepted

**Context:** Document templates need to support rich formatting (bold, italic, tables, headers, bullet points, images/logo) while remaining simple enough for non-technical admins to edit.

**Options considered:**
1. **Plain text with placeholders** — Too limited, no formatting
2. **Markdown with placeholders** — Requires MD→HTML conversion, additional dependency
3. **HTML with `{{placeholders}}`** — Direct, no conversion needed for display, admins can use a rich text editor
4. **Word template (.docx) with placeholders** — Requires complex DOCX parsing, harder to version-control

**Decision:** Store templates as HTML fragments with `{{placeholder}}` syntax. The template editor on the frontend will use a rich text editor (like ng-zorro-antd's built-in editor or TinyMCE/quill) that generates HTML.

**Consequences:**
- ✅ Rich formatting out of the box
- ✅ Placeholder replacement is a simple string operation
- ✅ HTML can be previewed directly in the browser
- ⚠️ Admins comfortable with basic HTML can write templates directly; those who aren't will need a WYSIWYG editor
- ⚠️ Placeholder rendering depends on admins inserting them in the right context (mitigated by providing a palette of available placeholders)

---

### ADR-003: Denormalized `template_type` in DownloadLog

**Status:** Accepted

**Context:** Download summary reports need to group by template type. If we only store the FK to `document_templates`, every summary query would need a JOIN. Additionally, template names/types could change over time — a historical download log should still report what type was downloaded.

**Decision:** Store `template_type` as a denormalized column in `download_logs`. Also store `employee_code_at_time` as a snapshot.

**Consequences:**
- ✅ Fast reporting queries without JOINs
- ✅ Historical accuracy — even if a template is renamed, the log retains the type at time of download
- ⚠️ Data duplication (small — this is a VARCHAR column)
- ⚠️ Must ensure `template_type` stays in sync if template is updated (mitigated: only copy at creation time, never update)

---

### ADR-004: PDF as Primary Output Format

**Status:** Accepted

**Context:** Generated documents must be downloadable, printable, and shareable. Both PDF and DOCX are common formats.

**Decision:** Generate PDF as the primary format (using Flying Saucer + OpenPDF for HTML→PDF conversion). DOCX generation (via Apache POI, already in the project) is available as a fallback if PDF proves insufficient for certain template layouts.

**Consequences:**
- ✅ PDF is universally readable, non-editable (tamper-evident)
- ✅ HTML→PDF pipeline is straightforward with existing dependencies
- ✅ No additional license costs (OpenPDF is LGPL)
- ⚠️ Complex CSS may not render identically in PDF (mitigated: use simple, tested CSS templates)
- ⚠️ Font rendering may differ (mitigated: embed standard fonts via CSS)

---

## 10. Implementation Sequence

### Phase 1 — Foundation (Days 1-2)
1. Create `Company.java`, `CompanyRepository.java`, `CompanyService.java`, `CompanyController.java`
2. Create `CompanyDocument.java`, `CompanyDocumentRepository.java`
3. Add company upload directory config to `application.properties` and `WebConfig.java`
4. Add `/company/logo` to `SecurityConfig.java` permit list
5. Frontend: `CompanySetupComponent` with form (name, address, GST, PAN, etc.) + logo upload

### Phase 2 — Templates (Days 3-4)
1. Create `DocumentTemplate.java`, `DocumentTemplateRepository.java`, `DocumentTemplateService.java`, `TemplateController.java`
2. Create `TemplateType.java` enum
3. Frontend: `TemplateListComponent` (table with CRUD), `TemplateFormComponent` (rich text editor + placeholder palette)

### Phase 3 — Document Generation (Days 5-6)
1. Add OpenPDF + Flying Saucer to `pom.xml`
2. Create `DocumentGenerationService.java` with placeholder resolution engine
3. Create `DocumentGenerationController.java`
4. Test with sample employee and company data

### Phase 4 — Download Tracking (Day 7)
1. Create `DownloadLog.java`, `DownloadLogRepository.java`, `DownloadLogService.java`
2. Create `FinancialYearUtil.java`
3. Create `DownloadSummaryDTO.java` and reporting queries
4. Frontend: `DownloadReportsComponent` with filterable table/chart

### Phase 5 — Integration (Day 8)
1. Add "Download" button to employee detail page (`staff-master-view.component.ts`)
2. Create template selection modal
3. Wire up full end-to-end flow
4. Add sidebar menu items
5. End-to-end testing

---

## Appendix A: Template Type Enum

**File:** `employee-management-api/src/main/java/com/ems/enums/TemplateType.java`

```java
package com.ems.enums;

public enum TemplateType {
    JOINING_LETTER,
    RELIEVING_LETTER,
    EXPERIENCE_LETTER,
    OFFER_LETTER,
    APPOINTMENT_LETTER,
    SALARY_SLIP,
    CONFIRMATION_LETTER,
    SHOW_CAUSE_LETTER,
    TERMINATION_LETTER,
    TRANSFER_LETTER,
    PROMOTION_LETTER,
    NOC_LETTER,
    BOND_AGREEMENT,
    OTHER
}
```

## Appendix B: DTO List

### CompanyDTO
```java
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CompanyDTO {
    private Long id;
    private String companyName;
    private String address;
    private String phone;
    private String email;
    private String website;
    private String registrationNumber;
    private String gstNumber;
    private String panNumber;
    private String tanNumber;
    private String cinNumber;
    private LocalDate incorporatedDate;
    private String logoPath;
    private String authorizedSignatory;
    private String signatoryDesignation;
}
```

### CompanyDocumentDTO
```java
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CompanyDocumentDTO {
    private Long id;
    private String documentType;
    private String fileName;
    private String originalName;
    private Long fileSize;
    private String contentType;
    private LocalDateTime uploadedAt;
    private String uploadedBy;
}
```

### DocumentTemplateDTO
```java
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DocumentTemplateDTO {
    private Long id;
    private String templateType;
    private String templateName;
    private String description;
    private String content;
    private Boolean isActive;
    private Boolean isDefault;
    private Integer version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
}
```

### DownloadLogDTO
```java
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DownloadLogDTO {
    private Long id;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private Long templateId;
    private String templateType;
    private String templateName;
    private String financialYear;
    private LocalDateTime downloadedAt;
    private String downloadedBy;
}
```

## Appendix C: Application Properties Additions

```properties
# ============================================================
# Document Template & Company Setup - Additional Configuration
# ============================================================

# Company Uploads
app.company.upload-dir=${UPLOAD_DIR_COMPANY:uploads/company}
app.company.logo-allowed-types=image/jpeg,image/png
app.company.document-allowed-types=image/jpeg,image/png,application/pdf

# Document Generation
app.docgen.enabled=true
app.docgen.output-format=PDF
app.docgen.default-page-size=A4
app.docgen.margin-top=20
app.docgen.margin-bottom=20
app.docgen.margin-left=25
app.docgen.margin-right=25
```

---

*This document serves as the authoritative architecture reference for the Document Template & Company Setup Module. All implementation decisions should align with the patterns, conventions, and decisions recorded here.*
