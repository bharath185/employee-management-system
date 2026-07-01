import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AttendanceService } from '../../core/services/attendance.service';
import { MonthlyAttendance, DayColumn, EmployeeAttendance, SummaryRow, AttendanceRecord } from '../../core/models/attendance.models';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzTableModule, NzButtonModule, NzSelectModule,
    NzIconModule, NzTagModule, NzCardModule, NzSpinModule
  ],
  template: `
    <div class="page-header">
      <h2>Attendance - {{ data?.monthLabel || '' }}</h2>
      <div class="header-actions">
        <div class="month-nav">
          <button nz-button nzType="text" (click)="changeMonth(-1)">
            <i nz-icon nzType="left"></i>
          </button>
          <nz-select [(ngModel)]="selectedYear" (ngModelChange)="onFilterChange()" style="width:90px">
            <nz-option *ngFor="let y of yearList" [nzValue]="y" [nzLabel]="y.toString()"></nz-option>
          </nz-select>
          <nz-select [(ngModel)]="selectedMonth" (ngModelChange)="onFilterChange()" style="width:130px">
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

    <div class="summary-cards" *ngIf="data">
      <nz-card *ngFor="let row of data.summaryRows || []" class="summary-card" [ngStyle]="{'border-top': '3px solid ' + summaryColor(row.label)}">
        <div class="summary-card-label">{{ row.label }}</div>
        <div class="summary-card-value">{{ row.total }}</div>
      </nz-card>
    </div>

    <nz-table #attTable
      [nzData]="data?.employees || []"
      [nzLoading]="loading"
      [nzFrontPagination]="false"
      [nzShowPagination]="!!(data && data.totalEmployees > size)"
      [nzPageIndex]="page + 1"
      [nzPageSize]="size"
      [nzTotal]="(data && data.totalEmployees) || 0"
      (nzPageIndexChange)="onPageIndexChange($event)"
      (nzPageSizeChange)="onPageSizeChange($event)"
      nzBordered
      nzSize="small"
      [nzScroll]="{ x: scrollX }"
      [nzShowSizeChanger]="true"
      [nzPageSizeOptions]="[10, 20, 50, 100]">
      <thead>
        <tr>
          <th rowSpan="2" style="min-width:50px;text-align:center">S.No</th>
          <th rowSpan="2" style="min-width:50px">Gender</th>
          <th rowSpan="2" style="min-width:90px">EmpCode</th>
          <th rowSpan="2" style="min-width:160px">Employee Name</th>
          <th rowSpan="2" style="min-width:100px">Department</th>
          <th rowSpan="2" style="min-width:80px">DOJ</th>
          <th rowSpan="2" style="min-width:55px">Vintage</th>
          <th [attr.colSpan]="(data && data.dayColumns.length) || 31" style="text-align:center">
            {{ data?.monthLabel || '' }} (26 prev - 25 current)
          </th>
          <th rowSpan="2" style="min-width:55px;text-align:center">Total P</th>
          <th rowSpan="2" style="min-width:55px;text-align:center">Leaves</th>
          <th rowSpan="2" style="min-width:55px;text-align:center">Total ML</th>
          <th rowSpan="2" style="min-width:55px;text-align:center">Total Lv</th>
        </tr>
        <tr>
          <th *ngFor="let col of data?.dayColumns; let i = index"
              style="width:32px;text-align:center;padding:2px 0;font-size:11px"
              [class.weekend]="col.dayOfWeek === 'Sun'"
              [class.saturday]="col.dayOfWeek === 'Sat'">
            <div class="day-col-header">
              <span class="day-week">{{ col.dayOfWeek }}</span>
              <span class="day-num">{{ col.dayNumber }}</span>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let emp of attTable.data">
          <td style="text-align:center">{{ emp.serialNo }}</td>
          <td>{{ emp.gender }}</td>
          <td><strong>{{ emp.employeeCode }}</strong></td>
          <td style="white-space:nowrap">{{ emp.employeeName }}</td>
          <td>{{ emp.department }}</td>
          <td style="font-size:11px">{{ emp.doj }}</td>
          <td style="text-align:center">{{ emp.vintage }}</td>
          <td *ngFor="let s of emp.days; let di = index" style="text-align:center;padding:2px">
            <ng-container *ngIf="!isEditMode">
              <nz-tag *ngIf="s" [nzColor]="statusColor(s)" class="cell-tag">{{ s }}</nz-tag>
              <span *ngIf="!s" class="cell-empty">-</span>
            </ng-container>
            <nz-select *ngIf="isEditMode"
              [(ngModel)]="emp.days[di]"
              (ngModelChange)="markChanged(emp.employeeId, di, $event)"
              nzSize="small" style="width:36px" [nzDropdownMatchSelectWidth]="false">
              <nz-option nzValue="" nzLabel="-"></nz-option>
              <nz-option nzValue="P" nzLabel="P"></nz-option>
              <nz-option nzValue="A" nzLabel="A"></nz-option>
              <nz-option nzValue="L" nzLabel="L"></nz-option>
              <nz-option nzValue="ML" nzLabel="ML"></nz-option>
              <nz-option nzValue="H" nzLabel="H"></nz-option>
              <nz-option nzValue="WO" nzLabel="WO"></nz-option>
              <nz-option nzValue="R" nzLabel="R"></nz-option>
              <nz-option nzValue="CO" nzLabel="CO"></nz-option>
            </nz-select>
          </td>
          <td style="text-align:center"><nz-tag nzColor="green" class="cell-tag">{{ emp.totalPresent }}</nz-tag></td>
          <td style="text-align:center"><nz-tag nzColor="orange" class="cell-tag">{{ emp.totalLeave }}</nz-tag></td>
          <td style="text-align:center"><nz-tag nzColor="purple" class="cell-tag">{{ emp.totalML }}</nz-tag></td>
          <td style="text-align:center"><b>{{ emp.totalLeave + emp.totalML }}</b></td>
        </tr>
      </tbody>
    </nz-table>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px; }
    .page-header h2 { margin:0; font-size:20px; font-weight:600; }
    .header-actions { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .month-nav { display:flex; align-items:center; gap:2px; background:#fff; border:1px solid #e8eaed; border-radius:8px; padding:2px 4px; }
    .action-buttons { display:flex; align-items:center; gap:6px; }
    .summary-cards { display:flex; gap:12px; margin-bottom:16px; flex-wrap:wrap; }
    .summary-card { flex:1; min-width:120px; text-align:center; border-radius:6px; }
    .summary-card-label { font-size:11px; color:#888; text-transform:uppercase; letter-spacing:0.5px; }
    .summary-card-value { font-size:22px; font-weight:700; color:#1a1a2e; margin-top:4px; }
    .day-col-header { display:flex; flex-direction:column; align-items:center; line-height:1.2; }
    .day-week { font-size:9px; color:#888; }
    .day-num { font-size:12px; font-weight:600; }
    .weekend { background:#fff1f0 !important; }
    .saturday { background:#f6f8fa !important; }
    .cell-tag { margin:0; font-size:11px; line-height:16px; height:18px; min-width:22px; text-align:center; }
    .cell-empty { color:#ddd; font-size:12px; }
    :host ::ng-deep .ant-table-thead > tr > th { background:#fafafa !important; font-size:12px; font-weight:600; padding:4px 6px; }
    :host ::ng-deep .ant-table-tbody > tr > td { padding:3px 5px; font-size:12px; }
    :host ::ng-deep .ant-select-small { font-size:11px; }
    :host ::ng-deep .ant-table-pagination { margin-top:12px; }
  `]
})
export class AttendanceComponent implements OnInit {
  loading = false;
  saving = false;
  selectedYear: number;
  selectedMonth: number;
  currentCycleYear: number;
  currentCycleMonth: number;
  page = 0;
  size = 50;
  data: MonthlyAttendance | null = null;
  isEditMode = false;
  changedRecords: Set<string> = new Set();

