import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
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
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

import { LeaveService } from '../../core/services/leave.service';
import { EmployeeService } from '../../core/services/employee.service';
import { AuthService } from '../../core/services/auth.service';
import { HolidayService } from '../../core/services/holiday.service';
import { CompOffService } from '../../core/services/comp-off.service';
import { HolidayListComponent } from './holiday-list.component';
import { CompOffTrackingComponent } from './comp-off-tracking.component';
import { EncashmentComponent } from './encashment.component';
import { LeaveType, LeaveBalance, LeaveApplication } from '../../core/models/payroll.models';
import { DateFormatPipe } from '../../shared/pipes/date-format.pipe';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-leave-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzTableModule, NzButtonModule, NzSelectModule,
    NzIconModule, NzInputModule, NzInputNumberModule, NzDatePickerModule,
    NzTabsModule, NzCardModule, NzTagModule, NzPopconfirmModule, NzSpinModule,
    NzToolTipModule, NzModalModule,
    HolidayListComponent, CompOffTrackingComponent, EncashmentComponent,
    DateFormatPipe
  ],
  template: `
    <div class="leave-container page-enter">

      <!-- ===== TABS ===== -->
      <nz-tabset class="employee-tabs">
        <nz-tab nzTitle="Applications">
          <div class="leave-card">
            <div class="tab-filters">
              <nz-select [(ngModel)]="statusFilter" (ngModelChange)="onStatusFilterChange()" nzPlaceHolder="Filter by status" class="filter-select">
                <nz-option nzValue="" nzLabel="All Statuses"></nz-option>
                <nz-option nzValue="PENDING" nzLabel="Pending"></nz-option>
                <nz-option nzValue="APPROVED" nzLabel="Approved"></nz-option>
                <nz-option nzValue="REJECTED" nzLabel="Rejected"></nz-option>
              </nz-select>
              <button nz-button class="apply-leave-btn" (click)="showApplyModal()">
                <i nz-icon nzType="plus"></i> Apply Leave
              </button>
            </div>

            <nz-table #appTable [nzData]="applications" [nzLoading]="loadingApps" class="theme-table" nzSize="small"
              [nzFrontPagination]="false"
              [nzShowPagination]="appTotal > appSize"
              [nzPageIndex]="appPage + 1"
              [nzPageSize]="appSize"
              [nzTotal]="appTotal"
              (nzPageIndexChange)="onAppPageChange($event)"
              (nzPageSizeChange)="onAppPageSizeChange($event)"
              [nzHideOnSinglePage]="true">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Return</th>
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
                  <td>{{ app.fromDate | dateFormat }}</td>
                  <td>{{ app.toDate | dateFormat }}</td>
                  <td class="td-center return-cell">{{ returnDay(app.toDate) }}<span *ngIf="returnBadge(app.toDate)" class="ret-badge holiday-badge" style="margin-left:3px;font-size:9px">{{ returnBadge(app.toDate) }}</span></td>
                  <td class="td-center"><span class="days-badge">{{ app.days }}</span></td>
                  <td><span class="reason-text">{{ app.reason }}</span></td>
                  <td>
                    <nz-tag [nzColor]="app.status === 'APPROVED' ? 'green' : app.status === 'REJECTED' ? 'red' : 'orange'" class="status-tag">
                      {{ app.status }}
                    </nz-tag>
                  </td>
                  <td class="td-actions">
                    <ng-container *ngIf="app.status === 'PENDING' && authService.canManageStaff()">
                      <button nz-button nzType="link" nzSize="small" class="action-btn action-approve" (click)="approve(app.id)" nz-tooltip="Approve & Deduct Balance">
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
                  <td colspan="9" class="empty-cell">No leave applications found</td>
                </tr>
              </tbody>
            </nz-table>
          </div>
        </nz-tab>

        <nz-tab nzTitle="Leave Balances">
          <div class="leave-card">
            <div class="tab-filters">
              <nz-select [(ngModel)]="balanceYear" (ngModelChange)="loadBalances()" class="filter-select" style="width:110px">
                <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
              </nz-select>
              <nz-select [(ngModel)]="balanceEmployeeId" (ngModelChange)="loadBalances()" class="filter-select" nzPlaceHolder="All Employees" style="width:240px" nzShowSearch nzAllowClear>
                <nz-option [nzValue]="null" nzLabel="All Employees"></nz-option>
                <nz-option *ngFor="let e of employees" [nzValue]="e.id" [nzLabel]="e.employeeCode + ' - ' + (e.prefix ? e.prefix + '. ' : '') + (e.firstName || '') + (e.middleName ? ' ' + e.middleName : '') + (e.surname ? ' ' + e.surname : '')"></nz-option>
              </nz-select>
              <nz-input-group [nzPrefix]="searchBalIcon" style="width:200px">
                <input nz-input [(ngModel)]="balanceSearchText" (ngModelChange)="applyBalanceFilter()" placeholder="Search code / name..." />
              </nz-input-group>
              <ng-template #searchBalIcon><i nz-icon nzType="search"></i></ng-template>
              
              <button nz-button [class.btn-danger-active]="showOnlyLop" class="filter-action-btn" (click)="toggleShowOnlyLop()" nz-tooltip="Filter Loss of Pay (LOP) Employees">
                <i nz-icon nzType="warning" style="color:#ef4444;"></i>
                <span [style.color]="showOnlyLop ? '#ef4444' : 'inherit'">LOP Only ({{ lopCount }})</span>
              </button>

              <button nz-button class="filter-action-btn" (click)="fileInput.click()" [nzLoading]="uploading"
                      *ngIf="authService.canManageStaff()" nz-tooltip="Upload Excel file and sync to database">
                <i nz-icon nzType="upload"></i> Upload Excel
              </button>
              <input #fileInput type="file" accept=".xlsx" (change)="onFileSelected($event)" style="display:none">
              <button nz-button class="filter-action-btn" (click)="exportToExcel()" [nzLoading]="exporting"
                      *ngIf="authService.canManageStaff()" nz-tooltip="Download Excel with current data">
                <i nz-icon nzType="download"></i> Download Excel
              </button>
              <button nz-button class="filter-action-btn" (click)="downloadSample()" [nzLoading]="sampling"
                      *ngIf="authService.canManageStaff()" nz-tooltip="Download sample Excel file">
                <i nz-icon nzType="file"></i> Sample
              </button>
            </div>

            <!-- LOP Summary Warning Banner -->
            <div *ngIf="lopCount > 0" style="margin-bottom:12px; padding:10px 14px; background:#fff2f0; border:1px solid #ffccc7; border-radius:8px; display:flex; align-items:center; justify-content:space-between;">
              <span style="color:#cf1322; font-weight:600; font-size:13px;">
                <i nz-icon nzType="warning"></i> Attention HR: <strong>{{ lopCount }} Employee Record(s)</strong> currently have <strong>Loss of Pay (LOP)</strong> totaling {{ totalLopDays }} day(s).
              </span>
              <button nz-button nzSize="small" nzType="primary" nzDanger (click)="toggleShowOnlyLop()">
                {{ showOnlyLop ? 'Show All Balances' : 'View LOP Records' }}
              </button>
            </div>

            <nz-table #balTable [nzData]="filteredBalances" [nzLoading]="loadingBals" class="theme-table" nzSize="small"
                      [(nzPageIndex)]="balPageIndex" [(nzPageSize)]="balPageSize"
                      [nzPageSizeOptions]="[10, 20, 50, 100]" [nzShowSizeChanger]="true" [nzShowPagination]="true">
              <thead>
                <tr>
                  <th>Employee Code</th>
                  <th>Name</th>
                  <th>Leave Type</th>
                  <th class="td-center">Entitled</th>
                  <th class="td-center">Taken</th>
                  <th class="td-center">Encashed</th>
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
                  <td class="td-center">{{ b.encashed || 0 }}</td>
                  <td class="td-center">
                    <nz-tag nzColor="error" *ngIf="b.balance < 0" style="font-weight:700;">
                      <i nz-icon nzType="warning"></i> LOP ({{ mathAbs(b.balance) }})
                    </nz-tag>
                    <span *ngIf="b.balance >= 0" class="balance-badge" [class.balance-low]="b.balance <= 2">{{ b.balance }}</span>
                  </td>
                  <td class="td-actions">
                    <button nz-button nzType="link" nzSize="small" class="action-btn action-edit" (click)="editBalance(b)" *ngIf="authService.canManageStaff()" nz-tooltip="Edit Balance">
                      <i nz-icon nzType="edit"></i>
                    </button>
                    <span *ngIf="!authService.canManageStaff()" class="text-muted">—</span>
                  </td>
                </tr>
                <tr *ngIf="filteredBalances.length === 0 && !loadingBals">
                  <td colspan="8" class="empty-cell">No balances found</td>
                </tr>
              </tbody>
            </nz-table>
          </div>
        </nz-tab>

        <nz-tab nzTitle="Holiday List">
          <div class="leave-card">
            <app-holiday-list></app-holiday-list>
          </div>
        </nz-tab>

        <nz-tab nzTitle="Comp Off Tracking">
          <div class="leave-card">
            <app-comp-off-tracking></app-comp-off-tracking>
          </div>
        </nz-tab>

        <nz-tab nzTitle="Leave Encashment">
          <div class="leave-card">
            <app-encashment></app-encashment>
          </div>
        </nz-tab>

        <nz-tab nzTitle="Leave Priority Settings">
          <div class="leave-card">
            <div class="priority-banner">
              <i nz-icon nzType="info-circle" class="banner-icon"></i>
              <div>
                <div class="banner-title">Auto Leave Deduction Priority Rules</div>
                <div class="banner-sub">
                  When attendance status is set to <strong>L (Leave)</strong>, a pending leave application is automatically generated.
                  Upon HR approval, the leave days are deducted from the employee's available leave balance according to the <strong>Priority Order</strong> set below (Priority 1 is considered first, e.g. CL → Comp-Off → PL → SL).
                </div>
              </div>
            </div>

            <nz-table #priorityTable [nzData]="leaveTypes" class="theme-table" nzSize="small">
              <thead>
                <tr>
                  <th class="td-center" style="width:120px">Priority Order</th>
                  <th>Leave Type Code</th>
                  <th>Description</th>
                  <th class="td-center" style="width:140px">Annual Entitlement</th>
                  <th class="td-center" style="width:130px">Carry Forward</th>
                  <th class="td-center" style="width:120px">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let lt of priorityTable.data">
                  <td class="td-center">
                    <span class="priority-badge">#{{ lt.priority || 1 }}</span>
                  </td>
                  <td><strong>{{ lt.name }}</strong></td>
                  <td>{{ lt.description }}</td>
                  <td class="td-center">{{ lt.name === 'CO' ? 'N/A (Comp Off)' : (lt.annualEntitlement + ' days') }}</td>
                  <td class="td-center">{{ lt.isCarryForward ? 'Yes' : 'No' }}</td>
                  <td class="td-center">
                    <button nz-button nzType="link" nzSize="small" class="action-btn action-edit" (click)="editLeaveTypePriority(lt)" *ngIf="authService.canManageStaff()" nz-tooltip="Set Deduction Priority">
                      <i nz-icon nzType="edit"></i> Edit Priority
                    </button>
                  </td>
                </tr>
              </tbody>
            </nz-table>
          </div>
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
              <nz-select [(ngModel)]="applyForm.employeeId" name="employeeId" (ngModelChange)="onEmployeeChanged()" nzPlaceHolder="Select Employee" class="theme-select" nzShowSearch nzAllowClear>
                <nz-option *ngFor="let e of employees" [nzValue]="e.id" [nzLabel]="e.employeeCode + ' - ' + (e.prefix ? e.prefix + '. ' : '') + (e.firstName || '') + (e.middleName ? ' ' + e.middleName : '') + (e.surname ? ' ' + e.surname : '')"></nz-option>
              </nz-select>
            </div>
            <div class="form-row">
              <label>Leave Type</label>
              <nz-select [(ngModel)]="applyForm.leaveTypeId" name="leaveTypeId" nzPlaceHolder="Select Leave Type" class="theme-select">
                <ng-container *ngFor="let lt of leaveTypes">
                  <nz-option *ngIf="lt.name !== 'SL' && (lt.name !== 'CO' || compOffAvailable > 0)" [nzValue]="lt.id" [nzLabel]="lt.name === 'CO' ? 'CO - Comp Off' : lt.name"></nz-option>
                </ng-container>
              </nz-select>
            </div>
            <div class="form-row">
              <label>From Date</label>
              <nz-date-picker [(ngModel)]="applyForm.fromDate" name="fromDate" (ngModelChange)="computeLeaveDays()" class="theme-datepicker"></nz-date-picker>
            </div>
            <div class="form-row">
              <label>To Date</label>
              <nz-date-picker [(ngModel)]="applyForm.toDate" name="toDate" (ngModelChange)="computeLeaveDays()" class="theme-datepicker"></nz-date-picker>
            </div>
            <div class="form-row" *ngIf="leaveDays > 0">
              <label></label>
              <div class="leave-days-info">
                <span class="days-count">{{ leaveDays }} day{{ leaveDays > 1 ? 's' : '' }}</span>
                <span class="return-on">Return on: <strong>{{ returnOnLabel }}</strong><span *ngIf="showReturnBadge" class="ret-badge holiday-badge" style="margin-left:3px">{{ returnBadgeText }}</span></span>
              </div>
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
              <label>Encashed</label>
              <nz-input-number [(ngModel)]="editBalanceData.encashed" name="encashed" [nzMin]="0" [nzMax]="365" class="theme-input-number" [nzDisabled]="true"></nz-input-number>
            </div>
            <div class="form-row">
              <label>Balance</label>
              <nz-input-number [ngModel]="editBalanceData.entitled - editBalanceData.taken - (editBalanceData.encashed || 0)" name="balance" [nzDisabled]="true" class="theme-input-number"></nz-input-number>
            </div>
          </div>
          <div class="modal-footer">
            <button nz-button class="btn-cancel" (click)="editBalanceVisible = false">Cancel</button>
            <button nz-button class="btn-primary-gradient" [nzLoading]="savingBalance" (click)="saveBalance()">Save</button>
          </div>
        </div>
      </div>

      <!-- ===== EDIT PRIORITY MODAL ===== -->
      <div class="modal-overlay" *ngIf="editPriorityVisible" (click)="editPriorityVisible = false">
        <div class="modal-box" style="width:400px" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-header-left">
              <div class="modal-header-icon"><i nz-icon nzType="setting"></i></div>
              <span>Edit Leave Priority ({{ editPriorityData.name }})</span>
            </div>
            <button class="modal-close" (click)="editPriorityVisible = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="edit-balance-info" style="margin-bottom:12px; font-weight:600; color:#1f3d6e;">
              {{ editPriorityData.name }} — {{ editPriorityData.description }}
            </div>
            <div class="form-row">
              <label>Deduction Priority</label>
              <nz-input-number [(ngModel)]="editPriorityData.priority" name="priority" [nzMin]="1" [nzMax]="10" class="theme-input-number"></nz-input-number>
            </div>
            <div class="form-row" *ngIf="editPriorityData.name !== 'CO'">
              <label>Annual Entitlement</label>
              <nz-input-number [(ngModel)]="editPriorityData.annualEntitlement" name="annualEntitlement" [nzMin]="0" [nzMax]="365" class="theme-input-number"></nz-input-number>
            </div>
          </div>
          <div class="modal-footer">
            <button nz-button class="btn-cancel" (click)="editPriorityVisible = false">Cancel</button>
            <button nz-button class="btn-primary-gradient" [nzLoading]="savingPriority" (click)="saveLeaveTypePriority()">Save</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ===== CONTAINER ===== */
    .leave-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 0 16px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }

    /* ===== TABS AS SUB-NAV ===== */
    .employee-tabs {
      display: block;
    }
    :host ::ng-deep .employee-tabs > .ant-tabs-nav {
      margin-bottom: 12px !important;
    }
    :host ::ng-deep .employee-tabs > .ant-tabs-nav .ant-tabs-nav-list {
      background: #f0f4ff;
      border-radius: 10px;
      padding: 4px;
      border: 1px solid #e0e7ff;
      gap: 2px;
    }
    :host ::ng-deep .employee-tabs > .ant-tabs-nav .ant-tabs-tab {
      padding: 6px 16px !important;
      margin: 0 !important;
      border-radius: 8px !important;
      transition: all 0.2s ease !important;
      border: none !important;
      background: transparent;
    }
    :host ::ng-deep .employee-tabs > .ant-tabs-nav .ant-tabs-tab-btn {
      font-size: 13px !important;
      font-weight: 600 !important;
      color: #6c757d !important;
      letter-spacing: 0.2px;
    }
    :host ::ng-deep .employee-tabs > .ant-tabs-nav .ant-tabs-tab:hover .ant-tabs-tab-btn {
      color: #1f3d6e !important;
    }
    :host ::ng-deep .employee-tabs > .ant-tabs-nav .ant-tabs-tab-active {
      background: #ffffff !important;
      box-shadow: 0 2px 8px rgba(31,61,110,0.12) !important;
    }
    :host ::ng-deep .employee-tabs > .ant-tabs-nav .ant-tabs-tab-active .ant-tabs-tab-btn {
      color: #1f3d6e !important;
      font-weight: 700 !important;
    }
    :host ::ng-deep .employee-tabs > .ant-tabs-nav .ant-tabs-ink-bar {
      display: none !important;
    }

    /* Card wrapping each tab content */
    .leave-card {
      background: #ffffff;
      border-radius: 10px;
      border: 1px solid #e8eaed;
      box-shadow: 0 1px 6px rgba(0,0,0,0.04);
      padding: 16px;
    }

    /* Filters inside tabs */
    .tab-filters {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }
    .filter-select {
      width: 140px;
    }
    :host ::ng-deep .filter-select .ant-select-selector {
      border-radius: 8px !important;
      border: 1px solid #e2e5ea !important;
      height: 34px !important;
      padding: 0 8px !important;
      box-shadow: none !important;
    }
    :host ::ng-deep .filter-select .ant-select-selection-item {
      font-size: 13px !important;
      line-height: 32px !important;
    }
    .apply-leave-btn {
      margin-left: auto;
      height: 34px !important;
      padding: 0 16px !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      border: none !important;
      border-radius: 8px !important;
      background: linear-gradient(135deg, #4361ee, #3a0ca3) !important;
      color: #fff !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      box-shadow: 0 2px 8px rgba(67,97,238,0.3) !important;
      transition: all 0.2s ease !important;
    }
    .apply-leave-btn:hover {
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 14px rgba(67,97,238,0.4) !important;
    }

    .filter-action-btn {
      height: 34px !important;
      padding: 0 12px !important;
      font-size: 12.5px !important;
      border-radius: 8px !important;
      border: 1px solid #e2e5ea !important;
      color: #374151 !important;
      background: #fff !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 5px !important;
      transition: all 0.2s ease !important;
    }
    .filter-action-btn:hover {
      border-color: #1f3d6e !important;
      color: #1f3d6e !important;
      background: #f0f4ff !important;
    }
    .filter-action-btn-danger {
      border-color: #fca5a5 !important;
      color: #dc2626 !important;
    }
    .filter-action-btn-danger:hover {
      border-color: #dc2626 !important;
      color: #fff !important;
      background: #dc2626 !important;
    }

    /* Priority Rules Banner */
    .priority-banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 14px;
    }
    .banner-icon { font-size: 20px; color: #2563eb; margin-top: 2px; }
    .banner-title { font-size: 14px; font-weight: 700; color: #1e40af; margin-bottom: 2px; }
    .banner-sub { font-size: 12.5px; color: #1e3a8a; line-height: 1.4; }
    .priority-badge {
      font-size: 12px;
      font-weight: 700;
      color: #1e40af;
      background: #dbeafe;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #93c5fd;
      display: inline-block;
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
    .th-actions, .td-actions {
      text-align: center !important;
      white-space: nowrap;
    }

    .emp-cell {
      font-weight: 600;
      color: #1f3d6e;
    }
    .emp-code-text {
      font-family: 'Courier New', monospace;
      font-weight: 600;
      color: #1f3d6e;
      font-size: 12px;
    }
    .days-badge {
      display: inline-block;
      padding: 1px 8px;
      border-radius: 10px;
      background: #f0f4ff;
      color: #1f3d6e;
      font-weight: 700;
      font-size: 12px;
    }
    .reason-text {
      color: #6c757d;
      font-size: 12px;
      max-width: 200px;
      display: inline-block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .status-tag {
      font-size: 10px !important;
      font-weight: 700 !important;
      padding: 1px 8px !important;
      border-radius: 4px !important;
      letter-spacing: 0.3px;
    }
    .balance-badge {
      font-size: 13px;
      font-weight: 700;
      color: #059669;
    }
    .balance-badge.balance-low {
      color: #dc2626;
    }
    .return-cell {
      font-size: 12px;
      color: #4b5563;
      white-space: nowrap;
    }

    .empty-cell {
      text-align: center !important;
      padding: 24px !important;
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
    }
    .modal-close:hover {
      color: #ef4444;
    }
    .modal-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 12px 20px;
      border-top: 1px solid #e8eaed;
      background: #f8fafc;
      border-radius: 0 0 12px 12px;
    }

    /* Modal form fields */
    .form-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 14px;
    }
    .form-row label {
      font-size: 12.5px;
      font-weight: 600;
      color: #374151;
    }
    .edit-balance-info {
      font-size: 14px;
      font-weight: 700;
      color: #1f3d6e;
      padding: 8px 12px;
      background: #f0f4ff;
      border-radius: 8px;
      margin-bottom: 16px;
      border: 1px solid #e0e7ff;
    }

    .leave-days-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      font-size: 13px;
      margin-top: 4px;
    }
    .leave-days-info .days-count {
      font-weight: 700;
      color: #166534;
    }
    .leave-days-info .return-on {
      color: #4b5563;
    }
    .leave-days-info .return-on strong {
      color: #1e40af;
    }
    .ret-badge {
      display: inline-block;
      margin-left: 6px;
      padding: 1px 7px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .holiday-badge {
      background: #fffbeb;
      color: #d97706;
      border: 1px solid #fde68a;
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
    .theme-input,
    :host ::ng-deep .theme-input {
      border-radius: 8px !important;
      border: 1px solid #e2e5ea !important;
      padding: 8px 12px !important;
      font-size: 13px !important;
      transition: all 0.2s ease !important;
    }
    .theme-input:hover,
    :host ::ng-deep .theme-input:hover {
      border-color: #1f3d6e !important;
    }
    .theme-input:focus,
    :host ::ng-deep .theme-input:focus {
      border-color: #1f3d6e !important;
      box-shadow: 0 0 0 2px rgba(31,61,110,0.1) !important;
    }

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
  uploading = false;
  exporting = false;
  sampling = false;
  clearing = false;
  applyModalVisible = false;
  editBalanceVisible = false;
  savingBalance = false;

  editPriorityVisible = false;
  savingPriority = false;
  editPriorityData: any = { id: 0, name: '', description: '', priority: 1, annualEntitlement: 0 };

  statusFilter = '';
  appPage = 0;
  appSize = 12;
  appTotal = 0;
  holidayDates: Set<string> = new Set();
  compOffAvailable = 0;
  balanceYear = 2026;
  balanceEmployeeId: number | null = null;
  balanceSearchText = '';
  filteredBalances: LeaveBalance[] = [];
  balPageIndex = 1;
  balPageSize = 20;
  years = [2026, 2025, 2024, 2023];

  editBalanceData: any = { id: 0, employeeName: '', leaveTypeName: '', entitled: 0, taken: 0 };

  applyForm: any = {
    employeeId: null, leaveTypeId: null, fromDate: null, toDate: null, reason: ''
  };
  leaveDays = 0;
  returnOnLabel = '';
  showReturnBadge = false;
  returnBadgeText = '';

  showOnlyLop = false;
  lopCount = 0;
  totalLopDays = 0;
  mathAbs = Math.abs;

  constructor(
    private leaveService: LeaveService,
    private employeeService: EmployeeService,
    private holidayService: HolidayService,
    private compOffService: CompOffService,
    public authService: AuthService,
    private msg: NzMessageService,
    private modalService: NzModalService
  ) {}

  ngOnInit(): void {
    this.loadLeaveTypes();
    this.loadEmployees();
    this.loadApplications();
    this.loadBalances();
    this.loadHolidays();
  }

  loadHolidays(): void {
    this.holidayService.getHolidays(new Date().getFullYear()).subscribe({
      next: (res) => {
        this.holidayDates = new Set((res.data || []).map(h => {
          if (typeof h.date === 'string') return h.date.slice(0, 10);
          return h.date;
        }));
      }
    });
  }

  loadLeaveTypes(): void {
    this.leaveService.getLeaveTypes().subscribe({
      next: (res) => {
        this.leaveTypes = res.data || [];
      }
    });
  }

  loadEmployees(): void {
    this.employeeService.getAllEmployees().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.employees = Array.isArray(res.data) ? res.data : (res.data.content || []);
        }
      }
    });
  }

  loadApplications(): void {
    this.loadingApps = true;
    this.leaveService.getApplications({
      status: this.statusFilter || undefined,
      page: this.appPage,
      size: this.appSize
    }).subscribe({
      next: (res) => {
        this.loadingApps = false;
        if (res.success && res.data) {
          this.applications = res.data.content || [];
          this.appTotal = res.data.totalElements || 0;
        }
      },
      error: () => { this.loadingApps = false; }
    });
  }

  onStatusFilterChange(): void {
    this.appPage = 0;
    this.loadApplications();
  }

  onAppPageChange(page: number): void {
    this.appPage = page - 1;
    this.loadApplications();
  }

  onAppPageSizeChange(size: number): void {
    this.appSize = size;
    this.appPage = 0;
    this.loadApplications();
  }

  loadBalances(): void {
    this.loadingBals = true;
    this.leaveService.getLeaveBalances(this.balanceEmployeeId || undefined, this.balanceYear).subscribe({
      next: (res) => {
        this.loadingBals = false;
        if (res.success) {
          this.balances = res.data || [];
          this.applyBalanceFilter();
        }
      },
      error: () => { this.loadingBals = false; }
    });
  }

  applyBalanceFilter(): void {
    let list = [...this.balances];
    this.lopCount = this.balances.filter(b => b.balance < 0).length;
    this.totalLopDays = this.balances.filter(b => b.balance < 0).reduce((sum, b) => sum + Math.abs(b.balance), 0);

    if (this.balanceSearchText && this.balanceSearchText.trim()) {
      const txt = this.balanceSearchText.toLowerCase().trim();
      list = list.filter(b =>
        (b.employeeCode || '').toLowerCase().includes(txt) ||
        (b.employeeName || '').toLowerCase().includes(txt) ||
        (b.leaveTypeName || '').toLowerCase().includes(txt)
      );
    }

    if (this.showOnlyLop) {
      list = list.filter(b => b.balance < 0);
    }
    this.filteredBalances = list;
  }

  toggleShowOnlyLop(): void {
    this.showOnlyLop = !this.showOnlyLop;
    this.applyBalanceFilter();
  }

  showApplyModal(): void {
    this.applyForm = { employeeId: null, leaveTypeId: null, fromDate: null, toDate: null, reason: '' };
    this.leaveDays = 0;
    this.returnOnLabel = '';
    this.showReturnBadge = false;
    this.compOffAvailable = 0;
    this.applyModalVisible = true;
  }

  onEmployeeChanged(): void {
    if (this.applyForm.employeeId) {
      this.compOffService.getAvailableCount(this.applyForm.employeeId).subscribe({
        next: (res: any) => {
          if (res && res.success) {
            this.compOffAvailable = res.data || 0;
          }
        }
      });
    } else {
      this.compOffAvailable = 0;
    }
  }

  getSelectedTypeBalance(): number {
    if (!this.applyForm.employeeId || !this.applyForm.leaveTypeId) return 0;
    const lt = this.leaveTypes.find(t => t.id === this.applyForm.leaveTypeId);
    if (lt && lt.name === 'CO') {
      return this.compOffAvailable;
    }
    const bal = this.balances.find(b => b.employeeId === this.applyForm.employeeId && b.leaveTypeId === this.applyForm.leaveTypeId);
    return bal ? bal.balance : 0;
  }

  computeLeaveDays(): void {
    if (!this.applyForm.fromDate || !this.applyForm.toDate) {
      this.leaveDays = 0;
      this.returnOnLabel = '';
      this.showReturnBadge = false;
      return;
    }
    const from = new Date(this.applyForm.fromDate);
    const to = new Date(this.applyForm.toDate);
    if (from > to) {
      this.leaveDays = 0;
      this.returnOnLabel = '';
      this.showReturnBadge = false;
      return;
    }
    const diffTime = Math.abs(to.getTime() - from.getTime());
    this.leaveDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const retDate = new Date(to);
    retDate.setDate(retDate.getDate() + 1);

    const year = retDate.getFullYear();
    const month = String(retDate.getMonth() + 1).padStart(2, '0');
    const day = String(retDate.getDate()).padStart(2, '0');
    const isoDateStr = `${year}-${month}-${day}`;

    const isSunday = retDate.getDay() === 0;
    const isHoliday = this.holidayDates.has(isoDateStr);

    this.returnOnLabel = retDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    this.showReturnBadge = isSunday || isHoliday;
    this.returnBadgeText = isSunday ? 'Sunday' : isHoliday ? 'Holiday' : '';
  }

  returnDay(toDateStr: string): string {
    if (!toDateStr) return '';
    const to = new Date(toDateStr);
    const ret = new Date(to);
    ret.setDate(ret.getDate() + 1);
    return ret.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  returnBadge(toDateStr: string): string {
    if (!toDateStr) return '';
    const to = new Date(toDateStr);
    const ret = new Date(to);
    ret.setDate(ret.getDate() + 1);
    const year = ret.getFullYear();
    const month = String(ret.getMonth() + 1).padStart(2, '0');
    const day = String(ret.getDate()).padStart(2, '0');
    const isoStr = `${year}-${month}-${day}`;
    if (ret.getDay() === 0) return 'Sun';
    if (this.holidayDates.has(isoStr)) return 'Holiday';
    return '';
  }

  applyLeave(): void {
    if (!this.applyForm.employeeId || !this.applyForm.leaveTypeId || !this.applyForm.fromDate || !this.applyForm.toDate) {
      this.msg.warning('Please fill in all required fields');
      return;
    }

    const avail = this.getSelectedTypeBalance();
    if (avail < (this.leaveDays || 1)) {
      this.modalService.confirm({
        nzTitle: '⚠️ No Leave Available - Process as Loss of Pay (LOP)?',
        nzContent: `The requested leave period (${this.leaveDays} day(s)) exceeds the available leave balance (${avail} day(s)). Submitting this application will process this leave as <strong>Loss of Pay (LOP / Negative Balance)</strong>. Do you want to proceed?`,
        nzOkText: 'Yes, Apply as LOP',
        nzOkDanger: true,
        nzCancelText: 'Cancel',
        nzOnOk: () => {
          this.executeApplyLeave(true);
        }
      });
    } else {
      this.executeApplyLeave(false);
    }
  }

  executeApplyLeave(allowLop: boolean): void {
    this.savingApp = true;
    let reasonText = this.applyForm.reason || '';
    if (allowLop && !reasonText.includes('[ALLOW_LOP]')) {
      reasonText = (reasonText + ' [ALLOW_LOP]').trim();
    }
    const dto = {
      employeeId: this.applyForm.employeeId,
      leaveTypeId: this.applyForm.leaveTypeId,
      fromDate: this.formatDate(this.applyForm.fromDate),
      toDate: this.formatDate(this.applyForm.toDate),
      reason: reasonText
    };
    this.leaveService.applyLeave(dto as any).subscribe({
      next: (res) => {
        this.savingApp = false;
        if (res.success) {
          this.msg.success(allowLop ? 'Leave applied as Loss of Pay (LOP)' : 'Leave application submitted successfully');
          this.applyModalVisible = false;
          this.loadApplications();
          this.loadBalances();
        }
      },
      error: (err) => {
        this.savingApp = false;
        const rawErr = err.error?.message || 'Error submitting leave application';
        if (rawErr.includes('NO_LEAVE_AVAILABLE')) {
          const cleanMsg = rawErr.replace('NO_LEAVE_AVAILABLE:', '').trim();
          this.modalService.error({
            nzTitle: 'No Leave Available!',
            nzContent: cleanMsg
          });
        } else {
          this.msg.error(rawErr);
        }
      }
    });
  }

  approve(id: number): void {
    this.leaveService.approveLeave(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.msg.success('Leave application approved & balance deducted');
          this.loadApplications();
          this.loadBalances();
        }
      },
      error: (err) => this.msg.error(err.error?.message || 'Error approving leave')
    });
  }

  reject(id: number): void {
    this.leaveService.rejectLeave(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.msg.success('Leave application rejected');
          this.loadApplications();
        }
      },
      error: (err) => this.msg.error(err.error?.message || 'Error rejecting leave')
    });
  }

  editBalance(b: LeaveBalance): void {
    this.editBalanceData = {
      id: b.id,
      employeeName: b.employeeName,
      leaveTypeName: b.leaveTypeName,
      entitled: b.entitled,
      taken: b.taken,
      encashed: b.encashed || 0
    };
    this.editBalanceVisible = true;
  }

  saveBalance(): void {
    this.savingBalance = true;
    this.leaveService.updateLeaveBalance(this.editBalanceData.id, {
      entitled: this.editBalanceData.entitled,
      taken: this.editBalanceData.taken
    }).subscribe({
      next: (res) => {
        this.savingBalance = false;
        if (res.success) {
          this.msg.success('Balance updated successfully');
          this.editBalanceVisible = false;
          this.loadBalances();
        }
      },
      error: () => {
        this.savingBalance = false;
        this.msg.error('Error updating balance');
      }
    });
  }

  editLeaveTypePriority(lt: LeaveType): void {
    this.editPriorityData = { ...lt };
    this.editPriorityVisible = true;
  }

  saveLeaveTypePriority(): void {
    if (!this.editPriorityData.id) return;
    this.savingPriority = true;
    this.leaveService.updateLeaveType(this.editPriorityData.id, {
      priority: this.editPriorityData.priority,
      annualEntitlement: this.editPriorityData.annualEntitlement
    }).subscribe({
      next: (res) => {
        this.savingPriority = false;
        this.msg.success('Leave priority updated successfully');
        this.editPriorityVisible = false;
        this.loadLeaveTypes();
      },
      error: () => {
        this.savingPriority = false;
        this.msg.error('Failed to update leave priority');
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.uploading = true;
      this.leaveService.importBalances(file, this.balanceYear).subscribe({
        next: (res) => {
          this.uploading = false;
          if (res.success) {
            this.msg.success('Excel imported successfully');
            this.loadBalances();
          }
        },
        error: () => {
          this.uploading = false;
          this.msg.error('Error importing Excel');
        }
      });
    }
  }

  exportToExcel(): void {
    this.exporting = true;
    this.leaveService.exportBalances(this.balanceYear).subscribe({
      next: (blob) => {
        this.exporting = false;
        saveAs(blob, `leave_balances_${this.balanceYear}.xlsx`);
      },
      error: () => {
        this.exporting = false;
        this.msg.error('Error exporting balances');
      }
    });
  }

  downloadSample(): void {
    this.sampling = true;
    this.leaveService.downloadSampleBalances(this.balanceYear).subscribe({
      next: (blob) => {
        this.sampling = false;
        saveAs(blob, `leave_balances_sample_${this.balanceYear}.xlsx`);
      },
      error: () => {
        this.sampling = false;
        this.msg.error('Error downloading sample');
      }
    });
  }

  clearAllBalances(): void {
    this.clearing = true;
    this.leaveService.clearAllBalances().subscribe({
      next: () => {
        this.clearing = false;
        this.msg.success('All leave balances cleared');
        this.loadBalances();
      },
      error: () => {
        this.clearing = false;
        this.msg.error('Error clearing balances');
      }
    });
  }

  private formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
