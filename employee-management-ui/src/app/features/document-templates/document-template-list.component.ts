import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { DocumentTemplateService } from '../../core/services/document-template.service';
import { DocumentTemplate, DOCUMENT_TEMPLATE_TYPES } from '../../core/models/document-template.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DateFormatPipe } from '../../shared/pipes/date-format.pipe';
import { TemplatePreviewModalComponent } from './template-preview-modal.component';

@Component({
  selector: 'app-document-template-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink, RouterLinkActive,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzSelectModule,
    NzInputModule,
    NzTagModule,
    NzDropDownModule,
    NzSpinModule,
    NzCardModule,
    NzSwitchModule,
    NzToolTipModule,
    NzModalModule,
    DateFormatPipe,
    TemplatePreviewModalComponent
  ],
  template: `
    <div class="template-list-container page-enter">
      <!-- Modern Single-Line Filter Panel matching Document Hub -->
      <div class="dh-filter-card">
        <div class="filter-single-row">
          <!-- 1. Search Box -->
          <div class="filter-col filter-col-search">
            <label class="dh-field-label"><i nz-icon nzType="search"></i> 1. Search Template</label>
            <nz-input-group [nzPrefix]="searchIcon" class="search-input-group">
              <input nz-input [(ngModel)]="searchTerm" (input)="onSearch()" placeholder="Search templates by name, type, or description..." class="filter-input" />
            </nz-input-group>
            <ng-template #searchIcon><i nz-icon nzType="search" style="color: #94a3b8;"></i></ng-template>
          </div>

          <!-- 2. Template Type -->
          <div class="filter-col filter-col-type">
            <div class="label-with-actions">
              <label class="dh-field-label"><i nz-icon nzType="folder"></i> 2. Template Type</label>
              <button nz-button nzType="link" nzSize="small" *ngIf="filterType" (click)="filterType = ''; loadTemplates()" class="link-btn">Reset</button>
            </div>
            <nz-select [(ngModel)]="filterType" (ngModelChange)="loadTemplates()" nzPlaceHolder="All Types" class="w-full">
              <nz-option nzValue="" nzLabel="All Types (All Formats)"></nz-option>
              <nz-option *ngFor="let t of typeOptions" [nzValue]="t.code" [nzLabel]="t.display"></nz-option>
            </nz-select>
          </div>

          <!-- 3. Status -->
          <div class="filter-col filter-col-status">
            <div class="label-with-actions">
              <label class="dh-field-label"><i nz-icon nzType="check-circle"></i> 3. Status</label>
              <button nz-button nzType="link" nzSize="small" *ngIf="filterActive" (click)="filterActive = ''; loadTemplates()" class="link-btn">Reset</button>
            </div>
            <nz-select [(ngModel)]="filterActive" (ngModelChange)="loadTemplates()" nzPlaceHolder="All Status" class="w-full">
              <nz-option nzValue="" nzLabel="All Status"></nz-option>
              <nz-option nzValue="true" nzLabel="Active Only"></nz-option>
              <nz-option nzValue="false" nzLabel="Inactive Only"></nz-option>
            </nz-select>
          </div>

          <!-- 4. Actions & Count Pill -->
          <div class="filter-col filter-col-actions">
            <div class="actions-wrapper">
              <button nz-button class="btn-primary-gradient" routerLink="/admin/document-templates/new">
                <i nz-icon nzType="plus"></i> Add New Template
              </button>
              <button nz-button nzType="default" (click)="clearFilters()" *ngIf="hasActiveFilters" nz-tooltip="Reset All Filters" class="btn-reset">
                <i nz-icon nzType="reload"></i>
              </button>
              <span class="records-pill">
                <i nz-icon nzType="file-text"></i> {{ totalElements }} Templates Available
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Table Card matching Document Hub -->
      <div class="dh-table-card">
        <div class="table-card-header">
          <div class="table-card-title">
            <i nz-icon nzType="file-word" class="card-title-icon"></i>
            <span>Letter Templates & Document Formats</span>
            <span class="table-count-badge">{{ totalElements }} records</span>
          </div>
          <div class="table-card-hint">
            Configure dynamic HTML templates with placeholders (e.g. <code>{{ '{{employee_name}}' }}</code>) to auto-generate PDF letters.
          </div>
        </div>

        <ng-template #emptyTemplate>
          <div class="empty-state-content">
            <div class="empty-icon-wrapper">
              <i nz-icon nzType="file-text" class="empty-icon"></i>
            </div>
            <h3>No letter templates found</h3>
            <p *ngIf="hasActiveFilters">Try adjusting your search keyword or type filter.</p>
            <p *ngIf="!hasActiveFilters">No document templates available in the system yet.</p>
            <button nz-button nzType="primary" class="btn-primary-gradient" routerLink="/admin/document-templates/new" style="margin-top: 8px;">
              <i nz-icon nzType="plus"></i> Create First Template
            </button>
          </div>
        </ng-template>

        <nz-table
          [nzData]="dataSource"
          [nzFrontPagination]="false"
          [nzPageIndex]="pageIndex + 1"
          [nzPageSize]="pageSize"
          [nzTotal]="totalElements"
          (nzPageIndexChange)="onPageIndexChange($event)"
          (nzPageSizeChange)="onPageSizeChange($event)"
          nzShowSizeChanger
          [nzPageSizeOptions]="[10, 20, 50]"
          [nzScroll]="{ y: 'calc(100vh - 275px)', x: '800px' }"
          [nzNoResult]="emptyTemplate"
          class="theme-table"
          [nzLoading]="isLoading">
          <thead>
            <tr>
              <th nzWidth="60px" class="th-center">#</th>
              <th nzWidth="260px">Template Name</th>
              <th nzWidth="180px">Type</th>
              <th>Description</th>
              <th nzWidth="140px" class="th-center">Status</th>
              <th nzWidth="160px">Created At</th>
              <th nzWidth="130px" class="th-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let tpl of dataSource; let i = index">
              <td class="td-center row-num">{{ (pageIndex * pageSize) + i + 1 }}</td>
              <td>
                <div class="tpl-name-wrapper">
                  <div class="tpl-icon-box">
                    <i nz-icon nzType="file-word"></i>
                  </div>
                  <div class="tpl-info">
                    <span class="template-name">{{ tpl.templateName }}</span>
                    <span class="template-code">{{ tpl.templateType }}</span>
                  </div>
                </div>
              </td>
              <td>
                <nz-tag [nzColor]="getTypeColor(tpl.templateType)" class="type-badge">
                  {{ tpl.templateType }}
                </nz-tag>
              </td>
              <td>
                <span class="desc-text" [title]="tpl.description || ''">{{ tpl.description || '-' }}</span>
              </td>
              <td class="td-center">
                <div class="status-cell">
                  <nz-switch [ngModel]="tpl.active" (ngModelChange)="toggleActive(tpl)"
                    [nzCheckedChildren]="activeChecked" [nzUnCheckedChildren]="activeUnchecked"
                    nzSize="small">
                  </nz-switch>
                  <span class="status-label" [class.active-text]="tpl.active">{{ tpl.active ? 'Active' : 'Inactive' }}</span>
                </div>
                <ng-template #activeChecked><i nz-icon nzType="check"></i></ng-template>
                <ng-template #activeUnchecked><i nz-icon nzType="close"></i></ng-template>
              </td>
              <td>
                <span class="date-text">{{ tpl.createdAt | dateFormat }}</span>
              </td>
              <td class="td-center" (click)="$event.stopPropagation()">
                <div class="row-actions-cell">
                  <button nz-button nzType="link" nzSize="small" nz-tooltip="Preview Template (PDF)" (click)="openPreview(tpl)" class="action-btn preview-btn">
                    <i nz-icon nzType="eye"></i>
                  </button>
                  <button nz-button nzType="link" nzSize="small" nz-tooltip="Edit Template" [routerLink]="['/admin/document-templates', tpl.id, 'edit']" class="action-btn edit-btn">
                    <i nz-icon nzType="edit"></i>
                  </button>
                  <button nz-button nzType="link" nzDanger nzSize="small" nz-tooltip="Delete Template" (click)="deleteTemplate(tpl)" class="action-btn delete-btn">
                    <i nz-icon nzType="delete"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </nz-table>
      </div>

      <!-- Preview Modal -->
      <app-template-preview-modal
        [(visible)]="isPreviewVisible"
        [templateId]="selectedPreviewTemplateId"
        [templateName]="selectedPreviewTemplateName"
        [templateContent]="selectedPreviewTemplateContent">
      </app-template-preview-modal>
    </div>
  `,
  styles: [`
    /* ── Page Enter Animation ── */
    @keyframes page-enter {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .template-list-container.page-enter {
      animation: page-enter 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      min-height: 0;
      overflow: hidden;
    }
    .template-list-container {
      width: 100%;
      height: 100%;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-sizing: border-box;
      overflow: hidden;
    }

    .w-full { width: 100%; }

    /* ── FILTER CARD (GLASSY SINGLE LINE) ── */
    .dh-filter-card {
      background: rgba(248, 250, 252, 0.72);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(226, 232, 240, 0.85);
      border-radius: 10px;
      padding: 8px 14px;
      box-shadow: 0 4px 16px 0 rgba(31, 38, 135, 0.03);
      flex-shrink: 0;
    }

    .filter-single-row {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      width: 100%;
      flex-wrap: wrap;
    }

    .filter-col {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .filter-col-search { flex: 2; min-width: 220px; }
    .filter-col-type { flex: 1.2; min-width: 180px; }
    .filter-col-status { width: 140px; flex-shrink: 0; }
    .filter-col-actions {
      flex-shrink: 0;
      margin-left: auto;
    }

    .actions-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 30px;
    }

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

    .label-with-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .label-with-actions .dh-field-label { margin-bottom: 0; }
    .link-btn {
      font-size: 10.5px !important;
      padding: 0 !important;
      height: auto !important;
      color: #2563eb !important;
    }

    .btn-reset {
      height: 30px !important;
      padding: 0 8px !important;
      border-radius: 6px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    :host ::ng-deep .search-input-group input,
    :host ::ng-deep .ant-select:not(.ant-select-customize-input) .ant-select-selector {
      border-radius: 6px !important;
      border: 1px solid #cbd5e1 !important;
      background: rgba(255, 255, 255, 0.9) !important;
      backdrop-filter: blur(4px);
      height: 30px !important;
      font-size: 12px !important;
    }
    :host ::ng-deep .search-input-group input:hover,
    :host ::ng-deep .ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input) .ant-select-selector {
      border-color: #2563eb !important;
    }

    .records-pill {
      font-size: 11.5px;
      font-weight: 600;
      color: #1e3a8a;
      background: rgba(239, 246, 255, 0.85);
      backdrop-filter: blur(6px);
      padding: 3px 10px;
      border-radius: 16px;
      border: 1px solid rgba(191, 219, 254, 0.8);
      display: inline-flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
      height: 28px;
      box-sizing: border-box;
    }

    /* ── PRIMARY GRADIENT BUTTON ── */
    .btn-primary-gradient {
      height: 30px !important;
      padding: 0 14px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      border: none !important;
      border-radius: 6px !important;
      background: linear-gradient(135deg, #2563eb, #1e40af) !important;
      color: #fff !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 5px !important;
      transition: all 0.2s ease !important;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25) !important;
    }
    .btn-primary-gradient:hover {
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35) !important;
    }

    /* ── TABLE CARD CONTAINER (GLASSY & FLEX EXPAND) ── */
    .dh-table-card {
      flex: 1;
      min-height: 0;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(226, 232, 240, 0.85);
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
      display: flex;
      flex-direction: column;
    }

    .table-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 14px;
      background: rgba(248, 250, 252, 0.8);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid rgba(226, 232, 240, 0.85);
      flex-wrap: wrap;
      gap: 6px;
      flex-shrink: 0;
    }

    .table-card-title {
      font-size: 12.5px;
      font-weight: 700;
      color: #1e3a8a;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .card-title-icon { font-size: 15px; color: #2563eb; }

    .table-count-badge {
      font-size: 10.5px;
      font-weight: 600;
      color: #2563eb;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 1px 7px;
      border-radius: 10px;
    }

    .table-card-hint {
      font-size: 10.5px;
      color: #64748b;
    }
    .table-card-hint code {
      background: #e2e8f0;
      color: #1e40af;
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 10px;
    }

    /* ── THEME TABLE ── */
    .theme-table {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    :host ::ng-deep .theme-table .ant-spin-nested-loading {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      height: 100%;
    }
    :host ::ng-deep .theme-table .ant-spin-container {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      height: 100%;
    }
    :host ::ng-deep .theme-table .ant-table {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      height: 100%;
    }
    :host ::ng-deep .theme-table .ant-table-container {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    :host ::ng-deep .theme-table .ant-table-body {
      flex: 1;
      min-height: 0;
      overflow-y: auto !important;
    }
    :host ::ng-deep .theme-table .ant-table-pagination.ant-pagination {
      margin: 6px 12px !important;
      flex-shrink: 0;
    }

    :host ::ng-deep .theme-table .ant-table-thead > tr > th {
      background: rgba(248, 250, 252, 0.85) !important;
      border-bottom: 2px solid #2563eb !important;
      font-size: 10.5px !important;
      font-weight: 700 !important;
      color: #1e3a8a !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
      padding: 8px 10px !important;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr > td {
      padding: 8px 10px !important;
      font-size: 12px !important;
      border-bottom: 1px solid rgba(241, 245, 249, 0.8) !important;
      vertical-align: middle !important;
      background: transparent !important;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr:hover > td {
      background: rgba(37, 99, 235, 0.04) !important;
    }

    .th-center, .td-center { text-align: center !important; }
    .row-num { font-size: 10.5px; font-weight: 600; color: #94a3b8; }

    .tpl-name-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tpl-icon-box {
      width: 28px;
      height: 28px;
      border-radius: 5px;
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #dbeafe;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
    }
    .tpl-info { display: flex; flex-direction: column; gap: 0px; }
    .template-name { font-weight: 600; color: #0f172a; font-size: 12.5px; }
    .template-code { font-size: 10px; color: #64748b; }

    .type-badge {
      font-size: 10px !important;
      font-weight: 600 !important;
      border-radius: 4px !important;
      padding: 0 6px !important;
    }

    .desc-text {
      font-size: 11.5px;
      color: #475569;
      max-width: 280px;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .status-cell {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .status-label { font-size: 10.5px; font-weight: 600; color: #94a3b8; }
    .status-label.active-text { color: #16a34a; }

    .date-text { font-size: 11px; color: #64748b; white-space: nowrap; }

    .row-actions-cell {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
    }
    .action-btn {
      padding: 0 4px !important;
      height: 24px !important;
      font-size: 12px !important;
    }
    .preview-btn { color: #2563eb !important; }
    .edit-btn { color: #0284c7 !important; }
    .delete-btn { color: #ef4444 !important; }

    .empty-state-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 28px 16px;
      text-align: center;
      color: #64748b;
    }
    .empty-icon-wrapper {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: #eff6ff;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #2563eb;
      font-size: 20px;
      margin-bottom: 2px;
    }
    .empty-state-content h3 { font-size: 13.5px; font-weight: 600; color: #334155; margin: 0; }
    .empty-state-content p { font-size: 11.5px; color: #64748b; margin: 0; max-width: 320px; }

    :host ::ng-deep .ant-switch-checked {
      background-color: #2563eb !important;
    }
  `]
})
export class DocumentTemplateListComponent implements OnInit, OnDestroy {
  dataSource: DocumentTemplate[] = [];
  isLoading = false;
  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;

