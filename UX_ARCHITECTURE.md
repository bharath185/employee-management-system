# Employee Management System — UX Architecture Specification

> **Version:** 1.0  
> **Date:** May 18, 2026  
> **Author:** ArchitectUX Agent  
> **System:** Employee Management System (EMS)  
> **Theme Color:** `#1f3d6e` (Professional Blue)  
> **Stack:** Angular 17+ (Standalone) | Angular Material | Spring Boot 3.x | MySQL 8

---

## Table of Contents

1. [User Personas](#1-user-personas)
2. [User Journeys](#2-user-journeys)
3. [Information Architecture](#3-information-architecture)
4. [Navigation Design](#4-navigation-design)
5. [Form Design Principles](#5-form-design-principles)
6. [Responsive Design Strategy](#6-responsive-design-strategy)
7. [Interaction Design](#7-interaction-design)
8. [Accessibility](#8-accessibility)
9. [Error Handling UX](#9-error-handling-ux)
10. [Empty States](#10-empty-states)
11. [Screen-by-Screen Wireframe Descriptions](#11-screen-by-screen-wireframe-descriptions)
12. [Developer Handoff Checklist](#12-developer-handoff-checklist)

---

## 1. User Personas

### 1.1 Admin User — HR Manager

**Profile:**
- **Name:** Priya Sharma (representative)
- **Role:** HR Manager / HR Executive
- **Technical skill:** Moderate — comfortable with web applications, form-filling, data entry
- **Frequency of use:** Daily, 4-6 hours per day
- **Primary device:** Desktop (laptop with 1366px-1920px screens)
- **Secondary device:** Tablet for approvals on-the-go

**Goals & Needs:**
- Manage complete employee lifecycle from onboarding to exit
- Enter and maintain 80+ data fields per employee across 10 categories
- Search, filter, and export employee data quickly
- Configure dropdown values (master data) without developer help
- Generate reports for management reviews
- Track changes via audit trail

**Pain Points:**
- Too many fields on a single form are overwhelming
- Cascading dropdowns that don't update correctly cause data errors
- Slow search when the employee count grows (100+)
- Hard to find specific employees without advanced filters

**Success Criteria:**
- Can add a new employee in under 3 minutes
- Can find any employee record within 2 clicks
- Can export a filtered report in under 10 seconds
- Never loses unsaved work

---

### 1.2 Employee User — Staff Member

**Profile:**
- **Name:** Rajesh Kumar (representative)
- **Role:** Software Engineer / Team Member
- **Technical skill:** Varies — basic to moderate
- **Frequency of use:** Monthly or quarterly (to update profile)
- **Primary device:** Mobile phone or personal laptop

**Goals & Needs:**
- View own profile information
- Update personal contact details (mobile, address)
- Upload or change profile photo
- Change password
- View employment history and documents

**Pain Points:**
- Complex forms with too many fields they don't understand
- Can't easily find where to update their mobile number
- Not sure which fields they are allowed to edit vs. read-only
- Photo upload fails without clear error messages

**Success Criteria:**
- Can find profile editing in under 30 seconds
- Can update mobile number in under 1 minute
- Knows exactly which fields are editable
- Receives clear confirmation when changes are saved

---

## 2. User Journeys

### Journey 1: Admin Login → Dashboard

**Flow Overview:**

```
[Login Page] → [Authenticate] → [Dashboard]
```

**Step-by-Step Detailed Flow:**

| Step | Screen | User Action | System Response | UX Notes |
|------|--------|-------------|-----------------|----------|
| 1 | Login | Navigates to `/auth/login` | Display login page with centered card | Full-page layout, no sidebar |
| 2 | Login | Sees branding elements | Company logo at top, system title | Logo: `assets/logo.jpg`, max 180px wide |
| 3 | Login | Enters username (employee code) | Text input with clear label | Placeholder: "Enter Employee Code" |
| 4 | Login | Enters password | Password input with show/hide toggle | Eye icon toggles visibility |
| 5 | Login | Clicks "Sign In" button | Button shows loading spinner | Button text changes to "Signing in..." |
| 6 | Login | (Optional) Checks "Remember Me" | Checkbox persists preference | Extends token storage to local/session |
| 7 | Login | Invalid credentials | Red error message below form | "Invalid username or password. 3 attempts remaining." |
| 8 | Login | Account locked | Yellow warning message | "Account locked due to 5 failed attempts. Try again after 30 minutes." |
| 9 | Login | Valid credentials | JWT stored, redirect to dashboard | Access token → localStorage, redirect to `/admin/dashboard` |
| 10 | Dashboard | View stats overview | 4 stat cards in a row | Total Employees, Active, New This Month, Exited |
| 11 | Dashboard | View charts | Distribution charts load | Gender pie chart, Status bar chart |
| 12 | Dashboard | View recent hires | Table of 5 most recent employees | Photo thumb, name, code, designation, DOJ |
| 13 | Dashboard | Click quick action | Navigate to target page | Quick action buttons: Add Employee, Employee List, Reports |

**Screen Layout — Login Page (ASCII Wireframe):**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│                    ┌─────────────────────────┐                  │
│                    │     [COMPANY LOGO]       │                  │
│                    │                         │                  │
│                    │   Employee Management   │                  │
│                    │        System           │                  │
│                    │                         │                  │
│                    │  ┌───────────────────┐  │                  │
│                    │  │ Employee Code     │  │                  │
│                    │  │ ┌───────────────┐ │  │                  │
│                    │  │ │ EMP0001       │ │  │                  │
│                    │  │ └───────────────┘ │  │                  │
│                    │  └───────────────────┘  │                  │
│                    │                         │                  │
│                    │  ┌───────────────────┐  │                  │
│                    │  │ Password          │  │                  │
│                    │  │ ┌───────────────┐ │  │                  │
│                    │  │ │ ••••••••••   👁│ │  │                  │
│                    │  │ └───────────────┘ │  │                  │
│                    │  └───────────────────┘  │                  │
│                    │                         │                  │
│                    │  ┌────────────────────┐ │                  │
│                    │  │ ◻ Remember Me      │ │                  │
│                    │  └────────────────────┘ │                  │
│                    │                         │                  │
│                    │  ┌───────────────────┐  │                  │
│                    │  │    SIGN IN        │  │                  │
│                    │  └───────────────────┘  │                  │
│                    │                         │                  │
│                    │  Forgot password?       │                  │
│                    └─────────────────────────┘                  │
│                                                                 │
│                     © 2026 Company Name                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Screen Layout — Admin Dashboard (ASCII Wireframe):**

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐│
│ │LOGO│  Employee Management   │    🔔  👤 Admin User  ⬇️  ││
│ └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘│
│ ┌────────┐ ┌──────────────────────────────────────────────────┐│
│ │ 🏠     │ │  Dashboard                                       ││
│ │ Dashbd │ │                                                  ││
│ │        │ │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐││
│ │ 👥     │ │  │ 1,234   │ │ 1,142   │ │   23    │ │   12    │││
│ │ Empl.  │ │  │ Total   │ │ Active  │ │ New     │ │ Exited  │││
│ │        │ │  │Employees │ │Employees│ │ This Mo │ │This Mo  │││
│ │ 🗂️     │ │  └─────────┘ └─────────┘ └─────────┘ └─────────┘││
│ │ Master │ │                                                  ││
│ │        │ │  ┌─────────────────────┐ ┌─────────────────────┐ ││
│ │ 📊     │ │  │  Gender Dist.       │ │  Status Dist.       │ ││
│ │ Report │ │  │  ┌─────┐            │ │  ┌─────┐            │ ││
│ │        │ │  │  │ Pie │            │ │  │ Bar │            │ ││
│ │ ⚙️     │ │  │  │Chart│            │ │  │Chart│            │ ││
│ │ Sett.  │ │  │  └─────┘            │ │  └─────┘            │ ││
│ │        │ │  └─────────────────────┘ └─────────────────────┘ ││
│ │ ◀ Coll.│ │                                                  ││
│ └────────┘ │  ┌──────────────────────────────────────────┐    ││
│            │  │ Recent Employees                          │    ││
│            │  │ ┌────┬──────────┬──────────┬────────────┐ │    ││
│            │  │ │Photo│  Name   │  Code    │  DOJ       │ │    ││
│            │  │ ├────┼──────────┼──────────┼────────────┤ │    ││
│            │  │ │ 🖼 │ John Doe │ EMP0001 │ 15-Jan-2024│ │    ││
│            │  │ │ 🖼 │ Jane S.  │ EMP0002 │ 01-Mar-2024│ │    ││
│            │  │ └────┴──────────┴──────────┴────────────┘ │    ││
│            │  └──────────────────────────────────────────┘    ││
│            │                                                  ││
│            │  Quick Actions: [➕ Add Emp] [👥 All Emps]       ││
│            │                       [📊 Reports]               ││
│            └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

### Journey 2: Add New Employee

**Flow Overview:**

```
[Dashboard / Employee List] → [Click Add Employee] → [Tabbed Form] → [Fill Tabs] → [Save] → [Success]
```

**Step-by-Step Detailed Flow:**

| Step | Screen | User Action | System Response | UX Notes |
|------|--------|-------------|-----------------|----------|
| 1 | Dashboard/List | Clicks "Add Employee" | Navigate to `/admin/employees/new` | Button is primary CTA on dashboard |
| 2 | Form | Form loads | Tab 1 (Personal Info) active, auto-generates employee code | Skeleton loader for master data |
| 3 | Personal Info | Fills required fields | Real-time validation on blur | Required fields marked with * |
| 4 | Personal Info | Enters DOB | Age and Age Bracket auto-calculate | Update on blur, not on every keystroke |
| 5 | Form | Clicks Tab 2 | Tab switches, form data preserved | Auto-save draft to service (in-memory) |
| 6 | Demographics | Selects Social Category | Social Subcategory dropdown filters | Cascade update with loading indicator |
| 7 | Form | Fills remaining tabs | Data accumulates in form model | Progress indicator updates |
| 8 | Exit & Docs | Uploads photo | Drag-drop zone, preview appears | Max 2MB, jpg/png only, immediate preview |
| 9 | Form | Clicks "Create" | Client-side validation passes | Button enabled only when form valid |
| 10 | Form | Validation fails | First tab with errors activated, error fields highlighted | Inline error messages below fields |
| 11 | Form | All valid | Loading spinner on button, API call | "Creating employee..." |
| 12 | Form | Success response | Green toast: "Employee created successfully!" | Toast auto-dismisses after 5s |
| 13 | Form | Redirect | Navigate to employee list or view | Option: "View employee" link in toast |

**Screen Layout — Tabbed Form (ASCII Wireframe):**

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐│
│ │◀ Back  │  Add New Employee            │ 💾Draft │ ✅Create ││
│ └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘│
│                                                                  │
│  Tab Progress: [1●]──[2○]──[3○]──[4○]──[5○]──[6○]──[7○]──[8○]  │
│                   [9○]──[10○]                                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  [Personal Info] [Demo] [Assets] [Ident] [Edu] [Bank]   │   │
│  │  [Empl.] [Family] [Exp/Ref] [Exit/Docs]                  │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  ┌────────────────────┐  ┌────────────────────┐         │   │
│  │  │ Employee Code *    │  │ Prefix *           │         │   │
│  │  │ ┌────────────────┐ │  │ ┌────────────────┐ │         │   │
│  │  │ │ EMP0158        │ │  │ │ Mr. ▼          │ │         │   │
│  │  │ └────────────────┘ │  │ └────────────────┘ │         │   │
│  │  └────────────────────┘  └────────────────────┘         │   │
│  │                                                          │   │
│  │  ┌────────────────────┐  ┌────────────────────┐         │   │
│  │  │ First Name *       │  │ Surname *          │         │   │
│  │  │ ┌────────────────┐ │  │ ┌────────────────┐ │         │   │
│  │  │ │                │ │  │ │                │ │         │   │
│  │  │ └────────────────┘ │  │ └────────────────┘ │         │   │
│  │  └────────────────────┘  └────────────────────┘         │   │
│  │                                                          │   │
│  │  ┌────────────────────┐  ┌────────────────────┐         │   │
│  │  │ Gender *           │  │ Marital Status     │         │   │
│  │  │ ┌────────────────┐ │  │ ┌────────────────┐ │         │   │
│  │  │ │ Male ▼         │ │  │ │ Married ▼      │ │         │   │
│  │  │ └────────────────┘ │  │ └────────────────┘ │         │   │
│  │  └────────────────────┘  └────────────────────┘         │   │
│  │                                                          │   │
│  │  ┌────────────────────┐  ┌────────────────────┐         │   │
│  │  │ Father/Husband     │  │ F/M/H              │         │   │
│  │  │ ┌────────────────┐ │  │ ┌────────────────┐ │         │   │
│  │  │ │                │ │  │ │ Father ▼       │ │         │   │
│  │  │ └────────────────┘ │  │ └────────────────┘ │         │   │
│  │  └────────────────────┘  └────────────────────┘         │   │
│  │                                                          │   │
│  │  ┌────────────────────┐  ┌────────────────────┐         │   │
│  │  │ DOB *              │  │ Age (Auto)         │         │   │
│  │  │ ┌────────────────┐ │  │ ┌────────────────┐ │         │   │
│  │  │ │ 📅 15-May-1998 │ │  │ │ 28             │ │         │   │
│  │  │ └────────────────┘ │  │ └────────────────┘ │         │   │
│  │  └────────────────────┘  └────────────────────┘         │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ Present Address                                  │   │   │
│  │  │ ┌────────────────────────────────────────────────┐│   │   │
│  │  │ │ 123 Main Street, City, State                  ││   │   │
│  │  │ └────────────────────────────────────────────────┘│   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  ┌────────────────────┐  ┌────────────────────┐         │   │
│  │  │ Email              │  │ Mobile *           │         │   │
│  │  │ ┌────────────────┐ │  │ ┌────────────────┐ │         │   │
│  │  │ │ j@company.com  │ │  │ │ 9876543210     │ │         │   │
│  │  │ └────────────────┘ │  │ └────────────────┘ │         │   │
│  │  └────────────────────┘  └────────────────────┘         │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ⚠️ Unsaved changes will be lost if you navigate away            │
└─────────────────────────────────────────────────────────────────┘
```

---

### Journey 3: Search/Filter Employees

**Flow Overview:**

```
[Employee List] → [Search/Filter] → [View Results] → [Click Row] → [View Details]
```

**Step-by-Step Detailed Flow:**

| Step | Screen | User Action | System Response | UX Notes |
|------|--------|-------------|-----------------|----------|
| 1 | Employee List | Navigate to `/admin/employees` | Table loads with paginated data | Show loading skeleton first |
| 2 | List | Types in search box | Debounced (300ms) API call with partial results | Search across name, code, email, mobile |
| 3 | List | Search results update | Table smoothly animates row changes | No full-page reload |
| 4 | List | Clicks "Advanced Filters" | Expandable panel slides down | Animated height transition |
| 5 | Filters | Selects status = "Live" | Table filters immediately | Dropdown applies instantly |
| 6 | Filters | Selects designation = "Engineer" | Additional filter applied | Multiple filters AND together |
| 7 | Filters | Clicks "Clear All" | All filters reset, full list reloads | One-click reset |
| 8 | List | Clicks pagination "Next" | Page 2 loads with same filters | Page number preserved in URL |
| 9 | List | Clicks employee row | Navigate to `/admin/employees/{id}` | Read-only view mode |
| 10 | View | Clicks "Edit" | Navigate to `/admin/employees/{id}/edit` | Same form but prefilled |
| 11 | View | Clicks "Delete" | Confirmation dialog appears | "Are you sure? This employee will be deactivated." |

**Screen Layout — Employee List (ASCII Wireframe):**

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐│
│ │LOGO│  Employee Management   │    🔔  👤 Admin  ⬇️  ││
│ └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘│
│ ┌────────┐ ┌──────────────────────────────────────────────────┐│
│ │ 🏠     │ │  Employee List         [+ Add Employee] [📥Exp] ││
│ │ Dashbd │ │                                  [📤Imp]        ││
│ │        │ │  ┌─Search──────────────────────────────────────┐ ││
│ │ 👥     │ │  │ 🔍 Search by name, code, email, mobile...  │ ││
│ │ Empl.  │ │  └────────────────────────────────────────────┘ ││
│ │        │ │  [▾ Advanced Filters]                           ││
│ │ 🗂️     │ │  ┌────────────────────────────────────────────┐ ││
│ │ Master │ │  │ Status: [All ▼] Designation: [All ▼]      │ ││
│ │        │ │  │ Gender: [All ▼] Religion: [All ▼]         │ ││
│ │ 📊     │ │  │ DOB From: [📅] To: [📅]  [Clear All]    │ ││
│ │ Report │ │  └────────────────────────────────────────────┘ ││
│ │        │ │                                                  ││
│ │ ⚙️     │ │  ┌────┬──────────┬────────┬─────────┬────────┬┐││
│ │ Sett.  │ │  │Code│ Name     │Gender  │Designat │Status  ││││
│ │        │ │  ├────┼──────────┼────────┼─────────┼────────┤│││
│ │ ◀ ▶    │ │  │▶   │John Doe  │Male    │Engineer │Live    ││││
│ │        │ │  │▶   │Jane S.   │Female  │Manager  │Live    ││││
│ │        │ │  │▶   │Bob M.    │Male    │Trainee  │Live    ││││
│ │        │ │  │▶   │Alice K.  │Female  │Engineer │Quit    ││││
│ │        │ │  │▶   │Tom R.    │Male    │Sr Eng.  │Live    ││││
│ │        │ │  └────┴──────────┴────────┴─────────┴────────┘│││
│ │        │ │                                                  ││
│ │        │ │  1-5 of 156  ◀ [1] [2] [3] ... [32] ▶          ││
│ └────────┘ └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

### Journey 4: Employee Self-Service

**Flow Overview:**

```
[Login as Employee] → [Simplified Dashboard] → [My Profile] → [Edit Limited Fields]
```

**Step-by-Step Detailed Flow:**

| Step | Screen | User Action | System Response | UX Notes |
|------|--------|-------------|-----------------|----------|
| 1 | Login | Employee logs in with own credentials | JWT role = `EMPLOYEE` | Same login page, role-based redirect |
| 2 | Dashboard | Sees simplified dashboard | Only own stats: name, code, designation, DOJ, photo | No admin stats or charts |
| 3 | Nav | Sees limited navigation | Only "My Profile" and "Logout" visible | Sidebar shows only relevant options |
| 4 | Profile | Views own profile | Read-only view of all fields | Fields grouped by tab, no edit mode |
| 5 | Profile | Clicks "Edit Profile" | Form opens with limited editable fields | Only contact info, address, family are editable |
| 6 | Edit | Changes mobile number | Field is enabled | Greyed-out fields show lock icon |
| 7 | Edit | Clicks "Update" | Validation runs, API call made | Success toast: "Profile updated!" |
| 8 | Profile | Returns to view | Updated data reflected | Optimistic UI update |

**Screen Layout — Employee Dashboard (ASCII Wireframe):**

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐│
│ │LOGO│  Employee Portal        │    🔔  👤 Rajesh  ⬇️   ││
│ └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘│
│ ┌────────┐ ┌──────────────────────────────────────────────────┐│
│ │        │ │                                                  ││
│ │ 👤     │ │  ┌────────────────────────────────────────┐     ││
│ │ My     │ │  │  Welcome, Rajesh Kumar!                 │     ││
│ │ Profile│ │  │  ┌────────┐                            │     ││
│ │        │ │  │  │ 🖼     │  Employee Code: EMP0042    │     ││
│ │ 🔒     │ │  │  │ Photo  │  Designation: Engineer     │     ││
│ │ Logout │ │  │  └────────┘  Department: Development   │     ││
│ │        │ │  │              Date of Joining: 01-Jun-24│     ││
│ └────────┘ │  └────────────────────────────────────────┘     ││
│            │                                                  ││
│            │  ┌────────────────────────────────────────┐     ││
│            │  │  Quick Actions                          │     ││
│            │  │  [👤 View My Profile] [✏️ Edit Details]  │     ││
│            │  │  [🔑 Change Password]                    │     ││
│            │  └────────────────────────────────────────┘     ││
│            │                                                  ││
│            │  ┌────────────────────────────────────────┐     ││
│            │  │  My Details                            │     ││
│            │  │  ┌──────────────────────────────────┐  │     ││
│            │  │  │ 📧 Email: rajesh@company.com     │  │     ││
│            │  │  │ 📞 Mobile: 9876543210             │  │     ││
│            │  │  │ 🏠 Address: 123 Main Street       │  │     ││
│            │  │  │ 💉 Blood Group: B+                │  │     ││
│            │  │  └──────────────────────────────────┘  │     ││
│            │  └────────────────────────────────────────┘     ││
│            │                                                  ││
│            │  ┌────────────────────────────────────────┐     ││
│            │  │  Recent Activity                        │     ││
│            │  │  • Profile updated on 15-May-2026       │     ││
│            │  │  • Password changed on 01-Apr-2026      │     ││
│            │  └────────────────────────────────────────┘     ││
│            └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Employee Edit Limitations:**

| Tab | Fields Editable by Employee | Read-Only for Employee |
|-----|----------------------------|----------------------|
| Personal Info | Email, Mobile, Present Address, Permanent Address, Close Relative Name/Phone | Employee Code, Name, Prefix, DOB, DOJ, Gender, Marital Status, Father/Husband, Occupation |
| Demographics | None | All fields |
| Assets | None | All fields |
| Identity | None | All fields |
| Education | None | All fields |
| Bank Details | None | All fields |
| Employment | None | All fields |
| Family | Father Name, Father Phone, Mother Name, Mother Phone, Spouse Name, Spouse Phone | — |
| Experience & Ref | None | All fields |
| Exit & Docs | Photo upload | All fields |

---

### Journey 5: Master Data Management

**Flow Overview:**

```
[Admin Dashboard] → [Masters Setup] → [Select Category] → [CRUD Operations]
```

**Step-by-Step Detailed Flow:**

| Step | Screen | User Action | System Response | UX Notes |
|------|--------|-------------|-----------------|----------|
| 1 | Dashboard/Sidebar | Clicks "Masters Setup" | Navigate to `/admin/masters` | Default category selected |
| 2 | Masters | Selects category from dropdown | Table updates with values for that category | Dropdown with all master categories |
| 3 | Masters | Sees existing values | Sorted by sort_order | Columns: Code, Value, Sort Order, Active, Actions |
| 4 | Masters | Clicks "Add Value" | Modal/dialog opens | Inline form or side panel |
| 5 | Add Dialog | Fills Code, Value, Sort Order | Form validation | Code must be unique within category |
| 6 | Add Dialog | Clicks "Save" | API call, table refreshes, toast: "Value added" | Row appears at correct sort position |
| 7 | Masters | Clicks edit icon on a row | Row becomes editable inline | Direct inline editing |
| 8 | Masters | Toggles active/inactive | Visual indicator changes | Inactive items shown with strikethrough/grey |
| 9 | Masters | Clicks delete icon | Confirmation dialog | "Delete [value]? This may affect existing employee records." |
| 10 | Masters | Confirms delete | Soft delete (active=false), row hidden | Values are never hard-deleted |

**Screen Layout — Masters Setup (ASCII Wireframe):**

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐│
│ │◀ Back to Dashboard │  Masters Setup            │              ││
│ └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘│
│                                                                  │
│  Select Category: ┌─────────────────────────┐                    │
│                   │  GENDER              ▼  │  [+ Add New Value] │
│                   └─────────────────────────┘                    │
│                                                                  │
│  ┌─────┬──────────┬───────────┬──────────┬────────────────────┐ │
│  │ #   │ Code     │ Value     │ Sort Ord │ Actions            │ │
│  ├─────┼──────────┼───────────┼──────────┼────────────────────┤ │
│  │ 1   │ MALE     │ Male      │    1     │ [✏️] [🗑️] [● Active] │ │
│  │ 2   │ FEMALE   │ Female    │    2     │ [✏️] [🗑️] [● Active] │ │
│  │ 3   │ OTHER    │ Other     │    3     │ [✏️] [🗑️] [○ Inactive]│ │
│  └─────┴──────────┴───────────┴──────────┴────────────────────┘ │
│                                                                  │
│  ⚠️ Changes to master data reflect immediately in employee forms │
│     Deleting a value will hide it from dropdowns but existing    │
│     employee records will retain the value.                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Information Architecture

### 3.1 Sitemap

```
/ (Root)
│
├── /auth
│   └── /auth/login                          → Login Page (public)
│
├── /admin (requires ADMIN role)
│   ├── /admin/dashboard                     → Admin Dashboard
│   ├── /admin/employees                     → Employee List (table)
│   │   ├── /admin/employees/new             → Add New Employee (tabbed form)
│   │   ├── /admin/employees/:id              → View Employee (read-only)
│   │   └── /admin/employees/:id/edit         → Edit Employee (tabbed form)
│   ├── /admin/masters                       → Master Data Management
│   └── /admin/reports                       → Reports & Export
│
├── /employee (requires EMPLOYEE role)
│   ├── /employee/profile                    → View My Profile (read-only)
│   └── /employee/profile/edit               → Edit My Profile (limited fields)
│
└── /**                                       → Wildcard redirect to /auth/login
```

### 3.2 Content Hierarchy & Page Weight

| Page | Content Loaded | Data Dependencies | Estimated Fields |
|------|---------------|------------------|-----------------|
| Login | Logo, form, copyright | None (static) | 3 |
| Admin Dashboard | 4 stat cards, 2 charts, recent list | `GET /dashboard/stats`, `GET /dashboard/recent` | 8 |
| Employee List | Search bar, filters, table, pagination | `GET /employees` (paginated) | 6+ per row |
| Employee Form | 10 tab components, 80 fields, master data dropdowns | `GET /masters/*` (multiple categories) | 80 |
| Employee View | Read-only display of 80 fields grouped | `GET /employees/{id}` | 80 |
| Masters Setup | Category dropdown, CRUD table, edit dialog | `GET /masters/{category}` | 3+ per row |
| Reports | Report type selector, filter controls, results | `GET /employees/export` | Variable |
| Employee Dashboard | Welcome card, profile summary, quick actions | `GET /employees/{id}` (own) | 10 |
| Employee Profile | Read-only view (employee's own data) | `GET /employees/{id}` | 80 |

### 3.3 Screen Dependency Graph

```
[Login] ──(auth success)──> [Role Decision]
                               │
                    ┌──────────┴──────────┐
                    │                     │
               [ADMIN]               [EMPLOYEE]
                    │                     │
                    ▼                     ▼
          [Admin Dashboard]      [Employee Dashboard]
                    │                     │
        ┌───────────┼───────────┐         │
        │           │           │         │
        ▼           ▼           ▼         ▼
   [Employee    [Masters    [Reports]  [My Profile]
     List]       Setup]                  │
        │                                │
    ┌───┴───┐                       [Edit Profile]
    │       │
  [Add]  [View/:id]
    │       │
    │   [Edit/:id]
    │
  [Save → List]
```

---

## 4. Navigation Design

### 4.1 Navigation Structure

#### Desktop (≥1200px) — Full Left Sidebar + Top Toolbar

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo]  Employee Management System          [🔍] [🔔] [👤 ⬇️] │  ← Top Toolbar (64px)
├──────┬───────────────────────────────────────────────────────┤
│      │                                                       │
│ 🏠   │  Page Content                                        │
│ Dashboard│                                                    │  ← Sidebar (260px)
│      │                                                       │
│ 👥   │                                                       │
│ Employees│                                                    │
│      │                                                       │
│ 🗂️   │                                                       │
│ Masters│                                                     │
│      │                                                       │
│ 📊   │                                                       │
│ Reports│                                                     │
│      │                                                       │
│ ◀    │                                                       │  ← Collapse toggle
└──────┴───────────────────────────────────────────────────────┘
```

**Sidebar Menu Items (Admin):**

| Icon | Label | Route | Active Pattern |
|------|-------|-------|----------------|
| 🏠 | Dashboard | `/admin/dashboard` | Exact match |
| 👥 | Employees | `/admin/employees` | Prefix match (includes `/admin/employees/new`, `/:id`, `/:id/edit`) |
| 🗂️ | Masters Setup | `/admin/masters` | Exact match |
| 📊 | Reports | `/admin/reports` | Exact match |

**Sidebar Menu Items (Employee):**

| Icon | Label | Route | Active Pattern |
|------|-------|-------|----------------|
| 👤 | My Profile | `/employee/profile` | Prefix match |

#### Tablet (768-1199px) — Icon-Only Sidebar + Top Toolbar

```
┌──────────────────────────────────────────────┐
│ [Logo] EMS                   [🔍] [🔔] [👤]  │
├────┬─────────────────────────────────────────┤
│ 🏠 │ Page Content                            │
│ 👥 │                                          │  ← Sidebar (64px, icons only)
│ 🗂️ │                                          │
│ 📊 │                                          │
└────┴─────────────────────────────────────────┘
```

On tablet:
- Sidebar collapses to show icons only (64px width)
- Tooltip appears on hover showing menu label
- Active icon is highlighted with accent color indicator (left border)
- A hamburger menu button appears in the top toolbar as an alternative

#### Mobile (<768px) — Bottom Navigation Bar + Hamburger Menu

```
┌──────────────────────────────────────────────┐
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ ← Back    Page Title           👤    │   │  ← Top bar (56px)
│  └──────────────────────────────────────┘   │
│                                              │
│              Page Content                    │
│                                              │
│                                              │
│                                              │
│                                              │
│                                              │
│                                              │
│                                              │
├──────────────────────────────────────────────┤
│  🏠    👥    🗂️    📊    ☰                 │  ← Bottom nav (56px)
└──────────────────────────────────────────────┘
```

On mobile:
- Bottom navigation bar shows 4 icons + hamburger
- Hamburger opens an overlay menu (from left or bottom sheet)
- Top bar shows back button, page title, optional actions
- Content area between top bar and bottom nav

### 4.2 Breadcrumb Pattern

Breadcrumbs appear on all sub-pages below the toolbar, above the page title:

```
Dashboard > Employees > John Doe
Dashboard > Employees > Add New Employee
Dashboard > Masters Setup
My Profile > Edit Details
```

**Breadcrumb Component:**
- Home (icon) always shown as first item
- Current page is not a link (plain text, bold)
- Separator: `>` (chevron) with 8px margin
- Responsive: On mobile, show only last 2 levels
- Clicking any breadcrumb link navigates without full page reload

### 4.3 Active Route Indicators

| State | Visual Indicator |
|-------|-----------------|
| Active menu item | Left border accent (4px solid `#ff6f00`), background tint (`rgba(31,61,110,0.08)`) |
| Hover state | Background tint (`rgba(31,61,110,0.04)`) |
| Collapsed (tablet) | Active icon has accent color, tooltip shows label |
| Mobile bottom nav | Active icon has accent color, label below icon |

---

## 5. Form Design Principles

### 5.1 Tabbed Interface Design

**Why 10 Tabs?**
The 80 fields are grouped into logical clusters. Presenting them as 10 tabs instead of a single 80-field form:
- Reduces cognitive load (~8 fields per tab average vs. 80 at once)
- Allows users to focus on one category at a time
- Maps directly to the data domains defined in the architecture
- Improves mobile usability (one tab = one scrollable section)

**Tab Bar Behavior:**
- Tabs are displayed as a horizontal scrollable bar (overflow on small screens)
- Tab labels are truncated at 15 characters with ellipsis if needed
- Active tab underlined with accent color (3px)
- Completed tabs show a green checkmark badge (when all required fields in that tab are filled)
- Tabs with validation errors show a red error count badge

**Tab Progress Indicator:**
```
[● Personal]──[○ Demo]──[○ Assets]──[○ Ident]──[○ Edu]──[○ Bank]
 [○ Empl.]──[○ Family]──[○ Exp/Ref]──[○ Exit/Docs]

Legend: ● = Active  ● = Complete with check  ● = Has errors
```

### 5.2 Field Layout Rules

| Rule | Description |
|------|-------------|
| **2-column grid** | Most tabs use a 2-column layout for efficient space use |
| **Full-width exceptions** | Address fields (textarea), Remarks, Photo upload span full width |
| **3-column for short forms** | Demographics (3 fields), Identity (3 fields) use 3-column |
| **Label position** | Above the field (stacked) — best for readability and mobile |
| **Required indicator** | Red asterisk `*` before the label text |
| **Field height** | 48px for inputs, 120px for textareas |
| **Field width** | Equal width within same row, flex: 1 |
| **Gap** | 24px between columns, 20px between rows |

### 5.3 Field Validation Behavior

| Event | Behavior |
|-------|----------|
| **On blur** | Single field validates immediately after user leaves it |
| **On input** | Error clears as user starts typing (only if previously errored) |
| **On tab switch** | All visible fields on current tab validate; if errors, tab switch is blocked with toast |
| **On submit** | Full form validates; first tab with errors is activated and scrolled to first error |
| **On load (edit)** | All existing data passes validation; no pre-emptive errors |

### 5.4 Auto-Calculation Specifications

| Calculation | Trigger | Rule | Display |
|-------------|---------|------|---------|
| **Age from DOB** | DOB field blur | `age = current_year - dob_year` (adjust for month/day) | Read-only integer field, updates immediately |
| **Age Bracket** | Age changes | `≤25` → "25 & Below", `26-30` → "26 to 30", `31-35` → "31 to 35", `36-40` → "36 to 40", `41-50` → "41 to 50", `51+` → "51 & Above" | Read-only text field |
| **Employee Code** | On form load (new) | Auto-generated: `EMP` + 4-digit sequential | Input field populated, user can override? (ADMIN decision: editable) |

### 5.5 Dependent Dropdowns (Cascading)

**Social Category → Social Subcategory:**
```
Social Category: [BC ▼]         (onChange)
Social Subcategory: [BC-A ▼]    (filters to BC-A, BC-B, BC-C, BC-D)
```

| Parent Selection | Available Subcategory Options |
|-----------------|------------------------------|
| BC | BC-A, BC-B, BC-C, BC-D |
| OBC | OBC-A, OBC-B |
| SC | SC-A, SC-B |
| ST | ST |
| OC | OC-A |

**Behavior:**
- When parent changes, child resets to empty/placeholder
- Loading spinner shown briefly while subcategory options reload
- If no subcategories for selected category, child shows "No options" and disables

### 5.6 Photo Upload Specifications

```
┌────────────────────────────────┐
│         Photo Upload           │
│                                │
│    ┌──────────────────┐       │
│    │                  │       │
│    │   📷 Drag & Drop │       │
│    │   or Click to    │       │
│    │   Upload         │       │
│    │                  │       │
│    │   JPG, PNG only  │       │
│    │   Max 2MB        │       │
│    │                  │       │
│    └──────────────────┘       │
│                                │
│    Preview:                    │
│    ┌──────────────────┐       │
│    │     [Image]      │       │
│    │                  │       │
│    │  Photo_Name.jpg  │       │
│    │  [Remove]        │       │
│    └──────────────────┘       │
└────────────────────────────────┘
```

| Feature | Specification |
|---------|--------------|
| Upload zone | Click-to-browse or drag-and-drop |
| Accepted types | `image/jpeg`, `image/png` |
| Max file size | 2MB (display warning if exceeded) |
| Preview | Immediate client-side preview using FileReader API |
| Cropping | Not required (Phase 2) |
| Default | Silhouette/placeholder if no photo |
| Remove | X button on preview removes file from upload queue |

### 5.7 Form Action Bar

Every form page has a consistent action bar at the top:

```
[← Back/Cancel]  [💾 Save Draft]  [✅ Create/Update]
```

| Button | Style | Behavior |
|--------|-------|----------|
| Cancel/Back | Stroked (outline), neutral | Navigate back; if dirty, show unsaved changes warning dialog |
| Save Draft | Flat, secondary | Saves current form state to service (in-memory or to server) |
| Create/Update | Raised, primary | Full validation then API call; disabled when form is invalid |

**"Save Draft" Implementation:**
- On new form: stores form values in `localStorage` keyed by `draft_employee`
- On edit form: auto-saves to service's BehaviorSubject every 30 seconds while user is typing
- Draft indicator shown: `💾 Draft saved at 14:32`

---

## 6. Responsive Design Strategy

### 6.1 Breakpoint System

| Breakpoint | Name | Target Devices | Layout Changes |
|-----------|------|---------------|----------------|
| ≥1200px | Desktop XL | Large monitors | Full sidebar, expanded tables, 2-3 column forms |
| 1024-1199px | Desktop | Standard laptops | Full sidebar, standard tables, 2-column forms |
| 768-1023px | Tablet Landscape ~ Tablet Portrait | iPads, tablets | Icon-only sidebar, reduced table, 1-2 column forms |
| 480-767px | Mobile Large | Phablets, large phones | Bottom nav, card list, 1-column forms |
| <480px | Mobile Small | Small phones | Bottom nav (4 icons), stack everything |

### 6.2 Responsive Behavior by Component

#### Sidebar

| Breakpoint | State | Width | Content |
|-----------|-------|-------|---------|
| ≥1024px | Expanded | 260px | Icons + Labels |
| 768-1023px | Collapsed | 64px | Icons only (tooltips on hover) |
| <768px | Hidden / Overlay | Full overlay | Slide-in drawer from left, triggered by hamburger ☰ |

#### Employee Table

| Breakpoint | Display Mode | Columns Visible |
|-----------|-------------|----------------|
| ≥1024px | Full table | Code, Name, Gender, Designation, Status, DOJ, Actions |
| 768-1023px | Scrollable table | Code, Name, Designation, Status (horizontal scroll) |
| <768px | Card list | Each employee shown as a card with key info |

**Mobile Card Layout (replaces table):**

```
┌──────────────────────────────────────────┐
│  🖼  👤 EMP0042 — Rajesh Kumar          │
│      Engineer · Live                     │
│      📧 rajesh@comp.com  📞 9876543210   │
│      [View] [Edit]                       │
├──────────────────────────────────────────┤
│  🖼  👤 EMP0001 — John Doe              │
│      Sr Engineer · Live                  │
│      📧 john@comp.com  📞 9876543211     │
│      [View] [Edit]                       │
└──────────────────────────────────────────┘
```

#### Tabbed Form

| Breakpoint | Column Layout | Tab Bar |
|-----------|--------------|---------|
| ≥1024px | 2-column grid for fields | Full tab bar visible |
| 768-1023px | 2-column → 1-column on narrow tables | Scrollable tab bar (arrows) |
| <768px | 1-column always | Scrollable tab bar, swipeable |

#### Dashboard Stats

| Breakpoint | Layout |
|-----------|--------|
| ≥1024px | 4 cards in a row (grid of 4) |
| 768-1023px | 2×2 grid |
| <768px | 1 card per row (stacked) |

#### Photo Upload

| Breakpoint | Upload Zone |
|-----------|-------------|
| ≥768px | Full drag-drop zone (300x200px) |
| <768px | Click-to-upload only (compact, 150x150px) |

### 6.3 Touch Targets

| Element | Minimum Touch Target | Spec |
|---------|---------------------|------|
| Buttons | 48×48px | Standard Material button with padding |
| Form inputs | 48px height | Mat-form-field default |
| Sidebar items | 48px height | Full-width clickable area |
| Bottom nav items | 56×56px (icon + label) | Touch-friendly spacing |
| Table rows | 48px minimum | Clickable entire row |
| Dropdown options | 48px height | Mat-option default |
| Toggle switches | 44px height | Material slide-toggle |
| Icon buttons | 48×48px | Extra padding around icon |

---

## 7. Interaction Design

### 7.1 Micro-Interactions & Animations

| Interaction | Animation | Duration | Timing Function |
|-------------|-----------|----------|-----------------|
| Tab switch | Content fades in, slide 8px up | 250ms | ease-out |
| Sidebar collapse | Width transition (260px ↔ 64px) | 300ms | ease-in-out |
| Page navigation | Router-outlet fade transition | 200ms | ease |
| Modal open | Scale up from center (0.95→1.0) + fade | 200ms | ease-out |
| Toast notification | Slide in from top-right | 300ms | ease-out |
| Button loading | Spinner replaces icon/text | Instant | — |
| Search results | Table rows fade out/in | 200ms | ease |
| Filter panel | Height expand (0→auto) | 300ms | ease-out |
| Drag-drop hover | Zone border color changes | 150ms | ease |
| Hover on cards | Elevation increase (2→8dp) | 200ms | ease |
| Error shake | Horizontal shake on invalid field | 300ms | ease |

### 7.2 Loading States

| State | Component | Visual |
|-------|-----------|--------|
| Page load | Entire page | Angular Material `<mat-spinner>` centered (48px), after 500ms show skeleton |
| Component loading | Stats cards | Skeleton cards (grey shimmer animation, 4 rounded rectangles) |
| Table loading | Employee list | 5 skeleton rows (alternating grey bars) |
| Form loading | Tab form | Skeleton form fields (6 input-shaped grey bars in 2-column layout) |
| Save in progress | Submit button | Button text replaced with spinner + "Saving..." |
| Export loading | Export button | Button disabled, shows "Preparing report..." |
| Photo upload | Upload zone | Progress bar below zone (0-100%) |
| Master data load | Dropdown | Dropdown shows "Loading..." disabled state |

**Skeleton Screen Specification:**
```
┌──────────────────────────────────────────────┐
│  ┌──────────────────────┐                     │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ← 40% width bar    │  (Page title skeleton)
│  └──────────────────────┘                     │
│                                               │
│  ┌────────────┐  ┌────────────┐              │
│  │ ▓▓▓▓▓▓▓▓▓▓ │  │ ▓▓▓▓▓▓▓▓▓▓ │              │  (2-column skeleton)
│  └────────────┘  └────────────┘              │
│  ┌────────────┐  ┌────────────┐              │
│  │ ▓▓▓▓▓▓▓▓▓▓ │  │ ▓▓▓▓▓▓▓▓▓▓ │              │
│  └────────────┘  └────────────┘              │
│  ┌──────────────────────────────┐             │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │             │  (Full-width skeleton)
│  └──────────────────────────────┘             │
└──────────────────────────────────────────────┘

Animation: Shimmer gradient moving left to right over 1.5s, repeating
Color: #e0e0e0 base, #f0f0f0 highlight
```

### 7.3 Toast Notification Specifications

| Type | Icon | Background | Duration | Position |
|------|------|-----------|----------|----------|
| Success | ✅ | Green (#4caf50) | 5s or until click | Top-right (desktop), top-center (mobile) |
| Error | ❌ | Red (#d32f2f) | Until dismissed | Top-right (desktop), top-center (mobile) |
| Warning | ⚠️ | Amber (#ff9800) | 7s or until click | Top-right (desktop), top-center (mobile) |
| Info | ℹ️ | Blue (#2196f3) | 5s | Top-right (desktop), top-center (mobile) |

**Toast Actions:**
- Success toast: Optional action button (e.g., "View Employee")
- Error toast: "Retry" button where applicable
- All toasts: Close (X) button in corner
- Stack: Multiple toasts stack vertically with 8px gap

### 7.4 Confirmation Dialogs

| Action | Dialog Title | Message | Buttons |
|--------|-------------|---------|---------|
| Delete Employee | Delete Employee? | "This will deactivate [Name] ([Code]). Their data will be preserved for audit purposes." | Cancel, Delete (red) |
| Cancel with unsaved changes | Unsaved Changes | "You have unsaved changes. Do you want to discard them?" | Stay (secondary), Discard (warn) |
| Delete Master Value | Delete Master Value? | "Delete [Value]? Existing employee records using this value will retain it, but it will no longer appear in dropdowns." | Cancel, Delete |

**Dialog Component:**
- Title: 20px, medium weight
- Message: 14px, regular weight, secondary text color
- Actions: Right-aligned, Cancel first (stroked), Confirm last (raised)
- Backdrop: Semi-transparent black (0.32 opacity)
- ESC key and click-outside close the dialog (unless it's a destructive action requiring explicit confirmation)

### 7.5 Keyboard Shortcuts

| Shortcut | Context | Action |
|----------|---------|--------|
| `Ctrl + S` | Employee Form | Save (if in create/edit mode) |
| `Ctrl + D` | Employee Form | Save Draft |
| `Escape` | Any dialog/modal | Close dialog |
| `Ctrl + F` | Employee List | Focus search bar |
| `Tab` / `Shift + Tab` | Any form | Navigate between fields |
| `Enter` | Login form | Submit login |
| `Ctrl + P` | Report page | Print report |
| `Ctrl + E` | Employee List | Focus "Add Employee" button |
| `?` | Any page | Show keyboard shortcuts help overlay |

### 7.6 Debounce & Throttle Specifications

| Interaction | Method | Delay | Rationale |
|-------------|--------|-------|-----------|
| Search input | Debounce | 300ms | Avoid excessive API calls while typing |
| Window resize | Debounce | 150ms | Responsive layout recalculations |
| Auto-save draft | Throttle | 30s | Save periodically without interrupting workflow |
| Scroll-based lazy load | Throttle | 200ms | Performance for infinite scroll |
| Button double-click prevention | Immediate disable | 0ms | Disable button on first click, re-enable after response |

---

## 8. Accessibility

### 8.1 WCAG 2.1 Compliance Target

| Level | Target | Status |
|-------|--------|--------|
| A | All criteria | ✅ Mandatory |
| AA | All criteria | ✅ Mandatory |
| AAA | Some criteria | 🎯 Aspirational |

### 8.2 Heading Hierarchy

Every page must have a clear heading hierarchy:

| Page | H1 | H2 | H3 |
|------|----|----|-----|
| Login | "Employee Management System" | — | — |
| Admin Dashboard | "Dashboard" | "Overview", "Recent Employees", "Quick Actions" | Stat card values |
| Employee List | "Employees" | "Search & Filter" | — |
| Add Employee | "Add New Employee" | "Personal Info" (tab title) | Field labels |
| Edit Employee | "Edit Employee" | "Bank Details" (tab title) | Field labels |
| View Employee | "John Doe" | "Personal Information", "Bank Details", etc. | — |
| Masters Setup | "Masters Setup" | "GENDER" (selected category) | — |
| Reports | "Reports" | Report results | — |
| Employee Dashboard | "Welcome, Rajesh" | "Quick Actions", "My Details" | — |
| Employee Profile | "My Profile" | "Personal Information", "Employment" | Field groupings |

### 8.3 ARIA Implementation Requirements

| Element | ARIA Attribute | Value / Pattern |
|---------|---------------|-----------------|
| Sidebar nav | `role="navigation"`, `aria-label="Main navigation"` | |
| Sidebar toggle | `aria-expanded="true/false"`, `aria-label="Collapse sidebar"` | |
| Tab list | `role="tablist"`, `aria-label="Employee form sections"` | |
| Tab | `role="tab"`, `aria-selected="true/false"`, `aria-controls="tab-panel-1"` | |
| Tab panel | `role="tabpanel"`, `aria-labelledby="tab-1"` | |
| Modal dialog | `role="dialog"`, `aria-modal="true"`, `aria-labelledby="dialog-title"` | |
| Table | `role="table"`, `aria-label="Employee list"` | |
| Search input | `role="searchbox"`, `aria-label="Search employees"` | |
| Error message | `role="alert"`, `aria-live="assertive"` | |
| Progress bar | `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"` | |
| Toast | `role="alert"`, `aria-live="polite"` | |
| Filter panel | `aria-expanded="true/false"` on toggle button | |
| Required field | `aria-required="true"` | |
| Field with error | `aria-invalid="true"`, `aria-describedby="error-id"` | |
| Breadcrumb | `aria-label="Breadcrumb"`, `role="navigation"` | |
| Loading state | `aria-busy="true"` on container element | |

### 8.4 Color Contrast Requirements

| Token | Light Theme | Dark Theme | Ratio (AA) |
|-------|------------|------------|------------|
| Text primary | `#1f3d6e` on `#ffffff` | `#ffffff` on `#121212` | 10.2:1 ✅ |
| Text secondary | `#5f6368` on `#ffffff` | `#b0b0b0` on `#121212` | 4.8:1 ✅ |
| Link/Accent | `#ff6f00` on `#ffffff` | `#ffab40` on `#121212` | 4.5:1 ✅ |
| Error text | `#d32f2f` on `#ffffff` | `#ef5350` on `#121212` | 4.5:1 ✅ |
| Disabled text | `#9e9e9e` on `#ffffff` | `#616161` on `#121212` | 3.1:1 ❌ (acceptable for disabled) |
| Placeholder | `#9e9e9e` on `#ffffff` | `#616161` on `#121212` | 3.1:1 ❌ (acceptable for placeholder) |

### 8.5 Focus Management

| Scenario | Focus Target | Behavior |
|----------|-------------|----------|
| Page load | First focusable element or H1 | Skip to main content link available |
| Open modal | First focusable element in modal | Focus trap within modal |
| Close modal | Element that triggered the modal | Return focus to trigger |
| Tab switch | First field in new tab | Focus moves to first input |
| Form submit (error) | First invalid field | Scroll to field, focus it, announce error |
| Delete confirm | Cancel button (safe choice) | Focus on least destructive action |
| Toast appears | Toast container | Screen reader announces via `aria-live="polite"` |
| Sidebar toggle | Sidebar nav or hamburger | Focus on first menu item after toggle |

### 8.6 Skip Navigation Link

A "Skip to main content" link is the first focusable element on every page:

```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

**Styling:**
- Visually hidden until focused
- On focus: appears at top of page, z-index 10000, background white, color primary
- Target: `<main id="main-content">` wrapping the router outlet

### 8.7 Screen Reader Announcements

| Event | Announcement Text | Technique |
|-------|------------------|-----------|
| Page loaded | "Dashboard loaded. 156 total employees." | `aria-live="polite"` on main |
| Tab changed | "Personal Info tab selected. 25 fields." | `role="tabpanel"` + `aria-live` |
| Form saved | "Employee created successfully." | Toast with `role="alert"` |
| Error occurred | "Error: Invalid email format." | `aria-live="assertive"` on error |
| Search results | "15 employees match your search." | `aria-live="polite"` |
| Photo uploaded | "Photo uploaded successfully." | Announced when upload completes |
| Navigation | Navigation updates active state | `aria-current="page"` on active link |

---

## 9. Error Handling UX

### 9.1 HTTP Error Code Mapping

| HTTP Code | User-Facing Message | Action | Screen |
|-----------|--------------------|--------|--------|
| 401 Unauthorized | "Your session has expired. Please log in again." | Auto-redirect to `/auth/login` after 3s countdown | Any authenticated page |
| 403 Forbidden | "Access Denied. You do not have permission to view this page." | Show "Go to Dashboard" button | Protected pages |
| 404 Not Found | "Employee not found. The record may have been deleted or you may have an incorrect link." | Show "Back to Employee List" button | Employee view/edit |
| 409 Conflict | "An employee with this code already exists." | Inline error on Employee Code field | Employee form |
| 422 Validation | "Please correct the errors below before saving." | Scroll to first error, highlight fields | Employee form |
| 500 Server Error | "Something went wrong. Please try again." | Show "Retry" button | Any page |
| 503 Service Unavailable | "The service is temporarily unavailable. Please try again later." | Auto-retry after 30s or manual retry | Any page |
| 413 Payload Too Large | "The photo file is too large. Maximum size is 2MB." | Inline error on photo upload | Employee form |
| 415 Unsupported Media | "Only JPG and PNG files are accepted." | Inline error on photo upload | Employee form |
| Network Error | "Unable to connect to the server. Please check your internet connection." | Persistent banner, retry on click | All pages |

### 9.2 Validation Error Display

#### Inline Field Errors

```
┌──────────────────────────────┐
│ Email                        │
│ ┌──────────────────────────┐ │
│ │ invalid-email            │ │
│ └──────────────────────────┘ │
│ ❌ Please enter a valid email │ ← Error text, 12px, red (#d32f2f)
└──────────────────────────────┘
```

- Error appears below the field, 12px font size, red color
- Field border turns red
- Error icon (❗) shown at the right of the input
- Multiple errors can stack below a single field
- Error clears as user types valid input

#### Tab-Level Error Badge

When a tab has validation errors on save/submit:
- Tab label shows red badge with error count: `Personal Info (3)`
- First tab with errors is auto-activated
- First error field is scrolled into view and focused

#### Form-Level Error Summary

Appears at top of form when submitted with errors:

```
┌──────────────────────────────────────────────┐
│ ❌ Please fix the following errors:          │
│   • Tab 1 (Personal Info) — 3 errors         │
│   • Tab 6 (Bank Details) — 1 error           │
│   Click a tab to jump to its errors.         │
└──────────────────────────────────────────────┘
```

### 9.3 Session Expiry UX

**Warning Threshold:** 5 minutes before token expiry

```
┌──────────────────────────────────────────┐
│ ⏰ Your session will expire in 5 minutes  │
│                    [Extend Session]       │
└──────────────────────────────────────────┘
```

- Yellow banner appears at top of page
- "Extend Session" button makes a silent API call to refresh token
- If no action, after 5 minutes token expires and auto-redirects to login
- Unsaved work: Before redirect, save draft to `localStorage` with key `unsaved_<page>`
- On return to login page: Check for unsaved draft, show banner: "You have unsaved work from your last session. [Restore]"

### 9.4 Network Error UX

```
┌──────────────────────────────────────────────────┐
│ 🔴 No internet connection                         │
│ Some features may be unavailable. Data will be    │
│ saved locally and synced when connection resumes. │
│                                         [Dismiss] │
└──────────────────────────────────────────────────┘
```

- Persistent red banner at top of page
- Form inputs remain usable (local state preserved)
- Submit button shows "Save Offline" (stores to localStorage)
- When connection returns, banner updates to green: "Connection restored. [Sync Now]"
- After successful sync, toast: "Your changes have been synced."

### 9.5 API Timeout UX

| Scenario | Timeout | UX |
|----------|---------|-----|
| Employee list load | 15s | Show spinner for 10s, then "Taking longer than expected..." message |
| Employee save | 30s | Button spinner persists; after 20s show "Still saving..." |
| Photo upload | 60s | Progress bar freezes; show retry/remove option |
| Export | 120s | Show "Preparing your report..." with indeterminate progress bar |

---

## 10. Empty States

### 10.1 No Employees (Empty Database)

**When:** First time user logs in, no employees have been added yet.

```
┌──────────────────────────────────────────────┐
│                                              │
│                                              │
│              ┌──────────────────┐            │
│              │                  │            │
│              │   👥 (Illust.)   │            │
│              │                  │            │
│              └──────────────────┘            │
│                                              │
│         No Employees Yet                      │
│         Your employee directory is empty.     │
│         Start by adding your first employee   │
│         to begin building your records.       │
│                                              │
│         [➕ Add Your First Employee]           │
│                                              │
│         Or import from Excel                  │
│         [📤 Import Employees]                 │
│                                              │
└──────────────────────────────────────────────┘
```

- Friendly illustration (team/people icon, 120px)
- Heading: "No Employees Yet"
- Subtitle: "Your employee directory is empty."
- Primary CTA: "Add Your First Employee" → navigates to `/admin/employees/new`
- Secondary CTA: "Import Employees" → opens import dialog

### 10.2 No Search Results

**When:** Search/filter returns zero matches.

```
┌──────────────────────────────────────────────┐
│                                              │
│              ┌──────────────────┐            │
│              │                  │            │
│              │   🔍 (Illust.)   │            │
│              │                  │            │
│              └──────────────────┘            │
│                                              │
│         No Employees Match Your Search        │
│         Try adjusting your search terms       │
│         or clearing filters.                  │
│                                              │
│         [Clear All Filters]                   │
│                                              │
└──────────────────────────────────────────────┘
```

- Show the applied filters below the heading for clarity
- "Clear All Filters" button resets all search/filter inputs
- If search term only: "No results for 'xyz'. Try a different search term."

### 10.3 Empty Master Data Category

**When:** A master data category has no values configured yet.

```
┌──────────────────────────────────────────────┐
│                                              │
│              ┌──────────────────┐            │
│              │                  │            │
│              │   🗂️ (Illust.)   │            │
│              │                  │            │
│              └──────────────────┘            │
│                                              │
│         No Data Configured                    │
│         The "GENDER" category has no          │
│         values. Add values to make them       │
│         available in employee forms.          │
│                                              │
│         [➕ Add First Value]                   │
│                                              │
└──────────────────────────────────────────────┘
```

- Shows the specific category name in the message
- "Add First Value" button opens the CRUD dialog

### 10.4 No Recent Activity (Dashboard)

**When:** Employee dashboard shows no recent activity.

```
┌──────────────────────────────────────────────┐
│                                              │
│         No Recent Changes                     │
│         Your profile information is up to     │
│         date. Any changes you make will       │
│         appear here.                          │
│                                              │
│         [👤 View My Profile]                  │
│                                              │
└──────────────────────────────────────────────┘
```

### 10.5 No Audit Trail Entries

**When:** Viewing audit log for an employee with no tracked changes.

```
┌──────────────────────────────────────────────┐
│                                              │
│         No Changes Recorded                   │
│         This employee's record has not been   │
│         modified since creation.              │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 11. Screen-by-Screen Wireframe Descriptions

### 11.1 Login Screen

**Layout:**
- Full-viewport centered layout
- Background: Gradient from `#1f3d6e` (top) to `#0f2440` (bottom) OR clean white depending on theme
- Card: 420px max-width, white background, 24px border-radius, 8dp elevation
- Logo: Centered at top of card, 160px wide, 48px bottom margin
- Title: "Employee Management System", 24px, bold
- Subtitle: "Sign in to your account", 14px, secondary color
- Form fields: Stacked vertically, 16px bottom margin
- "Remember Me" checkbox: Below password field
- "Sign In" button: Full width, 48px height, primary color, 8px top margin
- Footer: Copyright text, 12px, secondary color
- Links: "Forgot password?" right-aligned below button

**States:**
- Default: Clean form, empty fields
- Loading: Button shows spinner, fields disabled
- Error: Red error message above button (fade in)
- Locked: Yellow warning message, fields disabled

### 11.2 Admin Dashboard

**Layout:**
- Page title: "Dashboard", 28px, bold
- Stats row: 4 cards in CSS Grid (repeat 4, 1fr), 16px gap
  - Each card: 180px height, white, 8px border-radius, 4dp elevation
  - Stat number: 36px, bold, primary color
  - Stat label: 14px, secondary color
  - Icon: 32px, opacity 0.2, behind the number
- Chart row: 2 cards side by side (1fr 1fr), 16px gap
  - Left: Gender Distribution (pie chart)
  - Right: Status Distribution (bar chart)
  - Each chart card: 320px height
- Recent employees: Full-width card below charts
  - Title: "Recent Employees", right-aligned "View All" link
  - Table with 5 columns, 5 rows
- Quick actions: 3 buttons in a row

**States:**
- Loading: 4 skeleton stat cards, 2 skeleton chart cards, skeleton table
- Loaded: Animated counters (numbers count up from 0)
- Empty: No employees → empty state with CTA
- Error: Red banner "Failed to load dashboard data. [Retry]"

### 11.3 Employee List (Table View)

**Layout:**
- Page title: "Employees", right-aligned action buttons (Add, Export, Import)
- Search bar: Full-width, rounded, search icon prefix, clearable
- Advanced filters: Toggleable panel below search
  - Row 1: Status (dropdown), Designation (dropdown), Gender (dropdown)
  - Row 2: Religion (dropdown), DOB Range (date pickers)
  - "Clear All" link right-aligned
- Table: Angular Material `mat-table`
  - Columns: Photo (thumbnail 40px), Code, Name, Gender, Designation, Status, DOJ, Actions (3 icon buttons)
  - Sortable headers (click to sort ascending/descending)
  - Row hover: light highlight
  - Click anywhere on row: navigate to view
- Paginator: Below table
  - Items per page: 10, 25, 50
  - Page numbers with first/last shortcuts
  - Showing "1-10 of 156"

**States:**
- Loading: Skeleton table (5 rows of shimmer)
- Loaded: Data rows with hover states
- Empty: Empty state per section 10.2
- No results: Search-specific empty state
- Error: "Failed to load employees" with retry button

### 11.4 Employee Form (Add/Edit)

**Layout:**
- Header bar: Back button, title ("Add New Employee" or "Edit Employee"), action buttons (Save Draft, Create/Update)
- Tab bar: Horizontal scrollable tabs with badges
- Tab content: Reactive form fields in 2/3-column grid
  - Each tab component manages its own field layout
  - Last tab (Exit & Docs): Photo upload zone included
- Footer: Unsaved changes warning banner (shown when form is dirty)

**Tab Details:**

*Tab 1 — Personal Info (25 fields):*
```
┌────────────────────┬────────────────────┐
│ Employee Code *    │ Prefix *           │
├────────────────────┼────────────────────┤
│ First Name *       │ Surname *          │
├────────────────────┼────────────────────┤
│ Gender *           │ Marital Status     │
├────────────────────┼────────────────────┤
│ Father/Husband     │ F/M/H              │
├────────────────────┼────────────────────┤
│ Occupation of Kin  │ Subcategory        │
├────────────────────┼────────────────────┤
│ Ration Card        │                    │
├────────────────────┼────────────────────┤
│ DOJ                │ Highest Qual.      │
├────────────────────┼────────────────────┤
│ Level of Education │ Year of Passing    │
├────────────────────┼────────────────────┤
│ % of Marks         │                    │
├────────────────────┼────────────────────┤
│ DOB *              │ Age (auto)         │
├────────────────────┼────────────────────┤
│ Age Bracket (auto) │                    │
├────────────────────┴────────────────────┤
│ Present Address (full width)            │
├────────────────────┬────────────────────┤
│ Permanent Address  │ (full width)       │
├────────────────────┼────────────────────┤
│ Email              │ Mobile *           │
├────────────────────┼────────────────────┤
│ Close Relative     │ Relative Mobile    │
└────────────────────┴────────────────────┘
```

*Tab 2 — Demographics (3 fields):*
```
┌────────────────────┬────────────────────┬────────────────────┐
│ Religion           │ Social Category    │ Social Subcategory │
└────────────────────┴────────────────────┴────────────────────┘
```

*Tab 3 — Assets (6 fields):* 3-column grid with Yes/No toggle switches

*Tab 4 — Identity (3 fields):* 3-column grid: Blood Group (dropdown), Aadhar, PAN

*Tab 5 — Education (8 fields):* 4-column for Yes/No toggles, full-width Remarks textarea

*Tab 6 — Bank Details (4 fields):* 2-column grid

*Tab 7 — Employment (8 fields):* 2-column grid

*Tab 8 — Family (6 fields):* 3 groups of name+phone pairs

*Tab 9 — Experience & References (11 fields):* Section with Experience toggle, Reference cards

*Tab 10 — Exit & Documents (5 fields):* Designation, DOE, Deletion Month, Exit Type, Exit Reason, Photo upload

**States:**
- Loading: Skeleton form fields
- New mode: Empty fields, auto-generated employee code
- Edit mode: Prefilled fields, "Create" button changes to "Update"
- Saving: Button spinner, fields disabled
- Validation error: First error tab activated, error fields highlighted
- Success: Toast + redirect
- Error: Toast with retry option

### 11.5 Employee View (Read-Only)

**Layout:**
- Back link: "← Back to Employee List"
- Photo card: Left sidebar (280px), shows photo with "Change Photo" button (admin) or read-only (employee)
- Name/header: Full name (prefix + first + surname), employee code, status badge
- Tabbed view: Same 10 tabs as form but all fields read-only
  - Fields displayed as label: value pairs
  - Values not editable (no input fields)
  - Copy-to-clipboard button on key fields (Employee Code, Aadhar, PAN)
- Action buttons: "Edit", "Delete" (admin), or "Edit Profile" (employee)

**States:**
- Loading: Skeleton layout
- Loaded: Cards with data
- Photo missing: Silhouette placeholder
- Deleted employee: Red "Deactivated" banner across top

### 11.6 Masters Setup

**Layout:**
- Back link or breadcrumb
- Page title: "Masters Setup"
- Category selector: Full-width dropdown (mat-select) with all master categories
- Add button: "[+ Add New Value]" right-aligned
- Table: Code (bold), Value, Sort Order, Active toggle, Actions (Edit, Delete)
- Inline editing: Clicking edit icon makes the row's Value and Sort Order fields editable inline
- Add dialog: Modal with Code (required), Value (required), Sort Order (number, auto)

**States:**
- Loading: Skeleton table
- Loaded: Data rows
- Empty: Empty state per section 10.3
- Saving: Button spinner in dialog

### 11.7 Reports Page

**Layout:**
- Page title: "Reports"
- Report type selector: Card grid with 4 options
  - "Employee Directory" — Full employee list export
  - "Active Employees" — Only active employees
  - "Exit Report" — Employees who have exited
  - "Custom Report" — Select specific fields
- Filter section: Appears after selecting report type
  - Date range (from/to)
  - Status filter
  - Designation filter
- Preview area: Shows first 10 rows of the report
- Export button: "Export to Excel" — triggers download

**States:**
- No report selected: "Select a report type to begin"
- Loading: "Generating preview..."
- Ready: Preview table + "Download" button
- Empty: "No data matches your filter criteria"
- Exporting: Progress bar "Preparing your file..."
- Complete: File download dialog

---

## 12. Developer Handoff Checklist

### 12.1 Priority Order for Implementation

| Priority | Component | Dependencies | Estimated Effort |
|----------|-----------|-------------|-----------------|
| P0 | Login Page + Auth Flow | AuthService, JWT interceptor | 1 day |
| P0 | Admin Layout (Sidebar + Header) | Router, Layout components | 2 days |
| P0 | Dashboard (Stats + Charts) | DashboardService, chart lib | 3 days |
| P0 | Employee List (Table + Search + Filters) | EmployeeService, MatTable | 3 days |
| P0 | Employee Form (10 tabs) | EmployeeService, MasterDataService | 8 days |
| P1 | Employee View (Read-only) | EmployeeService | 2 days |
| P1 | Master Data CRUD | MasterDataService | 2 days |
| P1 | Employee Layout (Self-service) | AuthGuard, EmployeeService | 2 days |
| P2 | Photo Upload | PhotoService | 1 day |
| P2 | Reports Page + Export | ExportImportService | 3 days |
| P2 | Empty States | Conditional rendering | 1 day |
| P3 | Keyboard Shortcuts | Global event listener | 1 day |
| P3 | Animations & Transitions | Angular animations | 2 days |
| P3 | Offline support | Service worker | 2 days |

### 12.2 Key Angular Material Components to Use

| Feature | Material Component | Notes |
|---------|-------------------|-------|
| Sidebar | `mat-sidenav`, `mat-sidenav-container` | Responsive + collapsible |
| Tabs | `mat-tab-group`, `mat-tab` | With `mat-tab-header` for badges |
| Table | `mat-table` with `mat-sort`, `mat-paginator` | Full featured |
| Search | `mat-form-field` with `mat-icon` prefix | Debounced manually |
| Date picker | `mat-datepicker` with `mat-datepicker-toggle` | |
| Select | `mat-select` with `mat-option` | For all dropdowns |
| Dialog | `mat-dialog` | For confirmations and masters add |
| Toast | `mat-snack-bar` | For all notifications |
| Chips | `mat-chip-list` | For multi-select (languages) |
| Progress | `mat-progress-bar`, `mat-spinner` | Loading states |
| Slide toggle | `mat-slide-toggle` | For Yes/No assets fields |
| Badge | `mat-badge` | For tab error counts |

### 12.3 Responsive CSS Breakpoints (Sass Mixins)

```scss
// _mixins.scss

// Mobile first approach
@mixin mobile-only {
  @media (max-width: 767px) { @content; }
}

@mixin tablet-up {
  @media (min-width: 768px) { @content; }
}

@mixin tablet-only {
  @media (min-width: 768px) and (max-width: 1199px) { @content; }
}

@mixin desktop-up {
  @media (min-width: 1200px) { @content; }
}

// Target specific breakpoint
@mixin breakpoint($min, $max: null) {
  @if $max {
    @media (min-width: $min) and (max-width: $max) { @content; }
  } @else {
    @media (min-width: $min) { @content; }
  }
}
```

### 12.4 Theme Token Implementation

The CSS design system should follow the architecture document's `_variables.scss` with these additions for the UX layer:

```scss
// UX-specific tokens
$sidebar-width: 260px;
$sidebar-collapsed: 64px;
$header-height: 64px;
$mobile-header-height: 56px;
$bottom-nav-height: 56px;
$card-border-radius: 8px;
$card-elevation: 2;
$card-hover-elevation: 8;
$transition-speed: 300ms;
$toast-success-bg: #4caf50;
$toast-error-bg: #d32f2f;
$toast-warning-bg: #ff9800;
$toast-info-bg: #2196f3;
$skeleton-base: #e0e0e0;
$skeleton-shimmer: #f0f0f0;
$empty-state-illustration-size: 120px;
```

### 12.5 Route Guard Integration

| Route | Guard(s) | Data Roles | Redirect If Fails |
|-------|----------|------------|-------------------|
| `/admin/**` | `AuthGuard` + `RoleGuard` | `['ADMIN']` | `/auth/login` or `/employee/profile` |
| `/employee/**` | `AuthGuard` + `RoleGuard` | `['EMPLOYEE']` | `/auth/login` or `/admin/dashboard` |
| `/auth/login` | None (public) | — | Already logged in → redirect to role home |

### 12.6 Form Validation Summary (80 Fields)

| Validation Type | Fields | Count |
|----------------|--------|-------|
| Required | employee_code, first_name, surname, gender, dob, mobile | 6 |
| Pattern (regex) | employee_code (`^[A-Z0-9]{8}$`), mobile (`^\d{10}$`), aadhar (`^\d{12}$`), pan (`^[A-Z]{5}\d{4}[A-Z]$`), ifsc (`^[A-Z]{4}0[A-Z0-9]{6}$`), account_number (`^\d{9,18}$`), email (standard), year_of_passing (number 1950-2027), percentage (0-100) | 10 |
| Dependent dropdown | social_subcategory ← social_category | 1 cascade |
| Auto-calculated | age (from dob), age_bracket (from age) | 2 computed |
| Yes/No (from master) | ration_card, has_tv...has_4wheeler, ssc_status...osv, past_experience, aadhar_seeding, uan_activation | 15 |
| Text max length | first_name(40), surname(40), present_address(256), etc. | ~20 fields |
| File validation | photo (jpg/png, max 2MB) | 1 |

---

## Appendices

### A. CSS Design System Foundation

```css
:root {
  /* Primary palette */
  --primary-50: #e3e8f0;
  --primary-100: #b8c6da;
  --primary-200: #8aa0c1;
  --primary-300: #5c7aa8;
  --primary-400: #3a5e95;
  --primary-500: #1f3d6e;
  --primary-600: #1a3460;
  --primary-700: #142b50;
  --primary-800: #0f2240;
  --primary-900: #091830;

  /* Accent */
  --accent-50: #fff3e0;
  --accent-100: #ffe0b2;
  --accent-200: #ffcc80;
  --accent-300: #ffb74d;
  --accent-400: #ffa726;
  --accent-500: #ff6f00;
  --accent-600: #f57c00;
  --accent-700: #e65100;

  /* Semantic colors */
  --success: #4caf50;
  --warning: #ff9800;
  --error: #d32f2f;
  --info: #2196f3;

  /* Text */
  --text-primary: #1f3d6e;
  --text-secondary: #5f6368;
  --text-disabled: #9e9e9e;
  --text-on-primary: #ffffff;

  /* Background */
  --bg-page: #f4f6f9;
  --bg-card: #ffffff;
  --bg-sidebar: #0f2240;
  --bg-header: #ffffff;

  /* Borders */
  --border-color: #e0e0e0;
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 16px;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  /* Typography */
  --font-family: 'Roboto', 'Segoe UI', sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 28px;
  --font-size-4xl: 36px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.12);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 25px rgba(0,0,0,0.15);

  /* Layout */
  --sidebar-width: 260px;
  --sidebar-collapsed: 64px;
  --header-height: 64px;
  --max-content-width: 1400px;
}

[data-theme="dark"] {
  --text-primary: #e0e0e0;
  --text-secondary: #b0b0b0;
  --text-disabled: #616161;
  --bg-page: #121212;
  --bg-card: #1e1e1e;
  --bg-sidebar: #1e1e1e;
  --bg-header: #1e1e1e;
  --border-color: #333333;
}
```

### B. Loading Skeleton Component Template

```html
<!-- Loading skeleton for a form with 2-column layout -->
<div class="skeleton-form" aria-busy="true" aria-label="Loading form">
  <div class="skeleton-title"></div>
  <div class="skeleton-row">
    <div class="skeleton-field"></div>
    <div class="skeleton-field"></div>
  </div>
  <div class="skeleton-row">
    <div class="skeleton-field"></div>
    <div class="skeleton-field"></div>
  </div>
  <div class="skeleton-row">
    <div class="skeleton-field skeleton-full"></div>
  </div>
</div>
```

```scss
.skeleton-form {
  padding: 24px;
}

.skeleton-title {
  height: 32px;
  width: 200px;
  margin-bottom: 24px;
  background: var(--skeleton-base);
  border-radius: 4px;
  animation: shimmer 1.5s infinite;
}

.skeleton-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.skeleton-field {
  height: 48px;
  background: var(--skeleton-base);
  border-radius: 4px;
  animation: shimmer 1.5s infinite;
}

.skeleton-full {
  grid-column: 1 / -1;
}

@keyframes shimmer {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}
```

### C. Toast Notification Component Template

```html
<!-- Toast notification structure -->
<div class="toast-container toast-success" role="alert" aria-live="polite">
  <div class="toast-icon">✅</div>
  <div class="toast-content">
    <div class="toast-title">Success</div>
    <div class="toast-message">Employee created successfully!</div>
  </div>
  <button class="toast-action" aria-label="View employee">View</button>
  <button class="toast-close" aria-label="Dismiss notification">✕</button>
</div>
```

### D. Confirmation Dialog Template

```html
<!-- Confirmation dialog structure -->
<div class="dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <div class="dialog">
    <h2 id="dialog-title" class="dialog-title">Delete Employee?</h2>
    <p class="dialog-message">
      This will deactivate <strong>John Doe (EMP0001)</strong>.
      Their data will be preserved for audit purposes.
    </p>
    <div class="dialog-actions">
      <button class="btn btn-stroked" autofocus>Cancel</button>
      <button class="btn btn-raised btn-danger">Delete</button>
    </div>
  </div>
</div>
```

---

> **Document Version:** 1.0  
> **Author:** ArchitectUX Agent  
> **Review Date:** May 18, 2026  
> **Next Steps:** Hand off to LuxuryDeveloper for implementation. Begin with P0 items: Login, Layout, Dashboard, Employee List, and the 10-tab Employee Form.
