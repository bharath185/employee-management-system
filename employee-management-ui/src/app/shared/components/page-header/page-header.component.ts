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
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .page-header-left {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }
    .page-header-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 20px;
      flex-shrink: 0;
      margin-top: 4px;
    }
    .page-header-text h1 {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0;
      line-height: 1.2;
      letter-spacing: -0.3px;
    }
    .page-header-subtitle {
      font-size: 13px;
      color: #6c757d;
      margin: 4px 0 0;
    }
    .page-header-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    nz-breadcrumb {
      margin-bottom: 4px;
    }
    :host ::ng-deep nz-breadcrumb .ant-breadcrumb-link,
    :host ::ng-deep nz-breadcrumb .ant-breadcrumb-separator {
      color: #6c757d !important;
      font-size: 13px;
    }
    :host ::ng-deep nz-breadcrumb a {
      color: #2563eb !important;
      transition: color 0.2s ease;
    }
    :host ::ng-deep nz-breadcrumb a:hover {
      color: #1d4ed8 !important;
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
