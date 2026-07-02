import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { PayrollService } from '../../core/services/payroll.service';
import { Payslip } from '../../core/models/payroll.models';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-payslip-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzTableModule, NzButtonModule, NzSelectModule,
    NzIconModule, NzTagModule, NzCardModule, NzSpinModule, NzPopconfirmModule
  ],
  template: `
    <div class="pl-container">
      <!-- ===== GRADIENT HEADER ===== -->
      <div class="pl-header">
        <div class="pl-header-left">
          <div class="pl-header-icon">
            <i nz-icon nzType="file-text"></i>
          </div>
          <div>
            <div class="pl-header-title">Payslips</div>
            <div class="pl-header-sub">View and manage employee payslips</div>
          </div>
        </div>
        <div class="pl-header-actions">
          <button nz-button class="pl-header-btn" (click)="downloadBankFile()" nz-tooltip="Download Bank File">
            <i nz-icon nzType="bank"></i> Bank File
          </button>
          <button nz-button class="pl-header-btn" (click)="downloadReport()" nz-tooltip="Download Payroll Report">
            <i nz-icon nzType="bar-chart"></i> Report
          </button>
          <button nz-button class="btn-primary-gradient" (click)="sendAll()" [nzLoading]="sending">
            <i nz-icon nzType="mail"></i> Send All
          </button>
        </div>
      </div>

      <!-- ===== CONTROLS CARD ===== -->
      <nz-card class="pl-controls-card" nzSize="small">
        <div class="pl-controls">
          <div class="pl-filters">
            <nz-select [(ngModel)]="selectedYear" (ngModelChange)="loadData()" nzPlaceHolder="Year" class="filter-select" style="width:110px">
              <nz-option *ngFor="let y of yearList" [nzValue]="y" [nzLabel]="y.toString()"></nz-option>
            </nz-select>
            <nz-select [(ngModel)]="selectedMonth" (ngModelChange)="loadData()" nzPlaceHolder="Month" class="filter-select" style="width:140px">
              <nz-option *ngFor="let m of monthList" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
            </nz-select>
          </div>
        </div>
      </nz-card>

      <!-- ===== STATS BAR ===== -->
      <nz-card class="pl-stats-card" nzSize="small" *ngIf="stats">
        <div class="stats-bar">
          <div class="stats-item">
            <span class="stats-label">Employees</span>
            <span class="stats-value">{{ stats.totalEmployees || 0 }}</span>
          </div>
          <div class="stats-divider"></div>
          <div class="stats-item">
            <span class="stats-label">Total Gross</span>
            <span class="stats-value stats-currency">&#8377;{{ (stats.totalGross || 0) | number:'1.2-2' }}</span>
          </div>
          <div class="stats-divider"></div>
          <div class="stats-item">
            <span class="stats-label">Total Deductions</span>
            <span class="stats-value stats-currency stats-negative">&#8377;{{ (stats.totalDeductions || 0) | number:'1.2-2' }}</span>
          </div>
          <div class="stats-divider"></div>
          <div class="stats-item">
            <span class="stats-label">Total Net Pay</span>
            <span class="stats-value stats-currency stats-net">&#8377;{{ (stats.totalNet || 0) | number:'1.2-2' }}</span>
          </div>
        </div>
      </nz-card>

      <!-- ===== PAYSLIP TABLE ===== -->
      <nz-card class="pl-table-card" nzSize="small">
        <nz-table #payslipTable
          [nzData]="payslips"
          [nzLoading]="loading"
          [nzPageSize]="50"
          [nzScroll]="{ x: '1200px' }"
          nzBordered nzSize="small"
          class="theme-table">
          <thead>
            <tr>
              <th class="th-sno">#</th>
              <th class="th-code">Code</th>
              <th>Name</th>
              <th class="th-num">Basic</th>
              <th class="th-num">Gross</th>
              <th class="th-num">PF</th>
              <th class="th-num">ESI</th>
              <th class="th-num">PT</th>
              <th class="th-num">Net Pay</th>
              <th class="th-num">Present</th>
              <th class="th-num">Leaves</th>
              <th>Status</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of payslipTable.data; let i = index">
              <td class="td-center">{{ i + 1 }}</td>
              <td><span class="emp-code-text">{{ p.employeeCode }}</span></td>
              <td class="td-name">{{ p.employeeName }}</td>
              <td class="td-right">{{ p.basic | number:'1.2-2' }}</td>
              <td class="td-right"><span class="gross-amount">{{ p.grossSalary | number:'1.2-2' }}</span></td>
              <td class="td-right">{{ p.pfDeduction | number:'1.2-2' }}</td>
              <td class="td-right">{{ p.esiDeduction | number:'1.2-2' }}</td>
              <td class="td-right">{{ p.ptDeduction | number:'1.2-2' }}</td>
              <td class="td-right"><span class="net-amount">{{ p.netPay | number:'1.2-2' }}</span></td>
              <td class="td-center">{{ p.presentDays }}</td>
              <td class="td-center">{{ p.leaveDays }}</td>
              <td class="td-center">
                <nz-tag [nzColor]="statusColor(p.status)" class="status-tag">{{ p.status }}</nz-tag>
              </td>
              <td class="td-actions">
                <button nz-button nzType="link" nzSize="small" class="action-btn action-view"
                  (click)="viewPayslip(p.id)" nz-tooltip="View Payslip">
                  <i nz-icon nzType="eye"></i>
                </button>
                <button nz-button nzType="link" nzSize="small" class="action-btn action-mail"
                  (click)="sendEmail(p)" nz-tooltip="Send Email" [disabled]="p.status === 'SENT'">
                  <i nz-icon nzType="mail"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="payslips.length === 0 && !loading">
              <td colspan="13" class="empty-cell">No payslips found for the selected period</td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>
  `,
  styles: [`
    .pl-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 12px 16px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }
    .pl-header {
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
    .pl-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .pl-header-icon {
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
    .pl-header-title {
      font-size: 17px;
      font-weight: 700;
      color: #fff;
      letter-spacing: 0.3px;
    }
    .pl-header-sub {
      font-size: 12px;
      color: rgba(255,255,255,0.6);
      font-weight: 400;
      margin-top: 1px;
    }
    .pl-header-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .pl-header-btn {
      height: 34px !important;
      padding: 0 16px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      border: none !important;
      border-radius: 8px !important;
      background: rgba(255,255,255,0.18) !important;
      color: #fff !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      transition: all 0.2s ease !important;
      letter-spacing: 0.3px !important;
    }
    .pl-header-btn:hover {
      background: rgba(255,255,255,0.28) !important;
      transform: translateY(-1px);
    }
    .pl-controls-card, .pl-stats-card, .pl-table-card {
      border-radius: 10px !important;
      border: 1px solid #e8eaed !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
      margin-bottom: 14px;
      width: 100% !important;
    }
    :host ::ng-deep .pl-controls-card .ant-card-body {
      padding: 14px 16px !important;
    }
    :host ::ng-deep .pl-stats-card .ant-card-body {
      padding: 14px 16px !important;
    }
    :host ::ng-deep .pl-table-card .ant-card-body {
      padding: 14px 16px !important;
    }
    .pl-controls {
      display: flex;
      align-items: center;
    }
    .pl-filters {
      display: flex;
      gap: 10px;
      align-items: center;
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
    .stats-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .stats-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .stats-label {
      font-size: 10px;
      font-weight: 600;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .stats-value {
      font-size: 14px;
      font-weight: 700;
      color: #374151;
    }
    .stats-currency {
      font-family: 'Courier New', monospace;
    }
    .stats-negative {
      color: #ef4444;
    }
    .stats-net {
      color: #059669;
    }
    .stats-divider {
      width: 1px;
      height: 28px;
      background: #e2e5ea;
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
      width: 38px !important;
      text-align: center !important;
    }
    .th-code {
      width: 85px !important;
      text-align: center !important;
    }
    .th-num {
      width: 80px !important;
      text-align: right !important;
    }
    .th-actions {
      width: 80px !important;
      text-align: center !important;
    }
    .td-center {
      text-align: center !important;
    }
    .td-right {
      text-align: right !important;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    }
    .td-name {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 140px;
    }
    .td-actions {
      text-align: center !important;
      white-space: nowrap;
    }
    .emp-code-text {
      font-weight: 600;
      color: #1f3d6e;
      letter-spacing: 0.3px;
      font-size: 12px;
    }
    .gross-amount {
      font-weight: 700;
      color: #374151;
    }
    .net-amount {
      font-weight: 700;
      color: #059669;
    }
    .status-tag {
      font-size: 10px !important;
      font-weight: 600 !important;
      padding: 0 6px !important;
      line-height: 18px !important;
      border-radius: 3px !important;
    }
    .action-btn {
      padding: 0 4px !important;
      font-size: 15px !important;
      transition: all 0.2s ease !important;
    }
    .action-view {
      color: #1f3d6e !important;
    }
    .action-view:hover {
      color: #16213e !important;
      transform: scale(1.15);
    }
    .action-mail {
      color: #4361ee !important;
    }
    .action-mail:hover {
      color: #3a0ca3 !important;
      transform: scale(1.15);
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
export class PayslipListComponent implements OnInit {
  loading = false;
  sending = false;
  selectedYear: number;
  selectedMonth: number;
  payslips: Payslip[] = [];
  stats: any = null;

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
    this.selectedYear = now.getFullYear();
    this.selectedMonth = now.getMonth() + 1;
  }

  ngOnInit(): void {
    const now = new Date();
    for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) {
      this.yearList.push(y);
    }
    this.loadData();
  }

  statusColor(status: string): string {
    switch (status) {
      case 'GENERATED': return '#1890ff';
      case 'SENT': return '#52c41a';
      case 'DOWNLOADED': return '#722ed1';
      default: return '#d9d9d9';
    }
  }

  loadData(): void {
    this.loading = true;
    this.payrollService.getPayslips(this.selectedYear, this.selectedMonth).subscribe({
      next: (res) => {
        this.payslips = res.data || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
    this.payrollService.getPayslipStats(this.selectedYear, this.selectedMonth).subscribe({
      next: (res) => { this.stats = res.data; }
    });
  }

  viewPayslip(id: number): void {
    this.payrollService.getPayslipHtml(id).subscribe({
      next: (html) => {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(html);
          win.document.title = `Payslip #${id}`;
          win.document.close();
        }
      },
      error: () => this.msg.error('Failed to load payslip')
    });
  }

  sendEmail(p: Payslip): void {
    this.msg.info(`Sending email for ${p.employeeName}...`);
    this.payrollService.sendPayslipsByEmail(this.selectedYear, this.selectedMonth).subscribe({
      next: (res) => {
        if (res.success) {
          this.msg.success('Payslip email sent');
          this.loadData();
        }
      },
      error: (err) => this.msg.error(err.error?.message || 'Failed to send email')
    });
  }

  sendAll(): void {
    this.sending = true;
    this.payrollService.sendPayslipsByEmail(this.selectedYear, this.selectedMonth).subscribe({
      next: (res) => {
        if (res.success) {
          this.msg.success('All payslips sent by email');
          this.loadData();
        }
        this.sending = false;
      },
      error: (err) => {
        this.msg.error(err.error?.message || 'Failed to send payslips');
        this.sending = false;
      }
    });
  }

  downloadBankFile(): void {
    this.payrollService.downloadBankFile(this.selectedYear, this.selectedMonth).subscribe({
      next: (blob) => saveAs(blob, `Bank_File_${this.selectedYear}_${this.selectedMonth}.xlsx`),
      error: () => this.msg.error('Failed to download bank file')
    });
  }

  downloadReport(): void {
    this.payrollService.downloadPayrollReport(this.selectedYear, this.selectedMonth).subscribe({
      next: (blob) => saveAs(blob, `Payroll_Report_${this.selectedYear}_${this.selectedMonth}.xlsx`),
      error: () => this.msg.error('Failed to download report')
    });
  }
}
