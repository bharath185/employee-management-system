import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';

export interface BreadcrumbItem {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterLink, NzIconModule, NzBreadCrumbModule],
  template: `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon" *ngIf="icon">
          <i nz-icon [nzType]="icon"></i>
        </div>
        <div class="page-header-text">
          <nz-breadcrumb *ngIf="breadcrumbs?.length">
            <nz-breadcrumb-item *ngFor="let crumb of breadcrumbs">
              <a *ngIf="crumb.link; else textOnly" [routerLink]="crumb.link">{{ crumb.label }}</a>
              <ng-template #textOnly>{{ crumb.label }}</ng-template>
            </nz-breadcrumb-item>
          </nz-breadcrumb>
          <h1>{{ title }}</h1>
          <p class="page-header-subtitle" *ngIf="subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <div class="page-header-right">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 0;
      flex-wrap: wrap;
      gap: 12px;
      background: linear-gradient(135deg, #1f3d6e 0%, #16213e 100%);
      padding: 14px 20px;
      border-radius: 10px;
      box-shadow: 0 2px 12px rgba(31,61,110,0.15);
    }
    .page-header-left {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }
    .page-header-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(255,255,255,0.18);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 20px;
      flex-shrink: 0;
      margin-top: 2px;
      backdrop-filter: blur(4px);
    }
    .page-header-text h1 {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
      line-height: 1.2;
      letter-spacing: -0.3px;
    }
    .page-header-subtitle {
      font-size: 12px;
      color: rgba(255,255,255,0.7);
      margin: 2px 0 0;
    }
    .page-header-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .page-header-right ::ng-deep button[nz-button][nzType="primary"] {
      height: 34px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      background: linear-gradient(135deg, #4361ee, #3a0ca3) !important;
      border: none !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
      transition: all 0.2s;
    }
    .page-header-right ::ng-deep button[nz-button][nzType="primary"]:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
    }
    .page-header-right ::ng-deep button[nz-button]:not([nzType="primary"]) {
      height: 34px;
      border-radius: 8px;
      font-size: 13px;
      background: rgba(255,255,255,0.18) !important;
      border: none !important;
      color: #fff !important;
      transition: all 0.2s;
    }
    .page-header-right ::ng-deep button[nz-button]:not([nzType="primary"]):hover {
      background: rgba(255,255,255,0.28) !important;
    }
    nz-breadcrumb {
      margin-bottom: 3px;
    }
    :host ::ng-deep nz-breadcrumb .ant-breadcrumb-link,
    :host ::ng-deep nz-breadcrumb .ant-breadcrumb-separator {
      color: rgba(255,255,255,0.6) !important;
      font-size: 12px;
    }
    :host ::ng-deep nz-breadcrumb a {
      color: rgba(255,255,255,0.85) !important;
      transition: color 0.2s ease;
    }
    :host ::ng-deep nz-breadcrumb a:hover {
      color: #ffffff !important;
    }
    :host ::ng-deep nz-breadcrumb .ant-breadcrumb-separator {
      margin: 0 4px;
    }
  `]
})
export class PageHeaderComponent {
  @Input() icon: string = '';
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() breadcrumbs: BreadcrumbItem[] = [];
}