  searchTerm = '';
  filterType = '';
  filterActive = '';

  isPreviewVisible = false;
  selectedPreviewTemplateId: number | null = null;
  selectedPreviewTemplateName: string = '';
  selectedPreviewTemplateContent: string = '';

  typeOptions: {code: string; display: string}[] = [...DOCUMENT_TEMPLATE_TYPES];

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  constructor(
    private templateService: DocumentTemplateService,
    private router: Router,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  openPreview(tpl: DocumentTemplate): void {
    this.selectedPreviewTemplateId = tpl.id ?? null;
    this.selectedPreviewTemplateName = tpl.templateName;
    this.selectedPreviewTemplateContent = tpl.content || '';
    this.isPreviewVisible = true;
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm || !!this.filterType || !!this.filterActive;
  }

  ngOnInit(): void {
    this.loadTypes();
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.loadTemplates();
    });
    this.loadTemplates();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      'OFFER_LETTER': 'blue',
      'APPOINTMENT_LETTER': 'green',
      'JOINING_LETTER': 'geekblue',
      'REFERENCE_CHECK': 'magenta',
      'EXPERIENCE_LETTER': 'purple',
      'RELIEVING_LETTER': 'orange',
      'SALARY_SLIP': 'cyan',
      'ID_CARD': 'gold',
      'OTHER': 'default'
    };
    return colors[type] || 'default';
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

  loadTemplates(): void {
    this.isLoading = true;
    const params: any = {
      page: this.pageIndex,
      size: this.pageSize,
      sort: 'createdAt,desc'
    };
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.filterType) params.templateType = this.filterType;
    if (this.filterActive) params.active = this.filterActive === 'true';

    this.templateService.getTemplates(params).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.dataSource = response.data.content;
          this.totalElements = response.data.totalElements;
        }
      },
      error: () => {
        this.isLoading = false;
        this.message.error('Error loading templates');
      }
    });
  }

  onSearch(): void {
    this.pageIndex = 0;
    this.searchSubject.next(this.searchTerm);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterType = '';
    this.filterActive = '';
    this.pageIndex = 0;
    this.loadTemplates();
  }

  onPageIndexChange(index: number): void {
    this.pageIndex = index - 1;
    this.loadTemplates();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 0;
    this.loadTemplates();
  }

  toggleActive(tpl: DocumentTemplate): void {
    const newActive = !tpl.active;
    this.templateService.updateTemplate(tpl.id!, { active: newActive }).subscribe({
      next: (response) => {
        if (response.success) {
          this.message.success(`Template ${newActive ? 'activated' : 'deactivated'} successfully`);
          this.loadTemplates();
        }
      },
      error: (err) => {
        this.message.error(err.error?.message || 'Error updating template status');
      }
    });
  }

  deleteTemplate(tpl: DocumentTemplate): void {
    this.modal.confirm({
      nzTitle: 'Delete Template',
      nzContent: `Are you sure you want to delete "${tpl.templateName}"?`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        this.templateService.deleteTemplate(tpl.id!).subscribe({
          next: (response) => {
            this.message.success(response.message || 'Template deleted successfully');
            this.loadTemplates();
          },
          error: (err) => {
            this.message.error(err.error?.message || 'Error deleting template');
          }
        });
      }
    });
  }
}
