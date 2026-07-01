import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NgxEchartsModule } from 'ngx-echarts';
import { Subject, takeUntil } from 'rxjs';

import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { SalaryService } from '../../core/services/salary.service';
import { LeaveService } from '../../core/services/leave.service';
import { DashboardStats } from '../../core/models/api-response.model';
import { Employee } from '../../core/models/employee.model';
import { Salary } from '../../core/models/payroll.models';
import { DateFormatPipe } from '../../shared/pipes/date-format.pipe';
import { TitleCasePipe } from '../../shared/pipes/title-case.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    NzCardModule, NzIconModule, NzButtonModule, NzTableModule, NzStatisticModule, NzGridModule,
    NgxEchartsModule,
    DateFormatPipe, TitleCasePipe,
    LoadingSpinnerComponent, StatCardComponent
  ],
  template: `
    <div class="dash page-enter">
      <app-loading-spinner [loading]="isLoading" message="Loading dashboard..."></app-loading-spinner>

      <ng-container *ngIf="!isLoading">
        <!-- Top Bar -->
        <div class="dash-top">
          <div class="dash-top-left">
            <div class="dash-avatar">{{ currentUserName.charAt(0) || 'A' }}</div>
            <div>
              <div class="dash-greeting">Welcome back, {{ currentUserName }}</div>
              <div class="dash-meta">
                <span class="dash-date">{{ today }}</span>
                <span class="dash-sep"></span>
                <span class="dash-count">{{ stats?.totalEmployees ?? 0 }} total employees</span>
              </div>
            </div>
          </div>
          <button nz-button nzType="primary" routerLink="/admin/employees/new" class="dash-add-btn">
            <i nz-icon nzType="plus"></i> Add Employee
          </button>
        </div>

        <!-- Stats -->
        <div nz-row [nzGutter]="[6, 6]" class="dash-stats">
          <div nz-col nzXs="12" nzMd="6">
            <div class="dash-stat-card dash-stat-total">
              <div class="dash-stat-icon"><i nz-icon nzType="team"></i></div>
              <div class="dash-stat-body">
                <div class="dash-stat-val">{{ stats?.totalEmployees ?? 0 }}</div>
                <div class="dash-stat-lbl">Total Employees</div>
              </div>
              <div class="dash-stat-trend up">+5 this week</div>
            </div>
          </div>
          <div nz-col nzXs="12" nzMd="6">
            <div class="dash-stat-card dash-stat-active">
              <div class="dash-stat-icon"><i nz-icon nzType="check-circle"></i></div>
              <div class="dash-stat-body">
                <div class="dash-stat-val">{{ stats?.activeEmployees ?? 0 }}</div>
                <div class="dash-stat-lbl">Active</div>
              </div>
              <div class="dash-stat-bar"><span class="dash-stat-bar-fill" [style.width.%]="activePct"></span></div>
            </div>
          </div>
          <div nz-col nzXs="12" nzMd="6">
            <div class="dash-stat-card dash-stat-new">
              <div class="dash-stat-icon"><i nz-icon nzType="user-add"></i></div>
              <div class="dash-stat-body">
                <div class="dash-stat-val">{{ stats?.newThisMonth ?? 0 }}</div>
                <div class="dash-stat-lbl">New This Month</div>
              </div>
              <div class="dash-stat-trend up">+3 vs last month</div>
            </div>
          </div>
          <div nz-col nzXs="12" nzMd="6">
            <div class="dash-stat-card dash-stat-exit">
              <div class="dash-stat-icon"><i nz-icon nzType="user-delete"></i></div>
              <div class="dash-stat-body">
                <div class="dash-stat-val">{{ stats?.exitedEmployees ?? 0 }}</div>
                <div class="dash-stat-lbl">Exited</div>
              </div>
              <div class="dash-stat-trend down">-1 vs last month</div>
            </div>
          </div>
        </div>

        <!-- Charts + Team -->
        <div class="dash-main" *ngIf="stats">
          <div class="dash-charts-grid">
            <div class="dash-chart-card">
              <div class="dash-cc-title"><i nz-icon nzType="pie-chart"></i> Gender</div>
              <div echarts [options]="genderChartOptions" class="dash-cc-body"></div>
            </div>
            <div class="dash-chart-card">
              <div class="dash-cc-title"><i nz-icon nzType="dashboard"></i> Status</div>
              <div echarts [options]="statusChartOptions" class="dash-cc-body"></div>
            </div>
            <div class="dash-chart-card">
              <div class="dash-cc-title"><i nz-icon nzType="line-chart"></i> Payroll Trend <span class="dash-cc-sub">(last 6 months)</span></div>
              <div echarts [options]="payrollChartOptions" class="dash-cc-body"></div>
            </div>
            <div class="dash-chart-card">
              <div class="dash-cc-title"><i nz-icon nzType="schedule"></i> Leave Overview</div>
              <div echarts [options]="leaveChartOptions" class="dash-cc-body"></div>
            </div>
          </div>
          <div class="dash-team" *ngIf="recentEmployees.length > 0">
            <div class="dash-team-head">
              <span class="dash-team-heading"><i nz-icon nzType="team"></i> Recent</span>
              <button nz-button nzType="text" nzSize="small" routerLink="/admin/employees" class="dash-team-all">All <i nz-icon nzType="arrow-right"></i></button>
            </div>
            <div class="dash-team-body">
              <div class="dash-team-row" *ngFor="let emp of recentEmployees.slice(0, 5)" [routerLink]="['/admin/employees', emp.id]">
                <div class="dash-t-avatar">{{ (emp.firstName.charAt(0) || '') + (emp.surname.charAt(0) || '') }}</div>
                <div class="dash-t-info">
                  <div class="dash-t-name">{{ emp.firstName }} {{ emp.surname }}</div>
                  <div class="dash-t-role">{{ emp.designation | titleCase }}</div>
                  <div class="dash-t-code">{{ emp.employeeCode }}</div>
                </div>
                <div class="dash-t-end">
                  <span class="dash-t-badge" [class.on]="emp.employeeStatus === 'LIVE'" [class.off]="emp.employeeStatus !== 'LIVE'">
                    <span class="dash-t-dot"></span> {{ emp.employeeStatus === 'LIVE' ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .page-enter { animation: fadeSlideUp .35s ease-out; }
    @keyframes fadeSlideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

    .dash { height:100%; display:flex; flex-direction:column; gap:6px; padding:12px; overflow:hidden }

    /* Top */
    .dash-top { flex-shrink:0; display:flex; align-items:center; justify-content:space-between; background:#fff; border:1px solid #e8eaed; border-radius:10px; padding:8px 12px; box-shadow:0 2px 8px rgba(0,0,0,.05) }
    .dash-top-left { display:flex; align-items:center; gap:12px }
    .dash-avatar { width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg,#1f3d6e,#16213e); color:#fff; display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:700; flex-shrink:0; box-shadow:0 2px 6px rgba(67,97,238,.3) }
    .dash-greeting { font-size:16px; font-weight:700; color:#1a1a2e; line-height:1.3 }
    .dash-meta { display:flex; align-items:center; gap:8px; margin-top:1px }
    .dash-date { font-size:11px; color:#6c757d }
    .dash-sep { width:3px; height:3px; border-radius:50%; background:#adb5bd }
    .dash-count { font-size:11px; color:#4361ee; font-weight:600 }
    .dash-add-btn { background:linear-gradient(135deg,#4361ee,#3a0ca3); border:none; display:inline-flex; align-items:center; gap:5px; height:32px; border-radius:8px; font-weight:600; font-size:13px; box-shadow:0 2px 6px rgba(67,97,238,.25) }
    .dash-add-btn:hover { background:linear-gradient(135deg,#3a0ca3,#1f3d6e) }

    /* Stats */
    .dash-stats { flex-shrink:0 }
    .dash-stat-card { background:#fff; border:1px solid #e8eaed; border-radius:10px; padding:8px 10px; display:flex; align-items:center; gap:6px; box-shadow:0 1px 4px rgba(0,0,0,.04); position:relative; overflow:hidden }
    .dash-stat-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:18px }
    .dash-stat-total .dash-stat-icon { background:#eff6ff; color:#4361ee }
    .dash-stat-active .dash-stat-icon { background:#ecfdf5; color:#10b981 }
    .dash-stat-new .dash-stat-icon { background:#fef3c7; color:#f59e0b }
    .dash-stat-exit .dash-stat-icon { background:#fef2f2; color:#ef4444 }
    .dash-stat-body { flex:1; min-width:0 }
    .dash-stat-val { font-size:22px; font-weight:800; color:#1a1a2e; line-height:1.1; letter-spacing:-.5px }
    .dash-stat-lbl { font-size:10px; color:#6c757d; font-weight:500; text-transform:uppercase; letter-spacing:.4px }
    .dash-stat-trend { font-size:10px; font-weight:600; padding:1px 6px; border-radius:4px; white-space:nowrap }
    .dash-stat-trend.up { background:#ecfdf5; color:#059669 }
    .dash-stat-trend.down { background:#fef2f2; color:#dc2626 }
    .dash-stat-bar { position:absolute; bottom:0; left:0; right:0; height:3px; background:#f0f2f5 }
    .dash-stat-bar-fill { display:block; height:100%; background:linear-gradient(90deg,#10b981,#34d399); border-radius:0 2px 2px 0; transition:width .6s ease }

    /* Main */
    .dash-main { flex:1; min-height:0; display:flex; gap:6px }
    .dash-charts-grid { flex:1; min-width:0; display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; gap:6px; min-height:0 }
    .dash-chart-card { background:#fff; border:1px solid #e8eaed; border-radius:10px; box-shadow:0 1px 4px rgba(0,0,0,.04); display:flex; flex-direction:column; overflow:hidden; min-height:0 }
    .dash-cc-title { flex-shrink:0; display:flex; align-items:center; gap:5px; padding:5px 10px; font-size:11px; font-weight:600; color:#1a1a2e; border-bottom:1px solid #e8eaed; background:#fafbfc }
    .dash-cc-title i[nz-icon] { color:#4361ee; font-size:13px }
    .dash-cc-sub { font-size:9px; color:#adb5bd; font-weight:400; margin-left:2px }
    .dash-cc-body { flex:1; width:100%; min-height:0 }

    /* Team */
    .dash-team { width:280px; flex-shrink:0; background:#fff; border:1px solid #e8eaed; border-radius:10px; box-shadow:0 1px 4px rgba(0,0,0,.04); display:flex; flex-direction:column; overflow:hidden }
    .dash-team-head { flex-shrink:0; display:flex; align-items:center; justify-content:space-between; padding:6px 10px; border-bottom:1px solid #e8eaed; background:#fafbfc }
    .dash-team-heading { display:flex; align-items:center; gap:5px; font-size:12px; font-weight:600; color:#1a1a2e }
    .dash-team-heading i[nz-icon] { color:#4361ee; font-size:13px }
    .dash-team-all { font-size:11px; color:#4361ee; font-weight:500; display:inline-flex; align-items:center; gap:3px }
    .dash-team-body { flex:1; overflow-y:auto; min-height:0 }
    .dash-team-row { display:flex; align-items:center; gap:6px; padding:6px 10px; cursor:pointer; border-bottom:1px solid #f5f5f5; transition:background .12s }
    .dash-team-row:hover { background:#f1f5f9 }
    .dash-team-row:last-child { border-bottom:none }
    .dash-t-avatar { width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg,#1f3d6e,#16213e); color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0 }
    .dash-t-info { flex:1; min-width:0 }
    .dash-t-name { font-size:12px; font-weight:600; color:#1a1a2e; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
    .dash-t-role { font-size:10px; color:#6c757d; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
    .dash-t-code { font-size:9px; color:#adb5bd; font-family:'Cascadia Code','Consolas',monospace }
    .dash-t-end { flex-shrink:0; display:flex; flex-direction:column; align-items:flex-end; gap:2px }
    .dash-t-badge { display:inline-flex; align-items:center; gap:3px; font-size:9px; font-weight:600; padding:1px 7px; border-radius:10px }
    .dash-t-badge.on { background:rgba(16,185,129,.1); color:#059669 }
    .dash-t-badge.off { background:rgba(108,117,125,.1); color:#6c757d }
    .dash-t-dot { width:4px; height:4px; border-radius:50% }
    .dash-t-badge.on .dash-t-dot { background:#10b981; box-shadow:0 0 4px rgba(16,185,129,.4) }
    .dash-t-badge.off .dash-t-dot { background:#adb5bd }

    @media(max-width:900px){.dash-main{flex-direction:column}.dash-team{width:100%}}
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isLoading = false;
  currentUserName = '';
  today = '';
  stats: DashboardStats | null = null;
  recentEmployees: Employee[] = [];

  genderChartOptions: any = {};
  statusChartOptions: any = {};
  payrollChartOptions: any = {};
  leaveChartOptions: any = {};

  activePct = 0;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private salaryService: SalaryService,
    private leaveService: LeaveService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUserName = user ? `${user.firstName} ${user.surname}` : 'User';
    });
    this.today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboard(): void {
    this.isLoading = true;

    this.dashboardService.getStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats = response.data;
          this.activePct = response.data.totalEmployees > 0
            ? Math.round((response.data.activeEmployees / response.data.totalEmployees) * 100)
            : 0;
          this.buildCharts();
        }
      },
      error: () => this.isLoading = false
    });

    this.dashboardService.getRecentEmployees(5).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) this.recentEmployees = response.data || [];
      },
      error: () => this.isLoading = false
    });
  }

  private buildCharts(): void {
    if (!this.stats) return;
    this.buildGenderChart();
    this.buildStatusChart();
    this.loadPayrollData();
    this.loadLeaveData();
  }

  private loadPayrollData(): void {
    const now = new Date();
    const year = now.getFullYear();
    this.salaryService.getSalaries({ year, size: 500 }).subscribe({
      next: (res) => {
        this.buildPayrollChart((res?.success && res?.data) ? res.data : []);
      },
      error: () => this.buildPayrollChart([])
    });
  }

  private loadLeaveData(): void {
    this.leaveService.getApplications({ size: 200 }).subscribe({
      next: (res) => {
        const apps = (res?.success && res?.data)
          ? (Array.isArray(res.data) ? res.data : (res.data.content || []))
          : [];
        this.buildLeaveChart(apps);
      },
      error: () => this.buildLeaveChart([])
    });
  }

  private buildGenderChart(): void {
    const data = Object.entries(this.stats!.genderDistribution || {}).map(([name, value]) => ({ name, value }));
    const total = data.reduce((s, d) => s + d.value, 0);
    this.genderChartOptions = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { show: false },
      graphic: [{
        type: 'text', left: 'center', top: '46%', style: {
          text: total.toString(), fill: '#1a1a2e', fontSize: 20, fontWeight: 800, fontFamily: 'Inter, sans-serif'
        }, z: 100
      }],
      series: [{
        type: 'pie', roseType: 'area', radius: ['15%', '72%'], center: ['50%', '48%'],
        avoidLabelOverlap: true, padAngle: 0, itemStyle: { borderRadius: 2, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, color: '#6c757d', fontSize: 10, formatter: '{b}\n{d}%', lineHeight: 12 },
        emphasis: { label: { fontSize: 11, fontWeight: 'bold' }, itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,.15)' } },
        data: data.map((d, i) => ({ ...d, itemStyle: { color: ['#4361ee', '#f59e0b', '#ec4899'][i % 3] } }))
      }]
    };
  }

  private buildStatusChart(): void {
    const entries = Object.entries(this.stats!.statusDistribution || {});
    const data = entries.map(([name, value]) => ({ name, value }));
    this.statusChartOptions = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { show: false },
      series: [{
        type: 'pie', radius: ['50%', '75%'], center: ['50%', '45%'],
        avoidLabelOverlap: true, padAngle: 3, itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, color: '#6c757d', fontSize: 10, formatter: '{b}\n{d}%', lineHeight: 12 },
        emphasis: { label: { fontSize: 11, fontWeight: 'bold' }, itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,.1)' } },
        data: data.map((d, i) => ({ ...d, itemStyle: { color: ['#10b981', '#f59e0b', '#ef4444', '#6b7280'][i % 4] } }))
      }]
    };
  }

  private buildPayrollChart(salaries: Salary[]): void {
    const hasData = salaries?.length > 0;
    const monthMap = new Map<number, { gross: number; net: number; deductions: number; count: number }>();
    for (const s of salaries || []) {
      const m = s.wageMonth;
      if (!monthMap.has(m)) monthMap.set(m, { gross: 0, net: 0, deductions: 0, count: 0 });
      const d = monthMap.get(m)!;
      d.gross += s.grossSalary;
      d.net += s.netPay;
      d.deductions += s.grossSalary - s.netPay;
      d.count++;
    }
    const months = Array.from(monthMap.entries()).sort(([a], [b]) => a - b);
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const names = hasData ? months.map(([m]) => monthNames[m - 1] || '') : ['No Data'];
    const grossData = hasData ? months.map(([, d]) => Math.round(d.gross)) : [0];
    const netData = hasData ? months.map(([, d]) => Math.round(d.net)) : [0];
    const dedData = hasData ? months.map(([, d]) => Math.round(d.deductions)) : [0];
    this.payrollChartOptions = {
      tooltip: { trigger: 'axis', formatter: (params: any) => {
        let s = `<strong>${params[0].axisValue}</strong><br/>`;
        params.forEach((p: any) => { s += `${p.marker} ${p.seriesName}: ₹${Number(p.value).toLocaleString()}<br/>`; });
        return s;
      }},
      legend: { data: ['Gross', 'Net', 'Deductions'], bottom: 0, textStyle: { color: '#6c757d', fontSize: 9 }, itemWidth: 10, itemHeight: 8, selectedMode: false },
      grid: { left: '8%', right: '4%', bottom: '18%', top: '6%', containLabel: true },
      xAxis: { type: 'category', data: names, axisLabel: { color: '#6c757d', fontSize: 9 }, axisLine: { lineStyle: { color: '#e8eaed' } }, axisTick: { show: false } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f0f2f5' } }, axisLabel: { color: '#6c757d', fontSize: 8, formatter: '₹{value}' } },
      series: [
        { name: 'Gross', type: 'bar', barWidth: '22%', barGap: '10%', data: grossData, itemStyle: { color: hasData ? '#4361ee' : '#e8eaed', borderRadius: [3, 3, 0, 0] } },
        { name: 'Net', type: 'bar', barWidth: '22%', data: netData, itemStyle: { color: hasData ? '#10b981' : '#e8eaed', borderRadius: [3, 3, 0, 0] } },
        { name: 'Deductions', type: 'bar', barWidth: '22%', data: dedData, itemStyle: { color: hasData ? '#f59e0b' : '#e8eaed', borderRadius: [3, 3, 0, 0] } }
      ]
    };
  }

  private buildLeaveChart(applications: any[]): void {
    const hasData = applications?.length > 0;
    const statusCount: Record<string, number> = {};
    for (const a of applications || []) {
      const st = a.status || 'UNKNOWN';
      statusCount[st] = (statusCount[st] || 0) + 1;
    }
    const data = hasData ? Object.entries(statusCount).map(([name, value]) => ({ name, value })) : [];
    const colorMap: Record<string, string> = { APPROVED: '#10b981', PENDING: '#f59e0b', REJECTED: '#ef4444', CANCELLED: '#6b7280' };
    this.leaveChartOptions = {
      tooltip: hasData ? { trigger: 'item', formatter: '{b}: {c} ({d}%)' } : { show: false },
      legend: { show: false },
      graphic: [{
        type: 'text', left: 'center', top: '42%', style: {
          text: hasData ? applications.length.toString() : 'No\nData', fill: hasData ? '#1a1a2e' : '#adb5bd',
          fontSize: hasData ? 18 : 14, fontWeight: hasData ? 800 : 500, fontFamily: 'Inter, sans-serif', lineHeight: 18
        }, z: 100
      }],
      series: [{
        type: 'pie', radius: ['40%', '70%'], center: ['50%', '48%'],
        avoidLabelOverlap: true, padAngle: 2, itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: hasData, color: '#6c757d', fontSize: 9, formatter: '{b}', lineHeight: 11 },
        emphasis: hasData ? { label: { fontSize: 11, fontWeight: 'bold' }, itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,.1)' } } : { scale: false },
        data: hasData
          ? data.map(d => ({ ...d, itemStyle: { color: colorMap[d.name] || '#adb5bd' } }))
          : [{ value: 1, name: '', itemStyle: { color: '#f0f2f5' } }]
      }]
    };
  }
}
