import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { StatutoryReportService } from '../../core/services/statutory-report.service';
import { LabourReportService } from '../../core/services/labour-report.service';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';

@Component({
  selector: 'app-labour-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzTabsModule, NzCardModule, NzButtonModule,
    NzSelectModule, NzIconModule, NzSpinModule, NzTableModule, NzTagModule,
    NzModalModule
  ],
  template: `
    <div class="lr-container">
      <div class="pp-sub-nav" *ngIf="showHeader">
        <span class="pp-nav-item active">
          <i nz-icon nzType="file-text"></i><span>Labour Reports</span>
        </span>
      </div>

      <nz-tabset nzType="card" class="lr-tabs" [nzAnimated]="false">

        <!-- Tab 1: Worker Details -->
        <nz-tab nzTitle="Register of Employment">
          <nz-card class="lr-controls-card" nzSize="small">
            <div class="lr-filters">
              <div class="filter-item">
                <label>Year</label>
                <nz-select [(ngModel)]="selectedYear" class="filter-select" style="width:110px">
                  <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
                </nz-select>
              </div>
              <div class="filter-item">
                <label>Month</label>
                <nz-select [(ngModel)]="selectedMonth" class="filter-select" style="width:130px">
                  <nz-option *ngFor="let m of months" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
                </nz-select>
              </div>
              <button nz-button nzType="primary" (click)="openReport('worker-details')" [nzLoading]="loading1">
                <i nz-icon nzType="eye"></i> Preview
              </button>
              <button nz-button nzType="default" (click)="downloadExcel('worker-details')" [nzLoading]="excelLoading1">
                <i nz-icon nzType="download"></i> Export
              </button>
            </div>
          </nz-card>
        </nz-tab>

        <!-- Tab 2: Wage Register -->
        <nz-tab nzTitle="Wage Register">
          <nz-card class="lr-controls-card" nzSize="small">
            <div class="lr-filters">
              <div class="filter-item">
                <label>Year</label>
                <nz-select [(ngModel)]="selectedYear2" class="filter-select" style="width:110px">
                  <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
                </nz-select>
              </div>
              <div class="filter-item">
                <label>Month</label>
                <nz-select [(ngModel)]="selectedMonth2" class="filter-select" style="width:130px">
                  <nz-option *ngFor="let m of months" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
                </nz-select>
              </div>
              <button nz-button nzType="primary" (click)="openReport('wages-register')" [nzLoading]="loading2">
                <i nz-icon nzType="eye"></i> Preview
              </button>
              <button nz-button nzType="default" (click)="downloadExcel('wages-register')" [nzLoading]="excelLoading2">
                <i nz-icon nzType="download"></i> Export
              </button>
            </div>
          </nz-card>
        </nz-tab>

        <!-- Tab 3: Leave Register -->
        <nz-tab nzTitle="Leave Register (Form XXV)">
          <nz-card class="lr-controls-card" nzSize="small">
            <div class="lr-filters">
              <div class="filter-item">
                <label>Year</label>
                <nz-select [(ngModel)]="selectedYear3" class="filter-select" style="width:110px">
                  <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
                </nz-select>
              </div>
              <div class="filter-item" style="flex:2">
                <label>Employees</label>
                <nz-select [(ngModel)]="selectedEmployees3" class="filter-select" nzMode="multiple" [nzMaxTagCount]="2">
                  <nz-option *ngFor="let e of employeeList" [nzValue]="e.id" [nzLabel]="e.employeeCode + ' - ' + e.fullName"></nz-option>
                </nz-select>
              </div>
              <button nz-button nzType="primary" (click)="openReport('leave-register')" [nzLoading]="loading3">
                <i nz-icon nzType="eye"></i> Preview
              </button>
              <button nz-button nzType="default" (click)="downloadExcel('leave-register')" [nzLoading]="excelLoading3">
                <i nz-icon nzType="download"></i> Export
              </button>
            </div>
          </nz-card>
        </nz-tab>

        <!-- Tab 4: Attendance Register (Muster Roll) -->
        <nz-tab nzTitle="Attendance Register">
          <nz-card class="lr-controls-card" nzSize="small">
            <div class="lr-filters">
              <div class="filter-item">
                <label>Year</label>
                <nz-select [(ngModel)]="selectedYear4" class="filter-select" style="width:110px">
                  <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
                </nz-select>
              </div>
              <div class="filter-item">
                <label>Month</label>
                <nz-select [(ngModel)]="selectedMonth4" class="filter-select" style="width:130px">
                  <nz-option *ngFor="let m of months" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
                </nz-select>
              </div>
              <button nz-button nzType="primary" (click)="openReport('attendance-register')" [nzLoading]="loading4">
                <i nz-icon nzType="eye"></i> Preview
              </button>
              <button nz-button nzType="default" (click)="downloadExcel('attendance-register')" [nzLoading]="excelLoading4">
                <i nz-icon nzType="download"></i> Export
              </button>
            </div>
          </nz-card>
        </nz-tab>

        <!-- Tab 4: Bonus Register -->
        <nz-tab nzTitle="Bonus Register">
          <div class="lr-tab-content">
            <nz-card class="lr-controls-card" nzSize="small">
              <div class="lr-filters">
                <div class="filter-item">
                  <label>Year</label>
                  <nz-select [(ngModel)]="bonusYear" class="filter-select" style="width:110px">
                    <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
                  </nz-select>
                </div>
                <div class="filter-item">
                  <label>Month</label>
                  <nz-select [(ngModel)]="bonusMonth" class="filter-select" style="width:130px">
                    <nz-option *ngFor="let m of months" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
                  </nz-select>
                </div>
                <button nz-button nzType="primary" (click)="loadBonusRegister()" [nzLoading]="bonusLoading">
                  <i nz-icon nzType="search"></i> Load
                </button>
              </div>
            </nz-card>
            <nz-card class="lr-table-card" nzSize="small">
              <nz-table #bonusTbl [nzData]="bonusData" [nzLoading]="bonusLoading" nzSize="small" [nzPageSize]="20" [nzShowPagination]="bonusData.length > 20">
                <thead>
                  <tr>
                    <th>Emp Code</th><th>Name</th><th>Designation</th>
                    <th class="th-right">Basic</th><th class="th-right">HRA</th>
                    <th class="th-right">Other Allow</th><th class="th-right">Personal Allow</th>
                    <th class="th-right">Gross</th><th class="th-right">Deductions</th>
                    <th class="th-right">Net Pay</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let r of bonusTbl.data">
                    <td><span class="emp-cell">{{ r.employeeCode }}</span></td>
                    <td>{{ r.employeeName }}</td>
                    <td>{{ r.designation }}</td>
                    <td class="td-right">{{ r.basic }}</td><td class="td-right">{{ r.hra }}</td>
                    <td class="td-right">{{ r.otherAllowance }}</td><td class="td-right">{{ r.personalAllowance }}</td>
                    <td class="td-right"><b>{{ r.grossSalary }}</b></td>
                    <td class="td-right">{{ r.totalDeductions }}</td>
                    <td class="td-right"><b>{{ r.netPay }}</b></td>
                  </tr>
                </tbody>
              </nz-table>
              <p class="empty-tbl" *ngIf="bonusData.length === 0 && !bonusLoading">No data for this period</p>
            </nz-card>
          </div>
        </nz-tab>

        <!-- Tab 5: Over Time Register -->
        <nz-tab nzTitle="Over Time Register">
          <div class="lr-tab-content">
            <nz-card class="lr-controls-card" nzSize="small">
              <div class="lr-filters">
                <div class="filter-item">
                  <label>Year</label>
                  <nz-select [(ngModel)]="otYear" class="filter-select" style="width:110px">
                    <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
                  </nz-select>
                </div>
                <div class="filter-item">
                  <label>Month</label>
                  <nz-select [(ngModel)]="otMonth" class="filter-select" style="width:130px">
                    <nz-option *ngFor="let m of months" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
                  </nz-select>
                </div>
                <button nz-button nzType="primary" (click)="loadOvertimeRegister()" [nzLoading]="otLoading">
                  <i nz-icon nzType="search"></i> Load
                </button>
              </div>
            </nz-card>
            <nz-card class="lr-table-card" nzSize="small">
              <nz-table #otTbl [nzData]="otData" [nzLoading]="otLoading" nzSize="small" [nzPageSize]="20" [nzShowPagination]="otData.length > 20">
                <thead>
                  <tr>
                    <th>Emp Code</th><th>Name</th><th>Designation</th><th>Department</th>
                    <th class="th-right">OT Hours</th><th class="th-right">OT Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let r of otTbl.data">
                    <td><span class="emp-cell">{{ r.employeeCode }}</span></td>
                    <td>{{ r.employeeName }}</td>
                    <td>{{ r.designation }}</td>
                    <td>{{ r.department }}</td>
                    <td class="td-right">{{ r.overtimeHours }}</td>
                    <td class="td-right">{{ r.overtimeAmount }}</td>
                  </tr>
                </tbody>
              </nz-table>
              <p class="empty-tbl" *ngIf="otData.length === 0 && !otLoading">No data for this period</p>
            </nz-card>
          </div>
        </nz-tab>

        <!-- Tab 6: Compensatory Off Register -->
        <nz-tab nzTitle="Comp Off Register">
          <div class="lr-tab-content">
            <nz-card class="lr-controls-card" nzSize="small">
              <div class="lr-filters">
                <div class="filter-item">
                  <label>Year</label>
                  <nz-select [(ngModel)]="compOffYear" class="filter-select" style="width:110px">
                    <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
                  </nz-select>
                </div>
                <button nz-button nzType="primary" (click)="loadCompOffRegister()" [nzLoading]="compOffLoading">
                  <i nz-icon nzType="search"></i> Load
                </button>
              </div>
            </nz-card>
            <nz-card class="lr-table-card" nzSize="small">
              <nz-table #compOffTbl [nzData]="compOffData" [nzLoading]="compOffLoading" nzSize="small" [nzPageSize]="20" [nzShowPagination]="compOffData.length > 20">
                <thead>
                  <tr>
                    <th>Emp Code</th><th>Name</th><th>Earned Date</th>
                    <th>Status</th><th>Availed Date</th><th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let r of compOffTbl.data">
                    <td><span class="emp-cell">{{ r.employeeCode }}</span></td>
                    <td>{{ r.employeeName }}</td>
                    <td>{{ r.earnedDate }}</td>
                    <td><nz-tag [nzColor]="r.status === 'EARNED' ? 'blue' : 'green'">{{ r.status }}</nz-tag></td>
                    <td>{{ r.availedDate || '—' }}</td>
                    <td>{{ r.remarks || '—' }}</td>
                  </tr>
                </tbody>
              </nz-table>
              <p class="empty-tbl" *ngIf="compOffData.length === 0 && !compOffLoading">No comp-off records found</p>
            </nz-card>
          </div>
        </nz-tab>

      </nz-tabset>

      <!-- Report Preview Modal -->
      <nz-modal
        [(nzVisible)]="previewModalVisible"
        [nzTitle]="previewTitle"
        [nzWidth]="'94vw'"
        [nzFooter]="previewFooter"
        (nzOnCancel)="closePreviewModal()"
        [nzBodyStyle]="{ padding: '0', height: '78vh' }">
        <ng-container *nzModalContent>
          <iframe #previewFrame [srcdoc]="previewHtml" style="width:100%;height:100%;border:none;"></iframe>
        </ng-container>
      </nz-modal>
      <ng-template #previewFooter>
        <div style="display:flex;justify-content:space-between;align-items:center;width:100%">
          <button nz-button nzType="default" (click)="openInNewTab()">
            <i nz-icon nzType="export"></i> Open in New Tab
          </button>
          <div>
            <button nz-button nzType="primary" (click)="printPreview()" style="margin-right:8px">
              <i nz-icon nzType="printer"></i> Print / Save PDF
            </button>
            <button nz-button nzType="default" (click)="closePreviewModal()">Close</button>
          </div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .lr-container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 0 16px 16px; }
    .pp-sub-nav {
      display: flex; gap: 2px; margin-bottom: 8px; background: #f0f4ff;
      border-radius: 10px; padding: 4px; border: 1px solid #e0e7ff;
    }
    .pp-nav-item {
      display: flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 6px;
      font-size: 12px; font-weight: 500; color: #6c757d; cursor: default;
    }
    .pp-nav-item.active { background: linear-gradient(135deg, #4361ee, #3a0ca3); color: #fff; box-shadow: 0 2px 6px rgba(67, 97, 238, 0.3); }
    .pp-nav-item.active i { color: #fff; }
    .pp-nav-item i { font-size: 14px; }

    .lr-tabs { margin-top: 0; }
    :host ::ng-deep .lr-tabs > .ant-tabs-nav { margin-bottom: 8px; }
    :host ::ng-deep .lr-tabs > .ant-tabs-nav .ant-tabs-tab { border-radius: 8px 8px 0 0 !important; font-size: 13px; padding: 8px 16px !important; }

    .lr-controls-card {
      background: #fff !important;
      border: 1px solid #e8eaed !important;
      border-radius: 8px !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06) !important;
      margin-bottom: 12px;
    }
    :host ::ng-deep .lr-controls-card .ant-card-body { padding: 12px 20px; }
    .lr-filters { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
    .filter-item { display: flex; flex-direction: column; gap: 4px; }
    .filter-item label { font-size: 11px; color: #6c757d; font-weight: 500; text-transform: uppercase; letter-spacing: .3px; }
    .filter-select { min-width: 110px; }
    :host ::ng-deep .filter-select .ant-select-selector { border-radius: 8px !important; border: 1px solid #e2e5ea !important; height: 34px !important; }
    :host ::ng-deep .lr-filters button { border-radius: 8px; height: 34px; font-size: 13px; font-weight: 600; }

    .lr-tab-content { padding-top: 4px; }
    .lr-table-card {
      background: #fff !important;
      border: 1px solid #e8eaed !important;
      border-radius: 8px !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06) !important;
      overflow: hidden;
    }
    :host ::ng-deep .lr-table-card .ant-card-body { padding: 16px; }

    :host ::ng-deep .lr-table-card .ant-table { font-size: 13px; }
    :host ::ng-deep .lr-table-card .ant-table-thead > tr > th {
      background: #f8f9fc !important; color: #1f3d6e !important; font-size: 11px !important;
      font-weight: 700 !important; padding: 10px 12px !important; border-bottom: 2px solid #e8eaed !important;
    }
    :host ::ng-deep .lr-table-card .ant-table-tbody > tr > td {
      padding: 8px 12px !important; border-bottom: 1px solid #f0f2f5 !important; color: #374151;
    }
    :host ::ng-deep .lr-table-card .ant-table-tbody > tr:hover > td { background: rgba(31, 61, 110, 0.03) !important; }
    .th-right { text-align: right !important; }
    .td-right { text-align: right !important; }
    .emp-cell { font-weight: 600; color: #1f3d6e; }
    .empty-tbl { text-align: center; color: #9ca3af; padding: 16px; }
  `]
})
export class LabourReportsComponent implements OnInit {
  @Input() showHeader = true;
  years: number[] = [];
  months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  selectedYear = new Date().getFullYear(); selectedMonth = new Date().getMonth() + 1;
  selectedYear2 = new Date().getFullYear(); selectedMonth2 = new Date().getMonth() + 1;
  selectedYear3 = new Date().getFullYear();
  selectedYear4 = new Date().getFullYear(); selectedMonth4 = new Date().getMonth() + 1;
  selectedEmployees3: number[] = [];
  employeeList: { id: number; fullName: string; employeeCode: string }[] = [];

