import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { LeaveService } from '../../core/services/leave.service';
import { EmployeeService } from '../../core/services/employee.service';
import { AuthService } from '../../core/services/auth.service';
import { LeaveType, LeaveBalance, LeaveApplication } from '../../core/models/payroll.models';

@Component({
  selector: 'app-leave-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzTableModule, NzButtonModule, NzSelectModule,
    NzIconModule, NzInputModule, NzInputNumberModule, NzDatePickerModule,
    NzTabsModule, NzCardModule, NzTagModule, NzPopconfirmModule, NzSpinModule
  ],
  template: `
    <div class="page-header">
      <h2>Leave Management</h2>
      <button nz-button nzType="primary" (click)="showApplyModal()">
        <i nz-icon nzType="plus"></i> Apply Leave
      </button>
    </div>

    <nz-tabset>
      <nz-tab nzTitle="Applications">
        <div style="display:flex;gap:16px;margin-bottom:16px;align-items:center">
          <nz-select [(ngModel)]="statusFilter" (ngModelChange)="loadApplications()" style="width:150px">
            <nz-option nzValue="" nzLabel="All"></nz-option>
            <nz-option nzValue="PENDING" nzLabel="Pending"></nz-option>
            <nz-option nzValue="APPROVED" nzLabel="Approved"></nz-option>
            <nz-option nzValue="REJECTED" nzLabel="Rejected"></nz-option>
          </nz-select>
        </div>

        <nz-table #appTable [nzData]="applications" [nzLoading]="loadingApps">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>From</th>
              <th>To</th>
              <th>Days</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let app of appTable.data">
              <td>{{ app.employeeCode }} - {{ app.employeeName }}</td>
              <td>{{ app.leaveTypeName }}</td>
              <td>{{ app.fromDate }}</td>
              <td>{{ app.toDate }}</td>
              <td>{{ app.days }}</td>
              <td>{{ app.reason }}</td>
              <td>
                <nz-tag [nzColor]="app.status === 'APPROVED' ? 'green' : app.status === 'REJECTED' ? 'red' : 'orange'">
                  {{ app.status }}
                </nz-tag>
              </td>
              <td>
                <ng-container *ngIf="app.status === 'PENDING' && authService.canManageStaff()">
                  <button nz-button nzType="link" nzSize="small" style="color:green" (click)="approve(app.id)"><i nz-icon nzType="check"></i></button>
                  <button nz-button nzType="link" nzSize="small" nzDanger (click)="reject(app.id)"><i nz-icon nzType="close"></i></button>
                </ng-container>
              </td>
            </tr>
          </tbody>
        </nz-table>
      </nz-tab>

      <nz-tab nzTitle="Balances">
        <div style="display:flex;gap:16px;margin-bottom:16px;align-items:center;flex-wrap:wrap">
          <nz-select [(ngModel)]="balanceYear" (ngModelChange)="loadBalances()" style="width:120px">
            <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
          </nz-select>
          <nz-select [(ngModel)]="balanceEmployeeId" (ngModelChange)="loadBalances()" style="width:250px" nzPlaceHolder="All Employees">
            <nz-option [nzValue]="null" nzLabel="All Employees"></nz-option>
            <nz-option *ngFor="let e of employees" [nzValue]="e.id" [nzLabel]="e.employeeCode + ' - ' + e.firstName + ' ' + e.surname"></nz-option>
          </nz-select>
          <button nz-button nzType="primary" (click)="initAllBalances()" [nzLoading]="initing"
                  *ngIf="authService.canManageStaff()">
            <i nz-icon nzType="team"></i> Initialize All Employees
          </button>
        </div>

        <nz-table #balTable [nzData]="balances" [nzLoading]="loadingBals">
          <thead>
            <tr>
              <th>Employee Code</th>
              <th>Name</th>
              <th>Leave Type</th>
              <th>Entitled</th>
              <th>Taken</th>
              <th>Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let b of balTable.data">
              <td>{{ b.employeeCode }}</td>
              <td>{{ b.employeeName }}</td>
              <td>{{ b.leaveTypeName }}</td>
              <td>{{ b.entitled }}</td>
              <td>{{ b.taken }}</td>
              <td><b [style.color]="b.balance <= 2 ? 'red' : 'inherit'">{{ b.balance }}</b></td>
              <td>
                <button nz-button nzType="link" nzSize="small" (click)="editBalance(b)" *ngIf="authService.canManageStaff()"><i nz-icon nzType="edit"></i></button>
              </td>
            </tr>
          </tbody>
        </nz-table>
      </nz-tab>
    </nz-tabset>

    <!-- Apply Leave Modal (custom overlay) -->
    <div class="modal-overlay" *ngIf="applyModalVisible" (click)="applyModalVisible = false">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <span>Apply Leave</span>
          <button class="modal-close" (click)="applyModalVisible = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>Employee</label>
            <nz-select [(ngModel)]="applyForm.employeeId" name="employeeId" nzPlaceHolder="Select Employee" style="width:100%">
              <nz-option *ngFor="let e of employees" [nzValue]="e.id" [nzLabel]="e.employeeCode + ' - ' + e.firstName + ' ' + e.surname"></nz-option>
            </nz-select>
          </div>
          <div class="form-row">
            <label>Leave Type</label>
            <nz-select [(ngModel)]="applyForm.leaveTypeId" name="leaveTypeId" style="width:100%">
              <nz-option *ngFor="let lt of leaveTypes" [nzValue]="lt.id" [nzLabel]="lt.name"></nz-option>
            </nz-select>
          </div>
          <div class="form-row">
            <label>From Date</label>
            <nz-date-picker [(ngModel)]="applyForm.fromDate" name="fromDate" style="width:100%"></nz-date-picker>
          </div>
          <div class="form-row">
            <label>To Date</label>
            <nz-date-picker [(ngModel)]="applyForm.toDate" name="toDate" style="width:100%"></nz-date-picker>
          </div>
          <div class="form-row">
            <label>Reason</label>
            <textarea nz-input [(ngModel)]="applyForm.reason" name="reason" [nzAutosize]="{ minRows: 2 }"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button nz-button (click)="applyModalVisible = false">Cancel</button>
          <button nz-button nzType="primary" [nzLoading]="savingApp" (click)="applyLeave()">Submit</button>
        </div>
      </div>
    </div>

    <!-- Edit Balance Modal -->
    <div class="modal-overlay" *ngIf="editBalanceVisible" (click)="editBalanceVisible = false">
      <div class="modal-box" style="width:400px" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <span>Edit Leave Balance</span>
          <button class="modal-close" (click)="editBalanceVisible = false">&times;</button>
        </div>
        <div class="modal-body">
          <div style="margin-bottom:12px;color:#666;font-size:13px">
            {{ editBalanceData.employeeName }} — {{ editBalanceData.leaveTypeName }}
          </div>
          <div class="form-row">
            <label>Entitled (days)</label>
            <nz-input-number [(ngModel)]="editBalanceData.entitled" [nzMin]="0" [nzMax]="365" style="width:100%"></nz-input-number>
          </div>
          <div class="form-row">
            <label>Taken (days)</label>
            <nz-input-number [(ngModel)]="editBalanceData.taken" [nzMin]="0" [nzMax]="365" style="width:100%"></nz-input-number>
          </div>
          <div class="form-row">
            <label>Balance</label>
            <nz-input-number [ngModel]="editBalanceData.entitled - editBalanceData.taken" [nzDisabled]="true" style="width:100%"></nz-input-number>
          </div>
        </div>
        <div class="modal-footer">
          <button nz-button (click)="editBalanceVisible = false">Cancel</button>
          <button nz-button nzType="primary" [nzLoading]="savingBalance" (click)="saveBalance()">Save</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h2 { margin: 0; font-size: 20px; font-weight: 600; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.45); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .modal-box { background: #fff; border-radius: 8px; width: 520px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 4px 24px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #f0f0f0; font-size: 16px; font-weight: 600; }
    .modal-close { background: none; border: none; font-size: 22px; cursor: pointer; color: #999; padding: 0 4px; }
    .modal-close:hover { color: #333; }
    .modal-body { padding: 24px; overflow-y: auto; flex: 1; }
    .modal-footer { padding: 12px 24px; border-top: 1px solid #f0f0f0; display: flex; justify-content: flex-end; gap: 8px; }
    .form-row { margin-bottom: 16px; }
    .form-row label { display: block; font-weight: 500; margin-bottom: 4px; font-size: 13px; color: #333; }
  `]
})
export class LeaveManagementComponent implements OnInit {
  applications: LeaveApplication[] = [];
  balances: LeaveBalance[] = [];
  leaveTypes: LeaveType[] = [];
  employees: any[] = [];
  loadingApps = false;
  loadingBals = false;
  savingApp = false;
  initing = false;
  applyModalVisible = false;
  editBalanceVisible = false;
  savingBalance = false;
  statusFilter = '';
  balanceYear = new Date().getFullYear();
  balanceEmployeeId: number | null = null;
  years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  editBalanceData: any = { id: 0, employeeName: '', leaveTypeName: '', entitled: 0, taken: 0 };

