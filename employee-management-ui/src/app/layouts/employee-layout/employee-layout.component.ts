import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-employee-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    NzLayoutModule,
    NzIconModule,
    NzButtonModule,
    NzDropDownModule,
    NzMenuModule
  ],
  template: `
    <nz-layout class="emp-sidenav-container">
      <nz-sider class="emp-sidenav"
                nzTheme="dark"
                [(nzCollapsed)]="isCollapsed"
                [nzBreakpoint]="'md'"
                [nzCollapsedWidth]="64"
                [nzTrigger]="null">
        <div class="emp-sidenav-inner">
          <div class="emp-sidenav-header">
            <span class="emp-sidenav-logo-text" *ngIf="!isCollapsed()">EMS</span>
            <span class="emp-sidenav-logo-text collapsed" *ngIf="isCollapsed()">E</span>
          </div>
          <ul nz-menu nzTheme="dark" nzMode="inline" class="emp-side-nav-menu">
            <li nz-menu-item routerLink="/employee/dashboard" routerLinkActive="ant-menu-item-selected">
              <i nz-icon nzType="dashboard"></i>
              <span *ngIf="!isCollapsed()">Dashboard</span>
            </li>
            <li nz-menu-item routerLink="/employee/profile" routerLinkActive="ant-menu-item-selected">
              <i nz-icon nzType="eye"></i>
              <span *ngIf="!isCollapsed()">My Profile</span>
            </li>
            <li nz-menu-item routerLink="/employee/profile/edit" routerLinkActive="ant-menu-item-selected">
              <i nz-icon nzType="edit"></i>
              <span *ngIf="!isCollapsed()">Edit Profile</span>
            </li>
            <li nz-menu-item routerLink="/employee/leave" routerLinkActive="ant-menu-item-selected">
              <i nz-icon nzType="schedule"></i>
              <span *ngIf="!isCollapsed()">My Leave</span>
            </li>
            <li nz-menu-item routerLink="/employee/comp-offs" routerLinkActive="ant-menu-item-selected">
              <i nz-icon nzType="clock-circle"></i>
              <span *ngIf="!isCollapsed()">My Comp-Offs</span>
            </li>
            <li nz-menu-item routerLink="/employee/encashments" routerLinkActive="ant-menu-item-selected">
              <i nz-icon nzType="dollar"></i>
              <span *ngIf="!isCollapsed()">My Encashments</span>
            </li>
          </ul>
          <div class="emp-sidenav-spacer"></div>
          <div class="emp-sidenav-user-section">
            <div class="emp-sidenav-footer-divider"></div>
            <div class="emp-sidenav-user-card" *ngIf="!isCollapsed()">
              <div class="emp-sidenav-user-avatar">{{ currentUserName ? currentUserName.charAt(0).toUpperCase() : 'U' }}</div>
              <div class="emp-sidenav-user-info">
                <span class="emp-sidenav-user-name">{{ currentUserName }}</span>
                <span class="emp-sidenav-user-role">Employee</span>
              </div>
            </div>
            <div class="emp-sidenav-user-card-collapsed" *ngIf="isCollapsed()">
              <div class="emp-sidenav-user-avatar">{{ currentUserName ? currentUserName.charAt(0).toUpperCase() : 'U' }}</div>
            </div>
          </div>
          <div class="emp-sidenav-footer" (click)="logout()">
            <div class="emp-sidenav-logout-item">
              <i nz-icon nzType="logout"></i>
              <span *ngIf="!isCollapsed()">Logout</span>
            </div>
          </div>
        </div>
      </nz-sider>
      <nz-layout>
        <nz-header class="emp-header-toolbar">
          <button nz-button nzType="text" class="emp-menu-button" (click)="toggleSidenav()">
            <i nz-icon [nzType]="isCollapsed() ? 'menu-fold' : 'menu-unfold'"></i>
          </button>
          <span class="emp-toolbar-title">Employee Self-Service</span>
          <span class="emp-toolbar-spacer"></span>

          <button nz-button nzType="text" nz-dropdown [nzDropdownMenu]="profileMenu" class="emp-profile-btn">
            <span class="emp-avatar-circle">{{ currentUserName ? currentUserName.charAt(0).toUpperCase() : 'U' }}</span>
          </button>
          <nz-dropdown-menu #profileMenu="nzDropdownMenu">
            <ul nz-menu class="emp-dropdown-menu">
              <li nz-menu-item disabled class="emp-profile-user-item">
                <span class="emp-dropdown-avatar">{{ currentUserName ? currentUserName.charAt(0).toUpperCase() : 'U' }}</span>
                <span>{{ currentUserName }}</span>
              </li>
              <li nz-menu-divider></li>
              <li nz-menu-item routerLink="/employee/dashboard">
                <i nz-icon nzType="dashboard"></i>
                <span>Dashboard</span>
              </li>
              <li nz-menu-item routerLink="/employee/profile">
                <i nz-icon nzType="eye"></i>
                <span>My Profile</span>
              </li>
              <li nz-menu-item routerLink="/employee/profile/edit">
                <i nz-icon nzType="edit"></i>
                <span>Edit Profile</span>
              </li>
              <li nz-menu-item routerLink="/employee/leave">
                <i nz-icon nzType="schedule"></i>
                <span>My Leave</span>
              </li>
              <li nz-menu-item routerLink="/employee/comp-offs">
                <i nz-icon nzType="clock-circle"></i>
                <span>My Comp-Offs</span>
              </li>
              <li nz-menu-item routerLink="/employee/encashments">
                <i nz-icon nzType="dollar"></i>
                <span>My Encashments</span>
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
          <main class="emp-main-content">
            <router-outlet></router-outlet>
          </main>
        </nz-content>
      </nz-layout>
    </nz-layout>
  `,
  styles: [`
    .emp-sidenav-container { height: 100vh; }
    .emp-sidenav { transition: all 0.2s ease; overflow: hidden; }
    :host ::ng-deep .emp-sidenav .ant-layout-sider-children { overflow: hidden; }
    .emp-sidenav-inner { height: 100%; display: flex; flex-direction: column; background: #1f3d6e; }
    .emp-sidenav-spacer { flex: 1; }
    .emp-sidenav-user-section { flex-shrink: 0; }
    .emp-sidenav-user-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      margin: 0 8px 4px;
      border-radius: 6px;
      background: rgba(255,255,255,0.06);
    }
    .emp-sidenav-user-card-collapsed {
      display: flex;
      justify-content: center;
      padding: 8px 0;
    }
    .emp-sidenav-user-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: #2563eb; color: #ffffff;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; flex-shrink: 0;
    }
    .emp-sidenav-user-info {
      display: flex; flex-direction: column; min-width: 0;
    }
    .emp-sidenav-user-name {
      font-size: 13px; font-weight: 600; color: #ffffff;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3;
    }
    .emp-sidenav-user-role {
      font-size: 11px; color: rgba(255,255,255,0.5); line-height: 1.3;
    }
    .emp-sidenav-footer { flex-shrink: 0; cursor: pointer; }
    .emp-sidenav-footer-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 0 8px; }
    .emp-sidenav-logout-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 16px; color: rgba(255,255,255,0.6);
      transition: all 0.2s; font-size: 14px;
    }
    .emp-sidenav-logout-item:hover { color: #fff; background: rgba(255,255,255,0.1); }
    .emp-sidenav-logout-item i[nz-icon] { font-size: 20px; }
    :host ::ng-deep .ant-layout-sider-collapsed .emp-sidenav-logout-item { justify-content: center; padding: 12px 0; }
    :host ::ng-deep .ant-layout-sider-collapsed .emp-sidenav-logout-item i[nz-icon] { font-size: 22px; }
    :host ::ng-deep .ant-layout-sider-collapsed .emp-sidenav-footer-divider { margin: 0 4px; }
    :host ::ng-deep .emp-sidenav::-webkit-scrollbar { display: none; }
    :host ::ng-deep .emp-sidenav { scrollbar-width: none; -ms-overflow-style: none; }
    .emp-sidenav-header {
      display: flex; align-items: center; justify-content: center;
      padding: 20px 16px; height: 80px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .emp-sidenav-logo-text {
      font-size: 22px; font-weight: 700; color: #ffffff;
      letter-spacing: 2px;
    }
    .emp-sidenav-logo-text.collapsed { font-size: 24px; }
    .emp-side-nav-menu { border-right: none; background: transparent; }
    :host ::ng-deep .ant-layout-sider, :host ::ng-deep .ant-layout-sider-collapsed { transition: all 0.2s ease !important; }
    :host ::ng-deep .ant-layout-sider-zero-width-trigger { display: none; }
    :host ::ng-deep .emp-side-nav-menu .ant-menu-item {
      height: 44px !important; line-height: 44px !important;
      margin: 2px 8px !important; border-radius: 6px !important;
      color: rgba(255,255,255,0.75) !important;
      display: flex !important; align-items: center !important; gap: 10px;
    }
    :host ::ng-deep .emp-side-nav-menu .ant-menu-item > i { font-size: 20px; color: rgba(255,255,255,0.7); margin-right: 0 !important; }
    :host ::ng-deep .emp-side-nav-menu .ant-menu-item > span { font-size: 14px; line-height: 1; }
    :host ::ng-deep .emp-side-nav-menu .ant-menu-item:hover { background: rgba(255,255,255,0.06) !important; color: #ffffff !important; }
    :host ::ng-deep .emp-side-nav-menu .ant-menu-item:hover i { color: #ffffff !important; }
    :host ::ng-deep .emp-side-nav-menu .ant-menu-item-selected {
      background: rgba(255,255,255,0.1) !important;
      color: #ffffff !important;
      font-weight: 600;
      box-shadow: inset 3px 0 0 #2563eb;
    }
    :host ::ng-deep .emp-side-nav-menu .ant-menu-item-selected i { color: #ffffff !important; }
    :host ::ng-deep .ant-layout-sider-collapsed .emp-side-nav-menu .ant-menu-item { justify-content: center !important; padding: 0 !important; margin: 2px auto !important; width: 40px !important; }
    :host ::ng-deep .ant-layout-sider-collapsed .emp-side-nav-menu .ant-menu-item i { font-size: 22px; }

    .emp-header-toolbar {
      background: #ffffff !important;
      border-bottom: 1px solid #e8eaed;
      color: #1a1a2e !important;
      position: sticky; top: 0; z-index: 1000;
      height: 56px;
      display: flex; align-items: center;
      padding: 0 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .emp-menu-button {
      margin-right: 8px; color: #6c757d !important;
      width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 8px; transition: all 0.2s ease;
    }
    .emp-menu-button:hover { color: #2563eb !important; background: #eff6ff; }
    .emp-toolbar-title { font-size: 17px; font-weight: 600; letter-spacing: -0.2px; color: #1a1a2e; margin-left: 4px; }
    .emp-toolbar-spacer { flex: 1 1 auto; }
    .emp-profile-btn {
      width: 36px; height: 36px;
      display: flex !important; align-items: center; justify-content: center;
      border-radius: 50% !important; padding: 0 !important;
      background: #2563eb !important;
      transition: all 0.2s ease;
    }
    .emp-profile-btn:hover { box-shadow: 0 0 20px rgba(37, 99, 235, 0.3); }
    .emp-avatar-circle {
      display: flex; align-items: center; justify-content: center;
      width: 30px; height: 30px; border-radius: 50%;
      background: rgba(255,255,255,0.2); color: #fff;
      font-size: 14px; font-weight: 700;
    }
    .emp-main-content {
      padding: 24px; min-height: calc(100vh - 56px);
      background: #f5f6fa;
    }
    .emp-profile-user-item { cursor: default !important; }
    .emp-dropdown-avatar {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border-radius: 50%;
      background: #2563eb; color: #fff;
      font-size: 14px; font-weight: 700; flex-shrink: 0;
    }
    :host ::ng-deep .emp-dropdown-menu {
      background: #ffffff !important;
      border: 1px solid #e8eaed;
      border-radius: 8px; padding: 4px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }
    :host ::ng-deep .emp-dropdown-menu .ant-menu-item {
      color: #1a1a2e !important;
      border-radius: 6px !important;
      margin: 2px 0 !important;
      height: 40px !important;
      line-height: 40px !important;
    }
    :host ::ng-deep .emp-dropdown-menu .ant-menu-item:hover {
      background: #eff6ff !important;
      color: #2563eb !important;
    }
    :host ::ng-deep .emp-dropdown-menu .ant-menu-item i { color: #6c757d !important; font-size: 16px; }
    :host ::ng-deep .emp-dropdown-menu .ant-menu-item:hover i { color: #2563eb !important; }
    :host ::ng-deep .emp-dropdown-menu .ant-menu-divider { background: #e8eaed !important; margin: 4px 12px !important; }

    @media (max-width: 768px) {
      .emp-main-content { padding: 16px; }
      .emp-toolbar-title { font-size: 15px; }
    }
  `]
})
export class EmployeeLayoutComponent {
  isCollapsed = signal(false);
  currentUserName: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.authService.currentUser$.subscribe(user => {
      this.currentUserName = user ? `${user.firstName} ${user.surname}` : 'User';
    });
  }

  toggleSidenav(): void {
    this.isCollapsed.set(!this.isCollapsed());
  }

  logout(): void {
    this.authService.logout();
  }
}
