import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzTableModule } from 'ng-zorro-antd/table';

import { DocumentTemplateService } from '../../core/services/document-template.service';
import { DocumentTemplate, TEMPLATE_PLACEHOLDERS } from '../../core/models/document-template.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TemplatePreviewModalComponent } from './template-preview-modal.component';

@Component({
  selector: 'app-document-template-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzSwitchModule,
    NzModalModule,
    NzTagModule,
    NzDividerModule,
    NzToolTipModule,
    NzCollapseModule,
    NzTableModule,
    PageHeaderComponent,
    TemplatePreviewModalComponent
  ],
  template: `
    <div class="template-form-container">
      <app-page-header [icon]="isEditMode ? 'edit' : 'file-text'"
        [title]="isEditMode ? 'Edit Template' : 'New Template'"
        [subtitle]="isEditMode ? 'Modify the document template' : 'Create a new document template'"
        [breadcrumbs]="[
          {label: 'Dashboard', link: '/admin/dashboard'},
          {label: 'Document Templates', link: '/admin/document-templates'},
          {label: isEditMode ? 'Edit' : 'New'}
        ]">
        <button nz-button (click)="goBack()">
          <i nz-icon nzType="close"></i> Cancel
        </button>
        <button nz-button nzType="primary" (click)="saveTemplate()" [nzLoading]="isSaving"
          [disabled]="!form.templateName || !form.templateType">
          <i nz-icon nzType="save"></i> {{ isEditMode ? 'Update' : 'Create' }}
        </button>
      </app-page-header>

      <div nz-row nzGutter="24">
        <div nz-col nzXs="24" nzLg="16">
          <!-- Main Form Card -->
          <nz-card class="form-card" nzBorderless>
            <div class="card-body">
              <div nz-row nzGutter="16">
                <div nz-col nzXs="24" nzMd="12">
                  <div class="form-group">
                    <label class="form-label">Template Name <span class="required">*</span></label>
                    <input nz-input [(ngModel)]="form.templateName" placeholder="e.g. Offer Letter" />
                  </div>
                </div>
                <div nz-col nzXs="24" nzMd="12">
                  <div class="form-group">
                    <label class="form-label">Template Type <span class="required">*</span></label>
                    <nz-select [(ngModel)]="form.templateType" nzPlaceHolder="Select type" style="width:100%">
                      <nz-option *ngFor="let t of typeOptions" [nzValue]="t.code" [nzLabel]="t.display"></nz-option>
                    </nz-select>
                  </div>
                </div>
                <div nz-col nzSpan="24">
                  <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea nz-input [(ngModel)]="form.description" placeholder="Brief description of this template"
                      rows="2"></textarea>
                  </div>
                </div>
                <div nz-col nzSpan="24">
                  <div class="form-group">
                    <label class="form-label">Content <span class="required">*</span></label>
                    <div class="content-editor-wrapper">
                      <textarea nz-input [(ngModel)]="form.content" placeholder="Enter template HTML content with {{placeholders}}..."
                        rows="18" class="content-editor"></textarea>
                    </div>
                  </div>
                </div>
                <div nz-col nzSpan="24">
                  <div class="form-group">
                    <label class="form-label">
                      Active
                      <nz-switch [(ngModel)]="form.active" class="active-switch"></nz-switch>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </nz-card>
        </div>

        <div nz-col nzXs="24" nzLg="8">
          <!-- Actions Card -->
          <nz-card class="form-card" nzTitle="Actions" nzBorderless>
            <div class="actions-section">
              <button nz-button nzType="primary" class="action-btn" (click)="saveTemplate()"
                [nzLoading]="isSaving" [disabled]="!form.templateName || !form.templateType">
                <i nz-icon nzType="save"></i> {{ isEditMode ? 'Update' : 'Create' }}
              </button>
              <button nz-button nzType="default" class="action-btn" (click)="showPreview()"
                [disabled]="!form.content">
                <i nz-icon nzType="eye"></i> Preview
              </button>
              <button nz-button nzType="default" class="action-btn" (click)="goBack()">
                <i nz-icon nzType="close"></i> Cancel
              </button>
            </div>
          </nz-card>

          <!-- Placeholders Reference Card -->
          <nz-card class="form-card" nzTitle="Available Placeholders" nzBorderless>
            <nz-collapse nzAccordion>
              <nz-collapse-panel nzHeader="Employee Placeholders" nzActive="true">
                <div class="placeholder-item" *ngFor="let ph of placeholders.employee">
                  <code class="placeholder-code">{{ ph.key }}</code>
                  <span class="placeholder-desc">{{ ph.desc }}</span>
                </div>
              </nz-collapse-panel>
              <nz-collapse-panel nzHeader="Company Placeholders">
                <div class="placeholder-item" *ngFor="let ph of placeholders.company">
                  <code class="placeholder-code">{{ ph.key }}</code>
                  <span class="placeholder-desc">{{ ph.desc }}</span>
                </div>
              </nz-collapse-panel>
              <nz-collapse-panel nzHeader="System Placeholders">
                <div class="placeholder-item" *ngFor="let ph of placeholders.system">
                  <code class="placeholder-code">{{ ph.key }}</code>
                  <span class="placeholder-desc">{{ ph.desc }}</span>
                </div>
              </nz-collapse-panel>
            </nz-collapse>
          </nz-card>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <app-template-preview-modal
      [(visible)]="isPreviewVisible"
      [templateId]="editId"
      [templateContent]="form.content">
    </app-template-preview-modal>
  `,
  styles: [`
    :host { display: block; }
    .template-form-container { max-width: 1400px; margin: 0 auto; }

    .form-card { margin-bottom: 24px; border-radius: var(--radius-lg); border: 1px solid var(--color-border-light); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .form-card .ant-card-head { border-bottom: 1px solid var(--color-border-light); padding: 16px 20px; min-height: auto; }
    .form-card .ant-card-head-title { font-size: 15px; font-weight: 700; color: var(--color-primary-500); }
    .form-card .ant-card-body { padding: 20px; }

    .form-group { margin-bottom: 20px; }
    .form-label { display: block; font-size: 13px; font-weight: 600; color: #333; margin-bottom: 6px; }
    .form-label .required { color: #ff4d4f; }

    .active-switch { margin-left: 12px; }

    .content-editor-wrapper { border: 1px solid #d9d9d9; border-radius: var(--radius-md); overflow: hidden; }
    .content-editor {
      font-family: 'Cascadia Code', 'Consolas', 'Monaco', 'Courier New', monospace !important;
      font-size: 13px !important;
      line-height: 1.6 !important;
      border: none !important;
      border-radius: 0 !important;
      resize: vertical;
      background: #1e1e2e !important;
      color: #cdd6f4 !important;
      tab-size: 2;
    }
    .content-editor:focus { box-shadow: none !important; }

    .actions-section { display: flex; flex-direction: column; gap: 10px; }
    .action-btn { width: 100%; border-radius: var(--radius-md); }

    .placeholder-item { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid #f0f2f5; }
    .placeholder-item:last-child { border-bottom: none; }
    .placeholder-code {
      font-family: 'Cascadia Code', 'Consolas', monospace;
      font-size: 11px;
      background: #f0f4ff;
      color: var(--color-primary-500);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .placeholder-desc { font-size: 12px; color: #666; }

    @media (max-width: 768px) {
      .template-form-container { padding: 0; }
    }
  `]
})
export class DocumentTemplateFormComponent implements OnInit {
  isEditMode = false;
  editId: number | null = null;
  isSaving = false;

