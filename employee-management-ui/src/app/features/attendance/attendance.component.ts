import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AttendanceService } from '../../core/services/attendance.service';
import { EmployeeAttendance, AttendanceRecord } from '../../core/models/attendance.models';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzTableModule, NzButtonModule,
    NzSelectModule, NzIconModule, NzTagModule, NzSpinModule
  ],
  template: `
    <div class="page-header">
      <h2>Attendance</h2>
      <div class="header-actions">
        <div class="month-nav">
          <button nz-button nzType="text" (click)="changeMonth(-1)">
            <i nz-icon nzType="left"></i>
          </button>
          <nz-select [(ngModel)]="selectedYear" (ngModelChange)="onYearMonthChange()" style="width:90px">
            <nz-option *ngFor="let y of yearList" [nzValue]="y" [nzLabel]="y.toString()"></nz-option>
          </nz-select>
          <nz-select [(ngModel)]="selectedMonth" (ngModelChange)="onYearMonthChange()" style="width:120px">
            <nz-option *ngFor="let m of monthList" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
          </nz-select>
          <button nz-button nzType="text" (click)="changeMonth(1)">
            <i nz-icon nzType="right"></i>
          </button>
        </div>
        <div class="action-buttons">
          <button nz-button (click)="exportExcel()" [disabled]="loading">
            <i nz-icon nzType="download"></i> Export
          </button>
          <button nz-button (click)="importFile.click()" [disabled]="loading">
            <i nz-icon nzType="upload"></i> Import
          </button>
          <input #importFile type="file" accept=".xlsx" style="display:none" (change)="importExcel($event)">
          <button nz-button *ngIf="isCurrentMonth" [nzType]="isEditMode ? 'primary' : 'default'" (click)="toggleEdit()">
            <i nz-icon [nzType]="isEditMode ? 'save' : 'edit'"></i>
            {{ isEditMode ? 'Save' : 'Edit' }}
          </button>
        </div>
      </div>
    </div>

    <nz-table #attTable [nzData]="employees" [nzLoading]="loading" nzBordered nzSize="small" [nzScroll]="{ x: scrollX }">
      <thead>
        <tr>
          <th style="min-width:180px;position:sticky;left:0;z-index:2;background:#fafafa">Employee</th>
          <th *ngFor="let d of dayNumbers" style="width:38px;text-align:center;padding:4px 2px">{{ d }}</th>
          <th style="width:90px;text-align:center">Summary</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let emp of attTable.data">
          <td style="position:sticky;left:0;background:#fff;z-index:1;white-space:nowrap">
            <strong>{{ emp.employeeCode }}</strong> {{ emp.employeeName }}
          </td>
          <td *ngFor="let d of dayNumbers" style="text-align:center;padding:2px">
            <ng-container *ngIf="!isEditMode">
              <nz-tag *ngIf="emp.days[d]" [nzColor]="statusColor(emp.days[d])" style="margin:0;font-size:11px;line-height:16px;height:18px;min-width:22px;text-align:center">
                {{ emp.days[d] }}
              </nz-tag>
              <span *ngIf="!emp.days[d]" style="color:#ccc">-</span>
            </ng-container>
            <nz-select *ngIf="isEditMode"
                       [(ngModel)]="emp.days[d]"
                       (ngModelChange)="markChanged(emp.employeeId, d, $event)"
                       nzSize="small"
                       style="width:42px"
                       nzDropdownMatchSelectWidth="false">
              <nz-option nzValue="" nzLabel="-"></nz-option>
              <nz-option nzValue="P" nzLabel="P"></nz-option>
              <nz-option nzValue="A" nzLabel="A"></nz-option>
              <nz-option nzValue="L" nzLabel="L"></nz-option>
              <nz-option nzValue="H" nzLabel="H"></nz-option>
              <nz-option nzValue="WO" nzLabel="WO"></nz-option>
            </nz-select>
          </td>
          <td style="text-align:center;font-size:11px;line-height:1.6">
            <nz-tag nzColor="green" style="margin:1px;font-size:10px">P:{{ emp.totalPresent }}</nz-tag>
            <nz-tag nzColor="red" style="margin:1px;font-size:10px">A:{{ emp.totalAbsent }}</nz-tag>
            <nz-tag nzColor="orange" style="margin:1px;font-size:10px">L:{{ emp.totalLeave }}</nz-tag>
          </td>
        </tr>
      </tbody>
    </nz-table>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
    .page-header h2 { margin: 0; font-size: 20px; font-weight: 600; }
    .header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .month-nav { display: flex; align-items: center; gap: 4px; background: #fff; border: 1px solid #e8eaed; border-radius: 8px; padding: 2px 4px; }
    .action-buttons { display: flex; align-items: center; gap: 8px; }
    :host ::ng-deep .ant-table-thead > tr > th { background: #fafafa !important; font-size: 12px; font-weight: 600; }
    :host ::ng-deep .ant-table-tbody > tr > td { padding: 4px 6px; }
    :host ::ng-deep .ant-select-small { font-size: 11px; }
    :host ::ng-deep .ant-select-item { font-size: 11px; }
  `]
})
export class AttendanceComponent implements OnInit {
  loading = false;
  saving = false;
  selectedYear: number;
  selectedMonth: number;
  employees: EmployeeAttendance[] = [];
  isEditMode = false;
  changedRecords: Set<string> = new Set();

