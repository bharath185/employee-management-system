import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzMessageService } from 'ng-zorro-antd/message';
import { PayrollService } from '../../core/services/payroll.service';
import { PayrollProcess } from '../../core/models/payroll.models';

@Component({
  selector: 'app-payroll-process',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, RouterLinkActive, NzTableModule, NzButtonModule, NzSelectModule,
    NzIconModule, NzTagModule, NzCardModule, NzSpinModule, NzStatisticModule,
    NzPopconfirmModule
  ],
  template: `
    <div class="pp-container">
      <!-- ===== SUB NAV ===== -->
      <div class="pp-sub-nav">
        <a class="pp-nav-item" routerLink="/admin/payroll/process" routerLinkActive="active">
          <i nz-icon nzType="play-circle"></i><span>Process</span>
        </a>
        <a class="pp-nav-item" routerLink="/admin/payroll/salary-master" routerLinkActive="active">
          <i nz-icon nzType="bank"></i><span>Salary Master</span>
        </a>
        <a class="pp-nav-item" routerLink="/admin/payroll/input" routerLinkActive="active">
          <i nz-icon nzType="edit"></i><span>Employee Input</span>
        </a>
        <a class="pp-nav-item" routerLink="/admin/payroll/payslips" routerLinkActive="active">
          <i nz-icon nzType="file-text"></i><span>Payslips</span>
        </a>
        <a class="pp-nav-item" routerLink="/admin/payroll/config" routerLinkActive="active">
          <i nz-icon nzType="mail"></i><span>Config</span>
        </a>
      </div>

      <!-- ===== GRADIENT HEADER ===== -->
      <div class="pp-header">
        <div class="pp-header-left">
          <div class="pp-header-icon">
            <i nz-icon nzType="calculator"></i>
          </div>
          <div>
            <div class="pp-header-title">Payroll Processing</div>
            <div class="pp-header-sub">Process monthly payroll for all employees</div>
          </div>
        </div>
      </div>

      <!-- ===== CONTROLS CARD ===== -->
      <nz-card class="pp-controls-card" nzSize="small">
        <div class="pp-controls">
          <div class="pp-filters">
            <nz-select [(ngModel)]="selectedYear" (ngModelChange)="onFilterChange()" nzPlaceHolder="Year" class="filter-select" style="width:110px">
              <nz-option *ngFor="let y of yearList" [nzValue]="y" [nzLabel]="y.toString()"></nz-option>
            </nz-select>
            <nz-select [(ngModel)]="selectedMonth" (ngModelChange)="onFilterChange()" nzPlaceHolder="Month" class="filter-select" style="width:140px">
              <nz-option *ngFor="let m of monthList" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
            </nz-select>
          </div>
          <div class="pp-actions">
            <button nz-button class="btn-primary-gradient" (click)="processPayroll()"
              [nzLoading]="processing" [disabled]="!!currentProcess?.status && currentProcess?.status === 'PROCESSING'">
              <i nz-icon nzType="play-circle"></i>
              {{ processing ? 'Processing...' : 'Process Payroll' }}
            </button>
          </div>
        </div>
      </nz-card>

      <!-- ===== STATUS CARD ===== -->
      <nz-card class="pp-status-card" nzSize="small" *ngIf="currentProcess">
        <div class="status-header">
          <span class="status-title">Current Status</span>
          <nz-tag [nzColor]="statusColor(currentProcess.status)" class="status-badge">
            {{ currentProcess.status }}
          </nz-tag>
        </div>
        <div class="status-grid">
          <div class="status-item">
            <span class="stat-label">Total Employees</span>
            <span class="stat-value">{{ currentProcess.totalEmployees }}</span>
          </div>
          <div class="status-item">
            <span class="stat-label">Processed</span>
            <span class="stat-value">{{ currentProcess.processedCount }}</span>
          </div>
          <div class="status-item" *ngIf="currentProcess.errorMessage">
            <span class="stat-label">Error</span>
            <span class="stat-value stat-error">{{ currentProcess.errorMessage }}</span>
          </div>
          <div class="status-item" *ngIf="currentProcess.startedAt">
            <span class="stat-label">Started</span>
            <span class="stat-value">{{ currentProcess.startedAt | date:'medium' }}</span>
          </div>
          <div class="status-item" *ngIf="currentProcess.completedAt">
            <span class="stat-label">Completed</span>
            <span class="stat-value">{{ currentProcess.completedAt | date:'medium' }}</span>
          </div>
        </div>
        <div class="progress-section" *ngIf="currentProcess.status === 'PROCESSING'">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" [style.width.%]="progressPercent"></div>
          </div>
          <span class="progress-text">{{ progressPercent }}%</span>
        </div>
      </nz-card>

      <!-- ===== HISTORY TABLE ===== -->
      <nz-card class="pp-history-card" nzSize="small">
        <div class="history-title">Processing History</div>
        <nz-table #historyTable
          [nzData]="history"
          [nzLoading]="loadingHistory"
          [nzPageSize]="10"
          nzBordered nzSize="small"
          class="theme-table">
          <thead>
            <tr>
              <th class="th-sno">#</th>
              <th>Year</th>
              <th>Month</th>
              <th>Total Employees</th>
              <th>Processed</th>
              <th>Status</th>
              <th>Started At</th>
              <th>Completed At</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of historyTable.data; let i = index">
              <td class="td-center">{{ i + 1 }}</td>
              <td>{{ p.processYear }}</td>
              <td>{{ monthLabel(p.processMonth) }}</td>
              <td class="td-center">{{ p.totalEmployees }}</td>
              <td class="td-center">{{ p.processedCount }}</td>
              <td class="td-center">
                <nz-tag [nzColor]="statusColor(p.status)">{{ p.status }}</nz-tag>
              </td>
              <td>{{ p.startedAt ? (p.startedAt | date:'dd/MM/yyyy HH:mm') : '-' }}</td>
              <td>{{ p.completedAt ? (p.completedAt | date:'dd/MM/yyyy HH:mm') : '-' }}</td>
              <td class="td-error">{{ p.errorMessage || '-' }}</td>
            </tr>
            <tr *ngIf="history.length === 0 && !loadingHistory">
              <td colspan="9" class="empty-cell">No processing history found</td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>
  `,
  styles: [`
    .pp-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 12px 16px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }
    .pp-sub-nav {
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
      background: rgba(255,255,255,0.7);
      backdrop-filter: blur(8px);
      border-radius: 12px;
      padding: 4px;
      border: 1px solid rgba(232,234,237,0.6);
    }
    .pp-nav-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: #6c757d;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .pp-nav-item i { font-size: 18px; width: 18px; display: inline-flex; align-items: center; justify-content: center; }
    .pp-nav-item:hover { background: rgba(37,99,235,0.06); color: #2563eb; }
    .pp-nav-item.active {
      background: #2563eb;
      color: #fff;
      box-shadow: 0 2px 8px rgba(37,99,235,0.25);
    }
    .pp-nav-item.active i { color: #fff; }
    .pp-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      padding: 12px 16px;
      margin-bottom: 14px;
      background: linear-gradient(135deg, #1f3d6e 0%, #16213e 100%);
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
    }
    .pp-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .pp-header-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.15);
      border-radius: 8px;
      color: #fff;
      font-size: 18px;
      flex-shrink: 0;
    }
    .pp-header-title {
      font-size: 17px;
      font-weight: 700;
      color: #fff;
      letter-spacing: 0.3px;
    }
    .pp-header-sub {
      font-size: 12px;
      color: rgba(255,255,255,0.6);
      font-weight: 400;
      margin-top: 1px;
    }
    .pp-controls-card, .pp-status-card, .pp-history-card {
      border-radius: 10px !important;
      border: 1px solid #e8eaed !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
      margin-bottom: 14px;
      width: 100% !important;
    }
    :host ::ng-deep .pp-controls-card .ant-card-body {
      padding: 14px 16px !important;
    }
    :host ::ng-deep .pp-status-card .ant-card-body {
      padding: 14px 16px !important;
    }
    :host ::ng-deep .pp-history-card .ant-card-body {
      padding: 14px 16px !important;
    }
    .pp-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    .pp-filters {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .pp-actions {
      display: flex;
      gap: 8px;
    }
    .filter-select {
      width: 170px;
    }
    :host ::ng-deep .filter-select .ant-select-selector {
      border-radius: 8px !important;
      border: 1px solid #e2e5ea !important;
      height: 34px !important;
      padding: 0 8px !important;
      box-shadow: none !important;
      transition: all 0.2s ease !important;
    }
    :host ::ng-deep .filter-select .ant-select-selector:hover {
      border-color: #1f3d6e !important;
    }
    :host ::ng-deep .filter-select.ant-select-focused .ant-select-selector {
      border-color: #1f3d6e !important;
      box-shadow: 0 0 0 2px rgba(31,61,110,0.1) !important;
    }
    :host ::ng-deep .filter-select .ant-select-selection-item {
      font-size: 13px !important;
      line-height: 32px !important;
    }
    .btn-primary-gradient {
      height: 34px !important;
      padding: 0 20px !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      border: none !important;
      border-radius: 8px !important;
      background: linear-gradient(135deg, #4361ee, #3a0ca3) !important;
      color: #fff !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      transition: all 0.2s ease !important;
      letter-spacing: 0.3px !important;
      box-shadow: 0 2px 8px rgba(67,97,238,0.3) !important;
    }
    .btn-primary-gradient:hover {
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 14px rgba(67,97,238,0.4) !important;
    }
    .btn-primary-gradient:active {
      transform: translateY(0) !important;
    }
    .status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .status-title {
      font-size: 14px;
      font-weight: 700;
      color: #1f3d6e;
    }
    .status-badge {
      font-size: 11px !important;
      font-weight: 700 !important;
      padding: 0 10px !important;
      line-height: 22px !important;
      border-radius: 4px !important;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 12px;
    }
    .status-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 8px 12px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e8eaed;
    }
    .status-item .stat-label {
      font-size: 10px;
      font-weight: 600;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .status-item .stat-value {
      font-size: 14px;
      font-weight: 700;
      color: #374151;
    }
    .stat-error {
      color: #ef4444 !important;
      font-size: 12px !important;
      word-break: break-all;
    }
    .progress-section {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 12px;
    }
    .progress-bar-bg {
      flex: 1;
      height: 8px;
      background: #e8eaed;
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(135deg, #4361ee, #3a0ca3);
      border-radius: 4px;
      transition: width 0.5s ease;
    }
    .progress-text {
      font-size: 12px;
      font-weight: 700;
      color: #4361ee;
      min-width: 36px;
    }
    .history-title {
      font-size: 14px;
      font-weight: 700;
      color: #1f3d6e;
      margin-bottom: 12px;
    }
    :host ::ng-deep .theme-table {
      width: 100% !important;
    }
    :host ::ng-deep .theme-table .ant-table {
      font-size: 13px;
      border-radius: 0 !important;
    }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th {
      background: #f8f9fc !important;
      color: #1f3d6e !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
      padding: 10px 10px !important;
      border-bottom: 2px solid #1f3d6e !important;
      white-space: nowrap;
    }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th:not(:last-child) {
      border-right: 1px solid #e8ecf1;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr > td {
      padding: 8px 10px !important;
      border-bottom: 1px solid #f0f2f5 !important;
      font-size: 12px;
      color: #374151;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr:hover > td {
      background: rgba(31,61,110,0.03) !important;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr:last-child > td {
      border-bottom: none;
    }
    :host ::ng-deep .theme-table .ant-table-placeholder {
      display: none !important;
    }
    .th-sno {
      width: 42px !important;
      text-align: center !important;
    }
    .td-center {
      text-align: center !important;
    }
    .td-error {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #ef4444 !important;
      font-size: 11px;
    }
    .empty-cell {
      text-align: center !important;
      padding: 28px !important;
      color: #9ca3af !important;
      font-size: 13px;
      font-style: italic;
    }
    :host ::ng-deep .ant-table-body::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    :host ::ng-deep .ant-table-body::-webkit-scrollbar-track {
      background: #f1f3f5;
      border-radius: 3px;
    }
    :host ::ng-deep .ant-table-body::-webkit-scrollbar-thumb {
      background: #c4c9d4;
      border-radius: 10px;
    }
    :host ::ng-deep .ant-table-body::-webkit-scrollbar-thumb:hover {
      background: #a0a8b7;
    }
    :host ::ng-deep .ant-select-dropdown {
      border-radius: 8px !important;
      box-shadow: 0 6px 24px rgba(0,0,0,0.12) !important;
      border: 1px solid #e8eaed !important;
      padding: 4px !important;
    }
    :host ::ng-deep .ant-select-item-option {
      border-radius: 6px !important;
      padding: 6px 12px !important;
      font-size: 13px !important;
    }
    :host ::ng-deep .ant-select-item-option-active {
      background: rgba(31,61,110,0.06) !important;
    }
    :host ::ng-deep .ant-select-item-option-selected {
      background: rgba(31,61,110,0.1) !important;
      color: #1f3d6e !important;
      font-weight: 600 !important;
    }
  `]
})
export class PayrollProcessComponent implements OnInit {
  selectedYear: number;
  selectedMonth: number;
  currentCycleYear: number;
  currentCycleMonth: number;
  processing = false;
  loadingHistory = false;
  currentProcess: PayrollProcess | null = null;
  history: PayrollProcess[] = [];

