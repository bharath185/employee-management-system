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
import { DocumentTemplate, TEMPLATE_PLACEHOLDERS, DOCUMENT_TEMPLATE_TYPES } from '../../core/models/document-template.model';
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
    <div class="template-form-container page-enter">
      <!-- Standard Sub Navigation Bar -->
      <div class="pp-sub-nav">
        <a class="pp-nav-item" [routerLink]="['/admin/documents']" [queryParams]="{ tab: 'templates' }">
          <i nz-icon nzType="arrow-left"></i><span>Back to Document Hub (Templates)</span>
        </a>
        <span class="pp-nav-item active">
          <i nz-icon nzType="file-text"></i><span>{{ isEditMode ? 'Edit Letter Template' : 'New Letter Template' }}</span>
        </span>
      </div>

      <div nz-row nzGutter="12" class="form-main-row">
        <!-- LEFT COLUMN: TEMPLATE DETAILS & CODE EDITOR -->
        <div nz-col nzXs="24" nzLg="16" class="form-col-left">
          <!-- Main Form Card -->
          <nz-card class="form-card main-editor-card" [nzTitle]="formCardTitle" nzSize="small">
            <ng-template #formCardTitle>
              <div class="card-header-flex">
                <span class="card-title-text"><i nz-icon nzType="edit"></i> Template Details & Letter Editor</span>
                <span class="card-sub-tag" *ngIf="isEditMode">ID #{{ editId }}</span>
              </div>
            </ng-template>

            <div class="form-card-inner">
              <!-- Top Metadata Row -->
              <div nz-row nzGutter="10" class="meta-row">
                <div nz-col nzXs="24" nzMd="14">
                  <div class="form-group-compact">
                    <label class="dh-field-label">Template Name <span class="required">*</span></label>
                    <input nz-input [(ngModel)]="form.templateName" placeholder="e.g. Standard Offer Letter" class="form-input-compact" />
                  </div>
                </div>
                <div nz-col nzXs="24" nzMd="10">
                  <div class="form-group-compact">
                    <label class="dh-field-label">Template Type <span class="required">*</span></label>
                    <nz-select [(ngModel)]="form.templateType" nzPlaceHolder="Select letter type" nzShowSearch class="form-select-compact" style="width:100%">
                      <nz-option *ngFor="let t of typeOptions" [nzValue]="t.code" [nzLabel]="t.display"></nz-option>
                    </nz-select>
                  </div>
                </div>
                <div nz-col nzSpan="24">
                  <div class="form-group-compact">
                    <label class="dh-field-label">Description</label>
                    <input nz-input [(ngModel)]="form.description" placeholder="Brief description of this letter template..." class="form-input-compact" />
                  </div>
                </div>
              </div>

              <!-- Center HTML Editor (Takes full available height) -->
              <div class="editor-section">
                <div class="label-with-hint">
                  <label class="dh-field-label"><i nz-icon nzType="code"></i> HTML Content / Letter Body <span class="required">*</span></label>
                  <span class="editor-hint"><i nz-icon nzType="info-circle"></i> Click placeholders on the right to copy them into the editor</span>
                </div>
                <div class="content-editor-wrapper">
                  <textarea nz-input [(ngModel)]="form.content" placeholder="Enter template HTML content with placeholders like [employee_name], [designation]..."
                    class="content-editor"></textarea>
                </div>
              </div>

              <!-- Bottom Status Switch Bar -->
              <div class="status-switch-row">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="dh-field-label" style="margin-bottom:0;">Active Status:</span>
                  <nz-switch [(ngModel)]="form.active" nzSize="small" class="active-switch"></nz-switch>
                  <span class="switch-status-label" [class.active-text]="form.active">{{ form.active ? 'Active (Ready for PDF Generation)' : 'Inactive' }}</span>
                </div>
                <span class="char-count" *ngIf="form.content">
                  {{ form.content.length }} characters
                </span>
              </div>
            </div>
          </nz-card>
        </div>

        <!-- RIGHT COLUMN: ACTIONS & PLACEHOLDERS -->
        <div nz-col nzXs="24" nzLg="8" class="form-col-right">
          <!-- Actions Card -->
          <nz-card class="form-card actions-card" nzTitle="Actions" nzSize="small">
            <div class="actions-section">
              <button nz-button class="btn-primary-gradient" style="width:100%; justify-content:center;" (click)="saveTemplate()"
                [nzLoading]="isSaving" [disabled]="!form.templateName || !form.templateType">
                <i nz-icon nzType="save"></i> {{ isEditMode ? 'Update Template' : 'Save & Publish Template' }}
              </button>
              <div class="actions-sub-grid">
                <button nz-button nzType="default" class="preview-btn" (click)="showPreview()"
                  [disabled]="!form.content">
                  <i nz-icon nzType="eye"></i> Live PDF Preview
                </button>
                <button nz-button nzType="default" class="cancel-btn" (click)="goBack()">
                  <i nz-icon nzType="close"></i> Cancel
                </button>
              </div>
            </div>
          </nz-card>

          <!-- Placeholders Reference Card (Fills remaining height with internal scroll) -->
          <nz-card class="form-card ph-card" [nzTitle]="phCardTitle" nzSize="small">
            <ng-template #phCardTitle>
              <span class="card-title-text"><i nz-icon nzType="tags"></i> Available Placeholders</span>
            </ng-template>

            <div class="ph-card-inner">
              <div class="ph-search-box">
                <nz-input-group [nzPrefix]="phIcon">
                  <input nz-input [(ngModel)]="placeholderSearch" placeholder="Search placeholders (e.g. name, date, salary)..." class="ph-input" />
                </nz-input-group>
                <ng-template #phIcon><i nz-icon nzType="search" style="color: #94a3b8;"></i></ng-template>
              </div>

              <div class="ph-collapse-wrapper">
                <nz-collapse nzAccordion class="dh-collapse">
                  <nz-collapse-panel [nzHeader]="'Employee Placeholders (' + filteredEmployeePlaceholders.length + ')'" nzActive="true">
                    <div class="placeholder-item" *ngFor="let ph of filteredEmployeePlaceholders" (click)="copyPlaceholder(ph.key)" [nz-tooltip]="'Click to copy ' + ph.key">
                      <code class="placeholder-code">{{ ph.key }}</code>
                      <span class="placeholder-desc">{{ ph.desc }}</span>
                    </div>
                    <div *ngIf="filteredEmployeePlaceholders.length === 0" class="ph-empty">No matching employee placeholders</div>
                  </nz-collapse-panel>

                  <nz-collapse-panel [nzHeader]="'Company Placeholders (' + filteredCompanyPlaceholders.length + ')'">
                    <div class="placeholder-item" *ngFor="let ph of filteredCompanyPlaceholders" (click)="copyPlaceholder(ph.key)" [nz-tooltip]="'Click to copy ' + ph.key">
                      <code class="placeholder-code">{{ ph.key }}</code>
                      <span class="placeholder-desc">{{ ph.desc }}</span>
                    </div>
                    <div *ngIf="filteredCompanyPlaceholders.length === 0" class="ph-empty">No matching company placeholders</div>
                  </nz-collapse-panel>

                  <nz-collapse-panel [nzHeader]="'System Placeholders (' + filteredSystemPlaceholders.length + ')'">
                    <div class="placeholder-item" *ngFor="let ph of filteredSystemPlaceholders" (click)="copyPlaceholder(ph.key)" [nz-tooltip]="'Click to copy ' + ph.key">
                      <code class="placeholder-code">{{ ph.key }}</code>
                      <span class="placeholder-desc">{{ ph.desc }}</span>
                    </div>
                    <div *ngIf="filteredSystemPlaceholders.length === 0" class="ph-empty">No matching system placeholders</div>
                  </nz-collapse-panel>
                </nz-collapse>
              </div>
            </div>
          </nz-card>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <app-template-preview-modal
      [(visible)]="isPreviewVisible"
      [templateId]="editId"
      [templateName]="form.templateName"
      [templateContent]="form.content">
    </app-template-preview-modal>
  `,
  styles: [`
    @keyframes page-enter {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .template-form-container.page-enter {
      animation: page-enter 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    .template-form-container {
      width: 100%;
      height: calc(100vh - 54px);
      min-height: 0;
      padding: 10px 14px 12px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 8px;
      overflow: hidden;
      background: linear-gradient(135deg, #f0f4ff 0%, #f8fafc 50%, #edf2f7 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* GLASSY SUB NAVIGATION BAR */
    .pp-sub-nav {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.78);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-radius: 10px;
      padding: 6px 14px;
      border: 1px solid rgba(255, 255, 255, 0.85);
      box-shadow: 0 4px 20px 0 rgba(31, 38, 135, 0.05);
      flex-shrink: 0;
    }
    .pp-nav-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-decoration: none;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .pp-nav-item:hover { background: #f1f5f9; color: #1e3a8a; }
    .pp-nav-item.active {
      background: rgba(239, 246, 255, 0.9);
      color: #1e40af;
      border: 1px solid rgba(191, 219, 254, 0.8);
    }

    /* MAIN FLEX ROW */
    .form-main-row {
      flex: 1;
      min-height: 0;
      height: 100%;
      display: flex;
    }
    .form-col-left {
      height: 100%;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .form-col-right {
      height: 100%;
      display: flex;
      flex-direction: column;
      min-height: 0;
      gap: 8px;
    }

    /* GLASSY FORM CARDS */
    .form-card {
      border-radius: 12px !important;
      border: 1px solid rgba(255, 255, 255, 0.85) !important;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.06) !important;
      background: rgba(255, 255, 255, 0.85) !important;
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      margin-bottom: 0 !important;
    }
    .main-editor-card {
      flex: 1;
      min-height: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    :host ::ng-deep .main-editor-card > .ant-card-body {
      flex: 1;
      min-height: 0;
      height: 100%;
      padding: 10px 14px !important;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .form-card-inner {
      flex: 1;
      min-height: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    :host ::ng-deep .form-card .ant-card-head {
      background: rgba(248, 250, 252, 0.65) !important;
      border-bottom: 1px solid rgba(226, 232, 240, 0.85) !important;
      padding: 8px 14px !important;
      min-height: auto !important;
    }
    .card-header-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .card-title-text {
      font-size: 12.5px;
      font-weight: 700;
      color: #1e3a8a;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .card-sub-tag {
      font-size: 10.5px;
      color: #2563eb;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 1px 6px;
      border-radius: 4px;
      font-weight: 600;
    }

    .meta-row { flex-shrink: 0; }
    .form-group-compact { margin-bottom: 6px; }

    .dh-field-label {
      font-size: 10.5px;
      font-weight: 700;
      color: #1e3a8a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .dh-field-label .required { color: #ef4444; }

    :host ::ng-deep .form-input-compact,
    :host ::ng-deep .form-select-compact .ant-select-selector {
      border-radius: 6px !important;
      border: 1px solid #cbd5e1 !important;
      background: rgba(255, 255, 255, 0.95) !important;
      height: 30px !important;
      font-size: 12px !important;
    }
    :host ::ng-deep .form-input-compact:hover,
    :host ::ng-deep .form-select-compact .ant-select-selector:hover {
      border-color: #2563eb !important;
    }

    /* EDITOR SECTION (FILLS REMAINING HEIGHT) */
    .editor-section {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      margin-bottom: 2px;
    }
    .label-with-hint {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
      flex-shrink: 0;
    }
    .editor-hint {
      font-size: 10.5px;
      color: #64748b;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .content-editor-wrapper {
      flex: 1;
      min-height: 0;
      height: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      display: flex;
    }
    .content-editor {
      flex: 1;
      min-height: 0;
      height: 100% !important;
      width: 100%;
      font-family: 'Cascadia Code', 'Consolas', 'Monaco', 'Courier New', monospace !important;
      font-size: 12px !important;
      line-height: 1.5 !important;
      border: none !important;
      border-radius: 0 !important;
      resize: none !important;
      background: #0f172a !important;
      color: #e2e8f0 !important;
      padding: 10px 12px !important;
      tab-size: 2;
      box-sizing: border-box;
      overflow-y: auto !important;
    }
    .content-editor:focus { box-shadow: none !important; }

    /* STATUS SWITCH ROW */
    .status-switch-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(248, 250, 252, 0.85);
      backdrop-filter: blur(6px);
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid rgba(226, 232, 240, 0.85);
      flex-shrink: 0;
    }
    .switch-status-label {
      font-size: 11.5px;
      font-weight: 600;
      color: #94a3b8;
    }
    .switch-status-label.active-text { color: #16a34a; }
    .char-count { font-size: 11px; color: #94a3b8; }

    /* RIGHT COLUMN: ACTIONS & PLACEHOLDERS */
    .actions-card { flex-shrink: 0; }
    :host ::ng-deep .actions-card > .ant-card-body { padding: 8px 12px !important; }
    .actions-section { display: flex; flex-direction: column; gap: 6px; }
    .actions-sub-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }

    .btn-primary-gradient {
      height: 32px !important;
      padding: 0 14px !important;
      font-size: 12.5px !important;
      font-weight: 600 !important;
      border: none !important;
      border-radius: 6px !important;
      background: linear-gradient(135deg, #2563eb, #1e40af) !important;
      color: #fff !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      transition: all 0.2s ease !important;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25) !important;
    }
    .btn-primary-gradient:hover {
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35) !important;
    }

    .cancel-btn, .preview-btn {
      height: 30px !important;
      padding: 0 10px !important;
      font-size: 11.5px !important;
      font-weight: 600 !important;
      border-radius: 6px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 5px !important;
      border: 1px solid #cbd5e1 !important;
      color: #475569 !important;
      background: rgba(248, 250, 252, 0.9) !important;
      backdrop-filter: blur(4px);
      transition: all 0.2s ease !important;
    }
    .cancel-btn:hover, .preview-btn:hover {
      background: #f1f5f9 !important;
      color: #1e293b !important;
      border-color: #94a3b8 !important;
    }

    /* PLACEHOLDERS CARD (FILLS REMAINING HEIGHT) */
    .ph-card {
      flex: 1;
      min-height: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    :host ::ng-deep .ph-card > .ant-card-body {
      flex: 1;
      min-height: 0;
      height: 100%;
      padding: 8px 10px !important;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .ph-card-inner {
      flex: 1;
      min-height: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .ph-search-box { flex-shrink: 0; }
    :host ::ng-deep .ph-input {
      border-radius: 6px !important;
      font-size: 11px !important;
      height: 28px !important;
      border: 1px solid #cbd5e1 !important;
    }

    .ph-collapse-wrapper {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }
    .ph-collapse-wrapper::-webkit-scrollbar { width: 5px; }
    .ph-collapse-wrapper::-webkit-scrollbar-thumb {
      background: rgba(30, 58, 138, 0.18);
      border-radius: 3px;
    }

    :host ::ng-deep .dh-collapse .ant-collapse-header {
      padding: 6px 10px !important;
      font-size: 11.5px !important;
      font-weight: 600 !important;
      color: #1e3a8a !important;
    }
    :host ::ng-deep .dh-collapse .ant-collapse-content-box {
      padding: 4px 8px !important;
    }

    .placeholder-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 4px;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.15s ease;
    }
    .placeholder-item:hover {
      background: #eff6ff;
    }
    .placeholder-item:last-child { border-bottom: none; }
    .placeholder-code {
      font-family: 'Cascadia Code', 'Consolas', monospace;
      font-size: 10.5px;
      font-weight: 600;
      background: #eff6ff;
      color: #1e40af;
      padding: 1px 6px;
      border-radius: 4px;
      white-space: nowrap;
      flex-shrink: 0;
      border: 1px solid #bfdbfe;
    }
    .placeholder-desc { font-size: 11px; color: #475569; }
    .ph-empty {
      font-size: 10.5px;
      color: #94a3b8;
      font-style: italic;
      padding: 6px 4px;
    }

    :host ::ng-deep .ant-switch-checked {
      background-color: #2563eb !important;
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

  typeOptions: {code: string; display: string}[] = [...DOCUMENT_TEMPLATE_TYPES];
  placeholders = TEMPLATE_PLACEHOLDERS;
  placeholderSearch = '';

  get filteredEmployeePlaceholders() {
    if (!this.placeholderSearch) return this.placeholders.employee;
    const q = this.placeholderSearch.toLowerCase();
    return this.placeholders.employee.filter(p => p.key.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
  }

  get filteredCompanyPlaceholders() {
    if (!this.placeholderSearch) return this.placeholders.company;
    const q = this.placeholderSearch.toLowerCase();
    return this.placeholders.company.filter(p => p.key.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
  }

  get filteredSystemPlaceholders() {
    if (!this.placeholderSearch) return this.placeholders.system;
    const q = this.placeholderSearch.toLowerCase();
    return this.placeholders.system.filter(p => p.key.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
  }

  copyPlaceholder(key: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(key).then(() => {
        this.message.success(`Copied ${key} to clipboard!`);
      });
    }
  }

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
        if (response && response.success && response.data && response.data.length > 0) {
          this.typeOptions = response.data;
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
        this.router.navigate(['/admin/documents'], { queryParams: { tab: 'templates' } });
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
            this.router.navigate(['/admin/documents'], { queryParams: { tab: 'templates' } });
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
            this.router.navigate(['/admin/documents'], { queryParams: { tab: 'templates' } });
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
    this.router.navigate(['/admin/documents'], { queryParams: { tab: 'templates' } });
  }
}
