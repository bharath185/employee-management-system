import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router, ChildrenOutletContexts } from '@angular/router';
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
                [(nzCollapsed)]="isCollapsed"
                [nzBreakpoint]="'md'"
                [nzCollapsedWidth]="64"
                [nzTrigger]="null">
        <div class="sidenav-inner">
          <div class="sidenav-header">
            <div class="sidenav-logo-wrapper">
              <img src="assets/logo-white.png" alt="EMS Logo" class="sidenav-logo">
            </div>
          </div>
          <ul nz-menu nzTheme="dark" nzMode="inline" class="side-nav-menu">
            <li nz-menu-item routerLink="/admin/dashboard"
                *ngIf="can('dashboard')"
                (click)="closeDrawerOnMobile()">
              <i nz-icon nzType="dashboard"></i>
              <span *ngIf="!isCollapsed()">Dashboard</span>
            </li>
            <li nz-menu-item routerLink="/admin/employees"
                *ngIf="can('staff_master')"
                (click)="closeDrawerOnMobile()">
              <i nz-icon nzType="team"></i>
              <span *ngIf="!isCollapsed()">Employees</span>
            </li>
            <li nz-menu-item routerLink="/admin/masters"
                *ngIf="can('masters')"
                (click)="closeDrawerOnMobile()">
              <i nz-icon nzType="setting"></i>
              <span *ngIf="!isCollapsed()">Master Data</span>
            </li>
            <li nz-menu-item routerLink="/admin/company"
                *ngIf="can('company')"
                (click)="closeDrawerOnMobile()">
              <i nz-icon nzType="bank"></i>
              <span *ngIf="!isCollapsed()">Company Setup</span>
            </li>
            <li nz-submenu nzTitle="Payroll" nzIcon="money-collect" class="side-submenu"
                *ngIf="can('payroll')">
              <ul>
                <li nz-menu-item routerLink="/admin/payroll/process"
                    (click)="closeDrawerOnMobile()">
                  <i nz-icon nzType="play-circle"></i>
                  <span *ngIf="!isCollapsed()">Process</span>
                </li>
                <li nz-menu-item routerLink="/admin/payroll/salary-master"
                    (click)="closeDrawerOnMobile()">
                  <i nz-icon nzType="bank"></i>
                  <span *ngIf="!isCollapsed()">Salary Master</span>
                </li>
                <li nz-menu-item routerLink="/admin/payroll/input"
                    (click)="closeDrawerOnMobile()">
                  <i nz-icon nzType="edit"></i>
                  <span *ngIf="!isCollapsed()">Employee Input</span>
                </li>
                <li nz-menu-item routerLink="/admin/payroll/payslips"
                    (click)="closeDrawerOnMobile()">
                  <i nz-icon nzType="file-text"></i>
                  <span *ngIf="!isCollapsed()">Payslips</span>
                </li>
                <li nz-menu-item routerLink="/admin/payroll/config"
                    *ngIf="authService.isAdmin()"
                    (click)="closeDrawerOnMobile()">
                  <i nz-icon nzType="mail"></i>
                  <span *ngIf="!isCollapsed()">Configuration</span>
                </li>
              </ul>
            </li>
            <li nz-menu-item routerLink="/admin/leave"
                *ngIf="can('leave')"
                (click)="closeDrawerOnMobile()">
              <i nz-icon nzType="calendar"></i>
              <span *ngIf="!isCollapsed()">Leave</span>
            </li>
            <li nz-menu-item routerLink="/admin/attendance"
                *ngIf="can('attendance')"
                (click)="closeDrawerOnMobile()">
              <i nz-icon nzType="schedule"></i>
              <span *ngIf="!isCollapsed()">Attendance</span>
            </li>
            <li nz-submenu nzTitle="Document Templates" nzIcon="file-text" class="side-submenu"
                *ngIf="can('doc_templates')">
              <ul>
                <li nz-menu-item routerLink="/admin/document-templates"
                    (click)="closeDrawerOnMobile()">
                  <i nz-icon nzType="file-text"></i>
                  <span *ngIf="!isCollapsed()">Templates</span>
                </li>
                <li nz-menu-item routerLink="/admin/document-templates/reports"
                    (click)="closeDrawerOnMobile()">
                  <i nz-icon nzType="bar-chart"></i>
                  <span *ngIf="!isCollapsed()">Reports</span>
                </li>
              </ul>
            </li>
            <li nz-menu-item routerLink="/admin/reports"
                *ngIf="can('reports')"
                (click)="closeDrawerOnMobile()">
              <i nz-icon nzType="audit"></i>
              <span *ngIf="!isCollapsed()">Reports</span>
            </li>
            <li nz-menu-item routerLink="/admin/statutory-reports"
                *ngIf="can('reports')"
                (click)="closeDrawerOnMobile()">
              <i nz-icon nzType="file-done"></i>
              <span *ngIf="!isCollapsed()">Statutory Reports</span>
            </li>
            <li nz-menu-item routerLink="/admin/pending-registrations"
                *ngIf="can('registrations')"
                (click)="closeDrawerOnMobile()">
              <i nz-icon nzType="audit"></i>
              <span *ngIf="!isCollapsed()">Registrations</span>
            </li>
            <li nz-menu-item routerLink="/admin/access-control"
                *ngIf="authService.isAdmin()"
                (click)="closeDrawerOnMobile()">
              <i nz-icon nzType="safety"></i>
              <span *ngIf="!isCollapsed()">Access Control</span>
            </li>
          </ul>
          <div class="sidenav-spacer"></div>
          <div class="sidenav-user-section">
            <div class="sidenav-footer-divider"></div>
            <div class="sidenav-user-card" *ngIf="!isCollapsed()">
              <div class="sidenav-user-avatar">{{ currentUserName ? currentUserName.charAt(0).toUpperCase() : 'A' }}</div>
              <div class="sidenav-user-info">
                <span class="sidenav-user-name">{{ currentUserName }}</span>
                <span class="sidenav-user-role">Administrator</span>
              </div>
            </div>
            <div class="sidenav-user-card-collapsed" *ngIf="isCollapsed()">
              <div class="sidenav-user-avatar">{{ currentUserName ? currentUserName.charAt(0).toUpperCase() : 'A' }}</div>
            </div>
          </div>
          <div class="sidenav-footer" (click)="logout()">
            <div class="sidenav-logout-item">
              <i nz-icon nzType="logout"></i>
              <span *ngIf="!isCollapsed()" class="sidenav-logout-text">Sign Out</span>
            </div>
          </div>
        </div>
      </nz-sider>
      <nz-layout>
        <nz-header class="header-toolbar">
          <button nz-button nzType="text" class="menu-button" (click)="toggleSidenav()">
            <i nz-icon [nzType]="isCollapsed() ? 'menu-fold' : 'menu-unfold'"></i>
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
    .skip-link:focus {
      top: 0;
    }
    .sidenav-container {
      height: 100vh;
    }
    .sidenav {
      transition: all 0.2s ease;
      overflow: hidden;
    }
    :host ::ng-deep .sidenav .ant-layout-sider-children { overflow: hidden; }
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
    .sidenav-spacer { flex: 1; }
    .sidenav-user-section { flex-shrink: 0; }
    .sidenav-footer { flex-shrink: 0; cursor: pointer; }
    .sidenav-footer-divider { height: 1px; background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent); margin: 0 8px; }
    .sidenav-user-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      margin: 0 8px 4px;
      border-radius: 10px;
      background: rgba(255,255,255,0.07);
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255,255,255,0.06);
    }
    .sidenav-user-card-collapsed {
      display: flex;
      justify-content: center;
      padding: 8px 0;
    }
    .sidenav-user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #2563eb;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .sidenav-user-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .sidenav-user-name {
      font-size: 13px;
      font-weight: 600;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.3;
    }
    .sidenav-user-role {
      font-size: 11px;
      color: rgba(255,255,255,0.5);
      line-height: 1.3;
    }
    .sidenav-logout-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      color: rgba(255,255,255,0.5);
      transition: all 0.2s;
      font-size: 14px;
      position: relative;
      z-index: 1;
    }
    .sidenav-logout-item:hover { color: #fff; background: rgba(255,255,255,0.08); }
    .sidenav-logout-item i[nz-icon] { font-size: 20px; }
    :host ::ng-deep .ant-layout-sider-collapsed .sidenav-logout-item { justify-content: center; padding: 12px 0; }
    :host ::ng-deep .ant-layout-sider-collapsed .sidenav-logout-item i[nz-icon] { font-size: 22px; }
    :host ::ng-deep .ant-layout-sider-collapsed .sidenav-footer-divider { margin: 0 4px; }
    :host ::ng-deep .sidenav::-webkit-scrollbar { display: none; }
    :host ::ng-deep .sidenav { scrollbar-width: none; -ms-overflow-style: none; }
    .sidenav-header {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px 16px;
      height: 80px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      position: relative;
      z-index: 1;
    }
    .sidenav-logo-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .sidenav-logo {
      width: 140px;
      height: auto;
      object-fit: contain;
    }
    :host ::ng-deep .ant-layout-sider-collapsed .sidenav-logo { width: 32px; }
    .side-nav-menu {
      border-right: none;
      background: transparent;
    }
    :host ::ng-deep .ant-layout-sider,
    :host ::ng-deep .ant-layout-sider-collapsed {
      transition: all 0.2s ease !important;
    }
    :host ::ng-deep .ant-layout-sider-zero-width-trigger {
      display: none;
    }
    :host ::ng-deep .ant-menu-item {
      height: 44px !important;
      line-height: 44px !important;
      margin: 2px 8px !important;
      border-radius: 10px !important;
      color: rgba(255,255,255,0.7) !important;
      display: flex !important;
      align-items: center !important;
      gap: 10px;
      position: relative;
      z-index: 1;
      transition: all 0.2s ease;
    }
    :host ::ng-deep .ant-menu-item > i {
      font-size: 20px;
      color: rgba(255,255,255,0.6);
      margin-right: 0 !important;
      transition: all 0.2s ease;
    }
    :host ::ng-deep .ant-menu-item > span {
      font-size: 14px;
      line-height: 1;
      font-weight: 500;
    }
    :host ::ng-deep .ant-menu-item:hover {
      background: rgba(255,255,255,0.08) !important;
      color: #ffffff !important;
    }
    :host ::ng-deep .ant-menu-item:hover i {
      color: #ffffff !important;
    }

    :host ::ng-deep .ant-menu-submenu {
      color: rgba(255,255,255,0.7) !important;
    }
    :host ::ng-deep .ant-menu-submenu-title {
      height: 44px !important;
      line-height: 44px !important;
      margin: 2px 8px !important;
      border-radius: 10px !important;
      color: rgba(255,255,255,0.7) !important;
      display: flex !important;
      align-items: center !important;
      gap: 10px;
      font-size: 14px;
      font-weight: 500;
      position: relative;
      z-index: 1;
      transition: all 0.2s ease;
    }
    :host ::ng-deep .ant-menu-submenu-title:hover {
      background: rgba(255,255,255,0.08) !important;
      color: #ffffff !important;
    }
    :host ::ng-deep .ant-menu-submenu-title .ant-menu-submenu-arrow {
      color: rgba(255,255,255,0.5);
    }
    :host ::ng-deep .ant-menu-submenu-selected > .ant-menu-submenu-title {
      color: #ffffff !important;
    }
    :host ::ng-deep .ant-menu-submenu-open > .ant-menu-submenu-title {
      background: rgba(255,255,255,0.06);
    }
    :host ::ng-deep .ant-menu-submenu .ant-menu-item {
      padding-left: 44px !important;
    }
    :host ::ng-deep .ant-menu-submenu .ant-menu-item:first-child {
      margin-top: 4px !important;
    }
    :host ::ng-deep .ant-menu-submenu .ant-menu-item:last-child {
      margin-bottom: 4px !important;
    }
    :host ::ng-deep .side-submenu.ant-menu-submenu > .ant-menu {
      background: rgba(0,0,0,0.2) !important;
      border-radius: 10px !important;
      margin: 0 8px 4px !important;
      padding: 2px 0 !important;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.04);
    }
    :host ::ng-deep .ant-layout-sider-collapsed .ant-menu-submenu-title {
      justify-content: center;
      padding: 0 !important;
      margin: 2px auto !important;
      width: 40px !important;
    }

    :host ::ng-deep .ant-layout-sider-collapsed .ant-menu-item {
      justify-content: center !important;
      padding: 0 !important;
      margin: 2px auto !important;
      width: 40px !important;
    }
    :host ::ng-deep .ant-layout-sider-collapsed .ant-menu-item i {
      font-size: 22px;
    }
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
    .admin-dropdown-avatar {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border-radius: 50%;
      background: #2563eb; color: #fff;
      font-size: 14px; font-weight: 700; flex-shrink: 0;
    }
    .toolbar-title {
      font-size: 17px;
      font-weight: 600;
      letter-spacing: -0.2px;
      color: #1a1a2e;
    }
    .toolbar-spacer {
      flex: 1 1 auto;
    }
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
    .profile-user-item {
      cursor: default !important;
    }
    :host ::ng-deep .profile-user-item.ant-menu-item {
      cursor: default !important;
      color: #1a1a2e !important;
      font-weight: 500;
      display: flex !important;
      align-items: center;
      gap: 10px;
    }
    :host ::ng-deep .profile-user-item.ant-menu-item:hover {
      background: transparent !important;
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
    .header-logout-icon {
      font-size: 18px;
    }
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
    :host ::ng-deep .admin-dropdown-menu .ant-menu-item:hover i {
      color: #2563eb !important;
    }
    :host ::ng-deep .admin-dropdown-menu .ant-menu-divider {
      background: #e8eaed !important;
      margin: 4px 12px !important;
    }
    .profile-user-details {
      display: flex;
      flex-direction: column;
      line-height: 1.3;
    }
    .profile-user-name {
      font-weight: 600;
      font-size: 13px;
    }
    .profile-user-role {
      font-size: 11px;
      color: rgba(0,0,0,0.4);
    }
    .profile-logout-item:hover i {
      color: #dc3545 !important;
    }
    .profile-logout-item:hover {
      background: rgba(220, 53, 69, 0.06) !important;
      color: #dc3545 !important;
    }
    :host ::ng-deep .sidenav {
      background: transparent !important;
      border-right: none !important;
      transition: all 0.2s ease;
      overflow: hidden;
      box-shadow: 2px 0 20px rgba(0,0,0,0.12);
    }
    :host ::ng-deep .sidenav .ant-layout-sider-children {
      background: transparent !important;
    }
    :host ::ng-deep .sidenav.ant-layout-sider-dark {
      background: transparent !important;
    }
    :host ::ng-deep .ant-layout-sider-trigger {
      background: rgba(31, 61, 110, 0.95) !important;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }

    /* Sidebar active menu item */
    :host ::ng-deep .ant-menu-item-selected {
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.25), rgba(37, 99, 235, 0.1)) !important;
      color: #ffffff !important;
      font-weight: 600;
      box-shadow: inset 3px 0 0 #4f8cff, 0 2px 8px rgba(37, 99, 235, 0.15);
    }
    :host ::ng-deep .ant-menu-item-selected i {
      color: #4f8cff !important;
    }

    :host ::ng-deep .ant-menu-submenu-selected > .ant-menu-submenu-title {
      color: #ffffff !important;
    }
    :host ::ng-deep .ant-menu-submenu-selected > .ant-menu-submenu-title i {
      color: #ffffff !important;
    }

    @media (max-width: 768px) {
      .main-content {
        padding: 16px;
      }
      .toolbar-title {
        font-size: 15px;
      }
    }
  `]
})
export class AdminLayoutComponent implements OnInit {
  isCollapsed = signal(false);
  isMobile = signal(false);
  currentUserName: string = '';

  constructor(
    public authService: AuthService,
    public permService: PermissionService,
    private router: Router
  ) {}

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

  toggleSidenav(): void {
    this.isCollapsed.set(!this.isCollapsed());
  }

  closeDrawerOnMobile(): void {
    // Close the sider on small screens by collapsing it
    const width = window.innerWidth;
    if (width < 768) {
      this.isCollapsed.set(true);
    }
  }

  logout(): void {
    this.authService.logout();
  }

  getRouteAnimation(outlet: RouterOutlet): string {
    return outlet?.activatedRouteData?.['title'] || '';
  }
}
