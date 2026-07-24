import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { EmployeeService } from '../../core/services/employee.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { DashboardStats } from '../../core/models/api-response.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { saveAs } from 'file-saver';

interface StatItem {
  key: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzCardModule, NzButtonModule, NzIconModule, NzFormModule,
    NzInputModule, NzSelectModule, NzSpinModule, NzDividerModule, NzGridModule,
    PageHeaderComponent, NzTabsModule, NzTableModule, NzTagModule
  ],
  template: `
    <div class="reports-page page-enter">
      <app-page-header icon="bar-chart" title="Reports"></app-page-header>
      <nz-tabset nzType="card" class="reports-tabs">
        <nz-tab nzTitle="HR Statistics">
          <div class="reports-content">
            <div nz-row [nzGutter]="[12, 12]" class="reports-row reports-row-main">
              <div nz-col nzXs="24" nzMd="12" class="report-col">
                <nz-card class="report-card">
                  <div class="card-header">
                    <div class="card-icon-circle">
                      <i nz-icon nzType="download"></i>
                    </div>
                    <div class="card-header-text">
                      <h4 class="card-title">Export Employee Data</h4>
                      <p class="card-subtitle">Download complete employee database as Excel</p>
                    </div>
                  </div>
                  <div class="card-body">
                    <div class="filter-row">
                      <div class="filter-item">
                        <label class="filter-label">Status</label>
                        <nz-select nzPlaceHolder="All Statuses" [(ngModel)]="exportFilterStatus">
                          <nz-option nzValue="" nzLabel="All Statuses"></nz-option>
                          <nz-option *ngFor="let opt of statusOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
                        </nz-select>
                      </div>
                      <div class="filter-item">
                        <label class="filter-label">Designation</label>
                        <nz-select nzPlaceHolder="All Designations" [(ngModel)]="exportFilterDesignation">
                          <nz-option nzValue="" nzLabel="All Designations"></nz-option>
                          <nz-option *ngFor="let opt of designationOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
                        </nz-select>
                      </div>
                    </div>
                  </div>
                  <div class="card-footer">
                    <button nz-button nzType="primary" (click)="exportExcel()" [disabled]="isExporting" class="action-btn">
                      <i nz-icon nzType="download" *ngIf="!isExporting"></i>
                      <span>{{ isExporting ? 'Exporting...' : 'Export to Excel' }}</span>
                    </button>
                  </div>
                </nz-card>
              </div>

              <div nz-col nzXs="24" nzMd="12" class="report-col">
                <nz-card class="report-card">
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
            </div>

            <div nz-row [nzGutter]="[12, 12]" class="reports-row">
              <div nz-col nzXs="24" class="report-col">
                <nz-card class="report-card">
                  <div class="card-header">
                    <div class="card-icon-circle">
                      <i nz-icon nzType="unordered-list"></i>
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
          <div class="reports-content">
            <div nz-row [nzGutter]="[12, 12]" class="reports-row">
              <div nz-col nzXs="24" nzMd="8">
                <nz-card class="report-card stat-card">
                  <div class="stat-value-lg">{{ analytics?.absenteeism?.totalEmployees || 0 }}</div>
                  <div class="stat-label-sm">Total Employees</div>
                </nz-card>
              </div>
              <div nz-col nzXs="24" nzMd="8">
                <nz-card class="report-card stat-card">
                  <div class="stat-value-lg">{{ analytics?.absenteeism?.absentToday || 0 }}</div>
                  <div class="stat-label-sm">Absent Today</div>
                </nz-card>
              </div>
              <div nz-col nzXs="24" nzMd="8">
                <nz-card class="report-card stat-card">
                  <div class="stat-value-lg">{{ analytics?.absenteeism?.avgAbsenteeismRate || '0.0%' }}</div>
                  <div class="stat-label-sm">Avg Absenteeism Rate</div>
                </nz-card>
              </div>
            </div>
          </div>
        </nz-tab>
        <nz-tab nzTitle="Attrition">
          <div class="reports-content">
            <div nz-row [nzGutter]="[12, 12]" class="reports-row">
              <div nz-col nzXs="24" nzMd="8">
                <nz-card class="report-card stat-card">
                  <div class="stat-value-lg">{{ analytics?.attrition?.totalExited || 0 }}</div>
                  <div class="stat-label-sm">Total Exited</div>
                </nz-card>
              </div>
              <div nz-col nzXs="24" nzMd="8">
                <nz-card class="report-card stat-card">
                  <div class="stat-value-lg">{{ analytics?.attrition?.exitedThisMonth || 0 }}</div>
                  <div class="stat-label-sm">Exited This Month</div>
                </nz-card>
              </div>
              <div nz-col nzXs="24" nzMd="8">
                <nz-card class="report-card stat-card">
                  <div class="stat-value-lg">{{ analytics?.attrition?.attritionRate || '0.0%' }}</div>
                  <div class="stat-label-sm">Attrition Rate</div>
                </nz-card>
              </div>
            </div>
          </div>
        </nz-tab>
        <nz-tab nzTitle="Staff Demographic Data">
          <div class="reports-content">
            <div nz-row [nzGutter]="[12, 12]" class="reports-row">
              <div nz-col nzXs="24" nzMd="12">
                <nz-card class="report-card" nzTitle="Gender Distribution">
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
                <nz-card class="report-card" nzTitle="Age Bracket Distribution">
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
            <div nz-row [nzGutter]="[12, 12]" class="reports-row">
              <div nz-col nzXs="24" nzMd="12">
                <nz-card class="report-card" nzTitle="Designation Distribution">
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
                <nz-card class="report-card" nzTitle="Status Distribution">
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
  `,
  styles: [`
    .reports-tabs { margin-top: 16px; }
    .stat-card { text-align: center; padding: 16px 0; }
    .stat-value-lg { font-size: 32px; font-weight: 700; color: #1a3a6b; }
    .stat-label-sm { font-size: 13px; color: #888; margin-top: 4px; }
    .empty-tbl { text-align: center; color: #999; padding: 16px; }
    :host ::ng-deep .ant-table-thead > tr > th { background: #f0f4ff; }
  `]
})
export class ReportsComponent implements OnInit {

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
      error: (err) => {
        this.isExporting = false;
        this.notification.error('Error', 'Error exporting report');
      }
    });
  }

  exportEmployeeList(): void {
    this.exportExcel();
  }
}
