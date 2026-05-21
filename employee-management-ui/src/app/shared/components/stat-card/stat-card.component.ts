import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

export type StatCardVariant = 'total' | 'active' | 'new' | 'exit';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzStatisticModule],
  template: `
    <div class="stat-box" [class]="'stat-' + variant">
      <div class="stat-box-inner">
        <div class="stat-box-icon"><i nz-icon [nzType]="icon"></i></div>
        <nz-statistic [nzValue]="value" [nzTitle]="title"></nz-statistic>
      </div>
      <div class="stat-box-footer" *ngIf="footer"><span>{{ footer }}</span></div>
    </div>
  `,
  styles: [`
    .stat-box { background: #fff; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--color-border-light); box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: all 0.25s ease; height: 100%; position: relative; }
    .stat-box:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.07); }
    .stat-box::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; pointer-events: none; }

    .stat-total::before { background: linear-gradient(90deg, #1f3d6e, #2a5298); }
    .stat-active::before { background: linear-gradient(90deg, #28a745, #34ce57); }
    .stat-new::before { background: linear-gradient(90deg, #1565c0, #1976d2); }
    .stat-exit::before { background: linear-gradient(90deg, #dc3545, #e04d5a); }

    .stat-box-inner { display: flex; align-items: center; gap: 12px; padding: 14px 16px; }
    .stat-box-icon { width: 36px; height: 36px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .stat-box-icon i[nz-icon] { font-size: 18px; }
    .stat-box-footer { padding: 5px 16px; border-top: 1px solid var(--color-border-light); font-size: 10px; color: #b0b8c7; display: flex; align-items: center; gap: 6px; }
    .stat-box-footer span::before { content: '\\2022'; margin-right: 6px; opacity: 0.5; }

    .stat-total .stat-box-icon { background: linear-gradient(135deg, #e3e8f0, #c5d0e0); color: #1f3d6e; }
    .stat-active .stat-box-icon { background: linear-gradient(135deg, #e8f5e9, #c8e6c9); color: #2e7d32; }
    .stat-new .stat-box-icon { background: linear-gradient(135deg, #e3f2fd, #bbdefb); color: #1565c0; }
    .stat-exit .stat-box-icon { background: linear-gradient(135deg, #fce4ec, #f8bbd0); color: #c62828; }

    ::ng-deep .stat-box .ant-statistic-title { font-size: 10px !important; color: #8a94a6 !important; margin-bottom: 0 !important; text-transform: uppercase; letter-spacing: 0.5px; }
    ::ng-deep .stat-box .ant-statistic-content { font-size: 20px !important; font-weight: 800 !important; color: #1a1a2e !important; line-height: 1.1 !important; }

    @media (max-width: 768px) {
      .stat-box-inner { padding: 12px; }
    }
  `]
})
export class StatCardComponent {
  @Input() icon = 'team';
  @Input() value: number = 0;
  @Input() title = '';
  @Input() footer = '';
  @Input() variant: StatCardVariant = 'total';
}
