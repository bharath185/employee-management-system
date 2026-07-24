import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { EncashmentService } from '../../core/services/encashment.service';
import { EmployeeService } from '../../core/services/employee.service';
import { LeaveService } from '../../core/services/leave.service';
import { LeaveEncashment, LeaveType, LeaveBalance } from '../../core/models/payroll.models';


@Component({
  selector: 'app-encashment',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzTableModule, NzButtonModule, NzSelectModule,
    NzIconModule, NzInputNumberModule, NzInputModule, NzTagModule,
    NzPopconfirmModule
  ],
  template: `
    <div class="page-enter">
      <div class="section-card">
        <div class="section-toolbar">
          <nz-select [(ngModel)]="employeeFilter" (ngModelChange)="loadEncashments()" class="filter-select" nzPlaceHolder="All Employees" style="width:240px">
            <nz-option [nzValue]="null" nzLabel="All Employees"></nz-option>
            <nz-option *ngFor="let e of employees" [nzValue]="e.id" [nzLabel]="e.employeeCode + ' - ' + e.firstName + ' ' + e.surname"></nz-option>
          </nz-select>
          <button nz-button (click)="showCreateModal()">
            <i nz-icon nzType="plus"></i> New Encashment
          </button>
        </div>

        <nz-table #t [nzData]="encashments" [nzLoading]="loading" class="theme-table" nzSize="small">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>Days</th>
              <th>Amount</th>
              <th>Period</th>
              <th>Status</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of t.data">
              <td><span class="emp-cell">{{ e.employeeCode }} - {{ e.employeeName }}</span></td>
              <td>{{ e.leaveTypeName }}</td>
              <td>{{ e.encashedDays }}</td>
              <td>{{ e.encashmentAmount | number:'1.2-2' }}</td>
              <td>{{ monthName(e.month) }} {{ e.year }}</td>
              <td><nz-tag [nzColor]="statusColor(e.status)">{{ e.status }}</nz-tag></td>
              <td class="td-actions">
                <button *ngIf="e.status === 'PENDING'" nz-button nzType="link" nzSize="small" class="action-btn action-approve"
                  (click)="approve(e.id)" nz-tooltip="Approve">
                  <i nz-icon nzType="check-circle"></i>
                </button>
                <button *ngIf="e.status === 'PENDING'" nz-button nzType="link" nzSize="small" class="action-btn action-reject"
                  nz-popconfirm nzPopconfirmTitle="Reject this encashment?" (nzOnConfirm)="reject(e.id)" nz-tooltip="Reject">
                  <i nz-icon nzType="close-circle"></i>
                </button>
                <span *ngIf="e.status !== 'PENDING'" class="text-muted">—</span>
              </td>
            </tr>
            <tr *ngIf="encashments.length === 0 && !loading">
              <td colspan="7" class="empty-cell">No encashments found</td>
            </tr>
          </tbody>
        </nz-table>
      </div>

      <div class="modal-overlay" *ngIf="modalVisible" (click)="modalVisible = false">
        <div class="modal-box" style="width:480px" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-header-left">
              <div class="modal-header-icon"><i nz-icon nzType="dollar"></i></div>
              <span>New Leave Encashment</span>
            </div>
            <button class="modal-close" (click)="modalVisible = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <label>Employee</label>
              <nz-select [(ngModel)]="form.employeeId" (ngModelChange)="onEmployeeChange()" nzPlaceHolder="Select Employee" class="theme-select">
                <nz-option *ngFor="let e of employees" [nzValue]="e.id" [nzLabel]="e.employeeCode + ' - ' + e.firstName + ' ' + e.surname"></nz-option>
              </nz-select>
            </div>
            <div class="form-row">
              <label>Leave Type</label>
              <nz-select [(ngModel)]="form.leaveTypeId" (ngModelChange)="onLeaveTypeChange()" nzPlaceHolder="Select Leave Type" class="theme-select">
                <nz-option *ngFor="let lt of leaveTypes" [nzValue]="lt.id" [nzLabel]="lt.name"></nz-option>
              </nz-select>
            </div>
            <div class="form-row" *ngIf="availableBalance !== null">
              <label>Available Balance</label>
              <div class="balance-info">{{ availableBalance }} days</div>
            </div>
            <div class="form-row">
              <label>Encashed Days</label>
              <nz-input-number [(ngModel)]="form.encashedDays" [nzMin]="1" [nzMax]="availableBalance || 30" class="theme-input-number" style="width:100%"></nz-input-number>
            </div>
            <div class="form-row">
              <label>Encashment Amount</label>
              <nz-input-number [(ngModel)]="form.encashmentAmount" [nzMin]="0" [nzStep]="100" class="theme-input-number" style="width:100%"></nz-input-number>
            </div>
            <div class="form-row">
              <label>Remarks</label>
              <textarea nz-input [(ngModel)]="form.remarks" [nzAutosize]="{ minRows: 2, maxRows: 4 }" class="theme-input"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button nz-button class="btn-cancel" (click)="modalVisible = false">Cancel</button>
            <button nz-button class="btn-primary-gradient" [nzLoading]="saving" (click)="create()">Create</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .section-card {
      background: #fff;
      border: 1px solid #e8eaed;
      border-radius: 10px;
      padding: 14px 16px;
      margin-top: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .section-toolbar { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
    .filter-select { width: 170px; }
    :host ::ng-deep .filter-select .ant-select-selector {
      border-radius: 8px !important;
      border: 1px solid #e2e5ea !important;
      height: 34px !important;
    }
    :host ::ng-deep .theme-table { width: 100% !important; }
    :host ::ng-deep .theme-table .ant-table { font-size: 13px; }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th {
      background: #f8f9fc !important;
      color: #1f3d6e !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      padding: 10px 12px !important;
      border-bottom: 2px solid #1f3d6e !important;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr > td {
      padding: 9px 12px !important;
      border-bottom: 1px solid #f0f2f5 !important;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr:hover > td { background: rgba(31,61,110,0.03) !important; }
    :host ::ng-deep .theme-table .ant-table-placeholder { display: none !important; }
    .emp-cell { font-weight: 500; color: #1f3d6e; }
    .th-actions { text-align: center !important; width: 90px; }
    .td-actions { text-align: center !important; white-space: nowrap; }
    .action-btn { padding: 0 4px !important; font-size: 16px !important; }
    .action-approve { color: #10b981 !important; }
    .action-reject { color: #ef4444 !important; }
    .text-muted { color: #d1d5db; font-size: 13px; }
    .empty-cell { text-align: center !important; padding: 28px !important; color: #9ca3af !important; }
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(4px);
    }
    .modal-box { background: #fff; border-radius: 12px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 12px 48px rgba(0,0,0,0.2); }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 20px; border-bottom: 1px solid #e8eaed;
      background: #f8fafc; border-radius: 12px 12px 0 0;
    }
    .modal-header-left { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 600; color: #1f3d6e; }
    .modal-header-icon {
      width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #1f3d6e, #16213e); border-radius: 6px; color: #fff; font-size: 15px;
    }
    .modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #9ca3af; padding: 0 6px; }
    .modal-body { padding: 20px; overflow-y: auto; flex: 1; }
    .modal-footer {
      padding: 12px 20px; border-top: 1px solid #e8eaed;
      display: flex; justify-content: flex-end; gap: 10px;
      background: #fafbfc; border-radius: 0 0 12px 12px;
    }
    .form-row { margin-bottom: 14px; }
    .form-row label { display: block; font-weight: 600; margin-bottom: 5px; font-size: 12px; color: #374151; text-transform: uppercase; letter-spacing: 0.4px; }
    .theme-select, :host ::ng-deep .theme-select { width: 100% !important; }
    :host ::ng-deep .theme-select .ant-select-selector { border-radius: 8px !important; border: 1px solid #e2e5ea !important; min-height: 36px !important; }
    .theme-input { border-radius: 8px !important; border: 1px solid #e2e5ea !important; padding: 8px 12px !important; }
    .theme-input-number :host ::ng-deep .ant-input-number { border-radius: 8px !important; width: 100% !important; }
    .btn-primary-gradient {
      height: 34px !important; padding: 0 20px !important; font-size: 13px !important; font-weight: 600 !important;
      border: none !important; border-radius: 8px !important;
      background: linear-gradient(135deg, #4361ee, #3a0ca3) !important; color: #fff !important;
      box-shadow: 0 2px 8px rgba(67,97,238,0.3) !important;
    }
    .btn-cancel { height: 34px !important; padding: 0 18px !important; font-size: 13px !important; border-radius: 8px !important; border: 1px solid #e2e5ea !important; background: #fff !important; color: #6c757d !important; }
    .balance-info {
      font-size: 14px; font-weight: 700; color: #10b981;
      padding: 6px 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;
    }
  `]
})
export class EncashmentComponent implements OnInit {
  encashments: LeaveEncashment[] = [];
  employees: any[] = [];
  leaveTypes: LeaveType[] = [];
  leaveBalances: LeaveBalance[] = [];
  availableBalance: number | null = null;
  loading = false;
  saving = false;
  modalVisible = false;
  employeeFilter: number | null = null;

