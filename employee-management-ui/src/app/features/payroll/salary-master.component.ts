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
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { PayrollService } from '../../core/services/payroll.service';
import { EmployeeService } from '../../core/services/employee.service';
import { AuthService } from '../../core/services/auth.service';
import { DocumentTemplateService } from '../../core/services/document-template.service';
import { openDocumentPrintPreview } from '../../shared/utils/print-document';
import { SalaryMasterDTO } from '../../core/models/payroll.models';

@Component({
  selector: 'app-salary-master',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzTableModule, NzButtonModule, NzIconModule,
    NzInputNumberModule, NzInputModule, NzSelectModule, NzCardModule, NzSpinModule, NzTagModule,
    NzDrawerModule, NzTimelineModule, NzTabsModule, NzDescriptionsModule,
    NzModalModule, NzToolTipModule, NzBadgeModule, NzDividerModule,
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
          <span class="kpi-mini-label">Records</span>
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
            <nz-select [(ngModel)]="selectedStatus" (ngModelChange)="applyFilter()" class="filter-select" style="width:130px" nzPlaceHolder="Status">
              <nz-option nzValue="LIVE" nzLabel="Live Staff"></nz-option>
              <nz-option nzValue="QUIT" nzLabel="Quit Staff"></nz-option>
              <nz-option nzValue="ALL" nzLabel="All Staff"></nz-option>
            </nz-select>
          </div>

          <div class="filter-field select-box">
            <nz-select [(ngModel)]="selectedWorkerType" (ngModelChange)="applyFilter()" nzPlaceHolder="Worker Type" class="filter-select" nzAllowClear style="width:130px">
              <nz-option nzValue="Permanent" nzLabel="Permanent"></nz-option>
              <nz-option nzValue="Contract" nzLabel="Contract"></nz-option>
              <nz-option nzValue="Casual" nzLabel="Casual"></nz-option>
            </nz-select>
          </div>

          <div class="action-btn-group">
            <button nz-button nzType="default" class="btn-ctrl" (click)="initForAll()" [nzLoading]="initLoading" nz-tooltip="Initialize salary master for missing live employees">
              <i nz-icon nzType="usergroup-add"></i> Sync Live Staff
            </button>
            <button nz-button nzType="default" class="btn-ctrl" (click)="downloadTemplate()" [nzLoading]="templateLoading" nz-tooltip="Download Excel import template with employee codes">
              <i nz-icon nzType="download"></i> Template
            </button>
            <button nz-button nzType="default" class="btn-ctrl" (click)="exportExcel()" [nzLoading]="exportLoading" nz-tooltip="Export salary master records to Excel">
              <i nz-icon nzType="file-excel"></i> Export
            </button>
            <input type="file" #fileInput (change)="onFileSelected($event)" accept=".xlsx, .xls" style="display:none;" />
            <button nz-button nzType="default" class="btn-ctrl" [nzLoading]="importLoading" (click)="fileInput.click()" nz-tooltip="Load fresh / update salary master from Excel file">
              <i nz-icon nzType="upload"></i> Import Excel
            </button>
            <button nz-button nzDanger class="btn-ctrl" (click)="deleteAllPrompt()" [disabled]="masters.length === 0" nz-tooltip="Clear all salary master records to load fresh data">
              <i nz-icon nzType="delete"></i> Delete All
            </button>
            <button nz-button class="btn-primary-gradient" (click)="saveAll()" [nzLoading]="saving" [disabled]="!hasChanges">
              <i nz-icon nzType="save"></i> Save Changes <span *ngIf="hasChanges">({{ changedIds.size }})</span>
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
              <th rowspan="2" class="th-actions">Actions</th>
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
                  <div style="display:flex;align-items:center;gap:4px;">
                    <span class="emp-code">{{ m.employeeCode }}</span>
                    <nz-tag *ngIf="m.employeeStatus === 'QUIT' || m.employeeStatus === 'RESIGNED' || m.employeeStatus === 'TERMINATED'" [nzColor]="'red'" style="font-size:9px;line-height:14px;padding:0 3px;margin:0;">QUIT</nz-tag>
                    <nz-tag *ngIf="m.employeeStatus === 'LIVE'" [nzColor]="'green'" style="font-size:9px;line-height:14px;padding:0 3px;margin:0;">LIVE</nz-tag>
                  </div>
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
                <div style="display:flex;align-items:center;justify-content:center;gap:3px;">
                  <button *ngIf="m.id && changedIds.has(m.id)" nz-button nzType="link" nzSize="small" (click)="saveSingle(m)" nz-tooltip="Save this employee" style="color:#16a34a;padding:0 2px;">
                    <i nz-icon nzType="check-circle" nzTheme="fill"></i>
                  </button>
                  <button nz-button nzType="link" nzSize="small" (click)="openEditModal(m)" nz-tooltip="Edit all components" style="color:#2563eb;padding:0 2px;">
                    <i nz-icon nzType="edit"></i>
                  </button>
                  <button nz-button nzType="link" nzSize="small" (click)="openAppointmentLetter(m)" nz-tooltip="Appointment Letter" style="color:#4f46e5;padding:0 2px;">
                    <i nz-icon nzType="file-done"></i>
                  </button>
                  <button nz-button nzType="link" nzSize="small" (click)="showHistory(m)" nz-tooltip="History & Snapshots" style="padding:0 2px;">
                    <i nz-icon nzType="clock-circle"></i>
                  </button>
                  <button nz-button nzType="link" nzSize="small" (click)="deleteMaster(m)" nz-tooltip="Delete Salary Master" style="color:#dc2626;padding:0 2px;">
                    <i nz-icon nzType="delete"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredMasters.length === 0 && !loading">
              <td colspan="17" class="empty-cell">
                <div style="padding:20px;">
                  <p style="margin-bottom:8px;font-weight:500;">No salary master records found.</p>
                  <p style="color:#6b7280;font-size:12px;margin-bottom:12px;">You can import fresh salary records from Excel or initialize live staff.</p>
                  <div style="display:flex;gap:8px;justify-content:center;">
                    <button nz-button nzType="primary" nzSize="small" (click)="initForAll()">
                      <i nz-icon nzType="usergroup-add"></i> Initialize Live Staff
                    </button>
                    <button nz-button nzSize="small" (click)="fileInput.click()">
                      <i nz-icon nzType="upload"></i> Import from Excel
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </nz-table>
      </div>

      <!-- ===== EDIT INDIVIDUAL EMPLOYEE SALARY MASTER MODAL ===== -->
      <nz-modal
        [(nzVisible)]="isEditModalVisible"
        [nzTitle]="editModalTitle"
        (nzOnCancel)="isEditModalVisible = false"
        nzWidth="780px"
        [nzFooter]="editModalFooter">
        <ng-template nzModalContent>
          <div *ngIf="editingMaster" class="edit-salary-modal-content">
            <!-- Dynamic KPI Calculation Cards -->
            <div class="edit-kpi-summary">
              <div class="kpi-box box-gross">
                <span class="box-label">Monthly Gross</span>
                <span class="box-val">₹{{ getGross(editingMaster) | number:'1.2-2' }}</span>
              </div>
              <div class="kpi-box box-ded">
                <span class="box-label">Total Deductions</span>
                <span class="box-val">₹{{ getDeductions(editingMaster) | number:'1.2-2' }}</span>
              </div>
              <div class="kpi-box box-net">
                <span class="box-label">Net In-Hand</span>
                <span class="box-val">₹{{ getNet(editingMaster) | number:'1.2-2' }}</span>
              </div>
              <div class="kpi-box box-ctc">
                <span class="box-label">Annual CTC</span>
                <span class="box-val">₹{{ getCtc(editingMaster) | number:'1.2-2' }}</span>
              </div>
            </div>

            <!-- Earnings / Allowances -->
            <div class="form-section-title">Earnings / Allowances (₹)</div>
            <div class="modal-form-grid">
              <div class="form-group">
                <label>Basic Pay *</label>
                <nz-input-number [(ngModel)]="editingMaster.basic" [nzMin]="0" [nzPrecision]="2" style="width:100%"></nz-input-number>
              </div>
              <div class="form-group">
                <label>HRA</label>
                <nz-input-number [(ngModel)]="editingMaster.hra" [nzMin]="0" [nzPrecision]="2" style="width:100%"></nz-input-number>
              </div>
              <div class="form-group">
                <label>Fixed Personal Allowance (FPA)</label>
                <nz-input-number [(ngModel)]="editingMaster.fixedPersonalAllowance" [nzMin]="0" [nzPrecision]="2" style="width:100%"></nz-input-number>
              </div>
              <div class="form-group">
                <label>Other Allowance</label>
                <nz-input-number [(ngModel)]="editingMaster.otherAllowance" [nzMin]="0" [nzPrecision]="2" style="width:100%"></nz-input-number>
              </div>
              <div class="form-group">
                <label>Bonus</label>
                <nz-input-number [(ngModel)]="editingMaster.bonus" [nzMin]="0" [nzPrecision]="2" style="width:100%"></nz-input-number>
              </div>
              <div class="form-group">
                <label>Appraisal Amount</label>
                <nz-input-number [(ngModel)]="editingMaster.appraisalAmount" [nzMin]="0" [nzPrecision]="2" style="width:100%"></nz-input-number>
              </div>
              <div class="form-group">
                <label>Late Sitting Amount</label>
                <nz-input-number [(ngModel)]="editingMaster.lateSittingAmount" [nzMin]="0" [nzPrecision]="2" style="width:100%"></nz-input-number>
              </div>
              <div class="form-group">
                <label>Overtime Wages</label>
                <nz-input-number [(ngModel)]="editingMaster.overtimeWages" [nzMin]="0" [nzPrecision]="2" style="width:100%"></nz-input-number>
              </div>
            </div>

            <!-- Deductions -->
            <div class="form-section-title" style="margin-top:14px;">Statutory & Other Deductions (₹)</div>
            <div class="modal-form-grid">
              <div class="form-group">
                <label>PF Deduction</label>
                <nz-input-number [(ngModel)]="editingMaster.pfDeduction" [nzMin]="0" [nzPrecision]="2" style="width:100%"></nz-input-number>
              </div>
              <div class="form-group">
                <label>ESI Deduction</label>
                <nz-input-number [(ngModel)]="editingMaster.esiDeduction" [nzMin]="0" [nzPrecision]="2" style="width:100%"></nz-input-number>
              </div>
              <div class="form-group">
                <label>Professional Tax (PT)</label>
                <nz-input-number [(ngModel)]="editingMaster.ptDeduction" [nzMin]="0" [nzPrecision]="2" style="width:100%"></nz-input-number>
              </div>
              <div class="form-group">
                <label>Health Insurance</label>
                <nz-input-number [(ngModel)]="editingMaster.healthInsurance" [nzMin]="0" [nzPrecision]="2" style="width:100%"></nz-input-number>
              </div>
            </div>

            <!-- Work Profile -->
            <div class="form-section-title" style="margin-top:14px;">Work Profile & Schedule</div>
            <div class="modal-form-grid-3">
              <div class="form-group">
                <label>Worker Type</label>
                <nz-select [(ngModel)]="editingMaster.workerType" style="width:100%">
                  <nz-option nzValue="Permanent" nzLabel="Permanent"></nz-option>
                  <nz-option nzValue="Contract" nzLabel="Contract"></nz-option>
                  <nz-option nzValue="Casual" nzLabel="Casual"></nz-option>
                </nz-select>
              </div>
              <div class="form-group">
                <label>Working Hours / Day</label>
                <nz-input-number [(ngModel)]="editingMaster.workingHoursPerDay" [nzMin]="1" [nzMax]="24" style="width:100%"></nz-input-number>
              </div>
              <div class="form-group">
                <label>Weekly Off</label>
                <nz-select [(ngModel)]="editingMaster.weeklyOff" style="width:100%">
                  <nz-option nzValue="Allowed" nzLabel="Allowed"></nz-option>
                  <nz-option nzValue="Not Allowed" nzLabel="Not Allowed"></nz-option>
                </nz-select>
              </div>
            </div>
          </div>
        </ng-template>
        <ng-template #editModalFooter>
          <button nz-button nzType="default" (click)="isEditModalVisible = false">Cancel</button>
          <button nz-button nzType="primary" (click)="saveEditedMaster()" [nzLoading]="isSavingEdited">
            <i nz-icon nzType="save"></i> Save Salary Structure
          </button>
        </ng-template>
      </nz-modal>

      <!-- ===== APPOINTMENT LETTER PREVIEW MODAL ===== -->
      <nz-modal [(nzVisible)]="isLetterModalVisible" [nzTitle]="letterModalTitle" (nzOnCancel)="isLetterModalVisible = false" nzWidth="920px" [nzFooter]="letterModalFooter">
        <ng-template nzModalContent>
          <div *ngIf="letterLoading" style="text-align:center;padding:50px 0;">
            <nz-spin nzSimple nzTip="Generating Appointment Letter from Salary Master..."></nz-spin>
          </div>
          <div *ngIf="!letterLoading && letterPreviewHtml" style="max-height:72vh;overflow-y:auto;border:1px solid #e2e8f0;border-radius:6px;background:#fff;padding:8px;">
            <iframe [srcdoc]="letterPreviewHtml" style="width:100%;height:68vh;border:none;" sandbox="allow-same-origin allow-scripts"></iframe>
          </div>
          <div *ngIf="!letterLoading && !letterPreviewHtml" style="text-align:center;padding:40px;color:#94a3b8;">
            No preview available.
          </div>
        </ng-template>
        <ng-template #letterModalFooter>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:12px;color:#64748b;">
              Salary structure taken directly from <strong>Salary Master</strong>.
            </span>
            <div style="display:flex;gap:8px;">
              <button nz-button nzType="default" (click)="isLetterModalVisible = false">Close</button>
              <button nz-button nzType="primary" (click)="downloadAppointmentLetter()" [nzLoading]="isLetterDownloading" [disabled]="!letterPreviewHtml">
                <i nz-icon nzType="printer"></i> Print / Save PDF
              </button>
            </div>
          </div>
        </ng-template>
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
    }
    .btn-ctrl {
      height: 32px !important;
      font-size: 12px !important;
      font-weight: 500 !important;
      border-radius: 6px !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
      padding: 0 10px !important;
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
      background: linear-gradient(135deg, #1f3d6e 0%, #2563eb 100%) !important;
      border: none !important;
      color: #fff !important;
      height: 32px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      border-radius: 6px !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
      padding: 0 12px !important;
      box-shadow: 0 2px 6px rgba(37,99,235,0.25) !important;
      transition: all 0.2s ease !important;
    }
    .btn-primary-gradient:hover:not([disabled]) {
      background: linear-gradient(135deg, #173059 0%, #1d4ed8 100%) !important;
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
    .th-actions { text-align: center !important; width: 80px; }
    .td-center { text-align: center !important; }
    .td-right { text-align: right !important; white-space: nowrap; }
    .font-bold { font-weight: 700; }
    .empty-cell { text-align: center !important; padding: 28px !important; color: #9ca3af !important; font-size: 12.5px; }

    /* ── Edit Modal Styles ── */
    .edit-salary-modal-content {
      padding: 4px 0;
    }
    .edit-kpi-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }
    .kpi-box {
      border-radius: 6px;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .box-gross { background: #eff6ff; border: 1px solid #bfdbfe; }
    .box-gross .box-label { color: #1d4ed8; font-size: 10.5px; font-weight: 600; text-transform: uppercase; }
    .box-gross .box-val { color: #1e40af; font-size: 14px; font-weight: 700; }

    .box-ded { background: #fef2f2; border: 1px solid #fecaca; }
    .box-ded .box-label { color: #b91c1c; font-size: 10.5px; font-weight: 600; text-transform: uppercase; }
    .box-ded .box-val { color: #991b1b; font-size: 14px; font-weight: 700; }

    .box-net { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .box-net .box-label { color: #15803d; font-size: 10.5px; font-weight: 600; text-transform: uppercase; }
    .box-net .box-val { color: #166534; font-size: 14px; font-weight: 700; }

    .box-ctc { background: #faf5ff; border: 1px solid #e9d5ff; }
    .box-ctc .box-label { color: #7e22ce; font-size: 10.5px; font-weight: 600; text-transform: uppercase; }
    .box-ctc .box-val { color: #6b21a8; font-size: 14px; font-weight: 700; }

    .form-section-title {
      font-size: 12px;
      font-weight: 700;
      color: #1f3d6e;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 10px;
    }
    .modal-form-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px 12px;
    }
    .modal-form-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px 12px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .form-group label {
      font-size: 11px;
      font-weight: 600;
      color: #4b5563;
    }

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
  selectedStatus = 'LIVE';
  selectedWorkerType: string | null = null;

  initLoading = false;
  templateLoading = false;
  exportLoading = false;
  importLoading = false;
  sampleLoading = false;

  isEditModalVisible = false;
  editModalTitle = '';
  editingMaster: SalaryMasterDTO | null = null;
  isSavingEdited = false;

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

  isLetterModalVisible = false;
  letterLoading = false;
  isLetterDownloading = false;
  letterModalTitle = 'Appointment Letter';
  letterPreviewHtml = '';
  selectedEmployeeForLetter: SalaryMasterDTO | null = null;
  appointmentTemplateId: number | null = null;

  constructor(
    private payrollService: PayrollService,
    private employeeService: EmployeeService,
    private docTemplateService: DocumentTemplateService,
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
        this.masters = [];
        this.filteredMasters = [];
      }
    });
  }

  initForAll(): void {
    this.initLoading = true;
    this.payrollService.initAllSalaryMaster().subscribe({
      next: (res) => {
        this.initLoading = false;
        if (res.data) {
          this.masters = res.data;
          this.applyFilter();
          this.msg.success(res.message || 'Initialized salary masters for live staff');
        }
      },
      error: (err) => {
        this.initLoading = false;
        this.msg.error(err.error?.message || 'Failed to initialize salary masters');
      }
    });
  }

  applyFilter(): void {
    const q = this.searchText.trim().toLowerCase();
    this.filteredMasters = this.masters.filter(m => {
      // 1. Search Query Match
      const matchSearch = !q ||
        (m.employeeCode && m.employeeCode.toLowerCase().includes(q)) ||
        (m.employeeName && m.employeeName.toLowerCase().includes(q)) ||
        (m.designation && m.designation.toLowerCase().includes(q)) ||
        (m.department && m.department.toLowerCase().includes(q));

      // 2. Status Match (LIVE, QUIT, ALL)
      let matchStatus = true;
      const empStatus = (m.employeeStatus || 'LIVE').toUpperCase();
      if (this.selectedStatus === 'LIVE') {
        matchStatus = empStatus === 'LIVE' || empStatus === 'ACTIVE' || (!empStatus.includes('QUIT') && !empStatus.includes('RESIGN') && !empStatus.includes('TERMINAT'));
      } else if (this.selectedStatus === 'QUIT') {
        matchStatus = empStatus === 'QUIT' || empStatus === 'RESIGNED' || empStatus === 'TERMINATED' || empStatus === 'ABSCONDED';
      }

      // 3. Worker Type Match
      const matchType = !this.selectedWorkerType || m.workerType === this.selectedWorkerType;

      return matchSearch && matchStatus && matchType;
    });
  }

  openEditModal(m: SalaryMasterDTO): void {
    // Clone object for clean editing
    this.editingMaster = { ...m };
    this.editModalTitle = `Edit Salary Structure: ${m.employeeCode || ''} — ${m.employeeName || ''}`;
    this.isEditModalVisible = true;
  }

  saveEditedMaster(): void {
    if (!this.editingMaster) return;
    this.isSavingEdited = true;
    this.payrollService.saveSalaryMaster(this.editingMaster).subscribe({
      next: (res) => {
        this.isSavingEdited = false;
        this.isEditModalVisible = false;
        this.msg.success(`Salary structure for ${this.editingMaster?.employeeCode} saved successfully`);
        this.loadMasters();
      },
      error: (err) => {
        this.isSavingEdited = false;
        this.msg.error(err.error?.message || 'Failed to save salary structure');
      }
    });
  }

  saveSingle(m: SalaryMasterDTO): void {
    this.saving = true;
    this.payrollService.saveSalaryMaster(m).subscribe({
      next: () => {
        this.saving = false;
        if (m.id) this.changedIds.delete(m.id);
        this.hasChanges = this.changedIds.size > 0;
        this.msg.success(`Salary master for ${m.employeeCode} updated`);
      },
      error: (err) => {
        this.saving = false;
        this.msg.error(err.error?.message || 'Failed to save salary master');
      }
    });
  }

  deleteMaster(m: SalaryMasterDTO): void {
    this.modal.confirm({
      nzTitle: `Delete Salary Master for ${m.employeeCode}?`,
      nzContent: `Are you sure you want to delete the salary master record for <strong>${m.employeeCode} — ${m.employeeName}</strong>?<br/><br/><span style="color:#6b7280;font-size:12px;">This only deletes the baseline salary master entry. Historical processed monthly payslips remain untouched.</span>`,
      nzOkText: 'Delete Record',
      nzOkDanger: true,
      nzOnOk: () => {
        if (!m.id) return;
        this.payrollService.deleteSalaryMaster(m.id).subscribe({
          next: () => {
            this.msg.success(`Salary master for ${m.employeeCode} deleted successfully`);
            this.loadMasters();
          },
          error: (err) => {
            this.msg.error(err.error?.message || 'Failed to delete salary master');
          }
        });
      }
    });
  }

  deleteAllPrompt(): void {
    this.modal.confirm({
      nzTitle: '⚠️ Delete ALL Salary Master Records?',
      nzContent: `Are you sure you want to delete all <strong>${this.masters.length}</strong> salary master records?<br/><br/>This will clear the entire baseline salary directory so you can import fresh data from Excel or re-initialize.<br/><br/><span style="color:#6b7280;font-size:12px;">Note: Historical processed monthly payslips remain untouched.</span>`,
      nzOkText: 'Delete All Records',
      nzOkDanger: true,
      nzOnOk: () => {
        this.loading = true;
        this.payrollService.deleteAllSalaryMasters().subscribe({
          next: () => {
            this.loading = false;
            this.msg.success('All salary master records deleted successfully. Ready for fresh import!');
            this.loadMasters();
          },
          error: (err) => {
            this.loading = false;
            this.msg.error(err.error?.message || 'Failed to delete all salary master records');
          }
        });
      }
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

  openAppointmentLetter(m: SalaryMasterDTO): void {
    if (!m.employeeId) return;
    this.selectedEmployeeForLetter = m;
    this.letterModalTitle = `Appointment Letter — ${m.employeeCode || ''} (${m.employeeName || ''})`;
    this.isLetterModalVisible = true;
    this.letterLoading = true;
    this.letterPreviewHtml = '';

    if (this.appointmentTemplateId) {
      this.fetchAppointmentLetterPreview(this.appointmentTemplateId, m.employeeId);
    } else {
      this.docTemplateService.getTemplates({ templateType: 'APPOINTMENT_LETTER', active: true, size: 10 }).subscribe({
        next: (res) => {
          const list = res.data?.content || [];
          const tpl = list.length > 0 ? list[0] : null;
          if (tpl && tpl.id) {
            this.appointmentTemplateId = tpl.id;
            this.fetchAppointmentLetterPreview(tpl.id, m.employeeId!);
          } else {
            this.letterLoading = false;
            this.msg.error('Appointment Letter template not found or inactive');
          }
        },
        error: () => {
          this.letterLoading = false;
          this.msg.error('Failed to load Appointment Letter template');
        }
      });
    }
  }

  private fetchAppointmentLetterPreview(templateId: number, employeeId: number): void {
    this.docTemplateService.previewTemplate(templateId, employeeId).subscribe({
      next: (res) => {
        this.letterLoading = false;
        if (res.success && res.data) {
          this.letterPreviewHtml = res.data;
        } else {
          this.msg.error(res.message || 'Could not generate appointment letter preview');
        }
      },
      error: (err) => {
        this.letterLoading = false;
        this.msg.error(err.error?.message || 'Error generating preview');
      }
    });
  }

  downloadAppointmentLetter(): void {
    if (!this.appointmentTemplateId || !this.selectedEmployeeForLetter?.employeeId) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      try {
        printWindow.document.open();
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head><title>Generating Appointment Letter...</title></head>
          <body style="font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc;color:#334155;">
            <div style="text-align:center;">
              <div style="font-size:28px;margin-bottom:12px;">📄</div>
              <div style="font-size:16px;font-weight:600;">Preparing Appointment Letter...</div>
              <div style="font-size:13px;color:#64748b;margin-top:4px;">Print / Save as PDF will open in a moment</div>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
      } catch (e) {
        console.warn('Could not write placeholder to print window', e);
      }
    }

    this.isLetterDownloading = true;
    this.docTemplateService.generateDocument(this.appointmentTemplateId, this.selectedEmployeeForLetter.employeeId, 'pdf').subscribe({
      next: (response) => {
        this.isLetterDownloading = false;
        if (response.success && response.data?.html) {
          openDocumentPrintPreview(response.data.html, printWindow);
          this.msg.success('Appointment Letter ready for Print / Save as PDF');
        } else {
          if (printWindow) printWindow.close();
          this.msg.error(response.message || 'Failed to generate document');
        }
      },
      error: (err) => {
        this.isLetterDownloading = false;
        if (printWindow) printWindow.close();
        this.msg.error(err.error?.message || 'Failed to generate document');
      }
    });
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
