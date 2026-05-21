# Employee Management System — Complete Architecture Document

> **Version:** 1.0  
> **Date:** May 18, 2026  
> **Architect:** Software Architect Agent  
> **Theme Color:** `#1f3d6e` (Professional Blue)  
> **Stack:** Angular 17+ (Standalone) | Spring Boot 3.x | MySQL 8 | JWT Auth

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Excel Source Analysis — 80 Fields](#2-excel-source-analysis--80-fields)
3. [Project Structure](#3-project-structure)
4. [Database Schema (MySQL DDL)](#4-database-schema-mysql-ddl)
5. [Backend Architecture](#5-backend-architecture)
6. [API Contracts (Request/Response)](#6-api-contracts-requestresponse)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Security Architecture](#8-security-architecture)
9. [Component Tree & Data Flow](#9-component-tree--data-flow)
10. [Staff Master — Tab Design](#10-staff-master--tab-design)
11. [Architecture Decision Records](#11-architecture-decision-records)
12. [Evolution Strategy](#12-evolution-strategy)

---

## 1. System Overview

### 1.1 Purpose
The Employee Management System (EMS) is a full-stack web application for managing an organization's complete employee lifecycle — from onboarding through employment to exit. It stores 80+ fields per employee organized across personal, demographic, asset, identity, education, banking, employment, family, experience, reference, and exit data.

### 1.2 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Angular 17 (Standalone Components)              │   │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │   │
│  │  │  Auth   │ │ Dashboard│ │ Staff    │ │ Reports/      │  │   │
│  │  │  Module │ │          │ │ Master   │ │ Masters       │  │   │
│  │  └─────────┘ └──────────┘ └──────────┘ └───────────────┘  │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │         Core: Guards, Interceptors, Services         │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ HTTP (JSON) + JWT Bearer Token
                                 │ CORS: http://localhost:4200
┌────────────────────────────────┴────────────────────────────────────┐
│                         API GATEWAY (Spring Boot)                    │
│  ┌──────────────┐ ┌─────────────────┐ ┌────────────────────────┐   │
│  │  Auth Filter │ │   Controllers   │ │  Global Exception      │   │
│  │  (JWT)       │ │                 │ │  Handler               │   │
│  └──────────────┘ └─────────────────┘ └────────────────────────┘   │
│  ┌──────────────┐ ┌─────────────────┐ ┌────────────────────────┐   │
│  │  Services    │ │  Repositories   │ │  Security (Spring Sec) │   │
│  └──────────────┘ └─────────────────┘ └────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
┌────────────────────────────────┴────────────────────────────────────┐
│                         DATABASE LAYER                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐  │
│  │  employees   │ │    users     │ │ master_data  │ │audit_log │  │
│  │  (all 80     │ │              │ │ (dropdowns)  │ │          │  │
│  │   fields)    │ │              │ │              │ │          │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Angular (Standalone Components) | 17.x |
| UI Library | Angular Material | 17.x |
| State Mgmt | RxJS + Angular Services | 7.x |
| Backend | Spring Boot | 3.2+ |
| JPA Provider | Hibernate | 6.x |
| Database | MySQL | 8.0+ |
| Auth | JWT (jjwt) + Spring Security | 0.12.x |
| Excel Export | Apache POI | 5.x |
| File Upload | Commons FileUpload | 1.5 |
| Build (FE) | Angular CLI / npm | Latest |
| Build (BE) | Maven | 3.9+ |

---

## 2. Excel Source Analysis — 80 Fields

The Excel file `Staff Master_For Software Creation.xlsx` contains exactly **80 columns** across **78+ data rows**. Row 2 contains the header names, Row 3 contains field descriptions/validations.

### 2.1 Complete Field Inventory

| # | Excel Header | Logical Column | Type | Length | Group |
|---|-------------|---------------|------|--------|-------|
| 1 | Employee Code | `employee_code` | VARCHAR | 8 | Personal |
| 2 | Prefix | `prefix` | VARCHAR | 5 | Personal |
| 3 | Name of Employee (Given Name) | `first_name` | VARCHAR | 40 | Personal |
| 4 | Surname of Employee (House Name) | `surname` | VARCHAR | 40 | Personal |
| 5 | Gender | `gender` | VARCHAR | 10 | Personal |
| 6 | Marital status | `marital_status` | VARCHAR | 10 | Personal |
| 7 | Name of Father/M/Husband | `father_husband_name` | VARCHAR | 40 | Personal |
| 8 | F/M/H | `f_m_h` | VARCHAR | 10 | Personal |
| 9 | Occupation of Kin | `occupation_kin` | VARCHAR | 30 | Personal |
| 10 | Occupation of Kin-Sub Category | `occupation_kin_sub` | VARCHAR | 40 | Personal |
| 11 | RATION CARD | `ration_card` | VARCHAR | 5 | Personal |
| 12 | DOJ | `doj` | DATE | - | Personal |
| 13 | Highest Qualification | `highest_qualification` | VARCHAR | 40 | Personal |
| 14 | Level of Education | `level_of_education` | VARCHAR | 20 | Personal |
| 15 | year of passing | `year_of_passing` | INT | - | Personal |
| 16 | % of Marks | `percentage_marks` | DECIMAL(5,2) | - | Personal |
| 17 | DOB | `dob` | DATE | - | Personal |
| 18 | Age (in Years) | `age` | INT | - | Personal |
| 19 | Age Bracket | `age_bracket` | VARCHAR | 15 | Personal |
| 20 | Present address | `present_address` | VARCHAR | 256 | Personal |
| 21 | Permanent Address | `permanent_address` | VARCHAR | 256 | Personal |
| 22 | Mail id | `email` | VARCHAR | 56 | Personal |
| 23 | Mobile number | `mobile` | VARCHAR | 10 | Personal |
| 24 | Close relative/Family members name | `close_relative_name` | VARCHAR | 40 | Personal |
| 25 | Mobile Number | `close_relative_mobile` | VARCHAR | 10 | Personal |
| 26 | Religion | `religion` | VARCHAR | 20 | Demographics |
| 27 | Social Category | `social_category` | VARCHAR | 20 | Demographics |
| 28 | Social Subcategory | `social_subcategory` | VARCHAR | 20 | Demographics |
| 29 | TV | `has_tv` | VARCHAR | 5 | Assets |
| 30 | Fridge | `has_fridge` | VARCHAR | 5 | Assets |
| 31 | Laptop | `has_laptop` | VARCHAR | 5 | Assets |
| 32 | WiFi | `has_wifi` | VARCHAR | 5 | Assets |
| 33 | 2 WL | `has_2wheeler` | VARCHAR | 5 | Assets |
| 34 | 4 WL | `has_4wheeler` | VARCHAR | 5 | Assets |
| 35 | Blood Group | `blood_group` | VARCHAR | 5 | Identity |
| 36 | Aadhar Card Number | `aadhar_number` | VARCHAR | 14 | Identity |
| 37 | PAN | `pan_number` | VARCHAR | 10 | Identity |
| 38 | SSC / Std X | `ssc_status` | VARCHAR | 5 | Education |
| 39 | Intermediate / Std XII | `intermediate_status` | VARCHAR | 5 | Education |
| 40 | Bachelor's Degree | `bachelors_degree` | VARCHAR | 5 | Education |
| 41 | Master's Degree | `masters_degree` | VARCHAR | 5 | Education |
| 42 | Aadhaar | `aadhaar_verification` | VARCHAR | 5 | Education |
| 43 | PAN | `pan_verification` | VARCHAR | 5 | Education |
| 44 | OSV | `osv` | VARCHAR | 5 | Education |
| 45 | Remarks | `remarks` | VARCHAR | 140 | Education |
| 46 | Bank Name | `bank_name` | VARCHAR | 56 | Bank |
| 47 | A/c Number | `account_number` | VARCHAR | 15 | Bank |
| 48 | IFSC | `ifsc_code` | VARCHAR | 11 | Bank |
| 49 | Branch | `branch` | VARCHAR | 40 | Bank |
| 50 | Employee Status | `employee_status` | VARCHAR | 15 | Employment |
| 51 | Process Assigned to | `process_assigned` | VARCHAR | 56 | Employment |
| 52 | ESIC No. | `esic_no` | VARCHAR | 10 | Employment |
| 53 | Aadhar Seeding | `aadhar_seeding` | VARCHAR | 5 | Employment |
| 54 | UAN No. | `uan_no` | VARCHAR | 12 | Employment |
| 55 | PF No. | `pf_no` | VARCHAR | 22 | Employment |
| 56 | UAN Activation | `uan_activation` | VARCHAR | 5 | Employment |
| 57 | Languages Can Speak | `languages_can_speak` | VARCHAR | 100 | Employment |
| 58 | Father Name | `father_name` | VARCHAR | 20 | Family |
| 59 | Father Phone number | `father_phone` | VARCHAR | 10 | Family |
| 60 | Mother Name | `mother_name` | VARCHAR | 20 | Family |
| 61 | Mother Phone number | `mother_phone` | VARCHAR | 10 | Family |
| 62 | Spouse Name | `spouse_name` | VARCHAR | 20 | Family |
| 63 | Spouse Phone number | `spouse_phone` | VARCHAR | 10 | Family |
| 64 | Past Experience | `past_experience` | VARCHAR | 5 | Experience |
| 65 | Name of the Organization(s) | `organization_name` | VARCHAR | 56 | Experience |
| 66 | Period of Employment | `period_of_employment` | VARCHAR | 50 | Experience |
| 67 | Reference 1 Name | `ref1_name` | VARCHAR | 20 | References |
| 68 | Reference 1 Relationship | `ref1_relationship` | VARCHAR | 20 | References |
| 69 | Reference 1 Address | `ref1_address` | VARCHAR | 256 | References |
| 70 | Reference 1 Mobile No. | `ref1_mobile` | VARCHAR | 10 | References |
| 71 | Reference 2 Name | `ref2_name` | VARCHAR | 20 | References |
| 72 | Reference 2 Relationship | `ref2_relationship` | VARCHAR | 20 | References |
| 73 | Reference 2 Address | `ref2_address` | VARCHAR | 256 | References |
| 74 | Reference 2 Mobile No. | `ref2_mobile` | VARCHAR | 10 | References |
| 75 | Designation | `designation` | VARCHAR | 40 | Official |
| 76 | DOE | `doe` | DATE | - | Official |
| 77 | Deletion Month | `deletion_month` | VARCHAR | 10 | Official |
| 78 | Exit Type | `exit_type` | VARCHAR | 30 | Official |
| 79 | Exit Reason | `exit_reason` | VARCHAR | 256 | Official |
| 80 | Photo | `photo_path` | VARCHAR | 255 | Official |

### 2.2 Logical Grouping Summary

| Group | Count | Fields |
|-------|-------|--------|
| Personal Info | 25 | 1-25 |
| Demographics | 3 | 26-28 |
| Assets | 6 | 29-34 |
| Identity | 3 | 35-37 |
| Education + Verification | 8 | 38-45 |
| Bank Details | 4 | 46-49 |
| Employment | 8 | 50-57 |
| Family | 6 | 58-63 |
| Experience | 3 | 64-66 |
| References | 8 | 67-74 |
| Official/Exit | 6 | 75-80 |

---

## 3. Project Structure

### 3.1 Angular Frontend — Full Structure

```
employee-management-ui/
├── .angular/
├── .vscode/
├── node_modules/
├── public/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts              # Prevents unauthenticated access
│   │   │   │   └── role.guard.ts              # Prevents unauthorized role access
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts         # Attaches JWT token to requests
│   │   │   │   └── error.interceptor.ts        # Global HTTP error handling
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts             # Login, logout, token management
│   │   │   │   ├── api.service.ts              # Base HTTP service with CRUD helpers
│   │   │   │   ├── employee.service.ts         # Employee CRUD operations
│   │   │   │   ├── master-data.service.ts      # Dropdown master data
│   │   │   │   ├── dashboard.service.ts        # Dashboard stats/charts
│   │   │   │   ├── export-import.service.ts    # Excel export/import
│   │   │   │   └── photo.service.ts            # Photo upload/download
│   │   │   └── models/
│   │   │       ├── employee.model.ts           # Employee interface (80 fields)
│   │   │       ├── user.model.ts               # User interface
│   │   │       ├── master-data.model.ts        # Master data interface
│   │   │       ├── auth.model.ts               # Login/Register models
│   │   │       ├── api-response.model.ts       # Generic API response wrapper
│   │   │       ├── dashboard.model.ts          # Dashboard stat models
│   │   │       ├── pagination.model.ts         # Paginated response model
│   │   │       └── audit.model.ts              # Audit log model
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── header/
│   │   │   │   │   ├── header.component.ts
│   │   │   │   │   ├── header.component.html
│   │   │   │   │   └── header.component.scss
│   │   │   │   ├── sidebar/
│   │   │   │   │   ├── sidebar.component.ts
│   │   │   │   │   ├── sidebar.component.html
│   │   │   │   │   └── sidebar.component.scss
│   │   │   │   ├── footer/
│   │   │   │   │   ├── footer.component.ts
│   │   │   │   │   ├── footer.component.html
│   │   │   │   │   └── footer.component.scss
│   │   │   │   ├── loading-spinner/
│   │   │   │   │   ├── loading-spinner.component.ts
│   │   │   │   │   ├── loading-spinner.component.html
│   │   │   │   │   └── loading-spinner.component.scss
│   │   │   │   ├── confirm-dialog/
│   │   │   │   │   ├── confirm-dialog.component.ts
│   │   │   │   │   ├── confirm-dialog.component.html
│   │   │   │   │   └── confirm-dialog.component.scss
│   │   │   │   ├── photo-upload/
│   │   │   │   │   ├── photo-upload.component.ts
│   │   │   │   │   ├── photo-upload.component.html
│   │   │   │   │   └── photo-upload.component.scss
│   │   │   │   └── filter-bar/
│   │   │   │       ├── filter-bar.component.ts
│   │   │   │       ├── filter-bar.component.html
│   │   │   │       └── filter-bar.component.scss
│   │   │   └── pipes/
│   │   │       ├── age.pipe.ts                 # Calculate age from DOB
│   │   │       ├── date-format.pipe.ts         # Standard date formatting
│   │   │       ├── safe-url.pipe.ts            # For photo URLs
│   │   │       └── title-case.pipe.ts          # Title case formatting
│   │   ├── layouts/
│   │   │   ├── admin-layout/
│   │   │   │   ├── admin-layout.component.ts
│   │   │   │   ├── admin-layout.component.html  # Header + Sidebar + Router Outlet
│   │   │   │   └── admin-layout.component.scss
│   │   │   └── employee-layout/
│   │   │       ├── employee-layout.component.ts
│   │   │       ├── employee-layout.component.html # Minimal layout for employees
│   │   │       └── employee-layout.component.scss
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   ├── login.component.ts
│   │   │   │   ├── login.component.html
│   │   │   │   └── login.component.scss
│   │   │   └── register/
│   │   │       ├── register.component.ts
│   │   │       ├── register.component.html
│   │   │       └── register.component.scss
│   │   ├── features/
│   │   │   ├── staff-master/
│   │   │   │   ├── staff-master.component.ts       # Main container with tab group
│   │   │   │   ├── staff-master.component.html
│   │   │   │   ├── staff-master.component.scss
│   │   │   │   ├── staff-master-list.component.ts  # Employee list view (table)
│   │   │   │   ├── staff-master-list.component.html
│   │   │   │   ├── staff-master-list.component.scss
│   │   │   │   ├── staff-master-form.component.ts  # Employee form wrapper
│   │   │   │   ├── staff-master-form.component.html
│   │   │   │   ├── staff-master-form.component.scss
│   │   │   │   ├── staff-master-view.component.ts  # Read-only view
│   │   │   │   ├── staff-master-view.component.html
│   │   │   │   ├── staff-master-view.component.scss
│   │   │   │   └── tabs/
│   │   │   │       ├── personal-info-tab/
│   │   │   │       │   ├── personal-info-tab.component.ts
│   │   │   │       │   ├── personal-info-tab.component.html
│   │   │   │       │   └── personal-info-tab.component.scss
│   │   │   │       ├── demographics-tab/
│   │   │   │       │   ├── demographics-tab.component.ts
│   │   │   │       │   ├── demographics-tab.component.html
│   │   │   │       │   └── demographics-tab.component.scss
│   │   │   │       ├── assets-tab/
│   │   │   │       │   ├── assets-tab.component.ts
│   │   │   │       │   ├── assets-tab.component.html
│   │   │   │       │   └── assets-tab.component.scss
│   │   │   │       ├── identity-tab/
│   │   │   │       │   ├── identity-tab.component.ts
│   │   │   │       │   ├── identity-tab.component.html
│   │   │   │       │   └── identity-tab.component.scss
│   │   │   │       ├── education-tab/
│   │   │   │       │   ├── education-tab.component.ts
│   │   │   │       │   ├── education-tab.component.html
│   │   │   │       │   └── education-tab.component.scss
│   │   │   │       ├── bank-tab/
│   │   │   │       │   ├── bank-tab.component.ts
│   │   │   │       │   ├── bank-tab.component.html
│   │   │   │       │   └── bank-tab.component.scss
│   │   │   │       ├── employment-tab/
│   │   │   │       │   ├── employment-tab.component.ts
│   │   │   │       │   ├── employment-tab.component.html
│   │   │   │       │   └── employment-tab.component.scss
│   │   │   │       ├── family-tab/
│   │   │   │       │   ├── family-tab.component.ts
│   │   │   │       │   ├── family-tab.component.html
│   │   │   │       │   └── family-tab.component.scss
│   │   │   │       ├── experience-ref-tab/
│   │   │   │       │   ├── experience-ref-tab.component.ts
│   │   │   │       │   ├── experience-ref-tab.component.html
│   │   │   │       │   └── experience-ref-tab.component.scss
│   │   │   │       └── exit-docs-tab/
│   │   │   │           ├── exit-docs-tab.component.ts
│   │   │   │           ├── exit-docs-tab.component.html
│   │   │   │           └── exit-docs-tab.component.scss
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   ├── dashboard.component.html       # Cards + Charts + Recent
│   │   │   │   └── dashboard.component.scss
│   │   │   ├── reports/
│   │   │   │   ├── reports.component.ts
│   │   │   │   ├── reports.component.html
│   │   │   │   └── reports.component.scss
│   │   │   └── masters/
│   │   │       ├── masters.component.ts
│   │   │       ├── masters.component.html           # CRUD table for master data
│   │   │       └── masters.component.scss
│   │   ├── app.component.ts                         # Root component
│   │   ├── app.component.html
│   │   ├── app.component.scss
│   │   ├── app.config.ts                            # App providers/configuration
│   │   └── app.routes.ts                            # Route definitions
│   ├── assets/
│   │   ├── logo.jpg                                 # Company logo (9.5KB)
│   │   ├── images/
│   │   └── icons/
│   ├── styles/
│   │   ├── _variables.scss                          # Theme variables (#1f3d6e)
│   │   ├── _mixins.scss                             # Responsive mixins
│   │   ├── theme.scss                               # Angular Material theme
│   │   └── global.scss                              # Global styles
│   ├── index.html
│   ├── main.ts
│   ├── styles.scss
│   └── favicon.ico
├── angular.json
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
└── .gitignore
```

### 3.2 Java Spring Boot Backend — Full Structure

```
employee-management-api/
├── src/
│   ├── main/
│   │   ├── java/com/ems/
│   │   │   ├── EmployeeManagementApplication.java     # Spring Boot main class
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java                 # Spring Security + JWT config
│   │   │   │   ├── CorsConfig.java                     # CORS for Angular dev server
│   │   │   │   ├── SwaggerConfig.java                  # OpenAPI 3.0 documentation
│   │   │   │   ├── WebConfig.java                      # Static resources, converters
│   │   │   │   └── AppConfig.java                      # Bean definitions
│   │   │   ├── controller/
│   │   │   │   ├── AuthController.java                 # /api/auth/**
│   │   │   │   ├── EmployeeController.java             # /api/employees/**
│   │   │   │   ├── MasterDataController.java           # /api/masters/**
│   │   │   │   ├── DashboardController.java            # /api/dashboard/**
│   │   │   │   ├── PhotoController.java                # /api/photos/**
│   │   │   │   ├── ExportImportController.java         # /api/export, /api/import
│   │   │   │   ├── AuditController.java                # /api/audit/**
│   │   │   │   └── UserController.java                 # /api/users/**
│   │   │   ├── service/
│   │   │   │   ├── EmployeeService.java                # Employee business logic
│   │   │   │   ├── AuthService.java                    # Authentication logic
│   │   │   │   ├── MasterDataService.java              # Master data CRUD
│   │   │   │   ├── DashboardService.java               # Dashboard aggregation
│   │   │   │   ├── PhotoService.java                   # Photo file handling
│   │   │   │   ├── ExportImportService.java            # Excel export/import
│   │   │   │   ├── AuditService.java                   # Audit trail logic
│   │   │   │   └── UserService.java                    # User management
│   │   │   ├── repository/
│   │   │   │   ├── EmployeeRepository.java             # JPA repository for employees
│   │   │   │   ├── UserRepository.java                 # JPA repository for users
│   │   │   │   ├── MasterDataRepository.java           # JPA repository for master data
│   │   │   │   ├── AuditLogRepository.java             # JPA repository for audit logs
│   │   │   │   ├── RoleRepository.java                 # JPA repository for roles
│   │   │   │   └── EmployeeSpecification.java          # JPA Specification for filtering
│   │   │   ├── model/
│   │   │   │   ├── Employee.java                       # @Entity - all 80 fields
│   │   │   │   ├── User.java                           # @Entity - users
│   │   │   │   ├── Role.java                           # @Entity - roles (ADMIN, EMPLOYEE)
│   │   │   │   ├── MasterData.java                     # @Entity - dropdowns
│   │   │   │   ├── AuditLog.java                       # @Entity - audit trail
│   │   │   │   └── enums/
│   │   │   │       ├── ERole.java                      # ADMIN, EMPLOYEE enum
│   │   │   │       ├── EEmployeeStatus.java            # Live, Quit, etc.
│   │   │   │       └── EExitType.java                  # Resigned, Terminated, etc.
│   │   │   ├── dto/
│   │   │   │   ├── EmployeeDTO.java                    # Employee data transfer object
│   │   │   │   ├── EmployeeListDTO.java                # Lightweight list version
│   │   │   │   ├── LoginRequest.java                   # { username, password }
│   │   │   │   ├── LoginResponse.java                  # { token, role, employee }
│   │   │   │   ├── RegisterRequest.java                # Registration payload
│   │   │   │   ├── ChangePasswordRequest.java          # Password change payload
│   │   │   │   ├── APIResponse.java                    # Generic wrapper { success, msg, data }
│   │   │   │   ├── PagedResponse.java                  # Paginated response wrapper
│   │   │   │   ├── MasterDataDTO.java                  # Master data transfer object
│   │   │   │   ├── DashboardStatsDTO.java              # Dashboard statistics
│   │   │   │   ├── DashboardRecentDTO.java             # Recent employees
│   │   │   │   ├── AuditLogDTO.java                    # Audit log entry
│   │   │   │   └── PhotoResponse.java                  # Photo upload response
│   │   │   ├── security/
│   │   │   │   ├── JwtTokenProvider.java               # JWT creation & validation
│   │   │   │   ├── JwtAuthenticationFilter.java        # OncePerRequestFilter
│   │   │   │   ├── JwtAuthenticationEntryPoint.java    # 401 handler
│   │   │   │   ├── CustomUserDetailsService.java       # Loads user from DB
│   │   │   │   └── CurrentUser.java                    # @CurrentUser annotation
│   │   │   ├── exception/
│   │   │   │   ├── GlobalExceptionHandler.java         # @ControllerAdvice
│   │   │   │   ├── ResourceNotFoundException.java
│   │   │   │   ├── BadRequestException.java
│   │   │   │   ├── UnauthorizedException.java
│   │   │   │   ├── DuplicateResourceException.java
│   │   │   │   ├── FileStorageException.java
│   │   │   │   └── InvalidFileException.java
│   │   │   └── utils/
│   │   │       ├── AgeCalculator.java                  # Compute age from DOB
│   │   │       ├── AgeBracketUtil.java                 # Determine age bracket
│   │   │       ├── EmployeeCodeGenerator.java          # Generate employee codes
│   │   │       ├── AuditLogger.java                    # Aspect-based audit logging
│   │   │       └── ExcelHelper.java                    # Apache POI utilities
│   │   └── resources/
│   │       ├── application.properties                  # DB, JPA, server config
│   │       ├── application-dev.properties              # Dev profile overrides
│   │       ├── application-prod.properties             # Prod profile overrides
│   │       ├── data.sql                                # Initial master data seed
│   │       ├── schema.sql                              # DDL (optional with JPA ddl-auto)
│   │       ├── messages.properties                     # Internationalization
│   │       └── static/
│   │           └── photos/                             # Uploaded employee photos
│   └── test/
│       └── java/com/ems/
│           ├── controller/
│           │   ├── AuthControllerTest.java
│           │   ├── EmployeeControllerTest.java
│           │   └── MasterDataControllerTest.java
│           ├── service/
│           │   ├── EmployeeServiceTest.java
│           │   ├── AuthServiceTest.java
│           │   └── MasterDataServiceTest.java
│           └── repository/
│               └── EmployeeRepositoryTest.java
├── pom.xml
├── .gitignore
├── README.md
└── Dockerfile
```

---

## 4. Database Schema (MySQL DDL)

### 4.1 `employees` Table — All 80 Fields

```sql
CREATE TABLE employees (
    -- Primary Key
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- === PERSONAL INFO GROUP (25 fields) ===
    employee_code VARCHAR(8) NOT NULL UNIQUE COMMENT '4 Alpha; 4 Numeric',
    prefix VARCHAR(5) COMMENT 'Mr. / Ms.',
    first_name VARCHAR(40) NOT NULL,
    surname VARCHAR(40) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    marital_status VARCHAR(10),
    father_husband_name VARCHAR(40),
    f_m_h VARCHAR(10) COMMENT 'F/M/H',
    occupation_kin VARCHAR(30),
    occupation_kin_sub VARCHAR(40),
    ration_card VARCHAR(5) COMMENT 'Yes/No',
    doj DATE COMMENT 'Date of Joining',
    highest_qualification VARCHAR(40),
    level_of_education VARCHAR(20),
    year_of_passing INT,
    percentage_marks DECIMAL(5,2),
    dob DATE COMMENT 'Date of Birth',
    age INT COMMENT 'Computed from DOB',
    age_bracket VARCHAR(15),
    present_address VARCHAR(256),
    permanent_address VARCHAR(256),
    email VARCHAR(56),
    mobile VARCHAR(10),
    close_relative_name VARCHAR(40),
    close_relative_mobile VARCHAR(10),
    
    -- === DEMOGRAPHICS GROUP (3 fields) ===
    religion VARCHAR(20),
    social_category VARCHAR(20),
    social_subcategory VARCHAR(20),
    
    -- === ASSETS GROUP (6 fields) ===
    has_tv VARCHAR(5) COMMENT 'Yes/No',
    has_fridge VARCHAR(5) COMMENT 'Yes/No',
    has_laptop VARCHAR(5) COMMENT 'Yes/No',
    has_wifi VARCHAR(5) COMMENT 'Yes/No',
    has_2wheeler VARCHAR(5) COMMENT 'Yes/No',
    has_4wheeler VARCHAR(5) COMMENT 'Yes/No',
    
    -- === IDENTITY GROUP (3 fields) ===
    blood_group VARCHAR(5),
    aadhar_number VARCHAR(14) COMMENT '12 digits',
    pan_number VARCHAR(10) COMMENT '10 alphanumeric',
    
    -- === EDUCATION GROUP (8 fields) ===
    ssc_status VARCHAR(5) COMMENT 'Yes/No',
    intermediate_status VARCHAR(5) COMMENT 'Yes/No',
    bachelors_degree VARCHAR(5) COMMENT 'Yes/No',
    masters_degree VARCHAR(5) COMMENT 'Yes/No',
    aadhaar_verification VARCHAR(5) COMMENT 'Yes/No',
    pan_verification VARCHAR(5) COMMENT 'Yes/No',
    osv VARCHAR(5) COMMENT 'Yes/No',
    remarks VARCHAR(140),
    
    -- === BANK GROUP (4 fields) ===
    bank_name VARCHAR(56),
    account_number VARCHAR(15),
    ifsc_code VARCHAR(11),
    branch VARCHAR(40),
    
    -- === EMPLOYMENT GROUP (8 fields) ===
    employee_status VARCHAR(15) COMMENT 'Live/Quit/etc',
    process_assigned VARCHAR(56),
    esic_no VARCHAR(10),
    aadhar_seeding VARCHAR(5) COMMENT 'Yes/No',
    uan_no VARCHAR(12),
    pf_no VARCHAR(22),
    uan_activation VARCHAR(5) COMMENT 'Yes/No',
    languages_can_speak VARCHAR(100),
    
    -- === FAMILY GROUP (6 fields) ===
    father_name VARCHAR(20),
    father_phone VARCHAR(10),
    mother_name VARCHAR(20),
    mother_phone VARCHAR(10),
    spouse_name VARCHAR(20),
    spouse_phone VARCHAR(10),
    
    -- === EXPERIENCE GROUP (3 fields) ===
    past_experience VARCHAR(5) COMMENT 'Yes/No',
    organization_name VARCHAR(56),
    period_of_employment VARCHAR(50),
    
    -- === REFERENCES GROUP (8 fields) ===
    ref1_name VARCHAR(20),
    ref1_relationship VARCHAR(20),
    ref1_address VARCHAR(256),
    ref1_mobile VARCHAR(10),
    ref2_name VARCHAR(20),
    ref2_relationship VARCHAR(20),
    ref2_address VARCHAR(256),
    ref2_mobile VARCHAR(10),
    
    -- === OFFICIAL/EXIT GROUP (6 fields) ===
    designation VARCHAR(40),
    doe DATE COMMENT 'Date of Exit',
    deletion_month VARCHAR(10) COMMENT 'MM/YYYY',
    exit_type VARCHAR(30),
    exit_reason VARCHAR(256),
    photo_path VARCHAR(255) COMMENT 'File path to photo',
    
    -- === AUDIT TIMESTAMPS ===
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(20),
    updated_by VARCHAR(20),
    is_deleted BOOLEAN DEFAULT FALSE COMMENT 'Soft delete flag',
    deleted_at TIMESTAMP NULL,
    
    -- INDEXES
    INDEX idx_employee_code (employee_code),
    INDEX idx_gender (gender),
    INDEX idx_employee_status (employee_status),
    INDEX idx_designation (designation),
    INDEX idx_dob (dob),
    INDEX idx_religion (religion),
    INDEX idx_social_category (social_category),
    INDEX idx_is_deleted (is_deleted),
    FULLTEXT INDEX idx_fulltext_name (first_name, surname),
    FULLTEXT INDEX idx_fulltext_address (present_address, permanent_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4.2 `users` Table

```sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(20) NOT NULL UNIQUE COMMENT 'Employee Code as username',
    password VARCHAR(255) NOT NULL COMMENT 'BCrypt encoded',
    role VARCHAR(20) NOT NULL COMMENT 'ADMIN or EMPLOYEE',
    employee_id BIGINT UNIQUE COMMENT 'FK to employees.id',
    enabled BOOLEAN DEFAULT TRUE,
    account_non_locked BOOLEAN DEFAULT TRUE,
    failed_attempt INT DEFAULT 0,
    lock_time TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_users_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4.3 `roles` Table

```sql
CREATE TABLE roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE COMMENT 'ROLE_ADMIN, ROLE_EMPLOYEE',
    description VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data
INSERT INTO roles (name, description) VALUES
('ROLE_ADMIN', 'Administrator with full access'),
('ROLE_EMPLOYEE', 'Employee with limited self-service access');
```

### 4.4 `master_data` Table (Dropdown Master)

```sql
CREATE TABLE master_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(30) NOT NULL COMMENT 'e.g. GENDER, RELIGION, BLOOD_GROUP, etc.',
    code VARCHAR(20) NOT NULL COMMENT 'Internal code',
    value VARCHAR(100) NOT NULL COMMENT 'Display value',
    sort_order INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_category_code (category, code),
    INDEX idx_category (category),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4.5 `audit_log` Table

```sql
CREATE TABLE audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT COMMENT 'FK to employees.id',
    field_name VARCHAR(50) COMMENT 'Name of the changed field',
    old_value VARCHAR(500) COMMENT 'Previous value',
    new_value VARCHAR(500) COMMENT 'New value',
    changed_by VARCHAR(20) COMMENT 'Username who made the change',
    changed_by_role VARCHAR(20) COMMENT 'Role at time of change',
    change_type VARCHAR(20) COMMENT 'CREATE / UPDATE / DELETE',
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_employee_id (employee_id),
    INDEX idx_changed_at (changed_at),
    INDEX idx_change_type (change_type),
    CONSTRAINT fk_audit_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4.6 Entity-Relationship Diagram (Text)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│   employees  │       │    users     │       │    master_data   │
├──────────────┤       ├──────────────┤       ├──────────────────┤
│ id (PK)      │◄──────│ employee_id  │       │ id (PK)          │
│ employee_code│──>───>│ username     │       │ category         │
│ ...80 fields │       │ password     │       │ code             │
│ created_at   │       │ role         │       │ value            │
│ is_deleted   │       │ enabled      │       │ sort_order       │
└──────────────┘       └──────────────┘       │ active           │
       │                                      └──────────────────┘
       │
       │  ┌──────────────┐
       └──│  audit_log   │
          ├──────────────┤
          │ employee_id  │
          │ field_name   │
          │ old_value    │
          │ new_value    │
          │ changed_by   │
          │ changed_at   │
          └──────────────┘
```

---

## 5. Backend Architecture

### 5.1 Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Single entity for 80 fields | Single `Employee` entity | All fields belong to one aggregate; avoids unnecessary joins |
| Soft delete | `is_deleted` column | Recoverability; audit compliance |
| Photo storage | File system path in DB | Simpler than BLOB; easier backup; works with CDN later |
| Age computation | Auto-calculated from DOB | Prevents inconsistency; @PrePersist/@PreUpdate |
| Audit trail | Separate `audit_log` table | Compliance requirement; full change history |
| Master data | Separate table | Dynamic dropdowns without code changes |
| JWT | Access + Refresh tokens | Balance of security and UX |

### 5.2 Application Properties

```properties
# Server
server.port=8080
server.servlet.context-path=/api/v1

# MySQL Database
spring.datasource.url=jdbc:mysql://localhost:3306/employee_management?useSSL=false&serverTimezone=Asia/Kolkata&allowPublicKeyRetrieval=true&characterEncoding=utf8mb4
spring.datasource.username=root
spring.datasource.password=password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.jdbc.batch_size=50

# JWT
app.jwt.secret=c2VjdXJlLXNlY3JldC1rZXktZm9yLWVtcGxveWVlLW1hbmFnZW1lbnQtc3lzdGVtLTIwMjY=
app.jwt.access-token-expiration=86400000     # 24 hours
app.jwt.refresh-token-expiration=604800000   # 7 days
app.jwt.issuer=employee-management-system

# File Upload
spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=2MB
spring.servlet.multipart.max-request-size=10MB
app.photo.upload-dir=uploads/photos
app.photo.allowed-types=image/jpeg,image/png

# CORS
app.cors.allowed-origins=http://localhost:4200

# Logging
logging.level.com.ems=DEBUG
logging.level.org.springframework.security=INFO
logging.file.name=logs/employee-management.log
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n

# Master Data Seed
app.data.seed-on-startup=true
```

### 5.3 Security Configuration

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/masters/public/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/api/v1/dashboard/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/masters/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/employees/**").authenticated()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList("http://localhost:4200"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

### 5.4 Service Layer Design Patterns

| Service | Key Methods | Pattern |
|---------|-------------|---------|
| `EmployeeService` | create, update, getById, getAll (paginated/filtered), delete (soft), search | CRUD + Specification |
| `AuthService` | login, register, changePassword, refreshToken | Authentication |
| `MasterDataService` | getByCategory, create, update, delete | CRUD |
| `DashboardService` | getStats, getRecentEmployees, getChartData | Aggregation |
| `PhotoService` | upload, getPhoto, deletePhoto | File I/O |
| `ExportImportService` | exportToExcel, importFromExcel | Apache POI |
| `AuditService` | logChange, getAuditTrail | Logging/AOP |
| `UserService` | createUser, getUsers, lockUser, unlockUser | User admin |

### 5.5 JWT Token Flow

```
┌─────────┐         ┌──────────────┐         ┌──────────┐
│ Angular │         │ Spring Boot  │         │  MySQL   │
└────┬────┘         └──────┬───────┘         └────┬─────┘
     │  POST /auth/login   │                      │
     │  { username, pwd }  │                      │
     │────────────────────>│                      │
     │                     │  SELECT user         │
     │                     │─────────────────────>│
     │                     │  user data           │
     │                     │<─────────────────────│
     │                     │                      │
     │                     │  Validate password   │
     │                     │  Generate JWT        │
     │  { accessToken,     │                      │
     │    refreshToken,    │                      │
     │    role, employee } │                      │
     │<────────────────────│                      │
     │                     │                      │
     │  Store token in     │                      │
     │  localStorage       │                      │
     │                     │                      │
     │  GET /employees     │                      │
     │  Authorization:     │                      │
     │  Bearer <token>     │                      │
     │────────────────────>│                      │
     │                     │  Validate JWT        │
     │                     │  Extract roles       │
     │                     │  Set Authentication  │
     │                     │                      │
     │                     │  Query employees     │
     │                     │─────────────────────>│
     │                     │  results             │
     │                     │<─────────────────────│
     │  JSON Response      │                      │
     │<────────────────────│                      │
```

### 5.6 Audit Logging with AOP

```java
@Aspect
@Component
public class AuditLogger {
    
    @AfterReturning(pointcut = "execution(* com.ems.service.EmployeeService.create*(..))", returning = "result")
    public void logCreate(JoinPoint joinPoint, Object result) {
        // Log all field values as NEW
    }
    
    @AfterReturning(pointcut = "execution(* com.ems.service.EmployeeService.update*(..))", returning = "result")
    public void logUpdate(JoinPoint joinPoint, Object result) {
        // Compare old vs new values, log only changed fields
    }
    
    @AfterReturning(pointcut = "execution(* com.ems.service.EmployeeService.delete*(..))")
    public void logDelete(JoinPoint joinPoint) {
        // Log deletion
    }
}
```

---

## 6. API Contracts (Request/Response)

### 6.1 Authentication Endpoints

---

#### `POST /api/v1/auth/login`

**Request:**
```json
{
    "username": "EMP0001",
    "password": "securePassword123"
}
```

**Response (200):**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
        "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
        "tokenType": "Bearer",
        "expiresIn": 86400000,
        "role": "ADMIN",
        "employee": {
            "id": 1,
            "employeeCode": "EMP0001",
            "firstName": "Admin",
            "surname": "User",
            "email": "admin@company.com",
            "photoPath": "/api/v1/photos/admin.jpg"
        }
    }
}
```

**Response (401):**
```json
{
    "success": false,
    "message": "Invalid username or password",
    "data": null
}
```

---

#### `POST /api/v1/auth/change-password`

**Request:**
```json
{
    "oldPassword": "oldPass123",
    "newPassword": "newPass456",
    "confirmNewPassword": "newPass456"
}
```

**Response (200):**
```json
{
    "success": true,
    "message": "Password changed successfully",
    "data": null
}
```

---

### 6.2 Employee Endpoints

---

#### `GET /api/v1/employees` — List (Paginated, Filtered)

**Query Parameters:**
```
?page=0&size=10&sort=createdAt,desc
&employeeCode=EMP&firstName=John&gender=Male
&employeeStatus=Live&designation=Manager
&religion=Hindu&socialCategory=BC
&search=keyword (searches name, code, email, mobile)
```

**Response (200):**
```json
{
    "success": true,
    "message": "Employees retrieved successfully",
    "data": {
        "content": [
            {
                "id": 1,
                "employeeCode": "EMP0001",
                "prefix": "Mr.",
                "firstName": "John",
                "surname": "Doe",
                "gender": "Male",
                "designation": "Software Engineer",
                "employeeStatus": "Live",
                "email": "john@company.com",
                "mobile": "9876543210",
                "dob": "1990-05-15",
                "photoPath": "/api/v1/photos/emp0001.jpg"
            }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 156,
        "totalPages": 16,
        "last": false,
        "first": true
    }
}
```

---

#### `GET /api/v1/employees/{id}` — Single Employee (All 80 Fields)

**Response (200):**
```json
{
    "success": true,
    "message": "Employee retrieved successfully",
    "data": {
        "id": 1,
        "employeeCode": "EMP0001",
        "prefix": "Mr.",
        "firstName": "John",
        "surname": "Doe",
        "gender": "Male",
        "maritalStatus": "Married",
        "fatherHusbandName": "Robert Doe",
        "fMH": "Father",
        "occupationKin": "Salaried",
        "occupationKinSub": "Accountant",
        "rationCard": "Yes",
        "doj": "2024-01-15",
        "highestQualification": "B.Com",
        "levelOfEducation": "Bachelors",
        "yearOfPassing": 2020,
        "percentageMarks": 75.50,
        "dob": "1998-05-15",
        "age": 27,
        "ageBracket": "25 & Below",
        "presentAddress": "123 Main Street, City",
        "permanentAddress": "456 Village Road, Town",
        "email": "john@company.com",
        "mobile": "9876543210",
        "closeRelativeName": "Jane Doe",
        "closeRelativeMobile": "9876543211",
        "religion": "Hindu",
        "socialCategory": "BC",
        "socialSubcategory": "BC-A",
        "hasTv": "Yes",
        "hasFridge": "Yes",
        "hasLaptop": "Yes",
        "hasWifi": "Yes",
        "has2wheeler": "Yes",
        "has4wheeler": "No",
        "bloodGroup": "A+",
        "aadharNumber": "123456789012",
        "panNumber": "ABCDE1234F",
        "sscStatus": "Yes",
        "intermediateStatus": "Yes",
        "bachelorsDegree": "Yes",
        "mastersDegree": "No",
        "aadhaarVerification": "Yes",
        "panVerification": "Yes",
        "osv": "Yes",
        "remarks": "Good performer",
        "bankName": "State Bank of India",
        "accountNumber": "12345678901",
        "ifscCode": "SBIN0001234",
        "branch": "Main Branch",
        "employeeStatus": "Live",
        "processAssigned": "Development",
        "esicNo": "ESIC12345",
        "aadharSeeding": "Yes",
        "uanNo": "UAN123456789",
        "pfNo": "PF1234567890123",
        "uanActivation": "Yes",
        "languagesCanSpeak": "English, Hindi, Tamil",
        "fatherName": "Robert Doe",
        "fatherPhone": "9876543212",
        "motherName": "Mary Doe",
        "motherPhone": "9876543213",
        "spouseName": "Jane Doe",
        "spousePhone": "9876543214",
        "pastExperience": "Yes",
        "organizationName": "Previous Corp",
        "periodOfEmployment": "2 years",
        "ref1Name": "Alice Smith",
        "ref1Relationship": "Friend",
        "ref1Address": "789 Mentor Street",
        "ref1Mobile": "9876543215",
        "ref2Name": "Bob Johnson",
        "ref2Relationship": "Colleague",
        "ref2Address": "321 Colleague Lane",
        "ref2Mobile": "9876543216",
        "designation": "Software Engineer",
        "doe": null,
        "deletionMonth": null,
        "exitType": null,
        "exitReason": null,
        "photoPath": "/api/v1/photos/emp0001.jpg",
        "createdAt": "2024-01-15T10:30:00",
        "updatedAt": "2024-06-01T14:20:00"
    }
}
```

---

#### `POST /api/v1/employees` — Create Employee

**Request (multipart/form-data):**
```
employeeDTO: {stringified JSON of all 80 fields}
photo: {file upload, optional, jpg/png, max 2MB}
```

**Request (JSON body without photo):**
```json
{
    "employeeCode": "EMP0157",
    "prefix": "Mr.",
    "firstName": "New",
    "surname": "Employee",
    "gender": "Male",
    "maritalStatus": "Single",
    "fatherHusbandName": "Father Name",
    "fMH": "Father",
    "occupationKin": "Salaried",
    "occupationKinSub": "Engineer",
    "rationCard": "No",
    "doj": "2025-06-01",
    "highestQualification": "B.Tech",
    "levelOfEducation": "Bachelors",
    "yearOfPassing": 2024,
    "percentageMarks": 82.50,
    "dob": "2002-03-10",
    "presentAddress": "Current Address",
    "permanentAddress": "Permanent Address",
    "email": "new@company.com",
    "mobile": "9988776655",
    "closeRelativeName": "Relative Name",
    "closeRelativeMobile": "9988776644",
    "religion": "Hindu",
    "socialCategory": "OC",
    "socialSubcategory": "OC-A",
    "hasTv": "Yes",
    "hasFridge": "No",
    "hasLaptop": "Yes",
    "hasWifi": "Yes",
    "has2wheeler": "No",
    "has4wheeler": "No",
    "bloodGroup": "B+",
    "aadharNumber": "234567890123",
    "panNumber": "FGHIJ5678K",
    "sscStatus": "Yes",
    "intermediateStatus": "Yes",
    "bachelorsDegree": "Yes",
    "mastersDegree": "No",
    "aadhaarVerification": "No",
    "panVerification": "No",
    "osv": "No",
    "remarks": "New joinee",
    "bankName": "HDFC Bank",
    "accountNumber": "98765432100",
    "ifscCode": "HDFC0001234",
    "branch": "City Branch",
    "employeeStatus": "Live",
    "processAssigned": "Training",
    "esicNo": "",
    "aadharSeeding": "No",
    "uanNo": "",
    "pfNo": "",
    "uanActivation": "No",
    "languagesCanSpeak": "English, Hindi",
    "fatherName": "Father Name",
    "fatherPhone": "9988776633",
    "motherName": "Mother Name",
    "motherPhone": "9988776622",
    "spouseName": "",
    "spousePhone": "",
    "pastExperience": "No",
    "organizationName": "",
    "periodOfEmployment": "",
    "ref1Name": "Reference One",
    "ref1Relationship": "Friend",
    "ref1Address": "Reference Address 1",
    "ref1Mobile": "9988776611",
    "ref2Name": "Reference Two",
    "ref2Relationship": "Colleague",
    "ref2Address": "Reference Address 2",
    "ref2Mobile": "9988776600",
    "designation": "Trainee"
}
```

**Response (201):**
```json
{
    "success": true,
    "message": "Employee created successfully",
    "data": {
        "id": 157,
        "employeeCode": "EMP0157",
        "firstName": "New",
        "surname": "Employee"
    }
}
```

---

#### `PUT /api/v1/employees/{id}` — Update Employee

**Request:** Same JSON structure as POST (partial update supported — only send changed fields).

**Response (200):**
```json
{
    "success": true,
    "message": "Employee updated successfully",
    "data": {
        "id": 157,
        "employeeCode": "EMP0157",
        "firstName": "New",
        "surname": "Employee",
        "updatedAt": "2025-06-15T10:30:00"
    }
}
```

---

#### `DELETE /api/v1/employees/{id}` — Soft Delete

**Response (200):**
```json
{
    "success": true,
    "message": "Employee deleted successfully",
    "data": null
}
```

---

#### `POST /api/v1/employees/{id}/photo` — Upload Photo

**Request (multipart/form-data):**
```
photo: {file, jpg/png, max 2MB}
```

**Response (200):**
```json
{
    "success": true,
    "message": "Photo uploaded successfully",
    "data": {
        "photoPath": "/api/v1/photos/emp0157.jpg",
        "fileName": "emp0157.jpg",
        "fileSize": 154320,
        "contentType": "image/jpeg"
    }
}
```

---

#### `GET /api/v1/employees/export` — Export to Excel

**Query Parameters:**
```
?status=Live&designation=Manager (optional filters)
```

**Response:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` file download.

| Column Header | Mapped Field |
|--------------|-------------|
| Employee Code | employeeCode |
| Employee Name | prefix + firstName + surname |
| ...all 80 fields... | ...mapped... |
| Age | computed |

---

#### `POST /api/v1/employees/import` — Import from Excel

**Request (multipart/form-data):**
```
file: {.xlsx file, validated structure}
```

**Response (200):**
```json
{
    "success": true,
    "message": "Import completed",
    "data": {
        "totalRows": 100,
        "successful": 98,
        "failed": 2,
        "errors": [
            { "row": 15, "message": "Invalid employee code format" },
            { "row": 42, "message": "Duplicate employee code: EMP0042" }
        ]
    }
}
```

---

### 6.3 Master Data Endpoints

---

#### `GET /api/v1/masters/{category}` — Get Dropdown Values

**Path:** `/api/v1/masters/GENDER`

**Response (200):**
```json
{
    "success": true,
    "message": "Master data retrieved",
    "data": [
        { "id": 1, "category": "GENDER", "code": "MALE", "value": "Male", "sortOrder": 1, "active": true },
        { "id": 2, "category": "GENDER", "code": "FEMALE", "value": "Female", "sortOrder": 2, "active": true },
        { "id": 3, "category": "GENDER", "code": "OTHER", "value": "Other", "sortOrder": 3, "active": true }
    ]
}
```

**Master Data Categories:**
| Category | Example Values |
|----------|---------------|
| GENDER | Male, Female, Other |
| PREFIX | Mr., Ms., Mrs. |
| MARITAL_STATUS | Single, Married, Divorced, Widowed |
| F_M_H | Father, Mother, Husband |
| OCCUPATION_KIN | Salaried, Self Employed, House Wife, Student |
| RELIGION | Hindu, Muslim, Christian, Sikh, Buddhist, Jain, Other |
| SOCIAL_CATEGORY | BC, OBC, SC, ST, OC |
| SOCIAL_SUBCATEGORY | BC-A, BC-B, BC-C, BC-D, OBC-A, OBC-B, etc. |
| BLOOD_GROUP | A+, A-, B+, B-, AB+, AB-, O+, O- |
| EMPLOYEE_STATUS | Live, Quit, Suspended, Maternity Leave |
| EXIT_TYPE | Resigned, Retired, Terminated, Absconding, Deceased |
| EDUCATION_LEVEL | SSC, Intermediate, Bachelors, Masters, PhD |
| AGE_BRACKET | 25 & Below, 26 to 30, 31 to 35, 36 to 40, 41 to 50, 51 & Above |
| DESIGNATION | Manager, Assistant Manager, Software Engineer, Trainee, etc. |
| YES_NO | Yes, No |

---

#### `POST /api/v1/masters` — Create Master Data Entry

**Request:**
```json
{
    "category": "GENDER",
    "code": "OTHER",
    "value": "Other",
    "sortOrder": 3
}
```

#### `PUT /api/v1/masters/{id}` — Update

#### `DELETE /api/v1/masters/{id}` — Delete

---

### 6.4 Dashboard Endpoints

---

#### `GET /api/v1/dashboard/stats`

**Response (200):**
```json
{
    "success": true,
    "data": {
        "totalEmployees": 156,
        "activeEmployees": 142,
        "exitedEmployees": 14,
        "maleCount": 98,
        "femaleCount": 58,
        "newThisMonth": 5,
        "exitedThisMonth": 2,
        "statusDistribution": {
            "Live": 142,
            "Quit": 10,
            "Suspended": 2,
            "Maternity Leave": 2
        },
        "genderDistribution": {
            "Male": 98,
            "Female": 56,
            "Other": 2
        },
        "designationDistribution": [
            { "designation": "Software Engineer", "count": 45 },
            { "designation": "Manager", "count": 12 },
            { "designation": "Trainee", "count": 30 }
        ],
        "ageBracketDistribution": [
            { "bracket": "25 & Below", "count": 40 },
            { "bracket": "26 to 30", "count": 55 },
            { "bracket": "31 to 35", "count": 30 },
            { "bracket": "36 to 40", "count": 15 },
            { "bracket": "41 to 50", "count": 10 },
            { "bracket": "51 & Above", "count": 6 }
        ]
    }
}
```

#### `GET /api/v1/dashboard/recent`

**Query Parameters:** `?limit=10`

**Response (200):**
```json
{
    "success": true,
    "data": [
        {
            "id": 157,
            "employeeCode": "EMP0157",
            "firstName": "New",
            "surname": "Employee",
            "designation": "Trainee",
            "doj": "2025-06-01",
            "photoPath": "/api/v1/photos/emp0157.jpg"
        }
    ]
}
```

---

### 6.5 Generic API Response Wrapper

```java
public class APIResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;
    
    // Static factory methods
    public static <T> APIResponse<T> success(T data) { ... }
    public static <T> APIResponse<T> success(String message, T data) { ... }
    public static <T> APIResponse<T> error(String message) { ... }
}
```

---

## 7. Frontend Architecture

### 7.1 Route Definitions

```typescript
// app.routes.ts
export const routes: Routes = [
    {
        path: 'auth',
        children: [
            { path: 'login', component: LoginComponent, title: 'Login' },
            { path: 'register', component: RegisterComponent, title: 'Register' }
        ]
    },
    {
        path: 'admin',
        component: AdminLayoutComponent,
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN'] },
        children: [
            { path: 'dashboard', component: DashboardComponent, title: 'Dashboard' },
            { 
                path: 'employees', 
                children: [
                    { path: '', component: StaffMasterListComponent, title: 'Employees' },
                    { path: 'new', component: StaffMasterFormComponent, title: 'New Employee' },
                    { path: ':id', component: StaffMasterViewComponent, title: 'Employee Details' },
                    { path: ':id/edit', component: StaffMasterFormComponent, title: 'Edit Employee' }
                ]
            },
            { path: 'masters', component: MastersComponent, title: 'Master Data' },
            { path: 'reports', component: ReportsComponent, title: 'Reports' },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
    },
    {
        path: 'employee',
        component: EmployeeLayoutComponent,
        canActivate: [AuthGuard],
        data: { roles: ['EMPLOYEE'] },
        children: [
            { path: 'profile', component: StaffMasterViewComponent, title: 'My Profile' },
            { path: 'profile/edit', component: StaffMasterFormComponent, title: 'Edit Profile' },
            { path: '', redirectTo: 'profile', pathMatch: 'full' }
        ]
    },
    { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
    { path: '**', redirectTo: 'auth/login' }
];
```

### 7.2 Route Guard Logic

| Guard | What It Does |
|-------|-------------|
| `AuthGuard` | Checks if user has a valid JWT token (not expired). Redirects to `/auth/login` if missing/expired. |
| `RoleGuard` | Checks if the user's role matches the route's `data.roles` array. Redirects to appropriate layout if mismatch. |

```typescript
// auth.guard.ts
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) {}
    
    canActivate(route: ActivatedRouteSnapshot): boolean {
        if (this.authService.isAuthenticated()) {
            return true;
        }
        this.router.navigate(['/auth/login']);
        return false;
    }
}

// role.guard.ts
@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) {}
    
    canActivate(route: ActivatedRouteSnapshot): boolean {
        const requiredRoles = route.data['roles'] as string[];
        const userRole = this.authService.getUserRole();
        
        if (requiredRoles.includes(userRole)) {
            return true;
        }
        
        // Redirect to appropriate home based on role
        if (userRole === 'ADMIN') {
            this.router.navigate(['/admin/dashboard']);
        } else {
            this.router.navigate(['/employee/profile']);
        }
        return false;
    }
}
```

### 7.3 Interceptor Design

```typescript
// auth.interceptor.ts
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) {}
    
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = this.authService.getAccessToken();
        if (token) {
            req = req.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
        }
        return next.handle(req);
    }
}

// error.interceptor.ts
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService, private router: Router) {}
    
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            catchError((error: HttpErrorResponse) => {
                switch (error.status) {
                    case 401:
                        this.authService.logout();
                        this.router.navigate(['/auth/login']);
                        break;
                    case 403:
                        // Show forbidden toast
                        break;
                    case 404:
                        // Show not found toast
                        break;
                    case 409:
                        // Show conflict toast
                        break;
                    case 422:
                        // Show validation errors
                        break;
                    default:
                        // Show generic error toast
                        break;
                }
                return throwError(() => error);
            })
        );
    }
}
```

### 7.4 Model Definitions

```typescript
// employee.model.ts
export interface Employee {
    id?: number;
    employeeCode: string;
    prefix?: string;
    firstName: string;
    surname: string;
    gender: string;
    maritalStatus?: string;
    fatherHusbandName?: string;
    fMH?: string;
    occupationKin?: string;
    occupationKinSub?: string;
    rationCard?: string;
    doj?: string;        // ISO date string
    highestQualification?: string;
    levelOfEducation?: string;
    yearOfPassing?: number;
    percentageMarks?: number;
    dob?: string;        // ISO date string
    age?: number;
    ageBracket?: string;
    presentAddress?: string;
    permanentAddress?: string;
    email?: string;
    mobile?: string;
    closeRelativeName?: string;
    closeRelativeMobile?: string;
    religion?: string;
    socialCategory?: string;
    socialSubcategory?: string;
    hasTv?: string;
    hasFridge?: string;
    hasLaptop?: string;
    hasWifi?: string;
    has2wheeler?: string;
    has4wheeler?: string;
    bloodGroup?: string;
    aadharNumber?: string;
    panNumber?: string;
    sscStatus?: string;
    intermediateStatus?: string;
    bachelorsDegree?: string;
    mastersDegree?: string;
    aadhaarVerification?: string;
    panVerification?: string;
    osv?: string;
    remarks?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branch?: string;
    employeeStatus?: string;
    processAssigned?: string;
    esicNo?: string;
    aadharSeeding?: string;
    uanNo?: string;
    pfNo?: string;
    uanActivation?: string;
    languagesCanSpeak?: string;
    fatherName?: string;
    fatherPhone?: string;
    motherName?: string;
    motherPhone?: string;
    spouseName?: string;
    spousePhone?: string;
    pastExperience?: string;
    organizationName?: string;
    periodOfEmployment?: string;
    ref1Name?: string;
    ref1Relationship?: string;
    ref1Address?: string;
    ref1Mobile?: string;
    ref2Name?: string;
    ref2Relationship?: string;
    ref2Address?: string;
    ref2Mobile?: string;
    designation?: string;
    doe?: string;
    deletionMonth?: string;
    exitType?: string;
    exitReason?: string;
    photoPath?: string;
    createdAt?: string;
    updatedAt?: string;
}