  form: any = {
    employeeId: null, leaveTypeId: null, encashedDays: 1,
    encashmentAmount: 0, remarks: ''
  };

  private months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  constructor(
    private encashmentService: EncashmentService,
    private employeeService: EmployeeService,
    private leaveService: LeaveService,
    private msg: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadLeaveTypes();
    this.loadEncashments();
  }

  loadEmployees(): void {
    this.employeeService.getEmployees({ size: 200, employeeStatus: 'LIVE' }).subscribe({
      next: (res) => { if (res.success) this.employees = res.data?.content || []; }
    });
  }

  loadLeaveTypes(): void {
    this.leaveService.getLeaveTypes().subscribe({
      next: (res) => { this.leaveTypes = (res.data || []).filter(lt => lt.name !== 'SL'); }
    });
  }

  loadEncashments(): void {
    this.loading = true;
    this.encashmentService.getEncashments(this.employeeFilter ?? undefined).subscribe({
      next: (res) => { this.encashments = res.data || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  showCreateModal(): void {
    this.form = {
      employeeId: null, leaveTypeId: null, encashedDays: 1,
      encashmentAmount: 0, remarks: ''
    };
    this.availableBalance = null;
    this.modalVisible = true;
  }

  onEmployeeChange(): void {
    this.availableBalance = null;
    this.form.encashedDays = 1;
    if (this.form.leaveTypeId) {
      this.fetchBalance();
    }
  }

  onLeaveTypeChange(): void {
    this.availableBalance = null;
    this.form.encashedDays = 1;
    if (this.form.employeeId) {
      this.fetchBalance();
    }
  }

  fetchBalance(): void {
    const year = new Date().getFullYear();
    this.leaveService.getLeaveBalances(this.form.employeeId, year).subscribe({
      next: (res) => {
        this.leaveBalances = res.data || [];
        const match = this.leaveBalances.find(b => b.leaveTypeId === this.form.leaveTypeId);
        this.availableBalance = match ? match.balance : 0;
      },
      error: () => { this.availableBalance = 0; }
    });
  }

  create(): void {
    if (!this.form.employeeId || !this.form.leaveTypeId) {
      this.msg.warning('Please fill in all required fields');
      return;
    }
    if (this.availableBalance !== null && this.form.encashedDays > this.availableBalance) {
      this.msg.warning('Cannot encash more than available balance (' + this.availableBalance + ' days)');
      return;
    }
    this.saving = true;
    const now = new Date();
    this.encashmentService.createEncashment({
      employee: { id: this.form.employeeId },
      leaveType: { id: this.form.leaveTypeId },
      encashedDays: this.form.encashedDays,
      encashmentAmount: this.form.encashmentAmount,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      remarks: this.form.remarks
    }).subscribe({
      next: () => {
        this.msg.success('Encashment created');
        this.modalVisible = false;
        this.loadEncashments();
        this.saving = false;
      },
      error: (err) => { this.msg.error(err.error?.message || 'Failed'); this.saving = false; }
    });
  }

  approve(id: number): void {
    this.encashmentService.approveEncashment(id).subscribe({
      next: () => { this.msg.success('Encashment approved'); this.loadEncashments(); },
      error: (err) => this.msg.error(err.error?.message || 'Failed')
    });
  }

  reject(id: number): void {
    this.encashmentService.rejectEncashment(id).subscribe({
      next: () => { this.msg.success('Encashment rejected'); this.loadEncashments(); },
      error: (err) => this.msg.error(err.error?.message || 'Failed')
    });
  }

  monthName(m: number): string {
    return this.months[m - 1] || '';
  }

  statusColor(s: string): string {
    switch (s) {
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'PENDING': return 'orange';
      default: return 'default';
    }
  }
}
