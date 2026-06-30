import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NgxEchartsModule } from 'ngx-echarts';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { SalaryService } from '../../core/services/salary.service';
import { LeaveService } from '../../core/services/leave.service';
import { Employee } from '../../core/models/employee.model';
import { Salary, LeaveBalance } from '../../core/models/payroll.models';
import { environment } from '../../../environments/environment';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzStatisticModule,
    NzSkeletonModule,
    NzTagModule,
    NzTableModule,
    NzDividerModule,
    NzPopconfirmModule,
    NzGridModule,
    NgxEchartsModule,
    StatCardComponent
  ],
  template: `
    <div class="dashboard-container page-enter">
      <!-- Welcome Header -->
      <div class="welcome-section">
        <div class="welcome-text">
          <h1>{{ greeting }}, {{ employee?.firstName || 'Employee' }}</h1>
          <p class="welcome-date">{{ currentDate }}</p>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div *ngIf="loading" class="loading-section">
        <nz-skeleton [nzActive]="true" [nzParagraph]="{ rows: 8 }"></nz-skeleton>
      </div>

      <ng-container *ngIf="!loading">
        <!-- Stats Cards Row -->
        <div nz-row [nzGutter]="[12, 12]" class="stats-row">
          <div nz-col nzXs="24" nzSm="12" nzMd="6">
            <app-stat-card icon="calendar" [value]="joinDate" title="Date of Joining" footer="" variant="total"></app-stat-card>
          </div>
          <div nz-col nzXs="24" nzSm="12" nzMd="6">
            <app-stat-card icon="bank" [value]="employee?.processAssigned || '—'" title="Department" footer="" variant="active"></app-stat-card>
          </div>
          <div nz-col nzXs="24" nzSm="12" nzMd="6">
            <app-stat-card icon="file-text" [value]="totalSlips" title="Salary Slips" footer="" variant="new"></app-stat-card>
          </div>
          <div nz-col nzXs="24" nzSm="12" nzMd="6">
            <app-stat-card icon="schedule" [value]="totalLeaveBalance" title="Leave Balance" footer="days remaining" variant="total"></app-stat-card>
          </div>
        </div>

        <!-- Charts Row -->
        <div nz-row [nzGutter]="[12, 12]" class="charts-row">
          <div nz-col nzXs="24" nzMd="12">
            <div class="chart-card">
              <div class="chart-card-header"><i nz-icon nzType="line-chart"></i> Salary Trend</div>
              <div echarts [options]="salaryChartOptions" class="chart-echarts" *ngIf="salaries.length > 1"></div>
              <div class="chart-empty" *ngIf="salaries.length <= 1">
                <i nz-icon nzType="line-chart" nzTheme="outline"></i>
                <p>More salary data needed for trend chart</p>
              </div>
            </div>
          </div>
          <div nz-col nzXs="24" nzMd="12">
            <div class="chart-card">
              <div class="chart-card-header"><i nz-icon nzType="pie-chart"></i> Leave Summary</div>
              <div echarts [options]="leaveChartOptions" class="chart-echarts" *ngIf="leaveBalances.length > 0"></div>
              <div class="chart-empty" *ngIf="leaveBalances.length === 0">
                <i nz-icon nzType="pie-chart" nzTheme="outline"></i>
                <p>No leave data available</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions-section">
          <div class="section-header">
            <i nz-icon nzType="thunderbolt"></i> Quick Actions
          </div>
          <div class="quick-actions-grid">
            <button nz-button nzType="primary" routerLink="/employee/profile"><i nz-icon nzType="user"></i> View Profile</button>
            <button nz-button nzType="default" routerLink="/employee/profile/edit"><i nz-icon nzType="edit"></i> Edit Profile</button>
            <button nz-button nzType="default" routerLink="/employee/leave"><i nz-icon nzType="schedule"></i> Apply Leave</button>
            <button nz-button nzType="default" (click)="downloadLatestSlip()"><i nz-icon nzType="download"></i> Latest Slip</button>
          </div>
        </div>

        <!-- Salary Slips Table -->
        <div class="salary-section-card">
          <div class="salary-section-header">
            <span><i nz-icon nzType="file-text"></i> Salary Slips</span>
            <button nz-button nzSize="small" nzType="default" (click)="downloadAllSlips()" *ngIf="salaries.length > 0">
              <i nz-icon nzType="download"></i> Download All
            </button>
          </div>
          <nz-table
            #salaryTable
            [nzData]="salaries"
            [nzLoading]="loadingSalaries"
            [nzPageSize]="12"
            [nzShowPagination]="salaries.length > 12"
            nzSize="middle">
            <thead>
              <tr>
                <th>Period</th>
                <th>Basic</th>
                <th>Gross</th>
                <th>Deductions</th>
                <th>Net Pay</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of salaryTable.data">
                <td><strong>{{ monthName(s.wageMonth) }} {{ s.wageYear }}</strong></td>
                <td>{{ s.basic | number:'1.2-2' }}</td>
                <td>{{ s.grossSalary | number:'1.2-2' }}</td>
                <td class="text-danger">{{ (s.pfDeduction + s.esiDeduction + s.ptDeduction) | number:'1.2-2' }}</td>
                <td class="text-success"><strong>{{ s.netPay | number:'1.2-2' }}</strong></td>
                <td class="text-right">
                  <button nz-button nzType="primary" nzSize="small" (click)="downloadSlip(s.id)">
                    <i nz-icon nzType="download"></i> Download
                  </button>
                </td>
              </tr>
              <tr *ngIf="salaries.length === 0">
                <td colspan="6" class="text-center text-muted">No salary records found</td>
              </tr>
            </tbody>
          </nz-table>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    /* ===== Page Enter Animation ===== */
    .page-enter {
      animation: fadeSlideUp 0.5s ease-out;
    }
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .dashboard-container {
      max-width: 1200px;
      margin: 0 auto;
      padding-bottom: 32px;
    }

    /* ===== Welcome Header ===== */
    .welcome-section {
      background: #ffffff;
      border: 1px solid #e8eaed;
      border-radius: 8px;
      padding: 28px 32px;
      margin-bottom: 24px;
      position: relative;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border-left: 4px solid #2563eb;
    }
    .welcome-text h1 {
      font-size: 26px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 6px;
      letter-spacing: -0.3px;
    }
    .welcome-date {
      font-size: 14px;
      color: #6c757d;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .loading-section {
      padding: 48px 24px;
    }

    /* ===== Stats Row ===== */
    .stats-row {
      margin-bottom: 20px;
    }

    /* ===== Charts Row ===== */
    .charts-row {
      margin-bottom: 20px;
    }
    .chart-card {
      background: #ffffff;
      border: 1px solid #e8eaed;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      overflow: hidden;
      height: 100%;
    }
    .chart-card-header {
      padding: 14px 18px;
      font-size: 15px;
      font-weight: 600;
      color: #1a1a2e;
      border-bottom: 1px solid #e8eaed;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .chart-card-header i[nz-icon] {
      color: #2563eb;
      font-size: 16px;
    }
    .chart-echarts {
      width: 100%;
      height: 260px;
      padding: 8px 4px;
    }
    .chart-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      color: #adb5bd;
      gap: 8px;
    }
    .chart-empty i[nz-icon] {
      font-size: 36px;
      opacity: 0.4;
    }
    .chart-empty p {
      margin: 0;
      font-size: 13px;
    }

    /* ===== Quick Actions ===== */
    .quick-actions-section {
      background: #ffffff;
      border: 1px solid #e8eaed;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      overflow: hidden;
      margin-bottom: 20px;
    }
    .section-header {
      padding: 14px 20px;
      font-size: 15px;
      font-weight: 600;
      color: #1a1a2e;
      background: #f8fafc;
      border-bottom: 1px solid #e8eaed;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-header i[nz-icon] {
      font-size: 16px;
      color: #2563eb;
    }
    .quick-actions-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      padding: 18px 20px;
    }
    .quick-actions-grid button[nz-button] {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 6px;
      font-weight: 500;
    }

    /* ===== Salary Section Card ===== */
    .salary-section-card {
      background: #ffffff;
      border: 1px solid #e8eaed;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }
    .salary-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      border-bottom: 1px solid #e8eaed;
      font-size: 15px;
      font-weight: 600;
      color: #1a1a2e;
    }
    .salary-section-header span {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .salary-section-header span i[nz-icon] {
      color: #2563eb;
      font-size: 16px;
    }

    :host ::ng-deep .salary-section-card .ant-table {
      background: transparent !important;
      color: #1a1a2e !important;
    }
    :host ::ng-deep .salary-section-card .ant-table-thead > tr > th {
      background: #f8fafc !important;
      border-bottom: 1px solid #e8eaed !important;
      color: #6c757d !important;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 14px 16px;
    }
    :host ::ng-deep .salary-section-card .ant-table-tbody > tr > td {
      border-bottom: 1px solid #e8eaed !important;
      color: #1a1a2e !important;
      background: transparent !important;
      padding: 14px 16px;
    }
    :host ::ng-deep .salary-section-card .ant-table-tbody > tr:hover > td {
      background: #f1f5f9 !important;
    }
    :host ::ng-deep .salary-section-card .ant-table-tbody > tr > td strong {
      color: #1a1a2e;
    }
    :host ::ng-deep .salary-section-card .ant-pagination {
      color: #6c757d !important;
      padding: 12px 24px;
      margin: 0 !important;
      border-top: 1px solid #e8eaed;
    }
    :host ::ng-deep .salary-section-card .ant-pagination-item {
      background: #ffffff !important;
      border-color: #e8eaed !important;
      color: #1a1a2e !important;
      border-radius: 6px;
    }
    :host ::ng-deep .salary-section-card .ant-pagination-item a {
      color: #1a1a2e !important;
    }
    :host ::ng-deep .salary-section-card .ant-pagination-item-active {
      border-color: #2563eb !important;
      background: #eff6ff !important;
    }
    :host ::ng-deep .salary-section-card .ant-pagination-item-active a {
      color: #2563eb !important;
    }
    :host ::ng-deep .salary-section-card .ant-pagination-prev button,
    :host ::ng-deep .salary-section-card .ant-pagination-next button {
      color: #6c757d !important;
    }
    :host ::ng-deep .salary-section-card .ant-pagination-prev,
    :host ::ng-deep .salary-section-card .ant-pagination-next {
      border-radius: 6px;
    }

    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .text-danger { color: #ef4444 !important; }
    .text-success { color: #10b981 !important; }
    .text-muted { color: #adb5bd; }

    /* ===== Responsive ===== */
    @media (max-width: 768px) {
      .welcome-section { padding: 24px 20px; }
      .welcome-text h1 { font-size: 20px; }
      .chart-echarts { height: 220px; }
      .quick-actions-grid { flex-direction: column; }
      .quick-actions-grid button[nz-button] { width: 100%; justify-content: center; }
    }
    @media (max-width: 576px) {
      .welcome-section { padding: 20px 16px; }
      .welcome-text h1 { font-size: 18px; }
    }
  `]
})
export class EmployeeDashboardComponent implements OnInit, OnDestroy {
  employee: Employee | null = null;
  salaries: Salary[] = [];
  leaveBalances: LeaveBalance[] = [];
  loading = true;
  loadingSalaries = false;
  totalSlips = 0;
  greeting = 'Hello';
  currentDate = '';
  salaryChartOptions: any = {};
  leaveChartOptions: any = {};

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private employeeService: EmployeeService,
    private salaryService: SalaryService,
    private leaveService: LeaveService,
    private msg: NzMessageService
  ) {}

  get initials(): string {
    const emp = this.employee;
    if (!emp) return '?';
    return (emp.firstName?.charAt(0) || '') + (emp.surname?.charAt(0) || '');
  }

  get photoUrl(): string {
    if (!this.employee?.photoPath) return '';
    return environment.apiUrl.replace('/api/v1', '') + this.employee.photoPath;
  }

  get joinDate(): string {
    if (!this.employee?.doj) return '—';
    const d = new Date(this.employee.doj);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  get totalLeaveBalance(): number {
    if (!this.leaveBalances.length) return 0;
    return this.leaveBalances.reduce((sum, lb) => sum + lb.balance, 0);
  }

  monthName(m: number): string {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[m - 1] || '';
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user?.id) {
      this.loading = false;
      return;
    }

    this.greeting = this.getTimeBasedGreeting();
    this.currentDate = this.getFormattedCurrentDate();

    this.employeeService.getEmployeeById(user.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.success) {
          this.employee = res.data;
        }
        this.loading = false;
        this.loadSalarySlips(user.id!);
        this.loadLeaveBalances();
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private getTimeBasedGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  private getFormattedCurrentDate(): string {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return now.toLocaleDateString('en-US', options);
  }

  private loadSalarySlips(employeeId: number): void {
    this.loadingSalaries = true;
    this.salaryService.getSalariesByEmployee(employeeId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.success) {
          this.salaries = (res.data || []).sort((a, b) =>
            b.wageYear !== a.wageYear ? b.wageYear - a.wageYear : b.wageMonth - a.wageMonth
          );
          this.totalSlips = this.salaries.length;
          this.buildSalaryChart(this.salaries);
        }
        this.loadingSalaries = false;
      },
      error: () => {
        this.loadingSalaries = false;
      }
    });
  }

  private loadLeaveBalances(): void {
    this.leaveService.getMyBalances().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.success) {
          this.leaveBalances = res.data || [];
          this.buildLeaveChart(this.leaveBalances);
        }
      }
    });
  }

  private buildSalaryChart(salaries: Salary[]): void {
    const sorted = [...salaries].sort((a, b) =>
      a.wageYear !== b.wageYear ? a.wageYear - b.wageYear : a.wageMonth - b.wageMonth
    );
    const months = sorted.map(s => this.monthName(s.wageMonth) + ' ' + s.wageYear);
    this.salaryChartOptions = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['Net Pay', 'Gross Salary'], bottom: 0, textStyle: { color: '#6c757d' } },
      grid: { left: '3%', right: '4%', bottom: '22%', top: '8%', containLabel: true },
      xAxis: { type: 'category', data: months, axisLabel: { color: '#6c757d', fontSize: 11 } },
      yAxis: { type: 'value', axisLabel: { color: '#6c757d', formatter: '\u20B9{value}' } },
      series: [
        {
          name: 'Net Pay', type: 'line', smooth: true,
          data: sorted.map(s => s.netPay),
          lineStyle: { width: 2, color: '#2563eb' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(37,99,235,0.3)' },
                { offset: 1, color: 'rgba(37,99,235,0.02)' }
              ]
            }
          },
          symbol: 'circle', symbolSize: 6,
          itemStyle: { color: '#2563eb' }
        },
        {
          name: 'Gross Salary', type: 'line', smooth: true,
          data: sorted.map(s => s.grossSalary),
          lineStyle: { width: 2, color: '#10b981' },
          symbol: 'diamond', symbolSize: 6,
          itemStyle: { color: '#10b981' }
        }
      ]
    };
  }

  private buildLeaveChart(balances: LeaveBalance[]): void {
    if (!balances.length) return;
    this.leaveChartOptions = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['Taken', 'Remaining'], bottom: 0, textStyle: { color: '#6c757d' } },
      grid: { left: '3%', right: '4%', bottom: '22%', top: '8%', containLabel: true },
      xAxis: {
        type: 'category',
        data: balances.map(b => b.leaveTypeName),
        axisLabel: { color: '#6c757d', fontSize: 11, rotate: 15 }
      },
      yAxis: { type: 'value', axisLabel: { color: '#6c757d' } },
      series: [
        {
          name: 'Taken', type: 'bar', barWidth: '35%',
          data: balances.map(b => b.taken),
          itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] }
        },
        {
          name: 'Remaining', type: 'bar', barWidth: '35%',
          data: balances.map(b => b.balance),
          itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] }
        }
      ]
    };
  }

  downloadSlip(salaryId: number): void {
    const token = this.authService.getAccessToken();
    const url = `${environment.apiUrl}/salaries/${salaryId}/slip`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.text())
      .then(html => {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(html);
          win.document.close();
          win.focus();
          setTimeout(() => win.print(), 500);
        }
      })
      .catch(() => this.msg.error('Failed to load salary slip'));
  }

  downloadLatestSlip(): void {
    if (this.salaries.length === 0) {
      this.msg.warning('No salary slips available');
      return;
    }
    // salaries are sorted desc by year/month, so first is most recent
    const latest = this.salaries[0];
    this.downloadSlip(latest.id);
  }

  downloadAllSlips(): void {
    if (this.salaries.length === 0) {
      this.msg.warning('No salary slips available');
      return;
    }
    this.msg.loading('Opening all salary slips...', { nzDuration: 2000 });
    this.salaries.forEach((s, i) => {
      setTimeout(() => this.downloadSlip(s.id), i * 800);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
