import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTableModule } from 'ng-zorro-antd/table';

import { EmployeeService } from '../../core/services/employee.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { DashboardStats } from '../../core/models/api-response.model';
import { saveAs } from 'file-saver';
import { LabourReportsComponent } from '../labour-reports/labour-reports.component';

interface StatItem {
  key: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzCardModule, NzButtonModule, NzIconModule,
    NzSelectModule, NzSpinModule, NzGridModule, NzTabsModule, NzTableModule,
    LabourReportsComponent
  ],
  template: `
    <div class="rp-container">
      <div class="pp-sub-nav">
        <a class="pp-nav-item" [class.active]="activeSection === 'reports'" (click)="activeSection = 'reports'">
          <i nz-icon nzType="bar-chart"></i><span>Reports</span>
        </a>
        <a class="pp-nav-item" [class.active]="activeSection === 'labour'" (click)="activeSection = 'labour'">
          <i nz-icon nzType="file-text"></i><span>Labour Reports</span>
        </a>
      </div>

      <div *ngIf="activeSection === 'reports'">
        <nz-card class="rp-controls-card" nzSize="small">
          <div class="rp-controls">
            <div class="rp-filters">
              <div class="filter-item">
                <label>Status</label>
                <nz-select nzPlaceHolder="All Statuses" [(ngModel)]="exportFilterStatus" class="filter-select">
                  <nz-option nzValue="" nzLabel="All Statuses"></nz-option>
                  <nz-option *ngFor="let opt of statusOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
                </nz-select>
              </div>
              <div class="filter-item">
                <label>Designation</label>
                <nz-select nzPlaceHolder="All Designations" [(ngModel)]="exportFilterDesignation" class="filter-select">
                  <nz-option nzValue="" nzLabel="All Designations"></nz-option>
                  <nz-option *ngFor="let opt of designationOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
                </nz-select>
              </div>
              <button nz-button nzType="primary" (click)="exportExcel()" [nzLoading]="isExporting">
                <i nz-icon nzType="download"></i> Export to Excel
              </button>
            </div>
          </div>
        </nz-card>

        <nz-tabset nzType="card" class="rp-tabs">
          <nz-tab nzTitle="HR Statistics">
            <div class="rp-content">
              <div nz-row [nzGutter]="[12, 12]" class="rp-row">
                <div nz-col nzXs="24" nzMd="12" class="rp-col">
                  <nz-card class="rp-card">
                    <div class="card-header">
                      <div class="card-icon-circle">
                        <i nz-icon nzType="bar-chart"></i>
                      </div>
                      <div class="card-header-text">
                        <h4 class="card-title">Statistics Summary</h4>
                        <p class="card-subtitle">Quick overview of employee metrics</p>
                      </div>
                    </div>
                    <div class="card-body card-body-stats">
                      <div class="stats-summary" *ngIf="stats">
                        <div *ngFor="let item of statItems; let idx = index; let last = last"
                             class="stat-row"
                             [class.stat-row-alt]="idx % 2 === 1"
                             [class.stat-row-last]="last">
                          <div class="stat-left">
                            <i nz-icon [nzType]="item.icon" class="stat-icon"></i>
                            <span class="stat-label">{{ item.label }}</span>
                          </div>
                          <span class="stat-value">{{ getStatValue(item.key) }}</span>
                        </div>
                      </div>
                      <div class="stats-empty" *ngIf="!stats && !statsLoading">
                        <button nz-button nzType="default" (click)="loadStats()">
                          <i nz-icon nzType="reload"></i> Load Statistics
                        </button>
                      </div>
                      <div class="stats-spinner" *ngIf="statsLoading">
                        <nz-spin nzSimple [nzSize]="'default'"></nz-spin>
                      </div>
                    </div>
                  </nz-card>
                </div>

                <div nz-col nzXs="24" nzMd="12" class="rp-col">
                  <nz-card class="rp-card">
                    <div class="card-header">
                      <div class="card-icon-circle">
                        <i nz-icon nzType="file-text"></i>
                      </div>
                      <div class="card-header-text">
                        <h4 class="card-title">Employee List Report</h4>
                        <p class="card-subtitle">Generate a printable employee list with key fields</p>
                      </div>
                    </div>
                    <div class="card-body">
                      <p class="report-desc">This report includes: Employee Code, Name, Gender, Designation, Department, Date of Joining, Status, and Contact Information.</p>
                    </div>
                    <div class="card-footer">
                      <button nz-button nzType="default" (click)="exportEmployeeList()" class="action-btn">
                        <i nz-icon nzType="file-text"></i> Generate Report
                      </button>
                    </div>
                  </nz-card>
                </div>
              </div>
            </div>
          </nz-tab>

          <nz-tab nzTitle="Absenteeism">
            <div class="rp-content">
              <div nz-row [nzGutter]="[12, 12]" class="rp-row">
                <div nz-col nzXs="24" nzMd="8">
                  <nz-card class="rp-card stat-card">
                    <div class="stat-value-lg">{{ analytics?.absenteeism?.totalEmployees || 0 }}</div>
                    <div class="stat-label-sm">Total Employees</div>
                  </nz-card>
                </div>
                <div nz-col nzXs="24" nzMd="8">
                  <nz-card class="rp-card stat-card">
                    <div class="stat-value-lg">{{ analytics?.absenteeism?.absentToday || 0 }}</div>
                    <div class="stat-label-sm">Absent Today</div>
                  </nz-card>
                </div>
                <div nz-col nzXs="24" nzMd="8">
                  <nz-card class="rp-card stat-card">
                    <div class="stat-value-lg">{{ analytics?.absenteeism?.avgAbsenteeismRate || '0.0%' }}</div>
                    <div class="stat-label-sm">Avg Absenteeism Rate</div>
                  </nz-card>
                </div>
              </div>
            </div>
          </nz-tab>

          <nz-tab nzTitle="Attrition">
            <div class="rp-content">
              <div nz-row [nzGutter]="[12, 12]" class="rp-row">
                <div nz-col nzXs="24" nzMd="8">
                  <nz-card class="rp-card stat-card">
                    <div class="stat-value-lg">{{ analytics?.attrition?.totalExited || 0 }}</div>
                    <div class="stat-label-sm">Total Exited</div>
                  </nz-card>
                </div>
                <div nz-col nzXs="24" nzMd="8">
                  <nz-card class="rp-card stat-card">
                    <div class="stat-value-lg">{{ analytics?.attrition?.exitedThisMonth || 0 }}</div>
                    <div class="stat-label-sm">Exited This Month</div>
                  </nz-card>
                </div>
                <div nz-col nzXs="24" nzMd="8">
                  <nz-card class="rp-card stat-card">
                    <div class="stat-value-lg">{{ analytics?.attrition?.attritionRate || '0.0%' }}</div>
                    <div class="stat-label-sm">Attrition Rate</div>
                  </nz-card>
                </div>
              </div>
            </div>
          </nz-tab>

          <nz-tab nzTitle="Staff Demographic Data">
            <div class="rp-content">
              <div nz-row [nzGutter]="[12, 12]" class="rp-row">
                <div nz-col nzXs="24" nzMd="12">
                  <nz-card class="rp-card" nzTitle="Gender Distribution">
                    <nz-table nzTemplateMode nzSize="small" class="demo-table" *ngIf="demographics?.genderDistribution?.length">
                      <thead>
                        <tr>
                          <th>Gender</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let item of demographics?.genderDistribution">
                          <td>{{ item.gender }}</td>
                          <td><b>{{ item.count }}</b></td>
                        </tr>
                      </tbody>
                    </nz-table>
                    <p class="empty-tbl" *ngIf="!demographics?.genderDistribution?.length">No data</p>
                  </nz-card>
                </div>
                <div nz-col nzXs="24" nzMd="12">
                  <nz-card class="rp-card" nzTitle="Age Bracket Distribution">
                    <nz-table nzTemplateMode nzSize="small" class="demo-table" *ngIf="demographics?.ageBracketDistribution?.length">
                      <thead>
                        <tr>
                          <th>Age Bracket</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let item of demographics?.ageBracketDistribution">
                          <td>{{ item.bracket }}</td>
                          <td><b>{{ item.count }}</b></td>
                        </tr>
                      </tbody>
                    </nz-table>
                    <p class="empty-tbl" *ngIf="!demographics?.ageBracketDistribution?.length">No data</p>
                  </nz-card>
                </div>
              </div>
              <div nz-row [nzGutter]="[12, 12]" class="rp-row">
                <div nz-col nzXs="24" nzMd="12">
                  <nz-card class="rp-card" nzTitle="Designation Distribution">
                    <nz-table nzTemplateMode nzSize="small" class="demo-table" *ngIf="demographics?.designationDistribution?.length">
                      <thead>
                        <tr>
                          <th>Designation</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let item of demographics?.designationDistribution">
                          <td>{{ item.designation }}</td>
                          <td><b>{{ item.count }}</b></td>
                        </tr>
                      </tbody>
                    </nz-table>
                    <p class="empty-tbl" *ngIf="!demographics?.designationDistribution?.length">No data</p>
                  </nz-card>
                </div>
                <div nz-col nzXs="24" nzMd="12">
                  <nz-card class="rp-card" nzTitle="Status Distribution">
                    <nz-table nzTemplateMode nzSize="small" class="demo-table" *ngIf="demographics?.statusDistribution?.length">
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let item of demographics?.statusDistribution">
                          <td>{{ item.status }}</td>
                          <td><b>{{ item.count }}</b></td>
                        </tr>
                      </tbody>
                    </nz-table>
                    <p class="empty-tbl" *ngIf="!demographics?.statusDistribution?.length">No data</p>
                  </nz-card>
                </div>
              </div>
            </div>
          </nz-tab>
        </nz-tabset>
      </div>

      <div *ngIf="activeSection === 'labour'">
        <app-labour-reports [showHeader]="false"></app-labour-reports>
      </div>
    </div>
  `,
  styles: [`
    .rp-container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 0 16px 16px; }
    .pp-sub-nav {
      display: flex;
      gap: 2px;
      margin-bottom: 8px;
      background: #f0f4ff;
      border-radius: 10px;
      padding: 4px;
      border: 1px solid #e0e7ff;
    }
    .pp-nav-item {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      color: #6c757d;
      text-decoration: none;
      transition: all .15s;
      cursor: pointer;
    }
    .pp-nav-item:hover { background: rgba(67, 97, 238, 0.05); color: #4361ee; }
    .pp-nav-item.active { background: linear-gradient(135deg, #4361ee, #3a0ca3); color: #fff; box-shadow: 0 2px 6px rgba(67, 97, 238, 0.3); }
    .pp-nav-item.active:hover { background: linear-gradient(135deg, #4361ee, #3a0ca3); color: #fff; }
    .pp-nav-item.active i { color: #fff; }
    .pp-nav-item i { font-size: 14px; }

    .rp-controls-card {
      background: #fff !important;
      border: 1px solid #e8eaed !important;
      border-radius: 8px !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06) !important;
      margin-bottom: 12px;
      overflow: hidden;
    }
    :host ::ng-deep .rp-controls-card .ant-card-body { padding: 12px 20px; }
    .rp-controls { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .rp-filters { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
    .filter-item label { display: block; font-size: 11px; color: #6c757d; margin-bottom: 4px; font-weight: 500; text-transform: uppercase; letter-spacing: .3px; }
    .filter-select { min-width: 160px; }
    :host ::ng-deep .filter-select .ant-select-selector { border-radius: 8px !important; border: 1px solid #e2e5ea !important; height: 34px !important; }
    :host ::ng-deep .rp-controls button { border-radius: 8px; height: 34px; font-size: 13px; font-weight: 600; }

    .rp-tabs { margin-top: 0; }
    :host ::ng-deep .rp-tabs > .ant-tabs-nav { margin-bottom: 12px; }
    :host ::ng-deep .rp-tabs > .ant-tabs-nav .ant-tabs-tab { border-radius: 8px 8px 0 0 !important; font-size: 13px; padding: 8px 20px !important; }

    .rp-content { padding-top: 8px; }
    .rp-row { margin-bottom: 12px; }
    .rp-col { margin-bottom: 12px; }
    .rp-card {
      background: #fff !important;
      border: 1px solid #e8eaed !important;
      border-radius: 8px !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06) !important;
      overflow: hidden;
    }
    .card-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px 12px; border-bottom: 1px solid #f0f2f5; }
    .card-icon-circle { width: 40px; height: 40px; border-radius: 10px; background: #eff6ff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .card-icon-circle i { font-size: 18px; color: #2563eb; }
    .card-header-text { flex: 1; }
    .card-title { font-size: 15px; font-weight: 600; color: #1a1a2e; margin: 0 0 2px; }
    .card-subtitle { font-size: 12px; color: #6c757d; margin: 0; }
    .card-body { padding: 16px 20px; }
    .card-body-stats { padding: 8px 0; }
    .card-footer { padding: 12px 20px; border-top: 1px solid #f0f2f5; }

    .stats-summary { padding: 0; }
    .stat-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; border-bottom: 1px solid #f5f5f5; }
    .stat-row-alt { background: #fafbfc; }
    .stat-row-last { border-bottom: none; }
    .stat-left { display: flex; align-items: center; gap: 10px; }
    .stat-icon { font-size: 16px; color: #4361ee; width: 24px; text-align: center; }
    .stat-label { font-size: 13px; color: #555; }
    .stat-value { font-size: 18px; font-weight: 700; color: #1a1a2e; }
    .stats-empty { text-align: center; padding: 24px; }
    .stats-spinner { text-align: center; padding: 24px; }

    .stat-card { text-align: center; padding: 20px 0; }
    .stat-value-lg { font-size: 32px; font-weight: 700; color: #1a3a6b; }
    .stat-label-sm { font-size: 13px; color: #888; margin-top: 4px; }
    .report-desc { font-size: 13px; color: #555; line-height: 1.6; margin: 0; }
    .empty-tbl { text-align: center; color: #999; padding: 16px; }
    .action-btn { height: 34px; padding: 0 20px; font-size: 13px; font-weight: 600; border-radius: 8px; }
    :host ::ng-deep .ant-table-thead > tr > th { background: #f0f4ff; }
  `]
})
export class ReportsComponent implements OnInit {
  activeSection: 'reports' | 'labour' = 'reports';

