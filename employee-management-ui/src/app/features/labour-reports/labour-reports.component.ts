import { Component, OnInit } from '@angular/core';
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
import { StatutoryReportService } from '../../core/services/statutory-report.service';
import { LabourReportService } from '../../core/services/labour-report.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';

@Component({
  selector: 'app-labour-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzTabsModule, NzCardModule, NzButtonModule, 
    NzSelectModule, NzIconModule, NzSpinModule, NzTableModule, NzTagModule, PageHeaderComponent
  ],
  template: `
    <div class="labour-reports-container page-enter">
      <app-page-header icon="file-text" title="Labour Reports"></app-page-header>
      
      <nz-tabset nzType="card" class="labour-tabs" [nzAnimated]="false">
        <!-- Register of Employment -->
        <nz-tab nzTitle="Register of Employment">
          <div class="report-tab-content">
            <div class="sr-card">
              <div class="sr-card-header">
                <i nz-icon nzType="user" class="sr-card-icon"></i>
                <span class="sr-card-title">Individual Worker Details</span>
              </div>
              <p class="sr-card-desc">Show employee-wise wage summary for a given month.</p>
              <div class="sr-controls">
                <nz-select [(ngModel)]="selectedYear" class="sr-select" nzPlaceHolder="Year">
                  <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
                </nz-select>
                <nz-select [(ngModel)]="selectedMonth" class="sr-select" nzPlaceHolder="Month">
                  <nz-option *ngFor="let m of months" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
                </nz-select>
                <button nz-button class="sr-btn-primary" [nzLoading]="loading1" (click)="openReport('worker-details')">
                  <i nz-icon nzType="file-text"></i> Preview
                </button>
                <button nz-button class="sr-btn-excel" [nzLoading]="excelLoading1" (click)="downloadExcel('worker-details')">
                  <i nz-icon nzType="download"></i> Excel
                </button>
              </div>
            </div>
          </div>
        </nz-tab>

        <!-- Wage Register -->
        <nz-tab nzTitle="Wage Register">
          <div class="report-tab-content">
            <div class="sr-card">
              <div class="sr-card-header">
                <i nz-icon nzType="dollar" class="sr-card-icon"></i>
                <span class="sr-card-title">Wages Register</span>
              </div>
              <p class="sr-card-desc">Detailed salary breakdown with PF, ESI, PT deductions.</p>
              <div class="sr-controls">
                <nz-select [(ngModel)]="selectedYear2" class="sr-select" nzPlaceHolder="Year">
                  <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
                </nz-select>
                <nz-select [(ngModel)]="selectedMonth2" class="sr-select" nzPlaceHolder="Month">
                  <nz-option *ngFor="let m of months" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
                </nz-select>
                <button nz-button class="sr-btn-primary" [nzLoading]="loading2" (click)="openReport('wages-register')">
                  <i nz-icon nzType="file-text"></i> Preview
                </button>
                <button nz-button class="sr-btn-excel" [nzLoading]="excelLoading2" (click)="downloadExcel('wages-register')">
                  <i nz-icon nzType="download"></i> Excel
                </button>
              </div>
            </div>
          </div>
        </nz-tab>
        
        <!-- Leave Register -->
        <nz-tab nzTitle="Leave Register">
          <div class="report-tab-content">
            <div class="sr-card">
              <div class="sr-card-header">
                <i nz-icon nzType="calendar" class="sr-card-icon"></i>
                <span class="sr-card-title">Form XXV - Register of Leave</span>
              </div>
              <p class="sr-card-desc">AP Shops &amp; Establishments leave register format.</p>
              <div class="sr-controls">
                <nz-select [(ngModel)]="selectedYear3" class="sr-select" nzPlaceHolder="Year">
                  <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
                </nz-select>
                <nz-select [(ngModel)]="selectedEmployees3" class="sr-select-emp" nzPlaceHolder="All Employees" nzMode="multiple" [nzMaxTagCount]="2" [nzMaxTagPlaceholder]="tagPlaceholder">
                  <nz-option *ngFor="let e of employeeList" [nzValue]="e.id" [nzLabel]="e.employeeCode + ' - ' + e.fullName"></nz-option>
                </nz-select>
                <ng-template #tagPlaceholder>more</ng-template>
                <button nz-button class="sr-btn-primary" [nzLoading]="loading3" (click)="openReport('leave-register')">
                  <i nz-icon nzType="file-text"></i> Preview
                </button>
                <button nz-button class="sr-btn-excel" [nzLoading]="excelLoading3" (click)="downloadExcel('leave-register')">
                  <i nz-icon nzType="download"></i> Excel
                </button>
              </div>
            </div>
          </div>
        </nz-tab>

        <!-- Bonus Register -->
        <nz-tab nzTitle="Bonus Register">
          <div class="report-tab-content">
            <div class="tb-filters">
              <nz-select [(ngModel)]="bonusYear" class="sr-select" nzPlaceHolder="Year">
                <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
              </nz-select>
              <nz-select [(ngModel)]="bonusMonth" class="sr-select" nzPlaceHolder="Month">
                <nz-option *ngFor="let m of months" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
              </nz-select>
              <button nz-button class="sr-btn-primary" [nzLoading]="bonusLoading" (click)="loadBonusRegister()">
                <i nz-icon nzType="search"></i> Load
              </button>
            </div>
            <nz-table #bonusTbl [nzData]="bonusData" [nzLoading]="bonusLoading" class="theme-table" nzSize="small" [nzPageSize]="20">
              <thead>
                <tr>
                  <th>Emp Code</th><th>Name</th><th>Designation</th>
                  <th class="td-right">Basic</th><th class="td-right">HRA</th>
                  <th class="td-right">Other Allow</th><th class="td-right">Personal Allow</th>
                  <th class="td-right">Gross</th><th class="td-right">Deductions</th>
                  <th class="td-right">Net Pay</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let r of bonusTbl.data">
                  <td><span class="emp-cell">{{ r.employeeCode }}</span></td>
                  <td>{{ r.employeeName }}</td>
                  <td>{{ r.designation }}</td>
                  <td class="td-right">{{ r.basic }}</td>
                  <td class="td-right">{{ r.hra }}</td>
                  <td class="td-right">{{ r.otherAllowance }}</td>
                  <td class="td-right">{{ r.personalAllowance }}</td>
                  <td class="td-right"><strong>{{ r.grossSalary }}</strong></td>
                  <td class="td-right">{{ r.totalDeductions }}</td>
                  <td class="td-right"><strong>{{ r.netPay }}</strong></td>
                </tr>
                <tr *ngIf="bonusData.length === 0 && !bonusLoading">
                  <td colspan="10" class="empty-cell">No data for this period</td>
                </tr>
              </tbody>
            </nz-table>
          </div>
        </nz-tab>

        <!-- Over Time Register -->
        <nz-tab nzTitle="Over Time Register">
          <div class="report-tab-content">
            <div class="tb-filters">
              <nz-select [(ngModel)]="otYear" class="sr-select" nzPlaceHolder="Year">
                <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
              </nz-select>
              <nz-select [(ngModel)]="otMonth" class="sr-select" nzPlaceHolder="Month">
                <nz-option *ngFor="let m of months" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
              </nz-select>
              <button nz-button class="sr-btn-primary" [nzLoading]="otLoading" (click)="loadOvertimeRegister()">
                <i nz-icon nzType="search"></i> Load
              </button>
            </div>
            <nz-table #otTbl [nzData]="otData" [nzLoading]="otLoading" class="theme-table" nzSize="small" [nzPageSize]="20">
              <thead>
                <tr>
                  <th>Emp Code</th><th>Name</th><th>Designation</th><th>Department</th>
                  <th class="td-right">OT Hours</th><th class="td-right">OT Amount</th>
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
                <tr *ngIf="otData.length === 0 && !otLoading">
                  <td colspan="6" class="empty-cell">No data for this period</td>
                </tr>
              </tbody>
            </nz-table>
          </div>
        </nz-tab>

        <!-- Compensatory Off Register -->
        <nz-tab nzTitle="Compensatory Off Register">
          <div class="report-tab-content">
            <div class="tb-filters">
              <nz-select [(ngModel)]="compOffYear" class="sr-select" nzPlaceHolder="Year">
                <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
              </nz-select>
              <button nz-button class="sr-btn-primary" [nzLoading]="compOffLoading" (click)="loadCompOffRegister()">
                <i nz-icon nzType="search"></i> Load
              </button>
            </div>
            <nz-table #compOffTbl [nzData]="compOffData" [nzLoading]="compOffLoading" class="theme-table" nzSize="small" [nzPageSize]="20">
              <thead>
                <tr>
                  <th>Emp Code</th><th>Name</th><th>Earned Date</th>
                  <th>Expiry Date</th><th>Status</th><th>Availed Date</th><th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let r of compOffTbl.data">
                  <td><span class="emp-cell">{{ r.employeeCode }}</span></td>
                  <td>{{ r.employeeName }}</td>
                  <td>{{ r.earnedDate }}</td>
                  <td>{{ r.expiryDate }}</td>
                  <td><nz-tag [nzColor]="r.status === 'EARNED' ? 'blue' : r.status === 'AVAILED' ? 'green' : 'orange'">{{ r.status }}</nz-tag></td>
                  <td>{{ r.availedDate }}</td>
                  <td>{{ r.remarks }}</td>
                </tr>
                <tr *ngIf="compOffData.length === 0 && !compOffLoading">
                  <td colspan="7" class="empty-cell">No comp-off records found</td>
                </tr>
              </tbody>
            </nz-table>
          </div>
        </nz-tab>
      </nz-tabset>
    </div>
  `,
  styles: [`
    .labour-reports-container { padding: 16px; }
    .report-tab-content { padding: 8px 0; }
    .tb-filters { display: flex; gap: 8px; align-items: center; margin-bottom: 14px; }
    .page-enter { animation: fadeSlideUp .35s ease-out; }
    @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

    .sr-card { background: #fff; border: 1px solid #e8eaed; border-radius: 10px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,.06); max-width: 500px;}
    .sr-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .sr-card-icon { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1f3d6e, #2a4a8a); border-radius: 6px; color: #fff; font-size: 14px; flex-shrink: 0; }
    .sr-card-title { font-size: 15px; font-weight: 700; color: #1f3d6e; letter-spacing: .2px; }
    .sr-card-desc { font-size: 13px; color: #777; margin: 0 0 14px; line-height: 1.5; }
    .sr-controls { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .sr-select { width: 110px; }
    .sr-select-emp { min-width: 200px; flex: 1; }
    .sr-select ::ng-deep .ant-select-selector, .sr-select-emp ::ng-deep .ant-select-selector { height: 32px !important; border-radius: 6px !important; border: 1px solid #d0d5dd !important; }
    .sr-btn-primary { height: 32px; padding: 0 14px; font-size: 12px; font-weight: 600; border: none; border-radius: 6px; background: linear-gradient(135deg, #4361ee, #3a0ca3); color: #fff; display: inline-flex; align-items: center; gap: 5px; }
    .sr-btn-excel { height: 32px; padding: 0 14px; font-size: 12px; font-weight: 600; border: 1px solid #d0d5dd; border-radius: 6px; background: #fff; color: #555; display: inline-flex; align-items: center; gap: 5px; }

    :host ::ng-deep .theme-table { width: 100% !important; }
    :host ::ng-deep .theme-table .ant-table { font-size: 13px; }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th {
      background: #f8f9fc !important; color: #1f3d6e !important; font-size: 11px !important;
      font-weight: 700 !important; padding: 8px 10px !important;
      border-bottom: 2px solid #1f3d6e !important; white-space: nowrap;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr > td {
      padding: 7px 10px !important; border-bottom: 1px solid #f0f2f5 !important;
      font-size: 12px; color: #374151;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr:hover > td { background: rgba(31,61,110,0.03) !important; }
    .td-right { text-align: right !important; }
    .emp-cell { font-weight: 600; color: #1f3d6e; }
    .empty-cell { text-align: center !important; padding: 24px !important; color: #9ca3af !important; font-style: italic; }
  `]
})
export class LabourReportsComponent implements OnInit {
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
  selectedEmployees3: number[] = [];
  employeeList: { id: number; fullName: string; employeeCode: string }[] = [];