  yearList: number[] = [];
  monthList = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  constructor(
    private payrollService: PayrollService,
    private msg: NzMessageService
  ) {
    const now = new Date();
    this.currentCycleYear = now.getFullYear();
    this.currentCycleMonth = now.getMonth() + 1;
    if (now.getDate() >= 26) {
      this.currentCycleMonth++;
      if (this.currentCycleMonth > 12) {
        this.currentCycleMonth = 1;
        this.currentCycleYear++;
      }
    }
    this.selectedYear = this.currentCycleYear;
    this.selectedMonth = this.currentCycleMonth;
  }

  ngOnInit(): void {
    const now = new Date();
    for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) {
      this.yearList.push(y);
    }
    this.loadStatus();
    this.loadHistory();
  }

  get progressPercent(): number {
    if (!this.currentProcess || this.currentProcess.totalEmployees === 0) return 0;
    return Math.round((this.currentProcess.processedCount / this.currentProcess.totalEmployees) * 100);
  }

  onFilterChange(): void {
    this.loadStatus();
    this.loadHistory();
  }

  monthLabel(m: number): string {
    return this.monthList[m - 1]?.label || '';
  }

  statusColor(status: string): string {
    switch (status) {
      case 'COMPLETED': return '#52c41a';
      case 'PROCESSING': return '#1890ff';
      case 'FAILED': return '#f5222d';
      case 'PENDING': return '#fa8c16';
      default: return '#d9d9d9';
    }
  }

  loadStatus(): void {
    this.payrollService.getProcessStatus(this.selectedYear, this.selectedMonth).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.currentProcess = res.data;
        } else {
          this.currentProcess = null;
        }
      },
      error: () => {
        this.currentProcess = null;
      }
    });
  }

  loadHistory(): void {
    this.loadingHistory = true;
    this.payrollService.getProcessHistory(this.selectedYear, this.selectedMonth).subscribe({
      next: (res) => {
        this.history = res.data || [];
        this.loadingHistory = false;
      },
      error: () => {
        this.loadingHistory = false;
      }
    });
  }

  processPayroll(): void {
    this.processing = true;
    this.payrollService.processPayroll(this.selectedYear, this.selectedMonth).subscribe({
      next: (res) => {
        if (res.success) {
          this.msg.success('Payroll processing started');
          this.currentProcess = res.data;
          this.loadHistory();
          this.pollStatus();
        }
        this.processing = false;
      },
      error: (err) => {
        this.msg.error(err.error?.message || 'Failed to start payroll processing');
        this.processing = false;
      }
    });
  }

  pollStatus(): void {
    let attempts = 0;
    const maxAttempts = 30;
    const interval = setInterval(() => {
      attempts++;
      this.payrollService.getProcessStatus(this.selectedYear, this.selectedMonth).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.currentProcess = res.data;
            if (res.data.status === 'COMPLETED' || res.data.status === 'FAILED') {
              clearInterval(interval);
              this.loadHistory();
              if (res.data.status === 'COMPLETED') {
                this.msg.success('Payroll processing completed');
              } else {
                this.msg.error(res.data.errorMessage || 'Payroll processing failed');
              }
            }
          }
        }
      });
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        this.msg.warning('Polling ended - check status manually');
      }
    }, 3000);
  }
}
