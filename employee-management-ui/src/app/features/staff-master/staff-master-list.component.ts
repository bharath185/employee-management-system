import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { EmployeeService } from '../../core/services/employee.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Employee } from '../../core/models/employee.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { DateFormatPipe } from '../../shared/pipes/date-format.pipe';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-staff-master-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzSelectModule,
    NzInputModule,
    NzTagModule,
    NzCardModule,
    NzSpinModule,
    NzFormModule,
    NzMessageModule,
    NzModalModule,
    NzToolTipModule,
    LoadingSpinnerComponent,
    DateFormatPipe
  ],
  template: `
    <div class="pl-container">
      <div class="pp-sub-nav">
        <div class="sub-nav-left">
          <span class="pp-nav-item active">
            <i class="bi bi-people-fill"></i><span>Staff Master</span>
          </span>
          <span class="sub-nav-count">
            <i class="bi bi-person-lines-fill"></i> {{ totalElements }} Employees
          </span>
        </div>
        <div class="sub-nav-right">
          <span class="sub-nav-tag"><i class="bi bi-building-check"></i> Live Database</span>
        </div>
      </div>

      <nz-card class="pl-controls-card">
        <div class="pl-controls">
          <div class="pl-filters">
            <div class="search-box">
              <i class="bi bi-search search-ico"></i>
              <input nz-input [(ngModel)]="searchTerm" (input)="onSearch()" placeholder="Search code, name, mobile, email..." class="search-input">
              <i class="bi bi-x-circle-fill search-clear" *ngIf="searchTerm" (click)="clearSearch()"></i>
            </div>

            <nz-select [(ngModel)]="currentSort" (ngModelChange)="onSortDropdownChange($event)" nzPlaceHolder="Sort By" class="filter-select sort-select" style="width:230px">
              <nz-option-group nzLabel="Status & Code (Default)">
                <nz-option nzValue="employeeStatus,asc;employeeCode,asc" nzLabel="🟢 Live First (Code: 0 → 9) [Default]"></nz-option>
                <nz-option nzValue="employeeStatus,asc;employeeCode,desc" nzLabel="🟢 Live First (Code: 9 → 0)"></nz-option>
                <nz-option nzValue="employeeStatus,desc;employeeCode,asc" nzLabel="🔴 Quit/Left First (Code: 0 → 9)"></nz-option>
              </nz-option-group>
              <nz-option-group nzLabel="Employee Code Only">
                <nz-option nzValue="employeeCode,asc" nzLabel="🔢 Code: Ascending (0 → 9)"></nz-option>
                <nz-option nzValue="employeeCode,desc" nzLabel="🔢 Code: Descending (9 → 0)"></nz-option>
              </nz-option-group>
              <nz-option-group nzLabel="Employee Name">
                <nz-option nzValue="employeeStatus,asc;surname,asc;firstName,asc" nzLabel="👤 Live First (Name: A → Z)"></nz-option>
                <nz-option nzValue="surname,asc;firstName,asc" nzLabel="👤 Name: A → Z (Surname)"></nz-option>
                <nz-option nzValue="surname,desc;firstName,desc" nzLabel="👤 Name: Z → A (Surname)"></nz-option>
              </nz-option-group>
              <nz-option-group nzLabel="Date of Joining">
                <nz-option nzValue="employeeStatus,asc;doj,desc" nzLabel="📅 Live First (DOJ: Newest First)"></nz-option>
                <nz-option nzValue="doj,desc" nzLabel="📅 DOJ: Newest First"></nz-option>
                <nz-option nzValue="doj,asc" nzLabel="📅 DOJ: Oldest First"></nz-option>
              </nz-option-group>
            </nz-select>

            <nz-select [(ngModel)]="filterStatus" (ngModelChange)="loadEmployees()" nzPlaceHolder="Status" class="filter-select" style="width:130px">
              <nz-option nzValue="" nzLabel="All Statuses"></nz-option>
              <nz-option *ngFor="let opt of statusOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
            </nz-select>

            <nz-select [(ngModel)]="filterGender" (ngModelChange)="loadEmployees()" nzPlaceHolder="Gender" class="filter-select" style="width:120px">
              <nz-option nzValue="" nzLabel="All Genders"></nz-option>
              <nz-option *ngFor="let opt of genderOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
            </nz-select>

            <nz-select [(ngModel)]="filterDesignation" (ngModelChange)="loadEmployees()" nzPlaceHolder="Designation" class="filter-select" style="width:160px" nzShowSearch nzAllowClear>
              <nz-option nzValue="" nzLabel="All Designations"></nz-option>
              <nz-option *ngFor="let opt of designationOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
            </nz-select>

            <nz-select [(ngModel)]="filterProcess" (ngModelChange)="loadEmployees()" nzPlaceHolder="Process" class="filter-select" style="width:150px" nzShowSearch nzAllowClear>
              <nz-option nzValue="" nzLabel="All Processes"></nz-option>
              <nz-option *ngFor="let p of processOptions" [nzValue]="p" [nzLabel]="p"></nz-option>
            </nz-select>

            <button nz-button class="clear-btn" *ngIf="hasActiveFilters" (click)="clearFilters()" nz-tooltip="Reset search, filters and sort order">
              <i class="bi bi-arrow-counterclockwise"></i> Reset
            </button>
          </div>

          <div class="pp-actions">
            <ng-container *ngIf="canImportExport">
              <button nz-button nzType="default" (click)="downloadSampleExcel()" nz-tooltip="Download Sample Import Template" class="btn-tool">
                <i class="bi bi-file-earmark-spreadsheet-fill" style="color: #2563eb;"></i> Sample
              </button>
              <button nz-button nzType="default" (click)="exportToExcel()" nz-tooltip="Download Complete Excel Report" class="btn-tool">
                <i class="bi bi-file-earmark-excel-fill" style="color: #10b981;"></i> Export
              </button>
              <button nz-button nzType="default" (click)="triggerImport()" nz-tooltip="Bulk Import from Excel" class="btn-tool">
                <i class="bi bi-cloud-arrow-up-fill" style="color: #8b5cf6;"></i> Import
              </button>
            </ng-container>
            <button nz-button class="btn-primary-gradient" routerLink="/admin/employees/new" *ngIf="canAddEmployee">
              <i class="bi bi-person-plus-fill"></i> Add Employee
            </button>
          </div>
        </div>
      </nz-card>

      <input #fileInput type="file" accept=".xlsx,.xls" style="display:none" (change)="importFromExcel($event)">

      <nz-card class="pl-table-card">
        <nz-table
          #staffTable
          [nzData]="dataSource"
          [nzFrontPagination]="false"
          [nzPageIndex]="pageIndex + 1"
          [nzPageSize]="pageSize"
          [nzTotal]="totalElements"
          (nzPageIndexChange)="onPageIndexChange($event)"
          (nzPageSizeChange)="onPageSizeChange($event)"
          nzShowSizeChanger
          [nzPageSizeOptions]="[10, 20, 50, 100]"
          [nzNoResult]="emptyTemplate"
          class="theme-table"
          [nzLoading]="isLoading"
          nzTableLayout="fixed"
          nzSize="middle"
          [nzScroll]="{ x: '1205px', y: 'calc(100vh - 235px)' }"
        >
          <thead>
            <tr>
              <th class="th-sno" nzWidth="50px">#</th>
              <th class="th-code" nzWidth="110px" [nzShowSort]="true" [nzSortOrder]="getSortOrder('employeeCode')" (nzSortOrderChange)="onTableSort('employeeCode', $event)">
                <i class="bi bi-qr-code th-icon"></i> Code
              </th>
              <th class="th-name" nzWidth="260px" [nzShowSort]="true" [nzSortOrder]="getSortOrder('surname')" (nzSortOrderChange)="onTableSort('surname', $event)">
                <i class="bi bi-person-circle th-icon"></i> Employee Name
              </th>
              <th class="th-gen" nzWidth="95px" [nzShowSort]="true" [nzSortOrder]="getSortOrder('gender')" (nzSortOrderChange)="onTableSort('gender', $event)">
                <i class="bi bi-gender-ambiguous th-icon"></i> Gender
              </th>
              <th class="th-desig" nzWidth="180px" [nzShowSort]="true" [nzSortOrder]="getSortOrder('designation')" (nzSortOrderChange)="onTableSort('designation', $event)">
                <i class="bi bi-briefcase-fill th-icon"></i> Designation
              </th>
              <th class="th-status" nzWidth="115px" [nzShowSort]="true" [nzSortOrder]="getSortOrder('employeeStatus')" (nzSortOrderChange)="onTableSort('employeeStatus', $event)">
                <i class="bi bi-activity th-icon"></i> Status
              </th>
              <th class="th-role" nzWidth="120px">
                <i class="bi bi-shield-check th-icon"></i> Role
              </th>
              <th class="th-mob" nzWidth="135px">
                <i class="bi bi-telephone-fill th-icon"></i> Mobile
              </th>
              <th class="th-doj" nzWidth="125px" [nzShowSort]="true" [nzSortOrder]="getSortOrder('doj')" (nzSortOrderChange)="onTableSort('doj', $event)">
                <i class="bi bi-calendar-check-fill th-icon"></i> DOJ
              </th>
              <th class="th-actions" nzWidth="115px">
                <i class="bi bi-gear-fill th-icon"></i> Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let emp of staffTable.data; let i = index" class="emp-row"
                [routerLink]="['/admin/employees', emp.id]"
                [class.row-live]="emp.employeeStatus === 'LIVE'">
              <td class="td-center"><span class="row-num">{{ (pageIndex * pageSize) + i + 1 }}</span></td>
              <td class="td-center">
                <span class="emp-code-badge">
                  <i class="bi bi-hash"></i>{{ emp.employeeCode }}
                </span>
              </td>
              <td class="td-name">
                <div class="emp-info-cell">
                  <img *ngIf="emp.photoPath" [src]="getPhotoUrl(emp.photoPath)" alt="" class="emp-avatar emp-avatar-img" (error)="onAvatarError($event)" />
                  <div class="emp-avatar" [style.background]="getAvatarColor(emp.employeeCode)" *ngIf="!emp.photoPath">
                    {{ (emp.firstName?.charAt(0) || '') + (emp.surname?.charAt(0) || '') }}
                  </div>
                  <div class="emp-name-block">
                    <span class="emp-name">{{ emp.prefix ? emp.prefix + '. ' : '' }}{{ emp.firstName || '' }}{{ emp.middleName ? ' ' + emp.middleName : '' }}{{ emp.surname ? ' ' + emp.surname : '' }}</span>
                    <span class="emp-process" *ngIf="emp.processAssigned"><i class="bi bi-building"></i> {{ emp.processAssigned }}</span>
                  </div>
                </div>
              </td>
              <td class="td-center"><span class="emp-gender">{{ emp.gender || '-' }}</span></td>
              <td class="td-name"><span class="emp-desig">{{ emp.designation || '-' }}</span></td>
              <td class="td-center">
                <span class="status-badge" [class.status-live]="emp.employeeStatus === 'LIVE'" [class.status-quit]="emp.employeeStatus !== 'LIVE'">
                  <span class="status-dot"></span> {{ emp.employeeStatus || '-' }}
                </span>
              </td>
              <td class="td-center">
                <span *ngIf="emp.userRole" class="role-tag" [class.role-admin]="emp.userRole === 'ADMIN'" [class.role-hr]="emp.userRole === 'HR'" [class.role-emp]="emp.userRole === 'EMPLOYEE'">
                  <i class="bi" [class.bi-shield-lock-fill]="emp.userRole === 'ADMIN'" [class.bi-person-badge-fill]="emp.userRole === 'HR'" [class.bi-person-fill]="emp.userRole === 'EMPLOYEE'"></i>
                  {{ emp.userRole }}
                </span>
                <span *ngIf="!emp.userRole" class="na-txt">-</span>
              </td>
              <td class="td-center"><span class="mono-txt">{{ emp.mobile || '-' }}</span></td>
              <td class="td-center"><span class="doj-text">{{ emp.doj | dateFormat }}</span></td>
              <td class="td-actions" (click)="$event.stopPropagation()">
                <div class="actions-wrapper">
                  <button nz-button nzType="text" class="action-btn action-view"
                    [routerLink]="['/admin/employees', emp.id]" nz-tooltip="View Full Profile">
                    <i class="bi bi-eye-fill"></i>
                  </button>
                  <button nz-button nzType="text" class="action-btn action-edit"
                    [routerLink]="['/admin/employees', emp.id, 'edit']" nz-tooltip="Edit Employee">
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button nz-button nzType="text" class="action-btn action-delete"
                    (click)="deleteEmployee(emp)" nz-tooltip="Delete Employee" *ngIf="isAdmin">
                    <i class="bi bi-trash3-fill"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </nz-table>
        <div class="pl-footer" *ngIf="totalElements > 0">
          <span class="pl-total"><i class="bi bi-info-circle"></i> Showing {{ (pageIndex * pageSize) + 1 }}-{{ Math.min((pageIndex + 1) * pageSize, totalElements) }} of <strong>{{ totalElements }}</strong> employees</span>
        </div>
      </nz-card>

      <ng-template #emptyTemplate>
        <div class="empty-state-content">
          <div class="empty-icon-wrapper">
            <i class="bi bi-people empty-icon"></i>
          </div>
          <h3>No employees found</h3>
          <p *ngIf="hasActiveFilters">Try adjusting your search or filter criteria</p>
          <p *ngIf="!hasActiveFilters">Get started by adding your first employee</p>
          <button nz-button class="btn-primary-gradient" routerLink="/admin/employees/new">
            <i class="bi bi-person-plus-fill"></i> Add Employee
          </button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .pl-container {
      padding: 8px 14px 10px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }

    .pp-sub-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      background: #ffffff;
      border-radius: 6px;
      padding: 4px 10px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }
    .sub-nav-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pp-nav-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 5px;
      font-size: 12.5px;
      font-weight: 600;
      color: #fff;
      background: linear-gradient(135deg, #4361ee, #3a0ca3);
      box-shadow: 0 1px 4px rgba(67, 97, 238, 0.2);
      text-decoration: none;
      white-space: nowrap;
    }
    .pp-nav-item i { font-size: 14px; }
    .sub-nav-count {
      font-size: 11.5px;
      font-weight: 600;
      color: #2563eb;
      background: #eff6ff;
      padding: 2px 10px;
      border-radius: 10px;
      border: 1px solid #dbeafe;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .sub-nav-tag {
      font-size: 11.5px;
      font-weight: 500;
      color: #64748b;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .pl-controls-card, .pl-table-card {
      border-radius: 6px !important;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03) !important;
      margin-bottom: 8px;
      width: 100% !important;
      background: #ffffff;
    }
    :host ::ng-deep .pl-controls-card .ant-card-body { padding: 6px 10px !important; }
    :host ::ng-deep .pl-table-card .ant-card-body { padding: 0 !important; }

    .pl-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 6px;
    }
    .pl-filters {
      display: flex;
      gap: 6px;
      align-items: center;
      flex-wrap: wrap;
      flex: 1;
    }
    .pp-actions {
      display: flex;
      gap: 6px;
      align-items: center;
      flex-wrap: wrap;
      margin-left: auto;
    }

    .search-box {
      display: flex;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 5px;
      padding: 0 8px;
      height: 30px;
      min-width: 220px;
      transition: all 0.2s ease;
    }
    .search-box:focus-within {
      border-color: #4361ee;
      background: #ffffff;
      box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.12);
    }
    .search-ico { font-size: 13px; color: #94a3b8; margin-right: 5px; }
    .search-input {
      flex: 1;
      border: none !important;
      background: transparent !important;
      height: 28px;
      font-size: 12px;
      padding: 0;
      outline: none;
      box-shadow: none !important;
    }
    .search-clear { cursor: pointer; font-size: 12px; color: #94a3b8; transition: color 0.15s; margin-left: 5px; }
    .search-clear:hover { color: #ef4444; }

    .filter-select { width: 130px; }
    :host ::ng-deep .filter-select .ant-select-selector {
      border-radius: 5px !important;
      border: 1px solid #e2e8f0 !important;
      height: 30px !important;
      padding: 0 8px !important;
      background: #f8fafc !important;
    }
    :host ::ng-deep .filter-select .ant-select-selector:hover,
    :host ::ng-deep .filter-select.ant-select-focused .ant-select-selector {
      border-color: #4361ee !important;
      background: #ffffff !important;
    }
    :host ::ng-deep .filter-select .ant-select-selection-item {
      font-size: 12px !important;
      line-height: 28px !important;
      color: #334155;
    }
    :host ::ng-deep .sort-select .ant-select-selection-item {
      font-weight: 600 !important;
      color: #1e293b !important;
    }

    .clear-btn {
      height: 30px !important;
      padding: 0 10px !important;
      font-size: 12px !important;
      border-radius: 5px !important;
      border: 1px solid #e2e8f0 !important;
      color: #64748b !important;
      background: #f8fafc !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
    }
    .clear-btn:hover {
      background: #f1f5f9 !important;
      color: #ef4444 !important;
      border-color: #fca5a5 !important;
    }

    .btn-primary-gradient {
      height: 30px !important;
      padding: 0 12px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      border: none !important;
      border-radius: 5px !important;
      background: linear-gradient(135deg, #4361ee, #3a0ca3) !important;
      color: #fff !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 5px !important;
      box-shadow: 0 1px 4px rgba(67, 97, 238, 0.25) !important;
      transition: all 0.2s ease !important;
    }
    .btn-primary-gradient:hover {
      transform: translateY(-1px) !important;
      box-shadow: 0 3px 8px rgba(67, 97, 238, 0.35) !important;
    }

    .btn-tool {
      height: 30px !important;
      padding: 0 10px !important;
      font-size: 12px !important;
      border-radius: 5px !important;
      border: 1px solid #e2e8f0 !important;
      color: #334155 !important;
      background: #ffffff !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 5px !important;
      transition: all 0.15s ease !important;
    }
    .btn-tool:hover {
      border-color: #cbd5e1 !important;
      background: #f8fafc !important;
    }

    /* ── Table Styling ── */
    :host ::ng-deep .theme-table { width: 100% !important; }
    :host ::ng-deep .theme-table .ant-table { font-size: 13px; border-radius: 8px 8px 0 0 !important; }

    :host ::ng-deep .theme-table .ant-table-body,
    :host ::ng-deep .theme-table .ant-table-content {
      overflow-x: auto !important;
      overflow-y: auto !important;
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 #f1f5f9;

      &::-webkit-scrollbar {
        height: 8px;
        width: 8px;
      }
      &::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 4px;
      }
      &::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
        &:hover {
          background: #94a3b8;
        }
      }
    }

    :host ::ng-deep .theme-table .ant-table-thead > tr > th {
      background: #f8fafc !important;
      color: #1e293b !important;
      font-size: 12.5px !important;
      font-weight: 600 !important;
      padding: 11px 12px !important;
      border-bottom: 1px solid #e2e8f0 !important;
      white-space: nowrap;
    }
    .th-icon {
      font-size: 13px;
      color: #64748b;
      margin-right: 4px;
    }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th.ant-table-column-has-sorters:hover {
      background: #f1f5f9 !important;
    }
    :host ::ng-deep .theme-table .ant-table-column-sorters {
      display: inline-flex;
      align-items: center;
      width: 100%;
    }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th.th-sno,
    :host ::ng-deep .theme-table .ant-table-thead > tr > th.th-code,
    :host ::ng-deep .theme-table .ant-table-thead > tr > th.th-gen,
    :host ::ng-deep .theme-table .ant-table-thead > tr > th.th-status,
    :host ::ng-deep .theme-table .ant-table-thead > tr > th.th-role,
    :host ::ng-deep .theme-table .ant-table-thead > tr > th.th-mob,
    :host ::ng-deep .theme-table .ant-table-thead > tr > th.th-doj,
    :host ::ng-deep .theme-table .ant-table-thead > tr > th.th-actions {
      text-align: center !important;
    }

    :host ::ng-deep .theme-table .ant-table-thead > tr > th.th-code .ant-table-column-sorters,
    :host ::ng-deep .theme-table .ant-table-thead > tr > th.th-gen .ant-table-column-sorters,
    :host ::ng-deep .theme-table .ant-table-thead > tr > th.th-status .ant-table-column-sorters,
    :host ::ng-deep .theme-table .ant-table-thead > tr > th.th-doj .ant-table-column-sorters {
      justify-content: center !important;
      gap: 4px;
    }

    :host ::ng-deep .theme-table .ant-table-thead > tr > th.th-name .ant-table-column-sorters,
    :host ::ng-deep .theme-table .ant-table-thead > tr > th.th-desig .ant-table-column-sorters {
      justify-content: flex-start !important;
      gap: 6px;
    }

    :host ::ng-deep .theme-table .ant-table-thead > tr > th:last-child,
    :host ::ng-deep .theme-table .ant-table-tbody > tr > td:last-child {
      padding-right: 16px !important;
    }

    :host ::ng-deep .theme-table .ant-table-tbody > tr > td {
      padding: 10px 12px !important;
      border-bottom: 1px solid #f1f5f9 !important;
      font-size: 13px;
      color: #334155;
      vertical-align: middle;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr:hover > td {
      background: rgba(67, 97, 238, 0.03) !important;
    }

    .emp-row { cursor: pointer; transition: background 0.15s; }
    .emp-row td.ant-table-cell:first-child { position: relative; }
    .emp-row.row-live td.ant-table-cell:first-child::before {
      content: '';
      position: absolute;
      left: 0;
      top: 6px;
      bottom: 6px;
      width: 3px;
      background: #10b981;
      border-radius: 0 2px 2px 0;
    }

    .th-sno { width: 50px !important; text-align: center !important; }
    .th-code { width: 110px !important; text-align: center !important; }
    .th-name { width: 260px !important; text-align: left !important; }
    .th-gen { width: 95px !important; text-align: center !important; }
    .th-desig { width: 180px !important; text-align: left !important; }
    .th-status { width: 115px !important; text-align: center !important; }
    .th-role { width: 120px !important; text-align: center !important; }
    .th-mob { width: 135px !important; text-align: center !important; }
    .th-doj { width: 125px !important; text-align: center !important; }
    .th-actions { width: 115px !important; text-align: center !important; }

    .td-center { text-align: center !important; }
    .td-actions { text-align: center !important; }
    .td-name { font-weight: 500; }

    .row-num { font-size: 12px; font-weight: 600; color: #94a3b8; }
    .emp-code-badge {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 600;
      color: #2563eb;
      font-size: 12px;
      background: #eff6ff;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #dbeafe;
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }

    .emp-info-cell {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .emp-avatar {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11.5px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    }
    .emp-avatar-img {
      object-fit: cover;
      border: 1px solid #e2e8f0;
    }
    .emp-name-block {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      line-height: 1.25;
    }
    .emp-name {
      font-size: 13.5px;
      font-weight: 600;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .emp-process {
      font-size: 11.5px;
      color: #64748b;
      margin-top: 2px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .emp-gender { font-size: 12.5px; color: #475569; }
    .emp-desig { font-size: 13px; font-weight: 500; color: #334155; }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11.5px;
      font-weight: 600;
      line-height: 1.3;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .status-live {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      .status-dot { background: #10b981; box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2); }
    }
    .status-quit {
      background: #fff1f2;
      color: #e11d48;
      border: 1px solid #fecdd3;
      .status-dot { background: #f43f5e; }
    }

    .role-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 600;
    }
    .role-admin { background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; }
    .role-hr { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
    .role-emp { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .na-txt { color: #94a3b8; font-size: 12px; }
    .mono-txt {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      color: #475569;
      font-weight: 500;
    }
    .doj-text { font-size: 12.5px; color: #64748b; }

    .actions-wrapper {
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }
    .action-btn {
      width: 28px !important;
      height: 28px !important;
      padding: 0 !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 6px !important;
      font-size: 13px !important;
      transition: all 0.15s ease !important;
      color: #64748b !important;
    }
    .action-btn:hover { background: #f1f5f9 !important; }
    .action-view:hover { color: #2563eb !important; background: #eff6ff !important; }
    .action-edit:hover { color: #4f46e5 !important; background: #eef2ff !important; }
    .action-delete:hover { color: #ef4444 !important; background: #fef2f2 !important; }

    .pl-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      border-top: 1px solid #f1f5f9;
      background: #ffffff;
    }
    .pl-total {
      font-size: 12.5px;
      font-weight: 500;
      color: #64748b;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    :host ::ng-deep .theme-table .ant-table-pagination {
      margin: 10px 16px !important;
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
    :host ::ng-deep .theme-table .ant-table-pagination .ant-pagination-item {
      border-radius: 6px;
      font-size: 12.5px;
      min-width: 32px;
      height: 32px;
      line-height: 30px;
      border-color: #e2e8f0;
    }
    :host ::ng-deep .theme-table .ant-table-pagination .ant-pagination-item-active {
      border-color: #4361ee;
      background: #4361ee;
    }
    :host ::ng-deep .theme-table .ant-table-pagination .ant-pagination-item-active a {
      color: #fff;
      font-weight: 700;
    }

    .empty-state-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 48px 16px;
      text-align: center;
    }
    .empty-icon-wrapper {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #eff6ff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .empty-icon-wrapper .empty-icon { font-size: 28px; color: #2563eb; }
    .empty-state-content h3 { font-size: 16px; font-weight: 600; color: #1e293b; margin: 0; }
    @media (max-width: 768px) {
      .pl-controls { flex-direction: column; align-items: stretch; }
      .pl-filters { flex-wrap: wrap; }
      .pp-actions { justify-content: flex-start; margin-left: 0; }
      .pl-container { padding: 8px; }
    }
  `]
})
export class StaffMasterListComponent implements OnInit, OnDestroy {
  Math = Math;
  displayedColumns: string[] = ['employeeCode', 'name', 'gender', 'designation', 'employeeStatus', 'userRole', 'mobile', 'doj', 'actions'];

