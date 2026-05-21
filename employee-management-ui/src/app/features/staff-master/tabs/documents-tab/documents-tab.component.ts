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
      <nz-card nzTitle="Upload Document" class="upload-card">
        <div class="upload-row">
          <nz-form-item class="doc-type-field">
            <nz-form-label>Document Type</nz-form-label>
            <nz-form-control>
              <nz-select [(ngModel)]="selectedDocType" nzPlaceHolder="Select document type">
                <nz-option *ngFor="let dt of docTypes" [nzValue]="dt.code" [nzLabel]="dt.value"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>
          <div class="file-upload-area">
            <nz-upload
              nzType="drag"
              [nzBeforeUpload]="beforeUpload"
              (nzChange)="onNzFileChange($event)"
              [nzFileList]="fileList">
              <p class="ant-upload-drag-icon">
                <i nz-icon nzType="cloud-upload"></i>
              </p>
              <p class="ant-upload-text">Click or drag file to this area to upload</p>
              <p class="ant-upload-hint" *ngIf="selectedFile">{{ selectedFile.name }} ({{ (selectedFile.size / 1024).toFixed(1) }} KB)</p>
            </nz-upload>
          </div>
          <button nz-button nzType="primary" [disabled]="!selectedFile || !selectedDocType || uploading" (click)="upload()">
            <i nz-icon nzType="upload"></i> {{ uploading ? 'Uploading...' : 'Upload' }}
          </button>
        </div>
      </nz-card>

      <nz-card nzTitle="Uploaded Documents" class="documents-list-card">
        <div *ngIf="loading" class="loading"><nz-spin nzSize="large"></nz-spin></div>
        <nz-table #docTable [nzData]="dataSource.data" *ngIf="!loading && dataSource.data.length > 0" nzSize="small" nzShowPagination="false" class="doc-table">
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
              <td>{{ doc.originalName }}</td>
              <td>{{ (doc.fileSize / 1024).toFixed(1) }} KB</td>
              <td>{{ doc.uploadedAt | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>
                <button nz-button nzType="link" nz-tooltip="Download" (click)="download(doc)">
                  <i nz-icon nzType="download"></i>
                </button>
                <button nz-button nzType="link" nzDanger nz-tooltip="Delete" (click)="delete(doc)">
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
    .documents-tab { display: flex; flex-direction: column; gap: 16px; }
    .upload-card { border-radius: var(--radius-lg); }
    .upload-row { display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
    .doc-type-field { min-width: 220px; }
    .file-upload-area { flex: 1; min-width: 200px; }
    .documents-list-card { border-radius: var(--radius-lg); }
    .doc-table { width: 100%; }
    .doc-type-badge {
      background: #e3e8f0; color: var(--color-primary-500); padding: 4px 12px; border-radius: var(--radius-lg);
      font-size: 12px; font-weight: 600;
    }
    .loading { display: flex; justify-content: center; padding: 32px; }
    .empty-state { text-align: center; padding: 32px; color: #6c757d; }
    .empty-icon { font-size: 48px; }
    nz-form-item { margin-bottom: 0; }
    @media (max-width: 768px) { .upload-row { flex-direction: column; } .doc-type-field { width: 100%; } }
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