  isExporting = false;
  statsLoading = false;
  stats: DashboardStats | null = null;
  analytics: any = null;
  demographics: any = null;

  exportFilterStatus = '';
  exportFilterDesignation = '';

  statusOptions: { value: string; label: string }[] = [];
  designationOptions: { value: string; label: string }[] = [];

  statItems: StatItem[] = [
    { key: 'totalEmployees', label: 'Total Employees', icon: 'team' },
    { key: 'activeEmployees', label: 'Active Employees', icon: 'check-circle' },
    { key: 'maleCount', label: 'Male', icon: 'man' },
    { key: 'femaleCount', label: 'Female', icon: 'woman' },
    { key: 'exitedEmployees', label: 'Exited', icon: 'logout' },
    { key: 'newThisMonth', label: 'New This Month', icon: 'user-add' },
  ];

  constructor(
    private employeeService: EmployeeService,
    private dashboardService: DashboardService,
    private masterDataService: MasterDataService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    this.masterDataService.getByCategory('EMPLOYEE_STATUS').subscribe(data => {
      this.statusOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('DESIGNATION').subscribe(data => {
      this.designationOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
  }

  getStatValue(key: string): number {
    if (!this.stats) return 0;
    return (this.stats as any)[key] || 0;
  }

  loadStats(): void {
    this.statsLoading = true;
    this.dashboardService.getStats().subscribe({
      next: (response) => {
        this.statsLoading = false;
        if (response.success) {
          this.stats = response.data;
        }
      },
      error: () => {
        this.statsLoading = false;
        this.notification.error('Error', 'Error loading statistics');
      }
    });
  }

  exportExcel(): void {
    this.isExporting = true;
    this.employeeService.exportToExcel({
      employeeStatus: this.exportFilterStatus || undefined,
      designation: this.exportFilterDesignation || undefined
    }).subscribe({
      next: (blob) => {
        this.isExporting = false;
        saveAs(blob, `employee_report_${new Date().toISOString().split('T')[0]}.xlsx`);
        this.notification.success('Success', 'Report exported successfully');
      },
      error: () => {
        this.isExporting = false;
        this.notification.error('Error', 'Error exporting report');
      }
    });
  }

  exportEmployeeList(): void {
    this.exportExcel();
  }
}
