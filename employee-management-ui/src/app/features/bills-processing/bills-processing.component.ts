import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { BillService } from '../../core/services/bill.service';
import { Bill } from '../../core/models/bill.model';

@Component({
  selector: 'app-bills-processing',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzButtonModule, NzIconModule, NzSelectModule,
    NzDatePickerModule, NzInputModule, NzInputNumberModule,
    NzModalModule, NzTagModule, NzPopconfirmModule, NzSpinModule,
    NzToolTipModule, NzCardModule,
    NzUploadModule
  ],
  template: `
    <div class="bp-container">
      <div class="bp-sub-nav">
        <span class="bp-nav-title"><i nz-icon nzType="audit"></i> Vendor Bills</span>
        <div class="bp-nav-actions">
          <button nz-button class="btn-primary-gradient" (click)="showUploadModal()">
            <i nz-icon nzType="upload"></i> Upload Bill
          </button>
        </div>
      </div>

      <!-- Controls -->
      <nz-card class="bp-controls-card" nzSize="small">
        <div class="bp-controls">
          <div class="bp-filters">
            <nz-select [(ngModel)]="selectedMonth" (ngModelChange)="loadBills()" nzPlaceHolder="Month" class="filter-select" style="width:120px">
              <nz-option *ngFor="let m of months" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
            </nz-select>
            <nz-select [(ngModel)]="selectedYear" (ngModelChange)="loadBills()" nzPlaceHolder="Year" class="filter-select" style="width:100px">
              <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y.toString()"></nz-option>
            </nz-select>
          </div>
          <div class="bp-stats" *ngIf="bills.length > 0">
            <span class="bp-stat-item">Total: <strong>{{ bills.length }}</strong></span>
            <span class="bp-stat-divider"></span>
            <span class="bp-stat-item">Amount: <strong class="gross-amount">{{ totalAmount | number:'1.0-0' }}</strong></span>
          </div>
        </div>
      </nz-card>

      <!-- Table -->
      <nz-card class="bp-table-card" nzSize="small">
        <nz-table #billTable
          [nzData]="bills"
          [nzLoading]="loading"
          [nzPageSize]="20"
          [nzPageSizeOptions]="[10, 20, 50]"
          [nzShowSizeChanger]="true"
          nzBordered nzSize="small"
          nzShowPagination
          nzFrontPagination
          class="theme-table">
          <thead>
            <tr>
              <th class="th-sno">#</th>
              <th class="th-vendor">Vendor</th>
              <th class="th-type">Type</th>
              <th class="th-num">Amount</th>
              <th class="th-date">Bill Date</th>
              <th class="th-date">Due Date</th>
              <th class="th-status">Status</th>
              <th class="th-doc">Doc</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let bill of billTable.data; let i = index">
              <td class="td-center">{{ i + 1 }}</td>
              <td class="td-vendor">{{ bill.vendorName }}</td>
              <td class="td-center"><nz-tag class="status-tag">{{ bill.billType }}</nz-tag></td>
              <td class="td-right"><span class="gross-amount">{{ bill.amount | number:'1.0-0' }}</span></td>
              <td class="td-center">{{ bill.billDate | date:'dd/MM/yy' }}</td>
              <td class="td-center">{{ bill.dueDate ? (bill.dueDate | date:'dd/MM/yy') : '-' }}</td>
              <td class="td-center">
                <nz-tag [nzColor]="bill.isProcessed ? 'green' : 'orange'" class="status-tag">
                  {{ bill.isProcessed ? 'Processed' : 'Pending' }}
                </nz-tag>
              </td>
              <td class="td-center">
                <ng-container *ngIf="bill.fileName; else noFile">
                  <button nz-button nzSize="small" nzType="link" class="action-btn action-view" (click)="previewFile(bill)">
                    <i nz-icon nzType="eye"></i>
                  </button>
                </ng-container>
                <ng-template #noFile><span class="text-muted">-</span></ng-template>
              </td>
              <td class="td-actions">
                <button nz-button nzType="link" nzSize="small" class="action-btn action-view"
                  [nzTooltipTitle]="bill.isProcessed ? 'Mark Pending' : 'Mark Processed'"
                  nz-tooltip (click)="toggleStatus(bill)">
                  <i nz-icon [nzType]="bill.isProcessed ? 'close-circle' : 'check-circle'"></i>
                </button>
                <button nz-button nzType="link" nzSize="small" class="action-btn action-mail" nz-tooltip="Edit" (click)="editBill(bill)">
                  <i nz-icon nzType="edit"></i>
                </button>
                <button nz-button nzType="link" nzSize="small" class="action-btn action-download" nz-tooltip="Download"
                  *ngIf="bill.fileName" (click)="downloadFile(bill)">
                  <i nz-icon nzType="download"></i>
                </button>
                <button nz-button nzType="link" nzSize="small" class="action-btn action-delete" nz-tooltip="Delete"
                  nz-popconfirm nzPopconfirmTitle="Delete this bill?" (nzOnConfirm)="deleteBill(bill)">
                  <i nz-icon nzType="delete"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="bills.length === 0 && !loading">
              <td colspan="9" class="empty-cell">No bills found for the selected period</td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>
    </div>

    <!-- Upload / Edit Modal -->
    <nz-modal [(nzVisible)]="isModalVisible" [nzTitle]="isEditing ? 'Edit Bill' : 'Upload Bill'"
              (nzOnCancel)="closeModal()" [nzOkLoading]="submitting" [nzWidth]="560">
      <ng-container *nzModalContent>
        <div class="modal-form">
          <div class="form-row">
            <div class="form-group">
              <label>Vendor Name <span class="required">*</span></label>
              <input nz-input [(ngModel)]="formData.vendorName" placeholder="Enter vendor name" />
            </div>
            <div class="form-group">
              <label>Bill Type <span class="required">*</span></label>
              <nz-select [(ngModel)]="formData.billType" style="width:100%">
                <nz-option nzValue="VOUCHER" nzLabel="Voucher"></nz-option>
                <nz-option nzValue="UTILITY" nzLabel="Utility"></nz-option>
                <nz-option nzValue="ELECTRICITY" nzLabel="Electricity"></nz-option>
                <nz-option nzValue="WATER" nzLabel="Water"></nz-option>
                <nz-option nzValue="INTERNET" nzLabel="Internet"></nz-option>
                <nz-option nzValue="TELEPHONE" nzLabel="Telephone"></nz-option>
                <nz-option nzValue="RENT" nzLabel="Rent"></nz-option>
                <nz-option nzValue="VENDOR_PAYMENT" nzLabel="Vendor Payment"></nz-option>
                <nz-option nzValue="OTHER" nzLabel="Other"></nz-option>
              </nz-select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Amount <span class="required">*</span></label>
              <nz-input-number [(ngModel)]="formData.amount" [nzMin]="0" [nzStep]="0.01"
                               [nzFormatter]="amountFormatter" [nzParser]="amountParser"
                               style="width:100%"></nz-input-number>
            </div>
            <div class="form-group">
              <label>Bill Date</label>
              <nz-date-picker [(ngModel)]="formData.billDate" style="width:100%"></nz-date-picker>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Due Date</label>
              <nz-date-picker [(ngModel)]="formData.dueDate" style="width:100%"></nz-date-picker>
            </div>
            <div class="form-group">
              <label>Status</label>
              <nz-select [(ngModel)]="formData.status" style="width:100%" *ngIf="isEditing">
                <nz-option nzValue="PENDING" nzLabel="Pending"></nz-option>
                <nz-option nzValue="PROCESSED" nzLabel="Processed"></nz-option>
              </nz-select>
            </div>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea nz-input [(ngModel)]="formData.description" rows="2" placeholder="Optional notes"></textarea>
          </div>
          <div class="form-group">
            <label>Attachment</label>
            <nz-upload [nzBeforeUpload]="beforeUpload" [nzFileList]="fileList"
                       [nzShowUploadList]="true" [nzLimit]="1" nzAccept="image/*,application/pdf">
              <button nz-button><i nz-icon nzType="file-add"></i> Select File</button>
            </nz-upload>
            <span class="hint">Supported: PDF, JPG, PNG (max 10MB)</span>
          </div>
        </div>
      </ng-container>
      <ng-container *nzModalFooter>
        <button nz-button (click)="closeModal()">Cancel</button>
        <button nz-button nzType="primary" [nzLoading]="submitting" (click)="submitBill()">
          {{ isEditing ? 'Update' : 'Upload' }}
        </button>
      </ng-container>
    </nz-modal>

    <!-- Preview Modal -->
    <nz-modal [(nzVisible)]="isPreviewVisible" [nzTitle]="previewBill?.fileName || 'Document Preview'"
              (nzOnCancel)="closePreview()" [nzFooter]="null" [nzWidth]="800">
      <ng-container *nzModalContent>
        <div class="preview-container" *ngIf="previewBill">
          <img *ngIf="isImageFile(previewBill)" [src]="getFileUrl(previewBill.id)" style="max-width:100%;max-height:70vh;display:block;margin:0 auto;" />
          <iframe *ngIf="isPdfFile(previewBill)" [src]="pdfSafeUrl" style="width:100%;height:70vh;border:none;"></iframe>
          <div *ngIf="!isImageFile(previewBill) && !isPdfFile(previewBill)" class="preview-unsupported">
            <i nz-icon nzType="file" style="font-size:48px;color:#d9d9d9"></i>
            <p>Preview not available for this file type.</p>
            <button nz-button nzType="primary" (click)="downloadFile(previewBill)">
              <i nz-icon nzType="download"></i> Download File
            </button>
          </div>
        </div>
      </ng-container>
    </nz-modal>
  `,
  styles: [`
    :host { display: block; scroll-behavior: smooth; }
    .bp-sub-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2px;
      margin-bottom: 8px;
      background: #f0f4ff;
      border-radius: 8px;
      padding: 6px 12px;
      border: 1px solid #e0e7ff;
    }
    .bp-nav-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 700;
      color: #1f3d6e;
    }
    .bp-nav-title i { font-size: 16px; }
    .bp-nav-actions { display: flex; gap: 6px; }
    .bp-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 8px 12px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      height: calc(100vh - 48px);
      overflow-y: auto;
      scroll-behavior: smooth;
    }
    .bp-container::-webkit-scrollbar { width: 6px; }
    .bp-container::-webkit-scrollbar-track { background: transparent; }
    .bp-container::-webkit-scrollbar-thumb { background: #d0d5dd; border-radius: 3px; }
    .bp-container::-webkit-scrollbar-thumb:hover { background: #98a2b3; }
    .bp-controls-card, .bp-table-card {
      border-radius: 8px !important;
      border: 1px solid #e8eaed !important;
      box-shadow: 0 1px 6px rgba(0,0,0,0.04) !important;
      margin-bottom: 8px;
      width: 100% !important;
    }
    :host ::ng-deep .bp-controls-card .ant-card-body {
      padding: 8px 12px !important;
    }
    :host ::ng-deep .bp-table-card .ant-card-body {
      padding: 0 !important;
    }
    .bp-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 6px;
    }
    .bp-filters {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .bp-stats {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .bp-stat-item {
      font-size: 11px;
      color: #6c757d;
    }
    .bp-stat-item strong {
      color: #374151;
      font-weight: 700;
    }
    .bp-stat-divider {
      width: 1px;
      height: 16px;
      background: #e2e5ea;
    }
    :host ::ng-deep .filter-select .ant-select-selector {
      border-radius: 6px !important;
      border: 1px solid #e2e5ea !important;
      height: 30px !important;
      padding: 0 6px !important;
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
      font-size: 12px !important;
      line-height: 28px !important;
    }
    .btn-primary-gradient {
      height: 30px !important;
      padding: 0 14px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      border: none !important;
      border-radius: 6px !important;
      background: linear-gradient(135deg, #4361ee, #3a0ca3) !important;
      color: #fff !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
      transition: all 0.2s ease !important;
      letter-spacing: 0.3px !important;
      box-shadow: 0 2px 6px rgba(67,97,238,0.25) !important;
    }
    .btn-primary-gradient:hover {
      transform: translateY(-1px) !important;
      box-shadow: 0 3px 10px rgba(67,97,238,0.35) !important;
    }
    .btn-primary-gradient:active { transform: translateY(0) !important; }

    /* Table */
    :host ::ng-deep .theme-table {
      width: 100% !important;
      table-layout: fixed !important;
    }
    :host ::ng-deep .theme-table .ant-table {
      font-size: 12px;
      border-radius: 0 !important;
    }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th {
      background: #f8f9fc !important;
      color: #1f3d6e !important;
      font-size: 10px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
      padding: 6px 6px !important;
      border-bottom: 2px solid #1f3d6e !important;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th:not(:last-child) {
      border-right: 1px solid #e8ecf1;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr > td {
      padding: 4px 6px !important;
      border-bottom: 1px solid #f0f2f5 !important;
      font-size: 11px;
      color: #374151;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr:hover > td {
      background: rgba(31,61,110,0.03) !important;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr:last-child > td {
      border-bottom: none;
    }
    :host ::ng-deep .theme-table .ant-table-placeholder {
      display: none !important;
    }
    :host ::ng-deep .bp-table-card .ant-table-body {
      scroll-behavior: smooth;
    }
    :host ::ng-deep .bp-table-card .ant-table-body::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    :host ::ng-deep .bp-table-card .ant-table-body::-webkit-scrollbar-track {
      background: #f1f3f5;
      border-radius: 3px;
    }
    :host ::ng-deep .bp-table-card .ant-table-body::-webkit-scrollbar-thumb {
      background: #c4c9d4;
      border-radius: 10px;
    }
    :host ::ng-deep .bp-table-card .ant-table-body::-webkit-scrollbar-thumb:hover {
      background: #a0a8b7;
    }
    .th-sno { width: 3% !important; text-align: center !important; }
    .th-vendor { width: 20% !important; text-align: left !important; }
    .th-type { width: 11% !important; text-align: center !important; }
    .th-num { width: 11% !important; text-align: right !important; }
    .th-date { width: 9% !important; text-align: center !important; }
    .th-status { width: 10% !important; text-align: center !important; }
    .th-doc { width: 5% !important; text-align: center !important; }
    .th-actions { width: 13% !important; text-align: center !important; }
    .td-center { text-align: center !important; }
    .td-right {
      text-align: right !important;
      font-family: 'Courier New', monospace;
      font-size: 11px;
    }
    .td-vendor {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .td-actions { text-align: center !important; white-space: nowrap; }
    .gross-amount { font-weight: 700; color: #374151; }
    .status-tag {
      font-size: 9px !important;
      font-weight: 600 !important;
      padding: 0 5px !important;
      line-height: 16px !important;
      border-radius: 3px !important;
    }
    .action-btn {
      padding: 0 3px !important;
      font-size: 14px !important;
      transition: all 0.2s ease !important;
    }
    .action-view { color: #1f3d6e !important; }
    .action-view:hover { color: #16213e !important; transform: scale(1.15); }
    .action-mail { color: #4361ee !important; }
    .action-mail:hover { color: #3a0ca3 !important; transform: scale(1.15); }
    .action-download { color: #059669 !important; }
    .action-download:hover { color: #047857 !important; transform: scale(1.15); }
    .action-delete { color: #ef4444 !important; }
    .action-delete:hover { color: #dc2626 !important; transform: scale(1.15); }
    .text-muted { color: #9ca3af; font-size: 11px; }
    .empty-cell {
      text-align: center !important;
      padding: 20px !important;
      color: #9ca3af !important;
      font-size: 12px;
      font-style: italic;
    }

    /* Pagination */
    :host ::ng-deep .ant-pagination {
      margin: 8px 12px !important;
      font-size: 12px !important;
    }
    :host ::ng-deep .ant-pagination-item {
      min-width: 28px !important;
      height: 28px !important;
      line-height: 28px !important;
    }
    :host ::ng-deep .ant-pagination-item a { font-size: 12px !important; }
    :host ::ng-deep .ant-pagination-options .ant-select-selector {
      height: 28px !important;
      font-size: 12px !important;
    }

    /* Modal form */
    .modal-form { display: flex; flex-direction: column; gap: 10px; }
    .form-row { display: flex; gap: 12px; }
    .form-row .form-group { flex: 1; }
    .form-group { display: flex; flex-direction: column; gap: 3px; }
    .form-group label {
      font-weight: 600;
      font-size: 11px;
      color: #374151;
    }
    .required { color: #ef4444; }
    .hint { font-size: 10px; color: #9ca3af; }

    /* Preview */
    .preview-container { display: flex; flex-direction: column; align-items: center; }
    .preview-unsupported { text-align: center; padding: 40px; color: #9ca3af; }
    .preview-unsupported p { margin: 12px 0 16px; }
  `]
})
export class BillsProcessingComponent implements OnInit {
  bills: Bill[] = [];
  loading = false;
  submitting = false;

  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();

