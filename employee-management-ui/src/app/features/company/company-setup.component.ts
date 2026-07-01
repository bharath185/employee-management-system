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

import { CompanyService } from '../../core/services/company.service';
import { Company, CompanyDocument } from '../../core/models/company.model';
import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-company-setup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzModalModule,
    NzTableModule,
    NzTagModule,
    NzDividerModule,
    NzSelectModule,
    NzDatePickerModule,
    PageHeaderComponent
  ],
  template: `
    <div class="company-setup-container">
      <app-page-header icon="bank" title="Company Setup" subtitle="Manage your organization profile and legal documents"
        [breadcrumbs]="[{label: 'Dashboard', link: '/admin/dashboard'}, {label: 'Company Setup'}]">
        <button nz-button nzType="primary" (click)="saveCompany()" [nzLoading]="isSaving" [disabled]="!companyForm.companyName">
          <i nz-icon nzType="save"></i> Save
        </button>
      </app-page-header>

      <div nz-row nzGutter="12">
        <!-- Left Column: Logo + Company Info -->
        <div nz-col nzXs="24" nzLg="16">
          <!-- Company Info Card -->
          <nz-card class="setup-card" nzTitle="Company Information" nzBorderless>
            <div class="card-body">
              <div nz-row nzGutter="16">
                <div nz-col nzXs="24" nzMd="12">
                  <div class="form-group">
                    <label class="form-label">Company Name <span class="required">*</span></label>
                    <input nz-input [(ngModel)]="companyForm.companyName" placeholder="Enter company name" />
                  </div>
                </div>
                <div nz-col nzXs="24" nzMd="12">
                  <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input nz-input [(ngModel)]="companyForm.phone" placeholder="Enter phone number" />
                  </div>
                </div>
                <div nz-col nzXs="24" nzMd="12">
                  <div class="form-group">
                    <label class="form-label">Email</label>
                    <input nz-input [(ngModel)]="companyForm.email" placeholder="Enter email address" type="email" />
                  </div>
                </div>
                <div nz-col nzXs="24" nzMd="12">
                  <div class="form-group">
                    <label class="form-label">Website</label>
                    <input nz-input [(ngModel)]="companyForm.website" placeholder="Enter website URL" />
                  </div>
                </div>
                <div nz-col nzSpan="24">
                  <div class="form-group">
                    <label class="form-label">Address</label>
                    <textarea nz-input [(ngModel)]="companyForm.address" placeholder="Enter company address" rows="2"></textarea>
                  </div>
                </div>
              </div>
            </div>
          </nz-card>

          <!-- Registration Details Card -->
          <nz-card class="setup-card" nzTitle="Registration Details" nzBorderless>
            <div class="card-body">
              <div nz-row nzGutter="16">
                <div nz-col nzXs="24" nzMd="12">
                  <div class="form-group">
                    <label class="form-label">Registration Number</label>
                    <input nz-input [(ngModel)]="companyForm.registrationNumber" placeholder="Enter registration number" />
                  </div>
                </div>
                <div nz-col nzXs="24" nzMd="12">
                  <div class="form-group">
                    <label class="form-label">GST Number</label>
                    <input nz-input [(ngModel)]="companyForm.gstNumber" placeholder="Enter GST number" />
                  </div>
                </div>
                <div nz-col nzXs="24" nzMd="12">
                  <div class="form-group">
                    <label class="form-label">PAN Number</label>
                    <input nz-input [(ngModel)]="companyForm.panNumber" placeholder="Enter PAN number" />
                  </div>
                </div>
                <div nz-col nzXs="24" nzMd="12">
                  <div class="form-group">
                    <label class="form-label">TAN Number</label>
                    <input nz-input [(ngModel)]="companyForm.tanNumber" placeholder="Enter TAN number" />
                  </div>
                </div>
                <div nz-col nzXs="24" nzMd="12">
                  <div class="form-group">
                    <label class="form-label">CIN Number</label>
                    <input nz-input [(ngModel)]="companyForm.cinNumber" placeholder="Enter CIN number" />
                  </div>
                </div>
                <div nz-col nzXs="24" nzMd="12">
                  <div class="form-group">
                    <label class="form-label">Incorporated Date</label>
                    <nz-date-picker nzShowTime nzFormat="yyyy-MM-dd" [(ngModel)]="incorporatedDate"
                      style="width:100%"></nz-date-picker>
                  </div>
                </div>
                <div nz-col nzSpan="24">
                  <div class="form-group">
                    <label class="form-label">Authorized Signatory</label>
                    <input nz-input [(ngModel)]="companyForm.authorizedSignatory" placeholder="Enter authorized signatory name" />
                  </div>
                </div>
              </div>
            </div>
          </nz-card>
        </div>

        <!-- Right Column: Logo + Documents -->
        <div nz-col nzXs="24" nzLg="8">
          <!-- Company Logo Card -->
          <nz-card class="setup-card" nzTitle="Company Logo" nzBorderless>
            <div class="logo-section">
              <div class="logo-preview" *ngIf="logoPreviewUrl || companyForm.logoPath">
                <img [src]="logoPreviewUrl || getLogoUrl()" alt="Company Logo" class="logo-img"
                     (error)="onLogoError($event)" />
              </div>
              <div class="logo-placeholder" *ngIf="!logoPreviewUrl && !companyForm.logoPath">
                <i nz-icon nzType="bank" class="placeholder-icon"></i>
                <p>No logo uploaded</p>
              </div>
              <div class="logo-actions">
                <input #logoInput type="file" accept="image/*" style="display:none" (change)="onLogoSelected($event)" />
                <button nz-button nzType="default" (click)="logoInput.click()" class="upload-btn" [nzLoading]="isLogoUploading">
                  <i nz-icon nzType="upload"></i> {{ isLogoUploading ? 'Uploading...' : 'Upload Logo' }}
                </button>
                <p class="logo-hint">Recommended: 200x200px, PNG or JPG</p>
              </div>
            </div>
          </nz-card>

          <!-- Legal Documents Card -->
          <nz-card class="setup-card" nzTitle="Legal Documents" nzBorderless>
            <div class="documents-section">
              <button nz-button nzType="dashed" class="add-doc-btn" (click)="showUploadModal()">
                <i nz-icon nzType="plus"></i> Upload Document
              </button>

              <nz-table #docTable [nzData]="documents" [nzFrontPagination]="true" [nzPageSize]="5"
                nzSize="small" class="doc-table" [nzNoResult]="noDocs">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>File</th>
                    <th>Date</th>
                    <th nzWidth="50px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let doc of docTable.data">
                    <td><nz-tag>{{ doc.documentType }}</nz-tag></td>
                    <td><span class="doc-filename">{{ doc.fileName }}</span></td>
                    <td><span class="doc-date">{{ doc.uploadedAt | date:'mediumDate' }}</span></td>
                    <td>
                      <button nz-button nzType="text" nzDanger nzSize="small" (click)="deleteDocument(doc)"
                        nz-tooltip="Delete">
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
          </nz-card>
        </div>
      </div>
    </div>

    <!-- Upload Document Modal -->
    <nz-modal [(nzVisible)]="isUploadModalVisible" nzTitle="Upload Legal Document"
      (nzOnCancel)="closeUploadModal()" nzWidth="480px" [nzMaskClosable]="false">
      <ng-template nzModalContent>
        <div class="upload-modal-body">
          <div class="form-group">
            <label class="form-label">Document Type <span class="required">*</span></label>
            <nz-select [(ngModel)]="newDocType" nzPlaceHolder="Select document type" style="width:100%">
              <nz-option nzValue="GST_CERTIFICATE" nzLabel="GST Certificate"></nz-option>
              <nz-option nzValue="PAN_CARD" nzLabel="PAN Card"></nz-option>
              <nz-option nzValue="INCORPORATION" nzLabel="Incorporation Certificate"></nz-option>
              <nz-option nzValue="TAX_RETURN" nzLabel="Tax Return"></nz-option>
              <nz-option nzValue="AUDIT_REPORT" nzLabel="Audit Report"></nz-option>
              <nz-option nzValue="OTHER" nzLabel="Other"></nz-option>
            </nz-select>
          </div>
          <div class="form-group">
            <label class="form-label">File <span class="required">*</span></label>
            <div class="file-upload-area" (click)="docFileInput.click()">
              <input #docFileInput type="file" style="display:none" (change)="onDocFileSelected($event)" />
              <i nz-icon nzType="upload" class="upload-area-icon"></i>
              <span>{{ newDocFileName || 'Click to select file' }}</span>
            </div>
          </div>
        </div>
      </ng-template>
      <ng-template nzModalFooter>
        <button nz-button nzType="default" (click)="closeUploadModal()">Cancel</button>
        <button nz-button nzType="primary" (click)="uploadDocument()" [nzLoading]="isUploading"
          [disabled]="!newDocFile || !newDocType">
          <i nz-icon nzType="upload"></i> Upload
        </button>
      </ng-template>
    </nz-modal>
  `,
  styles: [`
    :host { display: block; }
    .company-setup-container { width: 100%; padding: 12px; box-sizing: border-box; }

    .setup-card { margin-bottom: 12px; border-radius: var(--radius-lg); border: 1px solid var(--color-border-light); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .setup-card .ant-card-head { border-bottom: 1px solid var(--color-border-light); padding: 12px 16px; min-height: auto; }
    .setup-card .ant-card-head-title { font-size: 15px; font-weight: 700; color: #1f3d6e; }
    .setup-card .ant-card-body { padding: 16px; }

    .card-body { max-width: 100%; }

    .form-group { margin-bottom: 8px; }
    .form-label { display: block; font-size: 13px; font-weight: 600; color: #333; margin-bottom: 6px; }
    .form-label .required { color: #ff4d4f; }

    .logo-section { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .logo-preview { width: 160px; height: 160px; border-radius: var(--radius-lg); border: 2px dashed var(--color-border-light); overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f8f9fc; }
    .logo-img { width: 100%; height: 100%; object-fit: contain; padding: 8px; }
    .logo-placeholder { width: 160px; height: 160px; border-radius: var(--radius-lg); border: 2px dashed var(--color-border-light); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; background: #f8f9fc; }
    .placeholder-icon { font-size: 48px; color: var(--color-text-muted); opacity: 0.5; }
    .logo-placeholder p { font-size: 12px; color: var(--color-text-muted); margin: 0; }
    .logo-actions { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .upload-btn { border-radius: var(--radius-md); border-color: #4361ee; color: #4361ee; }
    .upload-btn:hover { border-color: #1f3d6e; color: #1f3d6e; }
    .logo-hint { font-size: 11px; color: var(--color-text-muted); margin: 0; text-align: center; }

    .documents-section { display: flex; flex-direction: column; gap: 12px; }
    .add-doc-btn { width: 100%; border-radius: var(--radius-md); height: 40px; border-style: dashed; border-color: #4361ee; color: #4361ee; }
    .add-doc-btn:hover { border-color: #1f3d6e; color: #1f3d6e; }
    .doc-table { width: 100%; }
    .doc-filename { font-size: 12px; color: #444; word-break: break-all; }
    .doc-date { font-size: 11px; color: #888; }
    .no-docs { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px; }
    .no-docs i { font-size: 32px; color: var(--color-text-muted); opacity: 0.4; }
    .no-docs p { font-size: 13px; color: var(--color-text-muted); margin: 0; }

    .upload-modal-body { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
    .file-upload-area { display: flex; align-items: center; gap: 12px; padding: 16px; border: 2px dashed var(--color-border-light); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s; }
    .file-upload-area:hover { border-color: #4361ee; background: rgba(67,97,238,.06); }
    .upload-area-icon { font-size: 24px; color: #4361ee; }

    /* Modal theme */
    ::ng-deep .ant-modal-header { padding: 16px 24px; border-bottom: 1px solid var(--color-border-light); }
    ::ng-deep .ant-modal-title { font-size: 16px; font-weight: 700; color: #1f3d6e; }
    ::ng-deep .ant-modal-footer { padding: 12px 24px; border-top: 1px solid var(--color-border-light); }

    @media (max-width: 768px) {
      .company-setup-container { padding: 8px; }
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
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private loadDocuments(): void {
    this.companyService.getDocuments().subscribe({
      next: (response) => {
        if (response.success) {
          this.documents = response.data || [];
        }
      },
      error: () => {
        this.message.error('Error loading documents');
      }
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
      // Show local preview immediately while uploading
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreviewUrl = e.target?.result as string;
      };
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

  isUploading = false;

  deleteDocument(doc: CompanyDocument): void {
    this.modal.confirm({
      nzTitle: 'Delete Document',
      nzContent: `Are you sure you want to delete "${doc.fileName}"?`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        this.companyService.deleteDocument(doc.id).subscribe({
          next: (response) => {
            this.message.success(response.message || 'Document deleted successfully');
            this.loadDocuments();
          },
          error: (err) => {
            this.message.error(err.error?.message || 'Error deleting document');
          }
        });
      }
    });
  }
}
