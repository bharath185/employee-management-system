import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { CompOffService } from '../../core/services/comp-off.service';
import { EmployeeService } from '../../core/services/employee.service';
import { CompOff } from '../../core/models/payroll.models';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-comp-off-tracking',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzTableModule, NzButtonModule, NzSelectModule,
    NzInputModule, NzIconModule, NzTagModule, NzToolTipModule
  ],
  template: `
      <div class="section-toolbar">
        <nz-select [(ngModel)]="employeeFilter" (ngModelChange)="loadCompOffs()" class="filter-select" nzPlaceHolder="All Employees" style="width:240px">
          <nz-option [nzValue]="null" nzLabel="All Employees"></nz-option>
          <nz-option *ngFor="let e of employees" [nzValue]="e.id" [nzLabel]="e.employeeCode + ' - ' + (e.surname ? e.surname + ' ' : '') + (e.firstName || '') + (e.middleName ? ' ' + e.middleName : '')"></nz-option>
        </nz-select>
        <nz-select [(ngModel)]="statusFilter" (ngModelChange)="applyFilter()" class="filter-select" nzPlaceHolder="All Statuses" style="width:140px">
          <nz-option [nzValue]="null" nzLabel="All Statuses"></nz-option>
          <nz-option nzValue="EARNED" nzLabel="EARNED"></nz-option>
          <nz-option nzValue="AVAILED" nzLabel="AVAILED"></nz-option>
        </nz-select>
        <nz-input-group [nzPrefix]="searchIcon" style="width:220px">
          <input nz-input [(ngModel)]="searchText" (ngModelChange)="applyFilter()" placeholder="Search code / name / remarks..." />
        </nz-input-group>
        <ng-template #searchIcon><i nz-icon nzType="search"></i></ng-template>

        <button nz-button nzType="default" nzSize="small" (click)="exportExcel()" [nzLoading]="exporting" nz-tooltip="Download Excel">
          <i nz-icon nzType="download"></i> Export
        </button>
        <button nz-button nzType="default" nzSize="small" (click)="importFile.click()" [nzLoading]="importing" nz-tooltip="Import Excel by Employee Code">
          <i nz-icon nzType="upload"></i> Import
        </button>
        <button nz-button nzType="default" nzSize="small" (click)="downloadSample()" nz-tooltip="Download sample Excel template">
          <i nz-icon nzType="file"></i> Sample
        </button>
        <input #importFile type="file" accept=".xlsx" style="display:none" (change)="importExcel($event)">
      </div>

      <nz-table #t [nzData]="filteredCompOffs" [nzLoading]="loading" class="theme-table" nzSize="small"
                [(nzPageIndex)]="pageIndex" [(nzPageSize)]="pageSize"
                [nzPageSizeOptions]="[10, 20, 50, 100]" [nzShowSizeChanger]="true" [nzShowPagination]="true">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Earned Date</th>
            <th>Status</th>
            <th>Availed Date</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of t.data">
            <td><span class="emp-cell">{{ c.employeeCode }} - {{ c.employeeName }}</span></td>
            <td>{{ c.earnedDate }}</td>
            <td>
              <nz-tag [nzColor]="tagColor(c.status)">{{ c.status }}</nz-tag>
            </td>
            <td>{{ c.availedDate || '—' }}</td>
            <td>{{ c.remarks || '—' }}</td>
          </tr>
          <tr *ngIf="filteredCompOffs.length === 0 && !loading">
            <td colspan="5" class="empty-cell">No comp-offs found</td>
          </tr>
        </tbody>
      </nz-table>
  `,
  styles: [`
    .section-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
    }
    .filter-select { width: 170px; }
    :host ::ng-deep .filter-select .ant-select-selector {
      border-radius: 8px !important;
      border: 1px solid #e2e5ea !important;
      height: 34px !important;
    }
    :host ::ng-deep .theme-table { width: 100% !important; }
    :host ::ng-deep .theme-table .ant-table { font-size: 13px; }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th {
      background: #f8f9fc !important;
      color: #1f3d6e !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      padding: 10px 12px !important;
      border-bottom: 2px solid #1f3d6e !important;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr > td {
      padding: 9px 12px !important;
      border-bottom: 1px solid #f0f2f5 !important;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr:hover > td { background: rgba(31,61,110,0.03) !important; }
    :host ::ng-deep .theme-table .ant-table-placeholder { display: none !important; }
    .emp-cell { font-weight: 500; color: #1f3d6e; }
    .empty-cell { text-align: center !important; padding: 28px !important; color: #9ca3af !important; }
  `]
})
export class CompOffTrackingComponent implements OnInit {
  compOffs: CompOff[] = [];
  filteredCompOffs: CompOff[] = [];
  employees: any[] = [];
  loading = false;
  exporting = false;
  importing = false;
  employeeFilter: number | null = null;
  statusFilter: string | null = null;
  searchText = '';
  pageIndex = 1;
  pageSize = 20;

  constructor(
    private compOffService: CompOffService,
    private employeeService: EmployeeService,
    private msg: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadCompOffs();
  }

  loadEmployees(): void {
    this.employeeService.getEmployees({ size: 1000, employeeStatus: 'LIVE', sort: 'employeeCode,desc' }).subscribe({
      next: (res) => { if (res.success) this.employees = res.data?.content || []; }
    });
  }

  loadCompOffs(): void {
    this.loading = true;
    this.compOffService.getCompOffs(this.employeeFilter ?? undefined).subscribe({
      next: (res) => {
        this.compOffs = res.data || [];
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.compOffs = [];
        this.filteredCompOffs = [];
      }
    });
  }

  applyFilter(): void {
    let result = [...this.compOffs];
    if (this.statusFilter) {
      result = result.filter(c => c.status === this.statusFilter);
    }
    if (this.searchText && this.searchText.trim()) {
      const q = this.searchText.trim().toLowerCase();
      result = result.filter(c =>
        (c.employeeCode && c.employeeCode.toLowerCase().includes(q)) ||
        (c.employeeName && c.employeeName.toLowerCase().includes(q)) ||
        (c.remarks && c.remarks.toLowerCase().includes(q)) ||
        (c.earnedDate && c.earnedDate.toString().includes(q)) ||
        (c.availedDate && c.availedDate.toString().includes(q))
      );
    }
    this.filteredCompOffs = result;
    this.pageIndex = 1;
  }

  tagColor(status: string): string {
    switch (status) {
      case 'EARNED': return 'blue';
      case 'AVAILED': return 'green';
      default: return 'default';
    }
  }

  exportExcel(): void {
    this.exporting = true;
    this.compOffService.exportExcel().subscribe({
      next: (blob) => { saveAs(blob, 'CompOffs.xlsx'); this.exporting = false; },
      error: () => { this.msg.error('Export failed'); this.exporting = false; }
    });
  }

  downloadSample(): void {
    this.compOffService.downloadSample().subscribe({
      next: (blob) => saveAs(blob, 'CompOff_Sample.xlsx'),
      error: () => this.msg.error('Download failed')
    });
  }

  importExcel(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.importing = true;
    this.compOffService.importExcel(input.files[0]).subscribe({
      next: (res) => {
        this.msg.success(`Imported ${res.data?.imported || 0} records`);
        this.importing = false;
        input.value = '';
        this.loadCompOffs();
      },
      error: (err) => {
        this.msg.error(err.error?.message || 'Import failed');
        this.importing = false;
        input.value = '';
      }
    });
  }
}
