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
    <nz-layout class="sidenav-container">
      <nz-sider class="sidenav"
                nzTheme="dark"
                [(nzCollapsed)]="isCollapsed"
                [nzBreakpoint]="'md'"
                [nzWidth]="240"
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
              <li nz-menu-item routerLink="/admin/document-templates"
                  *ngIf="can('doc_templates')"
                  (click)="closeDrawerOnMobile()">
                <i nz-icon nzType="file-text"></i>
                <span *ngIf="!isCollapsed()">Documents</span>
              </li>

              <li class="side-nav-separator" *ngIf="!isCollapsed()"><span></span></li>

              <li nz-menu-item routerLink="/admin/payroll" routerLinkActive="ant-menu-item-selected"
                  *ngIf="can('payroll')"
                  (click)="closeDrawerOnMobile()">
                <i nz-icon nzType="money-collect"></i>
                <span *ngIf="!isCollapsed()">Payroll</span>
              </li>
              <li nz-menu-item routerLink="/admin/bills"
                  *ngIf="can('bills')"
                  (click)="closeDrawerOnMobile()">
                <i nz-icon nzType="audit"></i>
                <span *ngIf="!isCollapsed()">Vendor Bills</span>
              </li>
              <li nz-submenu
                  *ngIf="can('leave')"
                  (click)="closeDrawerOnMobile()"
                  nzTitle="Leave & Attendance"
                  nzIcon="calendar"
                  [nzOpen]="isLeaveMenuOpen"
                  (nzOpenChange)="isLeaveMenuOpen = $event"
                  class="custom-submenu">
                <ul>
                  <li nz-menu-item routerLink="/admin/leave/applications" routerLinkActive="ant-menu-item-selected">
                    <i nz-icon nzType="appstore"></i>
                    <span>Apps & Balance</span>
                  </li>
                  <li nz-menu-item routerLink="/admin/leave/attendance" routerLinkActive="ant-menu-item-selected">
                    <i nz-icon nzType="schedule"></i>
                    <span>Attendance</span>
                  </li>
                </ul>
              </li>

              <li class="side-nav-separator" *ngIf="!isCollapsed()"><span></span></li>

              <li nz-menu-item routerLink="/admin/reports" routerLinkActive="ant-menu-item-selected"
                  (click)="closeDrawerOnMobile()">
                <i nz-icon nzType="bar-chart"></i>
                <span *ngIf="!isCollapsed()">Reports</span>
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
          </nav>
          <div class="sidenav-user-section">
            <div class="sidenav-footer-divider"></div>
            <div class="sidenav-user-card" *ngIf="!isCollapsed()">
              <div class="sidenav-user-avatar">{{ currentUserName ? currentUserName.charAt(0).toUpperCase() : 'A' }}</div>
              <div class="sidenav-user-info">
                <span class="sidenav-user-name">{{ currentUserName }}</span>
                <span class="sidenav-user-role">Administrator</span>
              </div>
            </div>
            <div class="sidenav-user-avatar-wrap" *ngIf="isCollapsed()"
                 nz-dropdown [nzDropdownMenu]="sideProfileMenu">
              <div class="sidenav-user-avatar">{{ currentUserName ? currentUserName.charAt(0).toUpperCase() : 'A' }}</div>
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
          <button nz-button nzType="text" class="menu-button" (click)="toggleSidenav()">
            <i nz-icon [nzType]="isCollapsed() ? 'menu-fold' : 'menu-unfold'"></i>
          </button>
          <span class="toolbar-spacer"></span>

          <button nz-button nzType="text" nz-tooltip="Logout" class="header-icon-btn" (click)="logout()">
            <i nz-icon nzType="logout" class="header-logout-icon"></i>
          </button>
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
    .skip-link:focus { top: 0; }
    .sidenav-container { height: 100vh; }

    :host ::ng-deep .sidenav {
      background: transparent !important;
      border-right: none !important;
      transition: all 0.25s ease;
      box-shadow: 2px 0 20px rgba(0,0,0,0.1);
    }
    :host ::ng-deep .sidenav.ant-layout-sider-dark { background: transparent !important; }
    :host ::ng-deep .ant-layout-sider-zero-width-trigger { display: none; }

    .sidenav-inner {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: linear-gradient(180deg, #1f3d6e 0%, #162a50 50%, #0f1e3c 100%);
      position: relative;
      margin: 8px 6px 8px 0;
      border-radius: 12px;
      overflow: hidden;
    }

    .sidenav-header {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px 12px;
      height: 64px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      position: relative;
      z-index: 1;
      flex-shrink: 0;
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
      transition: all 0.2s ease;
      flex-shrink: 0;
    }
    :host ::ng-deep .ant-layout-sider-collapsed .sidenav-logo { width: 40px; }
    :host ::ng-deep .ant-layout-sider-collapsed .sidenav-header { padding: 16px 0; }

    .side-nav-scroll {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 6px 0;
      position: relative;
      z-index: 1;
    }
    .side-nav-scroll::-webkit-scrollbar { width: 3px; }
    .side-nav-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

    .side-nav-menu {
      border-right: none;
      background: transparent;
    }
    :host ::ng-deep .side-nav-menu.ant-menu { background: transparent !important; }

    :host ::ng-deep .ant-menu-item {
      height: 38px !important;
      line-height: 38px !important;
      margin: 2px 8px !important;
      border-radius: 8px !important;
      color: rgba(255,255,255,0.55) !important;
      display: flex !important;
      align-items: center !important;
      gap: 10px;
      padding: 0 12px !important;
      position: relative;
      z-index: 1;
      transition: all 0.15s ease;
    }
    :host ::ng-deep .ant-menu-item > i {
      font-size: 18px;
      width: 18px;
      color: rgba(255,255,255,0.4);
      margin-right: 0 !important;
      transition: all 0.15s ease;
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    :host ::ng-deep .ant-menu-item > span {
      font-size: 13px;
      line-height: 1;
      font-weight: 500;
      white-space: nowrap;
    }
    :host ::ng-deep .ant-menu-item:hover {
      background: rgba(255,255,255,0.08) !important;
      color: #ffffff !important;
    }
    :host ::ng-deep .ant-menu-item:hover > i {
      color: rgba(255,255,255,0.85) !important;
    }
    :host ::ng-deep .ant-menu-item-selected {
      background: rgba(67, 97, 238, 0.25) !important;
      color: #ffffff !important;
      font-weight: 600;
      box-shadow: inset 3px 0 0 #4361ee;
    }
    :host ::ng-deep .ant-menu-item-selected > i {
      color: #4361ee !important;
    }

    :host ::ng-deep .ant-layout-sider-collapsed .ant-menu-item {
      height: 42px !important;
      line-height: 42px !important;
      justify-content: center !important;
      padding: 0 !important;
      margin: 3px auto !important;
      width: 42px !important;
    }
    :host ::ng-deep .ant-layout-sider-collapsed .ant-menu-item i {
      font-size: 20px;
      width: 20px;
    }

    :host ::ng-deep .custom-submenu.ant-menu-submenu {
      margin: 2px 8px !important;
      border-radius: 8px !important;
    }
    :host ::ng-deep .custom-submenu .ant-menu-submenu-title {
      height: 38px !important;
      line-height: 38px !important;
      margin: 0 !important;
      border-radius: 8px !important;
      color: rgba(255,255,255,0.55) !important;
      display: flex !important;
      align-items: center !important;
      gap: 10px;
      padding: 0 12px !important;
      transition: all 0.15s ease;
    }
    :host ::ng-deep .custom-submenu .ant-menu-submenu-title > i {
      font-size: 18px;
      width: 18px;
      color: rgba(255,255,255,0.4);
      margin-right: 0 !important;
    }
    :host ::ng-deep .custom-submenu .ant-menu-submenu-title:hover {
      background: rgba(255,255,255,0.08) !important;
      color: #ffffff !important;
    }
    :host ::ng-deep .custom-submenu.ant-menu-submenu-open > .ant-menu-submenu-title {
      color: #ffffff !important;
      background: rgba(255,255,255,0.04) !important;
    }
    :host ::ng-deep .custom-submenu.ant-menu-submenu-open > .ant-menu-submenu-title > i {
      color: #4361ee !important;
    }
    :host ::ng-deep .custom-submenu .ant-menu-item {
      margin: 1px 6px !important;
      padding-left: 38px !important;
      height: 34px !important;
      line-height: 34px !important;
      border-radius: 6px !important;
      font-size: 12px;
    }
    :host ::ng-deep .custom-submenu .ant-menu-item > i {
      font-size: 14px;
      width: 14px;
      margin-right: 8px !important;
    }
    :host ::ng-deep .custom-submenu .ant-menu-item-selected {
      background: rgba(67, 97, 238, 0.25) !important;
      box-shadow: inset 3px 0 0 #4361ee;
    }
    :host ::ng-deep .ant-layout-sider-collapsed .custom-submenu .ant-menu-submenu-title {
      justify-content: center !important;
      padding: 0 !important;
    }

    .side-nav-separator {
      display: flex;
      justify-content: center;
      padding: 4px 12px;
      list-style: none;
      position: relative;
      z-index: 1;
    }
    .side-nav-separator span {
      display: block;
      width: 100%;
      height: 1px;
      background: rgba(255,255,255,0.05);
    }

    .sidenav-user-section {
      flex-shrink: 0;
      position: relative;
      z-index: 1;
      padding-bottom: 8px;
    }
    .sidenav-footer-divider {
      height: 1px;
      background: rgba(255,255,255,0.06);
      margin: 0 12px;
    }
    .sidenav-user-card {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      margin: 6px 8px;
      border-radius: 8px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.04);
    }
    .sidenav-user-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #4361ee;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .sidenav-user-avatar:hover { box-shadow: 0 0 12px rgba(67,97,238,0.4); }
    .sidenav-user-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .sidenav-user-name {
      font-size: 12px;
      font-weight: 600;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.3;
    }
    .sidenav-user-role {
      font-size: 10px;
      color: rgba(255,255,255,0.35);
      line-height: 1.3;
    }
    .sidenav-user-avatar-wrap {
      display: flex;
      justify-content: center;
      padding: 8px 0;
    }

    /* Header */
    .header-toolbar {
      background: #fff !important;
      border-bottom: 1px solid #e8eaed;
      color: #1a1a2e !important;
      position: sticky;
      top: 0;
      z-index: 1000;
      height: 44px;
      display: flex;
      align-items: center;
      padding: 0 12px;
      margin: 8px 8px 0;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .menu-button {
      margin-right: 6px;
      color: #6c757d !important;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.15s ease;
    }
    .menu-button:hover { color: #1f3d6e !important; background: #f0f4ff; }
    .header-icon-btn {
      width: 32px;
      height: 32px;
      display: flex !important;
      align-items: center;
      justify-content: center;
      border-radius: 6px !important;
      padding: 0 !important;
      color: #6c757d !important;
      transition: all 0.15s ease;
    }
    .header-icon-btn:hover { color: #dc3545 !important; background: rgba(220,53,69,0.06) !important; }
    .header-logout-icon { font-size: 16px; }
    .toolbar-spacer { flex: 1 1 auto; }

    /* Main content */
    .main-content {
      padding: 8px;
      height: calc(100vh - 52px);
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
    }

    /* Profile dropdown */
    .profile-user-item { cursor: default !important; }
    :host ::ng-deep .profile-user-item.ant-menu-item {
      cursor: default !important; color: #1a1a2e !important; font-weight: 500;
      display: flex !important; align-items: center; gap: 10px;
    }
    :host ::ng-deep .profile-user-item.ant-menu-item:hover { background: transparent !important; }
    :host ::ng-deep .admin-dropdown-menu {
      background: #fff !important;
      border: 1px solid #e8eaed !important;
      border-radius: 8px !important;
      padding: 4px;
      min-width: 180px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important;
    }
    :host ::ng-deep .admin-dropdown-menu .ant-menu-item {
      color: #374151 !important; border-radius: 6px !important; margin: 1px 0 !important;
      height: 36px !important; line-height: 36px !important; font-size: 12px;
    }
    :host ::ng-deep .admin-dropdown-menu .ant-menu-item:hover { background: #f0f4ff !important; color: #1f3d6e !important; }
    :host ::ng-deep .admin-dropdown-menu .ant-menu-item i { color: #6c757d !important; font-size: 14px; }
    :host ::ng-deep .admin-dropdown-menu .ant-menu-item:hover i { color: #1f3d6e !important; }
    :host ::ng-deep .admin-dropdown-menu .ant-menu-divider { background: #e8eaed !important; margin: 4px 8px !important; }
    .profile-user-details { display: flex; flex-direction: column; line-height: 1.3; }
    .profile-user-name { font-weight: 600; font-size: 12px; }
    .profile-user-role { font-size: 10px; color: rgba(0,0,0,0.35); }
    .profile-logout-item:hover i { color: #dc3545 !important; }
    .profile-logout-item:hover { background: rgba(220,53,69,0.06) !important; color: #dc3545 !important; }
    .admin-dropdown-avatar {
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border-radius: 50%;
      background: #4361ee; color: #fff;
      font-size: 12px; font-weight: 700; flex-shrink: 0;
    }
    :host ::ng-deep .ant-layout-sider-trigger {
      background: #162a50 !important;
    }
    :host ::ng-deep .sidenav::-webkit-scrollbar { display: none; }
    :host ::ng-deep .sidenav { scrollbar-width: none; -ms-overflow-style: none; }

    @media (max-width: 768px) {
      .main-content { padding: 8px; }
      .toolbar-title { font-size: 15px; }
    }
  `]
})
export class AdminLayoutComponent implements OnInit {
  isCollapsed = signal(false);
  isLeaveMenuOpen = false;

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
