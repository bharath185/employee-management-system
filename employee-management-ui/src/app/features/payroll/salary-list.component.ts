import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { SalaryService } from '../../core/services/salary.service';
import { EmployeeService } from '../../core/services/employee.service';
import { AuthService } from '../../core/services/auth.service';
import { Salary } from '../../core/models/payroll.models';

@Component({
  selector: 'app-salary-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzTableModule, NzButtonModule, NzSelectModule,
    NzIconModule, NzPopconfirmModule, NzInputModule,
    NzInputNumberModule, NzCardModule, NzSpinModule, NzTagModule
  ],
  template: `
    <div class="salary-container page-enter">
      <!-- ===== GRADIENT HEADER ===== -->
      <div class="sal-header">
        <div class="sal-header-left">
          <div class="sal-header-icon">
            <i nz-icon nzType="dollar"></i>
          </div>
          <div>
            <div class="sal-header-title">Salary Management</div>
            <div class="sal-header-sub">Manage employee salary records</div>
          </div>
        </div>
        <button nz-button class="sal-header-btn" (click)="showAddModal()" *ngIf="authService.canManageSalary()">
          <i nz-icon nzType="plus"></i> Add Salary
        </button>
      </div>

      <!-- ===== CARD ===== -->
      <nz-card class="salary-card" nzSize="small">
        <!-- Filters -->
        <div class="sal-filters">
          <nz-select [(ngModel)]="selectedYear" (ngModelChange)="loadSalaries()" nzPlaceHolder="Year" class="filter-select" style="width:110px">
            <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
          </nz-select>
          <nz-select [(ngModel)]="selectedMonth" (ngModelChange)="loadSalaries()" nzPlaceHolder="Month" class="filter-select" style="width:140px">
            <nz-option *ngFor="let m of months" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
          </nz-select>
          <div class="sal-stats" *ngIf="stats">
            <span class="stat-item">
              <span class="stat-label">Total</span>
              <span class="stat-value">{{ stats.totalEmployees }}</span>
            </span>
            <span class="stat-divider"></span>
            <span class="stat-item">
              <span class="stat-label">Gross</span>
              <span class="stat-value stat-currency">&#8377;{{ stats.totalGross | number:'1.2-2' }}</span>
            </span>
            <span class="stat-divider"></span>
            <span class="stat-item">
              <span class="stat-label">Net</span>
              <span class="stat-value stat-currency stat-net">&#8377;{{ stats.totalNet | number:'1.2-2' }}</span>
            </span>
          </div>
        </div>

        <!-- Salary Table -->
        <nz-table #salaryTable [nzData]="salaries" [nzLoading]="loading" [nzPageSize]="50" class="theme-table" nzSize="small">
          <thead>
            <tr>
              <th class="th-sno">#</th>
              <th>Emp Code</th>
              <th>Name</th>
              <th>Designation</th>
              <th class="td-right">Basic</th>
              <th class="td-right">HRA</th>
              <th class="td-right">FPA</th>
              <th class="td-right">Other</th>
              <th class="td-right">Gross</th>
              <th class="td-right">PF</th>
              <th class="td-right">ESI</th>
              <th class="td-right">PT</th>
              <th class="td-right">OT</th>
              <th class="td-right">Net Pay</th>
              <th>Worker</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of salaryTable.data; let i = index">
              <td class="td-center">{{ i + 1 }}</td>
              <td><span class="emp-code-text">{{ s.employeeCode }}</span></td>
              <td>{{ s.employeeName }}</td>
              <td><span class="designation-text">{{ s.designation }}</span></td>
              <td class="td-right">{{ s.basic | number:'1.2-2' }}</td>
              <td class="td-right">{{ s.hra | number:'1.2-2' }}</td>
              <td class="td-right">{{ s.fixedPersonalAllowance | number:'1.2-2' }}</td>
              <td class="td-right">{{ s.otherAllowance | number:'1.2-2' }}</td>
              <td class="td-right"><span class="gross-amount">{{ s.grossSalary | number:'1.2-2' }}</span></td>
              <td class="td-right">{{ s.pfDeduction | number:'1.2-2' }}</td>
              <td class="td-right">{{ s.esiDeduction | number:'1.2-2' }}</td>
              <td class="td-right">{{ s.ptDeduction | number:'1.2-2' }}</td>
              <td class="td-right">{{ s.overtimeWages | number:'1.2-2' }}</td>
              <td class="td-right"><span class="net-amount">{{ s.netPay | number:'1.2-2' }}</span></td>
              <td><nz-tag class="worker-tag" [nzColor]="s.workerType === 'Permanent' ? 'blue' : s.workerType === 'Contract' ? 'purple' : 'orange'">{{ s.workerType }}</nz-tag></td>
              <td class="td-actions">
                <button nz-button nzType="link" nzSize="small" class="action-btn action-edit" (click)="editSalary(s)" *ngIf="authService.canManageSalary()" nz-tooltip="Edit Salary">
                  <i nz-icon nzType="edit"></i>
                </button>
                <nz-popconfirm nzTitle="Delete this salary record?" (nzOnConfirm)="deleteSalary(s.id)">
                  <button nz-button nzType="link" nzSize="small" class="action-btn action-delete" *ngIf="authService.canDeleteSalary()" nz-tooltip="Delete">
                    <i nz-icon nzType="delete"></i>
                  </button>
                </nz-popconfirm>
              </td>
            </tr>
            <tr *ngIf="salaries.length === 0 && !loading">
              <td colspan="16" class="empty-cell">No salary records found for the selected period</td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>

      <!-- ===== ADD/EDIT SALARY MODAL (custom overlay) ===== -->
      <div class="modal-overlay" *ngIf="modalVisible" (click)="modalVisible = false">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-header-left">
              <div class="modal-header-icon"><i nz-icon nzType="dollar"></i></div>
              <span>{{ editingId ? 'Edit Salary' : 'Add Salary' }}</span>
            </div>
            <button class="modal-close" (click)="modalVisible = false">&times;</button>
          </div>
          <div class="modal-body">
            <!-- Two-column grid for form fields -->
            <div class="form-grid">
              <div class="form-row">
                <label>Employee</label>
                <nz-select [(ngModel)]="form.employeeId" nzPlaceHolder="Select Employee" name="employeeId" [nzDisabled]="!!editingId" class="theme-select">
                  <nz-option *ngFor="let e of employees" [nzValue]="e.id" [nzLabel]="e.employeeCode + ' - ' + e.firstName + ' ' + e.surname"></nz-option>
                </nz-select>
              </div>
              <div class="form-row">
                <label>Worker Type</label>
                <nz-select [(ngModel)]="form.workerType" name="workerType" class="theme-select">
                  <nz-option nzValue="Permanent" nzLabel="Permanent"></nz-option>
                  <nz-option nzValue="Casual" nzLabel="Casual"></nz-option>
                  <nz-option nzValue="Contract" nzLabel="Contract"></nz-option>
                </nz-select>
              </div>
              <div class="form-row">
                <label>Year</label>
                <nz-input-number [(ngModel)]="form.wageYear" name="wageYear" [nzMin]="2020" [nzMax]="2030" class="theme-input-number"></nz-input-number>
              </div>
              <div class="form-row">
                <label>Month</label>
                <nz-select [(ngModel)]="form.wageMonth" name="wageMonth" class="theme-select">
                  <nz-option *ngFor="let m of months" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
                </nz-select>
              </div>
            </div>

            <div class="form-section-divider">
              <span>Earnings</span>
            </div>
            <div class="form-grid">
              <div class="form-row">
                <label>Basic</label>
                <nz-input-number [(ngModel)]="form.basic" name="basic" [nzMin]="0" [nzPrecision]="2" class="theme-input-number"></nz-input-number>
              </div>
              <div class="form-row">
                <label>HRA</label>
                <nz-input-number [(ngModel)]="form.hra" name="hra" [nzMin]="0" [nzPrecision]="2" class="theme-input-number"></nz-input-number>
              </div>
              <div class="form-row">
                <label>Fixed Personal Allowance</label>
                <nz-input-number [(ngModel)]="form.fixedPersonalAllowance" name="fixedPersonalAllowance" [nzMin]="0" [nzPrecision]="2" class="theme-input-number"></nz-input-number>
              </div>
              <div class="form-row">
                <label>Other Allowance</label>
                <nz-input-number [(ngModel)]="form.otherAllowance" name="otherAllowance" [nzMin]="0" [nzPrecision]="2" class="theme-input-number"></nz-input-number>
              </div>
            </div>

            <div class="form-section-divider">
              <span>Deductions</span>
            </div>
            <div class="form-grid">
              <div class="form-row">
                <label>PF Deduction</label>
                <nz-input-number [(ngModel)]="form.pfDeduction" name="pfDeduction" [nzMin]="0" [nzPrecision]="2" class="theme-input-number"></nz-input-number>
              </div>
              <div class="form-row">
                <label>ESI Deduction</label>
                <nz-input-number [(ngModel)]="form.esiDeduction" name="esiDeduction" [nzMin]="0" [nzPrecision]="2" class="theme-input-number"></nz-input-number>
              </div>
              <div class="form-row">
                <label>PT Deduction</label>
                <nz-input-number [(ngModel)]="form.ptDeduction" name="ptDeduction" [nzMin]="0" [nzPrecision]="2" class="theme-input-number"></nz-input-number>
              </div>
              <div class="form-row">
                <label>Overtime Wages</label>
                <nz-input-number [(ngModel)]="form.overtimeWages" name="overtimeWages" [nzMin]="0" [nzPrecision]="2" class="theme-input-number"></nz-input-number>
              </div>
            </div>

            <div class="form-section-divider">
              <span>Settings</span>
            </div>
            <div class="form-grid">
              <div class="form-row">
                <label>Working Hours/Day</label>
                <nz-input-number [(ngModel)]="form.workingHoursPerDay" name="workingHoursPerDay" [nzMin]="1" [nzMax]="12" class="theme-input-number"></nz-input-number>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button nz-button class="btn-cancel" (click)="modalVisible = false">Cancel</button>
            <button nz-button class="btn-primary-gradient" [nzLoading]="saving" (click)="saveSalary()">Save</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ===== CONTAINER ===== */
    .salary-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 12px 16px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }

    /* ===== GRADIENT HEADER ===== */
    .sal-header {
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
    .sal-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .sal-header-icon {
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
    .sal-header-title {
      font-size: 17px;
      font-weight: 700;
      color: #fff;
      letter-spacing: 0.3px;
    }
    .sal-header-sub {
      font-size: 12px;
      color: rgba(255,255,255,0.6);
      font-weight: 400;
      margin-top: 1px;
    }
    .sal-header-btn {
      height: 34px !important;
      padding: 0 18px !important;
      font-size: 13px !important;
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
    .sal-header-btn:hover {
      background: rgba(255,255,255,0.28) !important;
      transform: translateY(-1px);
    }
    .sal-header-btn i {
      font-size: 15px;
    }

    /* ===== SALARY CARD ===== */
    .salary-card {
      border-radius: 10px !important;
      border: 1px solid #e8eaed !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
      width: 100% !important;
    }
    :host ::ng-deep .salary-card .ant-card-body {
      padding: 14px 16px !important;
    }

    /* ===== FILTERS ===== */
    .sal-filters {
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

    /* ===== STATS ===== */
    .sal-stats {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-left: auto;
      padding: 6px 14px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e8eaed;
    }
    .stat-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .stat-label {
      font-size: 11px;
      font-weight: 600;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .stat-value {
      font-size: 13px;
      font-weight: 700;
      color: #374151;
    }
    .stat-currency {
      font-family: 'Courier New', monospace;
    }
    .stat-net {
      color: #059669;
    }
    .stat-divider {
      width: 1px;
      height: 20px;
      background: #e2e5ea;
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

    /* Table cell helpers */
    .th-sno {
      width: 42px !important;
      text-align: center !important;
    }
    .th-actions {
      text-align: center !important;
      width: 90px;
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
      white-space: nowrap;
    }
    .emp-code-text {
      font-weight: 600;
      color: #1f3d6e;
      letter-spacing: 0.3px;
      font-size: 12px;
    }
    .designation-text {
      color: #6c757d;
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
    .worker-tag {
      font-size: 10px !important;
      font-weight: 600 !important;
      padding: 0 6px !important;
      line-height: 18px !important;
      border-radius: 3px !important;
    }
    .empty-cell {
      text-align: center !important;
      padding: 28px !important;
      color: #9ca3af !important;
      font-size: 13px;
      font-style: italic;
    }

    /* Action buttons */
    .action-btn {
      padding: 0 4px !important;
      font-size: 15px !important;
      transition: all 0.2s ease !important;
    }
    .action-edit {
      color: #1f3d6e !important;
    }
    .action-edit:hover {
      color: #16213e !important;
      transform: scale(1.15);
    }
    .action-delete {
      color: #ef4444 !important;
    }
    .action-delete:hover {
      color: #dc2626 !important;
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
      width: 680px;
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
      padding: 18px 20px;
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

    /* Form grid */
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 20px;
    }

    /* Form section divider */
    .form-section-divider {
      margin: 16px 0 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .form-section-divider::before,
    .form-section-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #e8eaed;
    }
    .form-section-divider span {
      font-size: 11px;
      font-weight: 700;
      color: #1f3d6e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }

    /* Form rows */
    .form-row {
      margin-bottom: 6px;
    }
    .form-row label {
      display: block;
      font-weight: 600;
      margin-bottom: 4px;
      font-size: 11px;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    /* Theme form controls */
    .theme-select,
    :host ::ng-deep .theme-select {
      width: 100% !important;
    }
    :host ::ng-deep .theme-select .ant-select-selector {
      border-radius: 8px !important;
      border: 1px solid #e2e5ea !important;
      min-height: 34px !important;
      box-shadow: none !important;
      transition: all 0.2s ease !important;
    }
    :host ::ng-deep .theme-select .ant-select-selector:hover {
      border-color: #1f3d6e !important;
    }
    :host ::ng-deep .theme-select.ant-select-focused .ant-select-selector {
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
      height: 32px !important;
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

    /* ===== POPCONFIRM THEME ===== */
    :host ::ng-deep .ant-popconfirm-buttons .ant-btn-primary {
      background: linear-gradient(135deg, #4361ee, #3a0ca3) !important;
      border: none !important;
      border-radius: 6px !important;
      font-size: 12px !important;
    }
  `]
})
export class SalaryListComponent implements OnInit {
  salaries: Salary[] = [];
  employees: any[] = [];
  loading = false;
  saving = false;
  modalVisible = false;
  editingId: number | null = null;
  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;
  stats: any = null;

