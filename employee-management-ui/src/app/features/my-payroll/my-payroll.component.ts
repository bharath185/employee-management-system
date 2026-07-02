import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { PayrollService } from '../../core/services/payroll.service';
import { AuthService } from '../../core/services/auth.service';
import { Payslip } from '../../core/models/payroll.models';

@Component({
  selector: 'app-my-payroll',
  standalone: true,
  imports: [
    CommonModule, NzTableModule, NzButtonModule, NzIconModule,
    NzTagModule, NzCardModule, NzSpinModule
  ],
  template: `
    <div class="mp-container">
      <!-- ===== GRADIENT HEADER ===== -->
      <div class="mp-header">
        <div class="mp-header-left">
          <div class="mp-header-icon">
            <i nz-icon nzType="wallet"></i>
          </div>
          <div>
            <div class="mp-header-title">My Payroll</div>
            <div class="mp-header-sub">View your generated payslips</div>
          </div>
        </div>
      </div>

      <!-- ===== PAYSLIP LIST ===== -->
      <nz-card class="mp-card" nzSize="small">
        <div class="mp-count" *ngIf="payslips.length > 0">
          {{ payslips.length }} payslip(s) available
        </div>
        <nz-table #mpTable
          [nzData]="payslips"
          [nzLoading]="loading"
          [nzPageSize]="20"
          nzBordered nzSize="small"
          class="theme-table">
          <thead>
            <tr>
              <th class="th-sno">#</th>
              <th>Year</th>
              <th>Month</th>
              <th class="th-num">Basic</th>
              <th class="th-num">Gross</th>
              <th class="th-num">Deductions</th>
              <th class="th-num">Net Pay</th>
              <th>Status</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of mpTable.data; let i = index">
              <td class="td-center">{{ i + 1 }}</td>
              <td>{{ p.wageYear }}</td>
              <td>{{ monthLabel(p.wageMonth) }}</td>
              <td class="td-right">{{ p.basic | number:'1.2-2' }}</td>
              <td class="td-right"><span class="gross-amount">{{ p.grossSalary | number:'1.2-2' }}</span></td>
              <td class="td-right">{{ p.totalDeductions | number:'1.2-2' }}</td>
              <td class="td-right"><span class="net-amount">&#8377;{{ p.netPay | number:'1.2-2' }}</span></td>
              <td class="td-center">
                <nz-tag [nzColor]="statusColor(p.status)" class="status-tag">{{ p.status }}</nz-tag>
              </td>
              <td class="td-actions">
                <button nz-button nzType="link" nzSize="small" class="action-btn action-view"
                  (click)="viewPayslip(p.id)" nz-tooltip="View Payslip">
                  <i nz-icon nzType="eye"></i> View
                </button>
              </td>
            </tr>
            <tr *ngIf="payslips.length === 0 && !loading">
              <td colspan="9" class="empty-cell">No payslips found for your account</td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>
  `,
  styles: [`
    .mp-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 12px 16px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }
    .mp-header {
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
    .mp-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .mp-header-icon {
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
    .mp-header-title {
      font-size: 17px;
      font-weight: 700;
      color: #fff;
      letter-spacing: 0.3px;
    }
    .mp-header-sub {
      font-size: 12px;
      color: rgba(255,255,255,0.6);
      font-weight: 400;
      margin-top: 1px;
    }
    .mp-card {
      border-radius: 10px !important;
      border: 1px solid #e8eaed !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
      width: 100% !important;
    }
    :host ::ng-deep .mp-card .ant-card-body {
      padding: 14px 16px !important;
    }
    .mp-count {
      font-size: 12px;
      color: #6c757d;
      margin-bottom: 10px;
      font-weight: 500;
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
    .th-num {
      width: 90px !important;
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
    .td-actions {
      text-align: center !important;
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
      padding: 0 8px !important;
      font-size: 12px !important;
      transition: all 0.2s ease !important;
    }
    .action-view {
      color: #1f3d6e !important;
    }
    .action-view:hover {
      color: #16213e !important;
      transform: scale(1.05);
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
  `]
})
export class MyPayrollComponent implements OnInit {
  loading = false;
  payslips: Payslip[] = [];
  currentEmployeeId: number | null = null;

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  constructor(
    private payrollService: PayrollService,
    private authService: AuthService,
    private msg: NzMessageService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user?.id) {
      this.currentEmployeeId = user.id;
      this.loadPayslips();
    }
  }

  monthLabel(m: number): string {
    return this.monthNames[m - 1] || '';
  }

  statusColor(status: string): string {
    switch (status) {
      case 'GENERATED': return '#1890ff';
      case 'SENT': return '#52c41a';
      case 'DOWNLOADED': return '#722ed1';
      default: return '#d9d9d9';
    }
  }

  loadPayslips(): void {
    if (!this.currentEmployeeId) return;
    this.loading = true;
    this.payrollService.getEmployeePayslips(this.currentEmployeeId).subscribe({
      next: (res) => {
        this.payslips = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.msg.error('Failed to load payslips');
      }
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
}
