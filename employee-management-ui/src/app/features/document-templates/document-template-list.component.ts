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
    DateFormatPipe
  ],
  template: `
    <div class="template-list-container page-enter">
      <!-- Unified Controls & Filters Card -->
      <nz-card class="pp-controls-card" nzSize="small">
        <div class="filter-controls-row">
          <div class="filter-field search-box">
            <nz-input-group [nzPrefix]="searchIcon" class="search-input-group">
              <input nz-input [(ngModel)]="searchTerm" (input)="onSearch()" placeholder="Search templates by name..." class="filter-input">
            </nz-input-group>
            <ng-template #searchIcon><i nz-icon nzType="search"></i></ng-template>
          </div>
          <div class="filter-field select-box">
            <nz-select [(ngModel)]="filterType" (ngModelChange)="loadTemplates()" nzPlaceHolder="All Types" class="filter-select">
              <nz-option nzValue="" nzLabel="All Types"></nz-option>
              <nz-option *ngFor="let t of typeOptions" [nzValue]="t.code" [nzLabel]="t.display"></nz-option>
            </nz-select>
          </div>
          <div class="filter-field select-box">
            <nz-select [(ngModel)]="filterActive" (ngModelChange)="loadTemplates()" nzPlaceHolder="All Status" class="filter-select">
              <nz-option nzValue="" nzLabel="All Status"></nz-option>
              <nz-option nzValue="true" nzLabel="Active Only"></nz-option>
              <nz-option nzValue="false" nzLabel="Inactive Only"></nz-option>
            </nz-select>
          </div>
          <div class="filter-field clear-box" *ngIf="hasActiveFilters">
            <button nz-button (click)="clearFilters()" class="clear-filter-btn">
              <i nz-icon nzType="clear"></i> Clear
            </button>
          </div>
          <div class="filter-field add-btn-box">
            <button nz-button class="btn-primary-gradient" routerLink="/admin/document-templates/new">
              <i nz-icon nzType="plus"></i> Add Template
            </button>
          </div>
        </div>
      </nz-card>

      <!-- Table Card -->
      <div class="table-container">
        <div class="table-header">
          <div class="table-title">
            <i nz-icon nzType="file-text" class="title-icon"></i>
            <span>Document Templates</span>
            <span class="table-count">{{ totalElements }} records</span>
          </div>
        </div>

        <ng-template #emptyTemplate>
          <div class="empty-state-content">
            <div class="empty-icon-wrapper">
              <i nz-icon nzType="file-text" class="empty-icon"></i>
            </div>
            <h3>No templates found</h3>
            <p *ngIf="hasActiveFilters">Try adjusting your search or filter criteria</p>
            <p *ngIf="!hasActiveFilters">No document templates available in the system</p>
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
          [nzScroll]="{ x: '800px' }"
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
              <th nzWidth="100px" class="th-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let tpl of dataSource; let i = index">
              <td class="td-center row-num">{{ (pageIndex * pageSize) + i + 1 }}</td>
              <td>
                <div class="tpl-name-wrapper">
                  <span class="tpl-icon"><i nz-icon nzType="file-word" nzTheme="outline"></i></span>
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
                  <button nz-button nzType="text" nz-tooltip="Edit Template" [routerLink]="['/admin/document-templates', tpl.id, 'edit']" class="action-btn edit-btn">
                    <i nz-icon nzType="edit"></i>
                  </button>
                  <button nz-button nzType="text" [nz-tooltip]="tpl.active ? 'Deactivate' : 'Activate'" (click)="toggleActive(tpl)" class="action-btn toggle-btn">
                    <i nz-icon [nzType]="tpl.active ? 'stop' : 'check-circle'"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </nz-table>
      </div>
    </div>
  `,
  styles: [`
    /* ── Page Enter Animation ── */
    @keyframes page-enter {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .template-list-container.page-enter {
      animation: page-enter 0.35s ease-out;
    }
    .pp-sub-nav {
      display: flex;
      gap: 2px;
      margin-bottom: 12px;
      background: #f0f4ff;
      border-radius: 10px;
      padding: 4px;
      border: 1px solid #e0e7ff;
    }
    .pp-nav-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      color: #6c757d;
      text-decoration: none;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .pp-nav-item i { font-size: 16px; width: 16px; display: inline-flex; align-items: center; justify-content: center; }
    .pp-nav-item:hover { background: rgba(31,61,110,0.06); color: #1f3d6e; }
    .pp-nav-item.active {
      background: #ffffff;
      color: #1f3d6e;
      box-shadow: 0 2px 8px rgba(31,61,110,0.1);
    }
    .pp-nav-item.active i { color: #1f3d6e; }

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

    /* ── Scrollbar Styling ── */
    .template-list-container ::-webkit-scrollbar { width: 6px; height: 6px; }
    .template-list-container ::-webkit-scrollbar-track { background: transparent; }
    .template-list-container ::-webkit-scrollbar-thumb { background: rgba(31,61,110,0.2); border-radius: 3px; }
    .template-list-container ::-webkit-scrollbar-thumb:hover { background: rgba(31,61,110,0.35); }

    :host { display: block; height: 100%; }
    .template-list-container {
      width: 100%;
      padding: 12px 16px;
      height: 100%;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    .pp-controls-card {
      border-radius: 10px !important;
      border: 1px solid #e8eaed !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
      margin-bottom: 12px;
      width: 100% !important;
      background: #fff;
    }
    :host ::ng-deep .pp-controls-card .ant-card-body { padding: 10px 14px !important; }
    .filter-field-wrapper { min-width: 0; }
    .filter-field { min-width: 0; }
    .filter-field .ant-select { width: 100%; }
    :host ::ng-deep .filter-select .ant-select-selector,
    :host ::ng-deep .search-input-group input {
      border-radius: 8px !important;
      border: 1px solid #e2e5ea !important;
      height: 34px !important;
    }
    :host ::ng-deep .filter-select .ant-select-selector:hover,
    :host ::ng-deep .search-input-group input:hover {
      border-color: #1f3d6e !important;
    }
    .filter-actions-col { display: flex; align-items: center; }
    .clear-filter-btn {
      font-size: 13px;
      height: 34px;
      padding: 0 14px;
      border-radius: 8px;
      border: 1px solid #e2e5ea;
      background: #f8fafc;
      color: #64748b;
    }
    .clear-filter-btn:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .filter-controls-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    .filter-field.search-box {
      flex: 1;
      min-width: 200px;
    }
    .filter-field.select-box {
      width: 160px;
    }
    .filter-field.clear-box {
      margin-left: auto;
    }
    .filter-field.add-btn-box {
      margin-left: auto;
    }
    .filter-field.clear-box + .filter-field.add-btn-box {
      margin-left: 0;
    }

    .table-container {
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      border: 1px solid #e8eaed;
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .table-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #e8eaed;
      background: #ffffff;
      flex-wrap: wrap;
      gap: 8px;
      flex-shrink: 0;
    }
    .table-title {
      font-size: 14px;
      font-weight: 700;
      color: #1f3d6e;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .table-title .title-icon { font-size: 16px; color: #4361ee; }
    .table-count {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      background: #f0f4ff;
      padding: 2px 8px;
      border-radius: 12px;
      border: 1px solid #e0e7ff;
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

    .th-center, .td-center {
      text-align: center !important;
    }
    .row-num {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
    }

    .tpl-name-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .tpl-icon {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background: #f0f4ff;
      color: #4361ee;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
      border: 1px solid #e0e7ff;
    }
    .tpl-info {
      display: flex;
      flex-direction: column;
    }
    .template-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 13px;
      line-height: 1.3;
    }
    .template-code {
      font-size: 11px;
      color: #64748b;
      margin-top: 1px;
    }

    .type-badge {
      font-size: 11px !important;
      font-weight: 600 !important;
      padding: 2px 8px !important;
      border-radius: 6px !important;
    }

    .desc-text {
      font-size: 12px;
      color: #475569;
      max-width: 260px;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .status-cell {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .status-label {
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
    }
    .status-label.active-text {
      color: #16a34a;
    }

    .date-text {
      font-size: 12px;
      color: #64748b;
      white-space: nowrap;
    }

    .row-actions-cell {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .action-btn {
      width: 28px !important;
      height: 28px !important;
      padding: 0 !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 6px !important;
      color: #64748b !important;
      transition: all 0.15s ease !important;
    }
    .action-btn:hover {
      background: #f0f4ff !important;
      color: #1f3d6e !important;
    }
    .edit-btn:hover {
      color: #4361ee !important;
    }
    .toggle-btn:hover {
      color: #e11d48 !important;
    }

    .empty-state-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 40px 16px;
      text-align: center;
      color: #64748b;
    }
    .empty-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #f0f4ff;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #4361ee;
      font-size: 24px;
      margin-bottom: 4px;
    }
    .empty-icon-wrapper .empty-icon { font-size: 28px; color: #4361ee; }
    .empty-state-content h3 { font-size: 15px; font-weight: 600; color: #334155; margin: 0; }
    .empty-state-content p { font-size: 13px; color: #64748b; margin: 0; max-width: 320px; }

    .theme-table .ant-table-pagination {
      margin: 12px 16px !important;
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    @media (max-width: 768px) {
      .filter-field { min-width: 140px; }
      .table-header { flex-direction: column; align-items: flex-start; }
      .template-list-container { padding: 8px; }
    }

    /* ── Switch Active Color ── */
    ::ng-deep .ant-switch-checked {
      background-color: #1f3d6e !important;
    }

    /* ── Primary Button Gradient ── */
    button[nz-button][nzType="primary"] {
      background: linear-gradient(135deg, #4361ee, #3a0ca3) !important;
      border: none !important;
      box-shadow: 0 2px 6px rgba(67,97,238,0.3) !important;
      transition: all 0.2s ease !important;
    }
    button[nz-button][nzType="primary"]:hover {
      box-shadow: 0 4px 12px rgba(67,97,238,0.45) !important;
      transform: translateY(-1px);
    }
    button[nz-button][nzType="primary"]:active {
      transform: translateY(0);
      box-shadow: 0 1px 4px rgba(67,97,238,0.3) !important;
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

  typeOptions: {code: string; display: string}[] = [...DOCUMENT_TEMPLATE_TYPES];

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  constructor(
    private templateService: DocumentTemplateService,
    private router: Router,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

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