  yearList: number[] = [];
  monthList = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];
  dayNumbers: number[] = [];
  scrollX = '';

  constructor(
    private attendanceService: AttendanceService,
    private msg: NzMessageService
  ) {
    const now = new Date();
    this.selectedYear = now.getFullYear();
    this.selectedMonth = now.getMonth() + 1;
  }

  get isCurrentMonth(): boolean {
    const now = new Date();
    return this.selectedYear === now.getFullYear() && this.selectedMonth === now.getMonth() + 1;
  }

  ngOnInit(): void {
    const now = new Date();
    const startYear = now.getFullYear() - 2;
    const endYear = now.getFullYear() + 1;
    for (let y = startYear; y <= endYear; y++) {
      this.yearList.push(y);
    }
    this.updateDayNumbers();
    this.loadData();
  }

  updateDayNumbers(): void {
    const daysInMonth = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    this.dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    this.scrollX = (180 + this.dayNumbers.length * 38 + 90 + 50).toString();
  }

  onYearMonthChange(): void {
    this.isEditMode = false;
    this.changedRecords.clear();
    this.updateDayNumbers();
    this.loadData();
  }

  changeMonth(delta: number): void {
    this.selectedMonth += delta;
    if (this.selectedMonth > 12) {
      this.selectedMonth = 1;
      this.selectedYear++;
    } else if (this.selectedMonth < 1) {
      this.selectedMonth = 12;
      this.selectedYear--;
    }
    this.onYearMonthChange();
  }

  loadData(): void {
    this.loading = true;
    this.attendanceService.getMonthlyAttendance(this.selectedYear, this.selectedMonth).subscribe({
      next: (res) => {
        this.employees = res.data?.employees || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.msg.error('Failed to load attendance data');
      }
    });
  }

  markChanged(employeeId: number, day: number, status: string): void {
    this.changedRecords.add(`${employeeId}_${day}`);
  }

  toggleEdit(): void {
    if (this.isEditMode) {
      this.saveChanges();
    } else {
      this.changedRecords.clear();
      this.isEditMode = true;
    }
  }

  saveChanges(): void {
    const records: AttendanceRecord[] = [];
    const dateStr = `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}`;

    for (const emp of this.employees) {
      for (const key of this.changedRecords) {
        const [empId, day] = key.split('_').map(Number);
        if (empId === emp.employeeId) {
          const status = emp.days[day] || '';
          if (status) {
            records.push({
              employeeId: emp.employeeId,
              date: `${dateStr}-${String(day).padStart(2, '0')}`,
              status
            });
          }
        }
      }
    }

    if (records.length === 0) {
      this.isEditMode = false;
      this.msg.info('No changes to save');
      return;
    }

    this.saving = true;
    this.attendanceService.bulkUpdate(records).subscribe({
      next: () => {
        this.msg.success(`Saved ${records.length} attendance record(s)`);
        this.isEditMode = false;
        this.changedRecords.clear();
        this.saving = false;
        this.loadData();
      },
      error: (err) => {
        this.msg.error(err.error?.message || 'Failed to save attendance');
        this.saving = false;
      }
    });
  }

  exportExcel(): void {
    this.attendanceService.exportExcel(this.selectedYear, this.selectedMonth).subscribe({
      next: (blob) => {
        saveAs(blob, `Attendance_${this.selectedYear}_${String(this.selectedMonth).padStart(2, '0')}.xlsx`);
      },
      error: () => this.msg.error('Failed to export attendance')
    });
  }

  importExcel(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.loading = true;
    this.attendanceService.importExcel(file, this.selectedYear, this.selectedMonth).subscribe({
      next: (res) => {
        this.msg.success(`Import completed: ${res.data?.imported || 0} records`);
        this.loading = false;
        input.value = '';
        this.loadData();
      },
      error: (err) => {
        this.msg.error(err.error?.message || 'Failed to import attendance');
        this.loading = false;
        input.value = '';
      }
    });
  }

  statusColor(status: string): string {
    switch (status) {
      case 'P': return 'green';
      case 'A': return 'red';
      case 'L': return 'orange';
      case 'H': return 'blue';
      case 'WO': return 'default';
      default: return 'default';
    }
  }
}
