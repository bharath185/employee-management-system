import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzMessageService } from 'ng-zorro-antd/message';
import { PayrollService } from '../../core/services/payroll.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmailConfig } from '../../core/models/payroll.models';

@Component({
  selector: 'app-email-config',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzButtonModule, NzIconModule, NzInputModule,
    NzInputNumberModule, NzCardModule, NzSpinModule, NzSwitchModule, NzDividerModule,
    RouterLink, RouterLinkActive,
    PageHeaderComponent
  ],
  template: `
    <div class="ec-container">
      <div class="pp-sub-nav">
        <a class="pp-nav-item" routerLink="/admin/payroll/process" routerLinkActive="active">
          <i nz-icon nzType="play-circle"></i><span>Process</span>
        </a>
        <a class="pp-nav-item" routerLink="/admin/payroll/salary-master" routerLinkActive="active">
          <i nz-icon nzType="bank"></i><span>Salary Master</span>
        </a>
        <a class="pp-nav-item" routerLink="/admin/payroll/input" routerLinkActive="active">
          <i nz-icon nzType="edit"></i><span>Employee Input</span>
        </a>
        <a class="pp-nav-item" routerLink="/admin/payroll/payslips" routerLinkActive="active">
          <i nz-icon nzType="file-text"></i><span>Payslips</span>
        </a>
        <a class="pp-nav-item" routerLink="/admin/payroll/config" routerLinkActive="active">
          <i nz-icon nzType="mail"></i><span>Config</span>
        </a>
      </div>
      <app-page-header icon="mail" title="Mail Configuration" subtitle="Configure SMTP settings for payroll email delivery"></app-page-header>

      <!-- ===== CONFIG FORM CARD ===== -->
      <nz-card class="ec-form-card" nzSize="small">
        <div class="ec-loading" *ngIf="loading">
          <nz-spin nzSimple></nz-spin>
        </div>

        <div class="ec-form" *ngIf="!loading">
          <div class="form-section-title">SMTP Server Settings</div>
          <div class="form-grid">
            <div class="form-row">
              <label>Host <span class="required">*</span></label>
              <input nz-input [(ngModel)]="config.host" placeholder="smtp.example.com" class="theme-input" />
            </div>
            <div class="form-row">
              <label>Port <span class="required">*</span></label>
              <nz-input-number [(ngModel)]="config.port" [nzMin]="1" [nzMax]="65535" class="theme-input-number" style="width:100%"></nz-input-number>
            </div>
            <div class="form-row">
              <label>Username <span class="required">*</span></label>
              <input nz-input [(ngModel)]="config.username" placeholder="your@email.com" class="theme-input" />
            </div>
            <div class="form-row">
              <label>Password <span class="required">*</span></label>
              <input nz-input type="password" [(ngModel)]="config.password" placeholder="Enter password" class="theme-input" />
            </div>
            <div class="form-row">
              <label>From Address <span class="required">*</span></label>
              <input nz-input [(ngModel)]="config.fromAddress" placeholder="noreply@example.com" class="theme-input" />
            </div>
          </div>

          <nz-divider class="form-divider"></nz-divider>

          <div class="form-section-title">Security Settings</div>
          <div class="form-grid form-grid-2">
            <div class="form-row switch-row">
              <label>Use TLS</label>
              <nz-switch [(ngModel)]="config.useTls"></nz-switch>
            </div>
            <div class="form-row switch-row">
              <label>Use SSL</label>
              <nz-switch [(ngModel)]="config.useSsl"></nz-switch>
            </div>
            <div class="form-row switch-row">
              <label>Active</label>
              <nz-switch [(ngModel)]="config.isActive"></nz-switch>
            </div>
          </div>

          <nz-divider class="form-divider"></nz-divider>

          <div class="form-actions">
            <button nz-button class="btn-outline" (click)="testConnection()" [nzLoading]="testing">
              <i nz-icon nzType="check-circle"></i> Test Connection
            </button>
            <button nz-button class="btn-primary-gradient" (click)="saveConfig()" [nzLoading]="saving">
              <i nz-icon nzType="save"></i> Save Configuration
            </button>
          </div>
        </div>
      </nz-card>
    </div>
  `,
  styles: [`
    .pp-sub-nav {
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
      background: rgba(255,255,255,0.7);
      backdrop-filter: blur(8px);
      border-radius: 12px;
      padding: 4px;
      border: 1px solid rgba(232,234,237,0.6);
    }
    .pp-nav-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: #6c757d;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .pp-nav-item i { font-size: 18px; width: 18px; display: inline-flex; align-items: center; justify-content: center; }
    .pp-nav-item:hover { background: rgba(37,99,235,0.06); color: #2563eb; }
    .pp-nav-item.active {
      background: #2563eb;
      color: #fff;
      box-shadow: 0 2px 8px rgba(37,99,235,0.25);
    }
    .pp-nav-item.active i { color: #fff; }
    .ec-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 12px 16px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }
    .ec-form-card {
      border-radius: 10px !important;
      border: 1px solid #e8eaed !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
      width: 100% !important;
      max-width: 720px;
      margin: 0 auto;
    }
    :host ::ng-deep .ec-form-card .ant-card-body {
      padding: 24px 28px !important;
    }
    .ec-loading {
      display: flex;
      justify-content: center;
      padding: 40px 0;
    }
    .form-section-title {
      font-size: 14px;
      font-weight: 700;
      color: #1f3d6e;
      margin-bottom: 16px;
      letter-spacing: 0.3px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px 24px;
    }
    .form-grid-2 {
      grid-template-columns: 1fr 1fr 1fr;
    }
    .form-row {
      margin-bottom: 2px;
    }
    .form-row label {
      display: block;
      font-weight: 600;
      margin-bottom: 5px;
      font-size: 12px;
      color: #374151;
      letter-spacing: 0.2px;
    }
    .switch-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e8eaed;
    }
    .switch-row label {
      margin-bottom: 0;
    }
    .required {
      color: #ef4444;
    }
    .theme-input {
      width: 100% !important;
      border-radius: 8px !important;
      border: 1px solid #e2e5ea !important;
      padding: 4px 11px !important;
      height: 36px !important;
      font-size: 13px !important;
      transition: all 0.2s ease !important;
      box-shadow: none !important;
    }
    .theme-input:hover {
      border-color: #1f3d6e !important;
    }
    .theme-input:focus {
      border-color: #1f3d6e !important;
      box-shadow: 0 0 0 2px rgba(31,61,110,0.1) !important;
    }
    .theme-input-number {
      border-radius: 8px !important;
    }
    :host ::ng-deep .theme-input-number .ant-input-number {
      border-radius: 8px !important;
      border: 1px solid #e2e5ea !important;
      width: 100% !important;
      transition: all 0.2s ease !important;
    }
    :host ::ng-deep .theme-input-number .ant-input-number:hover {
      border-color: #1f3d6e !important;
    }
    :host ::ng-deep .theme-input-number .ant-input-number-focused {
      border-color: #1f3d6e !important;
      box-shadow: 0 0 0 2px rgba(31,61,110,0.1) !important;
    }
    :host ::ng-deep .theme-input-number .ant-input-number-input {
      height: 34px !important;
      font-size: 13px !important;
    }
    :host ::ng-deep .theme-input-number .ant-input-number-handler-wrap {
      border-radius: 0 8px 8px 0 !important;
    }
    .form-divider {
      margin: 20px 0 !important;
    }
    :host ::ng-deep .form-divider .ant-divider-inner-text {
      display: none;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 4px;
    }
    .btn-primary-gradient {
      height: 36px !important;
      padding: 0 24px !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      border: none !important;
      border-radius: 8px !important;
      background: linear-gradient(135deg, #4361ee, #3a0ca3) !important;
      color: #fff !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      transition: all 0.2s ease !important;
      letter-spacing: 0.3px !important;
      box-shadow: 0 2px 8px rgba(67,97,238,0.3) !important;
    }
    .btn-primary-gradient:hover {
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 14px rgba(67,97,238,0.4) !important;
    }
    .btn-primary-gradient:active {
      transform: translateY(0) !important;
    }
    .btn-outline {
      height: 36px !important;
      padding: 0 20px !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      border-radius: 8px !important;
      border: 1px solid #e2e5ea !important;
      background: #fff !important;
      color: #6c757d !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      transition: all 0.2s ease !important;
    }
    .btn-outline:hover {
      border-color: #1f3d6e !important;
      color: #1f3d6e !important;
    }
    @media (max-width: 640px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
      .form-grid-2 {
        grid-template-columns: 1fr;
      }
      .form-actions {
        flex-direction: column;
      }
      .form-actions button {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class EmailConfigComponent implements OnInit {
  loading = false;
  saving = false;
  testing = false;
  config: EmailConfig = {
    host: '',
    port: 587,
    username: '',
    password: '',
    fromAddress: '',
    useTls: true,
    useSsl: false,
    isActive: true
  };

  constructor(
    private payrollService: PayrollService,
    private msg: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.loading = true;
    this.payrollService.getEmailConfig().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.config = { ...this.config, ...res.data };
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  saveConfig(): void {
    if (!this.config.host || !this.config.username || !this.config.password || !this.config.fromAddress) {
      this.msg.warning('Please fill all required fields');
      return;
    }
    this.saving = true;
    this.payrollService.saveEmailConfig(this.config).subscribe({
      next: (res) => {
        if (res.success) {
          this.msg.success('Email configuration saved');
          this.config = { ...this.config, ...res.data };
        }
        this.saving = false;
      },
      error: (err) => {
        this.msg.error(err.error?.message || 'Failed to save configuration');
        this.saving = false;
      }
    });
  }

  testConnection(): void {
    this.testing = true;
    this.payrollService.testEmailConfig().subscribe({
      next: (res) => {
        if (res.success) {
          this.msg.success('Test email sent successfully');
        } else {
          this.msg.warning(res.message || 'Test completed with warnings');
        }
        this.testing = false;
      },
      error: (err) => {
        this.msg.error(err.error?.message || 'Connection test failed');
        this.testing = false;
      }
    });
  }
}
