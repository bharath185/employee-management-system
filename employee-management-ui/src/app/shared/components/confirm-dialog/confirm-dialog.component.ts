import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'warn' | 'accent';
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzIconModule
  ],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-header" *ngIf="data.icon">
        <i nz-icon [nzType]="data.icon" class="dialog-icon"
           [class.warn-icon]="data.confirmColor === 'warn'"></i>
      </div>
      <h2>{{ data.title }}</h2>
      <p>{{ data.message }}</p>
      <div class="dialog-actions">
        <button nz-button nzType="default" (click)="modalRef.close(false)">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button nz-button [nzType]="data.confirmColor === 'warn' ? 'primary' : 'primary'"
                [nzDanger]="data.confirmColor === 'warn'"
                (click)="modalRef.close(true)">
          {{ data.confirmText || 'Confirm' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      padding: 8px 0;
      min-width: 320px;
    }
    .dialog-header {
      text-align: center;
      margin-bottom: 8px;
    }
    .dialog-icon {
      font-size: 48px;
    }
    .warn-icon {
      color: #faad14;
    }
    h2 {
      text-align: center;
      margin: 0 0 8px;
      font-weight: 500;
      color: #333;
    }
    p {
      text-align: center;
      color: #666;
      font-size: 14px;
      line-height: 1.5;
      margin: 0 0 16px;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 8px;
    }
    @media (max-width: 480px) {
      .confirm-dialog {
        min-width: auto;
      }
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public modalRef: NzModalRef,
    @Inject(NZ_MODAL_DATA) public data: ConfirmDialogData
  ) {}
}
