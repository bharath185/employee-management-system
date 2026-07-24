import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-leave-sub-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="pp-sub-nav">
      <a class="pp-nav-item" routerLink="/admin/leave/applications" routerLinkActive="active">
        <i class="nav-icon">&#x1F4CB;</i><span>Apps & Balance</span>
      </a>
    </div>
  `,
  styles: [`
    .pp-sub-nav {
      display: flex;
      gap: 2px;
      background: #f0f4ff;
      border-radius: 10px;
      padding: 4px;
      margin-bottom: 16px;
      border: 1px solid #e0e7ff;
      flex-wrap: wrap;
    }
    .pp-nav-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      color: #6c757d;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
      white-space: nowrap;
    }
    .pp-nav-item:hover {
      background: rgba(31,61,110,0.06);
      color: #1f3d6e;
    }
    .pp-nav-item.active {
      background: #ffffff;
      color: #1f3d6e;
      box-shadow: 0 2px 8px rgba(31,61,110,0.1);
    }
    .nav-icon {
      font-size: 14px;
      font-style: normal;
    }
  `]
})
export class LeaveSubNavComponent {}
