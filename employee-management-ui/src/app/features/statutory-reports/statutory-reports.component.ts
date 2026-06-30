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
    <div class="page-header">
      <h2>Statutory Reports</h2>
    </div>

    <div *ngIf="!authService.canAccessReports()" style="text-align:center;padding:80px 0;color:#999">
      <i nz-icon nzType="lock" style="font-size:48px;color:#ccc;display:block;margin-bottom:16px"></i>
      <h3 style="color:#666">Access Denied</h3>
      <p>You do not have permission to view this page.</p>
    </div>

    <div class="report-cards" *ngIf="authService.canAccessReports()">
      <nz-card nzTitle="Individual Worker Details" class="report-card">
        <p>Show employee-wise wage summary for a given month.</p>
        <div class="report-controls">
          <nz-select [(ngModel)]="selectedYear" style="width:120px">
            <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
          </nz-select>
          <nz-select [(ngModel)]="selectedMonth" style="width:150px">
            <nz-option *ngFor="let m of months" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
          </nz-select>
          <button nz-button nzType="primary" [nzLoading]="loading1" (click)="openReport('worker-details')" *ngIf="authService.canAccessReports()">
            <i nz-icon nzType="file-text"></i> Preview
          </button>
          <button nz-button nzType="default" nzDanger [nzLoading]="excelLoading1" (click)="downloadExcel('worker-details')" *ngIf="authService.canAccessReports()">
            <i nz-icon nzType="download"></i> Excel
          </button>
        </div>
      </nz-card>

      <nz-card nzTitle="Wages Register" class="report-card">
        <p>Detailed salary breakdown with PF, ESI, PT deductions.</p>
        <div class="report-controls">
          <nz-select [(ngModel)]="selectedYear2" style="width:120px">
            <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
          </nz-select>
          <nz-select [(ngModel)]="selectedMonth2" style="width:150px">
            <nz-option *ngFor="let m of months" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
          </nz-select>
          <button nz-button nzType="primary" [nzLoading]="loading2" (click)="openReport('wages-register')" *ngIf="authService.canAccessReports()">
            <i nz-icon nzType="file-text"></i> Preview
          </button>
          <button nz-button nzType="default" nzDanger [nzLoading]="excelLoading2" (click)="downloadExcel('wages-register')" *ngIf="authService.canAccessReports()">
            <i nz-icon nzType="download"></i> Excel
          </button>
        </div>
      </nz-card>

      <nz-card nzTitle="Form XXV - Register of Leave" class="report-card">
        <p>AP Shops &amp; Establishments leave register format.</p>
        <div class="report-controls">
          <nz-select [(ngModel)]="selectedYear3" style="width:120px">
            <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
          </nz-select>
          <button nz-button nzType="primary" [nzLoading]="loading3" (click)="openReport('leave-register')" *ngIf="authService.canAccessReports()">
            <i nz-icon nzType="file-text"></i> Preview
          </button>
          <button nz-button nzType="default" nzDanger [nzLoading]="excelLoading3" (click)="downloadExcel('leave-register')" *ngIf="authService.canAccessReports()">
            <i nz-icon nzType="download"></i> Excel
          </button>
        </div>
      </nz-card>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h2 { margin: 0; font-size: 20px; font-weight: 600; }
    .report-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; }
    .report-card { min-height: 180px; }
    .report-controls { display: flex; gap: 12px; align-items: center; margin-top: 16px; }
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
