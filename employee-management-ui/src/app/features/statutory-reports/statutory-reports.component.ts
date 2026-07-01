import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { StatutoryReportService } from '../../core/services/statutory-report.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-statutory-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzCardModule, NzButtonModule, NzSelectModule,
    NzIconModule, NzSpinModule
  ],
  template: `
    <div class="sr-container page-enter">
      <!-- Gradient Header -->
      <div class="sr-header">
        <div class="sr-title">
          <div class="sr-brand">
            <div class="sr-icon"><i nz-icon nzType="file-text"></i></div>
            <span class="sr-logo">STATUTORY REPORTS</span>
          </div>
        </div>
      </div>

      <!-- Access Denied -->
      <div *ngIf="!authService.canAccessReports()" class="sr-denied">
        <i nz-icon nzType="lock" class="denied-icon"></i>
        <h3 class="denied-title">Access Denied</h3>
        <p class="denied-msg">You do not have permission to view this page.</p>
      </div>

      <!-- Report Cards -->
      <div class="sr-grid" *ngIf="authService.canAccessReports()">

        <!-- Card 1 -->
        <div class="sr-card">
          <div class="sr-card-header">
            <i nz-icon nzType="user" class="sr-card-icon"></i>
            <span class="sr-card-title">Individual Worker Details</span>
          </div>
          <p class="sr-card-desc">Show employee-wise wage summary for a given month.</p>
          <div class="sr-controls">
            <nz-select [(ngModel)]="selectedYear" class="sr-select" nzPlaceHolder="Year">
              <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
            </nz-select>
            <nz-select [(ngModel)]="selectedMonth" class="sr-select" nzPlaceHolder="Month">
              <nz-option *ngFor="let m of months" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
            </nz-select>
            <button nz-button class="sr-btn-primary" [nzLoading]="loading1" (click)="openReport('worker-details')">
              <i nz-icon nzType="file-text"></i> Preview
            </button>
            <button nz-button class="sr-btn-excel" [nzLoading]="excelLoading1" (click)="downloadExcel('worker-details')">
              <i nz-icon nzType="download"></i> Excel
            </button>
          </div>
        </div>

        <!-- Card 2 -->
        <div class="sr-card">
          <div class="sr-card-header">
            <i nz-icon nzType="dollar" class="sr-card-icon"></i>
            <span class="sr-card-title">Wages Register</span>
          </div>
          <p class="sr-card-desc">Detailed salary breakdown with PF, ESI, PT deductions.</p>
          <div class="sr-controls">
            <nz-select [(ngModel)]="selectedYear2" class="sr-select" nzPlaceHolder="Year">
              <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
            </nz-select>
            <nz-select [(ngModel)]="selectedMonth2" class="sr-select" nzPlaceHolder="Month">
              <nz-option *ngFor="let m of months" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
            </nz-select>
            <button nz-button class="sr-btn-primary" [nzLoading]="loading2" (click)="openReport('wages-register')">
              <i nz-icon nzType="file-text"></i> Preview
            </button>
            <button nz-button class="sr-btn-excel" [nzLoading]="excelLoading2" (click)="downloadExcel('wages-register')">
              <i nz-icon nzType="download"></i> Excel
            </button>
          </div>
        </div>

        <!-- Card 3 -->
        <div class="sr-card">
          <div class="sr-card-header">
            <i nz-icon nzType="calendar" class="sr-card-icon"></i>
            <span class="sr-card-title">Form XXV - Register of Leave</span>
          </div>
          <p class="sr-card-desc">AP Shops &amp; Establishments leave register format.</p>
          <div class="sr-controls">
            <nz-select [(ngModel)]="selectedYear3" class="sr-select" nzPlaceHolder="Year">
              <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
            </nz-select>
            <button nz-button class="sr-btn-primary" [nzLoading]="loading3" (click)="openReport('leave-register')">
              <i nz-icon nzType="file-text"></i> Preview
            </button>
            <button nz-button class="sr-btn-excel" [nzLoading]="excelLoading3" (click)="downloadExcel('leave-register')">
              <i nz-icon nzType="download"></i> Excel
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ─── Page Enter Animation ─── */
    .page-enter { animation: pageFadeIn .35s ease-out; }
    @keyframes pageFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* ─── Scrollbar ─── */
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: #f1f3f6; border-radius: 4px; }
    ::-webkit-scrollbar-thumb { background: #c1c7d0; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #a0a8b4; }

    /* ─── Container ─── */
    .sr-container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; width: 100%; max-width: 100%; padding: 0; }

    /* ─── Gradient Header (matching Attendance UI) ─── */
    .sr-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: linear-gradient(135deg, #1f3d6e 0%, #16213e 100%); border-radius: 0; box-shadow: 0 2px 8px rgba(0,0,0,.12); margin: 0; }
    .sr-title { display: flex; align-items: center; gap: 12px; }
    .sr-brand { display: flex; align-items: center; gap: 10px; }
    .sr-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.15); border-radius: 8px; color: #fff; font-size: 16px; }
    .sr-logo { font-size: 17px; font-weight: 800; color: #fff; letter-spacing: 1.5px; }

    /* ─── Access Denied ─── */
    .sr-denied { text-align: center; padding: 60px 16px; }
    .denied-icon { font-size: 48px; color: #d0d5dd; display: block; margin-bottom: 12px; }
    .denied-title { color: #666; font-size: 18px; font-weight: 600; margin: 0 0 6px; }
    .denied-msg { color: #999; font-size: 14px; margin: 0; }

    /* ─── Cards Grid ─── */
    .sr-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 12px; padding: 12px 16px; }

    /* ─── Report Card ─── */
    .sr-card { background: #fff; border: 1px solid #e8eaed; border-radius: 10px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,.06); transition: box-shadow .2s, transform .2s; display: flex; flex-direction: column; }
    .sr-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); transform: translateY(-1px); }

    /* ─── Card Header ─── */
    .sr-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .sr-card-icon { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1f3d6e, #2a4a8a); border-radius: 6px; color: #fff; font-size: 14px; flex-shrink: 0; }
    .sr-card-title { font-size: 15px; font-weight: 700; color: #1f3d6e; letter-spacing: .2px; }

    /* ─── Card Description ─── */
    .sr-card-desc { font-size: 13px; color: #777; margin: 0 0 14px; line-height: 1.5; flex: 1; }

    /* ─── Controls Row ─── */
    .sr-controls { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: auto; }

    /* ─── Select Dropdowns ─── */
    .sr-select { width: 110px; }
    .sr-select ::ng-deep .ant-select-selector { height: 32px !important; border-radius: 6px !important; border: 1px solid #d0d5dd !important; box-shadow: none !important; padding: 0 8px !important; transition: all .2s; background: #fff !important; }
    .sr-select ::ng-deep .ant-select-selection-item { line-height: 30px !important; font-size: 12px; font-weight: 500; color: #333; }
    .sr-select ::ng-deep .ant-select-arrow { color: #a0a8b4; }
    .sr-select ::ng-deep .ant-select-selector:hover { border-color: #4361ee !important; }
    .sr-select ::ng-deep .ant-select-focused .ant-select-selector { border-color: #4361ee !important; box-shadow: 0 0 0 2px rgba(67,97,238,.12) !important; }

    /* ─── Primary Button (Preview) with Gradient ─── */
    .sr-btn-primary { height: 32px; padding: 0 14px; font-size: 12px; font-weight: 600; border: none; border-radius: 6px; background: linear-gradient(135deg, #4361ee, #3a0ca3); color: #fff; box-shadow: 0 2px 6px rgba(67, 97, 238, .35); transition: all .2s; letter-spacing: .3px; display: inline-flex; align-items: center; gap: 5px; }
    .sr-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(67, 97, 238, .45); opacity: .95; color: #fff; }
    .sr-btn-primary:active:not(:disabled) { transform: translateY(0); }
    .sr-btn-primary:disabled { opacity: .6; cursor: not-allowed; box-shadow: none; }

    /* ─── Excel Button ─── */
    .sr-btn-excel { height: 32px; padding: 0 14px; font-size: 12px; font-weight: 600; border: 1px solid #d0d5dd; border-radius: 6px; background: #fff; color: #555; transition: all .2s; display: inline-flex; align-items: center; gap: 5px; }
    .sr-btn-excel:hover:not(:disabled) { border-color: #2e7d32; color: #2e7d32; background: #f1f9f1; }
    .sr-btn-excel:disabled { opacity: .6; cursor: not-allowed; }
  `]
})
export class StatutoryReportsComponent implements OnInit {
  years: number[] = [];
  months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;
  selectedYear2 = new Date().getFullYear();
  selectedMonth2 = new Date().getMonth() + 1;
  selectedYear3 = new Date().getFullYear();

