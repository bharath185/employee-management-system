import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AttendanceService } from '../../core/services/attendance.service';
import { MonthlyAttendance, EmployeeAttendance, AttendanceRecord } from '../../core/models/attendance.models';

import { saveAs } from 'file-saver';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzTableModule, NzButtonModule, NzSelectModule,
    NzIconModule, NzTagModule, NzPopoverModule, NzSpinModule, NzToolTipModule, NzDatePickerModule,

  ],
  template: `
    <div class="att-container">
      <div class="att-header-pill">
        <span class="att-pill-title"><i nz-icon nzType="calendar"></i> Attendance</span>
        <div class="date-range-picker">
          <nz-date-picker [(ngModel)]="fromDate" (ngModelChange)="onDateRangeChange()" nzPlaceHolder="From date" nzSize="small" style="width:130px"></nz-date-picker>
          <span class="date-sep">to</span>
          <nz-date-picker [(ngModel)]="toDate" (ngModelChange)="onDateRangeChange()" nzPlaceHolder="To date" nzSize="small" style="width:130px"></nz-date-picker>
          <button nz-button nzType="text" class="nav-btn" (click)="shiftRange(-1)" nz-tooltip="Previous period">
            <i nz-icon nzType="left"></i>
          </button>
          <button nz-button nzType="text" class="nav-btn" (click)="shiftRange(1)" nz-tooltip="Next period">
            <i nz-icon nzType="right"></i>
          </button>
          <span class="nav-sep"></span>
          <nz-select [(ngModel)]="selectedDepartment" (ngModelChange)="onFilterChange()" nzSize="small" nzBorderless
            class="dept-select" nzPlaceHolder="All Departments">
            <nz-option nzValue="" nzLabel="All Departments"></nz-option>
            <nz-option *ngFor="let d of departmentList" [nzValue]="d" [nzLabel]="d"></nz-option>
          </nz-select>
        </div>
        <div class="toolbar-actions">
          <button nz-button nzType="default" nzSize="small" nz-tooltip="Download Excel" (click)="exportExcel()" [disabled]="loading">
            <i nz-icon nzType="download"></i> Export
          </button>
          <button nz-button nzType="default" nzSize="small" nz-tooltip="Import Excel" (click)="importFile.click()" [disabled]="loading">
            <i nz-icon nzType="upload"></i> Import
          </button>
          <input #importFile type="file" accept=".xlsx" style="display:none" (change)="importExcel($event)">
          <button nz-button nzSize="small"
            [nzType]="isEditMode ? 'primary' : 'default'"
            class="edit-btn" [class.saving]="saving"
            (click)="toggleEdit()" [disabled]="saving">
            <i nz-icon nzType="save" *ngIf="isEditMode; else editIcon"></i>
            <ng-template #editIcon><i nz-icon nzType="edit"></i></ng-template>
            <span>{{ isEditMode ? (saving ? 'Saving...' : 'Save') : 'Edit' }}</span>
          </button>
        </div>
      </div>

      <div class="legend-bar" *ngIf="data">
        <div class="legend-item" *ngFor="let l of legendItems">
          <span class="legend-dot" [style.background]="l.color"></span>
          <span class="legend-label">{{ l.label }}</span>
        </div>
      </div>

      <div class="summary-section" *ngIf="data">
        <table class="summary-table">
          <thead>
            <tr>
              <th class="sum-label"></th>
              <th class="sum-spacer"></th>
              <th *ngFor="let col of data.dayColumns; let i = index"
                  class="sum-day" [class.weekend]="col.dayOfWeek === 'Sun'">
                <span class="sum-day-name">{{ col.dayOfWeek }}</span>
                <span class="sum-day-num">{{ col.dayNumber }}</span>
              </th>
              <th class="sum-total">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of data.summaryRows" class="sum-row">
              <td class="sum-label">
                <span class="sum-badge" [style.background]="sumColor(row.label)"></span>
                {{ row.label }}
              </td>
              <td class="sum-spacer"></td>
              <td *ngFor="let c of row.dailyCounts; let i = index"
                  class="sum-day" [class.weekend]="isSunDay(i)">
                <span class="sum-val" [class.highlight]="c > 0">{{ c || '-' }}</span>
              </td>
              <td class="sum-total"><strong>{{ row.total }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="table-wrap">
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
          nzBordered nzSize="small"
          [nzScroll]="{ x: scrollX }"
          [nzShowSizeChanger]="true"
          [nzPageSizeOptions]="[10,20,50,100]"
          [nzHideOnSinglePage]="true"
          nzTableLayout="fixed">
          <thead>
            <tr>
              <th rowSpan="2" class="th-sno">#</th>
              <th rowSpan="2" class="th-emp">Emp Code</th>
              <th [attr.colSpan]="dayColCount()" class="th-days">
                <span class="th-range">{{ data?.fromDate || '' }} - {{ data?.toDate || '' }}</span>
              </th>
              <th rowSpan="2" class="th-sum th-sum-p">P</th>
              <th rowSpan="2" class="th-sum th-sum-l">Lv</th>
              <th rowSpan="2" class="th-sum th-sum-ml">ML</th>
              <th rowSpan="2" class="th-sum th-sum-t">Lv+</th>
            </tr>
            <tr>
              <th *ngFor="let col of data?.dayColumns; let i = index"
                  class="th-day" [class.weekend]="col.dayOfWeek === 'Sun'">
                <span class="dw">{{ col.dayOfWeek }}</span>
                <span class="dn">{{ col.dayNumber }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let emp of attTable.data; let idx = index" class="emp-row">
              <td class="td-sno">{{ emp.serialNo }}</td>
              <td class="td-emp" [nz-popover]="empPop" nzPopoverTrigger="hover" nzPopoverPlacement="rightTop" [nzPopoverMouseEnterDelay]="0.3">
                <span class="emp-code">{{ emp.employeeCode }}</span>
                <ng-template #empPop>
                  <div class="emp-popover">
                    <div class="pop-header">
                      <div class="pop-avatar">{{ (emp.employeeName || '?').charAt(0) }}</div>
                      <div>
                        <div class="pop-name">{{ emp.employeeName }}</div>
                        <div class="pop-code">{{ emp.employeeCode }}</div>
                      </div>
                    </div>
                    <div class="pop-body">
                      <div class="pop-row"><span class="pop-lbl">Gender</span><span class="pop-val">{{ emp.gender || '-' }}</span></div>
                      <div class="pop-row"><span class="pop-lbl">Department</span><span class="pop-val">{{ emp.department || '-' }}</span></div>
                      <div class="pop-row"><span class="pop-lbl">Designation</span><span class="pop-val">{{ emp.designation || '-' }}</span></div>
                      <div class="pop-row"><span class="pop-lbl">DOJ</span><span class="pop-val">{{ emp.doj || '-' }}</span></div>
                      <div class="pop-row"><span class="pop-lbl">Vintage</span><span class="pop-val">{{ emp.vintage }} months</span></div>
                    </div>
                  </div>
                </ng-template>
              </td>
              <td *ngFor="let s of emp.days; let di = index" class="td-day" [class.weekend]="isSunDay(di)">
                <span *ngIf="!isEditMode && s" class="day-status" [class]="'status-' + s.toLowerCase()">{{ s }}</span>
                <span *ngIf="!isEditMode && !s" class="day-empty">·</span>
                <span *ngIf="isEditMode"
                  (click)="cycleStatus(emp, di)"
                  class="day-status clickable"
                  [class]="'status-' + ((emp.days[di] || '').toLowerCase() || 'blank')">
                  {{ emp.days[di] || '—' }}
                </span>
              </td>
              <td class="td-sum"><span class="stat-p">{{ emp.totalPresent }}</span></td>
              <td class="td-sum"><span class="stat-l">{{ emp.totalLeave }}</span></td>
              <td class="td-sum"><span class="stat-ml">{{ emp.totalML }}</span></td>
              <td class="td-sum td-sum-total"><b>{{ emp.totalLeave + emp.totalML }}</b></td>
            </tr>
          </tbody>
        </nz-table>
      </div>
    </div>
  `,
  styles: [`
    .att-container { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; padding:0 16px 16px; }

    /* Pill-style header bar matching sub-nav */
    .att-header-pill {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f0f4ff;
      border-radius: 10px;
      padding: 6px 14px;
      margin-bottom: 16px;
      border: 1px solid #e0e7ff;
      flex-wrap: wrap;
    }
    .att-pill-title {
      font-size: 13px;
      font-weight: 700;
      color: #1f3d6e;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }
    .att-pill-title i {
      font-size: 16px;
    }
    .date-range-picker { display:flex; align-items:center; gap:4px; background:#ffffff; border-radius:8px; padding:2px 4px; border:1px solid #e0e7ff; flex-wrap:wrap; }
    .date-sep { font-size:11px; color:#6c757d; font-weight:500; }
    .nav-btn { width:28px; height:28px; display:flex; align-items:center; justify-content:center; border-radius:6px; color:#6c757d; border:none; background:transparent; cursor:pointer; transition:all .2s; }
    .nav-btn:hover { background:rgba(31,61,110,.08); color:#1f3d6e; }
    .nav-sep { width:1px; height:20px; background:#e0e7ff; margin:0 6px; flex-shrink:0; }
    .date-range-picker ::ng-deep .ant-select { background:transparent; }
    .date-range-picker ::ng-deep .ant-select-selection-item { color:#1f3d6e !important; font-weight:600; font-size:12px; }
    .date-range-picker ::ng-deep .ant-select-arrow { color:#6c757d; }
    .date-range-picker ::ng-deep .ant-picker { border-radius:6px; height:28px; font-size:12px; }
    .date-range-picker ::ng-deep .ant-picker-input > input { font-size:12px; }

    .dept-select { margin-left:4px; }
    .dept-select ::ng-deep .ant-select-selection-item { max-width:110px; overflow:hidden; text-overflow:ellipsis; }

    .toolbar-actions { display:flex; align-items:center; gap:5px; margin-left:auto; }
    .toolbar-actions button { height:30px; font-size:12px; border-radius:6px; border:1px solid #e0e7ff; background:#ffffff; color:#6c757d; padding:0 10px; transition:all .2s; display:inline-flex; align-items:center; gap:4px; }
    .toolbar-actions button i { display:inline-flex; font-size:14px; }
    .toolbar-actions button:hover:not(:disabled) { border-color:#1f3d6e; color:#1f3d6e; }
    .edit-btn { font-weight:600 !important; letter-spacing:.3px; }
    .edit-btn.saving { opacity:.7; cursor:not-allowed; }
    .legend-bar { display:flex; flex-wrap:wrap; gap:4px 12px; margin-bottom:10px; padding:8px 14px; background:#fff; border:1px solid #e8eaed; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,.04); }
    .legend-item { display:flex; align-items:center; gap:5px; font-size:11px; color:#555; }
    .legend-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .legend-label { white-space:nowrap; }
    .summary-section { margin-bottom:10px; overflow-x:auto; background:#fff; border:1px solid #e8eaed; border-radius:8px; box-shadow:0 1px 4px rgba(0,0,0,.05); }
    .summary-table { width:100%; border-collapse:collapse; font-size:11px; min-width:600px; }
    .summary-table th, .summary-table td { padding:3px 4px; text-align:center; border-right:1px solid #f0f2f5; white-space:nowrap; }
    .summary-table thead th { background:#f7f8fc; font-weight:600; color:#555; font-size:10px; padding:4px 3px; border-bottom:1px solid #e8eaed; text-transform:uppercase; letter-spacing:.3px; }
    .sum-label { text-align:left !important; font-weight:600; color:#333; font-size:11px; padding-left:10px !important; width:110px; }
    .sum-spacer { width:4px !important; min-width:4px; padding:0 !important; border:none !important; background:transparent !important; }
    .sum-badge { display:inline-block; width:7px; height:7px; border-radius:50%; margin-right:6px; vertical-align:middle; }
    .sum-val { font-weight:500; color:#666; }
    .sum-val.highlight { color:#1a1a2e; font-weight:600; }
    .sum-total { font-weight:700; color:#1a1a2e; min-width:50px; border-left:1px solid #e8eaed; }
    .sum-row:hover td { background:#f7f8fc; }
    .table-wrap { background:#fff; border:1px solid #e8eaed; border-radius:8px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.05); }
    .table-wrap ::ng-deep .ant-table-thead > tr > th { background:#f7f8fc; border-bottom:2px solid #e8eaed; }
    .th-days { text-align:center !important; font-size:12px; padding:4px 8px !important; background:linear-gradient(135deg,#667eea 0%,#764ba2 100%) !important; color:#fff !important; }
    .th-month { font-weight:700; margin-right:6px; }
    .th-range { font-weight:400; opacity:.8; font-size:10px; }
    .th-sno { width:38px; min-width:38px; text-align:center !important; padding:5px 2px !important; font-size:11px; color:#555; }
    .th-emp { width:90px; min-width:90px; text-align:center !important; padding:5px 6px !important; font-size:11px; color:#555; }
    .th-day { width:32px; min-width:32px; text-align:center !important; padding:2px 0 !important; font-size:10px; line-height:1.3; }
    .th-sum { width:36px; min-width:36px; text-align:center !important; padding:5px 2px !important; font-size:10px; font-weight:700; letter-spacing:.5px; }
    .th-sum-p { color:#52c41a !important; }
    .th-sum-l { color:#fa8c16 !important; }
    .th-sum-ml { color:#722ed1 !important; }
    .th-sum-t { color:#1a1a2e !important; }
    .dw { display:block; font-size:9px; color:#999; text-transform:uppercase; }
    .dn { display:block; font-size:11px; font-weight:700; color:#444; }
    .weekend { background:#fff5f5 !important; }
    .weekend .dn { color:#e74c3c; }
    .emp-row { transition:background .15s; }
    .emp-row:hover { background:#f0f4ff !important; }
    .td-sno { text-align:center !important; font-size:11px; color:#999; padding:4px 2px !important; }
    .td-emp { text-align:center !important; padding:4px 6px !important; cursor:pointer; }
    .emp-code { font-weight:700; font-size:12px; color:#4361ee; letter-spacing:.4px; cursor:pointer; transition:color .15s; }
    .emp-code:hover { color:#3a0ca3; }
    .td-day { text-align:center !important; padding:3px 1px !important; font-size:11px; }
    .day-status { display:inline-block; width:22px; height:19px; line-height:19px; border-radius:4px; font-size:10px; font-weight:700; text-align:center; color:#fff; box-shadow:0 1px 3px rgba(0,0,0,.12); transition:transform .15s,box-shadow .15s; }
    .day-status:hover { transform:scale(1.15); box-shadow:0 2px 6px rgba(0,0,0,.2); }
    .clickable { cursor:pointer; }
    .status-blank { background:linear-gradient(135deg,#e8e8e8,#f0f0f0); color:#bbb; }
    .status-p { background:linear-gradient(135deg,#52c41a,#73d13d); }
    .status-a { background:linear-gradient(135deg,#f5222d,#ff4d4f); }
    .status-l { background:linear-gradient(135deg,#fa8c16,#ffa940); }
    .status-ml { background:linear-gradient(135deg,#722ed1,#9254de); }
    .status-h { background:linear-gradient(135deg,#1890ff,#40a9ff); }
    .status-wo { background:linear-gradient(135deg,#8c8c8c,#a6a6a6); }
    .status-r { background:linear-gradient(135deg,#cf1322,#f5222d); }
    .status-co { background:linear-gradient(135deg,#13c2c2,#36cfc9); }
    .day-empty { color:#e8e8e8; font-size:14px; }
    .td-sum { text-align:center !important; font-size:12px; padding:4px 2px !important; }
    .td-sum-total { border-left:1px solid #e8eaed; }
    .stat-p { color:#52c41a; font-weight:700; }
    .stat-l { color:#fa8c16; font-weight:600; }
    .stat-ml { color:#722ed1; font-weight:600; }
    .emp-popover { min-width:220px; }
    .pop-header { display:flex; align-items:center; gap:10px; border-bottom:1px solid #f0f0f0; padding-bottom:8px; margin-bottom:8px; }
    .pop-avatar { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,#4361ee,#3a0ca3); color:#fff; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:700; flex-shrink:0; }
    .pop-name { font-size:14px; font-weight:700; color:#1a1a2e; }
    .pop-code { font-size:11px; color:#888; font-weight:500; }
    .pop-body { font-size:12px; }
    .pop-row { display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px dashed #f5f5f5; }
    .pop-row:last-child { border:none; }
    .pop-lbl { color:#999; margin-right:12px; min-width:72px; }
    .pop-val { font-weight:500; color:#333; }
    .opt-blank { color:#bbb; font-weight:400; }
    .opt-p { color:#fff; background:linear-gradient(135deg,#52c41a,#73d13d); padding:2px 8px; border-radius:4px; font-weight:700; font-size:11px; }
    .opt-a { color:#fff; background:linear-gradient(135deg,#f5222d,#ff4d4f); padding:2px 8px; border-radius:4px; font-weight:700; font-size:11px; }
    .opt-l { color:#fff; background:linear-gradient(135deg,#fa8c16,#ffa940); padding:2px 8px; border-radius:4px; font-weight:700; font-size:11px; }
    .opt-ml { color:#fff; background:linear-gradient(135deg,#722ed1,#9254de); padding:2px 8px; border-radius:4px; font-weight:700; font-size:11px; }
    .opt-h { color:#fff; background:linear-gradient(135deg,#1890ff,#40a9ff); padding:2px 8px; border-radius:4px; font-weight:700; font-size:11px; }
    .opt-wo { color:#fff; background:linear-gradient(135deg,#8c8c8c,#a6a6a6); padding:2px 8px; border-radius:4px; font-weight:700; font-size:11px; }
    .opt-r { color:#fff; background:linear-gradient(135deg,#cf1322,#f5222d); padding:2px 8px; border-radius:4px; font-weight:700; font-size:11px; }
    .opt-co { color:#fff; background:linear-gradient(135deg,#13c2c2,#36cfc9); padding:2px 8px; border-radius:4px; font-weight:700; font-size:11px; }
    :host ::ng-deep .att-dropdown .ant-select-item-option-content { padding:0 !important; }
    :host ::ng-deep .ant-select-item-option { padding:3px 10px !important; }
    :host ::ng-deep .ant-select-item-option-active { background:#f0f4ff !important; }
  `]
})
export class AttendanceComponent implements OnInit {
  loading = false;
  saving = false;
  fromDate: Date;
  toDate: Date;
  page = 0;
  size = 50;
  data: MonthlyAttendance | null = null;
  isEditMode = false;
  changedRecords: Set<string> = new Set();
  scrollX = '';
  selectedDepartment = '';
  departmentList: string[] = [];
  rangeDays = 30;

