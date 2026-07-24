import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { EncashmentService } from '../../core/services/encashment.service';
import { LeaveEncashment } from '../../core/models/payroll.models';

@Component({
  selector: 'app-my-encashments',
  standalone: true,
  imports: [CommonModule, RouterLink, NzTableModule, NzButtonModule, NzIconModule, NzTagModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>My Encashments</h1>
        <button nz-button nzType="default" routerLink="/employee/dashboard">
          <i nz-icon nzType="arrow-left"></i> Back
        </button>
      </div>

      <div class="card">
        <nz-table #t [nzData]="encashments" [nzLoading]="loading" nzSize="small" [nzPageSize]="20">
          <thead>
            <tr>
              <th>#</th>
              <th>Leave Type</th>
              <th>Days</th>
              <th>Amount</th>
              <th>Period</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of t.data; let i = index">
              <td>{{ i + 1 }}</td>
              <td>{{ e.leaveTypeName }}</td>
              <td>{{ e.encashedDays }}</td>
              <td>{{ e.encashmentAmount | number:'1.2-2' }}</td>
              <td>{{ monthName(e.month) }} {{ e.year }}</td>
              <td><nz-tag [nzColor]="statusColor(e.status)">{{ e.status }}</nz-tag></td>
            </tr>
            <tr *ngIf="encashments.length === 0 && !loading">
              <td colspan="6" class="empty-cell">No encashments found</td>
            </tr>
          </tbody>
        </nz-table>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 900px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h1 { font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0; }
    .card { background: #fff; border: 1px solid #e8eaed; border-radius: 8px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .empty-cell { text-align: center; padding: 28px; color: #9ca3af; }
    :host ::ng-deep .ant-table-thead > tr > th { background: #f8fafc !important; color: #1f3d6e !important; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  `]
})
export class MyEncashmentsComponent implements OnInit {
  encashments: LeaveEncashment[] = [];
  loading = false;
  months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  constructor(
    private encashmentService: EncashmentService,
    private msg: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.encashmentService.getMyEncashments().subscribe({
      next: (res) => { this.encashments = res.data || []; this.loading = false; },
      error: () => { this.loading = false; this.msg.error('Failed to load'); }
    });
  }

  monthName(m: number): string {
    return this.months.find(x => x.value === m)?.label || '';
  }

  statusColor(s: string): string {
    switch (s) {
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'PENDING': return 'orange';
      default: return 'default';
    }
  }
}
