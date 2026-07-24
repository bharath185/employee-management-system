import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { CompOffService } from '../../core/services/comp-off.service';
import { EmployeeService } from '../../core/services/employee.service';
import { CompOff } from '../../core/models/payroll.models';


@Component({
  selector: 'app-comp-off-tracking',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzTableModule, NzButtonModule, NzSelectModule,
    NzIconModule, NzTagModule, NzPopconfirmModule
  ],
  template: `
    <div class="page-enter">
      <div class="section-card">
        <div class="section-toolbar">
          <nz-select [(ngModel)]="employeeFilter" (ngModelChange)="loadCompOffs()" class="filter-select" nzPlaceHolder="All Employees" style="width:240px">
            <nz-option [nzValue]="null" nzLabel="All Employees"></nz-option>
            <nz-option *ngFor="let e of employees" [nzValue]="e.id" [nzLabel]="e.employeeCode + ' - ' + e.firstName + ' ' + e.surname"></nz-option>
          </nz-select>
        </div>

        <nz-table #t [nzData]="compOffs" [nzLoading]="loading" class="theme-table" nzSize="small">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Earned Date</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th>Availed Date</th>
              <th>Remarks</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of t.data">
              <td><span class="emp-cell">{{ c.employeeCode }} - {{ c.employeeName }}</span></td>
              <td>{{ c.earnedDate }}</td>
              <td>{{ c.expiryDate }}</td>
              <td>
                <nz-tag [nzColor]="tagColor(c.status)">{{ c.status }}</nz-tag>
              </td>
              <td>{{ c.availedDate || '—' }}</td>
              <td>{{ c.remarks || '—' }}</td>
              <td class="td-actions">
                <button *ngIf="c.status === 'EARNED'" nz-button nzType="link" nzSize="small" class="action-btn action-approve"
                  nz-popconfirm nzPopconfirmTitle="Mark this comp-off as availed?" (nzOnConfirm)="avail(c.id)" nz-tooltip="Avail">
                  <i nz-icon nzType="check-circle"></i>
                </button>
                <span *ngIf="c.status !== 'EARNED'" class="text-muted">—</span>
              </td>
            </tr>
            <tr *ngIf="compOffs.length === 0 && !loading">
              <td colspan="7" class="empty-cell">No comp-offs found</td>
            </tr>
          </tbody>
        </nz-table>
      </div>
    </div>
  `,
  styles: [`
    .section-card {
      background: #fff;
      border: 1px solid #e8eaed;
      border-radius: 10px;
      padding: 14px 16px;
      margin-top: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .section-toolbar {
      display: flex;
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
    .th-actions { text-align: center !important; width: 70px; }
    .td-actions { text-align: center !important; white-space: nowrap; }
    .action-btn { padding: 0 4px !important; font-size: 16px !important; }
    .action-approve { color: #10b981 !important; }
    .action-approve:hover { color: #059669 !important; }
    .text-muted { color: #d1d5db; font-size: 13px; }
    .empty-cell { text-align: center !important; padding: 28px !important; color: #9ca3af !important; }
  `]
})
export class CompOffTrackingComponent implements OnInit {
  compOffs: CompOff[] = [];
  employees: any[] = [];
  loading = false;
  employeeFilter: number | null = null;

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
    this.employeeService.getEmployees({ size: 200, employeeStatus: 'LIVE' }).subscribe({
      next: (res) => { if (res.success) this.employees = res.data?.content || []; }
    });
  }

  loadCompOffs(): void {
    this.loading = true;
    this.compOffService.getCompOffs(this.employeeFilter ?? undefined).subscribe({
      next: (res) => { this.compOffs = res.data || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  avail(id: number): void {
    this.compOffService.availCompOff(id).subscribe({
      next: () => { this.msg.success('Comp-Off availed'); this.loadCompOffs(); },
      error: (err) => this.msg.error(err.error?.message || 'Failed')
    });
  }

  tagColor(status: string): string {
    switch (status) {
      case 'EARNED': return 'blue';
      case 'AVAILED': return 'green';
      case 'EXPIRED': return 'red';
      default: return 'default';
    }
  }
}
