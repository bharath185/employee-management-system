import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
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
    NzDropDownModule
  ],
  template: `
    <div class="employee-layout">
      <nz-header class="header-toolbar">
        <span class="toolbar-title">Employee Self-Service</span>
        <span class="toolbar-spacer"></span>

        <button nz-button nzType="text" nz-dropdown [nzDropdownMenu]="profileMenu">
          <i nz-icon nzType="user"></i>
        </button>
        <nz-dropdown-menu #profileMenu="nzDropdownMenu">
          <ul nz-menu>
            <li nz-menu-item disabled class="profile-user-item">
              <i nz-icon nzType="user"></i>
              <span>{{ currentUserName }}</span>
            </li>
            <li nz-menu-divider></li>
            <li nz-menu-item routerLink="/employee/profile">
              <i nz-icon nzType="eye"></i>
              <span>My Profile</span>
            </li>
            <li nz-menu-item routerLink="/employee/profile/edit">
              <i nz-icon nzType="edit"></i>
              <span>Edit Profile</span>
            </li>
            <li nz-menu-divider></li>
            <li nz-menu-item (click)="logout()">
              <i nz-icon nzType="logout"></i>
              <span>Logout</span>
            </li>
          </ul>
        </nz-dropdown-menu>
      </nz-header>

      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .employee-layout {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header-toolbar {
      background: var(--color-primary-500) !important;
      color: white !important;
      display: flex;
      align-items: center;
      padding: 0 16px;
      height: 64px;
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .toolbar-title {
      font-size: 18px;
      font-weight: 500;
    }
    .toolbar-spacer {
      flex: 1 1 auto;
    }
    .main-content {
      flex: 1;
      padding: 24px;
      background: linear-gradient(135deg, #f0f2f5 0%, #e4e9f0 50%, #f4f6f9 100%);
      overflow-y: auto;
    }
    .profile-user-item {
      cursor: default !important;
      color: #333 !important;
      font-weight: 500;
    }
    @media (max-width: 768px) {
      .main-content {
        padding: 16px;
      }
    }
  `]
})
export class EmployeeLayoutComponent {
  currentUserName: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.authService.currentUser$.subscribe(user => {
      this.currentUserName = user ? `${user.firstName} ${user.surname}` : 'User';
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
