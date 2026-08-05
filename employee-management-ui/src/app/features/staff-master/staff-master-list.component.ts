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
        <span class="pp-nav-item active">
          <i class="bi bi-people-fill"></i><span>Staff Master</span>
        </span>
      </div>

      <nz-card class="pl-controls-card" nzSize="small">
        <div class="pl-controls">
          <div class="pl-filters">
            <div class="search-box">
              <i class="bi bi-search search-ico"></i>
              <input nz-input [(ngModel)]="searchTerm" (input)="onSearch()" placeholder="Name, code, email, mobile..." class="search-input">
              <i class="bi bi-x-lg search-clear" *ngIf="searchTerm" (click)="clearSearch()"></i>
            </div>
            <nz-select [(ngModel)]="filterStatus" (ngModelChange)="loadEmployees()" nzPlaceHolder="Status" class="filter-select">
              <nz-option nzValue="" nzLabel="All Statuses"></nz-option>
              <nz-option *ngFor="let opt of statusOptions" [nzValue]="opt" [nzLabel]="opt"></nz-option>
            </nz-select>
             <nz-select [(ngModel)]="filterDesignation" (ngModelChange)="loadEmployees()" nzPlaceHolder="Designation" class="filter-select" style="width:150px">
              <nz-option nzValue="" nzLabel="All Designations"></nz-option>
              <nz-option *ngFor="let opt of designationOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
            </nz-select>
            <nz-select [(ngModel)]="filterProcess" (ngModelChange)="loadEmployees()" nzPlaceHolder="Process" class="filter-select" style="width:150px">
              <nz-option nzValue="" nzLabel="All Processes"></nz-option>
              <nz-option *ngFor="let p of processOptions" [nzValue]="p" [nzLabel]="p"></nz-option>
            </nz-select>
            <button nz-button class="clear-btn" *ngIf="hasActiveFilters" (click)="clearFilters()">
              <i class="bi bi-x-circle"></i> Clear
            </button>
          </div>
          <div class="pp-actions" *ngIf="canImportExport">
            <button nz-button nzType="default" (click)="downloadSampleExcel()" nz-tooltip="Download Sample">
              <i class="bi bi-file-earmark-text"></i> Sample
            </button>
            <button nz-button nzType="default" (click)="exportToExcel()" nz-tooltip="Export Excel">
              <i class="bi bi-download"></i> Export
            </button>
            <button nz-button nzType="default" (click)="triggerImport()" nz-tooltip="Import Excel">
              <i class="bi bi-upload"></i> Import
            </button>
          </div>
        </div>
      </nz-card>

      <input #fileInput type="file" accept=".xlsx,.xls" style="display:none" (change)="importFromExcel($event)">

      <nz-card class="pl-table-card" nzSize="small">
        <nz-table
          [nzData]="dataSource"
          [nzFrontPagination]="false"
          [nzPageIndex]="pageIndex + 1"
          [nzPageSize]="20"
          [nzTotal]="totalElements"
          (nzPageIndexChange)="onPageIndexChange($event)"
          (nzPageSizeChange)="onPageSizeChange($event)"
          nzShowSizeChanger
          [nzPageSizeOptions]="[10,20,50,100]"
          [nzNoResult]="emptyTemplate"
          class="theme-table"
          [nzLoading]="isLoading"
          nzTableLayout="fixed"
          nzSize="small"
        >
          <thead>
            <tr>
              <th class="th-sno">#</th>
              <th class="th-code">Code</th>
              <th class="th-name">Name</th>
              <th class="th-gen">Gender</th>
              <th class="th-desig">Designation</th>
              <th class="th-status">Status</th>
              <th class="th-role">Role</th>
              <th class="th-mob">Mobile</th>
              <th class="th-doj">DOJ</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let emp of dataSource; let i = index" class="emp-row"
                [routerLink]="['/admin/employees', emp.id]"
                [class.row-live]="emp.employeeStatus === 'LIVE'">
              <td class="td-center">{{ (pageIndex * pageSize) + i + 1 }}</td>
              <td class="td-center"><span class="emp-code-text">{{ emp.employeeCode }}</span></td>
              <td class="td-name">
                <div class="emp-info-cell">
                  <div class="emp-avatar" [style.background]="getAvatarColor(emp.employeeCode)">
                    {{ (emp.firstName?.charAt(0) || '') + (emp.surname?.charAt(0) || '') }}
                  </div>
                  <span class="emp-name">{{ emp.prefix ? emp.prefix + '. ' : '' }}{{ emp.firstName }} {{ emp.surname }}</span>
                </div>
              </td>
              <td class="td-center">{{ emp.gender || '-' }}</td>
              <td class="td-name">{{ emp.designation || '-' }}</td>
              <td class="td-center">
                <nz-tag [nzColor]="emp.employeeStatus === 'LIVE' ? 'green' : 'default'" class="status-tag">{{ emp.employeeStatus || '-' }}</nz-tag>
              </td>
              <td class="td-center">
                <span *ngIf="emp.userRole" class="role-tag" [class.role-admin]="emp.userRole === 'ADMIN'" [class.role-hr]="emp.userRole === 'HR'">
                  {{ emp.userRole }}
                </span>
                <span *ngIf="!emp.userRole" class="na-txt">-</span>
              </td>
              <td class="td-center mono-txt">{{ emp.mobile || '-' }}</td>
              <td class="td-center">{{ emp.doj | dateFormat }}</td>
              <td class="td-actions" (click)="$event.stopPropagation()">
                <button nz-button nzType="link" nzSize="small" class="action-btn action-view"
                  [routerLink]="['/admin/employees', emp.id]" nz-tooltip="View">
                  <i class="bi bi-eye"></i>
                </button>
                <button nz-button nzType="link" nzSize="small" class="action-btn action-edit"
                  [routerLink]="['/admin/employees', emp.id, 'edit']" nz-tooltip="Edit">
                  <i class="bi bi-pencil"></i>
                </button>
                <button nz-button nzType="link" nzSize="small" class="action-btn action-delete"
                  (click)="deleteEmployee(emp)" nz-tooltip="Delete">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </nz-table>
        <div class="pl-footer" *ngIf="totalElements > 0">
          <span class="pl-total">Showing {{ (pageIndex * pageSize) + 1 }}-{{ Math.min((pageIndex + 1) * pageSize, totalElements) }} of {{ totalElements }}</span>
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
          <button nz-button nzType="primary" class="btn-primary-gradient" routerLink="/admin/employees/new">
            <i class="bi bi-plus-lg"></i> Add Employee
          </button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    :host { display: block; scroll-behavior: smooth; }
    .pl-container {
      padding: 8px 12px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      height: calc(100vh - 48px);
      overflow-y: auto;
      scroll-behavior: smooth;
    }
    .pl-container::-webkit-scrollbar { width: 6px; }
    .pl-container::-webkit-scrollbar-track { background: transparent; }
    .pl-container::-webkit-scrollbar-thumb { background: #d0d5dd; border-radius: 3px; }
    .pl-container::-webkit-scrollbar-thumb:hover { background: #98a2b3; }

    .pp-sub-nav {
      display: flex;
      gap: 2px;
      margin-bottom: 8px;
      background: #f0f4ff;
      border-radius: 8px;
      padding: 3px;
      border: 1px solid #e0e7ff;
    }
    .pp-nav-item {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #6c757d;
      text-decoration: none;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .pp-nav-item i { font-size: 14px; }
    .pp-nav-item:hover { background: rgba(31,61,110,0.06); color: #1f3d6e; }
    .pp-nav-item.active {
      background: #ffffff;
      color: #1f3d6e;
      box-shadow: 0 1px 4px rgba(31,61,110,0.1);
    }

    .pl-controls-card, .pl-table-card {
      border-radius: 8px !important;
      border: 1px solid #e8eaed !important;
      box-shadow: 0 1px 6px rgba(0,0,0,0.04) !important;
      margin-bottom: 8px;
      width: 100% !important;
    }
    :host ::ng-deep .pl-controls-card .ant-card-body { padding: 8px 12px !important; }
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
      gap: 8px;
      align-items: center;
    }
    .pp-actions {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .search-box {
      display: flex;
      align-items: center;
      background: #f5f6fa;
      border: 1px solid #e8eaed;
      border-radius: 6px;
      padding: 0 8px;
      transition: border-color 0.2s;
    }
    .search-box:focus-within { border-color: #4361ee; box-shadow: 0 0 0 2px rgba(67,97,238,0.1); }
    .search-ico { font-size: 13px; color: #adb5bd; margin-right: 4px; }
    .search-input {
      flex: 1;
      border: none !important;
      background: transparent !important;
      height: 30px;
      font-size: 12px;
      padding: 0;
      outline: none;
      box-shadow: none !important;
      min-width: 160px;
    }
    .search-clear { cursor: pointer; font-size: 11px; color: #adb5bd; transition: color 0.15s; margin-left: 4px; }
    .search-clear:hover { color: #dc3545; }

    .filter-select { width: 120px; }
    :host ::ng-deep .filter-select .ant-select-selector {
      border-radius: 6px !important;
      border: 1px solid #e2e5ea !important;
      height: 30px !important;
      padding: 0 6px !important;
      box-shadow: none !important;
    }
    :host ::ng-deep .filter-select .ant-select-selector:hover { border-color: #1f3d6e !important; }
    :host ::ng-deep .filter-select.ant-select-focused .ant-select-selector {
      border-color: #1f3d6e !important;
      box-shadow: 0 0 0 2px rgba(31,61,110,0.1) !important;
    }
    :host ::ng-deep .filter-select .ant-select-selection-item { font-size: 12px !important; line-height: 28px !important; }

    .clear-btn {
      height: 30px !important;
      padding: 0 10px !important;
      font-size: 12px !important;
      border-radius: 6px !important;
    }
    .btn-primary-gradient {
      height: 30px !important;
      padding: 0 14px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      border: none !important;
      border-radius: 6px !important;
      background: linear-gradient(135deg, #4361ee, #3a0ca3) !important;
      color: #fff !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
      box-shadow: 0 2px 6px rgba(67,97,238,0.25) !important;
    }
    .btn-primary-gradient:hover { transform: translateY(-1px) !important; box-shadow: 0 3px 10px rgba(67,97,238,0.35) !important; }
    :host ::ng-deep .pl-controls-card .ant-btn,
    :host ::ng-deep .pl-controls-card button:not(.btn-primary-gradient) {
      height: 30px !important;
      padding: 0 10px !important;
      font-size: 12px !important;
      border-radius: 6px !important;
    }

    :host ::ng-deep .theme-table { width: 100% !important; table-layout: fixed !important; }
    :host ::ng-deep .theme-table .ant-table { font-size: 12px; border-radius: 0 !important; }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th {
      background: #f8f9fc !important;
      color: #1f3d6e !important;
      font-size: 10px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
      padding: 6px 6px !important;
      border-bottom: 2px solid #1f3d6e !important;
      white-space: nowrap;
    }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th:not(:last-child) { border-right: 1px solid #e8ecf1; }
    :host ::ng-deep .theme-table .ant-table-tbody > tr > td {
      padding: 4px 6px !important;
      border-bottom: 1px solid #f0f2f5 !important;
      font-size: 11px;
      color: #374151;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr:hover > td { background: rgba(31,61,110,0.03) !important; }
    :host ::ng-deep .theme-table .ant-table-tbody > tr:last-child > td { border-bottom: none; }

    .emp-row { cursor: pointer; }
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

    .th-sno { width: 4% !important; text-align: center !important; }
    .th-code { width: 8% !important; text-align: center !important; }
    .th-name { width: 22% !important; text-align: left !important; }
    .th-gen { width: 7% !important; text-align: center !important; }
    .th-desig { width: 15% !important; text-align: left !important; }
    .th-status { width: 9% !important; text-align: center !important; }
    .th-role { width: 8% !important; text-align: center !important; }
    .th-mob { width: 10% !important; text-align: center !important; }
    .th-doj { width: 10% !important; text-align: center !important; }
    .th-actions { width: 7% !important; text-align: center !important; }

    .td-center { text-align: center !important; }
    .td-name {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .emp-info-cell { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .emp-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 700; color: #fff;
      flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    }
    .emp-name { font-size: 11px; font-weight: 600; color: #1a1a2e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .emp-code-text { font-weight: 600; color: #1f3d6e; letter-spacing: 0.3px; font-size: 11px; }

    .status-tag {
      font-size: 9px !important;
      font-weight: 600 !important;
      padding: 0 5px !important;
      line-height: 16px !important;
      border-radius: 3px !important;
    }

    .role-tag { display: inline-block; padding: 1px 8px; border-radius: 10px; font-size: 9px; font-weight: 600; line-height: 16px; }
    .role-admin { background: #eef2ff; color: #4361ee; }
    .role-hr { background: #ecfdf5; color: #059669; }
    .na-txt { color: #bbb; font-size: 11px; }
    .mono-txt { font-family: 'Courier New', monospace; font-size: 11px; color: #555; letter-spacing: 0.5px; }

    .action-btn { padding: 0 3px !important; font-size: 14px !important; transition: all 0.2s ease !important; }
    .action-view { color: #1f3d6e !important; }
    .action-view:hover { color: #16213e !important; transform: scale(1.15); }
    .action-edit { color: #4361ee !important; }
    .action-edit:hover { color: #3a0ca3 !important; transform: scale(1.15); }
    .action-delete { color: #dc3545 !important; }
    .action-delete:hover { color: #b91c1c !important; transform: scale(1.15); }

    .pl-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 12px;
      border-top: 1px solid #f0f2f5;
      background: #fafbfc;
    }
    .pl-total { font-size: 11px; color: #6c757d; }

    :host ::ng-deep .theme-table .ant-table-pagination { margin: 8px 12px !important; display: flex; align-items: center; justify-content: flex-end; }
    :host ::ng-deep .theme-table .ant-table-pagination .ant-pagination-item { border-radius: 6px; font-size: 11px; min-width: 28px; height: 28px; line-height: 28px; border-color: #e8eaed; }
    :host ::ng-deep .theme-table .ant-table-pagination .ant-pagination-item-active { border-color: #4361ee; background: #4361ee; }
    :host ::ng-deep .theme-table .ant-table-pagination .ant-pagination-item-active a { color: #fff; font-weight: 700; }
    :host ::ng-deep .theme-table .ant-table-pagination .ant-pagination-item:hover { border-color: #4361ee; }
    :host ::ng-deep .theme-table .ant-table-pagination .ant-pagination-options { margin-left: 6px; }
    :host ::ng-deep .theme-table .ant-table-pagination .ant-pagination-total-text { font-size: 11px; color: #6c757d; margin-right: auto; }

    .empty-state-content { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 36px 16px; text-align: center; }
    .empty-icon-wrapper { width: 60px; height: 60px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; }
    .empty-icon-wrapper .empty-icon { font-size: 28px; color: #4361ee; opacity: 0.4; }
    .empty-state-content h3 { font-size: 15px; font-weight: 600; color: #1a1a2e; margin: 0; }
    .empty-state-content p { font-size: 12px; color: #6c757d; margin: 0; }

    @media (max-width: 768px) {
      .pl-controls { flex-direction: column; align-items: stretch; }
      .pl-filters { flex-wrap: wrap; }
      .pp-actions { justify-content: center; }
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
  filterDesignation = '';
  filterProcess = '';

  statusOptions: string[] = [];
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
      this.statusOptions = data.map(i => i.value);
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
    return !!this.searchTerm || !!this.filterStatus || !!this.filterDesignation || !!this.filterProcess;
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
    this.filterDesignation = '';
    this.filterProcess = '';
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
}
