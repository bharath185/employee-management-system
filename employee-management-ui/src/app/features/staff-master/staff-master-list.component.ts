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
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { EmployeeService } from '../../core/services/employee.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { Employee } from '../../core/models/employee.model';
import { MasterDataItem } from '../../core/models/api-response.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DateFormatPipe } from '../../shared/pipes/date-format.pipe';
import { TitleCasePipe } from '../../shared/pipes/title-case.pipe';
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
    NzAvatarModule,
    NzDropDownModule,
    NzSpinModule,
    NzFormModule,
    NzCardModule,
    NzMessageModule,
    NzDividerModule,
    NzModalModule,
    NzGridModule,
    NzToolTipModule,
    LoadingSpinnerComponent,
    PageHeaderComponent,
    DateFormatPipe,
    TitleCasePipe
  ],
  template: `
    <div class="employee-list-container">
      <app-page-header icon="team" title="Staff Master" subtitle="Manage all employee records"
        [breadcrumbs]="[{label: 'Dashboard', link: '/admin/dashboard'}, {label: 'Staff Master'}]">
        <button nz-button (click)="downloadSampleExcel()" class="header-btn">
          <i nz-icon nzType="file-text"></i> Sample
        </button>
        <button nz-button (click)="exportToExcel()" class="header-btn">
          <i nz-icon nzType="download"></i> Export
        </button>
        <button nz-button (click)="triggerImport()" class="header-btn">
          <i nz-icon nzType="upload"></i> Import
        </button>
        <button nz-button nzType="primary" routerLink="/admin/employees/new" class="header-btn primary-btn">
          <i nz-icon nzType="plus"></i> Add Employee
        </button>
      </app-page-header>

      <!-- ========== HIDDEN FILE INPUT ========== -->
      <input #fileInput type="file" accept=".xlsx,.xls" style="display:none" (change)="importFromExcel($event)">

      <!-- ========== FILTERS SECTION ========== -->
      <nz-card class="filter-section" nzBorderless>
        <div nz-row nzGutter="12" nzAlign="middle">
          <div nz-col nzXs="24" nzSm="12" nzMd="7" nzLg="7" class="filter-field-wrapper">
            <nz-input-group [nzPrefix]="searchIcon" [nzSuffix]="clearIcon" class="search-input-group">
              <input nz-input [(ngModel)]="searchTerm" (input)="onSearch()" placeholder="Name, code, email, mobile...">
            </nz-input-group>
            <ng-template #searchIcon><i nz-icon nzType="search"></i></ng-template>
            <ng-template #clearIcon>
              <i nz-icon nzType="close" class="search-clear-icon" *ngIf="searchTerm" (click)="clearSearch()"></i>
            </ng-template>
          </div>
          <div nz-col nzXs="12" nzSm="6" nzMd="4" nzLg="3" class="filter-field">
            <nz-select [(ngModel)]="filterStatus" (ngModelChange)="loadEmployees()" nzPlaceHolder="Status">
              <nz-option nzValue="" nzLabel="All Statuses"></nz-option>
              <nz-option *ngFor="let opt of statusOptions" [nzValue]="opt" [nzLabel]="opt"></nz-option>
            </nz-select>
          </div>
          <div nz-col nzXs="12" nzSm="6" nzMd="4" nzLg="3" class="filter-field">
            <nz-select [(ngModel)]="filterDesignation" (ngModelChange)="loadEmployees()" nzPlaceHolder="Designation">
              <nz-option nzValue="" nzLabel="All Designations"></nz-option>
              <nz-option *ngFor="let opt of designationOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
            </nz-select>
          </div>
          <div nz-col class="filter-actions-col">
            <button nz-button (click)="clearFilters()" *ngIf="hasActiveFilters" class="clear-filter-btn">
              <i nz-icon nzType="clear"></i> Clear
            </button>
          </div>
        </div>
      </nz-card>

      <!-- ========== LOADING ========== -->
      <app-loading-spinner [loading]="isLoading" message="Loading employees..."></app-loading-spinner>

      <!-- ========== TABLE CARD ========== -->
      <div class="table-container" *ngIf="!isLoading">
        <div class="table-header">
          <div class="table-title">
            <i nz-icon nzType="audit"></i> Employee Records
            <span class="table-count">{{ totalElements }} total</span>
          </div>
          <div class="table-header-actions">
            <span class="table-info" *ngIf="totalElements > 0">
              Showing page {{ pageIndex + 1 }} of {{ getTotalPages() }}
            </span>
          </div>
        </div>

        <!-- Empty state template (shown via nzNoResult when data is empty) -->
        <ng-template #emptyTemplate>
          <div class="empty-state-content">
            <div class="empty-icon-wrapper">
              <i nz-icon nzType="team" class="empty-icon"></i>
            </div>
            <h3>No employees found</h3>
            <p *ngIf="hasActiveFilters">Try adjusting your search or filter criteria</p>
            <p *ngIf="!hasActiveFilters">Get started by adding your first employee record</p>
            <button nz-button nzType="primary" routerLink="/admin/employees/new">
              <i nz-icon nzType="plus"></i> Add Employee
            </button>
          </div>
        </ng-template>

        <!-- nz-table with server-side pagination -->
        <nz-table
          [nzData]="dataSource"
          [nzFrontPagination]="false"
          [nzPageIndex]="pageIndex + 1"
          [nzPageSize]="pageSize"
          [nzTotal]="totalElements"
          (nzPageIndexChange)="onPageIndexChange($event)"
          (nzPageSizeChange)="onPageSizeChange($event)"
          nzShowSizeChanger
          [nzPageSizeOptions]="[10, 25, 50, 100]"
          [nzScroll]="{ x: '800px' }"
          [nzNoResult]="emptyTemplate"
          class="employee-table"
          [nzLoading]="isLoading"
        >
          <thead>
            <tr>
              <th nz-th nzColumnKey="employeeCode" [nzShowSort]="true" (nzSortChange)="onSortChange('employeeCode', $any($event))">
                <div class="th-content"><i nz-icon nzType="tag"></i> Code</div>
              </th>
              <th nz-th nzColumnKey="name" [nzShowSort]="true" (nzSortChange)="onSortChange('name', $any($event))">
                <div class="th-content"><i nz-icon nzType="user"></i> Name</div>
              </th>
              <th nz-th nzColumnKey="gender">
                <div class="th-content"><i nz-icon nzType="contacts"></i> Gender</div>
              </th>
              <th nz-th nzColumnKey="designation" [nzShowSort]="true" (nzSortChange)="onSortChange('designation', $any($event))">
                <div class="th-content"><i nz-icon nzType="tool"></i> Designation</div>
              </th>
              <th nz-th nzColumnKey="employeeStatus" [nzShowSort]="true" (nzSortChange)="onSortChange('employeeStatus', $any($event))">
                <div class="th-content"><i nz-icon nzType="check-circle"></i> Status</div>
              </th>
              <th nz-th nzColumnKey="userRole">
                <div class="th-content"><i nz-icon nzType="safety"></i> Role</div>
              </th>
              <th nz-th nzColumnKey="mobile">
                <div class="th-content"><i nz-icon nzType="phone"></i> Mobile</div>
              </th>
              <th nz-th nzColumnKey="doj" [nzShowSort]="true" (nzSortChange)="onSortChange('doj', $any($event))">
                <div class="th-content"><i nz-icon nzType="calendar"></i> DOJ</div>
              </th>
              <th nz-th nzColumnKey="actions">
                <span class="th-actions-label">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let emp of dataSource"
                [routerLink]="['/admin/employees', emp.id]"
                class="employee-row"
                [class.row-live]="emp.employeeStatus === 'LIVE'"
                [class.row-inactive]="emp.employeeStatus !== 'LIVE'">

              <td nz-td>
                <span class="code-badge">{{ emp.employeeCode }}</span>
              </td>

              <td nz-td>
                <div class="employee-info-cell">
                  <div class="employee-avatar" [style.background]="getAvatarColor(emp.employeeCode)">
                    {{ (emp.firstName?.charAt(0) || '') + (emp.surname?.charAt(0) || '') }}
                  </div>
                  <div class="employee-details">
                    <span class="employee-name">
                      {{ emp.prefix ? emp.prefix + '. ' : '' }}{{ emp.firstName }} {{ emp.surname }}
                    </span>
                    <span class="employee-sub">{{ emp.designation || 'No designation' }}</span>
                  </div>
                </div>
              </td>

              <td nz-td>
                <span class="gender-tag">{{ emp.gender || '-' }}</span>
              </td>

              <td nz-td>
                <span class="designation-text">{{ emp.designation || '-' }}</span>
              </td>

              <td nz-td>
                <nz-tag [nzColor]="emp.employeeStatus === 'LIVE' ? 'success' : 'default'" class="status-tag">
                  {{ emp.employeeStatus || '-' }}
                </nz-tag>
              </td>

              <td nz-td>
                <nz-tag *ngIf="emp.userRole" [nzColor]="emp.userRole === 'ADMIN' ? 'blue' : emp.userRole === 'HR' ? 'green' : 'default'" style="font-size:11px">
                  {{ emp.userRole }}
                </nz-tag>
                <span *ngIf="!emp.userRole" style="color:#999;font-size:12px">—</span>
              </td>

              <td nz-td>
                <span class="mobile-text">{{ emp.mobile || '-' }}</span>
              </td>

              <td nz-td>
                <span class="date-text">{{ emp.doj | dateFormat }}</span>
              </td>

              <td nz-td (click)="$event.stopPropagation()">
                <div class="row-actions-cell">
                  <button nz-button nzType="text" nz-dropdown [nzDropdownMenu]="rowMenu" class="actions-btn">
                    <i nz-icon nzType="more"></i>
                  </button>
                  <nz-dropdown-menu #rowMenu="nzDropdownMenu">
                    <ul nz-menu class="row-menu">
                      <li nz-menu-item [routerLink]="['/admin/employees', emp.id]">
                        <i nz-icon nzType="eye"></i> View Details
                      </li>
                      <li nz-menu-item [routerLink]="['/admin/employees', emp.id, 'edit']">
                        <i nz-icon nzType="edit"></i> Edit Record
                      </li>
                      <li nz-menu-divider></li>
                      <li nz-menu-item (click)="deleteEmployee(emp)" class="delete-action">
                        <i nz-icon nzType="delete"></i> Delete Record
                      </li>
                    </ul>
                  </nz-dropdown-menu>
                </div>
              </td>
            </tr>
          </tbody>
        </nz-table>
      </div>
    </div>
  `,
  styles: [`
    :host{display:block}
    .employee-list-container{max-width:1400px;margin:0 auto;padding:0}

    /* ========== PAGE HEADER ========== */
    .page-header{width:100%;margin-bottom:16px}
    .header-btn{display:inline-flex;align-items:center;gap:4px;font-size:12px;padding:4px 14px;height:32px;border-radius:6px}
    .header-btn.primary-btn{padding:4px 16px}

    /* ========== FILTERS SECTION ========== */
    .filter-section { background:#fff; border-radius:10px; margin-bottom:12px; border:1px solid #e8eaed; box-shadow:0 1px 4px rgba(0,0,0,.04); }
    .filter-section .ant-card-body { padding:8px 14px; }
    .filter-field-wrapper { min-width:0; }
    .search-input-group { width:100%; display:flex; align-items:center; }
    .search-input-group.ant-input-affix-wrapper { height:32px; border-radius:6px; padding:0 8px; }
    .search-input-group .ant-input { font-size:12px; height:30px; line-height:30px; border:none!important; box-shadow:none!important; }
    .search-input-group .ant-input-prefix { margin-right:6px; }
    .search-input-group .ant-input-prefix i { font-size:14px; color:#adb5bd; }
    .search-input-group .ant-input-suffix { margin-left:4px; }
    .search-clear-icon { cursor:pointer; font-size:12px; color:#adb5bd; transition:color .15s; }
    .search-clear-icon:hover { color:#dc3545; }
    .filter-field { min-width:0; }
    .filter-field .ant-select { width:100%; }
    .filter-field .ant-select-selector { border-radius:6px!important; height:32px!important; padding:0 10px!important; }
    .filter-field .ant-select-selection-placeholder,
    .filter-field .ant-select-selection-item { font-size:12px; line-height:30px!important; }
    .filter-actions-col { display:flex; align-items:center; }
    .clear-filter-btn { font-size:12px; height:32px; padding:0 12px; border-radius:6px; }

    /* ========== TABLE CONTAINER ========== */
    .table-container { background:#fff; border-radius:10px; box-shadow:0 1px 4px rgba(0,0,0,.04); overflow:visible; border:1px solid #e8eaed; }
    .table-header { display:flex; align-items:center; justify-content:space-between; padding:6px 12px; border-bottom:1px solid #e8eaed; background:#fafbfc; gap:8px; }
    .table-title { font-size:11px; font-weight:600; color:#1a1a2e; margin:0; display:flex; align-items:center; gap:5px; }
    .table-title i { font-size:13px; color:#2563eb; }
    .table-count { font-size:10px; font-weight:500; color:#6c757d; background:#f0f2f5; padding:1px 8px; border-radius:10px; }
    .table-header-actions { display:flex; align-items:center; gap:6px; }
    .table-info { font-size:10px; color:#6c757d; }

    /* ========== NZ-TABLE ========== */
    .employee-table { width:100%; }

    /* Table header row */
    .employee-table .ant-table-thead > tr > th {
      background:#fafbfc;
      border-bottom:1px solid #e8eaed;
      font-size:10px;
      font-weight:600;
      color:#6c757d;
      padding:8px 10px;
      white-space:nowrap;
    }
    .employee-table .ant-table-thead > tr > th.ant-table-cell-fix-left,
    .employee-table .ant-table-thead > tr > th.ant-table-cell-fix-right {
      background:#fafbfc;
    }
    .th-content { display:inline-flex; align-items:center; gap:4px; }
    .th-content i { font-size:12px; color:#adb5bd; }
    .th-actions-label { font-size:10px; font-weight:600; color:#6c757d; white-space:nowrap; }

    /* Table body rows */
    .employee-table .ant-table-tbody > tr {
      cursor:pointer;
      transition:background .12s;
    }
    .employee-table .ant-table-tbody > tr:hover {
      background:#f1f5f9!important;
    }
    .employee-table .ant-table-tbody > tr.ant-table-row:hover > td {
      border-bottom-color:transparent;
    }
    .employee-table .ant-table-tbody > tr > td {
      padding:10px 10px;
      font-size:12px;
      color:#333;
      border-bottom:1px solid #f0f2f5;
      vertical-align:middle;
    }

    /* Left green dot accent for LIVE rows */
    .employee-table .ant-table-tbody > tr.row-live > td.ant-table-cell:first-child {
      position:relative;
    }
    .employee-table .ant-table-tbody > tr.row-live > td.ant-table-cell:first-child::before {
      content:'';
      position:absolute;
      left:0; top:8px; bottom:8px;
      width:3px;
      background:#10b981;
      border-radius:0 2px 2px 0;
    }

    /* Code badge */
    .code-badge { background:#f0f2f5; padding:2px 8px; border-radius:4px; font-family:'Cascadia Code','Consolas',monospace; font-size:11px; color:#2563eb; font-weight:600; letter-spacing:.3px; }

    /* Employee info cell */
    .employee-info-cell { display:flex; align-items:center; gap:8px; }
    .employee-avatar { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:#fff; flex-shrink:0; letter-spacing:.5px; }
    .employee-details { display:flex; flex-direction:column; gap:1px; min-width:0; }
    .employee-name { font-weight:600; color:#1a1a2e; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .employee-sub { font-size:10px; color:#6c757d; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

    /* Gender tag */
    .gender-tag { font-size:11px; color:#555; }

    /* Designation text */
    .designation-text { font-size:11px; color:#555; }

    /* Status tag */
    .status-tag { border-radius:10px; font-size:10px; font-weight:600; padding:0 10px; line-height:20px; }
    .ant-tag.status-tag { display:inline-flex; align-items:center; gap:4px; }

    /* Mobile text */
    .mobile-text { font-family:'Cascadia Code','Consolas',monospace; font-size:11px; color:#555; letter-spacing:.5px; }

    /* Date text */
    .date-text { font-size:11px; color:#6c757d; }

    /* Row actions */
    .row-actions-cell { display:flex; justify-content:center; align-items:center; }
    .actions-btn { min-width:30px; width:30px; height:30px; padding:0; display:flex; align-items:center; justify-content:center; border-radius:6px; background:transparent; transition:all .12s; border:none; }
    .actions-btn i { font-size:16px; color:#adb5bd; transition:color .12s; }
    .employee-table .ant-table-tbody > tr:hover .actions-btn { background:#e8eaed; }
    .employee-table .ant-table-tbody > tr:hover .actions-btn i { color:#2563eb; }
    .actions-btn:hover { background:#dce0e8!important; }
    .actions-btn:hover i { color:#1d4ed8!important; }
    .delete-action { color:#dc3545; }
    .delete-action:hover { color:#c82333!important; }

    /* Dropdown menu */
    .row-menu { border-radius:8px; padding:4px; min-width:160px; }
    .row-menu .ant-dropdown-menu-item { border-radius:6px; font-size:12px; padding:6px 10px; display:flex; align-items:center; gap:6px; }
    .row-menu .ant-dropdown-menu-item i { font-size:14px; }

    /* ========== NZ-TABLE PAGINATION ========== */
    .employee-table .ant-table-pagination {
      margin:10px 14px!important;
      display:flex;
      align-items:center;
      justify-content:flex-end;
    }
    .employee-table .ant-table-pagination .ant-pagination-item {
      border-radius:6px;
      font-size:11px;
      min-width:28px;
      height:28px;
      line-height:28px;
      border-color:#e8eaed;
    }
    .employee-table .ant-table-pagination .ant-pagination-item-active {
      border-color:#2563eb;
      background:#2563eb;
      box-shadow:0 2px 6px rgba(37,99,235,.3);
    }
    .employee-table .ant-table-pagination .ant-pagination-item-active a {
      color:#fff;
      font-weight:700;
    }
    .employee-table .ant-table-pagination .ant-pagination-item:hover {
      border-color:#2563eb;
    }
    .employee-table .ant-table-pagination .ant-pagination-prev,
    .employee-table .ant-table-pagination .ant-pagination-next {
      min-width:28px;
      height:28px;
      line-height:28px;
    }
    .employee-table .ant-table-pagination .ant-pagination-options {
      margin-left:6px;
    }
    .employee-table .ant-table-pagination .ant-select-selector {
      border-radius:6px!important;
      height:28px!important;
    }
    .employee-table .ant-table-pagination .ant-pagination-total-text {
      font-size:11px;
      color:#6c757d;
      margin-right:auto;
    }

    /* ========== EMPTY STATE ========== */
    .empty-state-content { display:flex; flex-direction:column; align-items:center; gap:10px; padding:36px 16px; text-align:center; }
    .empty-icon-wrapper { width:60px; height:60px; border-radius:50%; background:#f1f5f9; display:flex; align-items:center; justify-content:center; }
    .empty-icon-wrapper .empty-icon { font-size:28px; color:#2563eb; opacity:.4; }
    .empty-state-content h3 { font-size:15px; font-weight:600; color:#1a1a2e; margin:0; }
    .empty-state-content p { font-size:12px; color:#6c757d; margin:0; max-width:280px; }

    /* ========== NZ-TABLE LOADING OVERLAY ========== */
    .employee-table .ant-spin-text{font-size:12px;color:#2563eb}

    /* ========== RESPONSIVE ========== */
    @media(max-width:1024px){.filter-field-wrapper{min-width:180px}.filter-field{min-width:140px}}
    @media(max-width:768px){
      .page-header{flex-direction:column;align-items:flex-start}
      .header-btn{font-size:11px;padding:4px 8px}
      .filter-section .ant-card-body{padding:10px}
      .table-header{flex-direction:column;align-items:flex-start}
      .employee-table .ant-table-pagination{margin:10px!important;flex-wrap:wrap;gap:6px;justify-content:center}
    }
    @media(max-width:480px){.filter-field{min-width:100%}.filter-actions-col{width:100%;justify-content:flex-end}}
  `]
})
export class StaffMasterListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['employeeCode', 'name', 'gender', 'designation', 'employeeStatus', 'userRole', 'mobile', 'doj', 'actions'];

  dataSource: Employee[] = [];

  isLoading = false;
  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;

  searchTerm = '';
  filterStatus = '';
  filterDesignation = '';

  statusOptions: string[] = [];
  designationOptions: { value: string; label: string }[] = [];

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
    private router: Router,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  getAvatarColor(code: string): string {
    const index = (code?.length || 0) % this.avatarColors.length;
    return this.avatarColors[index];
  }

  getTotalPages(): number {
    return Math.ceil(this.totalElements / this.pageSize) || 1;
  }

  ngOnInit(): void {
    this.masterDataService.getByCategory('EMPLOYEE_STATUS').subscribe(data => {
      this.statusOptions = data.map(i => i.value);
    });
    this.masterDataService.getByCategory('DESIGNATION').subscribe(data => {
      this.designationOptions = data.map(i => ({ value: i.code, label: i.value }));
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
    return !!this.searchTerm || !!this.filterStatus || !!this.filterDesignation;
  }

  loadEmployees(): void {
    this.isLoading = true;
    const params: any = {
      page: this.pageIndex,
      size: this.pageSize,
      sort: 'createdAt,desc'
    };
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.filterStatus) params.employeeStatus = this.filterStatus;
    if (this.filterDesignation) params.designation = this.filterDesignation;

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
    this.filterDesignation = '';
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

  onSortChange(column: string, direction: string | null): void {
    // Sorting handled server-side; reserved for future implementation
  }

  deleteEmployee(emp: Employee): void {
    this.modal.confirm({
      nzTitle: 'Delete Employee',
      nzContent: `Are you sure you want to delete ${emp.firstName} ${emp.surname} (${emp.employeeCode})?`,
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
            this.message.success(
              `Import completed: ${response.data?.successful} successful, ${response.data?.failed} failed`
            );
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
}