  legendItems = [
    { code: 'P', label: 'P = Present', color: '#52c41a' },
    { code: 'A', label: 'A = Absent', color: '#f5222d' },
    { code: 'L', label: 'L = Leave', color: '#fa8c16' },
    { code: 'ML', label: 'ML = Maternity Leave', color: '#722ed1' },
    { code: 'H', label: 'H = Holiday', color: '#1890ff' },
    { code: 'WO', label: 'WO = Week Off', color: '#8c8c8c' },
    { code: 'R', label: 'R = Resign', color: '#cf1322' },
    { code: 'CO', label: 'CO = Comp Off', color: '#13c2c2' },
  ];

  constructor(
    private attendanceService: AttendanceService,
    private msg: NzMessageService
  ) {
    const now = new Date();
    this.toDate = new Date(now.getFullYear(), now.getMonth(), 25);
    this.fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 26);
    this.rangeDays = Math.round((this.toDate.getTime() - this.fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  ngOnInit(): void {
    this.attendanceService.getDepartments().subscribe(res => {
      this.departmentList = res.data || [];
    });
    this.loadData();
  }

  onDateRangeChange(): void {
    if (this.fromDate && this.toDate) {
      this.rangeDays = Math.round((this.toDate.getTime() - this.fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      this.onFilterChange();
    }
  }

  onFilterChange(): void {
    this.isEditMode = false;
    this.changedRecords.clear();
    this.page = 0;
    this.loadData();
  }

  shiftRange(delta: number): void {
    const days = this.rangeDays;
    this.fromDate = new Date(this.fromDate.getTime() + delta * days * 24 * 60 * 60 * 1000);
    this.toDate = new Date(this.toDate.getTime() + delta * days * 24 * 60 * 60 * 1000);
    this.onDateRangeChange();
  }

  onPageIndexChange(index: number): void { this.page = index - 1; this.loadData(); }
  onPageSizeChange(size: number): void { this.size = size; this.page = 0; this.loadData(); }

  loadData(): void {
    if (!this.fromDate || !this.toDate) return;
    this.loading = true;
    const from = this.formatDate(this.fromDate);
    const to = this.formatDate(this.toDate);
    this.attendanceService.getMonthlyAttendance(from, to, this.page, this.size, this.selectedDepartment).subscribe({
      next: (res) => {
        this.data = res.data;
        const cols = 2 + (this.data?.dayColumns?.length || 30) + 4;
        this.scrollX = (cols * 34 + 80).toString();
        this.loading = false;
      },
      error: () => { this.loading = false; this.msg.error('Failed to load data'); }
    });
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${y}-${m}-${day}`;
  }

  markChanged(employeeId: number, dayIndex: number, status: string): void {
    this.changedRecords.add(`${employeeId}_${dayIndex}`);
  }

  cycleStatus(emp: EmployeeAttendance, dayIdx: number): void {
    const order = ['', 'P', 'A', 'L', 'ML', 'H', 'WO', 'R', 'CO'];
    const cur = emp.days[dayIdx] || '';
    const nextIdx = (order.indexOf(cur) + 1) % order.length;
    emp.days[dayIdx] = order[nextIdx];
    this.markChanged(emp.employeeId, dayIdx, order[nextIdx]);
  }

  toggleEdit(): void {
    if (this.isEditMode) this.saveChanges();
    else { this.changedRecords.clear(); this.isEditMode = true; }
  }

  saveChanges(): void {
    if (!this.data) return;
    const records: AttendanceRecord[] = [];
    for (const emp of this.data.employees) {
      for (const key of this.changedRecords) {
        const [empId, dayIdx] = key.split('_').map(Number);
        if (empId === emp.employeeId && dayIdx < emp.days.length) {
          const status = emp.days[dayIdx] || '';
          if (status && this.data.dayColumns[dayIdx]) {
            records.push({ employeeId: emp.employeeId, date: this.data.dayColumns[dayIdx].date, status });
          }
        }
      }
    }
    if (records.length === 0) { this.isEditMode = false; this.msg.info('No changes'); return; }
    this.saving = true;
    this.attendanceService.bulkUpdate(records).subscribe({
      next: () => {
        this.msg.success(`Saved ${records.length} record(s)`);
        this.isEditMode = false; this.changedRecords.clear(); this.saving = false;
        this.loadData();
      },
      error: (err) => { this.msg.error(err.error?.message || 'Save failed'); this.saving = false; }
    });
  }

  exportExcel(): void {
    if (!this.fromDate || !this.toDate) return;
    const from = this.formatDate(this.fromDate);
    const to = this.formatDate(this.toDate);
    this.attendanceService.exportExcel(from, to).subscribe({
      next: (blob) => saveAs(blob, `Attendance_${from}_to_${to}.xlsx`),
      error: () => this.msg.error('Export failed')
    });
  }

  importExcel(event: Event): void {
    if (!this.fromDate || !this.toDate) return;
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const from = this.formatDate(this.fromDate);
    const to = this.formatDate(this.toDate);
    this.loading = true;
    this.attendanceService.importExcel(input.files[0], from, to).subscribe({
      next: (res) => {
        this.msg.success(`Imported ${res.data?.imported || 0} records`);
        this.loading = false; input.value = '';
        this.loadData();
      },
      error: (err) => { this.msg.error(err.error?.message || 'Import failed'); this.loading = false; input.value = ''; }
    });
  }

  dayColCount(): number { return this.data?.dayColumns?.length || 1; }

  isSunDay(index: number): boolean {
    return !!this.data?.dayColumns[index] && this.data.dayColumns[index].dayOfWeek === 'Sun';
  }

  sumColor(label: string): string {
    switch (label) {
      case 'Present': return '#52c41a';
      case 'Leaves': return '#fa8c16';
      case 'ML': return '#722ed1';
      case 'Resigns': return '#f5222d';
      default: return '#1890ff';
    }
  }

  statusBg(s: string): string {
    switch (s) {
      case 'P': return '#52c41a';
      case 'A': return '#f5222d';
      case 'L': return '#fa8c16';
      case 'ML': return '#722ed1';
      case 'H': return '#1890ff';
      case 'WO': return '#8c8c8c';
      case 'R': return '#cf1322';
      case 'CO': return '#13c2c2';
      default: return '#d9d9d9';
    }
  }

  statusFg(s: string): string {
    return '#fff';
  }
}
