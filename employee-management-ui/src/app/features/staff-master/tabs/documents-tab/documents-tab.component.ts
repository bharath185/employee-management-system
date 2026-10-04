import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EmployeeDocumentService } from '../../../../core/services/employee-document.service';
import { EmployeeDocument, StagedDocumentItem, DOCUMENT_CATEGORIES, DocumentCategoryOption } from '../../../../core/models/employee-document.model';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-documents-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NzCardModule,
    NzFormModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzTableModule,
    NzMessageModule,
    NzSpinModule,
    NzUploadModule,
    NzModalModule,
    NzTagModule,
    NzToolTipModule,
    NzInputModule,
    NzInputNumberModule,
    NzProgressModule,
    NzEmptyModule
  ],
  template: `
    <div class="documents-tab">
      
      <!-- Upload & Staging Card -->
      <nz-card class="pp-controls-card" nzSize="small" *ngIf="!hideUpload">
        <div class="card-header-bar">
          <div class="header-title">
            <i nz-icon nzType="cloud-upload" class="header-icon"></i>
            <span>Upload Employee Documents</span>
          </div>
          <div class="header-actions">
            <a [routerLink]="['/admin/documents']" [queryParams]="{ employeeId: employeeId }" class="hub-link-btn" nz-tooltip="Open in Full Document Hub with Advanced Tools">
              <i nz-icon nzType="fullscreen"></i> Open in Document Hub
            </a>
          </div>
        </div>

        <!-- Multi-file Dropzone -->
        <div
          class="mini-dropzone"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          (click)="fileInput.click()">
          <input
            #fileInput
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/bmp,application/pdf"
            style="display:none"
            (change)="onFileSelected($event)" />

          <div class="dropzone-content">
            <i nz-icon nzType="cloud-upload" class="drop-icon"></i>
            <div>
              <p class="drop-text">Click or drag & drop documents/images here (JPEG, PNG, PDF)</p>
              <p class="drop-hint">Multiple files can be selected at once. Auto-name & split pages supported.</p>
            </div>
          </div>
        </div>

        <!-- Staging Area (Visible when files selected) -->
        <div class="staged-container" *ngIf="stagedFiles.length > 0">
          <div class="staged-top-bar">
            <span class="staged-count-text">
              <i nz-icon nzType="check-circle" style="color: #2563eb;"></i>
              <strong>{{ stagedFiles.length }}</strong> file(s) staged for upload
            </span>
            <div class="staged-quick-actions">
              <button nz-button nzSize="small" (click)="autoNumberStagedPages()" nz-tooltip="Auto-number sequential pages for same categories">
                <i nz-icon nzType="ordered-list"></i> Auto-Number Pages
              </button>
              <button nz-button nzSize="small" nzDanger (click)="clearStaged()">
                <i nz-icon nzType="delete"></i> Clear
              </button>
            </div>
          </div>

          <!-- Staged Cards List -->
          <div class="staged-list">
            <div class="staged-row-card" *ngFor="let item of stagedFiles; let i = index">
              <!-- Thumbnail -->
              <div class="staged-row-thumb" (click)="openPreviewModal(item)">
                <img *ngIf="item.isImage && item.previewUrl" [src]="item.previewUrl" alt="Thumb" class="thumb-img" />
                <div *ngIf="item.isPdf" class="thumb-pdf">
                  <i nz-icon nzType="file-pdf"></i>
                </div>
                <div *ngIf="!item.isImage && !item.isPdf" class="thumb-generic">
                  <i nz-icon nzType="file"></i>
                </div>
              </div>

              <!-- Fields -->
              <div class="staged-row-fields">
                <div class="field-col cat-col">
                  <label class="row-label">Category</label>
                  <nz-select [(ngModel)]="item.documentType" (ngModelChange)="onCategoryChange(item)" nzSize="small" class="w-full">
                    <nz-option *ngFor="let cat of categories" [nzValue]="cat.code" [nzLabel]="cat.label"></nz-option>
                  </nz-select>
                </div>

                <div class="field-col title-col">
                  <label class="row-label">Document Title / Name</label>
                  <input nz-input [(ngModel)]="item.documentTitle" placeholder="Document title (e.g. Aadhar-1)" nzSize="small" />
                </div>

                <div class="field-col page-col">
                  <label class="row-label">Page No.</label>
                  <nz-input-number [(ngModel)]="item.pageNumber" [nzMin]="1" [nzMax]="99" nzSize="small" style="width: 70px;"></nz-input-number>
                </div>

                <div class="field-col note-col">
                  <label class="row-label">Notes (Optional)</label>
                  <input nz-input [(ngModel)]="item.notes" placeholder="Notes" nzSize="small" />
                </div>
              </div>

              <!-- Row Actions -->
              <div class="staged-row-actions">
                <button nz-button nzType="text" nzDanger nzSize="small" (click)="removeStaged(i)" nz-tooltip="Remove">
                  <i nz-icon nzType="close"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Bottom Upload Action Bar -->
          <div class="staged-bottom-bar">
            <nz-progress *ngIf="uploading" [nzPercent]="uploadPercent" nzStatus="active" [nzStrokeWidth]="6" style="flex: 1; max-width: 250px;"></nz-progress>
            <span *ngIf="!uploading" style="font-size: 12px; color: #64748b;">All files ready to save</span>
            <button nz-button nzType="primary" class="btn-primary-gradient" [disabled]="uploading || !employeeId" [nzLoading]="uploading" (click)="uploadAllStaged()">
              <i nz-icon nzType="upload"></i> Save & Upload {{ stagedFiles.length }} Document(s)
            </button>
          </div>
        </div>
      </nz-card>

      <!-- Uploaded Documents Repository Card -->
      <nz-card class="pp-status-card" nzSize="small">
        <div class="card-header-bar">
          <div class="header-title">
            <i nz-icon nzType="folder" class="header-icon"></i>
            <span>Uploaded Documents ({{ documents.length }})</span>
          </div>
          <div class="header-actions">
            <button *ngIf="documents.length > 0" nz-button nzType="default" nzSize="small" (click)="downloadAllZip()" [nzLoading]="isZipDownloading" class="btn-zip">
              <i nz-icon nzType="file-zip"></i> Download All (ZIP)
            </button>
            <a *ngIf="employeeId" [routerLink]="['/admin/documents']" [queryParams]="{ employeeId: employeeId }" class="hub-link-btn" nz-tooltip="Open in Full Document Hub">
              <i nz-icon nzType="fullscreen"></i> Document Hub
            </a>
          </div>
        </div>

        <div *ngIf="loading" class="loading"><nz-spin nzSize="large"></nz-spin></div>

        <nz-table
          #docTable
          [nzData]="documents"
          *ngIf="!loading && documents.length > 0"
          nzSize="small"
          [nzShowPagination]="documents.length > 10"
          [nzPageSize]="10"
          class="theme-table">
          <thead>
            <tr>
              <th style="width: 45px; text-align: center;">View</th>
              <th>Document Title</th>
              <th>Category</th>
              <th>Page</th>
              <th>Original File</th>
              <th>Size</th>
              <th>Uploaded At</th>
              <th style="text-align: center; width: 120px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let doc of docTable.data">
              <td style="text-align: center;">
                <div class="table-thumb" (click)="openServerDocPreview(doc)">
                  <img *ngIf="isImageContentType(doc.contentType)" [src]="getDocPreviewUrl(doc.id)" alt="Icon" class="table-thumb-img" />
                  <i *ngIf="isPdfContentType(doc.contentType)" nz-icon nzType="file-pdf" style="color: #ef4444; font-size: 18px;"></i>
                  <i *ngIf="!isImageContentType(doc.contentType) && !isPdfContentType(doc.contentType)" nz-icon nzType="file" style="color: #64748b; font-size: 18px;"></i>
                </div>
              </td>
              <td>
                <span class="file-name-text">{{ doc.documentTitle || doc.originalName }}</span>
                <div *ngIf="doc.notes" class="doc-notes-sub">{{ doc.notes }}</div>
              </td>
              <td>
                <nz-tag [nzColor]="getCategoryColor(doc.documentType)">{{ getCategoryLabel(doc.documentType) }}</nz-tag>
              </td>
              <td>
                <nz-tag *ngIf="doc.pageNumber">P-{{ doc.pageNumber }}</nz-tag>
                <span *ngIf="!doc.pageNumber" style="color: #94a3b8;">—</span>
              </td>
              <td><span class="file-orig-text">{{ doc.originalName }}</span></td>
              <td><span class="file-size-text">{{ formatBytes(doc.fileSize) }}</span></td>
              <td><span class="date-text">{{ doc.uploadedAt | date:'dd/MM/yyyy HH:mm' }}</span></td>
              <td style="text-align: center;">
                <div class="table-actions-row">
                  <button nz-button nzType="link" nzSize="small" nz-tooltip="Preview" (click)="openServerDocPreview(doc)" class="action-btn">
                    <i nz-icon nzType="eye"></i>
                  </button>
                  <button nz-button nzType="link" nzSize="small" nz-tooltip="Edit Metadata" (click)="openEditModal(doc)" class="action-btn">
                    <i nz-icon nzType="edit"></i>
                  </button>
                  <button nz-button nzType="link" nzSize="small" nz-tooltip="Download" (click)="download(doc)" class="action-btn" style="color: #16a34a;">
                    <i nz-icon nzType="download"></i>
                  </button>
                  <button nz-button nzType="link" nzDanger nzSize="small" nz-tooltip="Delete" (click)="delete(doc)" class="action-btn">
                    <i nz-icon nzType="delete"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </nz-table>

        <div *ngIf="!loading && documents.length === 0" class="empty-state">
          <i nz-icon nzType="file-text" class="empty-icon"></i>
          <p>No documents uploaded for this employee yet.</p>
          <span style="font-size: 12px; color: #94a3b8;">Drag & drop files in the box above to upload.</span>
        </div>
      </nz-card>

      <!-- Preview Modal (Lightbox / PDF Viewer) -->
      <nz-modal
        [(nzVisible)]="isPreviewModalVisible"
        [nzTitle]="previewModalTitle"
        (nzOnCancel)="isPreviewModalVisible = false"
        [nzWidth]="840"
        [nzFooter]="previewModalFooter">
        <ng-template nzModalContent>
          <div class="preview-modal-body">
            <div *ngIf="previewIsImage && previewUrl" class="preview-img-container">
              <img [src]="previewUrl" alt="Document Preview" class="preview-modal-img" [style.transform]="'rotate(' + previewRotation + 'deg) scale(' + previewZoom + ')'" />
            </div>

            <div *ngIf="previewIsPdf && previewUrlSafe" class="preview-pdf-container">
              <iframe [src]="previewUrlSafe" class="preview-pdf-iframe"></iframe>
            </div>

            <div *ngIf="!previewIsImage && !previewIsPdf" class="preview-generic-box">
              <i nz-icon nzType="file-text" style="font-size: 48px; color: #64748b;"></i>
              <p style="margin-top: 12px; font-weight: 500;">Preview not available for this format.</p>
            </div>
          </div>
        </ng-template>

        <ng-template #previewModalFooter>
          <div class="preview-footer-wrap">
            <div class="preview-toolbar" *ngIf="previewIsImage">
              <button nz-button nzType="default" nzSize="small" (click)="previewZoom = previewZoom + 0.2"><i nz-icon nzType="zoom-in"></i></button>
              <button nz-button nzType="default" nzSize="small" (click)="previewZoom = Math.max(0.4, previewZoom - 0.2)"><i nz-icon nzType="zoom-out"></i></button>
              <button nz-button nzType="default" nzSize="small" (click)="previewRotation = (previewRotation + 90) % 360"><i nz-icon nzType="redo"></i> Rotate</button>
              <button nz-button nzType="default" nzSize="small" (click)="previewZoom = 1; previewRotation = 0">Reset</button>
            </div>
            <div style="display: flex; gap: 8px;">
              <button nz-button nzType="default" (click)="isPreviewModalVisible = false">Close</button>
              <button nz-button nzType="primary" *ngIf="currentServerDoc" (click)="download(currentServerDoc)">
                <i nz-icon nzType="download"></i> Download File
              </button>
            </div>
          </div>
        </ng-template>
      </nz-modal>

      <!-- Edit Metadata Modal -->
      <nz-modal
        [(nzVisible)]="isEditModalVisible"
        nzTitle="Edit Document Details"
        (nzOnCancel)="isEditModalVisible = false"
        (nzOnOk)="saveEditMetadata()"
        [nzOkLoading]="isSavingEdit"
        nzWidth="480px">
        <ng-template nzModalContent>
          <div *ngIf="editingDoc" class="edit-modal-fields">
            <div class="form-group-md">
              <label class="modal-label">Document Title / Label <span style="color:#ef4444">*</span></label>
              <input nz-input [(ngModel)]="editingDoc.documentTitle" placeholder="e.g. Aadhar Card Front" />
            </div>
            <div class="form-group-md">
              <label class="modal-label">Category <span style="color:#ef4444">*</span></label>
              <nz-select [(ngModel)]="editingDoc.documentType" class="w-full">
                <nz-option *ngFor="let cat of categories" [nzValue]="cat.code" [nzLabel]="cat.label"></nz-option>
              </nz-select>
            </div>
            <div class="form-group-md">
              <label class="modal-label">Page Number</label>
              <nz-input-number [(ngModel)]="editingDoc.pageNumber" [nzMin]="1" [nzMax]="99" style="width: 100%;"></nz-input-number>
            </div>
            <div class="form-group-md">
              <label class="modal-label">Notes / Remarks</label>
              <textarea nz-input [(ngModel)]="editingDoc.notes" rows="2" placeholder="Notes..."></textarea>
            </div>
          </div>
        </ng-template>
      </nz-modal>

    </div>
  `,
  styles: [`
    .documents-tab {
      display: flex;
      flex-direction: column;
      gap: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .pp-controls-card, .pp-status-card {
      border-radius: 10px !important;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04) !important;
      background: #fff;
    }

    .card-header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f1f5f9;
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 700;
      color: #1e3a8a;
    }
    .header-icon { font-size: 16px; color: #3b82f6; }
    
    .hub-link-btn {
      font-size: 12px;
      font-weight: 600;
      color: #2563eb;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 6px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      transition: all 0.2s;
    }
    .hub-link-btn:hover { background: #dbeafe; color: #1d4ed8; }

    /* Dropzone */
    .mini-dropzone {
      border: 2px dashed #93c5fd;
      background: #f0f7ff;
      border-radius: 8px;
      padding: 16px 20px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }
    .mini-dropzone:hover {
      border-color: #2563eb;
      background: #e0f0fe;
    }
    .dropzone-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }
    .drop-icon { font-size: 32px; color: #2563eb; }
    .drop-text { font-size: 13px; font-weight: 600; color: #1e3a8a; margin: 0 0 2px; }
    .drop-hint { font-size: 11px; color: #64748b; margin: 0; }

    /* Staged Container */
    .staged-container {
      margin-top: 14px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      padding: 12px 16px;
    }
    .staged-top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    .staged-count-text { font-size: 13px; color: #1e293b; display: flex; align-items: center; gap: 6px; }
    .staged-quick-actions { display: flex; gap: 8px; }

    .staged-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 280px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .staged-row-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fff;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
    }
    .staged-row-thumb {
      width: 44px;
      height: 44px;
      border-radius: 4px;
      overflow: hidden;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
    }
    .thumb-img { width: 100%; height: 100%; object-fit: cover; }
    .thumb-pdf { color: #ef4444; font-size: 22px; }
    .thumb-generic { color: #64748b; font-size: 22px; }

    .staged-row-fields {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      flex-wrap: wrap;
    }
    .field-col { display: flex; flex-direction: column; gap: 2px; }
    .cat-col { min-width: 160px; flex: 2; }
    .title-col { min-width: 180px; flex: 3; }
    .page-col { width: 70px; }
    .note-col { min-width: 120px; flex: 2; }
    .row-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }

    .staged-row-actions { flex-shrink: 0; }
    .staged-bottom-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      gap: 16px;
    }

    /* Table Styles */
    .theme-table { width: 100%; }
    .table-thumb {
      width: 32px;
      height: 32px;
      border-radius: 4px;
      overflow: hidden;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .table-thumb-img { width: 100%; height: 100%; object-fit: cover; }
    .file-name-text { font-weight: 600; color: #0f172a; font-size: 13px; }
    .doc-notes-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .file-orig-text { font-size: 12px; color: #64748b; }
    .file-size-text { font-size: 12px; color: #64748b; }
    .date-text { font-size: 12px; color: #64748b; }

    .table-actions-row { display: flex; gap: 2px; justify-content: center; }
    .action-btn { padding: 0 4px; font-size: 15px; }

    .btn-primary-gradient {
      border: none !important;
      border-radius: 6px !important;
      background: linear-gradient(135deg, #2563eb, #1e40af) !important;
      color: #fff !important;
      font-weight: 600 !important;
      box-shadow: 0 2px 6px rgba(37,99,235,0.25) !important;
    }
    .btn-zip {
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #166534;
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    .btn-zip:hover { background: #dcfce7; color: #15803d; }

    .loading { display: flex; justify-content: center; padding: 24px; }
    .empty-state { text-align: center; padding: 28px 16px; color: #64748b; }
    .empty-icon { font-size: 36px; color: #cbd5e1; margin-bottom: 6px; }

    /* Modal styles */
    .preview-modal-body {
      min-height: 400px;
      max-height: 70vh;
      overflow: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f172a;
      border-radius: 8px;
    }
    .preview-img-container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .preview-modal-img { max-width: 100%; max-height: 65vh; object-fit: contain; transition: transform 0.2s ease; }
    .preview-pdf-container { width: 100%; height: 65vh; }
    .preview-pdf-iframe { width: 100%; height: 100%; border: none; }
    .preview-generic-box { text-align: center; color: #fff; padding: 40px; }
    .preview-footer-wrap { display: flex; align-items: center; justify-content: space-between; width: 100%; }
    .preview-toolbar { display: flex; gap: 6px; }

    .edit-modal-fields { display: flex; flex-direction: column; gap: 12px; }
    .form-group-md { display: flex; flex-direction: column; gap: 4px; }
    .modal-label { font-size: 12px; font-weight: 600; color: #334155; }
    .w-full { width: 100%; }
  `]
})
export class DocumentsTabComponent implements OnInit, OnChanges, OnDestroy {
  @Input() employeeId: number | null | undefined = null;
  @Input() isEditMode = false;
  @Input() hideUpload = true;

