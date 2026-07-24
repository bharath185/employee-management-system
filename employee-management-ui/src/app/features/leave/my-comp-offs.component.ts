import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CompOffService } from '../../core/services/comp-off.service';
import { CompOff } from '../../core/models/payroll.models';

@Component({
  selector: 'app-my-comp-offs',
  standalone: true,
  imports: [CommonModule, RouterLink, NzTableModule, NzButtonModule, NzIconModule, NzTagModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>My Comp-Offs</h1>
        <button nz-button nzType="default" routerLink="/employee/dashboard">
          <i nz-icon nzType="arrow-left"></i> Back
        </button>
      </div>

      <div class="card">
        <nz-table #t [nzData]="compOffs" [nzLoading]="loading" nzSize="small" [nzPageSize]="20">
          <thead>
            <tr>
              <th>#</th>
              <th>Earned Date</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th>Availed Date</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of t.data; let i = index">
              <td>{{ i + 1 }}</td>
              <td>{{ c.earnedDate }}</td>
              <td>{{ c.expiryDate }}</td>
              <td><nz-tag [nzColor]="tagColor(c.status)">{{ c.status }}</nz-tag></td>
              <td>{{ c.availedDate || '—' }}</td>
            </tr>
            <tr *ngIf="compOffs.length === 0 && !loading">
              <td colspan="5" class="empty-cell">No comp-offs found</td>
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
export class MyCompOffsComponent implements OnInit {
  compOffs: CompOff[] = [];
  loading = false;

  constructor(
    private compOffService: CompOffService,
    private msg: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.compOffService.getMyCompOffs().subscribe({
      next: (res) => { this.compOffs = res.data || []; this.loading = false; },
      error: () => { this.loading = false; this.msg.error('Failed to load'); }
    });
  }

  tagColor(s: string): string {
    switch (s) {
      case 'EARNED': return 'blue';
      case 'AVAILED': return 'green';
      case 'EXPIRED': return 'red';
      default: return 'default';
    }
  }
}
