import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { CompanyService } from '../../core/services/company.service';
import { Company, CompanyDocument } from '../../core/models/company.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-company-setup',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzFormModule, NzInputModule, NzButtonModule,
    NzIconModule, NzSpinModule, NzModalModule, NzTableModule,
    NzTagModule, NzDividerModule, NzSelectModule, NzDatePickerModule,
    NzToolTipModule
  ],
  template: `
    <div class="cs-container">
      <div class="cs-sub-nav">
        <span class="cs-nav-title"><i nz-icon nzType="bank"></i> Company Setup</span>
        <div class="cs-nav-actions">
          <button nz-button class="btn-primary-gradient" (click)="saveCompany()" [nzLoading]="isSaving" [disabled]="!companyForm.companyName">
            <i nz-icon nzType="save"></i> Save
          </button>
        </div>
      </div>

      <nz-card class="cs-card" nzSize="small">
        <div class="cs-grid">
          <!-- Left: Info + Registration -->
          <div class="cs-left">
            <div class="cs-section-title">Company Information</div>
            <div class="cs-form-grid">
              <div class="form-group">
                <label>Company Name <span class="required">*</span></label>
                <input nz-input [(ngModel)]="companyForm.companyName" placeholder="Company name" />
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input nz-input [(ngModel)]="companyForm.phone" placeholder="Phone" />
              </div>
              <div class="form-group">
                <label>Email</label>
                <input nz-input [(ngModel)]="companyForm.email" placeholder="Email" type="email" />
              </div>
              <div class="form-group">
                <label>Website</label>
                <input nz-input [(ngModel)]="companyForm.website" placeholder="Website" />
              </div>
              <div class="form-group form-group-full">
                <label>Address</label>
                <textarea nz-input [(ngModel)]="companyForm.address" rows="2" placeholder="Address"></textarea>
              </div>
            </div>

            <div class="cs-divider"></div>

            <div class="cs-section-title">Registration Details</div>
            <div class="cs-form-grid">
              <div class="form-group">
                <label>Registration No.</label>
                <input nz-input [(ngModel)]="companyForm.registrationNumber" placeholder="Reg. number" />
              </div>
              <div class="form-group">
                <label>GST Number</label>
                <input nz-input [(ngModel)]="companyForm.gstNumber" placeholder="GST number" />
              </div>
              <div class="form-group">
                <label>PAN Number</label>
                <input nz-input [(ngModel)]="companyForm.panNumber" placeholder="PAN number" />
              </div>
              <div class="form-group">
                <label>TAN Number</label>
                <input nz-input [(ngModel)]="companyForm.tanNumber" placeholder="TAN number" />
              </div>
              <div class="form-group">
                <label>CIN Number</label>
                <input nz-input [(ngModel)]="companyForm.cinNumber" placeholder="CIN number" />
              </div>
              <div class="form-group">
                <label>Incorporated Date</label>
                <nz-date-picker nzFormat="yyyy-MM-dd" [(ngModel)]="incorporatedDate" style="width:100%"></nz-date-picker>
              </div>
              <div class="form-group form-group-full">
                <label>Authorized Signatory</label>
                <input nz-input [(ngModel)]="companyForm.authorizedSignatory" placeholder="Signatory name" />
              </div>
            </div>
          </div>

          <!-- Right: Logo + Docs -->
          <div class="cs-right">
            <div class="cs-section-title">Company Logo</div>
            <div class="logo-section">
              <div class="logo-preview" *ngIf="logoPreviewUrl || companyForm.logoPath">
                <img [src]="logoPreviewUrl || getLogoUrl()" alt="Logo" class="logo-img" (error)="onLogoError($event)" />
              </div>
              <div class="logo-placeholder" *ngIf="!logoPreviewUrl && !companyForm.logoPath">
                <i nz-icon nzType="bank" class="placeholder-icon"></i>
                <p>No logo</p>
              </div>
              <input #logoInput type="file" accept="image/*" style="display:none" (change)="onLogoSelected($event)" />
              <button nz-button nzType="default" (click)="logoInput.click()" class="upload-btn" [nzLoading]="isLogoUploading">
                <i nz-icon nzType="upload"></i> {{ isLogoUploading ? 'Uploading...' : 'Upload Logo' }}
              </button>
              <span class="logo-hint">200x200px, PNG/JPG</span>
            </div>

            <div class="cs-divider"></div>

            <div class="cs-section-title">Legal Documents</div>
            <div class="documents-section">
              <button nz-button nzType="dashed" class="add-doc-btn" (click)="showUploadModal()">
                <i nz-icon nzType="plus"></i> Upload Document
              </button>
              <nz-table #docTable [nzData]="documents" [nzFrontPagination]="true" [nzPageSize]="5"
                nzSize="small" class="doc-table" [nzNoResult]="noDocs">
                <thead>
                  <tr>
                    <th style="width:30%">Type</th>
                    <th style="width:35%">File</th>
                    <th style="width:20%">Date</th>
                    <th style="width:15%"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let doc of docTable.data">
                    <td><nz-tag class="status-tag">{{ doc.documentType }}</nz-tag></td>
                    <td class="doc-filename">{{ doc.fileName }}</td>
                    <td class="doc-date">{{ doc.uploadedAt | date:'dd/MM/yy' }}</td>
                    <td>
                      <button nz-button nzType="link" nzSize="small" class="action-btn action-delete" (click)="deleteDocument(doc)" nz-tooltip="Delete">
                        <i nz-icon nzType="delete"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </nz-table>
              <ng-template #noDocs>
                <div class="no-docs">
                  <i nz-icon nzType="inbox"></i>
                  <p>No documents uploaded</p>
                </div>
              </ng-template>
            </div>
          </div>
        </div>
      </nz-card>
    </div>

    <!-- Upload Document Modal -->
    <nz-modal [(nzVisible)]="isUploadModalVisible" nzTitle="Upload Legal Document"
      (nzOnCancel)="closeUploadModal()" nzWidth="480px" [nzMaskClosable]="false">
      <ng-template nzModalContent>
        <div class="upload-modal-body">
          <div class="form-group">
            <label>Document Type <span class="required">*</span></label>
            <nz-select [(ngModel)]="newDocType" nzPlaceHolder="Select type" style="width:100%">
              <nz-option nzValue="GST_CERTIFICATE" nzLabel="GST Certificate"></nz-option>
              <nz-option nzValue="PAN_CARD" nzLabel="PAN Card"></nz-option>
              <nz-option nzValue="INCORPORATION" nzLabel="Incorporation Certificate"></nz-option>
              <nz-option nzValue="TAX_RETURN" nzLabel="Tax Return"></nz-option>
              <nz-option nzValue="AUDIT_REPORT" nzLabel="Audit Report"></nz-option>
              <nz-option nzValue="OTHER" nzLabel="Other"></nz-option>
            </nz-select>
          </div>
          <div class="form-group">
            <label>File <span class="required">*</span></label>
            <div class="file-upload-area" (click)="docFileInput.click()">
              <input #docFileInput type="file" style="display:none" (change)="onDocFileSelected($event)" />
              <i nz-icon nzType="upload" class="upload-area-icon"></i>
              <span>{{ newDocFileName || 'Click to select file' }}</span>
            </div>
          </div>
        </div>
      </ng-template>
      <ng-template nzModalFooter>
        <button nz-button (click)="closeUploadModal()">Cancel</button>
        <button nz-button nzType="primary" (click)="uploadDocument()" [nzLoading]="isUploading"
          [disabled]="!newDocFile || !newDocType">
          <i nz-icon nzType="upload"></i> Upload
        </button>
      </ng-template>
    </nz-modal>
  `,
  styles: [`
    :host { display: block; scroll-behavior: smooth; }
    .cs-sub-nav {
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
    .cs-nav-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 700;
      color: #1f3d6e;
    }
    .cs-nav-title i { font-size: 16px; }
    .cs-nav-actions { display: flex; gap: 6px; }
    .cs-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 8px 12px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      height: calc(100vh - 48px);
      overflow-y: auto;
      scroll-behavior: smooth;
    }
    .cs-container::-webkit-scrollbar { width: 6px; }
    .cs-container::-webkit-scrollbar-track { background: transparent; }
    .cs-container::-webkit-scrollbar-thumb { background: #d0d5dd; border-radius: 3px; }
    .cs-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 16px;
      align-items: start;
    }
    .cs-left, .cs-right { display: flex; flex-direction: column; gap: 0; }
    .cs-section-title {
      font-size: 13px;
      font-weight: 700;
      color: #1f3d6e;
      margin-bottom: 10px;
      letter-spacing: 0.3px;
    }
    .cs-divider {
      height: 1px;
      background: #e8eaed;
      margin: 16px 0;
    }
    .cs-card {
      border-radius: 8px !important;
      border: 1px solid #e8eaed !important;
      box-shadow: 0 1px 6px rgba(0,0,0,0.04) !important;
      width: 100% !important;
    }
    :host ::ng-deep .cs-card .ant-card-head {
      border-bottom: 1px solid #e8eaed !important;
      padding: 8px 14px !important;
      min-height: auto !important;
    }
    :host ::ng-deep .cs-card .ant-card-head-title {
      font-size: 13px !important;
      font-weight: 700 !important;
      color: #1f3d6e !important;
      padding: 0 !important;
    }
    :host ::ng-deep .cs-card .ant-card-body {
      padding: 14px 16px !important;
    }
    .cs-form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 16px;
    }
    .form-group { margin-bottom: 2px; }
    .form-group-full { grid-column: 1 / -1; }
    .form-group label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 4px;
      letter-spacing: 0.2px;
    }
    .required { color: #ef4444; }
    :host ::ng-deep .cs-card .ant-input,
    :host ::ng-deep .cs-card .ant-input-number,
    :host ::ng-deep .cs-card textarea,
    :host ::ng-deep .cs-card .ant-picker {
      border-radius: 6px !important;
      border: 1px solid #e2e5ea !important;
      font-size: 13px !important;
      height: 32px !important;
    }
    :host ::ng-deep .cs-card textarea { height: auto !important; }
    :host ::ng-deep .cs-card .ant-input:focus,
    :host ::ng-deep .cs-card .ant-input-number-focused,
    :host ::ng-deep .cs-card .ant-picker-focused {
      border-color: #1f3d6e !important;
      box-shadow: 0 0 0 2px rgba(31,61,110,0.1) !important;
    }

    /* Logo */
    .logo-section { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .logo-preview {
      width: 140px; height: 140px;
      border-radius: 8px; border: 1px solid #e2e5ea;
      overflow: hidden; display: flex; align-items: center; justify-content: center;
      background: #f8f9fc;
    }
    .logo-img { width: 100%; height: 100%; object-fit: contain; padding: 6px; }
    .logo-placeholder {
      width: 140px; height: 140px;
      border-radius: 8px; border: 1px dashed #e2e5ea;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 4px; background: #f8f9fc;
    }
    .placeholder-icon { font-size: 32px; color: #9ca3af; opacity: 0.5; }
    .logo-placeholder p { font-size: 10px; color: #9ca3af; margin: 0; }
    .upload-btn {
      border-radius: 6px !important;
      border-color: #4361ee !important;
      color: #4361ee !important;
      height: 32px !important;
      font-size: 12px !important;
    }
    .upload-btn:hover { border-color: #1f3d6e !important; color: #1f3d6e !important; }
    .logo-hint { font-size: 9px; color: #9ca3af; }

    /* Documents */
    .documents-section { display: flex; flex-direction: column; gap: 8px; }
    .add-doc-btn {
      width: 100% !important;
      border-radius: 6px !important;
      height: 30px !important;
      border-style: dashed !important;
      border-color: #4361ee !important;
      color: #4361ee !important;
      font-size: 11px !important;
    }
    .add-doc-btn:hover { border-color: #1f3d6e !important; color: #1f3d6e !important; }
    :host ::ng-deep .doc-table .ant-table { font-size: 12px !important; }
    :host ::ng-deep .doc-table .ant-table-thead > tr > th {
      background: #f8f9fc !important;
      color: #1f3d6e !important;
      font-size: 10px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      padding: 6px 8px !important;
      border-bottom: 1px solid #e8eaed !important;
    }
    :host ::ng-deep .doc-table .ant-table-tbody > tr > td {
      padding: 5px 8px !important;
      font-size: 11px !important;
      border-bottom: 1px solid #f0f2f5 !important;
    }
    .doc-filename { font-size: 11px; color: #374151; word-break: break-all; }
    .doc-date { font-size: 11px; color: #9ca3af; }
    .no-docs {
      display: flex; flex-direction: column; align-items: center;
      gap: 4px; padding: 16px; color: #9ca3af;
    }
    .no-docs i { font-size: 24px; opacity: 0.4; }
    .no-docs p { font-size: 11px; margin: 0; }
    .status-tag {
      font-size: 9px !important;
      padding: 0 4px !important;
      line-height: 16px !important;
      border-radius: 3px !important;
    }
    .action-btn {
      padding: 0 3px !important;
      font-size: 13px !important;
    }
    .action-delete { color: #ef4444 !important; }
    .action-delete:hover { color: #dc2626 !important; }

    /* Buttons */
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
      box-shadow: 0 2px 6px rgba(67,97,238,0.25) !important;
    }
    .btn-primary-gradient:hover {
      transform: translateY(-1px) !important;
      box-shadow: 0 3px 10px rgba(67,97,238,0.35) !important;
    }

    /* Modal */
    .upload-modal-body { display: flex; flex-direction: column; gap: 10px; padding: 4px 0; }
    .upload-modal-body .form-group label {
      display: block; font-size: 11px; font-weight: 600; color: #374151; margin-bottom: 3px;
    }
    .file-upload-area {
      display: flex; align-items: center; gap: 10px;
      padding: 12px; border: 1px dashed #e2e5ea; border-radius: 6px;
      cursor: pointer; transition: all 0.2s;
    }
    .file-upload-area:hover { border-color: #4361ee; background: rgba(67,97,238,.04); }
    .upload-area-icon { font-size: 20px; color: #4361ee; }

    @media (max-width: 900px) {
      .cs-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class CompanySetupComponent implements OnInit {
  companyForm: Company = {
    companyName: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    registrationNumber: '',
    gstNumber: '',
    panNumber: '',
    tanNumber: '',
    cinNumber: '',
    incorporatedDate: '',
    authorizedSignatory: ''
  };

  incorporatedDate: Date | null = null;
  logoPreviewUrl: string = '';
  isLogoUploading = false;
  selectedLogo?: File;
  documents: CompanyDocument[] = [];

  isSaving = false;
  isLoading = false;

  isUploadModalVisible = false;
  newDocType: string = '';
  newDocFile?: File;
  newDocFileName: string = '';
  isUploading = false;

  constructor(
    private companyService: CompanyService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.loadCompany();
    this.loadDocuments();
  }

  getLogoUrl(): string {
    if (!this.companyForm.logoPath) return '';
    return `${environment.apiUrl}/company/logo`;
  }

  onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  private loadCompany(): void {
    this.isLoading = true;
    this.companyService.getCompany().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.companyForm = { ...response.data };
          if (response.data.incorporatedDate) {
            this.incorporatedDate = new Date(response.data.incorporatedDate);
          }
        }
      },
      error: () => { this.isLoading = false; }
    });
  }

  private loadDocuments(): void {
    this.companyService.getDocuments().subscribe({
      next: (response) => {
        if (response.success) {
          this.documents = response.data || [];
        }
      },
      error: () => { this.message.error('Error loading documents'); }
    });
  }

  saveCompany(): void {
    if (!this.companyForm.companyName) {
      this.message.warning('Company name is required');
      return;
    }

    const payload: Company = {
      ...this.companyForm,
      incorporatedDate: this.incorporatedDate ? this.incorporatedDate.toISOString().split('T')[0] : undefined
    };

    this.isSaving = true;
    this.companyService.updateCompany(payload, this.selectedLogo).subscribe({
      next: (response) => {
        this.isSaving = false;
        if (response.success) {
          this.companyForm = { ...response.data };
          this.logoPreviewUrl = '';
          this.selectedLogo = undefined;
          this.message.success(response.message || 'Company updated successfully');
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.message.error(err.error?.message || 'Error saving company details');
      }
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.isLogoUploading = true;
      this.companyService.uploadLogo(file).subscribe({
        next: (response) => {
          this.isLogoUploading = false;
          if (response.success && response.data) {
            this.companyForm.logoPath = response.data.logoPath;
            this.logoPreviewUrl = '';
            this.message.success('Logo uploaded successfully');
          }
        },
        error: (err) => {
          this.isLogoUploading = false;
          this.message.error(err.error?.message || 'Error uploading logo');
        }
      });
      const reader = new FileReader();
      reader.onload = (e) => { this.logoPreviewUrl = e.target?.result as string; };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  showUploadModal(): void {
    this.newDocType = '';
    this.newDocFile = undefined;
    this.newDocFileName = '';
    this.isUploadModalVisible = true;
  }

  closeUploadModal(): void {
    this.isUploadModalVisible = false;
    this.newDocType = '';
    this.newDocFile = undefined;
    this.newDocFileName = '';
  }

  onDocFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.newDocFile = input.files[0];
      this.newDocFileName = this.newDocFile.name;
    }
    input.value = '';
  }

  uploadDocument(): void {
    if (!this.newDocFile || !this.newDocType) return;
    this.isUploading = true;
    this.companyService.uploadDocument(this.newDocFile, this.newDocType).subscribe({
      next: (response) => {
        this.isUploading = false;
        if (response.success) {
          this.message.success('Document uploaded successfully');
          this.closeUploadModal();
          this.loadDocuments();
        }
      },
      error: (err) => {
        this.isUploading = false;
        this.message.error(err.error?.message || 'Error uploading document');
      }
    });
  }

  deleteDocument(doc: CompanyDocument): void {
    this.modal.confirm({
      nzTitle: 'Delete Document',
      nzContent: `Delete "${doc.fileName}"?`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        this.companyService.deleteDocument(doc.id).subscribe({
          next: (response) => {
            this.message.success(response.message || 'Deleted');
            this.loadDocuments();
          },
          error: (err) => { this.message.error(err.error?.message || 'Error deleting'); }
        });
      }
    });
  }
}
