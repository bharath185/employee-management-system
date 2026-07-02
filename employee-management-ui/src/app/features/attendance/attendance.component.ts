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
import { NzMessageService } from 'ng-zorro-antd/message';
import { AttendanceService } from '../../core/services/attendance.service';
import { MonthlyAttendance, EmployeeAttendance, AttendanceRecord } from '../../core/models/attendance.models';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzTableModule, NzButtonModule, NzSelectModule,
    NzIconModule, NzTagModule, NzPopoverModule, NzSpinModule, NzToolTipModule
  ],
  template: `
    <div class="att-container">
      <div class="att-header">
        <div class="att-title">
          <div class="att-brand">
            <div class="att-icon"><i nz-icon nzType="calendar"></i></div>
            <span class="att-logo">ATTENDANCE</span>
          </div>
          <span class="att-period">{{ data?.monthLabel || '' }}</span>
        </div>
        <div class="att-toolbar">
          <div class="month-nav">
            <button nz-button nzType="text" class="nav-btn" (click)="changeMonth(-1)">
              <i nz-icon nzType="left"></i>
            </button>
            <nz-select [(ngModel)]="selectedYear" (ngModelChange)="onFilterChange()" nzSize="small" nzBorderless style="width:68px">
              <nz-option *ngFor="let y of yearList" [nzValue]="y" [nzLabel]="y.toString()"></nz-option>
            </nz-select>
            <nz-select [(ngModel)]="selectedMonth" (ngModelChange)="onFilterChange()" nzSize="small" nzBorderless style="width:92px">
              <nz-option *ngFor="let m of monthList" [nzValue]="m.value" [nzLabel]="m.label.substring(0,3)"></nz-option>
            </nz-select>
            <button nz-button nzType="text" class="nav-btn" (click)="changeMonth(1)">
              <i nz-icon nzType="right"></i>
            </button>
          </div>
          <div class="toolbar-actions">
            <button nz-button nzSize="small" nz-tooltip="Download Excel" (click)="exportExcel()" [disabled]="loading">
              <i nz-icon nzType="download"></i>
            </button>
            <button nz-button nzSize="small" nz-tooltip="Import Excel" (click)="importFile.click()" [disabled]="loading">
              <i nz-icon nzType="upload"></i>
            </button>
            <input #importFile type="file" accept=".xlsx" style="display:none" (change)="importExcel($event)">
            <button nz-button nzSize="small" *ngIf="isCurrentMonth"
              [nzType]="isEditMode ? 'primary' : 'default'"
              class="edit-btn" [class.saving]="saving"
              (click)="toggleEdit()" [disabled]="saving">
              <i nz-icon nzType="save" *ngIf="isEditMode; else editIcon"></i>
              <ng-template #editIcon><i nz-icon nzType="edit"></i></ng-template>
              <span>{{ isEditMode ? (saving ? 'Saving...' : 'Save') : 'Edit' }}</span>
            </button>
          </div>
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
                <span class="th-month">{{ data?.monthLabel || '' }}</span>
                <span class="th-range">26 {{ prevMonthAbbr }} - 25 {{ curMonthAbbr }}</span>
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
                <nz-select *ngIf="isEditMode"
                  [ngModel]="emp.days[di]"
                  (ngModelChange)="onDayChange(emp, di, $event)"
                  nzSize="small"
                  class="day-select"
                  [nzDropdownMatchSelectWidth]="false"
                  nzDropdownClassName="att-dropdown"
                  [ngModelOptions]="{standalone: true}">
                    <nz-option nzValue="" nzLabel="—" nzCustomContent>
                      <span class="opt-blank">—</span>
                    </nz-option>
                    <nz-option nzValue="P" nzLabel="P" nzCustomContent>
                      <span class="opt-p">P</span>
                    </nz-option>
                    <nz-option nzValue="A" nzLabel="A" nzCustomContent>
                      <span class="opt-a">A</span>
                    </nz-option>
                    <nz-option nzValue="L" nzLabel="L" nzCustomContent>
                      <span class="opt-l">L</span>
                    </nz-option>
                    <nz-option nzValue="ML" nzLabel="ML" nzCustomContent>
                      <span class="opt-ml">ML</span>
                    </nz-option>
                    <nz-option nzValue="H" nzLabel="H" nzCustomContent>
                      <span class="opt-h">H</span>
                    </nz-option>
                    <nz-option nzValue="WO" nzLabel="WO" nzCustomContent>
                      <span class="opt-wo">WO</span>
                    </nz-option>
                    <nz-option nzValue="R" nzLabel="R" nzCustomContent>
                      <span class="opt-r">R</span>
                    </nz-option>
                    <nz-option nzValue="CO" nzLabel="CO" nzCustomContent>
                      <span class="opt-co">CO</span>
                    </nz-option>
                  </nz-select>
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
    .att-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px; padding:12px 16px; background:linear-gradient(135deg,#1f3d6e 0%,#16213e 100%); border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,.12); }
    .att-title { display:flex; align-items:center; gap:12px; }
    .att-brand { display:flex; align-items:center; gap:8px; }
    .att-icon { width:32px; height:32px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.15); border-radius:8px; color:#fff; font-size:16px; }
    .att-logo { font-size:17px; font-weight:800; color:#fff; letter-spacing:1.5px; }
    .att-period { font-size:13px; color:rgba(255,255,255,.65); font-weight:500; padding:2px 10px; background:rgba(255,255,255,.1); border-radius:12px; }
    .att-toolbar { display:flex; align-items:center; gap:6px; }
    .month-nav { display:flex; align-items:center; gap:2px; background:rgba(255,255,255,.12); border-radius:8px; padding:2px 4px; }
    .nav-btn { width:28px; height:28px; display:flex; align-items:center; justify-content:center; border-radius:6px; color:rgba(255,255,255,.75); border:none; background:transparent; cursor:pointer; transition:all .2s; }
    .nav-btn:hover { background:rgba(255,255,255,.18); color:#fff; }
    .month-nav ::ng-deep .ant-select { background:transparent; }
    .month-nav ::ng-deep .ant-select-selection-item { color:rgba(255,255,255,.9) !important; font-weight:600; font-size:12px; }
    .month-nav ::ng-deep .ant-select-arrow { color:rgba(255,255,255,.5); }
    .toolbar-actions { display:flex; align-items:center; gap:5px; }
    .toolbar-actions button { height:30px; font-size:12px; border-radius:6px; border:none; background:rgba(255,255,255,.12); color:rgba(255,255,255,.8); padding:0 10px; transition:all .2s; }
    .toolbar-actions button:hover:not(:disabled) { background:rgba(255,255,255,.2); color:#fff; }
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
    .status-p { background:linear-gradient(135deg,#52c41a,#73d13d); }
    .status-a { background:linear-gradient(135deg,#f5222d,#ff4d4f); }
    .status-l { background:linear-gradient(135deg,#fa8c16,#ffa940); }
    .status-ml { background:linear-gradient(135deg,#722ed1,#9254de); }
    .status-h { background:linear-gradient(135deg,#1890ff,#40a9ff); }
    .status-wo { background:linear-gradient(135deg,#8c8c8c,#a6a6a6); }
    .status-r { background:linear-gradient(135deg,#cf1322,#f5222d); }
    .status-co { background:linear-gradient(135deg,#13c2c2,#36cfc9); }
    .day-empty { color:#e8e8e8; font-size:14px; }
    .day-select { width:36px !important; }
    .day-select ::ng-deep .ant-select-arrow { display: none !important; }
    .day-select ::ng-deep .ant-select-selection-item { text-align:center; padding-right:0 !important; }
    .day-select ::ng-deep .ant-select-selection-item { font-size:11px; font-weight:700; text-align:center; }
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
  selectedYear: number;
  selectedMonth: number;
  currentCycleYear: number;
  currentCycleMonth: number;
  page = 0;
  size = 50;
  data: MonthlyAttendance | null = null;
  isEditMode = false;
  changedRecords: Set<string> = new Set();
  scrollX = '';

  yearList: number[] = [];

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
  monthList = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

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

  get prevMonthAbbr(): string {
    const m = this.selectedMonth === 1 ? 12 : this.selectedMonth - 1;
    return this.monthList[m - 1].label.substring(0, 3);
  }

  get curMonthAbbr(): string {
    return this.monthList[this.selectedMonth - 1].label.substring(0, 3);
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

  onPageIndexChange(index: number): void { this.page = index - 1; this.loadData(); }
  onPageSizeChange(size: number): void { this.size = size; this.page = 0; this.loadData(); }

  loadData(): void {
    this.loading = true;
    this.attendanceService.getMonthlyAttendance(this.selectedYear, this.selectedMonth, this.page, this.size).subscribe({
      next: (res) => {
        this.data = res.data;
        const cols = 2 + (this.data?.dayColumns?.length || 30) + 4;
        this.scrollX = (cols * 34 + 80).toString();
        this.loading = false;
      },
      error: () => { this.loading = false; this.msg.error('Failed to load data'); }
    });
  }

  markChanged(employeeId: number, dayIndex: number, status: string): void {
    this.changedRecords.add(`${employeeId}_${dayIndex}`);
  }

  onDayChange(emp: EmployeeAttendance, dayIndex: number, status: string): void {
    emp.days[dayIndex] = status;
    this.markChanged(emp.employeeId, dayIndex, status);
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
