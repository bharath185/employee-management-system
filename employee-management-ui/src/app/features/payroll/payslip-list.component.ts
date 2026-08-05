import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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
import { environment } from '../../../environments/environment';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-payslip-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzTableModule, NzButtonModule, NzSelectModule,
    NzIconModule, NzTagModule, NzCardModule, NzSpinModule, NzPopconfirmModule,
    RouterLink, RouterLinkActive
  ],
  template: `
    <div class="pl-container">
      <div class="pp-sub-nav">
        <a class="pp-nav-item" routerLink="/admin/payroll/process" routerLinkActive="active">
          <i nz-icon nzType="upload"></i><span>Upload</span>
        </a>

        <a class="pp-nav-item" routerLink="/admin/payroll/payslips" routerLinkActive="active">
          <i nz-icon nzType="file-text"></i><span>Payslips</span>
        </a>
        <a class="pp-nav-item" routerLink="/admin/payroll/config" routerLinkActive="active">
          <i nz-icon nzType="mail"></i><span>Config</span>
        </a>
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
          <div class="pp-actions">
            <button nz-button nzType="default" (click)="downloadStatement()" nz-tooltip="Download Salary Statement">
              <i nz-icon nzType="file-excel"></i> Statement
            </button>
            <button nz-button nzType="default" (click)="downloadBankFile()" nz-tooltip="Download Bank File">
              <i nz-icon nzType="bank"></i> Bank File
            </button>
            <button nz-button nzType="default" (click)="downloadReport()" nz-tooltip="Download Payroll Report">
              <i nz-icon nzType="bar-chart"></i> Report
            </button>
             <button nz-button class="btn-primary-gradient" (click)="sendAll()" [nzLoading]="sending">
              <i nz-icon nzType="mail"></i> Send All
            </button>
            <button nz-button class="btn-primary-gradient" (click)="sendSelected()"
              [disabled]="selectedIds.size === 0" [nzLoading]="sending">
              <i nz-icon nzType="send"></i> Send Selected ({{ selectedIds.size }})
            </button>
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
          [nzPageSize]="20"
          [nzPageSizeOptions]="[10, 20, 50]"
          [nzShowSizeChanger]="true"
          nzBordered nzSize="small"
          nzShowPagination
          nzFrontPagination
          class="theme-table">
           <thead>
            <tr>
              <th class="th-cb">
                <label class="cb-label"><input type="checkbox" [checked]="allChecked" (change)="toggleSelectAll()" class="cb-all"/></label>
              </th>
              <th class="th-sno">#</th>
              <th class="th-code">Code</th>
              <th class="th-name">Name</th>
              <th class="th-num">Basic</th>
              <th class="th-num">Gross</th>
              <th class="th-num">PF</th>
              <th class="th-num">ESI</th>
              <th class="th-num">PT</th>
              <th class="th-num">Net Pay</th>
              <th class="th-present">Pres</th>
              <th class="th-present">Leave</th>
              <th class="th-status">Status</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of payslipTable.data; let i = index">
              <td class="td-center">
                <input type="checkbox" [checked]="selectedIds.has(p.id)" (change)="toggleOne(p.id)" class="cb-row"/>
              </td>
              <td class="td-center">{{ i + 1 }}</td>
              <td class="td-center"><span class="emp-code-text">{{ p.employeeCode }}</span></td>
              <td class="td-name">{{ p.employeeName }}</td>
              <td class="td-right">{{ p.basic | number:'1.0-0' }}</td>
              <td class="td-right"><span class="gross-amount">{{ p.grossSalary | number:'1.0-0' }}</span></td>
              <td class="td-right">{{ p.pfDeduction | number:'1.0-0' }}</td>
              <td class="td-right">{{ p.esiDeduction | number:'1.0-0' }}</td>
              <td class="td-right">{{ p.ptDeduction | number:'1.0-0' }}</td>
              <td class="td-right"><span class="net-amount">{{ p.netPay | number:'1.0-0' }}</span></td>
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
                <button nz-button nzType="link" nzSize="small" class="action-btn action-download"
                  (click)="downloadPayslip(p)" nz-tooltip="Download Payslip">
                  <i nz-icon nzType="download"></i>
                </button>
                <button nz-button nzType="link" nzSize="small" class="action-btn action-mail"
                  (click)="sendEmail(p)" nz-tooltip="Send Email" [disabled]="p.status === 'SENT'">
                  <i nz-icon nzType="mail"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="payslips.length === 0 && !loading">
              <td colspan="14" class="empty-cell">No payslips found for the selected period</td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>
  `,
  styles: [`
    :host { display: block; scroll-behavior: smooth; }
    .pp-sub-nav {
      display: flex;
      gap: 2px;
      margin-bottom: 8px;
      background: #f0f4ff;
      border-radius: 8px;
      padding: 3px;
      border: 1px solid #e0e7ff;
    }
    .pp-nav-item {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #6c757d;
      text-decoration: none;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .pp-nav-item i { font-size: 14px; width: 14px; display: inline-flex; align-items: center; justify-content: center; }
    .pp-nav-item:hover { background: rgba(31,61,110,0.06); color: #1f3d6e; }
    .pp-nav-item.active {
      background: #ffffff;
      color: #1f3d6e;
      box-shadow: 0 1px 4px rgba(31,61,110,0.1);
    }
    .pp-nav-item.active i { color: #1f3d6e; }
    .pl-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 8px 12px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      height: calc(100vh - 48px);
      overflow-y: auto;
      scroll-behavior: smooth;
    }
    .pl-container::-webkit-scrollbar { width: 6px; }
    .pl-container::-webkit-scrollbar-track { background: transparent; }
    .pl-container::-webkit-scrollbar-thumb { background: #d0d5dd; border-radius: 3px; }
    .pl-container::-webkit-scrollbar-thumb:hover { background: #98a2b3; }
    .pl-controls-card, .pl-stats-card, .pl-table-card {
      border-radius: 8px !important;
      border: 1px solid #e8eaed !important;
      box-shadow: 0 1px 6px rgba(0,0,0,0.04) !important;
      margin-bottom: 8px;
      width: 100% !important;
    }
    :host ::ng-deep .pl-controls-card .ant-card-body {
      padding: 8px 12px !important;
    }
    :host ::ng-deep .pl-stats-card .ant-card-body {
      padding: 8px 12px !important;
    }
    :host ::ng-deep .pl-table-card .ant-card-body {
      padding: 0 !important;
    }
    .pl-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 6px;
    }
    .pl-filters {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .pp-actions {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .filter-select {
      width: 120px;
    }
    :host ::ng-deep .filter-select .ant-select-selector {
      border-radius: 6px !important;
      border: 1px solid #e2e5ea !important;
      height: 30px !important;
      padding: 0 6px !important;
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
      font-size: 12px !important;
      line-height: 28px !important;
    }
    .btn-primary-gradient {
      height: 30px !important;
      padding: 0 14px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      border: none !important;
      border-radius: 6px !important;
      background: linear-gradient(135deg, #4361ee, #3a0ca3) !important;
      color: #fff !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
      transition: all 0.2s ease !important;
      letter-spacing: 0.3px !important;
      box-shadow: 0 2px 6px rgba(67,97,238,0.25) !important;
    }
    .btn-primary-gradient:hover {
      transform: translateY(-1px) !important;
      box-shadow: 0 3px 10px rgba(67,97,238,0.35) !important;
    }
    .btn-primary-gradient:active { transform: translateY(0) !important; }
    :host ::ng-deep .pl-controls-card .ant-btn,
    :host ::ng-deep .pl-controls-card button:not(.btn-primary-gradient) {
      height: 30px !important;
      padding: 0 10px !important;
      font-size: 12px !important;
      border-radius: 6px !important;
    }
    .stats-bar {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .stats-item {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .stats-label {
      font-size: 9px;
      font-weight: 600;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .stats-value {
      font-size: 13px;
      font-weight: 700;
      color: #374151;
    }
    .stats-currency { font-family: 'Courier New', monospace; }
    .stats-net { color: #059669; }
    .stats-divider {
      width: 1px;
      height: 24px;
      background: #e2e5ea;
    }
    :host ::ng-deep .theme-table {
      width: 100% !important;
      table-layout: fixed !important;
    }
    :host ::ng-deep .theme-table .ant-table {
      font-size: 12px;
      border-radius: 0 !important;
    }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th {
      background: #f8f9fc !important;
      color: #1f3d6e !important;
      font-size: 10px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
      padding: 6px 6px !important;
      border-bottom: 2px solid #1f3d6e !important;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th:not(:last-child) {
      border-right: 1px solid #e8ecf1;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr > td {
      padding: 4px 6px !important;
      border-bottom: 1px solid #f0f2f5 !important;
      font-size: 11px;
      color: #374151;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
    .th-sno { width: 3% !important; text-align: center !important; }
    .th-cb { width: 3% !important; text-align: center !important; padding: 8px 6px !important; }
    .cb-label { cursor: pointer; display: block; }
    .cb-all { width: 14px; height: 14px; cursor: pointer; accent-color: #1a3a6b; }
    .cb-row { width: 14px; height: 14px; cursor: pointer; accent-color: #1a3a6b; }
    .th-code { width: 7% !important; text-align: center !important; }
    .th-name { width: 15% !important; text-align: left !important; }
    .th-num { width: 9% !important; text-align: right !important; }
    .th-present { width: 5% !important; text-align: center !important; }
    .th-status { width: 9% !important; text-align: center !important; }
    .th-actions { width: 11% !important; text-align: center !important; }
    .td-center { text-align: center !important; }
    .td-right {
      text-align: right !important;
      font-family: 'Courier New', monospace;
      font-size: 11px;
    }
    .td-name {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .td-actions { text-align: center !important; white-space: nowrap; }
    .emp-code-text {
      font-weight: 600;
      color: #1f3d6e;
      letter-spacing: 0.3px;
      font-size: 11px;
    }
    .gross-amount { font-weight: 700; color: #374151; }
    .net-amount { font-weight: 700; color: #059669; }
    .status-tag {
      font-size: 9px !important;
      font-weight: 600 !important;
      padding: 0 5px !important;
      line-height: 16px !important;
      border-radius: 3px !important;
    }
    .action-btn {
      padding: 0 3px !important;
      font-size: 14px !important;
      transition: all 0.2s ease !important;
    }
    .action-view { color: #1f3d6e !important; }
    .action-view:hover { color: #16213e !important; transform: scale(1.15); }
    .action-mail { color: #4361ee !important; }
    .action-mail:hover { color: #3a0ca3 !important; transform: scale(1.15); }
    .action-download { color: #059669 !important; }
    .action-download:hover { color: #047857 !important; transform: scale(1.15); }
    .empty-cell {
      text-align: center !important;
      padding: 20px !important;
      color: #9ca3af !important;
      font-size: 12px;
      font-style: italic;
    }
    :host ::ng-deep .ant-table-body::-webkit-scrollbar { width: 5px; height: 5px; }
    :host ::ng-deep .ant-table-body::-webkit-scrollbar-track { background: #f1f3f5; border-radius: 3px; }
    :host ::ng-deep .ant-table-body::-webkit-scrollbar-thumb { background: #c4c9d4; border-radius: 10px; }
    :host ::ng-deep .ant-table-body::-webkit-scrollbar-thumb:hover { background: #a0a8b7; }
    :host ::ng-deep .ant-select-dropdown {
      border-radius: 6px !important;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important;
      border: 1px solid #e8eaed !important;
      padding: 3px !important;
    }
    :host ::ng-deep .ant-select-item-option {
      border-radius: 4px !important;
      padding: 4px 10px !important;
      font-size: 12px !important;
    }
    :host ::ng-deep .ant-select-item-option-active {
      background: rgba(31,61,110,0.06) !important;
    }
    :host ::ng-deep .ant-select-item-option-selected {
      background: rgba(31,61,110,0.1) !important;
      color: #1f3d6e !important;
      font-weight: 600 !important;
    }
    :host ::ng-deep .ant-pagination {
      margin: 8px 12px !important;
      font-size: 12px !important;
    }
    :host ::ng-deep .ant-pagination-item {
      min-width: 28px !important;
      height: 28px !important;
      line-height: 28px !important;
    }
    :host ::ng-deep .ant-pagination-item a {
      font-size: 12px !important;
    }
    :host ::ng-deep .ant-pagination-options .ant-select-selector {
      height: 28px !important;
      font-size: 12px !important;
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
  selectedIds: Set<number> = new Set();

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
    this.selectedIds.clear();
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
          // Replace relative logo URL with the full backend URL so it resolves correctly
          // when the HTML is opened in a new browser window
          const fullLogoUrl = `${environment.apiUrl}/company/logo`;
          const processedHtml = html.replace(/\/api\/v1\/company\/logo/g, fullLogoUrl);
          win.document.write(processedHtml);
          win.document.title = `Payslip #${id}`;
          win.document.close();
        }
      },
      error: () => this.msg.error('Failed to load payslip')
    });
  }

  downloadPayslip(p: Payslip): void {
    this.payrollService.getPayslipPdf(p.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Payslip_${p.employeeCode}_${this.selectedYear}_${this.selectedMonth}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
      error: () => this.msg.error('Failed to download payslip')
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

  get allChecked(): boolean {
    return this.payslips.length > 0 && this.selectedIds.size === this.payslips.length;
  }

  toggleSelectAll(): void {
    if (this.allChecked) { this.selectedIds.clear(); }
    else { this.payslips.forEach(p => this.selectedIds.add(p.id)); }
  }

  toggleOne(id: number): void {
    if (this.selectedIds.has(id)) { this.selectedIds.delete(id); }
    else { this.selectedIds.add(id); }
  }

  sendSelected(): void {
    if (this.selectedIds.size === 0) return;
    this.sending = true;
    this.payrollService.sendPayslipsByEmail(this.selectedYear, this.selectedMonth, Array.from(this.selectedIds)).subscribe({
      next: (res) => {
        if (res.success) { this.msg.success(`Sent ${res.data?.sent || 0} payslip(s)`); this.loadData(); }
        this.sending = false;
      },
      error: (err) => { this.msg.error(err.error?.message || 'Failed to send payslips'); this.sending = false; }
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

  downloadStatement(): void {
    this.payrollService.downloadSalaryStatement(this.selectedYear, this.selectedMonth).subscribe({
      next: (blob) => saveAs(blob, `Salary_Statement_${this.selectedYear}_${this.selectedMonth}.xlsx`),
      error: () => this.msg.error('No data found for the selected period')
    });
  }
}
