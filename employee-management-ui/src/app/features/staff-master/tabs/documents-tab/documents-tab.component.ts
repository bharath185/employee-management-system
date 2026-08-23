import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { saveAs } from 'file-saver';

interface EmployeeDocument {
  id: number;
  employeeId: number;
  employeeCode: string;
  documentType: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface DocTypeOption {
  code: string;
  value: string;
}

@Component({
  selector: 'app-documents-tab',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzCardModule, NzFormModule,
    NzSelectModule, NzButtonModule, NzIconModule, NzTableModule,
    NzMessageModule, NzSpinModule, NzUploadModule, NzModalModule
  ],
  template: `
    <div class="documents-tab">
      <nz-card nzTitle="Upload Document" class="pp-controls-card" nzSize="small">
        <div class="upload-row">
          <nz-form-item class="doc-type-field">
            <nz-form-label>Document Type</nz-form-label>
            <nz-form-control>
              <nz-select [(ngModel)]="selectedDocType" nzPlaceHolder="Select document type" class="filter-select">
                <nz-option *ngFor="let dt of docTypes" [nzValue]="dt.code" [nzLabel]="dt.value"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>
          <div class="file-upload-area">
            <nz-upload
              nzType="drag"
              [nzBeforeUpload]="beforeUpload"
              (nzChange)="onNzFileChange($event)"
              [nzFileList]="fileList"
              class="drag-upload-box">
              <p class="ant-upload-drag-icon">
                <i nz-icon nzType="cloud-upload" style="color: #4361ee; font-size: 32px;"></i>
              </p>
              <p class="ant-upload-text" style="font-size: 13px; font-weight: 500; color: #334155;">Click or drag file to upload</p>
              <p class="ant-upload-hint" *ngIf="selectedFile" style="font-weight: 600; color: #1f3d6e;">{{ selectedFile.name }} ({{ (selectedFile.size / 1024).toFixed(1) }} KB)</p>
            </nz-upload>
          </div>
          <button nz-button class="btn-primary-gradient" [disabled]="!selectedFile || !selectedDocType || uploading" (click)="upload()">
            <i nz-icon nzType="upload"></i> {{ uploading ? 'Uploading...' : 'Upload' }}
          </button>
        </div>
      </nz-card>

      <nz-card nzTitle="Uploaded Documents" class="pp-status-card" nzSize="small">
        <div *ngIf="loading" class="loading"><nz-spin nzSize="large"></nz-spin></div>
        <nz-table #docTable [nzData]="dataSource.data" *ngIf="!loading && dataSource.data.length > 0" nzSize="small" nzShowPagination="false" class="theme-table">
          <thead>
            <tr>
              <th>Document Type</th>
              <th>File Name</th>
              <th>Size</th>
              <th>Uploaded At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let doc of docTable.data">
              <td><span class="doc-type-badge">{{ doc.documentType }}</span></td>
              <td><span class="file-name-text">{{ doc.originalName }}</span></td>
              <td><span class="file-size-text">{{ (doc.fileSize / 1024).toFixed(1) }} KB</span></td>
              <td><span class="date-text">{{ doc.uploadedAt | date:'dd/MM/yyyy HH:mm' }}</span></td>
              <td>
                <button nz-button nzType="link" nz-tooltip="Download" (click)="download(doc)" class="action-link-btn">
                  <i nz-icon nzType="download"></i>
                </button>
                <button nz-button nzType="link" nzDanger nz-tooltip="Delete" (click)="delete(doc)" class="action-link-btn">
                  <i nz-icon nzType="delete"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </nz-table>
        <div *ngIf="!loading && dataSource.data.length === 0" class="empty-state">
          <i nz-icon nzType="file-text" class="empty-icon"></i>
          <p>No documents uploaded yet</p>
        </div>
      </nz-card>
    </div>
  `,
  styles: [`
    .documents-tab {
      display: flex;
      flex-direction: column;
      gap: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .pp-controls-card, .pp-status-card {
      border-radius: 10px !important;
      border: 1px solid #e8eaed !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
      background: #fff;
      width: 100% !important;
    }
    :host ::ng-deep .pp-controls-card .ant-card-head,
    :host ::ng-deep .pp-status-card .ant-card-head {
      border-bottom: 1px solid #e8eaed;
      padding: 10px 16px;
      min-height: auto;
    }
    :host ::ng-deep .pp-controls-card .ant-card-head-title,
    :host ::ng-deep .pp-status-card .ant-card-head-title {
      font-size: 14px;
      font-weight: 700;
      color: #1f3d6e;
    }
    :host ::ng-deep .pp-controls-card .ant-card-body,
    :host ::ng-deep .pp-status-card .ant-card-body {
      padding: 14px 16px !important;
    }

    .upload-row { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .doc-type-field { min-width: 220px; margin-bottom: 0; }
    .doc-type-field nz-form-label { font-size: 12px; font-weight: 600; color: #334155; }
    .file-upload-area { flex: 1; min-width: 240px; }

    :host ::ng-deep .filter-select .ant-select-selector {
      border-radius: 8px !important;
      border: 1px solid #e2e5ea !important;
      height: 34px !important;
    }
    :host ::ng-deep .filter-select .ant-select-selector:hover {
      border-color: #1f3d6e !important;
    }

    :host ::ng-deep .drag-upload-box .ant-upload.ant-upload-drag {
      border-radius: 8px !important;
      border: 1.5px dashed #c7d2fe !important;
      background: #f8faff !important;
      padding: 8px 12px !important;
      transition: all 0.2s ease !important;
    }
    :host ::ng-deep .drag-upload-box .ant-upload.ant-upload-drag:hover {
      border-color: #4361ee !important;
      background: #f0f4ff !important;
    }

    .btn-primary-gradient {
      height: 34px !important;
      padding: 0 18px !important;
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

    .theme-table { width: 100%; }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th {
      background: #f8f9fc !important;
      border-bottom: 2px solid #1f3d6e !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      color: #1f3d6e !important;
      text-transform: uppercase !important;
      letter-spacing: 0.8px !important;
      padding: 8px 12px !important;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr > td {
      padding: 10px 12px !important;
      font-size: 13px !important;
      border-bottom: 1px solid #f0f2f5 !important;
      vertical-align: middle !important;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr:hover > td {
      background: rgba(31,61,110,0.04) !important;
    }

    .doc-type-badge {
      background: #f0f4ff;
      color: #1f3d6e;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      border: 1px solid #e0e7ff;
    }
    .file-name-text { font-weight: 600; color: #1e293b; }
    .file-size-text { font-size: 12px; color: #64748b; }
    .date-text { font-size: 12px; color: #64748b; }

    .action-link-btn {
      font-size: 16px;
      padding: 0 6px;
    }

    .loading { display: flex; justify-content: center; padding: 32px; }
    .empty-state { text-align: center; padding: 32px; color: #64748b; }
    .empty-icon { font-size: 40px; color: #94a3b8; margin-bottom: 8px; }
    @media (max-width: 768px) { .upload-row { flex-direction: column; align-items: stretch; } .doc-type-field { width: 100%; } }
  `]
})
export class DocumentsTabComponent implements OnInit, OnChanges {
  @Input() employeeId: number | null = null;
  @Input() isEditMode = false;

