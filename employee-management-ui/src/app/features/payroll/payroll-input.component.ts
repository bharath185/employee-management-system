import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { PayrollService } from '../../core/services/payroll.service';
import { EmployeeService } from '../../core/services/employee.service';
import { PayrollInput } from '../../core/models/payroll.models';

@Component({
  selector: 'app-payroll-input',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzTableModule, NzButtonModule, NzSelectModule,
    NzIconModule, NzInputNumberModule, NzCardModule, NzSpinModule
  ],
  template: `
    <div class="pi-container">
      <!-- ===== GRADIENT HEADER ===== -->
      <div class="pi-header">
        <div class="pi-header-left">
          <div class="pi-header-icon">
            <i nz-icon nzType="edit"></i>
          </div>
          <div>
            <div class="pi-header-title">Employee Pay Input</div>
            <div class="pi-header-sub">Enter salary components for all employees</div>
          </div>
        </div>
        <button nz-button class="btn-primary-gradient" (click)="saveAll()" [nzLoading]="saving">
          <i nz-icon nzType="save"></i> Save All
        </button>
      </div>

      <!-- ===== CONTROLS CARD ===== -->
      <nz-card class="pi-controls-card" nzSize="small">
        <div class="pi-filters">
          <nz-select [(ngModel)]="selectedYear" (ngModelChange)="loadInputs()" nzPlaceHolder="Year" class="filter-select" style="width:110px">
            <nz-option *ngFor="let y of yearList" [nzValue]="y" [nzLabel]="y.toString()"></nz-option>
          </nz-select>
          <nz-select [(ngModel)]="selectedMonth" (ngModelChange)="loadInputs()" nzPlaceHolder="Month" class="filter-select" style="width:140px">
            <nz-option *ngFor="let m of monthList" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
          </nz-select>
          <span class="pi-count" *ngIf="employees.length > 0">{{ employees.length }} employee(s)</span>
        </div>
      </nz-card>

      <!-- ===== INPUT TABLE ===== -->
      <nz-card class="pi-table-card" nzSize="small">
        <nz-table #inputTable
          [nzData]="employees"
          [nzLoading]="loading"
          [nzPageSize]="50"
          [nzScroll]="{ x: '1400px' }"
          nzBordered nzSize="small"
          class="theme-table">
          <thead>
            <tr>
              <th class="th-sno">#</th>
              <th class="th-code">Emp Code</th>
              <th class="th-name">Name</th>
              <th class="th-desig">Designation</th>
              <th class="th-num">Basic</th>
              <th class="th-num">HRA</th>
              <th class="th-num">FPA</th>
              <th class="th-num">Other</th>
              <th class="th-num">PF</th>
              <th class="th-num">ESI</th>
              <th class="th-num">PT</th>
              <th class="th-num">OT</th>
              <th class="th-num">Bonus</th>
              <th class="th-num">Appraisal</th>
              <th class="th-num">Late Sit.</th>
              <th class="th-worker">Worker</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let emp of inputTable.data; let i = index">
              <td class="td-center">{{ i + 1 }}</td>
              <td><span class="emp-code-text">{{ emp.employeeCode }}</span></td>
              <td class="td-name">{{ emp.employeeName }}</td>
              <td class="td-desig">{{ emp.designation || '-' }}</td>
              <td class="td-num">
                <nz-input-number [(ngModel)]="emp.basic" [nzMin]="0" [nzPrecision]="2" class="num-input" nzSize="small"></nz-input-number>
              </td>
              <td class="td-num">
                <nz-input-number [(ngModel)]="emp.hra" [nzMin]="0" [nzPrecision]="2" class="num-input" nzSize="small"></nz-input-number>
              </td>
              <td class="td-num">
                <nz-input-number [(ngModel)]="emp.fixedPersonalAllowance" [nzMin]="0" [nzPrecision]="2" class="num-input" nzSize="small"></nz-input-number>
              </td>
              <td class="td-num">
                <nz-input-number [(ngModel)]="emp.otherAllowance" [nzMin]="0" [nzPrecision]="2" class="num-input" nzSize="small"></nz-input-number>
              </td>
              <td class="td-num">
                <nz-input-number [(ngModel)]="emp.pfDeduction" [nzMin]="0" [nzPrecision]="2" class="num-input" nzSize="small"></nz-input-number>
              </td>
              <td class="td-num">
                <nz-input-number [(ngModel)]="emp.esiDeduction" [nzMin]="0" [nzPrecision]="2" class="num-input" nzSize="small"></nz-input-number>
              </td>
              <td class="td-num">
                <nz-input-number [(ngModel)]="emp.ptDeduction" [nzMin]="0" [nzPrecision]="2" class="num-input" nzSize="small"></nz-input-number>
              </td>
              <td class="td-num">
                <nz-input-number [(ngModel)]="emp.overtimeWages" [nzMin]="0" [nzPrecision]="2" class="num-input" nzSize="small"></nz-input-number>
              </td>
              <td class="td-num">
                <nz-input-number [(ngModel)]="emp.bonus" [nzMin]="0" [nzPrecision]="2" class="num-input" nzSize="small"></nz-input-number>
              </td>
              <td class="td-num">
                <nz-input-number [(ngModel)]="emp.appraisalAmount" [nzMin]="0" [nzPrecision]="2" class="num-input" nzSize="small"></nz-input-number>
              </td>
              <td class="td-num">
                <nz-input-number [(ngModel)]="emp.lateSittingAmount" [nzMin]="0" [nzPrecision]="2" class="num-input" nzSize="small"></nz-input-number>
              </td>
              <td class="td-center">
                <nz-select [(ngModel)]="emp.workerType" nzSize="small" style="width:100px">
                  <nz-option nzValue="Permanent" nzLabel="Permanent"></nz-option>
                  <nz-option nzValue="Casual" nzLabel="Casual"></nz-option>
                  <nz-option nzValue="Contract" nzLabel="Contract"></nz-option>
                </nz-select>
              </td>
            </tr>
            <tr *ngIf="employees.length === 0 && !loading">
              <td colspan="16" class="empty-cell">No employees found. Please ensure employees exist with LIVE status.</td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>
  `,
  styles: [`
    .pi-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 12px 16px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }
    .pi-header {
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
    .pi-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .pi-header-icon {
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
    .pi-header-title {
      font-size: 17px;
      font-weight: 700;
      color: #fff;
      letter-spacing: 0.3px;
    }
    .pi-header-sub {
      font-size: 12px;
      color: rgba(255,255,255,0.6);
      font-weight: 400;
      margin-top: 1px;
    }
    .pi-controls-card, .pi-table-card {
      border-radius: 10px !important;
      border: 1px solid #e8eaed !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
      margin-bottom: 14px;
      width: 100% !important;
    }
    :host ::ng-deep .pi-controls-card .ant-card-body {
      padding: 14px 16px !important;
    }
    :host ::ng-deep .pi-table-card .ant-card-body {
      padding: 14px 16px !important;
    }
    .pi-filters {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .pi-count {
      font-size: 12px;
      color: #6c757d;
      font-weight: 500;
      padding: 2px 10px;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e8eaed;
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
      padding: 10px 8px !important;
      border-bottom: 2px solid #1f3d6e !important;
      white-space: nowrap;
    }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th:not(:last-child) {
      border-right: 1px solid #e8ecf1;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr > td {
      padding: 6px 8px !important;
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
      width: 90px !important;
      text-align: center !important;
    }
    .th-name {
      width: 130px !important;
    }
    .th-desig {
      width: 100px !important;
    }
    .th-num {
      width: 80px !important;
      text-align: center !important;
    }
    .th-worker {
      width: 110px !important;
      text-align: center !important;
    }
    .td-center {
      text-align: center !important;
    }
    .td-name {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 130px;
    }
    .td-desig {
      font-size: 11px;
      color: #6c757d;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100px;
    }
    .td-num {
      text-align: center !important;
    }
    .emp-code-text {
      font-weight: 600;
      color: #1f3d6e;
      letter-spacing: 0.3px;
      font-size: 12px;
    }
    .num-input {
      width: 76px !important;
    }
    :host ::ng-deep .num-input .ant-input-number {
      border-radius: 6px !important;
      border-color: #e2e5ea !important;
      width: 100% !important;
    }
    :host ::ng-deep .num-input .ant-input-number:hover {
      border-color: #1f3d6e !important;
    }
    :host ::ng-deep .num-input .ant-input-number-focused {
      border-color: #1f3d6e !important;
      box-shadow: 0 0 0 2px rgba(31,61,110,0.1) !important;
    }
    :host ::ng-deep .num-input .ant-input-number-input {
      height: 28px !important;
      font-size: 12px !important;
      text-align: right !important;
    }
    :host ::ng-deep .num-input .ant-input-number-handler-wrap {
      border-radius: 0 6px 6px 0 !important;
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
export class PayrollInputComponent implements OnInit {
  loading = false;
  saving = false;
  selectedYear: number;
  selectedMonth: number;
  employees: any[] = [];

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
    private employeeService: EmployeeService,
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
    this.loadInputs();
  }

  loadInputs(): void {
    this.loading = true;
    // Load LIVE employees first
    this.employeeService.getEmployees({ size: 200, employeeStatus: 'LIVE' }).subscribe({
      next: (res) => {
        const empList = res.data?.content || [];
        this.employees = empList.map((e: any) => ({
          employeeId: e.id,
          employeeCode: e.employeeCode,
          employeeName: `${e.firstName} ${e.surname}`,
          designation: e.designation || '',
          basic: 0,
          hra: 0,
          fixedPersonalAllowance: 0,
          otherAllowance: 0,
          pfDeduction: 0,
          esiDeduction: 0,
          ptDeduction: 0,
          overtimeWages: 0,
          bonus: 0,
          appraisalAmount: 0,
          lateSittingAmount: 0,
          workerType: e.workerType || 'Permanent',
          workingHoursPerDay: 8
        }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.msg.error('Failed to load employees');
      }
    });
  }

  saveAll(): void {
    const inputs: PayrollInput[] = this.employees.map(e => ({
      employeeId: e.employeeId,
      employeeCode: e.employeeCode,
      employeeName: e.employeeName,
      basic: e.basic || 0,
      hra: e.hra || 0,
      fixedPersonalAllowance: e.fixedPersonalAllowance || 0,
      otherAllowance: e.otherAllowance || 0,
      pfDeduction: e.pfDeduction || 0,
      esiDeduction: e.esiDeduction || 0,
      ptDeduction: e.ptDeduction || 0,
      overtimeWages: e.overtimeWages || 0,
      bonus: e.bonus || 0,
      appraisalAmount: e.appraisalAmount || 0,
      lateSittingAmount: e.lateSittingAmount || 0,
      workerType: e.workerType || 'Permanent',
      workingHoursPerDay: e.workingHoursPerDay || 8
    }));

    this.saving = true;
    this.payrollService.batchUpsertInputs(inputs).subscribe({
      next: (res) => {
        if (res.success) {
          this.msg.success(`Saved ${inputs.length} employee input(s) successfully`);
        }
        this.saving = false;
      },
      error: (err) => {
        this.msg.error(err.error?.message || 'Failed to save inputs');
        this.saving = false;
      }
    });
  }
}
