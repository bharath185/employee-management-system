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
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { EmployeeService } from '../../core/services/employee.service';
import { MasterDataService } from '../../core/services/master-data.service';
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
    NzAvatarModule,
    NzDropDownModule,
    NzSpinModule,
    NzFormModule,
    NzMessageModule,
    NzModalModule,
    NzToolTipModule,
    LoadingSpinnerComponent,
    DateFormatPipe
  ],
  template: `
    <div class="emp-container">
      <div class="emp-header">
        <div class="emp-header-left">
          <div class="emp-brand">
            <div class="emp-icon"><i nz-icon nzType="team"></i></div>
            <span class="emp-logo">STAFF MASTER</span>
          </div>
          <span class="emp-subtitle">Manage all employee records</span>
        </div>
        <div class="emp-header-actions">
          <button nz-button nz-tooltip="Download Sample" class="hdr-btn" (click)="downloadSampleExcel()">
            <i nz-icon nzType="file-text"></i>
          </button>
          <button nz-button nz-tooltip="Export Excel" class="hdr-btn" (click)="exportToExcel()">
            <i nz-icon nzType="download"></i>
          </button>
          <button nz-button nz-tooltip="Import Excel" class="hdr-btn" (click)="triggerImport()">
            <i nz-icon nzType="upload"></i>
          </button>
          <button nz-button nzType="primary" class="hdr-btn-primary" routerLink="/admin/employees/new">
            <i nz-icon nzType="plus"></i> Add Employee
          </button>
        </div>
      </div>

      <input #fileInput type="file" accept=".xlsx,.xls" style="display:none" (change)="importFromExcel($event)">

      <div class="emp-filter-bar">
        <div class="emp-search-wrap">
          <div class="search-box">
            <i nz-icon nzType="search" class="search-ico"></i>
            <input nz-input [(ngModel)]="searchTerm" (input)="onSearch()" placeholder="Name, code, email, mobile..." class="search-input">
            <i nz-icon nzType="close" class="search-clear" *ngIf="searchTerm" (click)="clearSearch()"></i>
          </div>
        </div>
        <nz-select [(ngModel)]="filterStatus" (ngModelChange)="loadEmployees()" nzPlaceHolder="Status" class="emp-filter-select">
          <nz-option nzValue="" nzLabel="All Statuses"></nz-option>
          <nz-option *ngFor="let opt of statusOptions" [nzValue]="opt" [nzLabel]="opt"></nz-option>
        </nz-select>
        <nz-select [(ngModel)]="filterDesignation" (ngModelChange)="loadEmployees()" nzPlaceHolder="Designation" class="emp-filter-select">
          <nz-option nzValue="" nzLabel="All Designations"></nz-option>
          <nz-option *ngFor="let opt of designationOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
        </nz-select>
        <button nz-button class="emp-clear-btn" *ngIf="hasActiveFilters" (click)="clearFilters()">
          <i nz-icon nzType="clear"></i> Clear
        </button>
      </div>

      <app-loading-spinner [loading]="isLoading" message="Loading employees..."></app-loading-spinner>

      <div class="emp-table-card" *ngIf="!isLoading">
        <div class="emp-table-header">
          <div class="emp-table-title">
            <i nz-icon nzType="audit"></i> Employee Records
            <span class="emp-count-badge">{{ totalElements }} total</span>
          </div>
          <span class="emp-page-info" *ngIf="totalElements > 0">
            Page {{ pageIndex + 1 }} of {{ getTotalPages() }}
          </span>
        </div>

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

        <nz-table
          [nzData]="dataSource"
          [nzFrontPagination]="false"
          [nzPageIndex]="pageIndex + 1"
          [nzPageSize]="pageSize"
          [nzTotal]="totalElements"
          (nzPageIndexChange)="onPageIndexChange($event)"
          (nzPageSizeChange)="onPageSizeChange($event)"
          nzShowSizeChanger
          [nzPageSizeOptions]="[10,25,50,100]"
          [nzScroll]="{ x: '900px' }"
          [nzNoResult]="emptyTemplate"
          class="emp-table"
          [nzLoading]="isLoading"
          nzTableLayout="fixed"
          nzSize="middle"
        >
          <thead>
            <tr>
              <th nz-th nzColumnKey="employeeCode" [nzShowSort]="true" (nzSortChange)="onSortChange('employeeCode', $any($event))" class="th-code">
                <div class="th-c"><i nz-icon nzType="tag"></i> Code</div>
              </th>
              <th nz-th nzColumnKey="name" [nzShowSort]="true" (nzSortChange)="onSortChange('name', $any($event))" class="th-name">
                <div class="th-c"><i nz-icon nzType="user"></i> Name</div>
              </th>
              <th nz-th nzColumnKey="gender" class="th-gen">
                <div class="th-c"><i nz-icon nzType="contacts"></i> Gender</div>
              </th>
              <th nz-th nzColumnKey="designation" [nzShowSort]="true" (nzSortChange)="onSortChange('designation', $any($event))" class="th-desig">
                <div class="th-c"><i nz-icon nzType="tool"></i> Designation</div>
              </th>
              <th nz-th nzColumnKey="employeeStatus" [nzShowSort]="true" (nzSortChange)="onSortChange('employeeStatus', $any($event))" class="th-stat">
                <div class="th-c"><i nz-icon nzType="check-circle"></i> Status</div>
              </th>
              <th nz-th nzColumnKey="userRole" class="th-role">
                <div class="th-c"><i nz-icon nzType="safety"></i> Role</div>
              </th>
              <th nz-th nzColumnKey="mobile" class="th-mob">
                <div class="th-c"><i nz-icon nzType="phone"></i> Mobile</div>
              </th>
              <th nz-th nzColumnKey="doj" [nzShowSort]="true" (nzSortChange)="onSortChange('doj', $any($event))" class="th-doj">
                <div class="th-c"><i nz-icon nzType="calendar"></i> DOJ</div>
              </th>
              <th nz-th nzColumnKey="actions" class="th-act">
                <span class="th-act-label">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let emp of dataSource"
                [routerLink]="['/admin/employees', emp.id]"
                class="emp-row"
                [class.row-live]="emp.employeeStatus === 'LIVE'"
                [class.row-inactive]="emp.employeeStatus !== 'LIVE'">

              <td nz-td>
                <span class="code-pill">{{ emp.employeeCode }}</span>
              </td>

              <td nz-td>
                <div class="emp-info-cell">
                  <div class="emp-avatar" [style.background]="getAvatarColor(emp.employeeCode)">
                    {{ (emp.firstName?.charAt(0) || '') + (emp.surname?.charAt(0) || '') }}
                  </div>
                  <div class="emp-details">
                    <span class="emp-name">
                      {{ emp.prefix ? emp.prefix + '. ' : '' }}{{ emp.firstName }} {{ emp.surname }}
                    </span>
                    <span class="emp-sub">{{ emp.designation || 'No designation' }}</span>
                  </div>
                </div>
              </td>

              <td nz-td><span class="gen-txt">{{ emp.gender || '-' }}</span></td>

              <td nz-td><span class="desig-txt">{{ emp.designation || '-' }}</span></td>

              <td nz-td>
                <span class="stat-pill" [class.stat-live]="emp.employeeStatus === 'LIVE'" [class.stat-other]="emp.employeeStatus !== 'LIVE'">
                  <span class="stat-dot"></span>
                  {{ emp.employeeStatus || '-' }}
                </span>
              </td>

              <td nz-td>
                <span *ngIf="emp.userRole" class="role-tag" [class.role-admin]="emp.userRole === 'ADMIN'" [class.role-hr]="emp.userRole === 'HR'" [class.role-emp]="emp.userRole === 'EMPLOYEE'">
                  {{ emp.userRole }}
                </span>
                <span *ngIf="!emp.userRole" class="na-txt">—</span>
              </td>

              <td nz-td><span class="mono-txt">{{ emp.mobile || '-' }}</span></td>

              <td nz-td><span class="date-txt">{{ emp.doj | dateFormat }}</span></td>

              <td nz-td (click)="$event.stopPropagation()">
                <div class="row-actions-cell">
                  <button nz-button nzType="text" nz-dropdown [nzDropdownMenu]="rowMenu" class="act-btn">
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
                      <li nz-menu-item (click)="deleteEmployee(emp)" class="del-act">
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
    .emp-container{max-width:1400px;margin:0 auto;padding:0}

    .emp-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px;padding:14px 20px;background:linear-gradient(135deg,#1f3d6e,#16213e);border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.12)}
    .emp-header-left{display:flex;align-items:center;gap:14px}
    .emp-brand{display:flex;align-items:center;gap:8px}
    .emp-icon{width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.15);border-radius:8px;color:#fff;font-size:16px}
    .emp-logo{font-size:17px;font-weight:800;color:#fff;letter-spacing:1.5px}
    .emp-subtitle{font-size:13px;color:rgba(255,255,255,.65);font-weight:500;padding:2px 10px;background:rgba(255,255,255,.1);border-radius:12px}
    .emp-header-actions{display:flex;align-items:center;gap:5px}
    .hdr-btn{height:30px;font-size:12px;border-radius:6px;border:none;background:rgba(255,255,255,.12);color:rgba(255,255,255,.8);padding:0 10px;transition:all .2s;display:flex;align-items:center;gap:4px}
    .hdr-btn:hover:not(:disabled){background:rgba(255,255,255,.2);color:#fff}
    .hdr-btn-primary{height:30px;font-size:12px;border-radius:6px;padding:0 14px;font-weight:600}

    .emp-filter-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:12px;padding:10px 16px;background:#fff;border:1px solid #e8eaed;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
    .emp-search-wrap{flex:1;min-width:180px;max-width:320px}
    .search-box{display:flex;align-items:center;background:#f5f6fa;border:1px solid #e8eaed;border-radius:6px;padding:0 10px;transition:border-color .2s}
    .search-box:focus-within{border-color:#4361ee;box-shadow:0 0 0 2px rgba(67,97,238,.1)}
    .search-ico{font-size:14px;color:#adb5bd;margin-right:6px}
    .search-input{flex:1;border:none!important;background:transparent!important;height:32px;font-size:12px;padding:0;outline:none;box-shadow:none!important}
    .search-clear{cursor:pointer;font-size:12px;color:#adb5bd;transition:color .15s;margin-left:4px}
    .search-clear:hover{color:#dc3545}
    .emp-filter-select{width:160px}
    .emp-filter-select ::ng-deep .ant-select-selector{border-radius:6px!important;height:32px!important;padding:0 10px!important;border-color:#e8eaed!important}
    .emp-filter-select ::ng-deep .ant-select-selection-placeholder,
    .emp-filter-select ::ng-deep .ant-select-selection-item{font-size:12px;line-height:30px!important}
    .emp-clear-btn{height:32px;font-size:12px;padding:0 12px;border-radius:6px}

    .emp-table-card{background:#fff;border:1px solid #e8eaed;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.05)}
    .emp-table-header{display:flex;align-items:center;justify-content:space-between;padding:8px 16px;border-bottom:1px solid #e8eaed;background:#fafbfc;gap:8px}
    .emp-table-title{font-size:12px;font-weight:600;color:#1a1a2e;display:flex;align-items:center;gap:6px}
    .emp-table-title i{font-size:14px;color:#4361ee}
    .emp-count-badge{font-size:10px;font-weight:500;color:#6c757d;background:#f0f2f5;padding:1px 8px;border-radius:10px}
    .emp-page-info{font-size:10px;color:#6c757d}

    .emp-table{width:100%}
    .emp-table ::ng-deep .ant-table-thead>tr>th{background:#f7f8fc;border-bottom:2px solid #e8eaed;font-size:10px;font-weight:600;color:#555;padding:8px 10px;white-space:nowrap;text-transform:uppercase;letter-spacing:.3px}
    .emp-table ::ng-deep .ant-table-thead>tr>th.ant-table-cell-fix-left,
    .emp-table ::ng-deep .ant-table-thead>tr>th.ant-table-cell-fix-right{background:#f7f8fc}
    .th-c{display:inline-flex;align-items:center;gap:4px}
    .th-c i{font-size:12px;color:#adb5bd}
    .th-act-label{font-size:10px;font-weight:600;color:#6c757d;white-space:nowrap}

    .emp-row{cursor:pointer;transition:background .15s}
    .emp-row:hover{background:#f0f4ff!important}
    .emp-table ::ng-deep .ant-table-tbody>tr>td{padding:10px 10px;font-size:12px;color:#333;border-bottom:1px solid #f0f2f5;vertical-align:middle}

    .emp-row.row-live td.ant-table-cell:first-child{position:relative}
    .emp-row.row-live td.ant-table-cell:first-child::before{content:'';position:absolute;left:0;top:8px;bottom:8px;width:3px;background:#10b981;border-radius:0 2px 2px 0}

    .code-pill{background:#eef2ff;padding:2px 10px;border-radius:4px;font-family:'Cascadia Code','Consolas',monospace;font-size:11px;color:#4361ee;font-weight:600;letter-spacing:.3px}
    .emp-info-cell{display:flex;align-items:center;gap:10px}
    .emp-avatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0;letter-spacing:.5px;box-shadow:0 1px 3px rgba(0,0,0,.12)}
    .emp-details{display:flex;flex-direction:column;gap:1px;min-width:0}
    .emp-name{font-weight:600;color:#1a1a2e;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .emp-sub{font-size:10px;color:#6c757d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .gen-txt{font-size:11px;color:#555}
    .desig-txt{font-size:11px;color:#555}

    .stat-pill{display:inline-flex;align-items:center;gap:5px;padding:2px 10px;border-radius:10px;font-size:10px;font-weight:600;line-height:20px}
    .stat-pill.stat-live{background:#ecfdf5;color:#059669}
    .stat-pill.stat-other{background:#f8fafc;color:#6c757d}
    .stat-dot{width:6px;height:6px;border-radius:50%}
    .stat-live .stat-dot{background:#10b981;box-shadow:0 0 4px rgba(16,185,129,.4)}
    .stat-other .stat-dot{background:#adb5bd}

    .role-tag{display:inline-block;padding:1px 10px;border-radius:10px;font-size:10px;font-weight:600;line-height:20px}
    .role-admin{background:#eef2ff;color:#4361ee}
    .role-hr{background:#ecfdf5;color:#059669}
    .role-emp{background:#f8fafc;color:#6c757d;border:1px solid #e8eaed}
    .na-txt{color:#bbb;font-size:12px}
    .mono-txt{font-family:'Cascadia Code','Consolas',monospace;font-size:11px;color:#555;letter-spacing:.5px}
    .date-txt{font-size:11px;color:#6c757d}

    .row-actions-cell{display:flex;justify-content:center;align-items:center}
    .act-btn{min-width:30px;width:30px;height:30px;padding:0;display:flex;align-items:center;justify-content:center;border-radius:6px;background:transparent;transition:all .12s;border:none}
    .act-btn i{font-size:16px;color:#adb5bd;transition:color .12s}
    .emp-row:hover .act-btn{background:#e8eaed}
    .emp-row:hover .act-btn i{color:#4361ee}
    .act-btn:hover{background:#dce0e8!important}
    .act-btn:hover i{color:#3a0ca3!important}
    .del-act{color:#dc3545}
    .del-act:hover{color:#c82333!important}

    .row-menu{border-radius:8px;padding:4px;min-width:160px}
    .row-menu .ant-dropdown-menu-item{border-radius:6px;font-size:12px;padding:6px 10px;display:flex;align-items:center;gap:6px}
    .row-menu .ant-dropdown-menu-item i{font-size:14px}

    .emp-table ::ng-deep .ant-table-pagination{margin:10px 16px!important;display:flex;align-items:center;justify-content:flex-end}
    .emp-table ::ng-deep .ant-table-pagination .ant-pagination-item{border-radius:6px;font-size:11px;min-width:28px;height:28px;line-height:28px;border-color:#e8eaed}
    .emp-table ::ng-deep .ant-table-pagination .ant-pagination-item-active{border-color:#4361ee;background:#4361ee;box-shadow:0 2px 6px rgba(67,97,238,.3)}
    .emp-table ::ng-deep .ant-table-pagination .ant-pagination-item-active a{color:#fff;font-weight:700}
    .emp-table ::ng-deep .ant-table-pagination .ant-pagination-item:hover{border-color:#4361ee}
    .emp-table ::ng-deep .ant-table-pagination .ant-pagination-prev,
    .emp-table ::ng-deep .ant-table-pagination .ant-pagination-next{min-width:28px;height:28px;line-height:28px}
    .emp-table ::ng-deep .ant-table-pagination .ant-pagination-options{margin-left:6px}
    .emp-table ::ng-deep .ant-table-pagination .ant-select-selector{border-radius:6px!important;height:28px!important}
    .emp-table ::ng-deep .ant-table-pagination .ant-pagination-total-text{font-size:11px;color:#6c757d;margin-right:auto}

    .empty-state-content{display:flex;flex-direction:column;align-items:center;gap:10px;padding:36px 16px;text-align:center}
    .empty-icon-wrapper{width:60px;height:60px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center}
    .empty-icon-wrapper .empty-icon{font-size:28px;color:#4361ee;opacity:.4}
    .empty-state-content h3{font-size:15px;font-weight:600;color:#1a1a2e;margin:0}
    .empty-state-content p{font-size:12px;color:#6c757d;margin:0;max-width:280px}
    .emp-table ::ng-deep .ant-spin-text{font-size:12px;color:#4361ee}

    @media(max-width:1024px){.emp-search-wrap{min-width:180px;max-width:100%}.emp-filter-select{width:140px}}
    @media(max-width:768px){
      .emp-header{flex-direction:column;align-items:flex-start;padding:12px 16px}
      .emp-header-actions{width:100%;flex-wrap:wrap}
      .hdr-btn,.hdr-btn-primary{flex:1;justify-content:center;font-size:11px}
      .emp-filter-bar{flex-direction:column;align-items:stretch}
      .emp-search-wrap{max-width:100%}
      .emp-filter-select{width:100%}
      .emp-table-header{flex-direction:column;align-items:flex-start}
      .emp-table ::ng-deep .ant-table-pagination{margin:10px!important;flex-wrap:wrap;gap:6px;justify-content:center}
    }
    @media(max-width:480px){.emp-clear-btn{width:100%}}
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
