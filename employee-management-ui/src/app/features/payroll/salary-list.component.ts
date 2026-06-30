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
    NzInputNumberModule, NzCardModule, NzSpinModule
  ],
  template: `
    <div class="page-header">
      <h2>Salary Management</h2>
      <button nz-button nzType="primary" (click)="showAddModal()" *ngIf="authService.canManageSalary()">
        <i nz-icon nzType="plus"></i> Add Salary
      </button>
    </div>

    <nz-card>
      <div style="display:flex;gap:16px;margin-bottom:16px;align-items:center">
        <nz-select [(ngModel)]="selectedYear" (ngModelChange)="loadSalaries()" style="width:120px" nzPlaceHolder="Year">
          <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
        </nz-select>
        <nz-select [(ngModel)]="selectedMonth" (ngModelChange)="loadSalaries()" style="width:150px" nzPlaceHolder="Month">
          <nz-option *ngFor="let m of months" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
        </nz-select>
        <span style="color:#666" *ngIf="stats">Total: {{stats.totalEmployees}} employees | Gross: &#8377;{{stats.totalGross | number:'1.2-2'}} | Net: &#8377;{{stats.totalNet | number:'1.2-2'}}</span>
      </div>

      <nz-table #salaryTable [nzData]="salaries" [nzLoading]="loading" [nzPageSize]="50">
        <thead>
          <tr>
            <th>Sl.No</th>
            <th>Employee Code</th>
            <th>Name</th>
            <th>Designation</th>
            <th>Basic</th>
            <th>HRA</th>
            <th>FPA</th>
            <th>Other</th>
            <th>Gross</th>
            <th>PF</th>
            <th>ESI</th>
            <th>PT</th>
            <th>OT</th>
            <th>Net Pay</th>
            <th>Worker Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let s of salaryTable.data; let i = index">
            <td>{{ i + 1 }}</td>
            <td>{{ s.employeeCode }}</td>
            <td>{{ s.employeeName }}</td>
            <td>{{ s.designation }}</td>
            <td>{{ s.basic | number:'1.2-2' }}</td>
            <td>{{ s.hra | number:'1.2-2' }}</td>
            <td>{{ s.fixedPersonalAllowance | number:'1.2-2' }}</td>
            <td>{{ s.otherAllowance | number:'1.2-2' }}</td>
            <td><b>{{ s.grossSalary | number:'1.2-2' }}</b></td>
            <td>{{ s.pfDeduction | number:'1.2-2' }}</td>
            <td>{{ s.esiDeduction | number:'1.2-2' }}</td>
            <td>{{ s.ptDeduction | number:'1.2-2' }}</td>
            <td>{{ s.overtimeWages | number:'1.2-2' }}</td>
            <td><b style="color:#1890ff">{{ s.netPay | number:'1.2-2' }}</b></td>
            <td>{{ s.workerType }}</td>
            <td>
              <button nz-button nzType="link" nzSize="small" (click)="editSalary(s)" *ngIf="authService.canManageSalary()"><i nz-icon nzType="edit"></i></button>
              <nz-popconfirm nzTitle="Delete this salary record?" (nzOnConfirm)="deleteSalary(s.id)">
                <button nz-button nzType="link" nzSize="small" nzDanger *ngIf="authService.canDeleteSalary()"><i nz-icon nzType="delete"></i></button>
              </nz-popconfirm>
            </td>
          </tr>
        </tbody>
      </nz-table>
    </nz-card>

    <!-- Add/Edit Modal (custom overlay) -->
    <div class="modal-overlay" *ngIf="modalVisible" (click)="modalVisible = false">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <span>{{ editingId ? 'Edit Salary' : 'Add Salary' }}</span>
          <button class="modal-close" (click)="modalVisible = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>Employee</label>
            <nz-select [(ngModel)]="form.employeeId" nzPlaceHolder="Select Employee" name="employeeId" [nzDisabled]="!!editingId" style="width:100%">
              <nz-option *ngFor="let e of employees" [nzValue]="e.id" [nzLabel]="e.employeeCode + ' - ' + e.firstName + ' ' + e.surname"></nz-option>
            </nz-select>
          </div>
          <div class="form-row">
            <label>Year</label>
            <nz-input-number [(ngModel)]="form.wageYear" name="wageYear" [nzMin]="2020" [nzMax]="2030" style="width:100%"></nz-input-number>
          </div>
          <div class="form-row">
            <label>Month</label>
            <nz-select [(ngModel)]="form.wageMonth" name="wageMonth" style="width:100%">
              <nz-option *ngFor="let m of months" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
            </nz-select>
          </div>
          <div class="form-row">
            <label>Basic</label>
            <nz-input-number [(ngModel)]="form.basic" name="basic" [nzMin]="0" [nzPrecision]="2" style="width:100%"></nz-input-number>
          </div>
          <div class="form-row">
            <label>HRA</label>
            <nz-input-number [(ngModel)]="form.hra" name="hra" [nzMin]="0" [nzPrecision]="2" style="width:100%"></nz-input-number>
          </div>
          <div class="form-row">
            <label>Fixed Personal Allowance</label>
            <nz-input-number [(ngModel)]="form.fixedPersonalAllowance" name="fixedPersonalAllowance" [nzMin]="0" [nzPrecision]="2" style="width:100%"></nz-input-number>
          </div>
          <div class="form-row">
            <label>Other Allowance</label>
            <nz-input-number [(ngModel)]="form.otherAllowance" name="otherAllowance" [nzMin]="0" [nzPrecision]="2" style="width:100%"></nz-input-number>
          </div>
          <div class="form-row">
            <label>PF Deduction</label>
            <nz-input-number [(ngModel)]="form.pfDeduction" name="pfDeduction" [nzMin]="0" [nzPrecision]="2" style="width:100%"></nz-input-number>
          </div>
          <div class="form-row">
            <label>ESI Deduction</label>
            <nz-input-number [(ngModel)]="form.esiDeduction" name="esiDeduction" [nzMin]="0" [nzPrecision]="2" style="width:100%"></nz-input-number>
          </div>
          <div class="form-row">
            <label>PT Deduction</label>
            <nz-input-number [(ngModel)]="form.ptDeduction" name="ptDeduction" [nzMin]="0" [nzPrecision]="2" style="width:100%"></nz-input-number>
          </div>
          <div class="form-row">
            <label>Overtime Wages</label>
            <nz-input-number [(ngModel)]="form.overtimeWages" name="overtimeWages" [nzMin]="0" [nzPrecision]="2" style="width:100%"></nz-input-number>
          </div>
          <div class="form-row">
            <label>Working Hours/Day</label>
            <nz-input-number [(ngModel)]="form.workingHoursPerDay" name="workingHoursPerDay" [nzMin]="1" [nzMax]="12" style="width:100%"></nz-input-number>
          </div>
          <div class="form-row">
            <label>Worker Type</label>
            <nz-select [(ngModel)]="form.workerType" name="workerType" style="width:100%">
              <nz-option nzValue="Permanent" nzLabel="Permanent"></nz-option>
              <nz-option nzValue="Casual" nzLabel="Casual"></nz-option>
              <nz-option nzValue="Contract" nzLabel="Contract"></nz-option>
            </nz-select>
          </div>
        </div>
        <div class="modal-footer">
          <button nz-button (click)="modalVisible = false">Cancel</button>
          <button nz-button nzType="primary" [nzLoading]="saving" (click)="saveSalary()">Save</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h2 { margin: 0; font-size: 20px; font-weight: 600; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.45); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .modal-box { background: #fff; border-radius: 8px; width: 640px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 4px 24px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #f0f0f0; font-size: 16px; font-weight: 600; }
    .modal-close { background: none; border: none; font-size: 22px; cursor: pointer; color: #999; padding: 0 4px; }
    .modal-close:hover { color: #333; }
    .modal-body { padding: 24px; overflow-y: auto; flex: 1; }
    .modal-footer { padding: 12px 24px; border-top: 1px solid #f0f0f0; display: flex; justify-content: flex-end; gap: 8px; }
    .form-row { margin-bottom: 16px; }
    .form-row label { display: block; font-weight: 500; margin-bottom: 4px; font-size: 13px; color: #333; }
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