  dataSource: Employee[] = [];

  isLoading = false;
  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;

  searchTerm = '';
  filterStatus = '';
  filterGender = '';
  filterDesignation = '';
  filterProcess = '';

  defaultSort = 'employeeStatus,asc;employeeCode,asc';
  currentSort = 'employeeStatus,asc;employeeCode,asc';

  statusOptions: { value: string; label: string }[] = [];
  genderOptions: { value: string; label: string }[] = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' }
  ];
  designationOptions: { value: string; label: string }[] = [];
  processOptions: string[] = [];

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  private avatarColors: string[] = [
    'linear-gradient(135deg, #1f3d6e, #2a5298)',
    'linear-gradient(135deg, #2e7d32, #43a047)',
    'linear-gradient(135deg, #c62828, #e53935)',
    'linear-gradient(135deg, #e65100, #ff6d00)',
    'linear-gradient(135deg, #4a148c, #7b1fa2)',
    'linear-gradient(135deg, #004d40, #00897b)',
    'linear-gradient(135deg, #0d47a1, #1976d2)',
    'linear-gradient(135deg, #880e4f, #c2185b)',
    'linear-gradient(135deg, #3e2723, #5d4037)',
    'linear-gradient(135deg, #37474f, #607d8b)'
  ];

  constructor(
    private employeeService: EmployeeService,
    private masterDataService: MasterDataService,
    private authService: AuthService,
    private router: Router,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get canAddEmployee(): boolean {
    const role = this.authService.getUserRole();
    return role === 'ADMIN' || role === 'HR';
  }

  get canImportExport(): boolean {
    const role = this.authService.getUserRole();
    return role === 'ADMIN' || role === 'HR';
  }

  getAvatarColor(code: string): string {
    const index = (code?.length || 0) % this.avatarColors.length;
    return this.avatarColors[index];
  }

  getTotalPages(): number {
    return Math.ceil(this.totalElements / this.pageSize) || 1;
  }

  ngOnInit(): void {
    this.masterDataService.getByCategory('EMPLOYEE_STATUS').subscribe(data => {
      this.statusOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('GENDER').subscribe(data => {
      if (data && data.length > 0) {
        this.genderOptions = data.map(i => ({ value: i.code, label: i.value }));
      }
    });
    this.masterDataService.getByCategory('DESIGNATION').subscribe(data => {
      this.designationOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.employeeService.getProcessOptions().subscribe(data => {
      this.processOptions = data.data || [];
    });
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.loadEmployees();
    });
    this.loadEmployees();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm ||
      !!this.filterStatus ||
      !!this.filterGender ||
      !!this.filterDesignation ||
      !!this.filterProcess ||
      this.currentSort !== this.defaultSort;
  }

  loadEmployees(): void {
    this.isLoading = true;
    const params: any = {
      page: this.pageIndex,
      size: this.pageSize,
      sort: this.currentSort || this.defaultSort
    };
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.filterStatus) params.employeeStatus = this.filterStatus;
    if (this.filterGender) params.gender = this.filterGender;
    if (this.filterDesignation) params.designation = this.filterDesignation;
    if (this.filterProcess) params.processAssigned = this.filterProcess;

    this.employeeService.getEmployees(params).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.dataSource = response.data.content;
          this.totalElements = response.data.totalElements;
        }
      },
      error: () => {
        this.isLoading = false;
        this.message.error('Error loading employees');
      }
    });
  }

  onSearch(): void {
    this.pageIndex = 0;
    this.searchSubject.next(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearch();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterStatus = '';
    this.filterGender = '';
    this.filterDesignation = '';
    this.filterProcess = '';
    this.currentSort = this.defaultSort;
    this.pageIndex = 0;
    this.loadEmployees();
  }

  onPageIndexChange(index: number): void {
    this.pageIndex = index - 1;
    this.loadEmployees();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 0;
    this.loadEmployees();
  }

  getSortOrder(column: string): 'ascend' | 'descend' | null {
    if (column === 'employeeStatus') {
      if (this.currentSort.startsWith('employeeStatus,asc') || this.currentSort.startsWith('statusPriority,asc')) return 'ascend';
      if (this.currentSort.startsWith('employeeStatus,desc') || this.currentSort.startsWith('statusPriority,desc')) return 'descend';
      return null;
    }
    if (column === 'employeeCode') {
      if (this.currentSort === 'employeeCode,asc' || this.currentSort === 'employeeStatus,asc;employeeCode,asc') return 'ascend';
      if (this.currentSort === 'employeeCode,desc' || this.currentSort === 'employeeStatus,asc;employeeCode,desc') return 'descend';
      return null;
    }
    if (column === 'surname') {
      if (this.currentSort.includes('surname,asc')) return 'ascend';
      if (this.currentSort.includes('surname,desc')) return 'descend';
      return null;
    }
    if (this.currentSort.includes(column + ',asc')) return 'ascend';
    if (this.currentSort.includes(column + ',desc')) return 'descend';
    return null;
  }

  onTableSort(column: string, direction: string | null): void {
    if (!direction) {
      this.currentSort = this.defaultSort;
    } else {
      const dir = direction === 'ascend' ? 'asc' : 'desc';
      if (column === 'employeeStatus') {
        this.currentSort = `employeeStatus,${dir};employeeCode,asc`;
      } else if (column === 'employeeCode') {
        this.currentSort = `employeeStatus,asc;employeeCode,${dir}`;
      } else if (column === 'surname') {
        this.currentSort = `employeeStatus,asc;surname,${dir};firstName,${dir}`;
      } else if (column === 'doj') {
        this.currentSort = `employeeStatus,asc;doj,${dir}`;
      } else {
        this.currentSort = `employeeStatus,asc;${column},${dir}`;
      }
    }
    this.pageIndex = 0;
    this.loadEmployees();
  }

  onSortDropdownChange(sortVal: string): void {
    this.currentSort = sortVal;
    this.pageIndex = 0;
    this.loadEmployees();
  }

  deleteEmployee(emp: Employee): void {
    this.modal.confirm({
      nzTitle: 'Delete Employee',
      nzContent: `Are you sure you want to delete ${(emp.prefix ? emp.prefix + '. ' : '') + (emp.firstName || '') + (emp.middleName ? ' ' + emp.middleName : '') + (emp.surname ? ' ' + emp.surname : '')} (${emp.employeeCode})?`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        if (emp.id) {
          this.employeeService.deleteEmployee(emp.id).subscribe({
            next: (response) => {
              this.message.success(response.message || 'Employee deleted successfully');
              this.loadEmployees();
            },
            error: (err) => {
              this.message.error(err.message || 'Error deleting employee');
            }
          });
        }
      }
    });
  }

  downloadSampleExcel(): void {
    this.employeeService.downloadSampleExcel().subscribe({
      next: (blob) => {
        saveAs(blob, 'employee_sample.xlsx');
        this.message.success('Sample Excel downloaded');
      },
      error: () => {
        this.message.error('Error downloading sample');
      }
    });
  }

  exportToExcel(): void {
    this.employeeService.exportToExcel({
      employeeStatus: this.filterStatus || undefined,
      designation: this.filterDesignation || undefined
    }).subscribe({
      next: (blob) => {
        saveAs(blob, `employees_export_${new Date().toISOString().split('T')[0]}.xlsx`);
        this.message.success('Export completed successfully');
      },
      error: () => {
        this.message.error('Error exporting data');
      }
    });
  }

  triggerImport(): void {
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    fileInput?.click();
  }

  importFromExcel(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.isLoading = true;
      this.employeeService.importFromExcel(file).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            const data = response.data;
            if (data && data.failed > 0) {
              this.showImportResultModal(data);
            } else {
              this.message.success(`Import completed: ${data?.successful} rows imported successfully`);
            }
            this.loadEmployees();
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.message.error(err.message || 'Error importing data');
        }
      });
    }
    input.value = '';
  }

  private showImportResultModal(data: any): void {
    const errors = data.errors || [];
    const errorListHtml = errors.length > 0
      ? `<ul style="max-height:300px;overflow-y:auto;padding-left:16px;margin:0">
          ${errors.map((e: any) => `<li><strong>Row ${e.row}:</strong> ${e.message}</li>`).join('')}
         </ul>`
      : '<p>No detailed errors available.</p>';

    this.modal.info({
      nzTitle: 'Import Results',
      nzWidth: '600px',
      nzContent: `
        <div style="margin-bottom:16px">
          <p><strong>Total rows:</strong> ${data.totalRows}</p>
          <p><strong>Successful:</strong> <span style="color:#52c41a">${data.successful}</span></p>
          <p><strong>Failed:</strong> <span style="color:#ff4d4f">${data.failed}</span></p>
        </div>
        <div *ngIf="${errors.length > 0}">
          <p><strong>Errors:</strong></p>
          ${errorListHtml}
        </div>
      `,
      nzOkText: 'Close'
    });
  }

  getPhotoUrl(photoPath?: string): string {
    if (!photoPath) return '';
    const raw = photoPath.trim();
    if (raw.startsWith('data:image/') || raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }
    const clean = raw.replace(/\\/g, '/');
    return clean.startsWith('/') ? clean : '/' + clean;
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}