  years: number[] = [];
  months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  form: any = {
    employeeId: null, wageYear: this.selectedYear, wageMonth: this.selectedMonth,
    basic: 0, hra: 0, fixedPersonalAllowance: 0, otherAllowance: 0,
    pfDeduction: 0, esiDeduction: 0, ptDeduction: 0, overtimeWages: 0,
    workingHoursPerDay: 8, weeklyOff: 'Allowed', workerType: 'Permanent'
  };

  constructor(
    private salaryService: SalaryService,
    private employeeService: EmployeeService,
    public authService: AuthService,
    private msg: NzMessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    this.loadEmployees();
    this.loadSalaries();
  }

  loadEmployees(): void {
    this.employeeService.getEmployees({ size: 200, employeeStatus: 'LIVE' }).subscribe({
      next: (res) => {
        if (res.success && res.data) this.employees = res.data.content || [];
      }
    });
  }

  loadSalaries(): void {
    this.loading = true;
    this.salaryService.getSalaries({ year: this.selectedYear, month: this.selectedMonth }).subscribe({
      next: (res) => {
        this.salaries = res.data || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
    this.salaryService.getSalaryStats(this.selectedYear, this.selectedMonth).subscribe({
      next: (res) => { this.stats = res.data; }
    });
  }

  showAddModal(): void {
    this.editingId = null;
    this.form = {
      employeeId: null, wageYear: this.selectedYear, wageMonth: this.selectedMonth,
      basic: 0, hra: 0, fixedPersonalAllowance: 0, otherAllowance: 0,
      pfDeduction: 0, esiDeduction: 0, ptDeduction: 0, overtimeWages: 0,
      workingHoursPerDay: 8, weeklyOff: 'Allowed', workerType: 'Permanent'
    };
    this.modalVisible = true;
  }

  editSalary(salary: Salary): void {
    this.editingId = salary.id!;
    this.form = { ...salary };
    this.modalVisible = true;
  }

  saveSalary(): void {
    this.saving = true;
    if (this.editingId) {
      this.salaryService.updateSalary(this.editingId, this.form).subscribe({
        next: (res) => {
          this.msg.success('Salary updated');
          this.modalVisible = false;
          this.loadSalaries();
          this.saving = false;
        },
        error: () => { this.saving = false; }
      });
    } else {
      this.salaryService.createSalary(this.form).subscribe({
        next: (res) => {
          this.msg.success('Salary created');
          this.modalVisible = false;
          this.loadSalaries();
          this.saving = false;
        },
        error: () => { this.saving = false; }
      });
    }
  }

  deleteSalary(id: number): void {
    this.salaryService.deleteSalary(id).subscribe({
      next: () => {
        this.msg.success('Salary deleted');
        this.loadSalaries();
      }
    });
  }
}