  private apiUrl = environment.apiUrl;
  docTypes: DocTypeOption[] = [];
  selectedDocType = '';
  selectedFile: File | null = null;
  uploading = false;
  loading = false;
  dataSource = { data: [] as EmployeeDocument[] };
  fileList: NzUploadFile[] = [];

  constructor(private http: HttpClient, private message: NzMessageService, private modal: NzModalService) {}

  ngOnInit(): void {
    this.loadDocTypes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employeeId'] && this.employeeId && this.isEditMode) {
      this.loadDocuments();
    }
  }

  private loadDocTypes(): void {
    this.http.get<{success:boolean;data:DocTypeOption[]}>(`${this.apiUrl}/masters/DOCUMENT_TYPE`).subscribe({
      next: r => { if (r.success) this.docTypes = r.data; }
    });
  }

  private loadDocuments(): void {
    if (!this.employeeId) return;
    this.loading = true;
    this.http.get<{success:boolean;data:EmployeeDocument[]}>(`${this.apiUrl}/documents/employee/${this.employeeId}`)
      .subscribe({
        next: r => { if (r.success) this.dataSource.data = r.data; this.loading = false; },
        error: () => { this.loading = false; this.message.error('Failed to load documents', { nzDuration: 3000 }); }
      });
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    this.selectedFile = file as unknown as File;
    return false; // Prevent automatic upload
  };

  onNzFileChange(info: any): void {
    this.fileList = info.fileList.slice(-1);
  }

  upload(): void {
    if (!this.employeeId || !this.selectedFile || !this.selectedDocType) return;
    this.uploading = true;
    const fd = new FormData();
    fd.append('file', this.selectedFile);
    fd.append('documentType', this.selectedDocType);
    this.http.post<{success:boolean;message:string}>(`${this.apiUrl}/documents/upload/${this.employeeId}`, fd)
      .subscribe({
        next: r => {
          this.uploading = false;
          this.message.success(r.message || 'Uploaded', { nzDuration: 3000 });
          this.selectedFile = null;
          this.selectedDocType = '';
          this.fileList = [];
          this.loadDocuments();
        },
        error: () => { this.uploading = false; this.message.error('Upload failed', { nzDuration: 3000 }); }
      });
  }

  download(doc: EmployeeDocument): void {
    this.http.get(`${this.apiUrl}/documents/download/${doc.id}`, { responseType: 'blob' }).subscribe({
      next: blob => {
        saveAs(blob, doc.fileName);
        this.message.success('Download started', { nzDuration: 2000 });
      },
      error: () => this.message.error('Download failed', { nzDuration: 3000 })
    });
  }

  delete(doc: EmployeeDocument): void {
    this.modal.confirm({
      nzTitle: 'Delete Document',
      nzContent: `Are you sure you want to delete ${doc.originalName}?`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        this.http.delete<{success:boolean}>(`${this.apiUrl}/documents/${doc.id}`).subscribe({
          next: r => { if (r.success) { this.message.success('Deleted', { nzDuration: 2000 }); this.loadDocuments(); } },
          error: () => this.message.error('Delete failed', { nzDuration: 3000 })
        });
      }
    });
  }
}