  yearList: number[] = [];
  monthList = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];
  scrollX = '';

  constructor(
    private attendanceService: AttendanceService,
    private msg: NzMessageService
  ) {
    const now = new Date();
    this.currentCycleYear = now.getFullYear();
    this.currentCycleMonth = now.getMonth() + 1;
    if (now.getDate() >= 26) {
      this.currentCycleMonth++;
      if (this.currentCycleMonth > 12) {
        this.currentCycleMonth = 1;
        this.currentCycleYear++;
      }
    }
    this.selectedYear = this.currentCycleYear;
    this.selectedMonth = this.currentCycleMonth;
  }

  get isCurrentMonth(): boolean {
    return this.selectedYear === this.currentCycleYear && this.selectedMonth === this.currentCycleMonth;
  }

  ngOnInit(): void {
    const now = new Date();
    for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) {
      this.yearList.push(y);
    }
    this.loadData();
  }

  onFilterChange(): void {
    this.isEditMode = false;
    this.changedRecords.clear();
    this.page = 0;
    this.loadData();
  }

  changeMonth(delta: number): void {
    this.selectedMonth += delta;
    if (this.selectedMonth > 12) { this.selectedMonth = 1; this.selectedYear++; }
    else if (this.selectedMonth < 1) { this.selectedMonth = 12; this.selectedYear--; }
    this.onFilterChange();
  }

  onPageIndexChange(index: number): void {
    this.page = index - 1;
    this.loadData();
  }

  onPageSizeChange(size: number): void {
    this.size = size;
    this.page = 0;
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.attendanceService.getMonthlyAttendance(this.selectedYear, this.selectedMonth, this.page, this.size).subscribe({
      next: (res) => {
        this.data = res.data;
        const cols = 7 + (this.data?.dayColumns?.length || 31) + 4;
        this.scrollX = (cols * 40 + 200).toString();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.msg.error('Failed to load data');
      }
    });
  }

  markChanged(employeeId: number, dayIndex: number, status: string): void {
    this.changedRecords.add(`${employeeId}_${dayIndex}`);
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
    if (!this.data) return;
    const records: AttendanceRecord[] = [];
    const baseDate = this.data.dayColumns[0]?.date;
    if (!baseDate) return;

    for (const emp of this.data.employees) {
      for (const key of this.changedRecords) {
        const [empId, dayIdx] = key.split('_').map(Number);
        if (empId === emp.employeeId && dayIdx < emp.days.length) {
          const status = emp.days[dayIdx] || '';
          if (status) {
            const col = this.data.dayColumns[dayIdx];
            records.push({ employeeId: emp.employeeId, date: col.date, status });
          }
        }
      }
    }

    if (records.length === 0) {
      this.isEditMode = false;
      this.msg.info('No changes');
      return;
    }

    this.saving = true;
    this.attendanceService.bulkUpdate(records).subscribe({
      next: () => {
        this.msg.success(`Saved ${records.length} record(s)`);
        this.isEditMode = false;
        this.changedRecords.clear();
        this.saving = false;
        this.loadData();
      },
      error: (err) => {
        this.msg.error(err.error?.message || 'Save failed');
        this.saving = false;
      }
    });
  }

  exportExcel(): void {
    this.attendanceService.exportExcel(this.selectedYear, this.selectedMonth).subscribe({
      next: (blob) => saveAs(blob, `Attendance_${this.data?.monthLabel || ''}.xlsx`),
      error: () => this.msg.error('Export failed')
    });
  }

  importExcel(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.loading = true;
    this.attendanceService.importExcel(input.files[0], this.selectedYear, this.selectedMonth).subscribe({
      next: (res) => {
        this.msg.success(`Imported ${res.data?.imported || 0} records`);
        this.loading = false;
        input.value = '';
        this.loadData();
      },
      error: (err) => {
        this.msg.error(err.error?.message || 'Import failed');
        this.loading = false;
        input.value = '';
      }
    });
  }

  summaryColor(label: string): string {
    switch (label) {
      case 'Present': return '#52c41a';
      case 'Leaves': return '#fa8c16';
      case 'ML': return '#722ed1';
      case 'Resigns': return '#f5222d';
      default: return '#1890ff';
    }
  }

  statusColor(s: string): string {
    switch (s) {
      case 'P': return 'green';
      case 'A': return 'red';
      case 'L': return 'orange';
      case 'ML': return 'purple';
      case 'H': return 'blue';
      case 'WO': return 'default';
      case 'R': return 'red';
      case 'CO': return 'cyan';
      default: return 'default';
    }
  }
}