  loading1 = false;
  loading2 = false;
  loading3 = false;
  excelLoading1 = false;
  excelLoading2 = false;
  excelLoading3 = false;

  constructor(
    private reportService: StatutoryReportService,
    public authService: AuthService,
    private msg: NzMessageService
  ) {}

  ngOnInit(): void {
    this.years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  }

  openReport(type: string): void {
    let loader: string;
    if (type === 'worker-details') { this.loading1 = true; loader = '1'; }
    else if (type === 'wages-register') { this.loading2 = true; loader = '2'; }
    else { this.loading3 = true; loader = '3'; }

    const onComplete = () => {
      if (loader === '1') this.loading1 = false;
      else if (loader === '2') this.loading2 = false;
      else this.loading3 = false;
    };

    let obs: any;
    if (type === 'worker-details') {
      obs = this.reportService.getIndividualWorkerDetails(this.selectedYear, this.selectedMonth);
    } else if (type === 'wages-register') {
      obs = this.reportService.getWagesRegister(this.selectedYear2, this.selectedMonth2);
    } else {
      obs = this.reportService.getLeaveRegister(this.selectedYear3);
    }

    obs.subscribe({
      next: (res: any) => {
        if (!res.data) {
          this.msg.warning('No data available for this period');
          onComplete();
          return;
        }
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(res.data);
          win.document.close();
        } else {
          this.msg.error('Popup blocked. Please allow popups for this site.');
        }
        onComplete();
      },
      error: (err: any) => {
        this.msg.error('Failed to load report');
        onComplete();
      }
    });
  }

  downloadExcel(type: string): void {
    let loader: string;
    if (type === 'worker-details') { this.excelLoading1 = true; loader = '1'; }
    else if (type === 'wages-register') { this.excelLoading2 = true; loader = '2'; }
    else { this.excelLoading3 = true; loader = '3'; }

    const onComplete = () => {
      if (loader === '1') this.excelLoading1 = false;
      else if (loader === '2') this.excelLoading2 = false;
      else this.excelLoading3 = false;
    };

    let obs;
    let filename: string;
    if (type === 'worker-details') {
      obs = this.reportService.downloadIndividualWorkerDetailsExcel(this.selectedYear, this.selectedMonth);
      filename = `Individual_Worker_Details_${this.selectedYear}_${this.selectedMonth}.xlsx`;
    } else if (type === 'wages-register') {
      obs = this.reportService.downloadWagesRegisterExcel(this.selectedYear2, this.selectedMonth2);
      filename = `Wages_Register_${this.selectedYear2}_${this.selectedMonth2}.xlsx`;
    } else {
      obs = this.reportService.downloadLeaveRegisterExcel(this.selectedYear3);
      filename = `Leave_Register_${this.selectedYear3}.xlsx`;
    }

    obs.subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.msg.success('Excel downloaded');
        onComplete();
      },
      error: () => {
        this.msg.error('Failed to download Excel');
        onComplete();
      }
    });
  }
}
