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
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
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
    NzToolTipModule,
    NzUploadModule,
    PageHeaderComponent
  ],
  template: `
    <div class="bills-container page-enter">
      <app-page-header icon="audit" title="Bills Processing" subtitle="Upload and track vendor bills, vouchers and utility payments">
        <button nz-button nzType="primary" (click)="showUploadModal()">
          <i nz-icon nzType="upload"></i> Upload Bill
        </button>
      </app-page-header>

      <div class="bills-toolbar">
        <div class="filter-group">
          <label>Month</label>
          <nz-select [(ngModel)]="selectedMonth" (ngModelChange)="loadBills()" style="width:140px">
            <nz-option *ngFor="let m of months" [nzValue]="m.value" [nzLabel]="m.label"></nz-option>
          </nz-select>
          <label>Year</label>
          <nz-select [(ngModel)]="selectedYear" (ngModelChange)="loadBills()" style="width:110px">
            <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y.toString()"></nz-option>
          </nz-select>
        </div>
      </div>

      <nz-spin [nzSpinning]="loading">
        <nz-table #billTable [nzData]="bills" nzSize="small" [nzShowPagination]="false" nzBordered>
          <thead>
            <tr>
              <th>#</th>
              <th>Vendor Name</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Bill Date</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Document</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let bill of billTable.data; let i = index">
              <td>{{ i + 1 }}</td>
              <td>{{ bill.vendorName }}</td>
              <td><nz-tag>{{ bill.billType }}</nz-tag></td>
              <td class="text-right">{{ bill.amount | number:'1.2-2' }}</td>
              <td>{{ bill.billDate | date:'dd/MM/yyyy' }}</td>
              <td>{{ bill.dueDate ? (bill.dueDate | date:'dd/MM/yyyy') : '-' }}</td>
              <td>
                <nz-tag [nzColor]="bill.isProcessed ? 'green' : 'orange'">
                  {{ bill.isProcessed ? 'Processed' : 'Pending' }}
                </nz-tag>
              </td>
              <td>
                <ng-container *ngIf="bill.fileName; else noFile">
                  <button nz-button nzSize="small" nzType="link" (click)="previewFile(bill)">
                    <i nz-icon nzType="eye"></i> Preview
                  </button>
                </ng-container>
                <ng-template #noFile><span class="text-muted">No file</span></ng-template>
              </td>
              <td>
                <button nz-button nzSize="small" nzType="text"
                        [nzTooltipTitle]="bill.isProcessed ? 'Mark Pending' : 'Mark Processed'"
                        nz-tooltip (click)="toggleStatus(bill)">
                  <i nz-icon [nzType]="bill.isProcessed ? 'close-circle' : 'check-circle'"
                     [style.color]="bill.isProcessed ? '#faad14' : '#52c41a'"></i>
                </button>
                <button nz-button nzSize="small" nzType="text" nz-tooltip="Edit" (click)="editBill(bill)">
                  <i nz-icon nzType="edit" style="color:#1890ff"></i>
                </button>
                <button nz-button nzSize="small" nzType="text" nz-tooltip="Download"
                        *ngIf="bill.fileName" (click)="downloadFile(bill)">
                  <i nz-icon nzType="download" style="color:#52c41a"></i>
                </button>
                <button nz-button nzSize="small" nzType="text" nz-tooltip="Delete"
                        nz-popconfirm nzPopconfirmTitle="Delete this bill?" (nzOnConfirm)="deleteBill(bill)">
                  <i nz-icon nzType="delete" style="color:#ff4d4f"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </nz-table>

        <div class="empty-state" *ngIf="!loading && bills.length === 0">
          <i nz-icon nzType="file-text" nzTheme="outline" style="font-size:48px;color:#d9d9d9"></i>
          <p>No bills found for {{ selectedMonth }}/{{ selectedYear }}</p>
          <button nz-button nzType="primary" (click)="showUploadModal()">
            <i nz-icon nzType="upload"></i> Upload First Bill
          </button>
        </div>
      </nz-spin>
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
    .bills-container { padding: 20px; max-width: 1400px; margin: 0 auto; }
    .bills-toolbar {
      background: #fff; border-radius: 12px; padding: 16px 20px;
      margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      display: flex; align-items: center;
    }
    .filter-group { display: flex; align-items: center; gap: 8px; }
    .filter-group label { font-weight: 500; font-size: 13px; color: #555; white-space: nowrap; }
    :host ::ng-deep .ant-table-wrapper { background: #fff; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    :host ::ng-deep .ant-table { border-radius: 12px; overflow: hidden; }
    .text-right { text-align: right; font-weight: 600; }
    .text-muted { color: #999; font-size: 12px; }
    .empty-state { text-align: center; padding: 60px 20px; background: #fff; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .empty-state p { color: #999; margin: 12px 0 16px; }
    .modal-form { display: flex; flex-direction: column; gap: 12px; }
    .form-row { display: flex; gap: 12px; }
    .form-row .form-group { flex: 1; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group label { font-weight: 500; font-size: 13px; color: #555; }
    .required { color: #ff4d4f; }
    .hint { font-size: 11px; color: #999; }
    .preview-container { display: flex; flex-direction: column; align-items: center; }
    .preview-unsupported { text-align: center; padding: 40px; color: #999; }
    .preview-unsupported p { margin: 12px 0 16px; }
    .page-enter { animation: pageFadeIn 0.3s ease; }
    @keyframes pageFadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
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
