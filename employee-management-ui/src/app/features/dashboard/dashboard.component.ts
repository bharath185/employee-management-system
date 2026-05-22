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
import { DashboardStats } from '../../core/models/api-response.model';
import { Employee } from '../../core/models/employee.model';
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
    <div class="dashboard-container fade-in">
      <div class="welcome-header">
        <div class="welcome-overlay"></div>
        <div class="welcome-inner">
          <div class="welcome-text">
            <h1>Welcome back, {{ currentUserName }}</h1>
          </div>
          <button nz-button nzType="primary" class="welcome-btn" routerLink="/admin/employees/new">
            <i nz-icon nzType="plus"></i> Add Employee
          </button>
        </div>
      </div>

      <app-loading-spinner [loading]="isLoading" message="Loading dashboard..."></app-loading-spinner>

      <div nz-row [nzGutter]="[12, 12]" class="stats-row" *ngIf="!isLoading && stats">
        <div nz-col nzXs="24" nzSm="12" nzMd="6">
          <app-stat-card icon="team" [value]="stats.totalEmployees" title="Total Employees" footer="All records" variant="total"></app-stat-card>
        </div>
        <div nz-col nzXs="24" nzSm="12" nzMd="6">
          <app-stat-card icon="check-circle" [value]="stats.activeEmployees" title="Active" footer="Currently active" variant="active"></app-stat-card>
        </div>
        <div nz-col nzXs="24" nzSm="12" nzMd="6">
          <app-stat-card icon="user-add" [value]="stats.newThisMonth" title="New This Month" footer="Joined recently" variant="new"></app-stat-card>
        </div>
        <div nz-col nzXs="24" nzSm="12" nzMd="6">
          <app-stat-card icon="user-delete" [value]="stats.exitedEmployees" title="Exited" footer="Departed" variant="exit"></app-stat-card>
        </div>
      </div>

      <div nz-row [nzGutter]="[12, 12]" class="charts-row" *ngIf="!isLoading && stats">
        <div nz-col nzXs="24" nzSm="12" nzMd="6">
          <div class="chart-card">
            <div class="chart-card-header"><i nz-icon nzType="pie-chart"></i> Gender</div>
            <div echarts [options]="genderChartOptions" class="chart-echarts"></div>
          </div>
        </div>
        <div nz-col nzXs="24" nzSm="12" nzMd="6">
          <div class="chart-card">
            <div class="chart-card-header"><i nz-icon nzType="bar-chart"></i> Status</div>
            <div echarts [options]="statusChartOptions" class="chart-echarts"></div>
          </div>
        </div>
        <div nz-col nzXs="24" nzSm="12" nzMd="6">
          <div class="chart-card">
            <div class="chart-card-header"><i nz-icon nzType="bar-chart"></i> Age</div>
            <div echarts [options]="ageChartOptions" class="chart-echarts"></div>
          </div>
        </div>
        <div nz-col nzXs="24" nzSm="12" nzMd="6">
          <div class="chart-card">
            <div class="chart-card-header"><i nz-icon nzType="bar-chart"></i> Designation</div>
            <div echarts [options]="designationChartOptions" class="chart-echarts"></div>
          </div>
        </div>
      </div>

      <div class="recent-section" *ngIf="!isLoading && recentEmployees.length > 0">
        <div class="section-header">
          <div class="section-header-left"><i nz-icon nzType="history"></i> Recent Employees</div>
          <button nz-button nzType="default" routerLink="/admin/employees" class="section-action">
            View All <i nz-icon nzType="arrow-right"></i>
          </button>
        </div>
        <nz-table [nzData]="recentEmployees.slice(0, 3)" [nzFrontPagination]="false" [nzShowPagination]="false" nzSize="small">
          <thead>
            <tr>
              <th nz-th>Employee</th>
              <th nz-th>Code</th>
              <th nz-th>Designation</th>
              <th nz-th>DOJ</th>
              <th nz-th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let emp of recentEmployees.slice(0, 3)" [routerLink]="['/admin/employees', emp.id]" class="clickable-row">
              <td nz-td>
                <div class="emp-cell">
                  <div class="emp-avatar-sm">{{ (emp.firstName.charAt(0) || '') + (emp.surname.charAt(0) || '') }}</div>
                  <span>{{ emp.firstName }} {{ emp.surname }}</span>
                </div>
              </td>
              <td nz-td><span class="code-tag">{{ emp.employeeCode }}</span></td>
              <td nz-td class="desig-cell">{{ emp.designation | titleCase }}</td>
              <td nz-td>{{ emp.doj | dateFormat }}</td>
              <td nz-td>
                <span class="status-tag" [class.active]="emp.employeeStatus === 'LIVE'"
                      [class.inactive]="emp.employeeStatus !== 'LIVE'">
                  <span class="status-dot"></span>
                  {{ emp.employeeStatus | titleCase }}
                </span>
              </td>
            </tr>
          </tbody>
        </nz-table>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .dashboard-container { max-width: 1400px; margin: 0 auto; }

    .welcome-header { position: relative; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 12px; box-shadow: 0 2px 12px rgba(31,61,110,0.15); }
    .welcome-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, #0f2440 0%, var(--color-primary-500) 40%, #2a5298 70%, #4a90d9 100%); }
    .welcome-inner { position: relative; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
    .welcome-text h1 { font-size: 17px; font-weight: 700; color: #fff; margin: 0; letter-spacing: -0.2px; }
    .welcome-btn { background: #fff !important; color: var(--color-primary-500) !important; font-weight: 600; border: none; height: 30px; line-height: 30px; font-size: 12px; padding: 0 18px; }
    .welcome-btn:hover { background: #f0f4ff !important; box-shadow: 0 3px 10px rgba(0,0,0,0.1) !important; }

    .stats-row { margin-bottom: 12px; }

    .charts-row { margin-bottom: 12px; }
    .chart-card { background: #fff; border-radius: var(--radius-md); border: 1px solid var(--color-border-light); box-shadow: 0 1px 4px rgba(0,0,0,0.03); overflow: hidden; height: 100%; }
    .chart-card-header { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-bottom: 1px solid var(--color-border-light); font-size: 12px; font-weight: 600; color: var(--color-primary-500); }
    .chart-card-header i[nz-icon] { font-size: 15px; }
    .chart-echarts { width: 100%; height: 210px; padding: 4px; }

    .recent-section { background: #fff; border-radius: var(--radius-md); border: 1px solid var(--color-border-light); box-shadow: 0 1px 4px rgba(0,0,0,0.03); overflow: hidden; margin-top: 20px; }
    .section-header { display: flex; align-items: center; justify-content: space-between; padding: 9px 14px; border-bottom: 1px solid var(--color-border-light); }
    .section-header-left { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--color-primary-500); }
    .section-header-left i[nz-icon] { font-size: 15px; }
    .section-action { font-size: 11px; padding: 2px 10px; display: flex; align-items: center; gap: 4px; height: 26px; }
    .section-action i[nz-icon] { font-size: 13px; }

    :host ::ng-deep .ant-table-thead > tr > th { text-align: left; padding: 6px 10px; font-size: 10px; font-weight: 700; color: var(--color-primary-500); background: #f8f9fc; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1.5px solid #e8ebf0 !important; }
    :host ::ng-deep .ant-table-tbody > tr > td { padding: 7px 10px; font-size: 12px; color: #333; border-bottom: 1px solid #f0f2f5; }
    :host ::ng-deep .ant-table-tbody > tr { cursor: pointer; transition: background 0.12s; }
    :host ::ng-deep .ant-table-tbody > tr:hover { background: #f0f4ff !important; }
    :host ::ng-deep .ant-table-thead > tr > th.ant-table-cell,
    :host ::ng-deep .ant-table-tbody > tr > td.ant-table-cell { border-color: #e8ebf0; }

    .emp-cell { display: flex; align-items: center; gap: 8px; }
    .emp-avatar-sm { width: 26px; height: 26px; border-radius: var(--radius-full); background: linear-gradient(135deg, var(--color-primary-500), #2a5298); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
    .code-tag { background: var(--color-border-light); padding: 1px 6px; border-radius: var(--radius-sm); font-family: 'Cascadia Code', 'Consolas', monospace; font-size: 10px; color: var(--color-primary-500); font-weight: 600; }
    .desig-cell { color: #555; font-size: 11px; }
    .status-tag { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: var(--radius-pill); font-size: 10px; font-weight: 600; }
    .status-tag .status-dot { width: 5px; height: 5px; border-radius: var(--radius-full); }
    .status-tag.active { background: rgba(40,167,69,0.1); color: #1e7e34; }
    .status-tag.active .status-dot { background: #28a745; box-shadow: 0 0 4px rgba(40,167,69,0.4); }
    .status-tag.inactive { background: rgba(108,117,125,0.1); color: #5a6268; }
    .status-tag.inactive .status-dot { background: #adb5bd; }

    @media (max-width: 768px) {
      .welcome-inner { padding: 14px 16px; flex-direction: column; text-align: center; }
      .welcome-text h1 { font-size: 16px; }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isLoading = false;
  currentUserName = '';
  stats: DashboardStats | null = null;
  recentEmployees: Employee[] = [];

  genderChartOptions: any = {};
  statusChartOptions: any = {};
  ageChartOptions: any = {};
  designationChartOptions: any = {};

  private readonly COLORS = ['#1f3d6e', '#e91e63', '#9c27b0', '#2e7d32', '#f44336', '#ff9800', '#2196f3', '#00bcd4', '#607d8b'];

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUserName = user ? `${user.firstName} ${user.surname}` : 'User';
    });
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
    this.buildAgeChart();
    this.buildDesignationChart();
  }

  private buildGenderChart(): void {
    const data = Object.entries(this.stats!.genderDistribution || {}).map(([name, value]) => ({ name, value }));
    this.genderChartOptions = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { show: false },
      series: [{
        type: 'pie', radius: ['35%', '70%'], center: ['50%', '50%'],
        avoidLabelOverlap: true, padAngle: 1, itemStyle: { borderRadius: 3, borderColor: '#fff', borderWidth: 1.5 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 11, fontWeight: 'bold' } },
        data: data.map((d, i) => ({ ...d, itemStyle: { color: this.COLORS[i % this.COLORS.length] } }))
      }]
    };
  }

  private buildStatusChart(): void {
    const data = Object.entries(this.stats!.statusDistribution || {}).map(([name, value]) => ({ name, value }));
    this.statusChartOptions = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { show: false },
      series: [{
        type: 'pie', radius: ['35%', '70%'], center: ['50%', '50%'],
        avoidLabelOverlap: true, padAngle: 1, itemStyle: { borderRadius: 3, borderColor: '#fff', borderWidth: 1.5 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 11, fontWeight: 'bold' } },
        data: data.map((d, i) => ({ ...d, itemStyle: { color: this.COLORS[i % this.COLORS.length] } }))
      }]
    };
  }

  private buildAgeChart(): void {
    const raw = this.stats!.ageBracketDistribution || [];
    const categories = raw.map(r => r.bracket);
    const values = raw.map(r => r.count);
    this.ageChartOptions = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '8%', right: '4%', bottom: '14%', top: '6%', containLabel: true },
      xAxis: { type: 'category', data: categories, axisLabel: { fontSize: 9 }, axisLine: { lineStyle: { color: '#ddd' } } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f0f0f0' } }, axisLabel: { fontSize: 9 } },
      series: [{
        type: 'bar', barWidth: '55%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#1f3d6e' }, { offset: 1, color: '#4a90d9' }] }
        },
        emphasis: { itemStyle: { color: '#2a5298' } },
        data: values
      }]
    };
  }

  private buildDesignationChart(): void {
    const raw = this.stats!.designationDistribution || [];
    const names = raw.map(r => r.designation);
    const counts = raw.map(r => r.count);
    this.designationChartOptions = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '8%', right: '4%', bottom: '14%', top: '6%', containLabel: true },
      xAxis: { type: 'category', data: names, axisLabel: { fontSize: 9, rotate: names.length > 4 ? 25 : 0 }, axisLine: { lineStyle: { color: '#ddd' } } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f0f0f0' } }, axisLabel: { fontSize: 9 } },
      series: [{
        type: 'bar', barWidth: '50%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#e91e63' }, { offset: 1, color: '#f48fb1' }] }
        },
        emphasis: { itemStyle: { color: '#c2185b' } },
        data: counts
      }]
    };
  }
}
