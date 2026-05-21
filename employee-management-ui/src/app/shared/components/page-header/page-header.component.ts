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
      width: 46px;
      height: 46px;
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-400));
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 22px;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .page-header-text h1 {
      font-size: 24px;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0;
      line-height: 1.2;
    }
    .page-header-subtitle {
      font-size: 13px;
      color: var(--color-text-secondary);
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
  `]
})
export class PageHeaderComponent {
  @Input() icon: string = '';
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() breadcrumbs: BreadcrumbItem[] = [];
}