  applyForm: any = {
    employeeId: null, leaveTypeId: null, fromDate: null, toDate: null, reason: ''
  };

  constructor(
    private leaveService: LeaveService,
    private employeeService: EmployeeService,
    public authService: AuthService,
    private msg: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadLeaveTypes();
    this.loadEmployees();
    this.loadApplications();
    this.loadBalances();
  }

  loadLeaveTypes(): void {
    this.leaveService.getLeaveTypes().subscribe({
      next: (res) => { this.leaveTypes = res.data || []; }
    });
  }

  loadEmployees(): void {
    this.employeeService.getEmployees({ size: 200, employeeStatus: 'LIVE' }).subscribe({
      next: (res) => {
        if (res.success && res.data) this.employees = res.data.content || [];
      }
    });
  }

  loadApplications(): void {
    this.loadingApps = true;
    this.leaveService.getApplications({ status: this.statusFilter || undefined }).subscribe({
      next: (res) => {
        this.applications = res.data?.content || [];
        this.loadingApps = false;
      },
      error: () => { this.loadingApps = false; }
    });
  }

  loadBalances(): void {
    this.loadingBals = true;
    this.leaveService.getLeaveBalances(this.balanceEmployeeId || undefined, this.balanceYear).subscribe({
      next: (res) => {
        this.balances = res.data || [];
        this.loadingBals = false;
      },
      error: () => { this.loadingBals = false; }
    });
  }

