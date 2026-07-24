import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { CanDeactivateGuard } from './core/guards/can-deactivate.guard';

export const routes: Routes = [
  // ========== PUBLIC REGISTRATION ==========
  {
    path: 'register-new',
    loadComponent: () => import('./features/registration/public-registration.component')
      .then(m => m.PublicRegistrationComponent),
    title: 'New Joinee Registration'
  },

  // ========== AUTH ROUTES ==========
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.authRoutes)
  },

  // ========== ADMIN LAYOUT ==========
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin-layout/admin-layout.component')
      .then(m => m.AdminLayoutComponent),
    canActivate: [AuthGuard, roleGuard],
    data: { roles: ['ADMIN', 'HR'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component')
          .then(m => m.DashboardComponent),
        title: 'Dashboard'
      },
      {
        path: 'employees',
        loadComponent: () => import('./features/staff-master/staff-master-list.component')
          .then(m => m.StaffMasterListComponent),
        title: 'Employees'
      },
      {
        path: 'employees/new',
        loadComponent: () => import('./features/staff-master/staff-master-form.component')
          .then(m => m.StaffMasterFormComponent),
        title: 'New Employee'
      },
      {
        path: 'employees/:id',
        loadComponent: () => import('./features/staff-master/staff-master-view.component')
          .then(m => m.StaffMasterViewComponent),
        title: 'Employee Details'
      },
      {
        path: 'employees/:id/edit',
        loadComponent: () => import('./features/staff-master/staff-master-form.component')
          .then(m => m.StaffMasterFormComponent),
        title: 'Edit Employee'
      },
      {
        path: 'masters',
        loadComponent: () => import('./features/masters/masters.component')
          .then(m => m.MastersComponent),
        title: 'Master Data',
        canActivate: [roleGuard],
        data: { role: 'ADMIN' }
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component')
          .then(m => m.ReportsComponent),
        title: 'Reports'
      },
      {
        path: 'company',
        loadComponent: () => import('./features/company/company-setup.component')
          .then(m => m.CompanySetupComponent),
        title: 'Company Setup',
        canActivate: [roleGuard],
        data: { role: 'ADMIN' }
      },
      {
        path: 'document-templates',
        loadComponent: () => import('./features/document-templates/document-template-list.component')
          .then(m => m.DocumentTemplateListComponent),
        title: 'Document Templates',
        canActivate: [roleGuard],
        data: { role: 'ADMIN' }
      },
      {
        path: 'document-templates/new',
        loadComponent: () => import('./features/document-templates/document-template-form.component')
          .then(m => m.DocumentTemplateFormComponent),
        title: 'New Template',
        canActivate: [roleGuard],
        data: { role: 'ADMIN' }
      },
      {
        path: 'document-templates/:id/edit',
        loadComponent: () => import('./features/document-templates/document-template-form.component')
          .then(m => m.DocumentTemplateFormComponent),
        title: 'Edit Template',
        canActivate: [roleGuard],
        data: { role: 'ADMIN' }
      },
      {
        path: 'document-templates/reports',
        loadComponent: () => import('./features/document-templates/document-template-reports.component')
          .then(m => m.DocumentTemplateReportsComponent),
        title: 'Download Reports',
        canActivate: [roleGuard],
        data: { role: 'ADMIN' }
      },
      {
        path: 'payroll',
        redirectTo: 'payroll/process',
        pathMatch: 'full'
      },
      {
        path: 'payroll/process',
        loadComponent: () => import('./features/payroll/payroll-process.component')
          .then(m => m.PayrollProcessComponent),
        title: 'Payroll Processing'
      },
      {
        path: 'payroll/input',
        loadComponent: () => import('./features/payroll/payroll-input.component')
          .then(m => m.PayrollInputComponent),
        title: 'Payroll Input'
      },
      {
        path: 'payroll/payslips',
        loadComponent: () => import('./features/payroll/payslip-list.component')
          .then(m => m.PayslipListComponent),
        title: 'Payslips'
      },
      {
        path: 'payroll/config',
        loadComponent: () => import('./features/payroll/email-config.component')
          .then(m => m.EmailConfigComponent),
        title: 'Mail Configuration',
        canActivate: [roleGuard],
        data: { role: 'ADMIN' }
      },
      {
        path: 'payroll/salary-master',
        loadComponent: () => import('./features/payroll/salary-master.component')
          .then(m => m.SalaryMasterComponent),
        title: 'Salary Master'
      },
      {
        path: 'payroll/salary-list',
        loadComponent: () => import('./features/payroll/salary-list.component')
          .then(m => m.SalaryListComponent),
        title: 'Salary Management'
      },
      {
        path: 'bills',
        loadComponent: () => import('./features/bills-processing/bills-processing.component')
          .then(m => m.BillsProcessingComponent),
        title: 'Bills Processing'
      },
      {
        path: 'leave',
        redirectTo: 'leave/applications',
        pathMatch: 'full'
      },
      {
        path: 'leave/applications',
        loadComponent: () => import('./features/leave/leave-management.component')
          .then(m => m.LeaveManagementComponent),
        title: 'Leave & Attendance'
      },
      {
        path: 'leave/holidays',
        redirectTo: 'leave/applications',
        pathMatch: 'full'
      },
      {
        path: 'leave/comp-offs',
        redirectTo: 'leave/applications',
        pathMatch: 'full'
      },
      {
        path: 'leave/encashments',
        redirectTo: 'leave/applications',
        pathMatch: 'full'
      },
      {
        path: 'leave/attendance',
        loadComponent: () => import('./features/attendance/attendance.component')
          .then(m => m.AttendanceComponent),
        title: 'Attendance'
      },
      {
        path: 'attendance',
        redirectTo: 'leave/attendance',
        pathMatch: 'full'
      },
      {
        path: 'labour-reports',
        loadComponent: () => import('./features/labour-reports/labour-reports.component')
          .then(m => m.LabourReportsComponent),
        title: 'Labour Reports'
      },
      {
        path: 'pending-registrations',
        loadComponent: () => import('./features/pending-registrations/pending-registrations.component')
          .then(m => m.PendingRegistrationsComponent),
        title: 'Pending Registrations'
      },
      {
        path: 'access-control',
        loadComponent: () => import('./features/access-control/access-control.component')
          .then(m => m.AccessControlComponent),
        title: 'Access Control',
        canActivate: [roleGuard],
        data: { role: 'ADMIN' }
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // ========== EMPLOYEE LAYOUT ==========
  {
    path: 'employee',
    loadComponent: () => import('./layouts/employee-layout/employee-layout.component')
      .then(m => m.EmployeeLayoutComponent),
    canActivate: [AuthGuard, roleGuard],
    data: { roles: ['EMPLOYEE'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/employee-dashboard/employee-dashboard.component')
          .then(m => m.EmployeeDashboardComponent),
        title: 'Dashboard'
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/staff-master/staff-master-view.component')
          .then(m => m.StaffMasterViewComponent),
        title: 'My Profile'
      },
      {
        path: 'profile/edit',
        loadComponent: () => import('./features/staff-master/staff-master-form.component')
          .then(m => m.StaffMasterFormComponent),
        title: 'Edit Profile'
      },
      {
        path: 'leave',
        loadComponent: () => import('./features/my-leave/my-leave.component')
          .then(m => m.MyLeaveComponent),
        title: 'My Leave'
      },
      {
        path: 'comp-offs',
        loadComponent: () => import('./features/leave/my-comp-offs.component')
          .then(m => m.MyCompOffsComponent),
        title: 'My Comp-Offs'
      },
      {
        path: 'encashments',
        loadComponent: () => import('./features/leave/my-encashments.component')
          .then(m => m.MyEncashmentsComponent),
        title: 'My Encashments'
      },
      {
        path: 'payroll',
        loadComponent: () => import('./features/my-payroll/my-payroll.component')
          .then(m => m.MyPayrollComponent),
        title: 'My Payroll'
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // ========== DEFAULT & WILDCARD ==========
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth/login' }
];
