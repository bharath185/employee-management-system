import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDividerModule } from 'ng-zorro-antd/divider';

import { NzGridModule } from 'ng-zorro-antd/grid';

import { EmployeeService } from '../../core/services/employee.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { DashboardStats } from '../../core/models/api-response.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { saveAs } from 'file-saver';

interface StatItem {
  key: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzSpinModule,
    NzDividerModule,
    NzGridModule,
    PageHeaderComponent
  ],
  template: `
    <div class="reports-page">
      <app-page-header icon="bar-chart" title="Reports" subtitle="Generate and export reports"
        [breadcrumbs]="[{label: 'Dashboard', link: '/admin/dashboard'}, {label: 'Reports'}]">
      </app-page-header>

      <div class="reports-content">
        <div nz-row [nzGutter]="[20, 20]" class="reports-row reports-row-main">
          <div nz-col nzXs="24" nzMd="12" class="report-col">
            <nz-card class="report-card">
              <div class="card-header">
                <div class="card-icon-circle">
                  <i nz-icon nzType="download"></i>
                </div>
                <div class="card-header-text">
                  <h4 class="card-title">Export Employee Data</h4>
                  <p class="card-subtitle">Download complete employee database as Excel</p>
                </div>
              </div>
              <div class="card-body">
                <div class="filter-row">
                  <div class="filter-item">
                    <label class="filter-label">Status</label>
                    <nz-select nzPlaceHolder="All Statuses" [(ngModel)]="exportFilterStatus">
                      <nz-option nzValue="" nzLabel="All Statuses"></nz-option>
                      <nz-option *ngFor="let opt of statusOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
                    </nz-select>
                  </div>
                  <div class="filter-item">
                    <label class="filter-label">Designation</label>
                    <nz-select nzPlaceHolder="All Designations" [(ngModel)]="exportFilterDesignation">
                      <nz-option nzValue="" nzLabel="All Designations"></nz-option>
                      <nz-option *ngFor="let opt of designationOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
                    </nz-select>
                  </div>
                </div>
              </div>
              <div class="card-footer">
                <button nz-button nzType="primary" (click)="exportExcel()" [disabled]="isExporting" class="action-btn">
                  <i nz-icon nzType="download" *ngIf="!isExporting"></i>
                  <span>{{ isExporting ? 'Exporting...' : 'Export to Excel' }}</span>
                </button>
              </div>
            </nz-card>
          </div>

          <div nz-col nzXs="24" nzMd="12" class="report-col">
            <nz-card class="report-card">
              <div class="card-header">
                <div class="card-icon-circle">
                  <i nz-icon nzType="bar-chart"></i>
                </div>
                <div class="card-header-text">
                  <h4 class="card-title">Statistics Summary</h4>
                  <p class="card-subtitle">Quick overview of employee metrics</p>
                </div>
              </div>
              <div class="card-body card-body-stats">
                <div class="stats-summary" *ngIf="stats">
                  <div *ngFor="let item of statItems; let idx = index; let last = last"
                       class="stat-row"
                       [class.stat-row-alt]="idx % 2 === 1"
                       [class.stat-row-last]="last">
                    <div class="stat-left">
                      <i nz-icon [nzType]="item.icon" class="stat-icon"></i>
                      <span class="stat-label">{{ item.label }}</span>
                    </div>
                    <span class="stat-value">{{ getStatValue(item.key) }}</span>
                  </div>
                </div>
                <div class="stats-empty" *ngIf="!stats && !statsLoading">
                  <button nz-button nzType="default" (click)="loadStats()">
                    <i nz-icon nzType="reload"></i> Load Statistics
                  </button>
                </div>
                <div class="stats-spinner" *ngIf="statsLoading">
                  <nz-spin nzSimple [nzSize]="'default'"></nz-spin>
                </div>
              </div>
            </nz-card>
          </div>
        </div>

        <div nz-row [nzGutter]="[20, 20]" class="reports-row">
          <div nz-col nzXs="24" class="report-col">
            <nz-card class="report-card">
              <div class="card-header">
                <div class="card-icon-circle">
                  <i nz-icon nzType="unordered-list"></i>
                </div>
                <div class="card-header-text">
                  <h4 class="card-title">Employee List Report</h4>
                  <p class="card-subtitle">Generate a printable employee list with key fields</p>
                </div>
              </div>
              <div class="card-body">
                <p class="report-desc">This report includes: Employee Code, Name, Gender, Designation, Department, Date of Joining, Status, and Contact Information.</p>
              </div>
              <div class="card-footer">
                <button nz-button nzType="default" (click)="exportEmployeeList()" class="action-btn">
                  <i nz-icon nzType="file-text"></i> Generate Report
                </button>
              </div>
            </nz-card>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-page {
      height: calc(100vh - 64px - 48px);
      display: flex;
      flex-direction: column;
    }

    .reports-content {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 20px;
      overflow-y: auto;
    }

    .reports-row {
      margin: 0;
    }

    .reports-row-main {
      flex: 1;
      min-height: 0;
    }

    .report-col {
      display: flex;
    }

    .report-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border-light);
      box-shadow: var(--shadow-sm);
      transition: all 0.3s ease;
      background: var(--color-card);
    }

    .report-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .report-card ::ng-deep .ant-card-body {
      padding: 0;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 20px 20px 0;
    }

    .card-icon-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary-50), #ffffff);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 18px;
      color: var(--color-primary-500);
    }

    .card-header-text {
      flex: 1;
      min-width: 0;
    }

    .card-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--color-primary-500);
      margin: 0;
      line-height: 1.3;
    }

    .card-subtitle {
      font-size: 13px;
      color: var(--color-text-secondary);
      margin: 2px 0 0;
      line-height: 1.4;
    }

    .card-body {
      padding: 16px 20px 4px;
      flex: 1;
    }

    .card-body-stats {
      padding-bottom: 16px;
    }

    .card-footer {
      padding: 4px 20px 20px;
      display: flex;
      gap: 8px;
    }

    .filter-row {
      display: flex;
      gap: 12px;
    }

    .filter-item {
      flex: 1;
    }

    .filter-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-secondary);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      height: 36px;
      border-radius: var(--radius-md);
      padding: 0 16px;
    }

    .stats-summary {
      padding: 4px 0;
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid var(--color-border-light);
    }

    .stat-row-alt {
      background: var(--color-bg-alt);
    }

    .stat-row-last {
      border-bottom: none;
    }

    .stat-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .stat-icon {
      font-size: 14px;
      color: var(--color-text-muted);
      width: 16px;
      text-align: center;
    }

    .stat-label {
      font-size: 13px;
      color: var(--color-text-secondary);
      font-weight: 500;
    }

    .stat-value {
      font-size: 16px;
      font-weight: 700;
      color: var(--color-primary-500);
      font-family: var(--font-mono);
    }

    .stats-empty {
      text-align: center;
      padding: 24px 0;
    }

    .stats-spinner {
      text-align: center;
      padding: 24px 0;
    }

    .report-desc {
      font-size: 13px;
      color: var(--color-text-secondary);
      line-height: 1.6;
      margin: 0;
      padding: 4px 0;
    }

    .report-card nz-select {
      width: 100%;
    }

    .report-card ::ng-deep .ant-select-selector {
      height: 36px !important;
      border-radius: var(--radius-md) !important;
    }

    .report-card ::ng-deep .ant-select-selection-placeholder,
    .report-card ::ng-deep .ant-select-selection-item {
      line-height: 34px !important;
      font-size: 13px;
    }

    @media (max-width: 767px) {
      .reports-content {
        gap: 16px;
      }

      .filter-row {
        flex-direction: column;
      }

      .card-header {
        padding: 16px 16px 0;
      }

      .card-body {
        padding: 12px 16px 4px;
      }

      .card-footer {
        padding: 4px 16px 16px;
      }
    }
  `]
})
export class ReportsComponent implements OnInit {
  isExporting = false;
  statsLoading = false;
  stats: DashboardStats | null = null;