  months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(2024, i, 1).toLocaleString('default', { month: 'short' }) }));
  years: number[] = [];

  isModalVisible = false;
  isEditing = false;
  editingId: number | null = null;

  formData: any = {};
  fileList: any[] = [];

  isPreviewVisible = false;
  previewBill: Bill | null = null;
  pdfSafeUrl: SafeResourceUrl | null = null;

  get totalAmount(): number {
    return this.bills.reduce((sum, b) => sum + (b.amount || 0), 0);
  }

  constructor(
    private billService: BillService,
    private msg: NzMessageService,
    private modal: NzModalService,
    private sanitizer: DomSanitizer
  ) {
    const cy = new Date().getFullYear();
    for (let y = cy - 2; y <= cy + 1; y++) this.years.push(y);
  }

  ngOnInit(): void {
    this.loadBills();
  }

  loadBills(): void {
    this.loading = true;
    this.billService.getBills(this.selectedMonth, this.selectedYear).subscribe({
      next: (res) => { this.bills = res.data || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  showUploadModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.formData = {};
    this.fileList = [];
    this.isModalVisible = true;
  }

  editBill(bill: Bill): void {
    this.isEditing = true;
    this.editingId = bill.id;
    this.formData = {
      vendorName: bill.vendorName,
      billType: bill.billType,
      amount: bill.amount,
      billDate: bill.billDate ? new Date(bill.billDate) : null,
      dueDate: bill.dueDate ? new Date(bill.dueDate) : null,
      description: bill.description,
      status: bill.isProcessed ? 'PROCESSED' : 'PENDING'
    };
    this.fileList = [];
    this.isModalVisible = true;
  }

  closeModal(): void {
    this.isModalVisible = false;
  }

  beforeUpload = (file: any): boolean => {
    this.fileList = [file];
    return false;
  };

  submitBill(): void {
    if (!this.formData.vendorName || !this.formData.billType || !this.formData.amount) {
      this.msg.warning('Please fill in all required fields');
      return;
    }
    this.submitting = true;
    const fd = new FormData();
    fd.append('vendorName', this.formData.vendorName);
    fd.append('billType', this.formData.billType);
    fd.append('amount', this.formData.amount.toString());
    if (this.formData.billDate) fd.append('billDate', this.formatDate(this.formData.billDate));
    if (this.formData.dueDate) fd.append('dueDate', this.formatDate(this.formData.dueDate));
    if (this.formData.description) fd.append('description', this.formData.description);
    if (this.isEditing && this.formData.status) fd.append('status', this.formData.status);
    if (this.fileList.length > 0) fd.append('file', this.fileList[0]);

    const request = this.isEditing && this.editingId
      ? this.billService.updateBill(this.editingId, fd)
      : this.billService.createBill(fd);

    request.subscribe({
      next: (res) => {
        this.msg.success(this.isEditing ? 'Bill updated successfully' : 'Bill uploaded successfully');
        this.closeModal();
        this.loadBills();
        this.submitting = false;
      },
      error: () => { this.submitting = false; }
    });
  }

  toggleStatus(bill: Bill): void {
    this.billService.toggleStatus(bill.id).subscribe({
      next: () => {
        this.msg.success(`Bill marked as ${bill.isProcessed ? 'Pending' : 'Processed'}`);
        this.loadBills();
      }
    });
  }

  deleteBill(bill: Bill): void {
    this.billService.deleteBill(bill.id).subscribe({
      next: () => { this.msg.success('Bill deleted'); this.loadBills(); }
    });
  }

  previewFile(bill: Bill): void {
    this.previewBill = bill;
    if (this.isPdfFile(bill)) {
      this.pdfSafeUrl = this.getSanitizedUrl(bill.id);
    }
    this.isPreviewVisible = true;
  }

  closePreview(): void {
    this.isPreviewVisible = false;
    this.previewBill = null;
    this.pdfSafeUrl = null;
  }

  getFileUrl(id: number): string {
    return this.billService.getFileUrl(id);
  }

  getSanitizedUrl(id: number): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.getFileUrl(id));
  }

  isImageFile(bill: Bill): boolean {
    return bill.contentType?.startsWith('image/') || false;
  }

  isPdfFile(bill: Bill): boolean {
    return bill.contentType === 'application/pdf' || bill.fileName?.endsWith('.pdf') || false;
  }

  downloadFile(bill: Bill): void {
    window.open(this.getFileUrl(bill.id), '_blank');
  }

  amountFormatter = (value: number) => value ? `₹ ${value}` : '';
  amountParser = (value: string) => value.replace('₹ ', '');

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${y}-${m}-${day}`;
  }
}