// api-response.model.ts
export interface APIResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

// paged-response.model.ts
export interface PagedResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
    first: boolean;
}
```

### 7.5 Theme Configuration

```scss
// _variables.scss
$primary-color: #1f3d6e;
$primary-light: #3a5a8f;
$primary-dark: #0f2440;
$accent-color: #ff6f00;
$warn-color: #d32f2f;
$background-color: #f4f6f9;
$text-primary: #1f3d6e;
$text-secondary: #5f6368;
$border-color: #e0e0e0;
$header-height: 64px;
$sidebar-width: 260px;
$sidebar-collapsed-width: 64px;
$font-family: 'Roboto', 'Segoe UI', sans-serif;

// theme.scss
@use '@angular/material' as mat;
@use 'variables' as vars;

$ems-primary: mat.define-palette((
    50: #e3e8f0,
    100: #b8c6da,
    200: #8aa0c1,
    300: #5c7aa8,
    400: #3a5e95,
    500: #1f3d6e,
    600: #1a3460,
    700: #142b50,
    800: #0f2240,
    900: #091830,
    contrast: (50: #000, 100: #000, 200: #000, 300: #fff, 400: #fff, 500: #fff, 600: #fff, 700: #fff, 800: #fff, 900: #fff)
), 500, 300, 700);

$ems-accent: mat.define-palette(mat.$orange-palette, 700, 300, 900);
$ems-warn: mat.define-palette(mat.$red-palette);

$ems-theme: mat.define-light-theme((
    color: (primary: $ems-primary, accent: $ems-accent, warn: $ems-warn)
));

@include mat.all-component-themes($ems-theme);
```

### 7.6 HTML Boilerplate for Staff Master Form

```html
<!-- staff-master-form.component.html -->
<div class="employee-form-container">
  <div class="form-header">
    <h1>{{ isEditMode ? 'Edit Employee' : 'New Employee' }}</h1>
    <div class="form-actions">
      <button mat-stroked-button (click)="goBack()">Cancel</button>
      <button mat-raised-button color="primary" (click)="saveDraft()">Save Draft</button>
      <button mat-raised-button color="primary" (click)="submitForm()" [disabled]="!employeeForm.valid">
        {{ isEditMode ? 'Update' : 'Create' }}
      </button>
    </div>
  </div>

  <mat-tab-group dynamicHeight (selectedTabChange)="onTabChange($event)">
    <mat-tab label="Personal Info">
      <ng-template matTabContent>
        <app-personal-info-tab [form]="employeeForm" [masterData]="masterData"></app-personal-info-tab>
      </ng-template>
    </mat-tab>
    <mat-tab label="Demographics">
      <ng-template matTabContent>
        <app-demographics-tab [form]="employeeForm" [masterData]="masterData"></app-demographics-tab>
      </ng-template>
    </mat-tab>
    <mat-tab label="Assets">
      <ng-template matTabContent>
        <app-assets-tab [form]="employeeForm"></app-assets-tab>
      </ng-template>
    </mat-tab>
    <mat-tab label="Identity">
      <ng-template matTabContent>
        <app-identity-tab [form]="employeeForm"></app-identity-tab>
      </ng-template>
    </mat-tab>
    <mat-tab label="Education">
      <ng-template matTabContent>
        <app-education-tab [form]="employeeForm"></app-education-tab>
      </ng-template>
    </mat-tab>
    <mat-tab label="Bank Details">
      <ng-template matTabContent>
        <app-bank-tab [form]="employeeForm"></app-bank-tab>
      </ng-template>
    </mat-tab>
    <mat-tab label="Employment">
      <ng-template matTabContent>
        <app-employment-tab [form]="employeeForm" [masterData]="masterData"></app-employment-tab>
      </ng-template>
    </mat-tab>
    <mat-tab label="Family">
      <ng-template matTabContent>
        <app-family-tab [form]="employeeForm"></app-family-tab>
      </ng-template>
    </mat-tab>
    <mat-tab label="Experience & References">
      <ng-template matTabContent>
        <app-experience-ref-tab [form]="employeeForm"></app-experience-ref-tab>
      </ng-template>
    </mat-tab>
    <mat-tab label="Exit & Documents">
      <ng-template matTabContent>
        <app-exit-docs-tab [form]="employeeForm"></app-exit-docs-tab>
      </ng-template>
    </mat-tab>
  </mat-tab-group>
</div>
```

---

## 8. Security Architecture

### 8.1 Complete Security Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SECURITY ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐     ┌──────────────────┐     ┌───────────────────┐   │
│  │  Client       │     │  Spring Security │     │  JWT Token        │   │
│  │  (Angular)    │     │  Filter Chain    │     │  Validation       │   │
│  └──────┬───────┘     └────────┬─────────┘     └────────┬──────────┘   │
│         │                      │                        │              │
│         │  1. Login Request    │                        │              │
│         │─────────────────────>│                        │              │
│         │                      │  2. Authenticate       │              │
│         │                      │  (UserDetailsService)  │              │
│         │                      │                        │              │
│         │  3. JWT Token        │                        │              │
│         │<─────────────────────│                        │              │
│         │                      │                        │              │
│         │  4. Store Token      │                        │              │
│         │  (localStorage)      │                        │              │
│         │                      │                        │              │
│         │  5. API Request      │                        │              │
│         │  + Bearer Token      │                        │              │
│         │─────────────────────>│                        │              │
│         │                      │  6. JwtAuthFilter     │              │
│         │                      │  extracts token ──────>              │
│         │                      │                        │              │
│         │                      │  Validate:             │              │
│         │                      │  • Signature           │              │
│         │                      │  • Expiry              │              │
│         │                      │  • Issuer              │              │
│         │                      │  <─────────────────────│              │
│         │                      │                        │              │
│         │                      │  7. Set SecurityContext│              │
│         │                      │  (Authentication obj)  │              │
│         │                      │                        │              │
│         │                      │  8. Check Roles        │              │
│         │                      │  (@PreAuthorize)       │              │
│         │                      │                        │              │
│         │  9. Response         │                        │              │
│         │<─────────────────────│                        │              │
│         │                      │                        │              │
└─────────┴──────────────────────┴────────────────────────┴──────────────┘
```

### 8.2 Password Policy

| Policy | Value |
|--------|-------|
| Min length | 8 characters |
| Must contain | Uppercase, lowercase, digit, special char |
| Password encoder | BCrypt with strength 12 |
| Max failed attempts | 5 before account lockout |
| Lockout duration | 30 minutes |
| Password expiry | 90 days (configurable) |

### 8.3 JWT Token Structure

```json
// Header
{
  "alg": "HS512",
  "typ": "JWT"
}

// Payload (Access Token)
{
  "sub": "EMP0001",
  "iat": 1747600000,
  "exp": 1747686400,
  "iss": "employee-management-system",
  "roles": ["ROLE_ADMIN"],
  "employeeId": 1,
  "username": "EMP0001"
}

// Payload (Refresh Token)
{
  "sub": "EMP0001",
  "iat": 1747600000,
  "exp": 1748204800,
  "iss": "employee-management-system",
  "type": "refresh"
}
```

### 8.4 API Security Matrix

| Endpoint | Auth Required | Role Required | Notes |
|----------|:------------:|:-------------:|-------|
| `POST /auth/login` | No | - | Public |
| `POST /auth/register` | No | - | First-time setup only |
| `POST /auth/change-password` | Yes | Any | Any authenticated user |
| `GET /employees` | Yes | ADMIN | Full list |
| `GET /employees/{id}` | Yes | ADMIN or OWNER | Own profile for EMPLOYEE |
| `POST /employees` | Yes | ADMIN | Create |
| `PUT /employees/{id}` | Yes | ADMIN or OWNER | Own limited fields for EMPLOYEE |
| `DELETE /employees/{id}` | Yes | ADMIN | Soft delete |
| `POST /employees/{id}/photo` | Yes | ADMIN or OWNER | Own photo |
| `GET /employees/export` | Yes | ADMIN | Excel export |
| `POST /employees/import` | Yes | ADMIN | Excel import |
| `GET /masters/**` | Yes | ADMIN | Master data CRUD |
| `POST /masters/**` | Yes | ADMIN | |
| `PUT /masters/**` | Yes | ADMIN | |
| `DELETE /masters/**` | Yes | ADMIN | |
| `GET /dashboard/**` | Yes | ADMIN | Dashboard data |
| `GET /audit/**` | Yes | ADMIN | Audit trail |

### 8.5 Input Validation & Sanitization

| Attack Vector | Mitigation |
|---------------|-----------|
| SQL Injection | JPA parameterized queries, no raw SQL |
| XSS | Angular DOM sanitization, Content-Type headers |
| CSRF | Stateless JWT (no session cookies), CSRF disabled with JWT |
| Path Traversal | `FilenameUtils.getName()` for photo paths |
| File Upload | whitelist MIME types (image/jpeg, image/png), max 2MB |
| Rate Limiting | Token bucket algorithm (100 req/min per user) |
| Brute Force | Account lockout after 5 failed attempts |

---

## 9. Component Tree & Data Flow

### 9.1 Complete Component Hierarchy

```
AppComponent
├── Router Outlet
│   ├── LoginComponent
│   │   ├── Reactive Form (username, password)
│   │   └── AuthService.login()
│   │
│   ├── RegisterComponent
│   │   └── Reactive Form (first-time admin setup)
│   │
│   ├── AdminLayoutComponent
│   │   ├── HeaderComponent
│   │   │   ├── Logo (logo.jpg)
│   │   │   ├── User Info Dropdown
│   │   │   └── Logout Button
│   │   ├── SidebarComponent
│   │   │   ├── Navigation Menu
│   │   │   │   ├── Dashboard Link
│   │   │   │   ├── Employees Link
│   │   │   │   ├── Master Data Link
│   │   │   │   └── Reports Link
│   │   │   └── Collapse Toggle
│   │   └── Router Outlet
│   │       ├── DashboardComponent
│   │       │   ├── Stats Cards (total, active, exited, etc.)
│   │       │   ├── Chart (gender distribution)
│   │       │   ├── Chart (status distribution)
│   │       │   └── Recent Employees List
│   │       │
│   │       ├── StaffMasterListComponent
│   │       │   ├── FilterBarComponent
│   │       │   │   ├── Search Input
│   │       │   │   ├── Dropdown Filters (status, gender, etc.)
│   │       │   │   ├── Export Button
│   │       │   │   └── Import Button
│   │       │   ├── MatTable (paginated employee list)
│   │       │   ├── MatPaginator
│   │       │   └── Action Buttons (view, edit, delete)
│   │       │
│   │       ├── StaffMasterFormComponent
│   │       │   └── MatTabGroup (10 tabs)
│   │       │       ├── PersonalInfoTabComponent (25 fields)
│   │       │       ├── DemographicsTabComponent (3 fields)
│   │       │       ├── AssetsTabComponent (6 fields)
│   │       │       ├── IdentityTabComponent (3 fields)
│   │       │       ├── EducationTabComponent (8 fields)
│   │       │       ├── BankTabComponent (4 fields)
│   │       │       ├── EmploymentTabComponent (8 fields)
│   │       │       ├── FamilyTabComponent (6 fields)
│   │       │       ├── ExperienceRefTabComponent (11 fields)
│   │       │       └── ExitDocsTabComponent (5 fields)
│   │       │
│   │       ├── StaffMasterViewComponent
│   │       │   ├── Photo Card (with upload capability)
│   │       │   └── Read-only display of all fields (grouped)
│   │       │
│   │       ├── MastersComponent
│   │       │   ├── Category Selector
│   │       │   ├── CRUD Table
│   │       │   └── Add/Edit Dialog
│   │       │
│   │       └── ReportsComponent
│   │           ├── Report Type Selector
│   │           ├── Filter Controls
│   │           └── Report Results Table/Chart
│   │
│   └── EmployeeLayoutComponent
│       ├── HeaderComponent (simplified)
│       └── Router Outlet
│           ├── StaffMasterViewComponent (own profile)
│           └── StaffMasterFormComponent (edit limited fields)
```

### 9.2 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW DIAGRAM                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐    ┌──────────────┐    ┌──────────┐    ┌──────────┐ │
│  │ Component │───>│   Service    │───>│  HTTP     │───>│  API     │ │
│  │ (Tab)     │    │ (Employee)   │    │  Client   │    │  Gateway │ │
│  └──────────┘    └──────────────┘    └──────────┘    └──────────┘ │
│       │                 │                                            │
│       │                 │ Reactive Form Controls                     │
│       │                 │ (form.get('field').valueChanges)            │
│       │                 │                                            │
│       ▼                 ▼                                            │
│  ┌──────────┐    ┌──────────────┐                                   │
│  │ Template │    │ Form Group   │                                   │
│  │ (HTML)   │<───│ (Validators) │                                   │
│  └──────────┘    └──────────────┘                                   │
│                                                                     │
│  SHARED SERVICES FLOW:                                              │
│  ┌──────────────┐    ┌──────────────────┐                          │
│  │ MasterData   │───>│ Caching (in-memory│                          │
│  │ Service      │    │ Map by category)  │                          │
│  └──────────────┘    └──────────────────┘                          │
│       │                                                              │
│       │  getAllCategories() called once, cached after               │
│       ▼                                                              │
│  ┌──────────────────────┐                                           │
│  │ All Tab Components   │ (inject MasterDataService)                │
│  └──────────────────────┘                                           │
│                                                                     │
│  PHOTO UPLOAD FLOW:                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌──────────┐                  │
│  │ Photo     │───>│ PhotoService │───>│ API call │                  │
│  │ Upload    │    │ (FormData)   │    │ POST     │                  │
│  └──────────┘    └──────────────┘    │ photo    │                  │
│                                       └──────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.3 State Management Strategy

Using Angular Services with RxJS `BehaviorSubject` — no external state library needed since this is a data-entry application with clear request-response patterns.

```typescript
// employee.service.ts
@Injectable({ providedIn: 'root' })
export class EmployeeService {
    private apiUrl = '/api/v1/employees';
    
    // Cached list (for list view)
    private employeeListSubject = new BehaviorSubject<Employee[]>([]);
    employeeList$ = this.employeeListSubject.asObservable();
    
    // Current employee being edited/viewed
    private currentEmployeeSubject = new BehaviorSubject<Employee | null>(null);
    currentEmployee$ = this.currentEmployeeSubject.asObservable();
    
    // Loading state
    private loadingSubject = new BehaviorSubject<boolean>(false);
    isLoading$ = this.loadingSubject.asObservable();
    
    constructor(private http: HttpClient) {}
    
    // CRUD operations
    getEmployees(page: number, size: number, filters?: any): Observable<PagedResponse<Employee>> {
        this.loadingSubject.next(true);
        return this.http.get<PagedResponse<Employee>>(this.apiUrl, {
            params: { page, size, ...filters }
        }).pipe(
            tap(response => {
                this.employeeListSubject.next(response.content);
                this.loadingSubject.next(false);
            }),
            catchError(error => {
                this.loadingSubject.next(false);
                return throwError(() => error);
            })
        );
    }
    
    getEmployeeById(id: number): Observable<Employee> {
        return this.http.get<APIResponse<Employee>>(`${this.apiUrl}/${id}`).pipe(
            map(response => response.data),
            tap(employee => this.currentEmployeeSubject.next(employee))
        );
    }
    
    createEmployee(employee: Employee, photo?: File): Observable<Employee> {
        const formData = this.buildFormData(employee, photo);
        return this.http.post<APIResponse<Employee>>(this.apiUrl, formData).pipe(
            map(response => response.data)
        );
    }
    
    updateEmployee(id: number, employee: Partial<Employee>, photo?: File): Observable<Employee> {
        const formData = this.buildFormData(employee, photo);
        return this.http.put<APIResponse<Employee>>(`${this.apiUrl}/${id}`, formData).pipe(
            map(response => response.data)
        );
    }
    
    deleteEmployee(id: number): Observable<void> {
        return this.http.delete<APIResponse<void>>(`${this.apiUrl}/${id}`).pipe(
            map(() => void 0)
        );
    }
    
    private buildFormData(employee: Partial<Employee>, photo?: File): FormData {
        const formData = new FormData();
        formData.append('employee', new Blob([JSON.stringify(employee)], { type: 'application/json' }));
        if (photo) {
            formData.append('photo', photo);
        }
        return formData;
    }
}
```

### 9.4 Master Data Caching Strategy

```typescript
@Injectable({ providedIn: 'root' })
export class MasterDataService {
    private cache = new Map<string, MasterDataItem[]>();
    private loadingCategories = new Set<string>();
    
    constructor(private http: HttpClient) {}
    
    getByCategory(category: string): Observable<MasterDataItem[]> {
        // Return cached data immediately if available
        if (this.cache.has(category)) {
            return of(this.cache.get(category)!);
        }
        
        // Prevent duplicate API calls for same category
        if (this.loadingCategories.has(category)) {
            // Wait for existing request to complete
            return this.http.get<APIResponse<MasterDataItem[]>>(`/api/v1/masters/${category}`).pipe(
                map(response => response.data)
            );
        }
        
        this.loadingCategories.add(category);
        
        return this.http.get<APIResponse<MasterDataItem[]>>(`/api/v1/masters/${category}`).pipe(
            map(response => response.data),
            tap(data => {
                this.cache.set(category, data);
                this.loadingCategories.delete(category);
            }),
            shareReplay(1)
        );
    }
    
    refreshCategory(category: string): void {
        this.cache.delete(category);
    }
    
    // Preload common categories on app init
    preloadCommonCategories(): void {
        const commonCategories = ['GENDER', 'PREFIX', 'MARITAL_STATUS', 'BLOOD_GROUP', 'EMPLOYEE_STATUS'];
        commonCategories.forEach(cat => this.getByCategory(cat).subscribe());
    }
}
```

---

## 10. Staff Master — Tab Design

### 10.1 Tab 1: Personal Info (25 fields)

| # | Field Name | Control Type | Validations | Master Data |
|---|-----------|-------------|-------------|-------------|
| 1 | Employee Code | Input (text) | Required, pattern: `^[A-Z0-9]{8}$` | - |
| 2 | Prefix | Select dropdown | Required | PREFIX |
| 3 | First Name | Input (text) | Required, max 40 chars | - |
| 4 | Surname | Input (text) | Required, max 40 chars | - |
| 5 | Gender | Select dropdown | Required | GENDER |
| 6 | Marital Status | Select dropdown | - | MARITAL_STATUS |
| 7 | Father/Husband Name | Input (text) | Max 40 chars | - |
| 8 | F/M/H | Select dropdown | Required if field 7 filled | F_M_H |
| 9 | Occupation of Kin | Select dropdown | - | OCCUPATION_KIN |
| 10 | Occupation Kin Sub | Input (text) | Max 40 chars | - |
| 11 | Ration Card | Select (Yes/No) | - | YES_NO |
| 12 | Date of Joining | Date picker | - | - |
| 13 | Highest Qualification | Select dropdown | - | QUALIFICATION |
| 14 | Level of Education | Select dropdown | - | EDUCATION_LEVEL |
| 15 | Year of Passing | Input (number) | Min 1950, Max current+1 | - |
| 16 | % of Marks | Input (number) | Min 0, Max 100 | - |
| 17 | Date of Birth | Date picker | Required | - |
| 18 | Age | Display (computed) | Auto from DOB | - |
| 19 | Age Bracket | Display (computed) | Auto from Age | AGE_BRACKET |
| 20 | Present Address | Textarea | Max 256 chars | - |
| 21 | Permanent Address | Textarea | Max 256 chars | - |
| 22 | Email | Input (email) | Email format, max 56 | - |
| 23 | Mobile | Input (text) | Pattern: `^[0-9]{10}$` | - |
| 24 | Close Relative Name | Input (text) | Max 40 chars | - |
| 25 | Close Relative Mobile | Input (text) | Pattern: `^[0-9]{10}$` | - |

**Layout:** 2-column grid. Employee Code, First Name, Surname in first row. DOB and DOJ side by side. Address fields full-width.

### 10.2 Tab 2: Demographics (3 fields)

| # | Field Name | Control Type | Validations | Master Data |
|---|-----------|-------------|-------------|-------------|
| 26 | Religion | Select dropdown | - | RELIGION |
| 27 | Social Category | Select dropdown | - | SOCIAL_CATEGORY |
| 28 | Social Subcategory | Select dropdown | - | SOCIAL_SUBCATEGORY |

**Layout:** 3-column grid. Social Subcategory filters based on Social Category selection.

### 10.3 Tab 3: Assets (6 fields)

| # | Field Name | Control Type | Validations | Master Data |
|---|-----------|-------------|-------------|-------------|
| 29 | TV | Select (Yes/No) | - | YES_NO |
| 30 | Fridge | Select (Yes/No) | - | YES_NO |
| 31 | Laptop | Select (Yes/No) | - | YES_NO |
| 32 | WiFi | Select (Yes/No) | - | YES_NO |
| 33 | 2 Wheeler | Select (Yes/No) | - | YES_NO |
| 34 | 4 Wheeler | Select (Yes/No) | - | YES_NO |

**Layout:** 3-column grid with toggle buttons (Yes/No) for each asset.

### 10.4 Tab 4: Identity (3 fields)

| # | Field Name | Control Type | Validations | Master Data |
|---|-----------|-------------|-------------|-------------|
| 35 | Blood Group | Select dropdown | - | BLOOD_GROUP |
| 36 | Aadhar Number | Input (text) | Pattern: `^[0-9]{12}$` | - |
| 37 | PAN Number | Input (text) | Pattern: `^[A-Z]{5}[0-9]{4}[A-Z]{1}$` | - |

**Layout:** 3-column grid.

### 10.5 Tab 5: Education (8 fields)

| # | Field Name | Control Type | Validations | Master Data |
|---|-----------|-------------|-------------|-------------|
| 38 | SSC / Std X | Select (Yes/No) | - | YES_NO |
| 39 | Intermediate / Std XII | Select (Yes/No) | - | YES_NO |
| 40 | Bachelor's Degree | Select (Yes/No) | - | YES_NO |
| 41 | Master's Degree | Select (Yes/No) | - | YES_NO |
| 42 | Aadhaar Verification | Select (Yes/No) | - | YES_NO |
| 43 | PAN Verification | Select (Yes/No) | - | YES_NO |
| 44 | OSV | Select (Yes/No) | - | YES_NO |
| 45 | Remarks | Textarea | Max 140 chars | - |

**Layout:** 4-column grid for checkmark fields. Remarks full-width at bottom.

### 10.6 Tab 6: Bank Details (4 fields)

| # | Field Name | Control Type | Validations | Master Data |
|---|-----------|-------------|-------------|-------------|
| 46 | Bank Name | Input (text) | Max 56 chars / Select | BANK |
| 47 | Account Number | Input (text) | Pattern: `^[0-9]{9,18}$` | - |
| 48 | IFSC Code | Input (text) | Pattern: `^[A-Z]{4}0[A-Z0-9]{6}$` | - |
| 49 | Branch | Input (text) | Max 40 chars | - |

**Layout:** 2-column grid. IFSC lookup helper (auto-fill bank name from IFSC).

### 10.7 Tab 7: Employment (8 fields)

| # | Field Name | Control Type | Validations | Master Data |
|---|-----------|-------------|-------------|-------------|
| 50 | Employee Status | Select dropdown | Required | EMPLOYEE_STATUS |
| 51 | Process Assigned | Input (text) | Max 56 chars | - |
| 52 | ESIC No. | Input (text) | Max 10 chars | - |
| 53 | Aadhar Seeding | Select (Yes/No) | - | YES_NO |
| 54 | UAN No. | Input (text) | Max 12 chars | - |
| 55 | PF No. | Input (text) | Max 22 chars | - |
| 56 | UAN Activation | Select (Yes/No) | - | YES_NO |
| 57 | Languages | Input (text) / Multi-select | Max 100 chars | LANGUAGE |

**Layout:** 2-column grid.

### 10.8 Tab 8: Family (6 fields)

| # | Field Name | Control Type | Validations | Master Data |
|---|-----------|-------------|-------------|-------------|
| 58 | Father Name | Input (text) | Max 20 chars | - |
| 59 | Father Phone | Input (text) | Pattern: `^[0-9]{10}$` | - |
| 60 | Mother Name | Input (text) | Max 20 chars | - |
| 61 | Mother Phone | Input (text) | Pattern: `^[0-9]{10}$` | - |
| 62 | Spouse Name | Input (text) | Max 20 chars | - |
| 63 | Spouse Phone | Input (text) | Pattern: `^[0-9]{10}$` | - |

**Layout:** 3 groups of 2 (Name + Phone side by side).

### 10.9 Tab 9: Experience & References (11 fields)

| # | Field Name | Control Type | Validations |
|---|-----------|-------------|-------------|
| 64 | Past Experience | Select (Yes/No) | YES_NO |
| 65 | Organization Name(s) | Input (text) | Max 56 chars |
| 66 | Period of Employment | Input (text) | Max 50 chars |
| 67 | Reference 1 Name | Input (text) | Max 20 chars |
| 68 | Reference 1 Relationship | Select / Input | Select: RELATIONSHIP |
| 69 | Reference 1 Address | Textarea | Max 256 chars |
| 70 | Reference 1 Mobile | Input (text) | Pattern: `^[0-9]{10}$` |
| 71 | Reference 2 Name | Input (text) | Max 20 chars |
| 72 | Reference 2 Relationship | Select / Input | Select: RELATIONSHIP |
| 73 | Reference 2 Address | Textarea | Max 256 chars |
| 74 | Reference 2 Mobile | Input (text) | Pattern: `^[0-9]{10}$` |

**Layout:** Section 1 (Experience) — 3 fields in a row. Section 2 (Reference 1) — grouped in a card. Section 3 (Reference 2) — grouped in a card. `past_experience` toggles the experience fields.

### 10.10 Tab 10: Exit & Documents (5 fields)

| # | Field Name | Control Type | Validations |
|---|-----------|-------------|-------------|
| 75 | Designation | Select / Input | DESIGNATION |
| 76 | DOE | Date picker | - |
| 77 | Deletion Month | Input (text) | Pattern: `^[0-9]{2}/[0-9]{4}$` |
| 78 | Exit Type | Select dropdown | EXIT_TYPE |
| 79 | Exit Reason | Textarea | Max 256 chars |
| 80 | Photo | File Upload | jpg/png, max 2MB |

**Layout:** Designation + DOE in first row. Deletion Month + Exit Type in second row. Exit Reason full-width. Photo upload card at bottom with preview.

---

## 11. Architecture Decision Records

### ADR-001: Single Employee Entity (vs. Normalized)

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Context** | The 80 employee fields could be normalized across multiple tables (personal_info, education, bank_details, etc.) or kept in a single table. |
| **Decision** | Use a single `employees` table with all 80 fields as columns. |
| **Consequences** | *Easier*: Simple queries, no joins, straightforward JPA mapping, faster reads for the full employee record. *Harder*: Wide table (80+ columns), potential for partial index usage. |
| **Rationale** | Employees are ALWAYS loaded as a single aggregate. There's no use case where you query "only the bank details" without the employee identity. The read/write patterns are always on the full employee record. Normalizing adds complexity without benefit. |

---

### ADR-002: JWT Access + Refresh Tokens (vs. Session)

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Context** | Need stateless authentication that works with Angular SPA. Options: JWT only, JWT + refresh token, server-side sessions. |
| **Decision** | Use JWT access tokens (24h expiry) + refresh tokens (7d expiry). |
| **Consequences** | *Easier*: Stateless API scaling, no session store needed, mobile-friendly. *Harder*: Token revocation requires a blacklist, refresh tokens add complexity to the client. |
| **Rationale** | Sessions require sticky sessions or a Redis store — overkill for this system. JWT alone (long expiry) is insecure. Access + refresh tokens balance security and UX. |

---

### ADR-003: Soft Delete for Employees (vs. Hard Delete)

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Context** | Need to handle employee deletion while preserving audit trail and allowing recovery. |
| **Decision** | Implement soft delete using `is_deleted` boolean column. |
| **Consequences** | *Easier*: Undelete capability, audit trail preserved, referential integrity. *Harder*: Every query must filter `is_deleted = false`, slight performance overhead. |
| **Rationale**| HR data must never be truly deleted for compliance reasons. Soft delete is the standard pattern for employee management systems. |

---

### ADR-004: Master Data Table (vs. Enums in Code)

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Context** | Dropdown values (gender, religion, blood group, etc.) could be implemented as Java enums or stored in a database table. |
| **Decision** | Store all dropdown values in `master_data` table with category-based grouping. |
| **Consequences** | *Easier*: No code changes needed for new dropdown values, admin UI can manage them. *Harder*: Extra DB lookup, need caching strategy. |
| **Rationale** | The business requirement includes an admin interface for managing dropdown values. Enums would require recompilation for every new value. The DB approach makes the system dynamic. |

---

### ADR-005: Angular Standalone Components (vs. NgModules)

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Context** | Angular 17+ supports both standalone components and NgModule-based architecture. |
| **Decision** | Use standalone components throughout the application. |
| **Consequences** | *Easier*: Smaller boilerplate, lazy loading by default, tree-shakable. *Harder*: Migration for any non-standalone third-party libraries. |
| **Rationale** | Standalone is the Angular team's recommended approach for new projects and is the future of Angular. It simplifies the project structure significantly. |

---

## 12. Evolution Strategy

### Phase 1: Foundation (Current)
- Single-module monolith (Spring Boot + Angular)
- Single `employees` table with all 80 fields
- JWT auth with role-based access
- Basic CRUD with pagination and filtering
- Master data management UI

### Phase 2: Advanced Features
- **Employee Self-Service**: Employees can update limited fields (mobile, address, family details)
- **Approval Workflow**: Changes to sensitive fields require admin approval
- **Bulk Operations**: Mass update, bulk photo upload
- **Advanced Search**: Full-text search across all text fields

### Phase 3: Integration & Scale
- **API Gateway** if microservices become needed
- **Photo CDN** for distributed photo serving
- **Audit Dashboard** with visual change tracking
- **Report Scheduler** for periodic Excel exports
- **Leave & Attendance Module** (separate bounded context)

### Phase 4: Potential Splits
If the system outgrows the monolith:
1. **Employee Context** — Core employee data (80 fields)
2. **Payroll Context** — Salary, deductions, tax
3. **Attendance Context** — Time tracking, leave
4. **Recruitment Context** — Applicant tracking

Each context would have its own database and communicate via domain events (Kafka/RabbitMQ) or API calls.

### Scaling Considerations
| Concern | Current Approach | Future Scale |
|---------|-----------------|--------------|
| Database | Single MySQL instance | Read replicas for reporting, sharding by region |
| Photo Storage | Local filesystem | CDN (CloudFront/S3) with signed URLs |
| API | Monolithic Spring Boot | Service decomposition by domain |
| Search | Basic SQL LIKE queries | Elasticsearch for full-text search |
| Caching | In-memory Angular cache | Redis for master data, employee list |
| Authentication | JWT with BCrypt | OAuth 2.0 / OIDC if SSO required |

---

## Appendices

### A. Employee Code Generation Pattern

Format: `EMP` + 4-digit sequential number (e.g., `EMP0001`, `EMP0157`)

```java
@Service
public class EmployeeCodeGenerator {
    
    public String generateNextCode() {
        String maxCode = employeeRepository.findMaxEmployeeCode();
        if (maxCode == null) {
            return "EMP0001";
        }
        int number = Integer.parseInt(maxCode.substring(3)) + 1;
        return String.format("EMP%04d", number);
    }
}
```

### B. Photo Upload Directory Structure

```
uploads/
└── photos/
    ├── emp0001.jpg
    ├── emp0002.jpg
    ├── emp0157.jpg
    └── ...
```

### C. Seed Data for Master Data (data.sql)

```sql
-- GENDER
INSERT INTO master_data (category, code, value, sort_order) VALUES
('GENDER', 'MALE', 'Male', 1),
('GENDER', 'FEMALE', 'Female', 2),
('GENDER', 'OTHER', 'Other', 3);

-- PREFIX
INSERT INTO master_data (category, code, value, sort_order) VALUES
('PREFIX', 'MR', 'Mr.', 1),
('PREFIX', 'MS', 'Ms.', 2),
('PREFIX', 'MRS', 'Mrs.', 3);

-- MARITAL_STATUS
INSERT INTO master_data (category, code, value, sort_order) VALUES
('MARITAL_STATUS', 'SINGLE', 'Single', 1),
('MARITAL_STATUS', 'MARRIED', 'Married', 2),
('MARITAL_STATUS', 'DIVORCED', 'Divorced', 3),
('MARITAL_STATUS', 'WIDOWED', 'Widowed', 4);

-- F_M_H
INSERT INTO master_data (category, code, value, sort_order) VALUES
('F_M_H', 'FATHER', 'Father', 1),
('F_M_H', 'MOTHER', 'Mother', 2),
('F_M_H', 'HUSBAND', 'Husband', 3);

-- RELIGION
INSERT INTO master_data (category, code, value, sort_order) VALUES
('RELIGION', 'HINDU', 'Hindu', 1),
('RELIGION', 'MUSLIM', 'Muslim', 2),
('RELIGION', 'CHRISTIAN', 'Christian', 3),
('RELIGION', 'SIKH', 'Sikh', 4),
('RELIGION', 'BUDDHIST', 'Buddhist', 5),
('RELIGION', 'JAIN', 'Jain', 6),
('RELIGION', 'OTHER', 'Other', 7);

-- SOCIAL_CATEGORY
INSERT INTO master_data (category, code, value, sort_order) VALUES
('SOCIAL_CATEGORY', 'BC', 'BC', 1),
('SOCIAL_CATEGORY', 'OBC', 'OBC', 2),
('SOCIAL_CATEGORY', 'SC', 'SC', 3),
('SOCIAL_CATEGORY', 'ST', 'ST', 4),
('SOCIAL_CATEGORY', 'OC', 'OC', 5);

-- SOCIAL_SUBCATEGORY
INSERT INTO master_data (category, code, value, sort_order) VALUES
('SOCIAL_SUBCATEGORY', 'BC-A', 'BC-A', 1),
('SOCIAL_SUBCATEGORY', 'BC-B', 'BC-B', 2),
('SOCIAL_SUBCATEGORY', 'BC-C', 'BC-C', 3),
('SOCIAL_SUBCATEGORY', 'BC-D', 'BC-D', 4),
('SOCIAL_SUBCATEGORY', 'OBC-A', 'OBC-A', 5),
('SOCIAL_SUBCATEGORY', 'OBC-B', 'OBC-B', 6),
('SOCIAL_SUBCATEGORY', 'OC-A', 'OC-A', 7);

-- BLOOD_GROUP
INSERT INTO master_data (category, code, value, sort_order) VALUES
('BLOOD_GROUP', 'A+', 'A+', 1),
('BLOOD_GROUP', 'A-', 'A-', 2),
('BLOOD_GROUP', 'B+', 'B+', 3),
('BLOOD_GROUP', 'B-', 'B-', 4),
('BLOOD_GROUP', 'AB+', 'AB+', 5),
('BLOOD_GROUP', 'AB-', 'AB-', 6),
('BLOOD_GROUP', 'O+', 'O+', 7),
('BLOOD_GROUP', 'O-', 'O-', 8);

-- EMPLOYEE_STATUS
INSERT INTO master_data (category, code, value, sort_order) VALUES
('EMPLOYEE_STATUS', 'LIVE', 'Live', 1),
('EMPLOYEE_STATUS', 'QUIT', 'Quit', 2),
('EMPLOYEE_STATUS', 'SUSPENDED', 'Suspended', 3),
('EMPLOYEE_STATUS', 'MATERNITY_LEAVE', 'Maternity Leave', 4);

-- EXIT_TYPE
INSERT INTO master_data (category, code, value, sort_order) VALUES
('EXIT_TYPE', 'RESIGNED', 'Resigned', 1),
('EXIT_TYPE', 'RETIRED', 'Retired', 2),
('EXIT_TYPE', 'TERMINATED', 'Terminated', 3),
('EXIT_TYPE', 'ABSCONDING', 'Absconding', 4),
('EXIT_TYPE', 'DECEASED', 'Deceased', 5),
('EXIT_TYPE', 'STOPPED_COMING', 'Stopped Coming', 6);

-- OCCUPATION_KIN
INSERT INTO master_data (category, code, value, sort_order) VALUES
('OCCUPATION_KIN', 'SALARIED', 'Salaried', 1),
('OCCUPATION_KIN', 'SELF_EMPLOYED', 'Self Employed', 2),
('OCCUPATION_KIN', 'HOUSE_WIFE', 'House Wife', 3),
('OCCUPATION_KIN', 'STUDENT', 'Student', 4),
('OCCUPATION_KIN', 'OTHER', 'Other', 5);

-- YES_NO
INSERT INTO master_data (category, code, value, sort_order) VALUES
('YES_NO', 'YES', 'Yes', 1),
('YES_NO', 'NO', 'No', 2);

-- AGE_BRACKET
INSERT INTO master_data (category, code, value, sort_order) VALUES
('AGE_BRACKET', '25_BELOW', '25 & Below', 1),
('AGE_BRACKET', '26_30', '26 to 30', 2),
('AGE_BRACKET', '31_35', '31 to 35', 3),
('AGE_BRACKET', '36_40', '36 to 40', 4),
('AGE_BRACKET', '41_50', '41 to 50', 5),
('AGE_BRACKET', '51_ABOVE', '51 & Above', 6);

-- DESIGNATION
INSERT INTO master_data (category, code, value, sort_order) VALUES
('DESIGNATION', 'MANAGER', 'Manager', 1),
('DESIGNATION', 'ASST_MANAGER', 'Assistant Manager', 2),
('DESIGNATION', 'SR_ENGINEER', 'Senior Engineer', 3),
('DESIGNATION', 'ENGINEER', 'Engineer', 4),
('DESIGNATION', 'TRAINEE', 'Trainee', 5),
('DESIGNATION', 'CHIEF_MANAGER', 'Chief Manager', 6);
```
