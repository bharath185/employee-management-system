import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { LeaveService } from '../../core/services/leave.service';
import { AuthService } from '../../core/services/auth.service';
import { LeaveBalance, LeaveApplication, LeaveType } from '../../core/models/payroll.models';

@Component({
  selector: 'app-my-leave',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    NzCardModule, NzButtonModule, NzIconModule, NzTableModule,
    NzTagModule, NzFormModule, NzSelectModule, NzDatePickerModule,
    NzInputModule, NzModalModule, NzEmptyModule, NzStatisticModule, NzSkeletonModule
  ],
  template: `
    <div class="leave-container">
      <div class="page-header">
        <div>
          <h1>My Leave</h1>
        </div>
        <button nz-button nzType="default" routerLink="/employee/dashboard">
          <i nz-icon nzType="arrow-left"></i> Back to Dashboard
        </button>
      </div>

      <div *ngIf="loading" class="loading-section">
        <nz-skeleton [nzActive]="true" [nzParagraph]="{ rows: 3 }"></nz-skeleton>
      </div>

      <ng-container *ngIf="!loading">
        <div class="balance-cards">
          <nz-card *ngFor="let b of balances" class="balance-card" [ngClass]="b.balance <= 2 ? 'low-balance' : ''">
            <div class="balance-content">
              <div class="balance-icon">
                <i nz-icon [nzType]="getIcon(b.leaveTypeName)" nzTheme="outline"></i>
              </div>
              <div class="balance-info">
                <p class="balance-type">{{ b.leaveTypeName }}</p>
                <div class="balance-numbers">
                  <div class="num-item">
                    <span class="num-value">{{ b.entitled }}</span>
                    <span class="num-label">Entitled</span>
                  </div>
                  <div class="num-item">
                    <span class="num-value taken">{{ b.taken }}</span>
                    <span class="num-label">Taken</span>
                  </div>
                  <div class="num-item">
                    <span class="num-value remaining">{{ b.balance }}</span>
                    <span class="num-label">Remaining</span>
                  </div>
                </div>
              </div>
            </div>
          </nz-card>
          <nz-card *ngIf="balances.length === 0" class="balance-card empty-balance">
            <nz-empty [nzNotFoundContent]="'No leave balances found'"></nz-empty>
          </nz-card>
        </div>

        <div class="action-section">
          <nz-card class="apply-card" nzTitle="Apply for Leave">
            <form #leaveForm="ngForm" class="apply-form">
              <div class="form-row">
                <div class="form-group">
                  <label>Leave Type</label>
                  <nz-select
                    [(ngModel)]="newApplication.leaveTypeId"
                    name="leaveTypeId"
                    nzPlaceHolder="Select leave type"
                    [nzLoading]="loadingTypes"
                    required>
                    <nz-option *ngFor="let t of leaveTypes" [nzValue]="t.id" [nzLabel]="t.name"></nz-option>
                  </nz-select>
                </div>
                <div class="form-group">
                  <label>From Date</label>
                  <nz-date-picker
                    [(ngModel)]="fromDate"
                    name="fromDate"
                    nzPlaceHolder="Start date"
                    (ngModelChange)="calcDays()"
                    required></nz-date-picker>
                </div>
                <div class="form-group">
                  <label>To Date</label>
                  <nz-date-picker
                    [(ngModel)]="toDate"
                    name="toDate"
                    nzPlaceHolder="End date"
                    (ngModelChange)="calcDays()"
                    required></nz-date-picker>
                </div>
                <div class="form-group days-group">
                  <label>Days</label>
                  <div class="days-display">{{ days > 0 ? days : '—' }}</div>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group reason-group">
                  <label>Reason</label>
                  <textarea
                    nz-input
                    [(ngModel)]="newApplication.reason"
                    name="reason"
                    nzPlaceHolder="Provide a reason for your leave"
                    rows="2"
                    required></textarea>
                </div>
              </div>
              <div class="form-actions">
                <button nz-button nzType="primary" (click)="submitLeave()" [nzLoading]="submitting" [disabled]="!leaveForm.form.valid || days <= 0">
                  <i nz-icon nzType="check-circle"></i> Submit Application
                </button>
              </div>
            </form>
          </nz-card>
        </div>

        <nz-card class="history-card" nzTitle="Leave History">
          <nz-table
            #historyTable
            [nzData]="applications"
            [nzLoading]="loadingHistory"
            [nzPageSize]="10"
            [nzShowPagination]="applications.length > 10"
            nzSize="middle">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Applied On</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let app of historyTable.data">
                <td><strong>{{ app.leaveTypeName }}</strong></td>
                <td>{{ app.fromDate }}</td>
                <td>{{ app.toDate }}</td>
                <td>{{ app.days }}</td>
                <td class="reason-cell">{{ app.reason || '—' }}</td>
                <td>
                  <nz-tag [nzColor]="statusColor(app.status)">{{ app.status }}</nz-tag>
                </td>
                <td>{{ app.appliedDate | date:'dd MMM yyyy' }}</td>
                <td>
                  <button
                    *ngIf="app.status === 'PENDING'"
                    nz-button nzType="default" nzDanger nzSize="small"
                    (click)="cancelLeave(app.id)"
                    [nzLoading]="cancellingId === app.id">
                    <i nz-icon nzType="close-circle"></i> Cancel
                  </button>
                </td>
              </tr>
              <tr *ngIf="applications.length === 0">
                <td colspan="8" class="text-center text-muted">No leave applications found</td>
              </tr>
            </tbody>
          </nz-table>
        </nz-card>
      </ng-container>
    </div>
  `,
  styles: [`
    .leave-container { max-width: 1200px; margin: 0 auto; }
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 24px;
    }
    .page-header h1 { font-size: 28px; font-weight: 700; color: #1a1a2e; margin: 0 0 4px; letter-spacing: -0.5px; }
    .page-header button[nz-button] {
      background: #ffffff !important;
      border: 1px solid #d1d5db !important;
      color: #1a1a2e !important;
      border-radius: 8px;
    }
    .page-header button[nz-button]:hover {
      border-color: #2563eb !important;
      color: #2563eb !important;
    }
    .loading-section { padding: 48px 24px; }

    .balance-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    :host ::ng-deep .balance-card {
      background: #ffffff !important;
      border: 1px solid #e8eaed !important;
      border-radius: 8px !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06) !important;
      position: relative;
      overflow: hidden;
    }
    :host ::ng-deep .balance-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      pointer-events: none;
    }
    :host ::ng-deep .balance-card:not(.low-balance)::before {
      background: #10b981;
    }
    :host ::ng-deep .balance-card.low-balance::before {
      background: #ef4444;
    }
    .balance-content { display: flex; gap: 16px; align-items: center; padding-top: 4px; }
    .balance-icon i {
      font-size: 32px;
      width: 52px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 14px;
      background: #eff6ff;
      color: #2563eb;
    }
    .balance-info { flex: 1; }
    .balance-type { font-size: 15px; font-weight: 600; margin: 0 0 8px; color: #1a1a2e; }
    .balance-numbers { display: flex; gap: 20px; }
    .num-item { text-align: center; min-width: 56px; }
    .num-value { display: block; font-size: 22px; font-weight: 700; color: #1a1a2e; font-family: 'Inter', sans-serif; }
    .num-value.taken { color: #f59e0b; }
    .num-value.remaining { color: #10b981; }
    .num-label { font-size: 10px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; }
    :host ::ng-deep .empty-balance { background: transparent !important; text-align: center; padding: 24px; }

    .action-section { margin-bottom: 24px; }
    :host ::ng-deep .action-section .apply-card {
      background: #ffffff !important;
      border: 1px solid #e8eaed !important;
      border-radius: 8px !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06) !important;
      position: relative;
      overflow: hidden;
    }
    :host ::ng-deep .action-section .apply-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: #2563eb;
      pointer-events: none;
    }
    :host ::ng-deep .action-section .apply-card .ant-card-head {
      border-bottom: 1px solid #e8eaed !important;
      color: #1a1a2e !important;
      font-size: 18px;
      font-weight: 600;
      padding: 0 24px;
      min-height: 56px;
    }
    :host ::ng-deep .action-section .apply-card .ant-card-body {
      padding: 20px 24px 24px;
    }
    .apply-form { padding-top: 4px; }
    .form-row {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1.5fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    @media (max-width: 768px) {
      .form-row { grid-template-columns: 1fr; }
      .balance-cards { grid-template-columns: 1fr; }
    }
    .form-group label {
      display: block; font-size: 12px; font-weight: 500;
      color: #6c757d; margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .days-display {
      font-size: 28px; font-weight: 800;
      color: #2563eb;
      padding: 8px 0; line-height: 32px;
      font-family: 'Inter', sans-serif;
    }
    .reason-group { grid-column: 1 / -1; }
    .form-actions { text-align: right; margin-top: 8px; }
    .form-actions button[nz-button][nzType="primary"] {
      background: #2563eb !important;
      border: none !important;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2) !important;
      border-radius: 6px;
    }

    :host ::ng-deep .history-card {
      background: #ffffff !important;
      border: 1px solid #e8eaed !important;
      border-radius: 8px !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06) !important;
      margin-bottom: 24px;
      overflow: hidden;
    }
    :host ::ng-deep .history-card .ant-card-head {
      border-bottom: 1px solid #e8eaed !important;
      color: #1a1a2e !important;
      font-size: 18px;
      font-weight: 600;
      padding: 0 24px;
      min-height: 56px;
    }
    :host ::ng-deep .history-card .ant-card-body {
      padding: 0;
    }
    :host ::ng-deep .history-card .ant-table {
      background: transparent !important;
      color: #1a1a2e !important;
    }
    :host ::ng-deep .history-card .ant-table-thead > tr > th {
      background: #f8fafc !important;
      border-bottom: 1px solid #e8eaed !important;
      color: #6c757d !important;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 14px 16px;
    }
    :host ::ng-deep .history-card .ant-table-tbody > tr > td {
      border-bottom: 1px solid #e8eaed !important;
      color: #1a1a2e !important;
      background: transparent !important;
      padding: 14px 16px;
    }
    :host ::ng-deep .history-card .ant-table-tbody > tr:hover > td {
      background: #f1f5f9 !important;
    }
    :host ::ng-deep .history-card .ant-table-tbody > tr > td strong {
      color: #1a1a2e;
    }
    :host ::ng-deep .history-card .ant-pagination {
      color: #6c757d !important;
      padding: 12px 24px;
      margin: 0 !important;
      border-top: 1px solid #e8eaed;
    }
    :host ::ng-deep .history-card .ant-pagination-item {
      background: #ffffff !important;
      border-color: #e8eaed !important;
      color: #1a1a2e !important;
      border-radius: 6px;
    }
    :host ::ng-deep .history-card .ant-pagination-item a {
      color: #1a1a2e !important;
    }
    :host ::ng-deep .history-card .ant-pagination-item-active {
      border-color: #2563eb !important;
      background: #eff6ff !important;
    }
    :host ::ng-deep .history-card .ant-pagination-item-active a {
      color: #2563eb !important;
    }

    .reason-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .text-center { text-align: center; }
    .text-muted { color: #adb5bd; }
  `]
})
export class MyLeaveComponent implements OnInit, OnDestroy {
  balances: LeaveBalance[] = [];
  applications: LeaveApplication[] = [];
  leaveTypes: LeaveType[] = [];
  loading = true;
  loadingHistory = false;
  loadingTypes = false;
  submitting = false;
  cancellingId: number | null = null;
  days = 0;
  fromDate: Date | null = null;
  toDate: Date | null = null;