  showApplyModal(): void {
    this.applyForm = { employeeId: null, leaveTypeId: null, fromDate: null, toDate: null, reason: '' };
    this.applyModalVisible = true;
  }

  applyLeave(): void {
    this.savingApp = true;
    this.leaveService.applyLeave(this.applyForm).subscribe({
      next: () => {
        this.msg.success('Leave applied');
        this.applyModalVisible = false;
        this.loadApplications();
        this.loadBalances();
        this.savingApp = false;
      },
      error: (err) => {
        this.msg.error(err.error?.message || 'Failed to apply leave');
        this.savingApp = false;
      }
    });
  }

  approve(id: number): void {
    this.leaveService.approveLeave(id).subscribe({
      next: () => {
        this.msg.success('Leave approved');
        this.loadApplications();
        this.loadBalances();
      }
    });
  }

  reject(id: number): void {
    this.leaveService.rejectLeave(id).subscribe({
      next: () => {
        this.msg.success('Leave rejected');
        this.loadApplications();
      }
    });
  }

  initAllBalances(): void {
    this.initing = true;
    this.leaveService.initializeAllBalances(this.balanceYear).subscribe({
      next: (res) => {
        this.msg.success(res.data || 'Leave balances initialized');
        this.loadBalances();
        this.initing = false;
      },
      error: (err) => {
        this.msg.error(err.error?.message || 'Failed to initialize');
        this.initing = false;
      }
    });
  }

  editBalance(b: any): void {
    this.editBalanceData = { id: b.id, employeeName: b.employeeName, leaveTypeName: b.leaveTypeName, entitled: b.entitled, taken: b.taken };
    this.editBalanceVisible = true;
  }

  saveBalance(): void {
    this.savingBalance = true;
    this.leaveService.updateLeaveBalance(this.editBalanceData.id, {
      entitled: this.editBalanceData.entitled,
      taken: this.editBalanceData.taken
    }).subscribe({
      next: () => {
        this.msg.success('Balance updated');
        this.editBalanceVisible = false;
        this.loadBalances();
        this.savingBalance = false;
      },
      error: (err) => {
        this.msg.error(err.error?.message || 'Failed to update');
        this.savingBalance = false;
      }
    });
  }
}