  bonusYear = new Date().getFullYear(); bonusMonth = new Date().getMonth() + 1;
  otYear = new Date().getFullYear(); otMonth = new Date().getMonth() + 1;
  compOffYear = new Date().getFullYear();

  bonusData: any[] = []; otData: any[] = []; compOffData: any[] = [];
  loading1 = false; loading2 = false; loading3 = false;
  excelLoading1 = false; excelLoading2 = false; excelLoading3 = false;
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

  openReport(type: string): void {
    let setter: (v: boolean) => void;
    if (type === 'worker-details') setter = (v) => this.loading1 = v;
    else if (type === 'wages-register') setter = (v) => this.loading2 = v;
    else setter = (v) => this.loading3 = v;
    setter(true);
    const done = () => setter(false);

    let obs: any;
    if (type === 'worker-details') obs = this.reportService.getIndividualWorkerDetails(this.selectedYear, this.selectedMonth);
    else if (type === 'wages-register') obs = this.reportService.getWagesRegister(this.selectedYear2, this.selectedMonth2);
    else obs = this.reportService.getLeaveRegister(this.selectedYear3);

    obs.subscribe({
      next: (res: any) => {
        if (!res.data) { this.msg.warning('No data available'); done(); return; }
        const win = window.open('', '_blank');
        if (win) { win.document.write(res.data); win.document.close(); }
        else this.msg.error('Popup blocked');
        done();
      },
      error: () => { this.msg.error('Failed to load'); done(); }
    });
  }

  downloadExcel(type: string): void {
    let setter: (v: boolean) => void;
    if (type === 'worker-details') setter = (v) => this.excelLoading1 = v;
    else if (type === 'wages-register') setter = (v) => this.excelLoading2 = v;
    else setter = (v) => this.excelLoading3 = v;
    setter(true);
    const done = () => setter(false);

    let obs, filename: string;
    if (type === 'worker-details') {
      obs = this.reportService.downloadIndividualWorkerDetailsExcel(this.selectedYear, this.selectedMonth);
      filename = `Individual_Worker_Details_${this.selectedYear}_${this.selectedMonth}.xlsx`;
    } else if (type === 'wages-register') {
      obs = this.reportService.downloadWagesRegisterExcel(this.selectedYear2, this.selectedMonth2);
      filename = `Wages_Register_${this.selectedYear2}_${this.selectedMonth2}.xlsx`;
    } else {
      obs = this.reportService.downloadLeaveRegisterExcel(this.selectedYear3, this.selectedEmployees3);
      filename = `Leave_Register_${this.selectedYear3}.xlsx`;
    }

    obs.subscribe({
      next: (blob) => {
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