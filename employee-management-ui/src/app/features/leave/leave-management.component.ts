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
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { LeaveType, LeaveBalance, LeaveApplication } from '../../core/models/payroll.models';

@Component({
  selector: 'app-leave-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzTableModule, NzButtonModule, NzSelectModule,
    NzIconModule, NzInputModule, NzInputNumberModule, NzDatePickerModule,
    NzTabsModule, NzCardModule, NzTagModule,     NzPopconfirmModule, NzSpinModule,
    PageHeaderComponent
  ],
  template: `
    <div class="leave-container page-enter">
      <app-page-header icon="carry-out" title="Leave Management" subtitle="Manage employee leave applications and balances">
        <button nz-button (click)="showApplyModal()">
          <i nz-icon nzType="plus"></i> Apply Leave
        </button>
      </app-page-header>

      <!-- ===== TABS ===== -->
      <nz-tabset class="employee-tabs">
        <nz-tab nzTitle="Applications">
          <div class="tab-filters">
            <nz-select [(ngModel)]="statusFilter" (ngModelChange)="loadApplications()" nzPlaceHolder="Filter by status" class="filter-select">
              <nz-option nzValue="" nzLabel="All Statuses"></nz-option>
              <nz-option nzValue="PENDING" nzLabel="Pending"></nz-option>
              <nz-option nzValue="APPROVED" nzLabel="Approved"></nz-option>
              <nz-option nzValue="REJECTED" nzLabel="Rejected"></nz-option>
            </nz-select>
          </div>

          <nz-table #appTable [nzData]="applications" [nzLoading]="loadingApps" class="theme-table" nzSize="small">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th class="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let app of appTable.data">
                <td><span class="emp-cell">{{ app.employeeCode }} - {{ app.employeeName }}</span></td>
                <td>{{ app.leaveTypeName }}</td>
                <td>{{ app.fromDate }}</td>
                <td>{{ app.toDate }}</td>
                <td class="td-center"><span class="days-badge">{{ app.days }}</span></td>
                <td><span class="reason-text">{{ app.reason }}</span></td>
                <td>
                  <nz-tag [nzColor]="app.status === 'APPROVED' ? 'green' : app.status === 'REJECTED' ? 'red' : 'orange'" class="status-tag">
                    {{ app.status }}
                  </nz-tag>
                </td>
                <td class="td-actions">
                  <ng-container *ngIf="app.status === 'PENDING' && authService.canManageStaff()">
                    <button nz-button nzType="link" nzSize="small" class="action-btn action-approve" (click)="approve(app.id)" nz-tooltip="Approve">
                      <i nz-icon nzType="check-circle"></i>
                    </button>
                    <button nz-button nzType="link" nzSize="small" class="action-btn action-reject" (click)="reject(app.id)" nz-tooltip="Reject">
                      <i nz-icon nzType="close-circle"></i>
                    </button>
                  </ng-container>
                  <span *ngIf="app.status !== 'PENDING'" class="text-muted">—</span>
                </td>
              </tr>
              <tr *ngIf="applications.length === 0 && !loadingApps">
                <td colspan="8" class="empty-cell">No leave applications found</td>
              </tr>
            </tbody>
          </nz-table>
        </nz-tab>

        <nz-tab nzTitle="Balances">
          <div class="tab-filters">
            <nz-select [(ngModel)]="balanceYear" (ngModelChange)="loadBalances()" class="filter-select" style="width:110px">
              <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
            </nz-select>
            <nz-select [(ngModel)]="balanceEmployeeId" (ngModelChange)="loadBalances()" class="filter-select" nzPlaceHolder="All Employees" style="width:240px">
              <nz-option [nzValue]="null" nzLabel="All Employees"></nz-option>
              <nz-option *ngFor="let e of employees" [nzValue]="e.id" [nzLabel]="e.employeeCode + ' - ' + e.firstName + ' ' + e.surname"></nz-option>
            </nz-select>
            <button nz-button class="filter-action-btn" (click)="initAllBalances()" [nzLoading]="initing"
                    *ngIf="authService.canManageStaff()">
              <i nz-icon nzType="team"></i> Initialize All
            </button>
          </div>

          <nz-table #balTable [nzData]="balances" [nzLoading]="loadingBals" class="theme-table" nzSize="small">
            <thead>
              <tr>
                <th>Employee Code</th>
                <th>Name</th>
                <th>Leave Type</th>
                <th class="td-center">Entitled</th>
                <th class="td-center">Taken</th>
                <th class="td-center">Balance</th>
                <th class="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let b of balTable.data">
                <td><span class="emp-code-text">{{ b.employeeCode }}</span></td>
                <td>{{ b.employeeName }}</td>
                <td>{{ b.leaveTypeName }}</td>
                <td class="td-center">{{ b.entitled }}</td>
                <td class="td-center">{{ b.taken }}</td>
                <td class="td-center">
                  <span class="balance-badge" [class.balance-low]="b.balance <= 2">{{ b.balance }}</span>
                </td>
                <td class="td-actions">
                  <button nz-button nzType="link" nzSize="small" class="action-btn action-edit" (click)="editBalance(b)" *ngIf="authService.canManageStaff()" nz-tooltip="Edit Balance">
                    <i nz-icon nzType="edit"></i>
                  </button>
                  <span *ngIf="!authService.canManageStaff()" class="text-muted">—</span>
                </td>
              </tr>
              <tr *ngIf="balances.length === 0 && !loadingBals">
                <td colspan="7" class="empty-cell">No balances found</td>
              </tr>
            </tbody>
          </nz-table>
        </nz-tab>
      </nz-tabset>

      <!-- ===== APPLY LEAVE MODAL (custom overlay) ===== -->
      <div class="modal-overlay" *ngIf="applyModalVisible" (click)="applyModalVisible = false">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-header-left">
              <div class="modal-header-icon"><i nz-icon nzType="carry-out"></i></div>
              <span>Apply Leave</span>
            </div>
            <button class="modal-close" (click)="applyModalVisible = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <label>Employee</label>
              <nz-select [(ngModel)]="applyForm.employeeId" name="employeeId" nzPlaceHolder="Select Employee" class="theme-select">
                <nz-option *ngFor="let e of employees" [nzValue]="e.id" [nzLabel]="e.employeeCode + ' - ' + e.firstName + ' ' + e.surname"></nz-option>
              </nz-select>
            </div>
            <div class="form-row">
              <label>Leave Type</label>
              <nz-select [(ngModel)]="applyForm.leaveTypeId" name="leaveTypeId" nzPlaceHolder="Select Leave Type" class="theme-select">
                <nz-option *ngFor="let lt of leaveTypes" [nzValue]="lt.id" [nzLabel]="lt.name"></nz-option>
              </nz-select>
            </div>
            <div class="form-row">
              <label>From Date</label>
              <nz-date-picker [(ngModel)]="applyForm.fromDate" name="fromDate" class="theme-datepicker"></nz-date-picker>
            </div>
            <div class="form-row">
              <label>To Date</label>
              <nz-date-picker [(ngModel)]="applyForm.toDate" name="toDate" class="theme-datepicker"></nz-date-picker>
            </div>
            <div class="form-row">
              <label>Reason</label>
              <textarea nz-input [(ngModel)]="applyForm.reason" name="reason" [nzAutosize]="{ minRows: 2, maxRows: 4 }" class="theme-input" placeholder="Enter reason for leave"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button nz-button class="btn-cancel" (click)="applyModalVisible = false">Cancel</button>
            <button nz-button class="btn-primary-gradient" [nzLoading]="savingApp" (click)="applyLeave()">Submit</button>
          </div>
        </div>
      </div>

      <!-- ===== EDIT BALANCE MODAL ===== -->
      <div class="modal-overlay" *ngIf="editBalanceVisible" (click)="editBalanceVisible = false">
        <div class="modal-box" style="width:420px" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-header-left">
              <div class="modal-header-icon"><i nz-icon nzType="balance-scale"></i></div>
              <span>Edit Leave Balance</span>
            </div>
            <button class="modal-close" (click)="editBalanceVisible = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="edit-balance-info">
              {{ editBalanceData.employeeName }} — {{ editBalanceData.leaveTypeName }}
            </div>
            <div class="form-row">
              <label>Entitled (days)</label>
              <nz-input-number [(ngModel)]="editBalanceData.entitled" name="entitled" [nzMin]="0" [nzMax]="365" class="theme-input-number"></nz-input-number>
            </div>
            <div class="form-row">
              <label>Taken (days)</label>
              <nz-input-number [(ngModel)]="editBalanceData.taken" name="taken" [nzMin]="0" [nzMax]="365" class="theme-input-number"></nz-input-number>
            </div>
            <div class="form-row">
              <label>Balance (auto-calculated)</label>
              <nz-input-number [ngModel]="editBalanceData.entitled - editBalanceData.taken" name="balance" [nzDisabled]="true" class="theme-input-number"></nz-input-number>
            </div>
          </div>
          <div class="modal-footer">
            <button nz-button class="btn-cancel" (click)="editBalanceVisible = false">Cancel</button>
            <button nz-button class="btn-primary-gradient" [nzLoading]="savingBalance" (click)="saveBalance()">Save</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ===== CONTAINER ===== */
    .leave-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 12px 16px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }

    /* ===== EMPLOYEE TABS ===== */
    .employee-tabs {
      background: #ffffff !important;
      border: 1px solid #e8eaed !important;
      border-radius: 10px !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
      display: block;
      overflow: hidden;
    }
    :host ::ng-deep .employee-tabs .ant-tabs-nav {
      padding: 0 16px !important;
      margin-bottom: 0 !important;
      background: #f8fafc !important;
      border-bottom: 1px solid #e8eaed !important;
    }
    :host ::ng-deep .employee-tabs .ant-tabs-nav-wrap {
      padding-top: 4px;
    }
    :host ::ng-deep .employee-tabs .ant-tabs-tab {
      font-size: 12px !important;
      padding: 7px 14px !important;
      margin: 0 2px !important;
      color: #6c757d !important;
      transition: all 0.2s ease !important;
      border-radius: 6px 6px 0 0 !important;
      letter-spacing: 0.3px !important;
    }
    :host ::ng-deep .employee-tabs .ant-tabs-tab:hover {
      color: #1f3d6e !important;
      background: rgba(31,61,110,0.04) !important;
    }
    :host ::ng-deep .employee-tabs .ant-tabs-tab.ant-tabs-tab-active {
      color: #1f3d6e !important;
      font-weight: 600 !important;
    }
    :host ::ng-deep .employee-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
      color: #1f3d6e !important;
    }
    :host ::ng-deep .employee-tabs .ant-tabs-ink-bar {
      background: #1f3d6e !important;
      height: 3px !important;
      border-radius: 3px 3px 0 0 !important;
    }
    :host ::ng-deep .employee-tabs .ant-tabs-content-holder {
      padding: 0 !important;
    }
    :host ::ng-deep .employee-tabs .ant-tabs-tabpane {
      padding: 14px 16px !important;
    }

    /* ===== TAB FILTERS ===== */
    .tab-filters {
      display: flex;
      gap: 10px;
      margin-bottom: 14px;
      align-items: center;
      flex-wrap: wrap;
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
    .filter-action-btn {
      height: 34px !important;
      padding: 0 14px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      border-radius: 8px !important;
      border: 1px solid #e2e5ea !important;
      background: #fff !important;
      color: #1f3d6e !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      transition: all 0.2s ease !important;
    }
    .filter-action-btn:hover {
      border-color: #1f3d6e !important;
      color: #1f3d6e !important;
      background: rgba(31,61,110,0.04) !important;
    }

    /* ===== THEME TABLE ===== */
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
      padding: 10px 12px !important;
      border-bottom: 2px solid #1f3d6e !important;
      white-space: nowrap;
    }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th:not(:last-child) {
      border-right: 1px solid #e8ecf1;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr > td {
      padding: 9px 12px !important;
      border-bottom: 1px solid #f0f2f5 !important;
      font-size: 13px;
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

    /* Table cell helpers */
    .td-center {
      text-align: center !important;
    }
    .th-actions {
      text-align: center !important;
      width: 100px;
    }
    .td-actions {
      text-align: center !important;
      white-space: nowrap;
    }
    .emp-cell {
      font-weight: 500;
      color: #1f3d6e;
    }
    .emp-code-text {
      font-weight: 600;
      color: #1f3d6e;
      letter-spacing: 0.3px;
    }
    .reason-text {
      display: block;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #6c757d;
      font-size: 12px;
    }
    .days-badge {
      display: inline-block;
      min-width: 26px;
      padding: 1px 8px;
      border-radius: 10px;
      background: #eef2ff;
      color: #1f3d6e;
      font-weight: 700;
      font-size: 12px;
      text-align: center;
    }
    .balance-badge {
      font-weight: 700;
      color: #10b981;
      font-size: 14px;
    }
    .balance-badge.balance-low {
      color: #ef4444;
    }
    .status-tag {
      font-size: 11px !important;
      font-weight: 600 !important;
      padding: 0 8px !important;
      line-height: 20px !important;
      border-radius: 4px !important;
    }
    .text-muted {
      color: #d1d5db;
      font-size: 13px;
    }
    .empty-cell {
      text-align: center !important;
      padding: 28px !important;
      color: #9ca3af !important;
      font-size: 13px;
      font-style: italic;
    }

    /* Action buttons in tables */
    .action-btn {
      padding: 0 4px !important;
      font-size: 16px !important;
      transition: all 0.2s ease !important;
    }
    .action-approve {
      color: #10b981 !important;
    }
    .action-approve:hover {
      color: #059669 !important;
      transform: scale(1.15);
    }
    .action-reject {
      color: #ef4444 !important;
    }
    .action-reject:hover {
      color: #dc2626 !important;
      transform: scale(1.15);
    }
    .action-edit {
      color: #1f3d6e !important;
    }
    .action-edit:hover {
      color: #16213e !important;
      transform: scale(1.15);
    }

    /* ===== MODAL OVERLAY ===== */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .modal-box {
      background: #fff;
      border-radius: 12px;
      width: 520px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 12px 48px rgba(0,0,0,0.2);
      border: 1px solid rgba(31,61,110,0.1);
      animation: slideUp 0.25s ease;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 20px;
      border-bottom: 1px solid #e8eaed;
      background: #f8fafc;
      border-radius: 12px 12px 0 0;
    }
    .modal-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 15px;
      font-weight: 600;
      color: #1f3d6e;
    }
    .modal-header-icon {
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1f3d6e, #16213e);
      border-radius: 6px;
      color: #fff;
      font-size: 15px;
    }
    .modal-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #9ca3af;
      padding: 0 6px;
      line-height: 1;
      transition: all 0.2s;
      border-radius: 4px;
    }
    .modal-close:hover {
      color: #374151;
      background: rgba(0,0,0,0.05);
    }
    .modal-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }
    .modal-footer {
      padding: 12px 20px;
      border-top: 1px solid #e8eaed;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      background: #fafbfc;
      border-radius: 0 0 12px 12px;
    }

    /* Edit balance info */
    .edit-balance-info {
      margin-bottom: 14px;
      padding: 10px 14px;
      background: #f0f4ff;
      border-radius: 8px;
      font-size: 13px;
      color: #1f3d6e;
      font-weight: 500;
      border-left: 3px solid #1f3d6e;
    }

    /* Form rows */
    .form-row {
      margin-bottom: 14px;
    }
    .form-row:last-child {
      margin-bottom: 0;
    }
    .form-row label {
      display: block;
      font-weight: 600;
      margin-bottom: 5px;
      font-size: 12px;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    /* Theme form controls */
    .theme-select,
    .theme-datepicker,
    :host ::ng-deep .theme-select,
    :host ::ng-deep .theme-datepicker {
      width: 100% !important;
    }
    :host ::ng-deep .theme-select .ant-select-selector,
    :host ::ng-deep .theme-datepicker .ant-picker {
      border-radius: 8px !important;
      border: 1px solid #e2e5ea !important;
      min-height: 36px !important;
      box-shadow: none !important;
      transition: all 0.2s ease !important;
    }
    :host ::ng-deep .theme-select .ant-select-selector:hover,
    :host ::ng-deep .theme-datepicker .ant-picker:hover {
      border-color: #1f3d6e !important;
    }
    :host ::ng-deep .theme-select.ant-select-focused .ant-select-selector,
    :host ::ng-deep .theme-datepicker.ant-picker-focused .ant-picker {
      border-color: #1f3d6e !important;
      box-shadow: 0 0 0 2px rgba(31,61,110,0.1) !important;
    }
    .theme-input {
      border-radius: 8px !important;
      border: 1px solid #e2e5ea !important;
      padding: 8px 12px !important;
      font-size: 13px !important;
      transition: all 0.2s ease !important;
    }
    .theme-input:hover,
    .theme-input:focus {
      border-color: #1f3d6e !important;
      box-shadow: 0 0 0 2px rgba(31,61,110,0.1) !important;
    }

    /* Input number styling */
    .theme-input-number,
    :host ::ng-deep .theme-input-number {
      width: 100% !important;
    }
    :host ::ng-deep .theme-input-number .ant-input-number {
      border-radius: 8px !important;
      border: 1px solid #e2e5ea !important;
      width: 100% !important;
      transition: all 0.2s ease !important;
    }
    :host ::ng-deep .theme-input-number .ant-input-number:hover {
      border-color: #1f3d6e !important;
    }
    :host ::ng-deep .theme-input-number .ant-input-number-focused {
      border-color: #1f3d6e !important;
      box-shadow: 0 0 0 2px rgba(31,61,110,0.1) !important;
    }
    :host ::ng-deep .theme-input-number .ant-input-number-input {
      height: 34px !important;
      font-size: 13px !important;
    }
    :host ::ng-deep .theme-input-number .ant-input-number-handler-wrap {
      border-radius: 0 8px 8px 0 !important;
    }

    /* ===== BUTTONS ===== */
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
    .btn-cancel {
      height: 34px !important;
      padding: 0 18px !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      border-radius: 8px !important;
      border: 1px solid #e2e5ea !important;
      background: #fff !important;
      color: #6c757d !important;
      transition: all 0.2s ease !important;
    }
    .btn-cancel:hover {
      border-color: #d1d5db !important;
      background: #f9fafb !important;
      color: #374151 !important;
    }

    /* ===== SCROLLBAR ===== */
    :host ::ng-deep .ant-tabs-tabpane::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    :host ::ng-deep .ant-tabs-tabpane::-webkit-scrollbar-track {
      background: #f1f3f5;
      border-radius: 3px;
    }
    :host ::ng-deep .ant-tabs-tabpane::-webkit-scrollbar-thumb {
      background: #c4c9d4;
      border-radius: 10px;
    }
    :host ::ng-deep .ant-tabs-tabpane::-webkit-scrollbar-thumb:hover {
      background: #a0a8b7;
    }
    .modal-body::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    .modal-body::-webkit-scrollbar-track {
      background: #f1f3f5;
      border-radius: 3px;
    }
    .modal-body::-webkit-scrollbar-thumb {
      background: #c4c9d4;
      border-radius: 10px;
    }
    .modal-body::-webkit-scrollbar-thumb:hover {
      background: #a0a8b7;
    }

    /* ===== SELECT DROPDOWN THEME ===== */
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

    /* ===== PICKER DROPDOWN ===== */
    :host ::ng-deep .ant-picker-dropdown {
      border-radius: 8px !important;
    }
    :host ::ng-deep .ant-picker-cell-in-view.ant-picker-cell-selected .ant-picker-cell-inner {
      background: #1f3d6e !important;
    }
    :host ::ng-deep .ant-picker-cell-in-view.ant-picker-cell-today .ant-picker-cell-inner::before {
      border-color: #1f3d6e !important;
    }
    :host ::ng-deep .ant-picker-today-btn {
      color: #1f3d6e !important;
    }
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