  form: DocumentTemplate = {
    templateName: '',
    templateType: '',
    description: '',
    content: '',
    active: true
  };

  typeOptions: {code: string; display: string}[] = [];
  placeholders = TEMPLATE_PLACEHOLDERS;

  isPreviewVisible = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private templateService: DocumentTemplateService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.loadTypes();
    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      this.isEditMode = true;
      this.editId = +idParam;
      this.loadTemplate(this.editId);
    }
  }

  private loadTypes(): void {
    this.templateService.getTemplateTypes().subscribe({
      next: (response) => {
        if (response.success) {
          this.typeOptions = response.data || [];
        }
      }
    });
  }

  private loadTemplate(id: number): void {
    this.templateService.getTemplateById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.form = { ...response.data };
        }
      },
      error: () => {
        this.message.error('Error loading template');
        this.router.navigate(['/admin/document-templates']);
      }
    });
  }

  saveTemplate(): void {
    if (!this.form.templateName || !this.form.templateType) {
      this.message.warning('Please fill in all required fields');
      return;
    }

    this.isSaving = true;

    if (this.isEditMode && this.editId) {
      this.templateService.updateTemplate(this.editId, this.form).subscribe({
        next: (response) => {
          this.isSaving = false;
          if (response.success) {
            this.message.success('Template updated successfully');
            this.router.navigate(['/admin/document-templates']);
          }
        },
        error: (err) => {
          this.isSaving = false;
          this.message.error(err.error?.message || 'Error updating template');
        }
      });
    } else {
      this.templateService.createTemplate(this.form).subscribe({
        next: (response) => {
          this.isSaving = false;
          if (response.success) {
            this.message.success('Template created successfully');
            this.router.navigate(['/admin/document-templates']);
          }
        },
        error: (err) => {
          this.isSaving = false;
          this.message.error(err.error?.message || 'Error creating template');
        }
      });
    }
  }

  showPreview(): void {
    if (!this.form.content) {
      this.message.warning('Add template content before previewing');
      return;
    }
    this.isPreviewVisible = true;
  }

  goBack(): void {
    this.router.navigate(['/admin/document-templates']);
  }
}
