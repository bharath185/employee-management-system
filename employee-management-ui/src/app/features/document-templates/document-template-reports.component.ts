import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { DownloadTrackingService } from '../../core/services/download-tracking.service';
import { DocumentTemplateService } from '../../core/services/document-template.service';
import { DownloadLog, DownloadStats } from '../../core/models/document-template.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DateFormatPipe } from '../../shared/pipes/date-format.pipe';

@Component({
  selector: 'app-document-template-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTableModule,
    NzSelectModule,
    NzSpinModule,
    NzGridModule,
    NzStatisticModule,
    NzTagModule,
    PageHeaderComponent,
    DateFormatPipe
  ],
  template: `
    <div class="reports-container page-enter">
      <app-page-header icon="bar-chart" title="Download Reports" subtitle="Track and analyze document downloads"
        [breadcrumbs]="[
          {label: 'Dashboard', link: '/admin/dashboard'},
          {label: 'Document Templates', link: '/admin/document-templates'},
          {label: 'Reports'}
        ]">
      </app-page-header>

      <!-- Stats Cards -->
      <div nz-row nzGutter="12" class="stats-row" *ngIf="stats">
        <div nz-col nzXs="24" nzSm="8">
          <nz-card class="stat-card" nzBorderless>
            <nz-statistic [nzValue]="stats.totalDownloadsThisFY" nzTitle="Total Downloads (This FY)"
              nzPrefixIcon="download"></nz-statistic>
          </nz-card>
        </div>
        <div nz-col nzXs="24" nzSm="8">
          <nz-card class="stat-card" nzBorderless>
            <nz-statistic [nzValue]="stats.mostDownloadedTemplate" nzTitle="Most Downloaded Template"
              [nzValueStyle]="{ 'font-size': '16px' }"></nz-statistic>
          </nz-card>
        </div>
        <div nz-col nzXs="24" nzSm="8">
          <nz-card class="stat-card" nzBorderless>
            <nz-statistic [nzValue]="stats.mostDownloadedEmployee" nzTitle="Most Downloaded Employee"
              [nzValueStyle]="{ 'font-size': '16px' }"></nz-statistic>
          </nz-card>
        </div>
      </div>

      <!-- Monthly Chart -->
      <nz-card class="chart-card" nzTitle="Downloads Per Month (This FY)" nzBorderless *ngIf="stats?.monthlyDownloads?.length">
        <div class="chart-container">
          <div class="bar-chart">
            <div class="bar-item" *ngFor="let item of stats!.monthlyDownloads">
              <div class="bar-label">{{ item.month }}</div>
              <div class="bar-track">
                <div class="bar-fill" [style.height.%]="getBarHeight(item.count)"></div>
              </div>
              <div class="bar-value">{{ item.count }}</div>
            </div>
          </div>
        </div>
      </nz-card>

      <!-- Filters -->
      <nz-card class="filter-section" nzBorderless>
        <div nz-row nzGutter="8" nzAlign="middle">
          <div nz-col nzXs="24" nzSm="8" nzMd="6" class="filter-field">
            <nz-select [(ngModel)]="filterFinancialYear" (ngModelChange)="loadLogs()" nzPlaceHolder="Financial Year">
              <nz-option nzValue="" nzLabel="All Years"></nz-option>
              <nz-option *ngFor="let yr of financialYears" [nzValue]="yr" [nzLabel]="yr"></nz-option>
            </nz-select>
          </div>
          <div nz-col nzXs="12" nzSm="6" nzMd="4" class="filter-field">
            <nz-select [(ngModel)]="filterTemplateId" (ngModelChange)="loadLogs()" nzPlaceHolder="Template">
              <nz-option nzValue="" nzLabel="All Templates"></nz-option>
              <nz-option *ngFor="let tpl of templateOptions" [nzValue]="tpl.id" [nzLabel]="tpl.templateName"></nz-option>
            </nz-select>
          </div>
          <div nz-col class="filter-actions-col">
            <button nz-button (click)="clearFilters()" *ngIf="hasActiveFilters" class="clear-filter-btn">
              <i nz-icon nzType="clear"></i> Clear
            </button>
          </div>
        </div>
      </nz-card>

      <!-- Logs Table -->
      <div class="table-container">
        <div class="table-header">
          <div class="table-title">
            <i nz-icon nzType="history"></i> Download Logs
            <span class="table-count">{{ totalElements }} records</span>
          </div>
        </div>

        <ng-template #emptyTemplate>
          <div class="empty-state">
            <i nz-icon nzType="inbox" class="empty-icon"></i>
            <p>No download records found</p>
          </div>
        </ng-template>

        <nz-table
          [nzData]="dataSource"
          [nzFrontPagination]="false"
          [nzPageIndex]="pageIndex + 1"
          [nzPageSize]="pageSize"
          [nzTotal]="totalElements"
          (nzPageIndexChange)="onPageIndexChange($event)"
          (nzPageSizeChange)="onPageSizeChange($event)"
          nzShowSizeChanger
          [nzPageSizeOptions]="[10, 25, 50]"
          [nzScroll]="{ x: '600px' }"
          [nzNoResult]="emptyTemplate"
          class="logs-table"
          [nzLoading]="isLoading">
          <thead>
            <tr>
              <th nz-th>Employee</th>
              <th nz-th>Template</th>
              <th nz-th>Format</th>
              <th nz-th>Financial Year</th>
              <th nz-th>Downloaded At</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let log of dataSource">
              <td nz-td>
                <span class="emp-name">{{ log.employeeName || 'Employee #' + log.employeeId }}</span>
                <span class="emp-code" *ngIf="log.employeeCode">({{ log.employeeCode }})</span>
              </td>
              <td nz-td>
                <span class="tpl-name">{{ log.templateName || 'Template #' + log.templateId }}</span>
              </td>
              <td nz-td>
                <nz-tag [nzColor]="log.format === 'pdf' ? 'red' : 'blue'">{{ (log.format || '').toUpperCase() }}</nz-tag>
              </td>
              <td nz-td>
                <span class="fy-text">{{ log.financialYear }}</span>
              </td>
              <td nz-td>
                <span class="date-text">{{ log.downloadedAt | dateFormat }}</span>
              </td>
            </tr>
          </tbody>
        </nz-table>
      </div>
    </div>
  `,
  styles: [`
    /* ── Page Enter Animation ── */
    @keyframes page-enter {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .reports-container.page-enter {
      animation: page-enter 0.35s ease-out;
    }

    /* ── Scrollbar Styling ── */
    .reports-container ::-webkit-scrollbar { width: 6px; height: 6px; }
    .reports-container ::-webkit-scrollbar-track { background: transparent; }
    .reports-container ::-webkit-scrollbar-thumb { background: rgba(31,61,110,0.2); border-radius: 3px; }
    .reports-container ::-webkit-scrollbar-thumb:hover { background: rgba(31,61,110,0.35); }

    :host { display: block; height: 100%; }
    .reports-container {
      width: 100%;
      padding: 12px;
      height: 100%;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .stats-row { margin-bottom: 12px; flex-shrink: 0; }
    .stat-card {
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border-light);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      text-align: center;
    }

    .chart-card {
      margin-bottom: 12px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border-light);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      flex-shrink: 0;
    }
    .chart-card .ant-card-head {
      border-bottom: 1px solid var(--color-border-light);
      padding: 12px 16px;
      min-height: auto;
    }
    .chart-card .ant-card-head-title {
      font-size: 15px;
      font-weight: 700;
      color: #1f3d6e;
    }
    .chart-container { padding: 16px 0; }
    .bar-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 180px;
      gap: 6px;
      padding: 0 12px;
    }
    .bar-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; }
    .bar-label { font-size: 11px; color: #666; font-weight: 600; text-align: center; }
    .bar-track {
      flex: 1;
      width: 100%;
      max-width: 36px;
      background: #f0f2f5;
      border-radius: var(--radius-md) var(--radius-md) 0 0;
      display: flex;
      align-items: flex-end;
      position: relative;
    }
    .bar-fill {
      width: 100%;
      background: linear-gradient(180deg, #4361ee, #1f3d6e);
      border-radius: var(--radius-md) var(--radius-md) 0 0;
      transition: height 0.3s ease;
      min-height: 4px;
    }
    .bar-value { font-size: 12px; font-weight: 700; color: #1f3d6e; }

    .filter-section {
      background: #fff;
      border-radius: var(--radius-lg);
      margin-bottom: 12px;
      border: 1px solid var(--color-border-light);
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
      flex-shrink: 0;
    }
    .filter-section .ant-card-body { padding: 10px 14px; }
    .filter-field { min-width: 0; }
    .filter-field .ant-select { width: 100%; }
    .filter-field .ant-select-selector { border-radius: var(--radius-md) !important; height: 34px !important; }
    .filter-actions-col { display: flex; align-items: center; }
    .clear-filter-btn { font-size: 13px; height: 34px; padding: 0 14px; border-radius: var(--radius-md); }

    .table-container {
      background: #fff;
      border-radius: var(--radius-lg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      border: 1px solid var(--color-border-light);
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .table-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border-light);
      flex-shrink: 0;
    }
    .table-title {
      font-size: 15px;
      font-weight: 700;
      color: #1f3d6e;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .table-title i { font-size: 18px; }
    .table-count {
      font-size: 12px;
      font-weight: 500;
      color: #6c757d;
      background: #f0f2f5;
      padding: 2px 10px;
      border-radius: var(--radius-pill);
    }

    .logs-table { width: 100%; }
    .logs-table .ant-table-thead > tr > th {
      background: #f8f9fc;
      border-bottom: 2px solid #1f3d6e;
      font-size: 11px;
      font-weight: 700;
      color: #1f3d6e;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 8px 12px;
    }
    .logs-table .ant-table-tbody > tr > td {
      padding: 10px 12px;
      font-size: 13px;
      border-bottom: 1px solid #f0f2f5;
      vertical-align: middle;
    }
    .logs-table .ant-table-tbody > tr:hover > td { background: rgba(31,61,110,0.06) !important; }

    .emp-name { font-weight: 600; color: #1a1a2e; }
    .emp-code { font-size: 11px; color: #888; margin-left: 4px; }
    .tpl-name { color: #333; }
    .fy-text { font-family: 'Cascadia Code', Consolas, monospace; font-size: 12px; color: #555; }
    .date-text { font-size: 12px; color: #555; }

    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 40px; text-align: center; }
    .empty-state .empty-icon { font-size: 40px; color: #d9d9d9; }
    .empty-state p { font-size: 13px; color: #999; margin: 0; }

    .logs-table .ant-table-pagination {
      margin: 12px 16px !important;
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    @media (max-width: 768px) {
      .filter-field { min-width: 140px; }
      .reports-container { padding: 8px; }
    }

    /* ── Primary Button Gradient ── */
    button[nz-button][nzType="primary"] {
      background: linear-gradient(135deg, #4361ee, #3a0ca3) !important;
      border: none !important;
      box-shadow: 0 2px 6px rgba(67,97,238,0.3) !important;
      transition: all 0.2s ease !important;
    }
    button[nz-button][nzType="primary"]:hover {
      box-shadow: 0 4px 12px rgba(67,97,238,0.45) !important;
      transform: translateY(-1px);
    }
    button[nz-button][nzType="primary"]:active {
      transform: translateY(0);
      box-shadow: 0 1px 4px rgba(67,97,238,0.3) !important;
    }
  `]
})
export class DocumentTemplateReportsComponent implements OnInit {
  stats: DownloadStats | null = null;
  dataSource: DownloadLog[] = [];
  financialYears: string[] = [];
  templateOptions: { id: number; templateName: string }[] = [];

