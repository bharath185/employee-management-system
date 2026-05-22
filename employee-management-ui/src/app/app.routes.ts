import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
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
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] },
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
        title: 'Master Data'
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component')
          .then(m => m.ReportsComponent),
        title: 'Reports'
      },
      {
        path: 'pending-registrations',
        loadComponent: () => import('./features/pending-registrations/pending-registrations.component')
          .then(m => m.PendingRegistrationsComponent),
        title: 'Pending Registrations'
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // ========== EMPLOYEE LAYOUT ==========
  {
    path: 'employee',
    loadComponent: () => import('./layouts/employee-layout/employee-layout.component')
      .then(m => m.EmployeeLayoutComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['EMPLOYEE'] },
    children: [
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
      { path: '', redirectTo: 'profile', pathMatch: 'full' }
    ]
  },

  // ========== DEFAULT & WILDCARD ==========
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth/login' }
];