  newApplication: { leaveTypeId: number | null; reason: string } = {
    leaveTypeId: null,
    reason: ''
  };

  private destroy$ = new Subject<void>();

  constructor(
    private leaveService: LeaveService,
    private authService: AuthService,
    private msg: NzMessageService
  ) {}

  getIcon(name: string): string {
    const map: Record<string, string> = {
      'Annual': 'calendar',
      'Sick': 'medicine-box',
      'Casual': 'gift',
      'Maternity': 'woman',
      'Paternity': 'man',
      'Marriage': 'heart',
      'Bereavement': 'safety'
    };
    for (const [key, icon] of Object.entries(map)) {
      if (name?.toLowerCase().includes(key.toLowerCase())) return icon;
    }
    return 'schedule';
  }

  statusColor(s: string): string {
    switch (s) {
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'PENDING': return 'orange';
      case 'CANCELLED': return 'default';
      default: return 'default';
    }
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user?.id) { this.loading = false; return; }
    const empId = user.id;

    this.loadLeaveTypes();
    this.leaveService.getMyBalances().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => { if (res.success) this.balances = res.data || []; },
      error: () => { this.msg.error('Failed to load leave balances'); }
    });

    this.loadingHistory = true;
    this.leaveService.getMyApplications().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.success) this.applications = (res.data || []).sort((a, b) =>
          new Date(b.appliedDate!).getTime() - new Date(a.appliedDate!).getTime()
        );
        this.loadingHistory = false;
        this.loading = false;
      },
      error: () => { this.loadingHistory = false; this.loading = false; }
    });
  }

  private loadLeaveTypes(): void {
    this.loadingTypes = true;
    this.leaveService.getLeaveTypes().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => { if (res.success) this.leaveTypes = res.data || []; this.loadingTypes = false; },
      error: () => { this.loadingTypes = false; }
    });
  }

  calcDays(): void {
    if (!this.fromDate || !this.toDate) { this.days = 0; return; }
    const from = new Date(this.fromDate);
    const to = new Date(this.toDate);
    const diff = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    this.days = diff >= 0 ? diff + 1 : 0;
  }

  submitLeave(): void {
    const user = this.authService.getCurrentUser();
    if (!user?.id || !this.newApplication.leaveTypeId || !this.fromDate || !this.toDate || this.days <= 0) return;

    this.submitting = true;
    const fmt = (d: Date) => {
      const m = d.getMonth() + 1;
      const day = d.getDate();
      return `${d.getFullYear()}-${m < 10 ? '0' + m : m}-${day < 10 ? '0' + day : day}`;
    };

    this.leaveService.applyLeaveSelf({
      employeeId: user.id,
      leaveTypeId: this.newApplication.leaveTypeId,
      fromDate: fmt(this.fromDate),
      toDate: fmt(this.toDate),
      reason: this.newApplication.reason,
      days: this.days
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.msg.success('Leave application submitted successfully');
          this.resetForm();
          this.refreshData();
        }
      },
      error: (err) => {
        this.submitting = false;
        this.msg.error(err.error?.message || 'Failed to submit leave application');
      }
    });
  }

  cancelLeave(id: number): void {
    this.cancellingId = id;
    this.leaveService.cancelMyLeave(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.cancellingId = null;
        if (res.success) {
          this.msg.success('Leave application cancelled');
          this.refreshData();
        }
      },
      error: (err) => {
        this.cancellingId = null;
        this.msg.error(err.error?.message || 'Failed to cancel leave');
      }
    });
  }

  private resetForm(): void {
    this.newApplication = { leaveTypeId: null, reason: '' };
    this.fromDate = null;
    this.toDate = null;
    this.days = 0;
  }

  private refreshData(): void {
    this.loadLeaveTypes();
    const user = this.authService.getCurrentUser();
    if (!user?.id) return;
    this.leaveService.getMyBalances().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => { if (res.success) this.balances = res.data || []; }
    });
    this.leaveService.getMyApplications().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.success) this.applications = (res.data || []).sort((a, b) =>
          new Date(b.appliedDate!).getTime() - new Date(a.appliedDate!).getTime()
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
