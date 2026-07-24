import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import { PayrollService } from '../../core/services/payroll.service';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-payroll-process',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, RouterLinkActive, NzTableModule, NzButtonModule, NzSelectModule,
    NzIconModule, NzTagModule, NzCardModule, NzSpinModule, NzUploadModule
  ],
  template: `
    <div class="pp-container">
      <!-- ===== SUB NAV ===== -->
      <div class="pp-sub-nav">
        <a class="pp-nav-item" routerLink="/admin/payroll/process" routerLinkActive="active">
          <i nz-icon nzType="upload"></i><span>Upload</span>
        </a>
        <a class="pp-nav-item" routerLink="/admin/payroll/payslips" routerLinkActive="active">
          <i nz-icon nzType="file-text"></i><span>Payslips</span>
        </a>
        <a class="pp-nav-item" routerLink="/admin/payroll/config" routerLinkActive="active">
          <i nz-icon nzType="mail"></i><span>Config</span>
        </a>
      </div>

      <!-- ===== CONTROLS CARD ===== -->
      <nz-card class="pp-controls-card" nzSize="small">
        <div class="pp-controls">
          <div class="pp-filters">
            <nz-select [(ngModel)]="selectedYear" nzPlaceHolder="Year" class="filter-select" style="width:110px">
              <nz-option *ngFor="let y of yearList" [nzValue]="y" [nzLabel]="y.toString()"></nz-option>
            </nz-select>
            <nz-select [(ngModel)]="selectedMonth" nzPlaceHolder="Month" class="filter-select" style="width:140px">
              <nz-option *ngFor="let m of monthList" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
            </nz-select>
          </div>
          <div class="pp-actions">
            <input #fileInput type="file" accept=".xlsx,.xls" (change)="onFileSelected($event)" style="display:none">
            <button nz-button class="btn-primary-gradient" (click)="fileInput.click()" [disabled]="uploading">
              <i nz-icon nzType="upload"></i>
              {{ uploading ? 'Uploading...' : 'Upload Excel' }}
            </button>
            <button nz-button nzType="default" (click)="downloadSample()" nz-tooltip="Download a blank sample template">
              <i nz-icon nzType="download"></i> Sample
            </button>
            <button nz-button nzType="default" (click)="downloadStatement()" nz-tooltip="Download Salary Statement">
              <i nz-icon nzType="file-excel"></i> Statement
            </button>
          </div>
        </div>
      </nz-card>

      <!-- ===== UPLOAD RESULT ===== -->
      <nz-card class="pp-status-card" nzSize="small" *ngIf="uploadResult">
        <div class="result-header">
          <span class="result-title">Upload Result</span>
          <nz-tag [nzColor]="uploadResult.failureCount === 0 ? '#52c41a' : '#fa8c16'">
            {{ uploadResult.failureCount === 0 ? 'ALL OK' : 'PARTIAL' }}
          </nz-tag>
        </div>
        <div class="result-grid">
          <div class="result-item">
            <span class="stat-label">Total Rows</span>
            <span class="stat-value">{{ uploadResult.totalRows }}</span>
          </div>
          <div class="result-item">
            <span class="stat-label">Success</span>
            <span class="stat-value stat-success">{{ uploadResult.successCount }}</span>
          </div>
          <div class="result-item">
            <span class="stat-label">Failed</span>
            <span class="stat-value" [class.stat-error]="uploadResult.failureCount > 0">{{ uploadResult.failureCount }}</span>
          </div>
        </div>

        <!-- Errors table -->
        <nz-table *ngIf="uploadResult.errors && uploadResult.errors.length > 0"
          [nzData]="uploadResult.errors" [nzPageSize]="50" nzSize="small" nzBordered class="theme-table"
          style="margin-top:12px">
          <thead>
            <tr>
              <th>Row</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of uploadResult.errors">
              <td class="td-center">{{ e.row }}</td>
              <td class="td-error">{{ e.message }}</td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>
  `,
  styles: [`
    .pp-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 12px 16px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }
    .pp-sub-nav {
      display: flex;
      gap: 2px;
      margin-bottom: 12px;
      background: #f0f4ff;
      border-radius: 10px;
      padding: 4px;
      border: 1px solid #e0e7ff;
    }
    .pp-nav-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      color: #6c757d;
      text-decoration: none;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .pp-nav-item i { font-size: 16px; width: 16px; display: inline-flex; align-items: center; justify-content: center; }
    .pp-nav-item:hover { background: rgba(31,61,110,0.06); color: #1f3d6e; }
    .pp-nav-item.active {
      background: #ffffff;
      color: #1f3d6e;
      box-shadow: 0 2px 8px rgba(31,61,110,0.1);
    }
    .pp-nav-item.active i { color: #1f3d6e; }
    .pp-controls-card, .pp-status-card {
      border-radius: 10px !important;
      border: 1px solid #e8eaed !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
      margin-bottom: 14px;
      width: 100% !important;
    }
    :host ::ng-deep .pp-controls-card .ant-card-body {
      padding: 14px 16px !important;
    }
    :host ::ng-deep .pp-status-card .ant-card-body {
      padding: 14px 16px !important;
    }
    .pp-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    .pp-filters {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .pp-actions {
      display: flex;
      gap: 8px;
    }
    .filter-select {
      width: 170px;
    }
    :host ::ng-deep .filter-select .ant-select-selector {
      border-radius: 8px !important;
      border: 1px solid #e2e5ea !important;
      height: 34px !important;
      padding: 0 8px !important;
      box-shadow: none !important;
      transition: all 0.2s ease !important;
    }
    :host ::ng-deep .filter-select .ant-select-selector:hover {
      border-color: #1f3d6e !important;
    }
    :host ::ng-deep .filter-select.ant-select-focused .ant-select-selector {
      border-color: #1f3d6e !important;
      box-shadow: 0 0 0 2px rgba(31,61,110,0.1) !important;
    }
    :host ::ng-deep .filter-select .ant-select-selection-item {
      font-size: 13px !important;
      line-height: 32px !important;
    }
    .btn-primary-gradient {
      height: 34px !important;
      padding: 0 20px !important;
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
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .result-title {
      font-size: 14px;
      font-weight: 700;
      color: #1f3d6e;
    }
    .result-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
    }
    .result-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 8px 12px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e8eaed;
    }
    .stat-label {
      font-size: 10px;
      font-weight: 600;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .stat-value {
      font-size: 14px;
      font-weight: 700;
      color: #374151;
    }
    .stat-success {
      color: #059669;
    }
    .stat-error {
      color: #ef4444 !important;
    }
    .td-center {
      text-align: center !important;
    }
    .td-error {
      color: #ef4444 !important;
      font-size: 12px;
    }
    :host ::ng-deep .theme-table .ant-table {
      font-size: 13px;
      border-radius: 0 !important;
    }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th {
      background: #f8f9fc !important;
      color: #1f3d6e !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
      padding: 10px 10px !important;
      border-bottom: 2px solid #1f3d6e !important;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr > td {
      padding: 8px 10px !important;
      border-bottom: 1px solid #f0f2f5 !important;
      font-size: 12px;
      color: #374151;
    }
    :host ::ng-deep .ant-select-dropdown {
      border-radius: 8px !important;
      box-shadow: 0 6px 24px rgba(0,0,0,0.12) !important;
      border: 1px solid #e8eaed !important;
      padding: 4px !important;
    }
    :host ::ng-deep .ant-select-item-option {
      border-radius: 6px !important;
      padding: 6px 12px !important;
      font-size: 13px !important;
    }
    :host ::ng-deep .ant-select-item-option-active {
      background: rgba(31,61,110,0.06) !important;
    }
    :host ::ng-deep .ant-select-item-option-selected {
      background: rgba(31,61,110,0.1) !important;
      color: #1f3d6e !important;
      font-weight: 600 !important;
    }
  `]
})
export class PayrollProcessComponent implements OnInit {
  selectedYear: number;
  selectedMonth: number;
  uploading = false;
  uploadResult: any = null;

