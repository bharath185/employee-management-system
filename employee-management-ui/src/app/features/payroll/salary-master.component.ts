import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { PayrollService } from '../../core/services/payroll.service';
import { EmployeeService } from '../../core/services/employee.service';
import { AuthService } from '../../core/services/auth.service';
import { SalaryMasterDTO } from '../../core/models/payroll.models';

@Component({
  selector: 'app-salary-master',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzTableModule, NzButtonModule, NzIconModule,
    NzInputNumberModule, NzInputModule, NzSelectModule, NzCardModule, NzSpinModule, NzTagModule,
    NzDrawerModule, NzTimelineModule, NzTabsModule, NzDescriptionsModule,
    NzModalModule, NzToolTipModule,
    RouterLink, RouterLinkActive
  ],
  template: `
    <div class="sm-container page-enter">
      <!-- Sub Navigation Bar -->
      <div class="pp-sub-nav">
        <a class="pp-nav-item active" routerLink="/admin/payroll/salary-master">
          <i nz-icon nzType="bank"></i><span>Salary Master</span>
        </a>
        <a class="pp-nav-item" routerLink="/admin/payroll/process" routerLinkActive="active">
          <i nz-icon nzType="play-circle"></i><span>Process</span>
        </a>
        <a class="pp-nav-item" routerLink="/admin/payroll/payslips" routerLinkActive="active">
          <i nz-icon nzType="file-text"></i><span>Payslips</span>
        </a>
        <a class="pp-nav-item" routerLink="/admin/payroll/config" routerLinkActive="active">
          <i nz-icon nzType="mail"></i><span>Config</span>
        </a>
      </div>

      <!-- Compact Simple View KPI Summary Bar -->
      <div class="sm-kpi-bar">
        <div class="kpi-mini-card">
          <span class="kpi-mini-label">Total Staff</span>
          <span class="kpi-mini-val">{{ filteredMasters.length }}</span>
        </div>
        <div class="kpi-mini-card border-blue">
          <span class="kpi-mini-label">Monthly Gross</span>
          <span class="kpi-mini-val val-blue">₹{{ totalGross | number:'1.2-2' }}</span>
        </div>
        <div class="kpi-mini-card border-amber">
          <span class="kpi-mini-label">Total Deductions</span>
          <span class="kpi-mini-val val-amber">₹{{ totalDeductions | number:'1.2-2' }}</span>
        </div>
        <div class="kpi-mini-card border-green">
          <span class="kpi-mini-label">Net In-Hand</span>
          <span class="kpi-mini-val val-green">₹{{ totalNet | number:'1.2-2' }}</span>
        </div>
        <div class="kpi-mini-card border-purple">
          <span class="kpi-mini-label">Annual CTC</span>
          <span class="kpi-mini-val val-purple">₹{{ totalCtc | number:'1.2-2' }}</span>
        </div>
      </div>

      <!-- Controls & Filter Toolbar Card -->
      <nz-card class="pp-controls-card" nzSize="small">
        <div class="filter-controls-row">
          <div class="filter-field search-box">
            <nz-input-group [nzPrefix]="searchIcon" class="search-input-group">
              <input nz-input [(ngModel)]="searchText" (ngModelChange)="applyFilter()" placeholder="Search code, name, designation, department..." class="filter-input" />
            </nz-input-group>
            <ng-template #searchIcon><i nz-icon nzType="search"></i></ng-template>
          </div>

          <div class="filter-field select-box">
            <nz-select [(ngModel)]="selectedWorkerType" (ngModelChange)="applyFilter()" nzPlaceHolder="Worker Type" class="filter-select" nzAllowClear style="width:130px">
              <nz-option nzValue="Permanent" nzLabel="Permanent"></nz-option>
              <nz-option nzValue="Contract" nzLabel="Contract"></nz-option>
              <nz-option nzValue="Casual" nzLabel="Casual"></nz-option>
            </nz-select>
          </div>

          <div class="action-btn-group">
            <button nz-button nzType="default" class="btn-ctrl" (click)="downloadTemplate()" [nzLoading]="templateLoading" nz-tooltip="Download sample Excel template with employee codes">
              <i nz-icon nzType="download"></i> Template
            </button>
            <button nz-button nzType="default" class="btn-ctrl" (click)="exportExcel()" [nzLoading]="exportLoading" nz-tooltip="Export all employee salary structures to Excel">
              <i nz-icon nzType="file-excel"></i> Export
            </button>
            <input type="file" #fileInput (change)="onFileSelected($event)" accept=".xlsx, .xls" style="display:none;" />
            <button nz-button nzType="default" class="btn-ctrl" [nzLoading]="importLoading" (click)="fileInput.click()" nz-tooltip="Import salary structures from Excel">
              <i nz-icon nzType="upload"></i> Import
            </button>
            <button nz-button class="btn-ctrl btn-sync" (click)="openSyncModal()" nz-tooltip="Sync Salary Master to monthly payroll and statutory reports">
              <i nz-icon nzType="sync"></i> Sync
            </button>
            <button nz-button class="btn-ctrl btn-sample" (click)="generateSamples()" [nzLoading]="sampleLoading" nz-tooltip="Auto-generate realistic salary structures for all employees">
              <i nz-icon nzType="thunderbolt"></i> Auto Samples
            </button>
            <button nz-button class="btn-primary-gradient" (click)="saveAll()" [nzLoading]="saving" [disabled]="!hasChanges">
              <i nz-icon nzType="save"></i> Save <span *ngIf="hasChanges">({{ changedIds.size }})</span>
            </button>
          </div>
        </div>
      </nz-card>

      <!-- Master Salary Table Card -->
      <div class="table-container">
        <nz-table 
          #smTable 
          [nzData]="filteredMasters" 
          [nzLoading]="loading" 
          nzSize="small" 
          nzBordered 
          [(nzPageIndex)]="pageIndex"
          [(nzPageSize)]="pageSize"
          [nzPageSizeOptions]="[10, 20, 50, 100]"
          [nzShowSizeChanger]="true"
          [nzShowPagination]="true"
          class="theme-table">
          <thead>
            <tr>
              <th class="th-sno" rowspan="2">#</th>
              <th rowspan="2">Employee</th>
              <th rowspan="2">Designation / Dept</th>
              <th colspan="4" class="th-group-earn">Earnings / Allowances (₹)</th>
              <th rowspan="2" class="th-gross">Gross Salary</th>
              <th colspan="4" class="th-group-ded">Statutory Deductions (₹)</th>
              <th rowspan="2" class="th-ded">Total Ded.</th>
              <th rowspan="2" class="th-net">Net In-Hand</th>
              <th rowspan="2" class="th-ctc">Annual CTC</th>
              <th rowspan="2">Worker Type</th>
              <th rowspan="2" class="th-actions">History</th>
            </tr>
            <tr>
              <th class="td-right">Basic</th>
              <th class="td-right">HRA</th>
              <th class="td-right">FPA</th>
              <th class="td-right">Other</th>

              <th class="td-right">PF</th>
              <th class="td-right">ESI</th>
              <th class="td-right">PT</th>
              <th class="td-right">Health Ins.</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of smTable.data; let i = index">
              <td class="td-center">{{ (pageIndex - 1) * pageSize + i + 1 }}</td>
              <td>
                <div class="emp-cell">
                  <span class="emp-code">{{ m.employeeCode }}</span>
                  <span class="emp-name">{{ m.employeeName }}</span>
                </div>
              </td>
              <td>
                <div class="desig-cell">
                  <span class="desig-text">{{ m.designation || '-' }}</span>
                  <span class="dept-tag">{{ m.department || '-' }}</span>
                </div>
              </td>

              <!-- Earnings -->
              <td class="td-right">
                <nz-input-number [(ngModel)]="m.basic" [nzMin]="0" [nzPrecision]="2" (ngModelChange)="onSalaryFieldChange(m)" class="cell-input"></nz-input-number>
              </td>
              <td class="td-right">
                <nz-input-number [(ngModel)]="m.hra" [nzMin]="0" [nzPrecision]="2" (ngModelChange)="onSalaryFieldChange(m)" class="cell-input"></nz-input-number>
              </td>
              <td class="td-right">
                <nz-input-number [(ngModel)]="m.fixedPersonalAllowance" [nzMin]="0" [nzPrecision]="2" (ngModelChange)="onSalaryFieldChange(m)" class="cell-input"></nz-input-number>
              </td>
              <td class="td-right">
                <nz-input-number [(ngModel)]="m.otherAllowance" [nzMin]="0" [nzPrecision]="2" (ngModelChange)="onSalaryFieldChange(m)" class="cell-input"></nz-input-number>
              </td>

              <!-- Gross Calculated -->
              <td class="td-right font-bold gross-val">
                ₹{{ getGross(m) | number:'1.2-2' }}
              </td>

              <!-- Deductions -->
              <td class="td-right">
                <nz-input-number [(ngModel)]="m.pfDeduction" [nzMin]="0" [nzPrecision]="2" (ngModelChange)="onSalaryFieldChange(m)" class="cell-input"></nz-input-number>
              </td>
              <td class="td-right">
                <nz-input-number [(ngModel)]="m.esiDeduction" [nzMin]="0" [nzPrecision]="2" (ngModelChange)="onSalaryFieldChange(m)" class="cell-input"></nz-input-number>
              </td>
              <td class="td-right">
                <nz-input-number [(ngModel)]="m.ptDeduction" [nzMin]="0" [nzPrecision]="2" (ngModelChange)="onSalaryFieldChange(m)" class="cell-input"></nz-input-number>
              </td>
              <td class="td-right">
                <nz-input-number [(ngModel)]="m.healthInsurance" [nzMin]="0" [nzPrecision]="2" (ngModelChange)="onSalaryFieldChange(m)" class="cell-input"></nz-input-number>
              </td>

              <!-- Total Deductions -->
              <td class="td-right font-bold ded-val">
                ₹{{ getDeductions(m) | number:'1.2-2' }}
              </td>

              <!-- Net In Hand -->
              <td class="td-right font-bold net-val">
                ₹{{ getNet(m) | number:'1.2-2' }}
              </td>

              <!-- Annual CTC -->
              <td class="td-right font-bold ctc-val">
                ₹{{ getCtc(m) | number:'1.2-2' }}
              </td>

              <!-- Worker Type -->
              <td>
                <nz-select [(ngModel)]="m.workerType" (ngModelChange)="markChanged(m)" nzSize="small" style="width:105px">
                  <nz-option nzValue="Permanent" nzLabel="Permanent"></nz-option>
                  <nz-option nzValue="Contract" nzLabel="Contract"></nz-option>
                  <nz-option nzValue="Casual" nzLabel="Casual"></nz-option>
                </nz-select>
              </td>

              <!-- Actions -->
              <td class="td-center">
                <button nz-button nzType="link" nzSize="small" (click)="showHistory(m)" nz-tooltip="View history & snapshots">
                  <i nz-icon nzType="clock-circle"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="filteredMasters.length === 0 && !loading">
              <td colspan="17" class="empty-cell">No matching salary master records found</td>
            </tr>
          </tbody>
        </nz-table>
      </div>

      <!-- ===== SYNC TO MONTH MODAL ===== -->
      <nz-modal [(nzVisible)]="isSyncModalVisible" nzTitle="Sync Salary Master to Payroll Reports" (nzOnCancel)="isSyncModalVisible = false" (nzOnOk)="executeSync()" [nzOkLoading]="syncLoading">
        <ng-container *nzModalContent>
          <p style="color:#4b5563;font-size:13px;line-height:1.6">
            This will copy all active Salary Master structures into monthly payroll records, allowing immediate generation of <strong>Wages Register</strong>, <strong>Individual Worker Details</strong>, and <strong>Salary Slips</strong> for the selected month.
          </p>
          <div style="display:flex;gap:12px;margin-top:16px;">
            <div style="flex:1">
              <label style="display:block;margin-bottom:6px;font-size:12px;font-weight:600;color:#374151">Year</label>
              <nz-select [(ngModel)]="syncYear" style="width:100%">
                <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y.toString()"></nz-option>
              </nz-select>
            </div>
            <div style="flex:1">
              <label style="display:block;margin-bottom:6px;font-size:12px;font-weight:600;color:#374151">Month</label>
              <nz-select [(ngModel)]="syncMonth" style="width:100%">
                <nz-option *ngFor="let m of months" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
              </nz-select>
            </div>
          </div>
        </ng-container>
      </nz-modal>

      <!-- ===== HISTORY DRAWER ===== -->
      <nz-drawer
        [nzVisible]="historyDrawer"
        [nzTitle]="drawerTitle"
        (nzOnClose)="historyDrawer = false"
        nzWidth="560">
        <div *nzDrawerContent>
          <nz-tabset>
            <nz-tab nzTitle="Monthly Snapshots">
              <div *ngIf="snapshotsLoading" style="text-align:center;padding:40px"><i nz-icon nzType="loading" style="font-size:24px"></i></div>
              <div *ngIf="!snapshotsLoading && snapshots.length === 0" style="text-align:center;padding:40px;color:#9ca3af">
                No snapshots yet. Snapshots are recorded automatically on save.
              </div>
              <nz-timeline *ngIf="!snapshotsLoading && snapshots.length > 0">
                <nz-timeline-item *ngFor="let s of snapshots" nzColor="blue">
                  <div class="snapshot-header">
                    <strong>{{ getMonthName(s.snapshotMonth) }} {{ s.snapshotYear }}</strong>
                    <span class="snapshot-by">by {{ s.changedBy || 'system' }}</span>
                  </div>
                  <nz-descriptions nzSize="small" [nzColumn]="2" class="snapshot-desc">
                    <nz-descriptions-item nzTitle="Basic" [nzSpan]="1">₹{{ s.basic | number:'1.2-2' }}</nz-descriptions-item>
                    <nz-descriptions-item nzTitle="HRA" [nzSpan]="1">₹{{ s.hra | number:'1.2-2' }}</nz-descriptions-item>
                    <nz-descriptions-item nzTitle="FPA" [nzSpan]="1">₹{{ s.fixedPersonalAllowance | number:'1.2-2' }}</nz-descriptions-item>
                    <nz-descriptions-item nzTitle="Other" [nzSpan]="1">₹{{ s.otherAllowance | number:'1.2-2' }}</nz-descriptions-item>
                    <nz-descriptions-item nzTitle="PF" [nzSpan]="1">₹{{ s.pfDeduction | number:'1.2-2' }}</nz-descriptions-item>
                    <nz-descriptions-item nzTitle="ESI" [nzSpan]="1">₹{{ s.esiDeduction | number:'1.2-2' }}</nz-descriptions-item>
                    <nz-descriptions-item nzTitle="PT" [nzSpan]="1">₹{{ s.ptDeduction | number:'1.2-2' }}</nz-descriptions-item>
                    <nz-descriptions-item nzTitle="Health Ins." [nzSpan]="1">₹{{ s.healthInsurance | number:'1.2-2' }}</nz-descriptions-item>
                    <nz-descriptions-item nzTitle="Worker Type" [nzSpan]="2">{{ s.workerType }}</nz-descriptions-item>
                  </nz-descriptions>
                  <div class="snapshot-divider"></div>
                </nz-timeline-item>
              </nz-timeline>
            </nz-tab>
            <nz-tab nzTitle="Field Changes">
              <div *ngIf="historyLoading" style="text-align:center;padding:40px"><i nz-icon nzType="loading" style="font-size:24px"></i></div>
              <nz-timeline *ngIf="!historyLoading && historyItems.length > 0">
                <nz-timeline-item *ngFor="let h of historyItems">
                  <span style="font-size:12px;color:#6c757d">{{ h.changedAt | date:'dd MMM yyyy HH:mm' }}</span>
                  <br/>
                  <span style="font-size:13px"><strong>{{ h.fieldName }}</strong>: {{ h.oldValue || '—' }} → {{ h.newValue }}</span>
                  <br/>
                  <span style="font-size:11px;color:#9ca3af">by {{ h.changedBy || 'system' }}</span>
                </nz-timeline-item>
              </nz-timeline>
              <div *ngIf="!historyLoading && historyItems.length === 0" style="text-align:center;padding:40px;color:#9ca3af">No change logs recorded yet</div>
            </nz-tab>
          </nz-tabset>
        </div>
      </nz-drawer>
    </div>
  `,
  styles: [`
    .sm-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 0 16px 16px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }

    /* ── Top Sub-Nav ── */
    .pp-sub-nav {
      display: flex;
      gap: 2px;
      margin-bottom: 10px;
      background: #f0f4ff;
      border-radius: 10px;
      padding: 4px;
      border: 1px solid #e0e7ff;
    }
    .pp-nav-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      color: #6c757d;
      text-decoration: none;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .pp-nav-item i { font-size: 16px; width: 16px; display: inline-flex; align-items: center; justify-content: center; }
    .pp-nav-item:hover { background: rgba(31,61,110,0.06); color: #1f3d6e; }
    .pp-nav-item.active {
      background: #ffffff;
      color: #1f3d6e;
      box-shadow: 0 2px 8px rgba(31,61,110,0.1);
    }
    .pp-nav-item.active i { color: #1f3d6e; }

    /* ── Compact Simple View KPI Metric Chips ── */
    .sm-kpi-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 10px;
      flex-wrap: wrap;
      align-items: center;
    }
    .kpi-mini-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 5px 11px;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    }
    .kpi-mini-label {
      color: #6b7280;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .kpi-mini-val {
      font-weight: 700;
      font-size: 13px;
      color: #111827;
    }
    .border-blue { border-left: 3px solid #3b82f6; }
    .border-amber { border-left: 3px solid #f59e0b; }
    .border-green { border-left: 3px solid #10b981; }
    .border-purple { border-left: 3px solid #8b5cf6; }
    .val-blue { color: #1d4ed8; }
    .val-amber { color: #d97706; }
    .val-green { color: #15803d; }
    .val-purple { color: #7e22ce; }

    /* ── Unified Controls Card ── */
    .pp-controls-card {
      border-radius: 8px !important;
      border: 1px solid #e8eaed !important;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04) !important;
      margin-bottom: 10px;
    }
    :host ::ng-deep .pp-controls-card .ant-card-body {
      padding: 8px 12px !important;
    }
    .filter-controls-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: space-between;
    }
    .filter-field {
      display: inline-flex;
      align-items: center;
    }
    .search-box {
      flex: 1;
      min-width: 220px;
      max-width: 320px;
    }
    .search-input-group { width: 100%; }
    .filter-input {
      border-radius: 6px !important;
      height: 32px !important;
      font-size: 12.5px !important;
    }
    .filter-select {
      border-radius: 6px !important;
    }

    .action-btn-group {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      margin-left: auto;
    }
    .btn-ctrl {
      height: 32px !important;
      padding: 0 11px !important;
      font-size: 12px !important;
      font-weight: 500 !important;
      border-radius: 6px !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 5px !important;
    }
    .btn-sync {
      background: #eff6ff !important;
      border-color: #bfdbfe !important;
      color: #1d4ed8 !important;
      font-weight: 600 !important;
    }
    .btn-sync:hover {
      background: #dbeafe !important;
      border-color: #93c5fd !important;
    }
    .btn-sample {
      background: #f0fdf4 !important;
      border-color: #bbf7d0 !important;
      color: #15803d !important;
      font-weight: 600 !important;
    }
    .btn-sample:hover {
      background: #dcfce7 !important;
      border-color: #86efac !important;
    }
    .btn-primary-gradient {
      height: 32px !important;
      padding: 0 14px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      border: none !important;
      border-radius: 6px !important;
      background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
      color: #fff !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 5px !important;
      box-shadow: 0 2px 6px rgba(37,99,235,0.25) !important;
      transition: all 0.2s ease !important;
    }
    .btn-primary-gradient:hover {
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 10px rgba(37,99,235,0.35) !important;
    }
    .btn-primary-gradient[disabled] {
      opacity: 0.6;
      cursor: not-allowed !important;
      transform: none !important;
    }

    /* ── Table Container & Styles ── */
    .table-container {
      background: #ffffff;
      border: 1px solid #e8eaed;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }
    .cell-input, :host ::ng-deep .cell-input { width: 100% !important; }
    :host ::ng-deep .cell-input .ant-input-number {
      border-radius: 4px !important;
      border: 1px solid #d1d5db !important;
      width: 100% !important;
      transition: all 0.2s ease !important;
    }
    :host ::ng-deep .cell-input .ant-input-number:hover { border-color: #2563eb !important; }
    :host ::ng-deep .cell-input .ant-input-number-focused {
      border-color: #2563eb !important;
      box-shadow: 0 0 0 2px rgba(37,99,235,0.1) !important;
    }
    :host ::ng-deep .cell-input .ant-input-number-input {
      height: 25px !important;
      font-size: 11px !important;
      text-align: right !important;
      padding: 0 4px !important;
    }
    :host ::ng-deep .theme-table { width: 100% !important; }
    :host ::ng-deep .theme-table .ant-table { font-size: 11px; }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th {
      background: #f8f9fc !important;
      color: #1f3d6e !important;
      font-size: 10px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.3px !important;
      padding: 5px 4px !important;
      border-bottom: 1px solid #cbd5e1 !important;
      white-space: nowrap;
      text-align: center !important;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr > td {
      padding: 3px 4px !important;
      border-bottom: 1px solid #f1f5f9 !important;
      font-size: 11px;
      color: #374151;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr:hover > td {
      background: rgba(37,99,235,0.03) !important;
    }

    .th-group-earn { background: #eff6ff !important; color: #1d4ed8 !important; }
    .th-group-ded { background: #fef2f2 !important; color: #b91c1c !important; }
    .th-gross { background: #dbeafe !important; color: #1e40af !important; }
    .th-ded { background: #fee2e2 !important; color: #991b1b !important; }
    .th-net { background: #dcfce7 !important; color: #166534 !important; }
    .th-ctc { background: #f3e8ff !important; color: #6b21a8 !important; }

    .gross-val { color: #1d4ed8; font-weight: 700; }
    .ded-val { color: #dc2626; font-weight: 700; }
    .net-val { color: #15803d; font-weight: 700; }
    .ctc-val { color: #7e22ce; font-weight: 700; }

    .emp-cell { display: flex; flex-direction: column; gap: 1px; }
    .emp-code { font-weight: 700; color: #1f3d6e; font-size: 10.5px; }
    .emp-name { font-size: 11px; color: #374151; white-space: nowrap; font-weight: 500; }

    .desig-cell { display: flex; flex-direction: column; gap: 1px; }
    .desig-text { font-size: 10.5px; color: #4b5563; font-weight: 500; }
    .dept-tag {
      font-size: 9px;
      color: #6b7280;
      text-transform: uppercase;
      background: #f3f4f6;
      padding: 1px 3px;
      border-radius: 3px;
      display: inline-block;
      width: fit-content;
    }

    .th-sno { width: 30px !important; text-align: center !important; }
    .th-actions { text-align: center !important; width: 44px; }
    .td-center { text-align: center !important; }
    .td-right { text-align: right !important; white-space: nowrap; }
    .font-bold { font-weight: 700; }
    .empty-cell { text-align: center !important; padding: 28px !important; color: #9ca3af !important; font-size: 12.5px; font-style: italic; }

    /* ── Snapshot Drawer ── */
    .snapshot-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .snapshot-by { font-size: 11px; color: #9ca3af; }
    .snapshot-desc { margin-bottom: 4px; }
    :host ::ng-deep .snapshot-desc .ant-descriptions-item-label { font-size: 11px !important; font-weight: 600 !important; color: #6c757d !important; }
    :host ::ng-deep .snapshot-desc .ant-descriptions-item-content { font-size: 11.5px !important; font-weight: 600 !important; color: #374151 !important; }
    .snapshot-divider { height: 1px; background: #e8eaed; margin: 8px 0 12px; }
  `]
})
export class SalaryMasterComponent implements OnInit {
  masters: SalaryMasterDTO[] = [];
  filteredMasters: SalaryMasterDTO[] = [];
  loading = false;
  saving = false;
  hasChanges = false;
  changedIds = new Set<number>();
  pageIndex = 1;
  pageSize = 10;

