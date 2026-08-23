import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
    RouterLink, RouterLinkActive,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTableModule,
    NzSelectModule,
    NzSpinModule,
    NzGridModule,
    NzStatisticModule,
    NzTagModule,
    DateFormatPipe
  ],
  template: `
    <div class="reports-container page-enter">
      <!-- Sub Navigation -->
      <div class="pp-sub-nav">
        <a class="pp-nav-item" routerLink="/admin/document-templates" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
          <i nz-icon nzType="file-text"></i><span>Templates</span>
        </a>
        <a class="pp-nav-item" routerLink="/admin/document-templates/reports" routerLinkActive="active">
          <i nz-icon nzType="bar-chart"></i><span>Doc Reports</span>
        </a>
      </div>

      <!-- Stats Cards -->
      <div nz-row nzGutter="12" class="stats-row" *ngIf="stats">
        <div nz-col nzXs="24" nzSm="8">
          <nz-card class="stat-card" nzSize="small">
            <nz-statistic [nzValue]="stats.totalDownloadsThisFY" nzTitle="Total Downloads (This FY)"
              nzPrefixIcon="download"></nz-statistic>
          </nz-card>
        </div>
        <div nz-col nzXs="24" nzSm="8">
          <nz-card class="stat-card" nzSize="small">
            <nz-statistic [nzValue]="stats.mostDownloadedTemplate" nzTitle="Most Downloaded Template"
              [nzValueStyle]="{ 'font-size': '15px', 'font-weight': '600' }"></nz-statistic>
          </nz-card>
        </div>
        <div nz-col nzXs="24" nzSm="8">
          <nz-card class="stat-card" nzSize="small">
            <nz-statistic [nzValue]="stats.mostDownloadedEmployee" nzTitle="Most Downloaded Employee"
              [nzValueStyle]="{ 'font-size': '15px', 'font-weight': '600' }"></nz-statistic>
          </nz-card>
        </div>
      </div>

      <!-- Monthly Chart -->
      <nz-card class="chart-card" nzTitle="Downloads Per Month (This FY)" nzSize="small" *ngIf="stats?.monthlyDownloads?.length">
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

      <!-- Filters Card -->
      <nz-card class="pp-controls-card" nzSize="small">
        <div class="filter-controls-row">
          <div class="filter-field select-box">
            <nz-select [(ngModel)]="filterFinancialYear" (ngModelChange)="loadLogs()" nzPlaceHolder="Financial Year" class="filter-select">
              <nz-option nzValue="" nzLabel="All Years"></nz-option>
              <nz-option *ngFor="let yr of financialYears" [nzValue]="yr" [nzLabel]="yr"></nz-option>
            </nz-select>
          </div>
          <div class="filter-field select-box-lg">
            <nz-select [(ngModel)]="filterTemplateId" (ngModelChange)="loadLogs()" nzPlaceHolder="All Templates" class="filter-select">
              <nz-option nzValue="" nzLabel="All Templates"></nz-option>
              <nz-option *ngFor="let tpl of templateOptions" [nzValue]="tpl.id" [nzLabel]="tpl.templateName"></nz-option>
            </nz-select>
          </div>
          <div class="filter-field action-box" *ngIf="hasActiveFilters">
            <button nz-button (click)="clearFilters()" class="clear-filter-btn">
              <i nz-icon nzType="clear"></i> Clear
            </button>
          </div>
        </div>
      </nz-card>

      <!-- Logs Table Card -->
      <div class="table-container">
        <div class="table-header">
          <div class="table-title">
            <i nz-icon nzType="history" class="title-icon"></i>
            <span>Download Logs</span>
            <span class="table-count">{{ totalElements }} records</span>
          </div>
        </div>

        <ng-template #emptyTemplate>
          <div class="empty-state-content">
            <div class="empty-icon-wrapper">
              <i nz-icon nzType="inbox" class="empty-icon"></i>
            </div>
            <h3>No download records found</h3>
            <p>Generated documents and downloads will appear here</p>
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
          [nzPageSizeOptions]="[10, 20, 50]"
          [nzScroll]="{ x: '750px' }"
          [nzNoResult]="emptyTemplate"
          class="theme-table"
          [nzLoading]="isLoading">
          <thead>
            <tr>
              <th nzWidth="60px" class="th-center">#</th>
              <th nzWidth="240px">Employee</th>
              <th nzWidth="220px">Template</th>
              <th nzWidth="110px" class="th-center">Format</th>
              <th nzWidth="140px">Financial Year</th>
              <th nzWidth="160px">Downloaded At</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let log of dataSource; let i = index">
              <td class="td-center row-num">{{ (pageIndex * pageSize) + i + 1 }}</td>
              <td>
                <div class="emp-cell">
                  <span class="emp-avatar"><i nz-icon nzType="user"></i></span>
                  <div class="emp-info">
                    <span class="emp-name">{{ log.employeeName || 'Employee #' + log.employeeId }}</span>
                    <span class="emp-code" *ngIf="log.employeeCode">{{ log.employeeCode }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="tpl-cell">
                  <span class="tpl-icon"><i nz-icon nzType="file-text"></i></span>
                  <span class="tpl-name">{{ log.templateName || 'Template #' + log.templateId }}</span>
                </div>
              </td>
              <td class="td-center">
                <nz-tag [nzColor]="log.format === 'pdf' ? 'magenta' : 'blue'" class="format-badge">
                  {{ (log.format || 'PDF').toUpperCase() }}
                </nz-tag>
              </td>
              <td>
                <span class="fy-badge">{{ log.financialYear }}</span>
              </td>
              <td>
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
    .pp-sub-nav {
      display: flex;
      gap: 2px;
      margin-bottom: 12px;
      background: #f0f4ff;
      border-radius: 10px;
      padding: 4px;
      border: 1px solid #e0e7ff;
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
      white-space: nowrap;
    }
    .pp-nav-item i { font-size: 16px; width: 16px; display: inline-flex; align-items: center; justify-content: center; }
    .pp-nav-item:hover { background: rgba(31,61,110,0.06); color: #1f3d6e; }
    .pp-nav-item.active {
      background: #ffffff;
      color: #1f3d6e;
      box-shadow: 0 2px 8px rgba(31,61,110,0.1);
    }
    .pp-nav-item.active i { color: #1f3d6e; }

    /* ── Scrollbar Styling ── */
    .reports-container ::-webkit-scrollbar { width: 6px; height: 6px; }
    .reports-container ::-webkit-scrollbar-track { background: transparent; }
    .reports-container ::-webkit-scrollbar-thumb { background: rgba(31,61,110,0.2); border-radius: 3px; }
    .reports-container ::-webkit-scrollbar-thumb:hover { background: rgba(31,61,110,0.35); }

    :host { display: block; height: 100%; }
    .reports-container {
      width: 100%;
      padding: 12px 16px;
      height: 100%;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    .stats-row { margin-bottom: 12px; flex-shrink: 0; }
    .stat-card {
      border-radius: 10px !important;
      border: 1px solid #e8eaed !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
      text-align: center;
      background: #fff;
    }
    :host ::ng-deep .stat-card .ant-statistic-title {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
    }
    :host ::ng-deep .stat-card .ant-statistic-content {
      color: #1f3d6e;
      font-weight: 700;
    }

    .chart-card {
      margin-bottom: 12px;
      border-radius: 10px !important;
      border: 1px solid #e8eaed !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
      flex-shrink: 0;
      background: #fff;
    }
    .chart-card .ant-card-head {
      border-bottom: 1px solid #e8eaed;
      padding: 10px 16px;
      min-height: auto;
    }
    .chart-card .ant-card-head-title {
      font-size: 14px;
      font-weight: 700;
      color: #1f3d6e;
    }
    .chart-container { padding: 12px 0 4px; }
    .bar-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 160px;
      gap: 6px;
      padding: 0 12px;
    }
    .bar-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; }
    .bar-label { font-size: 11px; color: #666; font-weight: 600; text-align: center; }
    .bar-track {
      flex: 1;
      width: 100%;
      max-width: 36px;
      background: #f0f4ff;
      border-radius: 4px 4px 0 0;
      display: flex;
      align-items: flex-end;
      position: relative;
    }
    .bar-fill {
      width: 100%;
      background: linear-gradient(180deg, #4361ee, #1f3d6e);
      border-radius: 4px 4px 0 0;
      transition: height 0.3s ease;
      min-height: 4px;
    }
    .bar-value { font-size: 12px; font-weight: 700; color: #1f3d6e; }

    .pp-controls-card {
      border-radius: 10px !important;
      border: 1px solid #e8eaed !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
      margin-bottom: 12px;
      width: 100% !important;
      background: #fff;
    }
    :host ::ng-deep .pp-controls-card .ant-card-body { padding: 10px 14px !important; }
    .filter-field { min-width: 0; }
    .filter-field .ant-select { width: 100%; }
    :host ::ng-deep .filter-select .ant-select-selector {
      border-radius: 8px !important;
      border: 1px solid #e2e5ea !important;
      height: 34px !important;
    }
    :host ::ng-deep .filter-select .ant-select-selector:hover {
      border-color: #1f3d6e !important;
    }
    .filter-controls-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    .filter-field.select-box {
      width: 170px;
    }
    .filter-field.select-box-lg {
      width: 220px;
    }
    .filter-field.action-box {
      margin-left: auto;
    }

    .table-container {
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      border: 1px solid #e8eaed;
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
      border-bottom: 1px solid #e8eaed;
      background: #ffffff;
      flex-wrap: wrap;
      gap: 8px;
      flex-shrink: 0;
    }
    .table-title {
      font-size: 14px;
      font-weight: 700;
      color: #1f3d6e;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .table-title .title-icon { font-size: 16px; color: #4361ee; }
    .table-count {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      background: #f0f4ff;
      padding: 2px 8px;
      border-radius: 12px;
      border: 1px solid #e0e7ff;
    }

    .theme-table { width: 100%; }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th {
      background: #f8f9fc !important;
      border-bottom: 2px solid #1f3d6e !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      color: #1f3d6e !important;
      text-transform: uppercase !important;
      letter-spacing: 0.8px !important;
      padding: 8px 12px !important;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr > td {
      padding: 10px 12px !important;
      font-size: 13px !important;
      border-bottom: 1px solid #f0f2f5 !important;
      vertical-align: middle !important;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr:hover > td {
      background: rgba(31,61,110,0.04) !important;
    }

    .th-center, .td-center {
      text-align: center !important;
    }
    .row-num {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
    }

    .emp-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .emp-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #f0f4ff;
      color: #4361ee;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      border: 1px solid #e0e7ff;
      flex-shrink: 0;
    }
    .emp-info {
      display: flex;
      flex-direction: column;
    }
    .emp-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 13px;
      line-height: 1.3;
    }
    .emp-code {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
    }

    .tpl-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tpl-icon {
      color: #4361ee;
      font-size: 15px;
    }
    .tpl-name {
      font-size: 13px;
      color: #334155;
      font-weight: 500;
    }

    .format-badge {
      font-size: 11px !important;
      font-weight: 700 !important;
      border-radius: 6px !important;
      padding: 1px 8px !important;
    }

    .fy-badge {
      font-size: 12px;
      color: #1f3d6e;
      font-weight: 600;
      background: #f0f4ff;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #e0e7ff;
    }

    .date-text {
      font-size: 12px;
      color: #64748b;
      white-space: nowrap;
    }

    .empty-state-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 40px 16px;
      text-align: center;
      color: #64748b;
    }
    .empty-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #f0f4ff;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #4361ee;
      font-size: 24px;
      margin-bottom: 4px;
    }
    .empty-state-content h3 { font-size: 15px; font-weight: 600; color: #334155; margin: 0; }
    .empty-state-content p { font-size: 13px; color: #64748b; margin: 0; }

    .theme-table .ant-table-pagination {
      margin: 12px 16px !important;
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    @media (max-width: 768px) {
      .filter-controls-row { flex-direction: column; align-items: stretch; }
      .filter-field.select-box, .filter-field.select-box-lg { width: 100%; }
      .reports-container { padding: 8px; }
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