  bonusYear = new Date().getFullYear(); bonusMonth = new Date().getMonth() + 1;
  otYear = new Date().getFullYear(); otMonth = new Date().getMonth() + 1;
  compOffYear = new Date().getFullYear();

  bonusData: any[] = []; otData: any[] = []; compOffData: any[] = [];
  loading1 = false; loading2 = false; loading3 = false; loading4 = false;
  excelLoading1 = false; excelLoading2 = false; excelLoading3 = false; excelLoading4 = false;
  bonusLoading = false; otLoading = false; compOffLoading = false;

  constructor(
    private reportService: StatutoryReportService,
    private labourService: LabourReportService,
    public authService: AuthService,
    private msg: NzMessageService,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    this.years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    this.employeeService.getEmployees({ size: 200 }).subscribe({
      next: (res: any) => {
        const list = res.data?.content || res.data || [];
        this.employeeList = list.map((e: any) => ({
          id: e.id, fullName: e.fullName || (e.firstName + ' ' + e.surname), employeeCode: e.employeeCode
        }));
      }
    });
  }

  previewModalVisible = false;
  previewTitle = '';
  previewHtml = '';
  previewBlobUrl: string | null = null;

  openReport(type: string): void {
    let setter: (v: boolean) => void;
    let title = '';
    if (type === 'worker-details') {
      setter = (v) => this.loading1 = v;
      title = `Register of Employment (${this.getMonthName(this.selectedMonth)} ${this.selectedYear})`;
    } else if (type === 'wages-register') {
      setter = (v) => this.loading2 = v;
      title = `Wages Register (${this.getMonthName(this.selectedMonth2)} ${this.selectedYear2})`;
    } else if (type === 'attendance-register') {
      setter = (v) => this.loading4 = v;
      title = `Attendance Register (${this.getMonthName(this.selectedMonth4)} ${this.selectedYear4})`;
    } else {
      setter = (v) => this.loading3 = v;
      title = `Form XXV Leave Register (${this.selectedYear3})`;
    }
    setter(true);
    const done = () => setter(false);

    let obs: any;
    if (type === 'worker-details') obs = this.reportService.getIndividualWorkerDetails(this.selectedYear, this.selectedMonth);
    else if (type === 'wages-register') obs = this.reportService.getWagesRegister(this.selectedYear2, this.selectedMonth2);
    else if (type === 'attendance-register') obs = this.reportService.getAttendanceRegister(this.selectedYear4, this.selectedMonth4);
    else obs = this.reportService.getLeaveRegister(this.selectedYear3);

    obs.subscribe({
      next: (res: any) => {
        if (!res.data) { this.msg.warning('No data available for selected period'); done(); return; }
        this.previewTitle = title;
        this.previewHtml = res.data;
        if (this.previewBlobUrl) {
          window.URL.revokeObjectURL(this.previewBlobUrl);
        }
        const blob = new Blob([res.data], { type: 'text/html;charset=utf-8' });
        this.previewBlobUrl = window.URL.createObjectURL(blob);
        this.previewModalVisible = true;
        done();
      },
      error: () => { this.msg.error('Failed to generate report preview'); done(); }
    });
  }