  yearList: number[] = [];
  monthList = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  constructor(
    private payrollService: PayrollService,
    private msg: NzMessageService
  ) {
    const now = new Date();
    this.selectedYear = now.getFullYear();
    this.selectedMonth = now.getMonth() + 1;
  }

  ngOnInit(): void {
    const now = new Date();
    for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) {
      this.yearList.push(y);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      this.msg.error('Please select an Excel file (.xlsx or .xls)');
      return;
    }

    this.uploading = true;
    this.uploadResult = null;

    this.payrollService.uploadSalaryStatement(file, this.selectedYear, this.selectedMonth).subscribe({
      next: (res) => {
        this.uploading = false;
        if (res.success && res.data) {
          this.uploadResult = res.data;
          const total = res.data.totalRows || 0;
          const success = res.data.successCount || 0;
          const failed = res.data.failureCount || 0;
          if (failed === 0) {
            this.msg.success(`Uploaded ${success} of ${total} records successfully`);
          } else {
            this.msg.warning(`Uploaded ${success}/${total} records with ${failed} errors`);
          }
        }
      },
      error: (err) => {
        this.uploading = false;
        this.msg.error(err.error?.message || 'Failed to upload salary statement');
      }
    });

    input.value = '';
  }

  downloadStatement(): void {
    this.payrollService.downloadSalaryStatement(this.selectedYear, this.selectedMonth).subscribe({
      next: (blob) => saveAs(blob, `Salary_Statement_${this.selectedYear}_${this.selectedMonth}.xlsx`),
      error: () => this.msg.error('No data found for the selected period')
    });
  }

  downloadSample(): void {
    this.payrollService.downloadSampleStatement().subscribe({
      next: (blob) => saveAs(blob, 'Salary_Statement_Sample.xlsx'),
      error: () => this.msg.error('Failed to download sample')
    });
  }
}