  isLoading = false;
  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;

  filterFinancialYear = '';
  filterTemplateId: number | null = null;

  constructor(
    private downloadService: DownloadTrackingService,
    private templateService: DocumentTemplateService,
    private message: NzMessageService
  ) {}

  get hasActiveFilters(): boolean {
    return !!this.filterFinancialYear || this.filterTemplateId !== null;
  }

  ngOnInit(): void {
    this.loadStats();
    this.loadFinancialYears();
    this.loadTemplateOptions();
    this.loadLogs();
  }

  private loadStats(): void {
    this.downloadService.getStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats = response.data;
        }
      }
    });
  }

  private loadFinancialYears(): void {
    this.downloadService.getFinancialYears().subscribe({
      next: (response) => {
        if (response.success) {
          this.financialYears = response.data || [];
        }
      }
    });
  }

  private loadTemplateOptions(): void {
    this.templateService.getTemplates({ page: 0, size: 200 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.templateOptions = response.data.content.map(t => ({
            id: t.id!,
            templateName: t.templateName
          }));
        }
      }
    });
  }

  loadLogs(): void {
    this.isLoading = true;
    const params: any = {
      page: this.pageIndex,
      size: this.pageSize
    };
    if (this.filterFinancialYear) params.financialYear = this.filterFinancialYear;
    if (this.filterTemplateId) params.templateId = this.filterTemplateId;

    this.downloadService.getDownloadLogs(params).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.dataSource = response.data.content;
          this.totalElements = response.data.totalElements;
        }
      },
      error: () => {
        this.isLoading = false;
        this.message.error('Error loading download logs');
      }
    });
  }

  clearFilters(): void {
    this.filterFinancialYear = '';
    this.filterTemplateId = null;
    this.pageIndex = 0;
    this.loadLogs();
  }

  onPageIndexChange(index: number): void {
    this.pageIndex = index - 1;
    this.loadLogs();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 0;
    this.loadLogs();
  }

  getBarHeight(count: number): number {
    if (!this.stats?.monthlyDownloads?.length) return 0;
    const max = Math.max(...this.stats.monthlyDownloads.map(m => m.count), 1);
    return (count / max) * 100;
  }
}
