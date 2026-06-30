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
    .stat-box {
      background: #ffffff !important;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e8eaed;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      height: 100%;
      position: relative;
    }
    .stat-box::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; pointer-events: none; z-index: 1; }

    .stat-total::before { background: #2563eb; }
    .stat-active::before { background: #10b981; }
    .stat-new::before { background: #06b6d4; }
    .stat-exit::before { background: #ef4444; }

    .stat-box-inner { display: flex; align-items: center; gap: 14px; padding: 16px 18px; }
    .stat-box-icon {
      width: 40px; height: 40px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .stat-box-icon i[nz-icon] { font-size: 20px; }
    .stat-box-footer { padding: 5px 16px; border-top: 1px solid #e8eaed; font-size: 10px; color: #adb5bd; display: flex; align-items: center; gap: 6px; }
    .stat-box-footer span::before { content: '\\2022'; margin-right: 6px; opacity: 0.5; }

    .stat-total .stat-box-icon { background: #eff6ff; color: #2563eb; }
    .stat-active .stat-box-icon { background: #ecfdf5; color: #10b981; }
    .stat-new .stat-box-icon { background: #ecfeff; color: #06b6d4; }
    .stat-exit .stat-box-icon { background: #fef2f2; color: #ef4444; }

    ::ng-deep .stat-box .ant-statistic-title { font-size: 11px !important; color: #6c757d !important; margin-bottom: 0 !important; text-transform: uppercase; letter-spacing: 0.5px; }
    ::ng-deep .stat-box .ant-statistic-content { font-size: 26px !important; font-weight: 800 !important; color: #1a1a2e !important; line-height: 1.1 !important; font-family: 'Inter', sans-serif; }

    @media (max-width: 768px) {
      .stat-box-inner { padding: 12px; }
    }
  `]
})
export class StatCardComponent {
  @Input() icon = 'team';
  @Input() value: number | string = 0;
  @Input() title = '';
  @Input() footer = '';
  @Input() variant: StatCardVariant = 'total';
}
