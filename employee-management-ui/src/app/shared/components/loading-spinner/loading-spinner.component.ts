import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, NzSpinModule],
  template: `
    <div class="spinner-overlay" *ngIf="loading" role="status" aria-live="polite">
      <nz-spin [nzSize]="'large'"></nz-spin>
      <span *ngIf="message" class="spinner-message">{{ message }}</span>
    </div>
  `,
  styles: [`
    .spinner-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 48px 0;
      width: 100%;
    }
    .spinner-message {
      color: #666;
      font-size: 14px;
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() loading: boolean = false;
  @Input() message: string = 'Loading...';
  @Input() diameter: number = 40;
  @Input() strokeWidth: number = 4;
}