  searchText = '';
  selectedWorkerType: string | null = null;

  templateLoading = false;
  exportLoading = false;
  importLoading = false;
  sampleLoading = false;

  isSyncModalVisible = false;
  syncLoading = false;
  syncYear = new Date().getFullYear();
  syncMonth = new Date().getMonth() + 1;
  years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  historyDrawer = false;
  drawerTitle = '';
  historyItems: any[] = [];
  historyLoading = false;
  snapshots: any[] = [];
  snapshotsLoading = false;

  constructor(
    private payrollService: PayrollService,
    private employeeService: EmployeeService,
    public authService: AuthService,
    private msg: NzMessageService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.loadMasters();
  }

  loadMasters(): void {
    this.loading = true;
    this.payrollService.getSalaryMaster().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.masters = res.data;
          this.applyFilter();
        } else {
          this.masters = [];
          this.filteredMasters = [];
        }
        this.loading = false;
        this.hasChanges = false;
        this.changedIds.clear();
      },
      error: () => {
        this.loading = false;
        this.initForAll();
      }
    });
  }

  initForAll(): void {
    this.payrollService.initAllSalaryMaster().subscribe({
      next: (res) => {
        if (res.data) {
          this.masters = res.data;
          this.applyFilter();
        }
      }
    });
  }

  applyFilter(): void {
    const q = this.searchText.trim().toLowerCase();
    this.filteredMasters = this.masters.filter(m => {
      const matchSearch = !q ||
        (m.employeeCode && m.employeeCode.toLowerCase().includes(q)) ||
        (m.employeeName && m.employeeName.toLowerCase().includes(q)) ||
        (m.designation && m.designation.toLowerCase().includes(q)) ||
        (m.department && m.department.toLowerCase().includes(q));

      const matchType = !this.selectedWorkerType || m.workerType === this.selectedWorkerType;
      return matchSearch && matchType;
    });
  }

  onSalaryFieldChange(m: SalaryMasterDTO): void {
    this.markChanged(m);
  }

  markChanged(m: SalaryMasterDTO): void {
    if (m.id) this.changedIds.add(m.id);
    this.hasChanges = this.changedIds.size > 0;
  }

  getGross(m: SalaryMasterDTO): number {
    return (m.basic || 0) + (m.hra || 0) + (m.fixedPersonalAllowance || 0) + (m.otherAllowance || 0);
  }

  getDeductions(m: SalaryMasterDTO): number {
    return (m.pfDeduction || 0) + (m.esiDeduction || 0) + (m.ptDeduction || 0) + (m.healthInsurance || 0);
  }

  getNet(m: SalaryMasterDTO): number {
    const gross = this.getGross(m);
    const ded = this.getDeductions(m);
    const extra = (m.bonus || 0) + (m.appraisalAmount || 0) + (m.lateSittingAmount || 0) + (m.overtimeWages || 0);
    const net = gross - ded + extra;
    return net < 0 ? 0 : net;
  }

  getCtc(m: SalaryMasterDTO): number {
    const gross = this.getGross(m);
    const pf = m.pfDeduction || 0;
    const esi = m.esiDeduction || 0;
    return (gross + pf + esi) * 12;
  }

  get totalGross(): number {
    return this.filteredMasters.reduce((acc, m) => acc + this.getGross(m), 0);
  }

  get totalDeductions(): number {
    return this.filteredMasters.reduce((acc, m) => acc + this.getDeductions(m), 0);
  }

  get totalNet(): number {
    return this.filteredMasters.reduce((acc, m) => acc + this.getNet(m), 0);
  }

  get totalCtc(): number {
    return this.filteredMasters.reduce((acc, m) => acc + this.getCtc(m), 0);
  }

  saveAll(): void {
    this.saving = true;
    const changed = this.masters.filter(m => m.id && this.changedIds.has(m.id));
    let done = 0;
    let errors = 0;
    changed.forEach(m => {
      this.payrollService.saveSalaryMaster(m).subscribe({
        next: () => { done++; },
        error: () => { errors++; },
        complete: () => {
          if (done + errors === changed.length) {
            this.saving = false;
            if (errors === 0) this.msg.success(`${done} employee salary structure(s) saved`);
            else this.msg.warning(`${done} saved, ${errors} failed`);
            this.loadMasters();
          }
        }
      });
    });
    if (changed.length === 0) {
      this.saving = false;
      this.msg.info('No changes to save');
    }
  }

  downloadTemplate(): void {
    this.templateLoading = true;
    this.payrollService.downloadSalaryMasterTemplate().subscribe({
      next: (blob) => {
        this.saveBlob(blob, 'Salary_Master_Import_Template.xlsx');
        this.templateLoading = false;
        this.msg.success('Salary Master template downloaded');
      },
      error: () => {
        this.templateLoading = false;
        this.msg.error('Failed to download template');
      }
    });
  }

  exportExcel(): void {
    this.exportLoading = true;
    this.payrollService.exportSalaryMasterExcel().subscribe({
      next: (blob) => {
        this.saveBlob(blob, 'Salary_Master_Export.xlsx');
        this.exportLoading = false;
        this.msg.success('Salary Master directory exported');
      },
      error: () => {
        this.exportLoading = false;
        this.msg.error('Failed to export Excel');
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    this.importLoading = true;
    this.payrollService.importSalaryMasterExcel(file).subscribe({
      next: (res) => {
        this.importLoading = false;
        const imported = res.data?.importedCount || 0;
        const skipped = res.data?.skippedCount || 0;
        this.msg.success(`Imported/updated ${imported} employee salary structures (${skipped} skipped)`);
        this.loadMasters();
        event.target.value = '';
      },
      error: (err) => {
        this.importLoading = false;
        this.msg.error(err.error?.message || 'Failed to import Excel file');
        event.target.value = '';
      }
    });
  }

  generateSamples(): void {
    this.modal.confirm({
      nzTitle: 'Auto Generate Sample Salaries?',
      nzContent: 'This will generate realistic salary components (Basic, HRA, FPA, PF, ESI, PT) based on employee designations for all live employees, and sync them for statutory reports.',
      nzOkText: 'Generate & Sync',
      nzOkType: 'primary',
      nzOnOk: () => {
        this.sampleLoading = true;
        this.payrollService.seedSampleSalaries().subscribe({
          next: (res) => {
            this.sampleLoading = false;
            this.msg.success(res.message || 'Sample salary data generated and synced');
            this.loadMasters();
          },
          error: (err) => {
            this.sampleLoading = false;
            this.msg.error(err.error?.message || 'Failed to seed sample salaries');
          }
        });
      }
    });
  }

  openSyncModal(): void {
    this.isSyncModalVisible = true;
  }

  executeSync(): void {
    this.syncLoading = true;
    this.payrollService.syncSalaryMasterToMonth(this.syncYear, this.syncMonth).subscribe({
      next: (res) => {
        this.syncLoading = false;
        this.isSyncModalVisible = false;
        this.msg.success(`Synced ${res.data?.totalSynced || 0} salary records to ${this.syncMonth}/${this.syncYear}`);
      },
      error: (err) => {
        this.syncLoading = false;
        this.msg.error(err.error?.message || 'Failed to sync salaries');
      }
    });
  }

  showHistory(m: SalaryMasterDTO): void {
    if (!m.employeeId) return;
    this.drawerTitle = (m.employeeCode || '') + ' — ' + (m.employeeName || '');
    this.historyDrawer = true;
    this.historyLoading = true;
    this.snapshotsLoading = true;
    this.historyItems = [];
    this.snapshots = [];

    this.payrollService.getSalaryMasterHistory(m.employeeId).subscribe({
      next: (res) => { this.historyItems = res.data || []; this.historyLoading = false; },
      error: () => { this.historyLoading = false; }
    });
    this.payrollService.getSalaryMasterSnapshots(m.employeeId).subscribe({
      next: (res) => { this.snapshots = res.data || []; this.snapshotsLoading = false; },
      error: () => { this.snapshotsLoading = false; }
    });
  }

  getMonthName(m: number): string {
    const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return names[m - 1] || '';
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
