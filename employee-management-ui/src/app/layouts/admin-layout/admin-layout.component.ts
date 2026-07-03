import { Component, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { trigger, transition, style, animate, query } from '@angular/animations';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { ChatWidgetComponent } from '../../features/chat-widget/chat-widget.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    NzLayoutModule,
    NzMenuModule,
    NzIconModule,
    NzBreadCrumbModule,
    NzButtonModule,
    NzDropDownModule,
    NzToolTipModule,
    ChatWidgetComponent
  ],
  animations: [
    trigger('routeAnimation', [
      transition('* <=> *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(12px)' }),
          animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
        ], { optional: true })
      ])
    ])
  ],
  template: `
    <div class="bg-light"></div>
    <nz-layout class="sidenav-container">
      <nz-sider class="sidenav"
                nzTheme="dark"
                [nzCollapsed]="true"
                [nzCollapsedWidth]="64"
                [nzTrigger]="null">
        <div class="sidenav-inner">
          <div class="sidenav-header">
            <div class="sidenav-logo-wrapper">
              <img src="assets/logo-white.png" alt="EMS" class="sidenav-logo">
            </div>
          </div>
          <nav class="side-nav-scroll">
            <ul nz-menu nzTheme="dark" nzMode="inline" class="side-nav-menu">
              <li nz-menu-item routerLink="/admin/dashboard"
                  *ngIf="can('dashboard')"
                  nz-tooltip="Dashboard" nzTooltipPlacement="right"
                  (click)="closeDrawerOnMobile()">
                <i nz-icon nzType="dashboard"></i>
              </li>
              <li nz-menu-item routerLink="/admin/employees"
                  *ngIf="can('staff_master')"
                  nz-tooltip="Employees" nzTooltipPlacement="right"
                  (click)="closeDrawerOnMobile()">
                <i nz-icon nzType="team"></i>
              </li>
              <li nz-menu-item routerLink="/admin/masters"
                  *ngIf="can('masters')"
                  nz-tooltip="Master Data" nzTooltipPlacement="right"
                  (click)="closeDrawerOnMobile()">
                <i nz-icon nzType="setting"></i>
              </li>
              <li nz-menu-item routerLink="/admin/company"
                  *ngIf="can('company')"
                  nz-tooltip="Company Setup" nzTooltipPlacement="right"
                  (click)="closeDrawerOnMobile()">
                <i nz-icon nzType="bank"></i>
              </li>

              <li class="side-nav-separator"><span></span></li>

              <li nz-menu-item routerLink="/admin/payroll/process"
                  *ngIf="can('payroll')"
                  nz-tooltip="Payroll Process" nzTooltipPlacement="right"
                  (click)="closeDrawerOnMobile()">
                <i nz-icon nzType="play-circle"></i>
              </li>
              <li nz-menu-item routerLink="/admin/payroll/salary-master"
                  *ngIf="can('payroll')"
                  nz-tooltip="Salary Master" nzTooltipPlacement="right"
                  (click)="closeDrawerOnMobile()">
                <i nz-icon nzType="dollar"></i>
              </li>
              <li nz-menu-item routerLink="/admin/payroll/input"
                  *ngIf="can('payroll')"
                  nz-tooltip="Employee Input" nzTooltipPlacement="right"
                  (click)="closeDrawerOnMobile()">
                <i nz-icon nzType="edit"></i>
              </li>
              <li nz-menu-item routerLink="/admin/payroll/payslips"
                  *ngIf="can('payroll')"
                  nz-tooltip="Payslips" nzTooltipPlacement="right"
                  (click)="closeDrawerOnMobile()">
                <i nz-icon nzType="file-text"></i>
              </li>
              <li nz-menu-item routerLink="/admin/payroll/config"
                  *ngIf="authService.isAdmin()"
                  nz-tooltip="Payroll Config" nzTooltipPlacement="right"
                  (click)="closeDrawerOnMobile()">
                <i nz-icon nzType="mail"></i>
              </li>

              <li class="side-nav-separator"><span></span></li>

              <li nz-menu-item routerLink="/admin/leave"
                  *ngIf="can('leave')"
                  nz-tooltip="Leave" nzTooltipPlacement="right"
                  (click)="closeDrawerOnMobile()">
                <i nz-icon nzType="calendar"></i>
              </li>
              <li nz-menu-item routerLink="/admin/attendance"
                  *ngIf="can('attendance')"
                  nz-tooltip="Attendance" nzTooltipPlacement="right"
                  (click)="closeDrawerOnMobile()">
                <i nz-icon nzType="schedule"></i>
              </li>

              <li class="side-nav-separator"><span></span></li>

              <li nz-menu-item routerLink="/admin/document-templates"
                  *ngIf="can('doc_templates')"
                  nz-tooltip="Doc Templates" nzTooltipPlacement="right"
                  (click)="closeDrawerOnMobile()">
                <i nz-icon nzType="file-text"></i>
              </li>
              <li nz-menu-item routerLink="/admin/document-templates/reports"
                  *ngIf="can('doc_templates')"
                  nz-tooltip="Doc Reports" nzTooltipPlacement="right"
                  (click)="closeDrawerOnMobile()">
                <i nz-icon nzType="bar-chart"></i>
              </li>
              <li nz-menu-item routerLink="/admin/reports"
                  *ngIf="can('reports')"
                  nz-tooltip="Reports" nzTooltipPlacement="right"
                  (click)="closeDrawerOnMobile()">
                <i nz-icon nzType="audit"></i>
              </li>
              <li nz-menu-item routerLink="/admin/statutory-reports"
                  *ngIf="can('reports')"
                  nz-tooltip="Statutory Reports" nzTooltipPlacement="right"
                  (click)="closeDrawerOnMobile()">
                <i nz-icon nzType="file-done"></i>
              </li>
              <li nz-menu-item routerLink="/admin/pending-registrations"
                  *ngIf="can('registrations')"
                  nz-tooltip="Registrations" nzTooltipPlacement="right"
                  (click)="closeDrawerOnMobile()">
                <i nz-icon nzType="audit"></i>
              </li>
              <li nz-menu-item routerLink="/admin/access-control"
                  *ngIf="authService.isAdmin()"
                  nz-tooltip="Access Control" nzTooltipPlacement="right"
                  (click)="closeDrawerOnMobile()">
                <i nz-icon nzType="safety"></i>
              </li>
            </ul>
          </nav>
          <div class="sidenav-user-section">
            <div class="sidenav-footer-divider"></div>
            <div class="sidenav-user-avatar-wrap">
              <div class="sidenav-user-avatar" nz-tooltip="Profile" nzTooltipPlacement="right"
                   nz-dropdown [nzDropdownMenu]="sideProfileMenu">
                {{ currentUserName ? currentUserName.charAt(0).toUpperCase() : 'A' }}
              </div>
            </div>
          </div>
        </div>
      </nz-sider>

      <nz-dropdown-menu #sideProfileMenu="nzDropdownMenu">
        <ul nz-menu class="admin-dropdown-menu">
          <li nz-menu-item disabled class="profile-user-item">
            <span class="admin-dropdown-avatar">{{ currentUserName ? currentUserName.charAt(0).toUpperCase() : 'A' }}</span>
            <div class="profile-user-details">
              <span class="profile-user-name">{{ currentUserName }}</span>
              <span class="profile-user-role">Administrator</span>
            </div>
          </li>
          <li nz-menu-divider class="profile-divider"></li>
          <li nz-menu-item (click)="logout()" class="profile-logout-item">
            <i nz-icon nzType="logout"></i>
            <span>Sign Out</span>
          </li>
        </ul>
      </nz-dropdown-menu>

      <nz-layout>
        <nz-header class="header-toolbar">
          <button nz-button nzType="text" class="menu-button" (click)="mobileDrawerOpen.set(true)" *ngIf="isMobile()">
            <i nz-icon nzType="menu-fold"></i>
          </button>
          <span class="toolbar-title">Employee Management</span>
          <span class="toolbar-spacer"></span>

          <button nz-button nzType="text" nz-tooltip="Logout" class="header-icon-btn" (click)="logout()">
            <i nz-icon nzType="logout" class="header-logout-icon"></i>
          </button>
          <button nz-button nzType="text" nz-dropdown [nzDropdownMenu]="profileMenu" class="profile-btn">
            <span class="admin-avatar-circle">{{ currentUserName ? currentUserName.charAt(0).toUpperCase() : 'A' }}</span>
          </button>
          <nz-dropdown-menu #profileMenu="nzDropdownMenu">
            <ul nz-menu class="admin-dropdown-menu">
              <li nz-menu-item disabled class="profile-user-item">
                <span class="admin-dropdown-avatar">{{ currentUserName ? currentUserName.charAt(0).toUpperCase() : 'A' }}</span>
                <div class="profile-user-details">
                  <span class="profile-user-name">{{ currentUserName }}</span>
                  <span class="profile-user-role">Administrator</span>
                </div>
              </li>
              <li nz-menu-divider class="profile-divider"></li>
              <li nz-menu-item (click)="logout()" class="profile-logout-item">
                <i nz-icon nzType="logout"></i>
                <span>Sign Out</span>
              </li>
            </ul>
          </nz-dropdown-menu>
        </nz-header>
        <nz-content>
          <main id="main-content" class="main-content" [@routeAnimation]="getRouteAnimation(outlet)">
            <router-outlet #outlet="outlet"></router-outlet>
          </main>
        </nz-content>
      </nz-layout>
    </nz-layout>

    <!-- Mobile drawer overlay -->
    <div class="mobile-overlay" *ngIf="mobileDrawerOpen()" (click)="mobileDrawerOpen.set(false)"></div>
    <div class="mobile-drawer" *ngIf="mobileDrawerOpen()">
      <div class="mobile-drawer-header">
        <img src="assets/logo-white.png" alt="EMS" class="mobile-drawer-logo">
        <button nz-button nzType="text" class="mobile-close-btn" (click)="mobileDrawerOpen.set(false)">
          <i nz-icon nzType="close"></i>
        </button>
      </div>
      <ul nz-menu nzTheme="dark" nzMode="inline" class="mobile-drawer-menu">
        <li nz-menu-item routerLink="/admin/dashboard" *ngIf="can('dashboard')" (click)="mobileDrawerOpen.set(false)">
          <i nz-icon nzType="dashboard"></i><span>Dashboard</span>
        </li>
        <li nz-menu-item routerLink="/admin/employees" *ngIf="can('staff_master')" (click)="mobileDrawerOpen.set(false)">
          <i nz-icon nzType="team"></i><span>Employees</span>
        </li>
        <li nz-menu-item routerLink="/admin/masters" *ngIf="can('masters')" (click)="mobileDrawerOpen.set(false)">
          <i nz-icon nzType="setting"></i><span>Master Data</span>
        </li>
        <li nz-menu-item routerLink="/admin/company" *ngIf="can('company')" (click)="mobileDrawerOpen.set(false)">
          <i nz-icon nzType="bank"></i><span>Company Setup</span>
        </li>
        <li nz-menu-divider style="background:rgba(255,255,255,0.08);margin:4px 12px"></li>
        <li nz-menu-item routerLink="/admin/payroll/process" *ngIf="can('payroll')" (click)="mobileDrawerOpen.set(false)">
          <i nz-icon nzType="play-circle"></i><span>Payroll Process</span>
        </li>
        <li nz-menu-item routerLink="/admin/payroll/salary-master" *ngIf="can('payroll')" (click)="mobileDrawerOpen.set(false)">
          <i nz-icon nzType="dollar"></i><span>Salary Master</span>
        </li>
        <li nz-menu-item routerLink="/admin/payroll/input" *ngIf="can('payroll')" (click)="mobileDrawerOpen.set(false)">
          <i nz-icon nzType="edit"></i><span>Employee Input</span>
        </li>
        <li nz-menu-item routerLink="/admin/payroll/payslips" *ngIf="can('payroll')" (click)="mobileDrawerOpen.set(false)">
          <i nz-icon nzType="file-text"></i><span>Payslips</span>
        </li>
        <li nz-menu-item routerLink="/admin/payroll/config" *ngIf="authService.isAdmin()" (click)="mobileDrawerOpen.set(false)">
          <i nz-icon nzType="mail"></i><span>Payroll Config</span>
        </li>
        <li nz-menu-divider style="background:rgba(255,255,255,0.08);margin:4px 12px"></li>
        <li nz-menu-item routerLink="/admin/leave" *ngIf="can('leave')" (click)="mobileDrawerOpen.set(false)">
          <i nz-icon nzType="calendar"></i><span>Leave</span>
        </li>
        <li nz-menu-item routerLink="/admin/attendance" *ngIf="can('attendance')" (click)="mobileDrawerOpen.set(false)">
          <i nz-icon nzType="schedule"></i><span>Attendance</span>
        </li>
        <li nz-menu-divider style="background:rgba(255,255,255,0.08);margin:4px 12px"></li>
        <li nz-menu-item routerLink="/admin/document-templates" *ngIf="can('doc_templates')" (click)="mobileDrawerOpen.set(false)">
          <i nz-icon nzType="file-text"></i><span>Doc Templates</span>
        </li>
        <li nz-menu-item routerLink="/admin/document-templates/reports" *ngIf="can('doc_templates')" (click)="mobileDrawerOpen.set(false)">
          <i nz-icon nzType="bar-chart"></i><span>Doc Reports</span>
        </li>
        <li nz-menu-item routerLink="/admin/reports" *ngIf="can('reports')" (click)="mobileDrawerOpen.set(false)">
          <i nz-icon nzType="audit"></i><span>Reports</span>
        </li>
        <li nz-menu-item routerLink="/admin/statutory-reports" *ngIf="can('reports')" (click)="mobileDrawerOpen.set(false)">
          <i nz-icon nzType="file-done"></i><span>Statutory Reports</span>
        </li>
        <li nz-menu-item routerLink="/admin/pending-registrations" *ngIf="can('registrations')" (click)="mobileDrawerOpen.set(false)">
          <i nz-icon nzType="audit"></i><span>Registrations</span>
        </li>
        <li nz-menu-item routerLink="/admin/access-control" *ngIf="authService.isAdmin()" (click)="mobileDrawerOpen.set(false)">
          <i nz-icon nzType="safety"></i><span>Access Control</span>
        </li>
      </ul>
    </div>
    <app-chat-widget></app-chat-widget>
  `,
  styles: [`
    .skip-link {
      position: fixed;
      top: -100%;
      left: 8px;
      z-index: 10000;
      background: #fff;
      color: #2563eb;
      padding: 8px 16px;
      border-radius: 0 0 8px 8px;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      transition: top 0.2s ease;
    }
    .skip-link:focus { top: 0; }
    .sidenav-container { height: 100vh; }

    :host ::ng-deep .sidenav.ant-layout-sider {
      background: transparent !important;
      border-right: none !important;
      box-shadow: 2px 0 20px rgba(0,0,0,0.12);
      flex: 0 0 64px !important;
      max-width: 64px !important;
      min-width: 64px !important;
      width: 64px !important;
    }
    :host ::ng-deep .sidenav .ant-layout-sider-children { overflow: hidden; }
    :host ::ng-deep .sidenav.ant-layout-sider-dark { background: transparent !important; }
    :host ::ng-deep .ant-layout-sider-zero-width-trigger { display: none; }

    .sidenav-inner {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: linear-gradient(160deg, rgba(31, 61, 110, 0.92), rgba(20, 40, 75, 0.96));
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      position: relative;
    }
    .sidenav-inner::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 20% 20%, rgba(37, 99, 235, 0.08), transparent 60%),
                  radial-gradient(ellipse at 80% 80%, rgba(99, 102, 241, 0.06), transparent 50%);
      pointer-events: none;
    }

    .sidenav-header {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px 0;
      height: 64px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      position: relative;
      z-index: 1;
      flex-shrink: 0;
    }
    .sidenav-logo { width: 32px; height: auto; object-fit: contain; }

    .side-nav-scroll {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 8px 0;
      position: relative;
      z-index: 1;
    }
    .side-nav-scroll::-webkit-scrollbar { width: 2px; }
    .side-nav-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
    .side-nav-scroll { scrollbar-width: thin; }

    .side-nav-menu {
      border-right: none;
      background: transparent;
    }

    :host ::ng-deep .side-nav-menu.ant-menu {
      background: transparent !important;
    }

    :host ::ng-deep .ant-menu-item {
      height: 42px !important;
      line-height: 42px !important;
      margin: 2px 10px !important;
      border-radius: 10px !important;
      color: rgba(255,255,255,0.6) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0 !important;
      width: 44px !important;
      position: relative;
      z-index: 1;
      transition: all 0.2s ease;
    }
    :host ::ng-deep .ant-menu-item > i {
      font-size: 20px;
      color: rgba(255,255,255,0.55);
      margin-right: 0 !important;
      transition: all 0.2s ease;
    }
    :host ::ng-deep .ant-menu-item:hover {
      background: rgba(255,255,255,0.1) !important;
      color: #ffffff !important;
    }
    :host ::ng-deep .ant-menu-item:hover > i {
      color: #ffffff !important;
    }

    :host ::ng-deep .ant-menu-item-selected {
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.3), rgba(37, 99, 235, 0.12)) !important;
      color: #ffffff !important;
      box-shadow: inset 3px 0 0 #4f8cff, 0 2px 8px rgba(37, 99, 235, 0.15);
    }
    :host ::ng-deep .ant-menu-item-selected > i {
      color: #4f8cff !important;
    }

    .side-nav-separator {
      display: flex;
      justify-content: center;
      padding: 6px 0;
      list-style: none;
      position: relative;
      z-index: 1;
    }
    .side-nav-separator span {
      display: block;
      width: 20px;
      height: 1px;
      background: rgba(255,255,255,0.08);
      border-radius: 2px;
    }

    .sidenav-user-section {
      flex-shrink: 0;
      position: relative;
      z-index: 1;
    }
    .sidenav-footer-divider { height: 1px; background: linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent); margin: 0 12px; }
    .sidenav-user-avatar-wrap {
      display: flex;
      justify-content: center;
      padding: 10px 0;
    }
    .sidenav-user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #2563eb;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .sidenav-user-avatar:hover {
      box-shadow: 0 0 16px rgba(37, 99, 235, 0.4);
      transform: scale(1.05);
    }

    /* Header */
    .header-toolbar {
      background: rgba(255,255,255,0.85) !important;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(232, 234, 237, 0.6);
      color: #1a1a2e !important;
      position: sticky;
      top: 0;
      z-index: 1000;
      height: 56px;
      display: flex;
      align-items: center;
      padding: 0 20px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }
    .menu-button {
      margin-right: 8px;
      color: #6c757d !important;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: all 0.2s ease;
    }
    .menu-button:hover {
      color: #2563eb !important;
      background: #eff6ff;
    }
    .profile-btn {
      width: 36px;
      height: 36px;
      display: flex !important;
      align-items: center;
      justify-content: center;
      border-radius: 50% !important;
      padding: 0 !important;
      background: #2563eb !important;
      transition: all 0.2s ease;
    }
    .profile-btn:hover {
      box-shadow: 0 0 20px rgba(37, 99, 235, 0.3);
    }
    .admin-avatar-circle {
      display: flex; align-items: center; justify-content: center;
      width: 30px; height: 30px; border-radius: 50%;
      background: rgba(255,255,255,0.2); color: #fff;
      font-size: 14px; font-weight: 700;
    }
    .header-icon-btn {
      width: 36px;
      height: 36px;
      display: flex !important;
      align-items: center;
      justify-content: center;
      border-radius: 50% !important;
      padding: 0 !important;
      color: #6c757d !important;
      transition: all 0.2s ease;
      margin-right: 4px;
    }
    .header-icon-btn:hover {
      color: #dc3545 !important;
      background: rgba(220, 53, 69, 0.08) !important;
    }
    .header-logout-icon { font-size: 18px; }
    .toolbar-title {
      font-size: 17px;
      font-weight: 600;
      letter-spacing: -0.2px;
      color: #1a1a2e;
    }
    .toolbar-spacer { flex: 1 1 auto; }

    /* Main content */
    .main-content {
      padding: 0;
      height: calc(100vh - 56px);
      position: relative;
      background: linear-gradient(135deg, #f5f7fa 0%, #eef1f5 100%);
      animation: pageEnter 0.35s cubic-bezier(0.4, 0, 0.2, 1) both;
      overflow: hidden;
    }
    .main-content::before {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: radial-gradient(ellipse at 0% 0%, rgba(37, 99, 235, 0.02), transparent 50%);
    }

    /* Profile dropdown */
    .profile-user-item { cursor: default !important; }
    :host ::ng-deep .profile-user-item.ant-menu-item {
      cursor: default !important;
      color: #1a1a2e !important;
      font-weight: 500;
      display: flex !important;
      align-items: center;
      gap: 10px;
    }
    :host ::ng-deep .profile-user-item.ant-menu-item:hover { background: transparent !important; }
    :host ::ng-deep .admin-dropdown-menu {
      background: #ffffff !important;
      border: 1px solid rgba(232, 234, 237, 0.8) !important;
      border-radius: 12px !important;
      padding: 6px;
      min-width: 200px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1) !important;
    }
    :host ::ng-deep .admin-dropdown-menu .ant-menu-item {
      color: #1a1a2e !important;
      border-radius: 8px !important;
      margin: 2px 0 !important;
      height: 40px !important;
      line-height: 40px !important;
      font-size: 13px;
    }
    :host ::ng-deep .admin-dropdown-menu .ant-menu-item:hover {
      background: #eff6ff !important;
      color: #2563eb !important;
    }
    :host ::ng-deep .admin-dropdown-menu .ant-menu-item i {
      color: #6c757d !important;
      font-size: 16px;
    }
    :host ::ng-deep .admin-dropdown-menu .ant-menu-item:hover i { color: #2563eb !important; }
    :host ::ng-deep .admin-dropdown-menu .ant-menu-divider {
      background: #e8eaed !important;
      margin: 4px 12px !important;
    }
    .profile-user-details {
      display: flex;
      flex-direction: column;
      line-height: 1.3;
    }
    .profile-user-name { font-weight: 600; font-size: 13px; }
    .profile-user-role { font-size: 11px; color: rgba(0,0,0,0.4); }
    .profile-logout-item:hover i { color: #dc3545 !important; }
    .profile-logout-item:hover { background: rgba(220, 53, 69, 0.06) !important; color: #dc3545 !important; }
    .admin-dropdown-avatar {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border-radius: 50%;
      background: #2563eb; color: #fff;
      font-size: 14px; font-weight: 700; flex-shrink: 0;
    }

    /* Mobile drawer */
    .mobile-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      z-index: 2000;
      backdrop-filter: blur(4px);
      animation: fadeIn 0.2s ease;
    }
    .mobile-drawer {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: 280px;
      background: linear-gradient(160deg, rgba(31, 61, 110, 0.98), rgba(20, 40, 75, 0.98));
      backdrop-filter: blur(16px);
      z-index: 2001;
      display: flex;
      flex-direction: column;
      box-shadow: 4px 0 24px rgba(0,0,0,0.2);
      animation: slideInLeft 0.25s ease;
    }
    .mobile-drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .mobile-drawer-logo { width: 120px; height: auto; }
    .mobile-close-btn { color: rgba(255,255,255,0.6) !important; }
    .mobile-close-btn:hover { color: #fff !important; }
    :host ::ng-deep .mobile-drawer-menu.ant-menu {
      background: transparent !important;
      border: none !important;
      flex: 1;
      overflow-y: auto;
    }
    :host ::ng-deep .mobile-drawer-menu .ant-menu-item {
      height: 44px !important;
      line-height: 44px !important;
      margin: 2px 8px !important;
      border-radius: 10px !important;
      color: rgba(255,255,255,0.7) !important;
      display: flex !important;
      align-items: center !important;
      gap: 12px;
      padding-left: 16px !important;
    }
    :host ::ng-deep .mobile-drawer-menu .ant-menu-item i { font-size: 20px; margin-right: 0; }
    :host ::ng-deep .mobile-drawer-menu .ant-menu-item:hover {
      background: rgba(255,255,255,0.08) !important;
      color: #fff !important;
    }
    :host ::ng-deep .mobile-drawer-menu .ant-menu-item-selected {
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.25), rgba(37, 99, 235, 0.1)) !important;
      color: #fff !important;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }

    @media (max-width: 768px) {
      .main-content { padding: 16px; }
      .toolbar-title { font-size: 15px; }
    }
  `]
})
export class AdminLayoutComponent implements OnInit {
  isCollapsed = signal(true);
  isMobile = signal(false);
  mobileDrawerOpen = signal(false);
  currentUserName: string = '';

  constructor(
    public authService: AuthService,
    public permService: PermissionService,
    private router: Router
  ) {
    this.checkMobile();
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile.set(window.innerWidth < 768);
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUserName = user ? `${user.firstName} ${user.surname}` : 'User';
    });
    const role = this.authService.getUserRole() || 'EMPLOYEE';
    this.permService.loadMyPermissions(role).subscribe();
  }

  can(resource: string): boolean {
    const role = this.authService.getUserRole() || 'EMPLOYEE';
    if (role === 'ADMIN') return true;
    return this.permService.hasPermission(role, resource, 'canView');
  }

  closeDrawerOnMobile(): void {
    if (window.innerWidth < 768) {
      // mobile drawer handles itself
    }
  }

  logout(): void {
    this.authService.logout();
  }

  getRouteAnimation(outlet: RouterOutlet): string {
    return outlet?.activatedRouteData?.['title'] || '';
  }
}
