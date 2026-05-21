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
import { AuthService } from '../../core/services/auth.service';

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
    NzDropDownModule
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
    <a href="#main-content" class="skip-link">Skip to main content</a>
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
                (click)="closeDrawerOnMobile()">
              <i nz-icon nzType="dashboard"></i>
              <span *ngIf="!isCollapsed()">Dashboard</span>
            </li>
            <li nz-menu-item routerLink="/admin/employees"
                (click)="closeDrawerOnMobile()">
              <i nz-icon nzType="team"></i>
              <span *ngIf="!isCollapsed()">Employees</span>
            </li>
            <li nz-menu-item routerLink="/admin/masters"
                (click)="closeDrawerOnMobile()">
              <i nz-icon nzType="setting"></i>
              <span *ngIf="!isCollapsed()">Master Data</span>
            </li>
            <li nz-menu-item routerLink="/admin/reports"
                (click)="closeDrawerOnMobile()">
              <i nz-icon nzType="audit"></i>
              <span *ngIf="!isCollapsed()">Reports</span>
            </li>
          </ul>
          <div class="sidenav-spacer"></div>
          <div class="sidenav-footer" (click)="logout()">
            <div class="sidenav-footer-divider"></div>
            <div class="sidenav-logout-item">
              <i nz-icon nzType="logout"></i>
              <span *ngIf="!isCollapsed()">Logout</span>
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

          <button nz-button nzType="text" nz-dropdown [nzDropdownMenu]="profileMenu" class="profile-btn">
            <i nz-icon nzType="user"></i>
          </button>
          <nz-dropdown-menu #profileMenu="nzDropdownMenu">
            <ul nz-menu>
              <li nz-menu-item disabled class="profile-user-item">
                <i nz-icon nzType="user"></i>
                <span>{{ currentUserName }}</span>
              </li>
              <li nz-menu-divider></li>
              <li nz-menu-item (click)="logout()">
                <i nz-icon nzType="logout"></i>
                <span>Logout</span>
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
  `,
  styles: [`
    .skip-link {
      position: fixed;
      top: -100%;
      left: 8px;
      z-index: 10000;
      background: #fff;
      color: var(--color-primary-500);
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
      background: var(--color-primary-500) !important;
      border-right: 1px solid #162d52;
      transition: all 0.2s ease;
      overflow: hidden;
    }
    :host ::ng-deep .sidenav .ant-layout-sider-children { overflow: hidden; }
    .sidenav-inner { height: 100%; display: flex; flex-direction: column; }
    .sidenav-spacer { flex: 1; }
    .sidenav-footer { flex-shrink: 0; cursor: pointer; }
    .sidenav-footer-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 0 8px; }
    .sidenav-logout-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      color: rgba(255,255,255,0.6);
      transition: all 0.2s;
      font-size: 14px;
    }
    .sidenav-logout-item:hover { color: #fff; background: rgba(255,255,255,0.1); }
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
      border-bottom: 1px solid rgba(255,255,255,0.1);
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
      border-radius: var(--radius-md) !important;
      color: rgba(255,255,255,0.8) !important;
      display: flex !important;
      align-items: center !important;
      gap: 10px;
    }
    :host ::ng-deep .ant-menu-item > i {
      font-size: 20px;
      color: rgba(255,255,255,0.8);
      margin-right: 0 !important;
    }
    :host ::ng-deep .ant-menu-item > span {
      font-size: 14px;
      line-height: 1;
    }
    :host ::ng-deep .ant-menu-item:hover {
      background: rgba(255,255,255,0.12) !important;
      color: #ffffff !important;
    }
    :host ::ng-deep .ant-menu-item:hover i {
      color: #ffffff !important;
    }
    :host ::ng-deep .ant-menu-item-selected {
      background: rgba(255,255,255,0.18) !important;
      color: #ffffff !important;
      font-weight: 600;
    }
    :host ::ng-deep .ant-menu-item-selected i {
      color: #ffffff;
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
      background: var(--color-primary-500) !important;
      color: white !important;
      position: sticky;
      top: 0;
      z-index: 1000;
      height: 64px;
      display: flex;
      align-items: center;
      padding: 0 16px;
    }
    .menu-button {
      margin-right: 8px;
      color: white !important;
    }
    .profile-btn {
      color: white !important;
    }
    .toolbar-title {
      font-size: 18px;
      font-weight: 500;
    }
    .toolbar-spacer {
      flex: 1 1 auto;
    }
    .main-content {
      padding: 24px;
      min-height: calc(100vh - 64px);
      background: linear-gradient(135deg, #f0f2f5 0%, #e4e9f0 50%, #f4f6f9 100%);
      position: relative;
    }
    .main-content::before {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.04;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath d='M1 3h1v1H1V3zm2-2h1v1H3V1z' fill='%231f3d6e'/%3E%3C/svg%3E");
      background-repeat: repeat;
    }
    .profile-user-item {
      cursor: default !important;
    }
    :host ::ng-deep .profile-user-item.ant-menu-item {
      cursor: default !important;
      color: #333 !important;
      font-weight: 500;
    }
    :host ::ng-deep .profile-user-item.ant-menu-item:hover {
      background: transparent !important;
    }
    @media (max-width: 768px) {
      .main-content {
        padding: 16px;
      }
    }
  `]
})
export class AdminLayoutComponent implements OnInit {
  isCollapsed = signal(false);
  isMobile = signal(false);
  currentUserName: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUserName = user ? `${user.firstName} ${user.surname}` : 'User';
    });
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