  exportFilterStatus = '';
  exportFilterDesignation = '';

  statusOptions: { value: string; label: string }[] = [];
  designationOptions: { value: string; label: string }[] = [];

  statItems: StatItem[] = [
    { key: 'totalEmployees', label: 'Total Employees', icon: 'team' },
    { key: 'activeEmployees', label: 'Active Employees', icon: 'check-circle' },
    { key: 'maleCount', label: 'Male', icon: 'man' },
    { key: 'femaleCount', label: 'Female', icon: 'woman' },
    { key: 'exitedEmployees', label: 'Exited', icon: 'logout' },
    { key: 'newThisMonth', label: 'New This Month', icon: 'user-add' },
  ];

  constructor(
    private employeeService: EmployeeService,
    private dashboardService: DashboardService,
    private masterDataService: MasterDataService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    this.masterDataService.getByCategory('EMPLOYEE_STATUS').subscribe(data => {
      this.statusOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('DESIGNATION').subscribe(data => {
      this.designationOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
  }

  getStatValue(key: string): number {
    if (!this.stats) return 0;
    return (this.stats as any)[key] || 0;
  }

  loadStats(): void {
    this.statsLoading = true;
    this.dashboardService.getStats().subscribe({
      next: (response) => {
        this.statsLoading = false;
        if (response.success) {
          this.stats = response.data;
        }
      },
      error: () => {
        this.statsLoading = false;
        this.notification.error('Error', 'Error loading statistics');
      }
    });
  }

  exportExcel(): void {
    this.isExporting = true;
    this.employeeService.exportToExcel({
      employeeStatus: this.exportFilterStatus || undefined,
      designation: this.exportFilterDesignation || undefined
    }).subscribe({
      next: (blob) => {
        this.isExporting = false;
        saveAs(blob, `employee_report_${new Date().toISOString().split('T')[0]}.xlsx`);
        this.notification.success('Success', 'Report exported successfully');
      },
      error: (err) => {
        this.isExporting = false;
        this.notification.error('Error', 'Error exporting report');
      }
    });
  }

  exportEmployeeList(): void {
    this.exportExcel();
  }
}