  readonly Math = Math;
  categories: DocumentCategoryOption[] = DOCUMENT_CATEGORIES;
  documents: EmployeeDocument[] = [];
  stagedFiles: StagedDocumentItem[] = [];

  loading = false;
  uploading = false;
  uploadPercent = 0;
  isZipDownloading = false;

  // Preview Lightbox
  isPreviewModalVisible = false;
  previewModalTitle = 'Document Preview';
  previewUrl: string | null = null;
  previewUrlSafe: SafeResourceUrl | null = null;
  previewIsImage = false;
  previewIsPdf = false;
  previewZoom = 1;
  previewRotation = 0;
  currentServerDoc: EmployeeDocument | null = null;

  // Edit modal
  isEditModalVisible = false;
  editingDoc: { id: number; documentTitle: string; documentType: string; pageNumber?: number; notes?: string } | null = null;
  isSavingEdit = false;

  constructor(
    private docService: EmployeeDocumentService,
    private message: NzMessageService,
    private modal: NzModalService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    if (this.employeeId) {
      this.loadDocuments();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employeeId'] && this.employeeId) {
      this.loadDocuments();
    }
  }

  ngOnDestroy(): void {
    this.stagedFiles.forEach(item => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
  }

  loadDocuments(): void {
    if (!this.employeeId) return;
    this.loading = true;
    this.docService.getDocumentsByEmployee(this.employeeId).subscribe({
      next: res => {
        this.loading = false;
        if (res.success && res.data) {
          this.documents = res.data;
        }
      },
      error: () => {
        this.loading = false;
        this.message.error('Failed to load employee documents');
      }
    });
  }

  // --- Drag & Drop / File Selection ---
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer && event.dataTransfer.files) {
      this.addFilesToStaging(event.dataTransfer.files);
    }
  }

  onFileSelected(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.addFilesToStaging(event.target.files);
      event.target.value = '';
    }
  }

  private addFilesToStaging(fileList: FileList): void {
    const files = Array.from(fileList);
    files.forEach((file, index) => {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
      const detectedCat = this.detectCategoryFromFileName(file.name);
      const cleanTitle = this.generateDocumentTitle(detectedCat, this.stagedFiles.length + index + 1, file.name);

      const stagedItem: StagedDocumentItem = {
        uid: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        file: file,
        previewUrl: previewUrl,
        isImage: isImage,
        isPdf: isPdf,
        fileSize: file.size,
        documentType: detectedCat,
        documentTitle: cleanTitle,
        pageNumber: 1,
        status: 'pending'
      };

      this.stagedFiles.push(stagedItem);
    });

    this.autoNumberStagedPages();
    this.message.info(`Added ${files.length} file(s) to staging.`);
  }

  private detectCategoryFromFileName(fileName: string): string {
    const lower = fileName.toLowerCase();
    if (lower.includes('aadhar') || lower.includes('adhaar') || lower.includes('uidai')) return 'AADHAR_CARD';
    if (lower.includes('pan')) return 'PAN_CARD';
    if (lower.includes('passport')) return 'PASSPORT';
    if (lower.includes('voter') || lower.includes('license') || lower.includes('dl')) return 'VOTER_ID';
    if (lower.includes('degree') || lower.includes('convocation') || lower.includes('bachelor') || lower.includes('master')) return 'DEGREE_CERTIFICATE';
    if (lower.includes('10th') || lower.includes('12th') || lower.includes('marksheet') || lower.includes('sslc') || lower.includes('hsc')) return '10TH_12TH_MARKSHEET';
    if (lower.includes('resume') || lower.includes('cv')) return 'RESUME_CV';
    if (lower.includes('exp') || lower.includes('reliev') || lower.includes('experience')) return 'EXPERIENCE_LETTER';
    if (lower.includes('bank') || lower.includes('passbook') || lower.includes('cheque')) return 'BANK_PASSBOOK';
    if (lower.includes('photo')) return 'PASSPORT_PHOTO';
    if (lower.includes('medical') || lower.includes('fitness')) return 'MEDICAL_FITNESS';
    if (lower.includes('salary') || lower.includes('payslip')) return 'SALARY_SLIP_PREVIOUS';
    return 'OTHER';
  }

  private generateDocumentTitle(categoryCode: string, pageNum: number, originalFileName: string): string {
    const cat = this.categories.find(c => c.code === categoryCode);
    const catLabel = cat ? cat.label : 'Document';
    return `${catLabel}-${pageNum}`;
  }

  onCategoryChange(item: StagedDocumentItem): void {
    this.autoNumberStagedPages();
  }

  autoNumberStagedPages(): void {
    const categoryCounts: Record<string, number> = {};
    const categoryTotals: Record<string, number> = {};

    this.stagedFiles.forEach(item => {
      categoryTotals[item.documentType] = (categoryTotals[item.documentType] || 0) + 1;
    });

    this.stagedFiles.forEach(item => {
      const cat = item.documentType;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      const count = categoryCounts[cat];
      item.pageNumber = count;

      const catObj = this.categories.find(c => c.code === cat);
      const catLabel = catObj ? catObj.label : 'Document';
      if (categoryTotals[cat] > 1) {
        item.documentTitle = `${catLabel}-${count}`;
      } else {
        item.documentTitle = `${catLabel}`;
      }
    });
  }

  removeStaged(index: number): void {
    const item = this.stagedFiles[index];
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    this.stagedFiles.splice(index, 1);
    this.autoNumberStagedPages();
  }

  clearStaged(): void {
    this.stagedFiles.forEach(item => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    this.stagedFiles = [];
  }

  // --- Uploading ---
  uploadAllStaged(): void {
    if (!this.employeeId || this.stagedFiles.length === 0) return;
    this.uploading = true;
    this.uploadPercent = 20;

    this.docService.uploadDocumentBatch(this.employeeId, this.stagedFiles).subscribe({
      next: res => {
        this.uploadPercent = 100;
        this.uploading = false;
        if (res.success) {
          this.message.success(res.message || `Successfully uploaded ${this.stagedFiles.length} document(s).`);
          this.clearStaged();
          this.loadDocuments();
        } else {
          this.message.error(res.message || 'Batch upload failed');
        }
      },
      error: () => {
        this.uploading = false;
        this.message.error('Failed to upload batch documents');
      }
    });
  }

  // --- Preview Lightbox ---
  openPreviewModal(item: StagedDocumentItem): void {
    this.currentServerDoc = null;
    this.previewModalTitle = item.documentTitle || item.file.name;
    this.previewIsImage = item.isImage;
    this.previewIsPdf = item.isPdf;
    this.previewZoom = 1;
    this.previewRotation = 0;

    if (item.isImage && item.previewUrl) {
      this.previewUrl = item.previewUrl;
      this.previewUrlSafe = null;
    } else if (item.isPdf) {
      const blobUrl = URL.createObjectURL(item.file);
      this.previewUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
      this.previewUrl = null;
    }
    this.isPreviewModalVisible = true;
  }

  openServerDocPreview(doc: EmployeeDocument): void {
    this.currentServerDoc = doc;
    this.previewModalTitle = `${doc.documentTitle || doc.originalName} (${doc.employeeCode})`;
    this.previewIsImage = this.isImageContentType(doc.contentType);
    this.previewIsPdf = this.isPdfContentType(doc.contentType);
    this.previewZoom = 1;
    this.previewRotation = 0;

    this.docService.downloadDocument(doc.id).subscribe({
      next: (blob: Blob) => {
        const mimeType = doc.contentType || (this.previewIsPdf ? 'application/pdf' : 'image/jpeg');
        const typedBlob = new Blob([blob], { type: mimeType });
        const blobUrl = URL.createObjectURL(typedBlob);
        if (this.previewIsImage) {
          this.previewUrl = blobUrl;
          this.previewUrlSafe = null;
        } else if (this.previewIsPdf) {
          this.previewUrl = null;
          this.previewUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
        }
        this.isPreviewModalVisible = true;
      },
      error: () => {
        const streamUrl = this.docService.getPreviewUrl(doc.id);
        if (this.previewIsImage) {
          this.previewUrl = streamUrl;
          this.previewUrlSafe = null;
        } else {
          this.previewUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(streamUrl);
          this.previewUrl = null;
        }
        this.isPreviewModalVisible = true;
      }
    });
  }

  // --- Metadata Edit ---
  openEditModal(doc: EmployeeDocument): void {
    this.editingDoc = {
      id: doc.id,
      documentTitle: doc.documentTitle || doc.originalName,
      documentType: doc.documentType,
      pageNumber: doc.pageNumber,
      notes: doc.notes
    };
    this.isEditModalVisible = true;
  }

  saveEditMetadata(): void {
    if (!this.editingDoc || !this.editingDoc.documentTitle.trim()) {
      this.message.warning('Document Title cannot be empty');
      return;
    }
    this.isSavingEdit = true;
    this.docService.updateDocumentMetadata(this.editingDoc.id, {
      documentTitle: this.editingDoc.documentTitle.trim(),
      documentType: this.editingDoc.documentType,
      pageNumber: this.editingDoc.pageNumber,
      notes: this.editingDoc.notes
    }).subscribe({
      next: res => {
        this.isSavingEdit = false;
        if (res.success) {
          this.message.success('Document updated successfully');
          this.isEditModalVisible = false;
          this.loadDocuments();
        } else {
          this.message.error(res.message || 'Update failed');
        }
      },
      error: () => {
        this.isSavingEdit = false;
        this.message.error('Failed to update document metadata');
      }
    });
  }

  // --- Actions ---
  download(doc: EmployeeDocument): void {
    this.docService.downloadDocument(doc.id).subscribe({
      next: blob => {
        saveAs(blob, doc.fileName);
        this.message.success('Download started');
      },
      error: () => this.message.error('Download failed')
    });
  }

  downloadAllZip(): void {
    if (!this.employeeId) return;
    this.isZipDownloading = true;
    this.docService.downloadAllAsZip(this.employeeId).subscribe({
      next: blob => {
        this.isZipDownloading = false;
        const zipName = `Employee_${this.employeeId}_Documents.zip`;
        saveAs(blob, zipName);
        this.message.success('ZIP package downloaded successfully.');
      },
      error: () => {
        this.isZipDownloading = false;
        this.message.error('Failed to generate ZIP download.');
      }
    });
  }

  delete(doc: EmployeeDocument): void {
    this.modal.confirm({
      nzTitle: 'Delete Document',
      nzContent: `Are you sure you want to permanently delete "${doc.documentTitle || doc.originalName}"?`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        this.docService.deleteDocument(doc.id).subscribe({
          next: res => {
            if (res.success) {
              this.message.success('Document deleted successfully');
              this.loadDocuments();
            }
          },
          error: () => this.message.error('Delete failed')
        });
      }
    });
  }

  // --- Utility Helpers ---
  getCategoryLabel(code: string): string {
    const cat = this.categories.find(c => c.code === code);
    return cat ? cat.label : (code || 'Other');
  }

  getCategoryColor(code: string): string {
    const cat = this.categories.find(c => c.code === code);
    return cat ? cat.color : '#64748b';
  }

  isImageContentType(ct: string): boolean {
    return !!ct && ct.startsWith('image/');
  }

  isPdfContentType(ct: string): boolean {
    return !!ct && (ct.includes('pdf') || ct.endsWith('/pdf'));
  }

  getDocPreviewUrl(docId: number): string {
    return this.docService.getPreviewStreamUrl(docId);
  }

  formatBytes(bytes: number, decimals = 1): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