  openInNewTab(): void {
    if (this.previewBlobUrl) {
      window.open(this.previewBlobUrl, '_blank');
    }
  }

  printPreview(): void {
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  }

  closePreviewModal(): void {
    this.previewModalVisible = false;
  }

  getMonthName(m: number): string {
    const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return names[m - 1] || '';
  }

  downloadExcel(type: string): void {
    let setter: (v: boolean) => void;
    if (type === 'worker-details') setter = (v) => this.excelLoading1 = v;
    else if (type === 'wages-register') setter = (v) => this.excelLoading2 = v;
    else if (type === 'attendance-register') setter = (v) => this.excelLoading4 = v;
    else setter = (v) => this.excelLoading3 = v;
    setter(true);
    const done = () => setter(false);

    let obs: any, filename: string;
    if (type === 'worker-details') {
      obs = this.reportService.downloadIndividualWorkerDetailsExcel(this.selectedYear, this.selectedMonth);
      filename = `Individual_Worker_Details_${this.selectedYear}_${this.selectedMonth}.xlsx`;
    } else if (type === 'wages-register') {
      obs = this.reportService.downloadWagesRegisterExcel(this.selectedYear2, this.selectedMonth2);
      filename = `Wages_Register_${this.selectedYear2}_${this.selectedMonth2}.xlsx`;
    } else if (type === 'attendance-register') {
      obs = this.reportService.downloadAttendanceRegisterExcel(this.selectedYear4, this.selectedMonth4);
      filename = `Attendance_Register_${this.selectedYear4}_${this.selectedMonth4}.xlsx`;
    } else {
      obs = this.reportService.downloadLeaveRegisterExcel(this.selectedYear3, this.selectedEmployees3);
      filename = `Leave_Register_${this.selectedYear3}.xlsx`;
    }

    obs.subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.msg.success('Excel downloaded');
        done();
      },
      error: () => { this.msg.error('Failed to download'); done(); }
    });
  }

  loadBonusRegister(): void {
    this.bonusLoading = true;
    this.labourService.getBonusRegister(this.bonusYear, this.bonusMonth).subscribe({
      next: (res) => { this.bonusData = res.data || []; this.bonusLoading = false; },
      error: () => { this.msg.error('Failed to load bonus register'); this.bonusLoading = false; }
    });
  }

  loadOvertimeRegister(): void {
    this.otLoading = true;
    this.labourService.getOvertimeRegister(this.otYear, this.otMonth).subscribe({
      next: (res) => { this.otData = res.data || []; this.otLoading = false; },
      error: () => { this.msg.error('Failed to load overtime register'); this.otLoading = false; }
    });
  }

  loadCompOffRegister(): void {
    this.compOffLoading = true;
    this.labourService.getCompOffRegister(this.compOffYear).subscribe({
      next: (res) => { this.compOffData = res.data || []; this.compOffLoading = false; },
      error: () => { this.msg.error('Failed to load comp-off register'); this.compOffLoading = false; }
    });
  }
}
