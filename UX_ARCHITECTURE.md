# Employee Management System — UX Architecture Specification

> **Version:** 2.0  
> **Date:** May 24, 2026  
> **Author:** ArchitectUX Agent  
> **Module:** Document Template & Company Setup  
> **Stack:** Angular 17+ (Standalone) | ng-zorro-antd (Ant Design) | Spring Boot 3.x | MySQL 8  
> **Color System:** Navy Primary `#1f3d6e` / `#2a5298` | Clean Whites | Subtle Shadows

---

## Table of Contents

1. [Module Scope & Architecture](#1-module-scope--architecture)
2. [Personas & Permissions Matrix](#2-personas--permissions-matrix)
3. [Route Design & Sidebar Integration](#3-route-design--sidebar-integration)
4. [Company Setup — Page Specification](#4-company-setup--page-specification)
5. [Document Template List — Page Specification](#5-document-template-list--page-specification)
6. [Template Editor — Page Specification](#6-template-editor--page-specification)
7. [Employee Document Download — Modal Specification](#7-employee-document-download--modal-specification)
8. [Download Reports — Page Specification](#8-download-reports--page-specification)
9. [Interaction & State Design](#9-interaction--state-design)
10. [Empty, Loading & Error States](#10-empty-loading--error-states)
11. [Accessibility & Theme](#11-accessibility--theme)
12. [Developer Handoff Checklist](#12-developer-handoff-checklist)

---

## 1. Module Scope & Architecture

### 1.1 Module Boundaries

```
┌──────────────────────────────────────────────────────────────┐
│                    Document & Company Module                   │
│                                                              │
│  ┌─────────────────────┐  ┌──────────────────────────────┐   │
│  │   Company Setup     │  │    Document Templates          │   │
│  │  (Superadmin only)  │  │    (Admin: CRUD)               │   │
│  │                     │  │                                 │   │
│  │  • Company profile  │  │  • Template list + filters     │   │
│  │  • Logo upload      │  │  • Template editor (content)   │   │
│  │  • Legal documents  │  │  • Placeholder system          │   │
│  └─────────────────────┘  │  • Preview & generation        │   │
│                            └──────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────┐  ┌──────────────────────────────┐   │
│  │   Doc Generation    │  │    Download Reports            │   │
│  │  (from Employee     │  │    (Admin: view only)          │   │
│  │   Profile View)     │  │                                 │   │
│  │                     │  │  • Download summary stats      │   │
│  │  • Modal workflow   │  │  • Filterable log table       │   │
│  │  • Template select  │  │  • Export to Excel            │   │
│  │  • Live preview     │  │  • Per-employee tracking      │   │
│  │  • PDF/DOCX export  │  │                                 │   │
│  └─────────────────────┘  └──────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Data Entities

| Entity | Backend Model | Angular Model | Key Fields |
|--------|--------------|---------------|------------|
| **Company** | `Company.java` | `company.model.ts` | `companyName`, `address`, `phone`, `email`, `website`, `registrationNumber`, `gstNumber`, `panNumber`, `tanNumber`, `cinNumber`, `incorporatedDate`, `logoPath`, `authorizedSignatory` |
| **CompanyDocument** | `CompanyDocument.java` | `company.model.ts` | `documentType`, `fileName`, `filePath`, `fileSize`, `uploadedAt` |
| **DocumentTemplate** | `DocumentTemplate.java` | `document-template.model.ts` | `templateName`, `templateType`, `description`, `content` (HTML), `variables` (JSON), `isActive` |
| **DownloadLog** | `DocumentDownloadLog.java` | `document-template.model.ts` | `employeeId`, `templateId`, `financialYear`, `downloadedAt`, `downloadedBy` |
| **DownloadStats** | `DownloadStatsDTO.java` | `document-template.model.ts` | `perEmployee`, `perTemplate`, `perFinancialYear` |

### 1.3 API Contract Summary

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `GET` | `/api/v1/company` | Get company profile | ADMIN |
| `PUT` | `/api/v1/company` | Update company (multipart: company JSON + logo file) | ADMIN |
| `POST` | `/api/v1/company/logo` | Upload logo only | ADMIN |
| `GET` | `/api/v1/company/logo` | Download logo file | ADMIN |
| `GET` | `/api/v1/company/documents` | List legal documents | ADMIN |
| `POST` | `/api/v1/company/documents` | Upload legal document | ADMIN |
| `DELETE` | `/api/v1/company/documents/{id}` | Delete legal document | ADMIN |
| `GET` | `/api/v1/document-templates` | List templates (filterable) | ADMIN |
| `GET` | `/api/v1/document-templates/types` | Get template type enums | ADMIN |
| `GET` | `/api/v1/document-templates/{id}` | Get single template | ADMIN |
| `POST` | `/api/v1/document-templates` | Create template | ADMIN |
| `PUT` | `/api/v1/document-templates/{id}` | Update template | ADMIN |
| `DELETE` | `/api/v1/document-templates/{id}` | Deactivate template | ADMIN |
| `POST` | `/api/v1/document-templates/{id}/generate/{employeeId}` | Generate & log document | ADMIN, EMPLOYEE |
| `GET` | `/api/v1/document-templates/preview/{id}?employeeId={eid}` | Preview filled document | ADMIN, EMPLOYEE |
| `GET` | `/api/v1/document-templates/download-logs` | Paginated download logs | ADMIN |
| `GET` | `/api/v1/document-templates/download-logs/stats` | Download statistics | ADMIN |
| `GET` | `/api/v1/document-templates/download-logs/employee/{employeeId}` | Per-employee logs | ADMIN |
| `GET` | `/api/v1/document-templates/download-logs/financial-years` | Distinct FY list | ADMIN |

---

## 2. Personas & Permissions Matrix

### 2.1 Role-Based Access

| Feature | Superadmin (ADMIN) | Admin (ADMIN) | Employee (EMPLOYEE) |
|---------|-------------------|---------------|---------------------|
| **Company Setup** | ✅ Full CRUD | ❌ Not visible | ❌ Not visible |
| **Template List** | ✅ View all | ✅ View all | ❌ Not visible |
| **Template Create/Edit** | ✅ Full CRUD | ✅ Full CRUD | ❌ Not visible |
| **Template Delete** | ✅ Deactivate | ✅ Deactivate | ❌ Not visible |
| **Generate Document** | ✅ For any employee | ✅ For any employee | ✅ For self only |
| **Preview Document** | ✅ For any employee | ✅ For any employee | ✅ For self only |
| **Download Reports** | ✅ Full access | ✅ Full access | ❌ Not visible |
| **View Download History** | ✅ Per employee | ✅ Per employee | ✅ Own history |

### 2.2 Sidebar Visibility Matrix

| Menu Item | Superadmin | Admin | Employee |
|-----------|-----------|-------|----------|
| Dashboard | ✅ | ✅ | ✅ (own) |
| Employees | ✅ | ✅ | ❌ |
| Master Data | ✅ | ✅ | ❌ |
| Reports | ✅ | ✅ | ❌ |
| Registrations | ✅ | ✅ | ❌ |
| **Company Setup** | ✅ | ❌ | ❌ |
| **Document Templates** | ✅ | ✅ | ❌ |
| My Profile | ✅ | ✅ | ✅ |

---

## 3. Route Design & Sidebar Integration

### 3.1 New Routes to Add

```typescript
// In admin children routes array (app.routes.ts)
{
  path: 'company',
  loadComponent: () => import('./features/company/company-setup.component')
    .then(m => m.CompanySetupComponent),
  title: 'Company Setup'
},
{
  path: 'document-templates',
  loadComponent: () => import('./features/document-templates/document-template-list.component')
    .then(m => m.DocumentTemplateListComponent),
  title: 'Document Templates'
},
{
  path: 'document-templates/new',
  loadComponent: () => import('./features/document-templates/template-editor.component')
    .then(m => m.TemplateEditorComponent),
  title: 'New Template'
},
{
  path: 'document-templates/:id/edit',
  loadComponent: () => import('./features/document-templates/template-editor.component')
    .then(m => m.TemplateEditorComponent),
  title: 'Edit Template'
},
{
  path: 'document-templates/:id',
  loadComponent: () => import('./features/document-templates/template-editor.component')
    .then(m => m.TemplateEditorComponent),
  title: 'View Template'
}
```

### 3.2 Updated Sidebar Menu Items

Add these menu items to `AdminLayoutComponent` after the Registrations item:

```html
<!-- === DOCUMENTS GROUP (with divider) === -->
<li nz-menu-divider *ngIf="!isCollapsed()"></li>
<li nz-menu-item routerLink="/admin/company" *ngIf="userRole === 'SUPERADMIN'"
    (click)="closeDrawerOnMobile()">
  <i nz-icon nzType="bank"></i>
  <span *ngIf="!isCollapsed()">Company Setup</span>
</li>
<li nz-menu-item routerLink="/admin/document-templates"
    (click)="closeDrawerOnMobile()">
  <i nz-icon nzType="file-text"></i>
  <span *ngIf="!isCollapsed()">Document Templates</span>
</li>
```

**Sidebar Impact Analysis:**
- Company Setup gets a `bank` icon, only visible to SUPERADMIN role
- Document Templates gets a `file-text` icon, visible to all ADMIN roles
- A subtle divider separates these items from core HR functions
- Add `userRole` signal to track the current user's role at login

### 3.3 Route Transition Behaviors

| Transition | Animation | Notes |
|-----------|-----------|-------|
| List → Editor | Slide left (detail forward) | Content of list fades, editor slides in |
| Editor → List | Slide right (back) | Unsaved changes dialog if form dirty |
| Any → Company Setup | Fade | No list dependency |
| Employee View → Doc Modal | Overlay modal | Staying on employee page |

---

## 4. Company Setup — Page Specification

### 4.1 Page Layout (Enhanced from Existing)

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: [bank icon] "Company Setup"                    │
│  Breadcrumb: Dashboard > Company Setup           [💾 Save]  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────┐  ┌───────────────────┐  │
│  │  Company Information             │  │  Company Logo      │  │
│  │  ┌────────────┬────────────┐    │  │                    │  │
│  │  │ Name *     │ Phone      │    │  │  ┌───────────┐    │  │
│  │  │ [________] │ [________] │    │  │  │           │    │  │
│  │  ├────────────┼────────────┤    │  │  │  LOGO     │    │  │
│  │  │ Email      │ Website    │    │  │  │  AREA     │    │  │
│  │  │ [________] │ [________] │    │  │  │ (160x160) │    │  │
│  │  ├────────────┴────────────┤    │  │  │           │    │  │
│  │  │ Address (full width)    │    │  │  └───────────┘    │  │
│  │  │ [textarea 2 rows]       │    │  │  [Upload Logo]    │  │
│  │  └─────────────────────────┘    │  │  200x200 PNG/JPG  │  │
│  └─────────────────────────────────┘  └───────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Registration Details                                     │ │
│  │  ┌────────────┬────────────┬────────────┬────────────┐   │ │
│  │  │Reg No      │ GST        │ PAN        │ TAN        │   │ │
│  │  │[________]  │ [________] │ [________] │ [________] │   │ │
│  │  ├────────────┼────────────┼────────────┼────────────┤   │ │
│  │  │ CIN        │ Inc. Date  │ Auth. Signatory           │   │ │
│  │  │ [________] │ [📅____]  │ [____________________]    │   │ │
│  │  └────────────┴────────────┴──────────────────────────┘   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Legal Documents                     [+ Upload Document] │ │
│  │  ┌──────────────┬──────────┬────────────┬────────────┐   │ │
│  │  │ Type         │ File     │ Uploaded   │ Actions    │   │ │
│  │  ├──────────────┼──────────┼────────────┼────────────┤   │ │
│  │  │[GST_CERT]tag │gst.pdf   │ 2 Jan 2026 │ [🗑️]       │   │ │
│  │  │[PAN_CARD]tag │pan.pdf   │ 2 Jan 2026 │ [🗑️]       │   │ │
│  │  └──────────────┴──────────┴────────────┴────────────┘   │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Component Behavior

#### Form Fields & Validation

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Company Name | Text input | ✅ Yes | Max 200 chars |
| Phone | Text input | No | Pattern: optional, max 20 chars |
| Email | Email input | No | Email format |
| Website | Text input | No | URL format |
| Address | Textarea (2 rows) | No | Max 500 chars |
| Registration Number | Text input | No | Max 100 chars |
| GST Number | Text input | No | Pattern: `^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d[Z]{1}[A-Z\d]{1}$` |
| PAN Number | Text input | No | Pattern: `^[A-Z]{5}\d{4}[A-Z]{1}$` |
| TAN Number | Text input | No | Pattern: `^[A-Z]{4}\d{5}[A-Z]{1}$` |
| CIN Number | Text input | No | Pattern: `^[A-Z]{1}\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$` |
| Incorporated Date | Date picker | No | Valid date |
| Authorized Signatory | Text input | No | Max 100 chars |

#### Logo Upload UX

```
┌──────────────────────────────────────┐
│  Logo Section                         │
│                                       │
│  State: Empty                         │
│  ┌────────────────────────────┐      │
│  │          🏦                │      │
│  │   No logo uploaded         │      │
│  │                            │      │
│  │   Dashed border, 160x160   │      │
│  └────────────────────────────┘      │
│                                       │
│  [📤 Upload Logo]                     │
│  Recommended: 200x200px, PNG or JPG   │
│                                       │
│  ─────────────────────────────────    │
│                                       │
│  State: Uploaded                      │
│  ┌────────────────────────────┐      │
│  │                            │      │
│  │     [Image preview]        │      │
│  │                            │      │
│  │   Solid border, 160x160    │      │
│  └────────────────────────────┘      │
│                                       │
│  [📤 Replace Logo]                    │
│                                       │
│  ─────────────────────────────────    │
│                                       │
│  State: Hover/Drag Over               │
│  ┌────────────────────────────┐      │
│  │     Border → primary       │      │
│  │     Background → #f0f4ff   │      │
│  │     "Drop to replace"      │      │
│  └────────────────────────────┘      │
└──────────────────────────────────────┘
```

**Logo Upload Behavior:**
- Click triggers file picker (accept: `image/*`)
- Drag-and-drop support on the preview area
- Immediate client-side preview via `FileReader.readAsDataURL()`
- File validation: Max 2MB, image/jpeg or image/png only
- On error: `nz-message.warning('Invalid file')` 
- Logo is NOT uploaded separately; sent with the company save as multipart
- After save, logo updates in sidebar header immediately

#### Legal Documents Table

**Empty State:**
```
┌──────────────────────────────────────────────┐
│  Legal Documents                [+ Upload]    │
│                                               │
│              📥                              │
│       No documents uploaded                   │
│       Upload GST certificate, PAN card,       │
│       incorporation certificate, etc.         │
│                                               │
│               [📤 Upload Document]             │
└──────────────────────────────────────────────┘
```

**Upload Modal:**
```
┌────────────────────────────────────────┐
│  Upload Legal Document                  │
├────────────────────────────────────────┤
│                                          │
│  Document Type *                         │
│  ┌──────────────────────────────────┐   │
│  │ [▼ GST Certificate            ]  │   │
│  └──────────────────────────────────┘   │
│                                          │
│  File *                                  │
│  ┌──────────────────────────────────┐   │
│  │ 📤 Click to select file          │   │
│  │   or drag & drop                 │   │
│  └──────────────────────────────────┘   │
│                                          │
│         [Cancel]     [📤 Upload]         │
└────────────────────────────────────────┘
```

**Document Type Options:** `GST_CERTIFICATE`, `PAN_CARD`, `INCORPORATION`, `TAX_RETURN`, `AUDIT_REPORT`, `OTHER`

**Delete Behavior:**
- Click trash icon → nz-modal.confirm with danger styling
- Title: "Delete Document"
- Content: `Are you sure you want to delete "{doc.fileName}"?`
- On confirm: API call → success message → table refresh

### 4.3 State Transitions

| State | Visual | Behavior |
|-------|--------|----------|
| **Loading** | 2 skeleton cards (form fields shimmer) | `isLoading = true` |
| **Loaded (empty)** | All fields empty, logo placeholder, no docs | First-time setup |
| **Loaded (data)** | Prefilled fields, logo visible, docs listed | Edit mode |
| **Saving** | Save button shows spinner, fields disabled | `isSaving = true` |
| **Save success** | Green message: "Company updated successfully" | Toast auto-dismiss |
| **Save error** | Red message: specific error from API | Fields remain editable |
| **Uploading doc** | Modal upload button shows spinner | File input disabled |
| **Doc upload success** | Modal closes, table refreshes | Green toast message |
| **Doc upload error** | Error message in modal | Modal stays open |

### 4.4 Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| ≥1024px | 2-column: 2/3 form + 1/3 logo+docs |
| 768-1023px | Single column stacked: form, logo, docs |
| <768px | Single column, full width inputs |

---

## 5. Document Template List — Page Specification

### 5.1 Enhanced Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: [file-text icon] "Document Templates"          │
│  Breadcrumb: Dashboard > Document Templates     [+ Add]     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌── Filter Bar ───────────────────────────────────────────┐ │
│  │  [🔍 Search...____]  [Type: All ▼]  [Status: All ▼]    │ │
│  │                                         [Clear Filters] │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌── Table ─────────────────────────────────────────────────┐ │
│  │  Template Name │ Type              │ Desc      │ Active  │ │
│  │  ──────────────┼───────────────────┼───────────┼─────────┤ │
│  │ 🔗 Joining     │ [JOINING] tag     │ Offer...  │ [✅]    │ │
│  │    Letter       │                   │           │  ON    │ │
│  │ 🔗 Relieving   │ [RELIEVING] tag   │ Exit...   │ [✅]    │ │
│  │    Letter       │                   │           │  ON    │ │
│  │ 🔗 Experience  │ [EXP] tag         │ Cert...   │ [❌]    │ │
│  │                 │                   │           │  OFF   │ │
│  │ ...with pagination 1-10 of 25 ◀ [1][2][3] ▶             │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  Tabs: [📄 Templates]  [📊 Reports]                         │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Filter Behavior

| Filter | Type | Behavior |
|--------|------|----------|
| Search | Text input (debounced 300ms) | Searches template name, description |
| Type | Select dropdown | Populated from `GET /types`, "All Types" default |
| Status | Select dropdown | Options: All, Active, Inactive |
| Clear Filters | Button | Resets all filters to default, reloads list |

### 5.3 Table Columns

| Column | Width | Content | Sortable |
|--------|-------|---------|----------|
| Template Name | 25% | Bold text, `templateName` | ✅ |
| Type | 15% | Color-coded `nz-tag` | ✅ |
| Description | 35% | Truncated text, max 2 lines | ❌ |
| Active | 10% | `nz-switch` toggle (inline) | ❌ |
| Created | 15% | Date formatted `dd MMM yyyy` | ✅ |
| Actions | 80px | `nz-dropdown` with 3-dot menu | ❌ |

### 5.4 Type Color Mapping

| Template Type | Tag Color |
|--------------|-----------|
| JOINING_LETTER | `blue` |
| RELIEVING_LETTER | `orange` |
| EXPERIENCE_LETTER | `purple` |
| OFFER_LETTER | `green` |
| APPOINTMENT_LETTER | `geekblue` |
| SALARY_SLIP | `cyan` |
| CONFIRMATION_LETTER | `lime` |
| TRANSFER_LETTER | `gold` |
| PROMOTION_LETTER | `volcano` |
| WARNING_LETTER | `red` |
| SHOW_CAUSE | `magenta` |
| NOC | `blue-inverse` |
| BONUS_LETTER | `green-inverse` |
| INCREMENT_LETTER | `cyan-inverse` |
| OTHER | `default` |

### 5.5 Row Actions Dropdown

```
┌──────────────────────────┐
│  [3-dot menu button]     │
├──────────────────────────┤
│  ✏️  Edit                │ → /admin/document-templates/:id/edit
│  📋  View                │ → /admin/document-templates/:id
│  ─────────────────────── │
│  ✅ Activate / ⏸ Deact. │ → toggleActive(tpl)
│  ─────────────────────── │
│  🗑️  Delete (red text)   │ → confirm → deactivate soft delete
└──────────────────────────┘
```

### 5.6 Active Toggle Behavior

- Click switch → immediately calls `updateTemplate(id, { active: !tpl.active })`
- Optimistic UI: toggle instantly, revert on error
- Loading state: switch shows small spinner
- Success: message "Template activated/deactivated"
- Error: revert toggle, show error message

---

## 6. Template Editor — Page Specification

### 6.1 Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Page Header: [file-text icon] "New Template" / "Edit: name" │
│  Breadcrumb: Templates > New Template     [🗑️ Delete]       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌── Top Fields Row ───────────────────────────────────────┐ │
│  │  Name: [___________________________]   Type: [▼ JOINING] │ │
│  │  Desc: [___________________________]   Active: [✅]      │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌── Placeholder Sidebar ──────┐  ┌── Content Editor ─────┐ │
│  │  📋 Available Placeholders   │  │                       │ │
│  │                              │  │  Template Content:    │ │
│  │  🔹 EMPLOYEE                │  │  (HTML with variables) │ │
│  │  ┌────────────────────────┐ │  │                       │ │
│  │  │ [Employee Name]  +     │ │  │  ┌─────────────────┐  │ │
│  │  │ [Employee Code]  +     │ │  │  │ <h1>{{company_ │  │ │
│  │  │ [Designation]    +     │ │  │  │ name}}</h1>    │  │ │
│  │  │ [Date of Joining] +    │ │  │  │ <p>Date:       │  │ │
│  │  │ [Gender]         +     │ │  │  │ {{current_date}}│  │ │
│  │  │ [Address]        +     │ │  │  │ </p>          │  │ │
│  │  │ [Mobile]         +     │ │  │  │ <p>To,         │  │ │
│  │  │ [Email]          +     │ │  │  │ {{employee_   │  │ │
│  │  └────────────────────────┘ │  │  │ name}}</p>    │  │ │
│  │                              │  │  │ ...            │  │ │
│  │  🔹 COMPANY                 │  │  └─────────────────┘  │ │
│  │  ┌────────────────────────┐ │  │                       │ │
│  │  │ [Company Name]    +    │ │  │  Line: 24 | Col: 12  │ │
│  │  │ [Company Address] +    │ │  └───────────────────────┘ │
│  │  │ [GST Number]      +    │ │                            │
│  │  └────────────────────────┘ │                            │
│  │                              │                            │
│  │  🔹 SYSTEM                  │                            │
│  │  ┌────────────────────────┐ │                            │
│  │  │ [Current Date]    +    │ │                            │
│  │  │ [Financial Year]  +    │ │                            │
│  │  │ [Authorized       +   │ │                            │
│  │  │  Signatory]           │ │                            │
│  │  └────────────────────────┘ │                            │
│  └─────────────────────────────┘                            │
│                                                               │
│  [💾 Save]  [👁️ Preview with Sample Data]  [✕ Cancel]       │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Placeholder Insert System

#### Available Placeholders (from `TEMPLATE_PLACEHOLDERS` constant)

```
┌──────────────────────────────────────────┐
│  📋 Available Placeholders                │
│                                           │
│  🔹 EMPLOYEE             (expandable)     │
│    Group header with collapse toggle      │
│                                           │
│  [Employee Name]   ➕                     │
│  [Employee Code]   ➕                     │
│  [Designation]     ➕                     │
│  [Date of Joining] ➕                     │
│  [Date of Exit]    ➕                     │
│  [Gender]          ➕                     │
│  [Address]         ➕                     │
│  [Mobile]          ➕                     │
│  [Email]           ➕                     │
│                                           │
│  🔹 COMPANY           (expandable)        │
│  [Company Name]      ➕                   │
│  [Company Address]   ➕                   │
│  [Company Logo URL]  ➕                   │
│  [GST Number]        ➕                   │
│  [PAN Number]        ➕                   │
│  [CIN Number]        ➕                   │
│                                           │
│  🔹 SYSTEM            (expandable)        │
│  [Current Date]      ➕                   │
│  [Financial Year]    ➕                   │
│  [Authorized         ➕                   │
│   Signatory]                              │
└──────────────────────────────────────────┘
```

**Insert Mechanism:**
- Clicking `➕` on a placeholder chip inserts `{{placeholder_key}}` at the cursor position in the editor
- Uses `textarea.selectionStart` / `execCommand` or Monaco-like editor API
- After insert, cursor moves to end of inserted text
- Placeholder chips have micro-animation (scale 0.95→1.0) on click feedback

#### Editor Controls

**Desktop (≥1024px):**
- Two-column layout: left sidebar (280px) for placeholders, right for editor
- Editor is a large textarea (min 500px height) with monospace font
- Line count indicator at bottom-right corner

**Tablet (768-1023px):**
- Collapsible placeholder panel — toggle with button `[📋] Placeholders`
- Panel slides in from left as an overlay
- Editor takes full width

**Mobile (<768px):**
- Placeholder chips shown as a horizontal scrollable row above editor
- Each chip is compact (pill button)
- Editor takes full width, 400px min height

### 6.3 Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Template Name | Text input | ✅ Yes | Max 200 chars, trimmed |
| Template Type | Select dropdown | ✅ Yes | From `GET /types` options |
| Description | Text input | No | Max 500 chars |
| Active | Switch toggle | No | Default: ON (true) |
| Template Content | Textarea (large) | ✅ Yes | Min 10 chars, HTML content |

### 6.4 Preview Modal

```
┌──────────────────────────────────────────────────────────────┐
│  👁️ Preview: Joining Letter — John Doe (EM001)              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────── PDF PREVIEW ──────────────────────────────┐   │
│  │                                                        │   │
│  │              ACME Corp                                 │   │
│  │         123 Business Park, City                        │   │
│  │         GST: 29ABCDE1234Z1Z5                           │   │
│  │                                                        │   │
│  │  ──────────────────────────────────────────────────    │   │
│  │                                                        │   │
│  │  Date: 24-05-2026                                      │   │
│  │                                                        │   │
│  │  To,                                                    │   │
│  │  John Doe                                               │   │
│  │  EM001                                                  │   │
│  │  Engineer                                               │   │
│  │                                                        │   │
│  │  Subject: Joining Letter                                │   │
│  │                                                        │   │
│  │  Dear John Doe,                                         │   │
│  │                                                        │   │
│  │  We are pleased to inform you that you have been       │   │
│  │  appointed as Engineer at ACME Corp...                  │   │
│  │                                                        │   │
│  │  ──────────────────────────────────────────────────    │   │
│  │                                                        │   │
│  │  For ACME Corp                                         │   │
│  │  (Authorized Signatory)                                 │   │
│  │                                                        │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│         [🗑️ Close]              [📄 Download PDF]            │
└──────────────────────────────────────────────────────────────┘
```

**Preview trigger:** Clicking "Preview with Sample Data" opens a modal that:
1. Randomly selects first employee from current list as sample data
2. Calls `GET /preview/{id}?employeeId={sampleId}` 
3. Displays returned HTML in an `iframe` or `div` with `[innerHTML]` sanitized
4. Shows employee name in modal header

**Preview States:**
| State | Display |
|-------|---------|
| Generating | Spin loader in modal body |
| Ready | Rendered HTML preview |
| No sample employee | "No employees found. Add an employee first to preview." |
| Error | "Failed to generate preview. Check template content." |

### 6.5 Form State Management

| State | Behavior |
|-------|----------|
| **New mode** | Empty fields, "Save" button text, "New Template" title |
| **Edit mode** | Prefilled from API, "Update" button text, "Edit: {name}" title |
| **View mode** | Read-only fields, "Edit" button → switches to edit mode |
| **Dirty form** | "You have unsaved changes" warning on navigate away |
| **Saving** | Button spinner, fields disabled |
| **Save success** | Toast + redirect to list |
| **Save error** | Toast with error message, fields remain editable |
| **Delete** | Confirm dialog → deactivate → redirect to list |

---

## 7. Employee Document Download — Modal Specification

### 7.1 Trigger Points

This modal is triggered from **two locations**:

**A. From Employee View Page (StaffMasterViewComponent)**
- Add a "Generate Document" button in the profile actions area
- Button appears for both ADMIN and EMPLOYEE roles
- For EMPLOYEE, only their own profile

**B. From Employee List Page (StaffMasterListComponent)**
- Add a document icon action in the row actions dropdown
- Opens same modal for selected employee

### 7.2 Modal Layout

```
┌──────────────────────────────────────────────────────────────┐
│  📄 Generate Document — John Doe (EM001)                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Select Template:                                             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  [▼ Joining Letter — JOINING_LETTER                   ]  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  Only active templates shown, grouped by type category       │
│                                                               │
│  ┌─── DOCUMENT PREVIEW ────────────────────────────────────┐ │
│  │                                                          │ │
│  │  [HTML content displayed in a bordered, scrollable box   │ │
│  │   with white background, A4-like proportions,            │ │
│  │   max-height: 400px, overflow-y: auto]                   │ │
│  │                                                          │ │
│  │  ACME Corp                                               │ │
│  │  Date: 24-05-2026                                        │ │
│  │  To, John Doe                                            │ │
│  │  Subject: Letter of Appointment                          │ │
│  │  ...                                                     │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  Download Statistics:                                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  📥 Downloads this FY: 3   |   Last: 15-Apr-2026       │  │
│  │  📊 Most used: Joining Letter (12 downloads)            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│         [✕ Cancel]     [📄 Download PDF]  [📝 Download DOCX] │
└──────────────────────────────────────────────────────────────┘
```

### 7.3 Template Selection Behavior

| Aspect | Behavior |
|--------|----------|
| Options source | `GET /document-templates?active=true` |
| Display | `templateName — TemplateType` format |
| Default | First template in list (alphabetical) |
| Empty | "No active templates found. Contact admin." — disabled state |
| Change | On selection change → preview auto-refreshes (debounced 300ms) |

### 7.4 Preview Behavior

- On modal open and template select: call `GET /preview/{templateId}?employeeId={empId}`
- Display returned HTML in a scrollable preview area
- Preview area has a subtle border, white background, 16px padding
- Loading state: skeleton placeholder in preview area
- Error state: "Preview unavailable" with error details

### 7.5 Download Behavior

| Format | Action | API Endpoint |
|--------|--------|-------------|
| PDF | `POST /generate/{id}/{empId}?format=pdf` | Returns HTML → client converts to PDF via `window.print()` or jsPDF |
| DOCX | `POST /generate/{id}/{empId}?format=docx` | Future: returns DOCX blob |

**Download flow:**
1. Click "Download PDF" → button shows spinner
2. API call to `POST /generate/{templateId}/{employeeId}?format=pdf`
3. API logs the download, returns filled HTML string
4. Client opens HTML in new window and triggers print (for PDF save)
5. OR client uses `html2pdf.js` library to convert and download
6. Success: toast "Document generated and downloaded"
7. After download: refresh download stats section in modal
8. Close modal → stats on employee page should update when re-opened

### 7.6 Download Statistics Section

**Placement:** Below preview, left-aligned, compact card

```
┌────────────────────────────────────────────────────────┐
│  📥 Downloads this FY: 3   |   Last: 15-Apr-2026      │
│  📊 Most used: Joining Letter (12 total)               │
└────────────────────────────────────────────────────────┘
```

- Calls `GET /download-logs/employee/{employeeId}` on modal open
- Counts entries where `financialYear` matches current FY
- Shows "No downloads yet this FY" if count is 0

### 7.7 Download History (Expandable)

Below the stats, an optional expandable section:

```
▼ Download History (3 records)
┌────────────────────────────────────────────────────────┐
│ Date              | Template         | Format | User  │
│ 15-Apr-2026       | Joining Letter   | PDF    | ADMIN │
│ 10-Mar-2026       | Relieving Letter | PDF    | ADMIN │
│ 02-Jan-2026       | Experience Cert  | PDF    | ADMIN │
└────────────────────────────────────────────────────────┘
```

- Collapsed by default
- Click "Download History (N records)" to expand
- Fetched from `GET /download-logs/employee/{employeeId}`
- Sorted by date descending

### 7.8 Responsive Behavior

| Breakpoint | Modal Width | Layout |
|-----------|-------------|--------|
| ≥1024px | 720px | Full preview + stats |
| 768-1023px | 90vw | Preview scrollable |
| <768px | 95vw | Stacked, compact preview |

---

## 8. Download Reports — Page Specification

### 8.1 Page Layout (Tab within Document Templates)

```
┌──────────────────────────────────────────────────────────────┐
│  Tabs: [📄 Templates]  [📊 Reports]                         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌── Summary Cards Row ────────────────────────────────────┐ │
│  │  ┌──────────┐  ┌────────────────┐  ┌────────────────┐  │ │
│  │  │   125     │  │  Joining       │  │  Priya Sharma  │  │ │
│  │  │  Total    │  │  Most Used     │  │  Most Active   │  │ │
│  │  │ Downloads │  │  Template      │  │  Employee      │  │ │
│  │  └──────────┘  └────────────────┘  └────────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌── Filters Row ───────────────────────────────────────────┐ │
│  │  Financial Year: [▼ 2026-2027]                           │ │
│  │  Template Type:  [▼ All Templates]                       │ │
│  │  Employee:       [▼ Search employee...]                  │ │
│  │                                               [📥 Export] │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌── Download Log Table ────────────────────────────────────┐ │
│  │  Date & Time         │ Employee  │ Template    │ By     │ │
│  │  ────────────────────┼───────────┼─────────────┼────────┤ │ │
│  │  23-May-2026 10:30   │ EM001     │ Joining     │ ADMIN  │ │
│  │                      │ John Doe  │ Letter      │        │ │
│  │  22-May-2026 14:15   │ EM002     │ Relieving   │ ADMIN  │ │
│  │                      │ Jane S.   │ Letter      │        │ │
│  │  21-May-2026 09:00   │ EM003     │ Experience  │ ADMIN  │ │
│  │                      │ Bob M.    │ Certificate │        │ │
│  │                                                           │ │
│  │  ...with pagination 1-10 of 125 ◀ [1][2][3]...[13] ▶    │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 8.2 Summary Card Specifications

Use the existing `app-stat-card` component with variant customization:

| Card | Icon | Value Source | Footer |
|------|------|-------------|--------|
| Total Downloads | `download` | `GET /download-logs/stats` → sum of all counts | Current FY |
| Most Used Template | `file-text` | Highest count from `perTemplate` | `N downloads` |
| Most Active Employee | `user` | Highest count from `perEmployee` | `N downloads` |

**Stat Card Styling Enhancement:**
```scss
.stat-downloads::before { background: linear-gradient(90deg, #1f3d6e, #2a5298); }
.stat-most-used::before { background: linear-gradient(90deg, #4a90d9, #5ba0e8); }
.stat-most-active::before { background: linear-gradient(90deg, #28a745, #34ce57); }
```

### 8.3 Filter Controls

| Filter | Component | Source | Behavior |
|--------|-----------|--------|----------|
| Financial Year | `nz-select` | `GET /download-logs/financial-years` | Default: current FY |
| Template Type | `nz-select` | `GET /document-templates/types` | Default: "All" |
| Employee | `nz-select` with search | `GET /employees` (basic list) | Searchable, selects by ID |

**Filter Logic:**
- All filters are optional
- API call with all non-null filter params
- "Clear Filters" button resets all to defaults
- Default FY: calculated in client as `currentYear + "-" + (currentYear+1)` for Apr-Mar

### 8.4 Download Log Table

| Column | Width | Content | Sort |
|--------|-------|---------|------|
| Date & Time | 20% | `dd-MMM-yyyy HH:mm` | ✅ Desc by default |
| Employee | 30% | Employee code + name (two lines) | ❌ |
| Template | 25% | Template name with type tag | ❌ |
| Downloaded By | 15% | Username | ❌ |
| Financial Year | 10% | `nz-tag` style FY tag | ✅ |

**Employee column format:**
```html
<div class="employee-cell">
  <span class="emp-code">EM001</span>
  <span class="emp-name">John Doe</span>
</div>
```

### 8.5 Export to Excel

**Flow:**
1. Click "Export" button (visible when data loaded)
2. Button shows spinner "Preparing..."
3. Call same download-logs endpoint with all current filters
4. Transform JSON response to CSV/Excel using `xlsx` library or create CSV blob
5. Trigger download: `filename = "download-reports-{FY}.xlsx"`
6. Toast: "Report exported successfully"

**Export Format:**
| Column Header | Data Field |
|--------------|-----------|
| Date & Time | `downloadedAt` |
| Employee Code | (resolved from employeeId) |
| Employee Name | (resolved from employeeId) |
| Template Name | (resolved from templateId) |
| Template Type | (resolved from templateId) |
| Downloaded By | `downloadedBy` |
| Financial Year | `financialYear` |

### 8.6 Empty State (No Downloads)

```
┌──────────────────────────────────────────────┐
│                                               │
│              📥                              │
│                                               │
│          No Downloads Yet                      │
│                                               │
│    Document downloads will appear here        │
│    once employees start generating            │
│    documents from their profiles.             │
│                                               │
│    [📄 Go to Document Templates]              │
│                                               │
└──────────────────────────────────────────────┘
```

---

## 9. Interaction & State Design

### 9.1 Navigation & Flow Diagram

```
                      ┌─────────────────────┐
                      │  Admin Dashboard    │
                      └──────────┬──────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                   ▼
   ┌─────────────────┐  ┌────────────────┐  ┌──────────────────┐
   │  Company Setup   │  │ Doc Templates  │  │ Employee View    │
   │  /admin/company  │  │  /admin/doc-   │  │  /admin/employees│
   │                  │  │  templates     │  │  /:id            │
   └────────┬─────────┘  └───────┬────────┘  └────────┬─────────┘
            │                    │                     │
            │              ┌─────┴──────┐              │
            │              ▼            ▼              │
            │    ┌────────────────┐  ┌──────────┐     │
            │    │  Template      │  │  Reports  │     │
            │    │  Editor        │  │  Tab      │     │
            │    │  /:id/edit     │  │           │     │
            │    │  /new          │  └──────────┘     │
            │    └────────────────┘                   │
            │                                         │
            │                                    ┌────┴──────┐
            │                                    ▼           ▼
            │                            ┌──────────────────────┐
            │                            │  Generate Document  │
            │                            │  (Modal Overlay)     │
            └────────────────────────────┴──────────────────────┘
```

### 9.2 State Transition Map

```
[Any State]
    │
    ├──→ Loading ───→ Ready ───→ Saving ───→ Success → [Redirect/Refresh]
    │                    │           │
    │                    │           └──→ Error → [Stay on page]
    │                    │
    │                    └──→ Dirty ───→ [Navigate away] → Unsaved Warning
    │                                      │
    │                                      ├──→ Stay → [Back to form]
    │                                      └──→ Discard → [Navigate]
    │
    └──→ Empty State ───→ User Action → [Loading → Ready]
```

### 9.3 Progress Indicators for Multi-Step Flows

**Company Setup Completion Check** (Dashboard integration):
```
┌──────────────────────────────────────────────────────────────┐
│  ⚙️  Setup Checklist                                         │
│     ✅ Company name provided                                 │
│     ⬜ Logo uploaded                                         │
│     ⬜ GST details added                                     │
│     ⬜ Legal documents uploaded                              │
│                                                              │
│     Status: 25% complete — [Go to Company Setup]             │
└──────────────────────────────────────────────────────────────┘
```

This widget appears on the Admin Dashboard when company setup is incomplete (shown only to SUPERADMIN role).

### 9.4 Keyboard Shortcuts

| Shortcut | Context | Action |
|----------|---------|--------|
| `Ctrl + S` | Template Editor | Save template |
| `Ctrl + P` | Preview modal | Print/Download PDF |
| `Escape` | Any modal | Close modal |
| `Ctrl + F` | Template List | Focus search |
| `Tab` / `Shift + Tab` | Editor | Indent/outdent content (future) |

### 9.5 Debounce & Throttle Specifications

| Interaction | Method | Delay |
|------------|--------|-------|
| Template search | Debounce | 300ms |
| Preview refresh on template change | Debounce | 300ms |
| Auto-save draft (template editor) | Throttle | 30s |
| Window resize | Debounce | 150ms |

---

## 10. Empty, Loading & Error States

### 10.1 Empty States

#### A. Company — First Time Setup
**Who sees it:** Superadmin on first login
**Where:** `/admin/company`
**Trigger:** Company record exists with default name "My Company"

```
┌──────────────────────────────────────────────┐
│                                               │
│              🏦  (120px icon)                 │
│                                               │
│         Welcome! Set Up Your Company          │
│                                               │
│    Your company profile hasn't been           │
│    configured yet. Add your company           │
│    details to get started.                    │
│                                               │
│    ✅ Required: Company Name                  │
│    ✅ Recommended: Logo, GST, PAN             │
│                                               │
│         [Get Started →]                       │
│                                               │
└──────────────────────────────────────────────┘
```

#### B. Company Setup Notification (Dashboard)
**Who sees it:** Superadmin on dashboard
**Where:** `/admin/dashboard`, sidebar indicator

```
Sidebar badge: "Company Setup" ⚠️ (red dot)
Dashboard card:
┌──────────────────────────────────────────────┐
│  ⚙️  Company Setup Incomplete                │
│  Your company profile is using default       │
│  values. Complete the setup to enable        │
│  branded document templates.                 │
│                                               │
│         [Complete Setup →]                    │
└──────────────────────────────────────────────┘
```

#### C. No Templates
**Who sees it:** Admin
**Where:** `/admin/document-templates`

```
┌──────────────────────────────────────────────┐
│                                               │
│          📄  (120px icon)                     │
│                                               │
│         No Templates Found                    │
│                                               │
│    Get started by creating your first         │
│    document template for employee letters     │
│    and certificates.                          │
│                                               │
│         [➕ Create Your First Template]        │
│                                               │
└──────────────────────────────────────────────┘
```

#### D. No Search Results (Templates)
**Who sees it:** Admin
**Where:** `/admin/document-templates` — after search/filter

```
┌──────────────────────────────────────────────┐
│                                               │
│            🔍  (80px icon)                    │
│                                               │
│         No Templates Match Your Search        │
│                                               │
│    Try adjusting your search terms or         │
│    filters.                                   │
│                                               │
│    Active filters: [Type: JOINING]            │
│                                               │
│         [Clear All Filters]                   │
│                                               │
└──────────────────────────────────────────────┘
```

#### E. No Active Templates (for document generation)
**Who sees it:** Admin/Employee
**Where:** Generate Document modal

```
┌──────────────────────────────────────────────┐
│                                               │
│     No active templates available.            │
│     Contact your administrator to create      │
│     document templates.                       │
│                                               │
│         [✕ Close]                             │
│                                               │
└──────────────────────────────────────────────┘
```

#### F. No Downloads Yet
**Who sees it:** Admin
**Where:** Reports tab, employee download history

```
┌──────────────────────────────────────────────┐
│                                               │
│           📥  (80px icon)                     │
│                                               │
│         No Downloads Yet                      │
│                                               │
│    Document downloads will appear here        │
│    once documents are generated.              │
│                                               │
└──────────────────────────────────────────────┘
```

### 10.2 Loading States

#### A. Page Load — Skeleton Pattern

```
Company Setup Skeleton:
┌────────────────────────────────────────────────┐
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  (title placeholder 200px)   │
│                                                │
│  ┌────────────────────┐  ┌──────────────────┐ │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓   │ │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓   │ │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  │  (logo circle)   │ │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  └──────────────────┘ │
│  └────────────────────┘                       │
└────────────────────────────────────────────────┘
```

**Skeleton shimmer:** `background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)` with `background-size: 200% 100%` and `animation: shimmer 1.5s infinite`

#### B. Table Loading — Skeleton Rows

```
Document Template List — Loading:
┌────────────────────────────────────────────────┐
│  ▓▓▓▓▓   ▓▓▓▓▓   ▓▓▓▓▓▓▓▓▓▓▓▓▓   ▓▓▓   ▓▓   │  ← 5 shimmer rows
│  ▓▓▓▓▓   ▓▓▓▓▓   ▓▓▓▓▓▓▓▓▓▓▓▓▓   ▓▓▓   ▓▓   │
│  ▓▓▓▓▓   ▓▓▓▓▓   ▓▓▓▓▓▓▓▓▓▓▓▓▓   ▓▓▓   ▓▓   │
│  ▓▓▓▓▓   ▓▓▓▓▓   ▓▓▓▓▓▓▓▓▓▓▓▓▓   ▓▓▓   ▓▓   │
│  ▓▓▓▓▓   ▓▓▓▓▓   ▓▓▓▓▓▓▓▓▓▓▓▓▓   ▓▓▓   ▓▓   │
└────────────────────────────────────────────────┘
```

#### C. Action Loading

| Action | Visual |
|--------|--------|
| Save button | `nzLoading` directive on button |
| Table refresh | `nzLoading` on `nz-table` |
| Preview generation | Skeleton in preview area |
| Document download | Button shows spinner + "Generating..." |
| Document upload (company) | Modal button shows spinner |
| Filter change | `nzLoading` on table, data refresh |

### 10.3 Error States

#### A. API Failure — Page Level

```
┌──────────────────────────────────────────────┐
│  ❌  Failed to load data                       │
│     {error message from API}                  │
│                                               │
│         [🔄 Retry]                            │
└──────────────────────────────────────────────┘
```

- Appears as inline error card at top of content area
- "Retry" button re-triggers the initial API call
- After 3 consecutive failures, show "Service unavailable. Please try again later."

#### B. API Failure — Toast Level (Non-Critical)

For save/update operations:
- Red toast: `nz-notification.error('Error', '{message}', { nzDuration: 5000 })`
- Data remains in current state
- User can retry the action

#### C. Validation Errors — Form Level

| Error Type | Display |
|-----------|---------|
| Required field | Red border on input, "This field is required" below |
| Format error | Red border, "Invalid format. Expected: {pattern}" |
| Duplicate name | Toast: "A template with this name already exists" |
| Content too short | Red border on textarea, "Template content must be at least 10 characters" |

#### D. File Upload Errors

| Error | Message |
|-------|---------|
| File too large | "File exceeds maximum size of 2MB" |
| Wrong format | "Only PDF, JPG, and PNG files are accepted" |
| Upload failed | "Failed to upload file. Please try again." |
| Network error | "Network error. Please check your connection." |

---

## 11. Accessibility & Theme

### 11.1 WCAG 2.1 AA Compliance

All existing accessibility patterns from the main UX architecture apply. Module-specific considerations:

| Element | ARIA Attribute | Value |
|---------|---------------|-------|
| Template editor textarea | `aria-label` | "Template content editor" |
| Placeholder insert buttons | `aria-label` | "Insert {placeholder name} placeholder" |
| Preview iframe | `title` | "Document preview" |
| Summary stat cards | `role="status"` | Live region for dynamic counts |
| Download modal | `role="dialog"`, `aria-modal="true"` | Focus trap |
| Template type tags | `aria-label` | "Template type: {type}" |

### 11.2 Keyboard Navigation

| Element | Tab Order | Keyboard Interaction |
|---------|-----------|---------------------|
| Template list search | 1st focusable | Enter triggers search |
| Filter selects | 2-4th | Arrow keys to navigate |
| Table rows | Skip (not tabbable) | Click to navigate |
| Action dropdown buttons | Next after table | Enter/Space opens menu |
| Editor textarea | Next after sidebar | Tab inserts 2 spaces |
| Placeholder buttons | After editor | Enter/Space inserts at cursor |
| Save/Preview/Cancel | End of form | Enter to activate |

### 11.3 Color & Theme Consistency

The module uses existing CSS variables defined in `styles.scss`:

| Token | Light Theme | Dark Theme |
|-------|------------|------------|
| Page background | `var(--color-bg)` `#f4f6f9` | `#121212` |
| Card background | `var(--color-card)` `#ffffff` | `#1e1e1e` |
| Primary text | `var(--color-text-primary)` `#1a1a2e` | `#e0e0e0` |
| Secondary text | `var(--color-text-secondary)` `#6c757d` | `#b0b0b0` |
| Primary accent | `var(--color-primary-500)` `#1f3d6e` | `#4a90d9` |
| Border | `var(--color-border)` `#dee2e6` | `#333333` |
| Danger | `var(--color-danger)` `#dc3545` | `#ef5350` |
| Success | `var(--color-success)` `#28a745` | `#4caf50` |

**Theme toggle behavior:** The existing theme toggle (light/dark/system) in the admin layout header is respected. All new components use CSS variables exclusively — no hardcoded colors.

### 11.4 Focus Management

| Scenario | Focus Target | Behavior |
|----------|-------------|----------|
| Template Editor opens | Template Name input | Auto-focus on first field |
| Editor loads in edit mode | Template Name input | Prefilled, focus on first field |
| Preview modal opens | Close button (safe choice) | Focus trap in modal |
| Preview modal closes | "Preview" button on editor | Return focus to trigger |
| Delete confirm dialog | Cancel button | Focus on least destructive action |
| Template list loads | Search input | Focus remains on page title |
| Error in form | First invalid field | Scroll to and focus |

---

## 12. Developer Handoff Checklist

### 12.1 File Structure

```
src/app/features/
├── company/
│   └── company-setup.component.ts        ← EXISTING (enhance with UX spec)
├── document-templates/
│   ├── document-template-list.component.ts  ← EXISTING (enhance with UX spec)
│   └── template-editor.component.ts         ← NEW
│
src/app/core/services/
├── company.service.ts                       ← EXISTING (complete)
├── document-template.service.ts             ← EXISTING (complete)
└── download-tracking.service.ts             ← EXISTING (complete)
```

### 12.2 Priority Order for Implementation

| Priority | Component | Dependencies | Effort |
|----------|-----------|-------------|--------|
| **P0** | Routes: add company + document-templates to `app.routes.ts` | AdminLayoutComponent | 0.5 day |
| **P0** | Sidebar: add Company Setup + Document Templates menu items | AdminLayoutComponent | 0.5 day |
| **P0** | Company Setup: validation, logo drag-drop, document upload | CompanyService | 1 day |
| **P0** | Template List: filters, pagination, active toggle | DocumentTemplateService | 1 day |
| **P1** | Template Editor: form, placeholder sidebar, insert mechanism | DocumentTemplateService | 2 days |
| **P1** | Preview Modal: sample data, iframe display, error handling | DocumentTemplateService | 1 day |
| **P1** | Generate Document Modal: from employee view | EmployeeService, DocumentTemplateService | 1.5 days |
| **P2** | Download Reports Tab: stat cards, log table, filters | DownloadTrackingService | 2 days |
| **P2** | Export to Excel | DownloadTrackingService | 0.5 day |
| **P2** | Empty States: all 6 empty state variants | Conditional rendering | 0.5 day |
| **P2** | Dashboard Company Setup Check widget | CompanyService | 0.5 day |
| **P3** | Employee self-service: "My Documents" tab | EmployeeService | 1 day |

### 12.3 ng-zorro-antd Component Usage

| Feature | Component | Module |
|---------|-----------|--------|
| Table | `nz-table` | `NzTableModule` |
| Search input | `nz-input` + `nz-input-group` | `NzInputModule` |
| Select | `nz-select` / `nz-option` | `NzSelectModule` |
| Button | `nz-button` | `NzButtonModule` |
| Switch | `nz-switch` | `NzSwitchModule` |
| Tag | `nz-tag` | `NzTagModule` |
| Modal | `nz-modal` | `NzModalModule` |
| Dropdown | `nz-dropdown` / `nz-dropdown-menu` | `NzDropDownModule` |
| Card | `nz-card` | `NzCardModule` |
| Statistic | `nz-statistic` | `NzStatisticModule` |
| Date picker | `nz-date-picker` | `NzDatePickerModule` |
| Tooltip | `nz-tooltip` | `NzToolTipModule` |
| Notification/Toast | `NzNotificationService` / `NzMessageService` | `NzNotificationModule` / `NzMessageModule` |
| Breadcrumb | `nz-breadcrumb` | `NzBreadCrumbModule` |
| Spin | `nz-spin` | `NzSpinModule` |

### 12.4 Shared Components to Reuse

| Component | Current Location | Usage |
|-----------|-----------------|-------|
| `PageHeaderComponent` | `shared/components/page-header` | All 4 module pages |
| `StatCardComponent` | `shared/components/stat-card` | Reports summary cards |
| `LoadingSpinnerComponent` | `shared/components/loading-spinner` | All page loads |
| `DateFormatPipe` | `shared/pipes/date-format.pipe` | Date formatting in tables |
| `TitleCasePipe` | `shared/pipes/title-case.pipe` | Display value formatting |

### 12.5 CSS Implementation Notes

**New module-specific CSS variables to add to `styles.scss`:**

```css
:root {
  /* Document module tokens */
  --editor-min-height: 500px;
  --preview-max-height: 400px;
  --placeholder-sidebar-width: 280px;
  
  /* Template type tag colors */
  --tag-joining: #1890ff;
  --tag-relieving: #fa8c16;
  --tag-experience: #722ed1;
  --tag-offer: #52c41a;
  --tag-appointment: #2f54eb;
  --tag-salary: #13c2c2;
  --tag-confirmation: #a0d911;
  --tag-transfer: #faad14;
  --tag-promotion: #fa541c;
  --tag-warning: #eb2f96;
  --tag-noc: #1d39c4;
}
```

**Module-specific section styles (consistent with existing patterns):**

```scss
// Template editor layout
.editor-layout {
  display: grid;
  grid-template-columns: var(--placeholder-sidebar-width) 1fr;
  gap: 24px;
  
  @media (max-width: 1023px) {
    grid-template-columns: 1fr;
  }
}

// Placeholder sidebar
.placeholder-sidebar {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  
  .placeholder-group-header {
    padding: 12px 16px;
    font-weight: 700;
    font-size: 13px;
    color: var(--color-primary-500);
    border-bottom: 1px solid var(--color-border-light);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .placeholder-chips {
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .placeholder-chip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    border-radius: var(--radius-md);
    background: var(--color-bg-alt);
    font-size: 12px;
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all 0.15s;
    border: 1px solid transparent;
    
    &:hover {
      border-color: var(--color-primary-200);
      background: var(--color-primary-50);
    }
    
    .insert-btn {
      width: 24px;
      height: 24px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-primary-500);
      color: #fff;
      font-size: 14px;
      cursor: pointer;
      transition: transform 0.15s;
      
      &:hover {
        transform: scale(1.1);
      }
    }
  }
}

// Document preview area
.preview-area {
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  max-height: var(--preview-max-height);
  overflow-y: auto;
  padding: 24px;
  font-family: 'Times New Roman', serif;
  font-size: 12pt;
  line-height: 1.6;
}

// Summary card customization for reports
.report-stat-card {
  .stat-box {
    border-left: 4px solid var(--color-primary-500);
  }
}
```

### 12.6 Route Guards & Permissions

| Route | Guard | Role Check | Notes |
|-------|-------|-----------|-------|
| `/admin/company` | AuthGuard + RoleGuard | `roles: ['ADMIN']` + UI `*ngIf="isSuperadmin"` | Backend also checks role |
| `/admin/document-templates/**` | AuthGuard + RoleGuard | `roles: ['ADMIN']` | All admin roles |
| Generate from `/admin/employees/:id` | AuthGuard + RoleGuard | `roles: ['ADMIN', 'EMPLOYEE']` | EMPLOYEE can only access own ID |

### 12.7 Data Flow Diagrams

#### Template Creation Flow
```
[Template Editor Form]
    │
    ├──→ Client Validation
    │      ├── Fail → [Show inline errors]
    │      └── Pass → [Continue]
    │
    └──→ POST /api/v1/document-templates
           │
           ├── 201 Created → [Toast: "Template created"]
           │                  [Redirect to /admin/document-templates]
           │
           └── 4xx/5xx → [Toast: error message]
                           [Stay on editor, data preserved]
```

#### Document Generation Flow
```
[Employee View Page]
    │
    └──→ [Click "Generate Document"]
           │
           └──→ [Open Modal]
                   │
                   ├──→ GET /document-templates?active=true
                   │     → [Populate template dropdown]
                   │
                   ├──→ [Select Template]
                   │     → GET /preview/{id}?employeeId={empId}
                   │     → [Show preview in iframe]
                   │
                   ├──→ GET /download-logs/employee/{empId}
                   │     → [Show "Downloads this FY" count]
                   │
                   └──→ [Click "Download PDF"]
                         → POST /generate/{id}/{empId}?format=pdf
                         → [Receive HTML → Open in new window → Print]
                         → [Toast: "Document downloaded"]
```

### 12.8 Testing Scenarios

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| First-time company setup | Login as superadmin → navigate to `/admin/company` | Empty state shown, all fields blank |
| Complete company profile | Fill all fields → upload logo → upload GST cert → save | Success toast, logo visible in sidebar |
| Edit company profile | Change company name → save | Existing data prefilled, update succeeds |
| Create template | Navigate to templates → click Add → fill form → use placeholders → save | Template appears in list |
| Edit template | Click edit on a template → modify content → save | Updates reflected in list |
| Preview template | Click Preview → select template → view | Modal shows filled preview with sample data |
| Generate document | Go to employee view → click Generate → select template → Download | PDF downloads, log created |
| View download logs | Go to Templates → Reports tab → check filters | Stats and logs displayed correctly |
| Export reports | Apply filters → click Export | Excel file downloads |
| Delete template | Click delete → confirm | Template deactivated (soft delete) |
| Incomplete company notification | Login as superadmin with incomplete company | Warning on dashboard + sidebar dot |

---

> **Document Version:** 2.0  
> **Author:** ArchitectUX Agent  
> **Review Date:** May 24, 2026  
> **Priority Implementation:** Routes → Sidebar → Template List → Template Editor → Company Setup → Generate Modal → Reports  
> **Handoff Ready:** ✅ All designs align with existing ng-zorro-antd patterns, CSS variables, and backend APIs
