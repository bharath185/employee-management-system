import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { MasterDataService } from '../../core/services/master-data.service';
import { MasterDataItem } from '../../core/models/api-response.model';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

interface CategoryInfo {
  code: string;
  name: string;
  count: number | null;
  icon: string;
}

const MASTER_CATEGORIES: CategoryInfo[] = [
  { code: 'GENDER', name: 'Gender', count: null, icon: 'bi bi-gender-female' },
  { code: 'PREFIX', name: 'Prefix', count: null, icon: 'bi bi-person-badge' },
  { code: 'MARITAL_STATUS', name: 'Marital Status', count: null, icon: 'bi bi-heart-half' },
  { code: 'F_M_H', name: 'F/M/H', count: null, icon: 'bi bi-people-fill' },
  { code: 'RELIGION', name: 'Religion', count: null, icon: 'bi bi-building' },
  { code: 'SOCIAL_CATEGORY', name: 'Social Category', count: null, icon: 'bi bi-grid-3x3-gap' },
  { code: 'SOCIAL_SUBCATEGORY', name: 'Social Subcategory', count: null, icon: 'bi bi-grid' },
  { code: 'BLOOD_GROUP', name: 'Blood Group', count: null, icon: 'bi bi-droplet-fill' },
  { code: 'EMPLOYEE_STATUS', name: 'Employee Status', count: null, icon: 'bi bi-patch-check-fill' },
  { code: 'EXIT_TYPE', name: 'Exit Type', count: null, icon: 'bi bi-box-arrow-right' },
  { code: 'OCCUPATION_KIN', name: 'Occupation of Kin', count: null, icon: 'bi bi-tools' },
  { code: 'QUALIFICATION', name: 'Qualification', count: null, icon: 'bi bi-mortarboard-fill' },
  { code: 'EDUCATION_LEVEL', name: 'Education Level', count: null, icon: 'bi bi-journal-richtext' },
  { code: 'DESIGNATION', name: 'Designation', count: null, icon: 'bi bi-person-workspace' },
  { code: 'BANK_NAME', name: 'Bank Name', count: null, icon: 'bi bi-bank2' },
  { code: 'PROCESS', name: 'Process', count: null, icon: 'bi bi-gear-wide-connected' },
  { code: 'RELATIONSHIP', name: 'Relationship', count: null, icon: 'bi bi-person-hearts' },
  { code: 'AGE_BRACKET', name: 'Age Bracket', count: null, icon: 'bi bi-calendar2-age' },
  { code: 'YES_NO', name: 'Yes/No', count: null, icon: 'bi bi-toggle2-on' },
  { code: 'LANGUAGE', name: 'Language', count: null, icon: 'bi bi-translate' },
  { code: 'DOCUMENT_TYPE', name: 'Document Type', count: null, icon: 'bi bi-file-earmark-text' },
  { code: 'OCCUPATION_SUB', name: 'Occupation Sub', count: null, icon: 'bi bi-diagram-3-fill' },
  { code: 'DEPARTMENT', name: 'Department', count: null, icon: 'bi bi-hdd-stack-fill' }
];

@Component({
  selector: 'app-masters',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzCardModule, NzInputModule, NzSelectModule, NzButtonModule,
    NzIconModule, NzTableModule, NzSpinModule, NzModalModule,
    NzSwitchModule, NzTagModule, NzToolTipModule
  ],
  template: `
    <div class="ms-container">
      <div class="ms-sub-nav">
        <span class="ms-nav-title"><i nz-icon nzType="control"></i> Masters Setup</span>
        <span class="ms-nav-badge" *ngIf="loadedCount > 0">{{ loadedCount }}/{{ categories.length }}</span>
      </div>

      <div class="ms-layout">
        <!-- Categories Panel -->
        <nz-card class="ms-cats-card" nzSize="small">
          <div class="ms-cats-header">
            <nz-input-group nzSuffixIcon="search" class="ms-search">
              <input nz-input placeholder="Search..." [(ngModel)]="categorySearch" />
            </nz-input-group>
          </div>
          <div class="ms-cats-list">
            <div *ngFor="let cat of filteredCategories" class="ms-cat"
              [class.active]="selectedCategory === cat.code"
              (click)="selectCategory(cat.code)">
              <div class="ms-cat-icon" [class.active-icon]="selectedCategory === cat.code">
                <i [ngClass]="cat.icon"></i>
              </div>
              <div class="ms-cat-body">
                <span class="ms-cat-name">{{ cat.name }}</span>
                <span class="ms-cat-count">
                  <ng-container *ngIf="cat.count !== null; else loadingCnt">{{ cat.count }}</ng-container>
                  <ng-template #loadingCnt><i nz-icon nzType="loading"></i></ng-template>
                </span>
              </div>
              <i *ngIf="selectedCategory === cat.code" nz-icon nzType="check-circle" nzTheme="fill" class="ms-cat-check"></i>
            </div>
            <div *ngIf="filteredCategories.length === 0" class="ms-empty">
              <span>No matches</span>
            </div>
          </div>
        </nz-card>

        <!-- Data Panel -->
        <div class="ms-data-panel">
          <nz-card class="ms-data-card" nzSize="small" *ngIf="selectedCategory">
            <div class="ms-data-header">
              <div class="ms-data-title">
                <i [ngClass]="selectedCategoryIcon"></i>
                <span>{{ selectedCategoryName }}</span>
                <span class="ms-data-count">{{ masterData.length }} values</span>
              </div>
              <div class="ms-data-actions">
                <nz-input-group nzSuffixIcon="search" class="ms-search-sm">
                  <input nz-input placeholder="Search..." [(ngModel)]="tableSearch" />
                </nz-input-group>
                <button nz-button class="btn-primary-gradient" (click)="openAddModal()">
                  <i nz-icon nzType="plus"></i> Add
                </button>
              </div>
            </div>

            <nz-table #dataTable [nzData]="filteredTableData" [nzFrontPagination]="true" [nzPageSize]="20"
              [nzShowSizeChanger]="true" [nzPageSizeOptions]="[10, 20, 50]"
              nzBordered nzSize="small" nzShowPagination nzFrontPagination class="theme-table">
              <thead>
                <tr>
                  <th class="th-code">Code</th>
                  <th class="th-value">Display Value</th>
                  <th class="th-sort">Sort</th>
                  <th class="th-status">Status</th>
                  <th class="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of dataTable.data">
                  <td class="td-center"><span class="code-chip">{{ item.code }}</span></td>
                  <td>
                    <div class="editable-cell">
                      <span *ngIf="editId !== item.id" (dblclick)="startEdit(item)" class="editable-value"
                        [title]="'Double-click to edit'">{{ item.value }}</span>
                      <span *ngIf="editId === item.id" class="edit-inline-wrapper">
                        <input nz-input [(ngModel)]="editValue" (blur)="saveEdit(item)"
                          (keyup.enter)="saveEdit(item)" (keyup.escape)="cancelEdit()" class="inline-edit-input" autofocus />
                        <button nz-button nzType="link" nzSize="small" (click)="saveEdit(item)" class="edit-btn"><i nz-icon nzType="check"></i></button>
                        <button nz-button nzType="link" nzSize="small" (click)="cancelEdit()" class="edit-btn"><i nz-icon nzType="close"></i></button>
                      </span>
                    </div>
                  </td>
                  <td class="td-center"><span class="sort-badge">{{ item.sortOrder }}</span></td>
                  <td class="td-center">
                    <nz-switch [ngModel]="item.active" (ngModelChange)="toggleActive(item)" class="ms-switch"></nz-switch>
                  </td>
                  <td class="td-actions">
                    <button nz-button nzType="link" nzSize="small" class="action-btn action-delete" (click)="deleteItem(item)" nz-tooltip="Delete">
                      <i nz-icon nzType="delete"></i>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="filteredTableData.length === 0">
                  <td colspan="5" class="empty-cell">No values found</td>
                </tr>
              </tbody>
            </nz-table>
          </nz-card>

          <!-- Empty state -->
          <nz-card class="ms-data-card" nzSize="small" *ngIf="!selectedCategory">
            <div class="ms-empty-state">
              <i nz-icon nzType="appstore" nzTheme="outline" class="ms-empty-icon"></i>
              <span class="ms-empty-title">Select a Category</span>
              <span class="ms-empty-desc">Choose a master data category from the left panel</span>
            </div>
          </nz-card>
        </div>
      </div>
    </div>

    <!-- Add Modal -->
    <nz-modal [(nzVisible)]="isAddModalVisible" [nzTitle]="'Add ' + selectedCategoryName"
      (nzOnCancel)="closeAddModal()" nzWidth="420px" [nzMaskClosable]="false">
      <ng-template nzModalContent>
        <div class="add-modal-body">
          <div class="add-field">
            <label>Code <span class="required">*</span></label>
            <input nz-input [(ngModel)]="addCode" placeholder="UPPERCASE" style="text-transform:uppercase;" />
          </div>
          <div class="add-field">
            <label>Display Value <span class="required">*</span></label>
            <input nz-input [(ngModel)]="addValue" placeholder="Enter value" />
          </div>
          <div class="add-field">
            <label>Sort Order</label>
            <input nz-input type="number" [(ngModel)]="addSortOrder" min="1" placeholder="Auto" />
          </div>
        </div>
      </ng-template>
      <ng-template nzModalFooter>
        <button nz-button (click)="closeAddModal()">Cancel</button>
        <button nz-button nzType="primary" (click)="submitAddForm()" [nzLoading]="isSaving" [disabled]="!addCode || !addValue">
          <i nz-icon nzType="plus"></i> Add
        </button>
      </ng-template>
    </nz-modal>
  `,
  styles: [`
    :host { display: block; scroll-behavior: smooth; }
    .ms-sub-nav {
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
    .ms-nav-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 700;
      color: #1f3d6e;
    }
    .ms-nav-title i { font-size: 16px; }
    .ms-nav-badge {
      font-size: 11px;
      font-weight: 600;
      color: #6c757d;
      background: #fff;
      padding: 1px 8px;
      border-radius: 10px;
      border: 1px solid #e0e7ff;
    }
    .ms-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 8px 12px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      height: calc(100vh - 48px);
      overflow-y: auto;
      scroll-behavior: smooth;
    }
    .ms-container::-webkit-scrollbar { width: 6px; }
    .ms-container::-webkit-scrollbar-track { background: transparent; }
    .ms-container::-webkit-scrollbar-thumb { background: #d0d5dd; border-radius: 3px; }
    .ms-layout {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 8px;
      align-items: start;
    }
    @media (max-width: 900px) { .ms-layout { grid-template-columns: 1fr; } }

    /* Categories Card */
    .ms-cats-card {
      border-radius: 8px !important;
      border: 1px solid #e8eaed !important;
      box-shadow: 0 1px 6px rgba(0,0,0,0.04) !important;
    }
    :host ::ng-deep .ms-cats-card .ant-card-body { padding: 8px !important; }
    .ms-cats-header { margin-bottom: 6px; }
    .ms-search { border-radius: 6px !important; }
    :host ::ng-deep .ms-search .ant-input { height: 30px !important; font-size: 12px !important; }
    :host ::ng-deep .ms-search .ant-input-group-addon { height: 30px !important; font-size: 12px !important; }
    .ms-cats-list {
      display: flex;
      flex-direction: column;
      gap: 3px;
      max-height: calc(100vh - 180px);
      overflow-y: auto;
      scroll-behavior: smooth;
    }
    .ms-cats-list::-webkit-scrollbar { width: 4px; }
    .ms-cats-list::-webkit-scrollbar-track { background: transparent; }
    .ms-cats-list::-webkit-scrollbar-thumb { background: #d0d5dd; border-radius: 2px; }
    .ms-cat {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 8px;
      border-radius: 6px;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.15s ease;
      position: relative;
    }
    .ms-cat:hover { background: rgba(31,61,110,0.04); border-color: #e8eaed; }
    .ms-cat.active { background: rgba(31,61,110,0.08); border-color: #1f3d6e; }
    .ms-cat.active::before {
      content: '';
      position: absolute;
      left: 0; top: 4px; bottom: 4px;
      width: 3px;
      background: #1f3d6e;
      border-radius: 0 2px 2px 0;
    }
    .ms-cat-icon {
      width: 26px; height: 26px;
      border-radius: 6px;
      background: #f0f4ff;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px;
      color: #6c757d;
      flex-shrink: 0;
      transition: all 0.15s ease;
    }
    .ms-cat-icon.active-icon { background: #1f3d6e; color: #fff; }
    .ms-cat-body {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-width: 0;
    }
    .ms-cat-name {
      font-size: 12px;
      font-weight: 500;
      color: #374151;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ms-cat.active .ms-cat-name { color: #1f3d6e; font-weight: 600; }
    .ms-cat-count {
      font-size: 10px;
      color: #9ca3af;
      font-weight: 600;
      flex-shrink: 0;
    }
    .ms-cat-check { color: #1f3d6e; font-size: 12px; flex-shrink: 0; }
    .ms-empty {
      text-align: center;
      padding: 16px;
      font-size: 11px;
      color: #9ca3af;
    }

    /* Data Panel */
    .ms-data-panel { display: flex; flex-direction: column; }
    .ms-data-card {
      border-radius: 8px !important;
      border: 1px solid #e8eaed !important;
      box-shadow: 0 1px 6px rgba(0,0,0,0.04) !important;
    }
    :host ::ng-deep .ms-data-card .ant-card-body { padding: 0 !important; }
    .ms-data-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border-bottom: 1px solid #e8eaed;
      gap: 8px;
      flex-wrap: wrap;
    }
    .ms-data-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 700;
      color: #1f3d6e;
    }
    .ms-data-title i { font-size: 15px; color: #1f3d6e; }
    .ms-data-count {
      font-size: 10px;
      font-weight: 500;
      color: #9ca3af;
      background: #f0f4ff;
      padding: 1px 6px;
      border-radius: 8px;
    }
    .ms-data-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ms-search-sm { width: 160px; border-radius: 6px !important; }
    :host ::ng-deep .ms-search-sm .ant-input { height: 28px !important; font-size: 11px !important; }
    :host ::ng-deep .ms-search-sm .ant-input-group-addon { height: 28px !important; }

    .btn-primary-gradient {
      height: 28px !important;
      padding: 0 12px !important;
      font-size: 11px !important;
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

    /* Table */
    :host ::ng-deep .theme-table {
      width: 100% !important;
      table-layout: fixed !important;
    }
    :host ::ng-deep .theme-table .ant-table { font-size: 12px; border-radius: 0 !important; }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th {
      background: #f8f9fc !important;
      color: #1f3d6e !important;
      font-size: 10px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
      padding: 6px 8px !important;
      border-bottom: 2px solid #1f3d6e !important;
      white-space: nowrap;
    }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th:not(:last-child) {
      border-right: 1px solid #e8ecf1;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr > td {
      padding: 5px 8px !important;
      border-bottom: 1px solid #f0f2f5 !important;
      font-size: 11px;
      color: #374151;
      vertical-align: middle;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr:hover > td {
      background: rgba(31,61,110,0.03) !important;
    }
    .th-code { width: 15% !important; text-align: center !important; }
    .th-value { width: 40% !important; text-align: left !important; }
    .th-sort { width: 10% !important; text-align: center !important; }
    .th-status { width: 15% !important; text-align: center !important; }
    .th-actions { width: 12% !important; text-align: center !important; }
    .td-center { text-align: center !important; }
    .td-actions { text-align: center !important; }

    .code-chip {
      display: inline-block;
      background: #f0f4ff;
      padding: 1px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 10px;
      color: #1f3d6e;
      font-weight: 600;
    }
    .editable-cell { min-height: 22px; display: flex; align-items: center; }
    .editable-value {
      padding: 2px 6px;
      border-radius: 4px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s ease;
    }
    .editable-value:hover { background: rgba(31,61,110,0.06); border-color: #e0e7ff; }
    .edit-inline-wrapper { display: inline-flex; align-items: center; gap: 3px; width: 100%; }
    :host ::ng-deep .inline-edit-input {
      border-radius: 4px !important;
      border-color: #1f3d6e !important;
      box-shadow: 0 0 0 2px rgba(31,61,110,0.06) !important;
      height: 26px !important;
      font-size: 11px !important;
    }
    .edit-btn { padding: 0 3px !important; height: 20px !important; font-size: 12px !important; }
    .sort-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 8px;
      background: #f0f4ff;
      color: #6c757d;
      font-size: 10px;
      font-weight: 600;
      font-family: 'Courier New', monospace;
    }
    :host ::ng-deep .ms-switch.ant-switch-checked { background-color: #1f3d6e !important; }
    .action-btn { padding: 0 3px !important; font-size: 13px !important; }
    .action-delete { color: #ef4444 !important; }
    .action-delete:hover { color: #dc2626 !important; transform: scale(1.15); }
    .empty-cell { text-align: center !important; padding: 20px !important; color: #9ca3af !important; font-size: 12px; font-style: italic; }

    /* Pagination */
    :host ::ng-deep .ant-pagination { margin: 8px 12px !important; font-size: 12px !important; }
    :host ::ng-deep .ant-pagination-item { min-width: 28px !important; height: 28px !important; line-height: 28px !important; }
    :host ::ng-deep .ant-pagination-item a { font-size: 12px !important; }

    /* Empty state */
    .ms-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      gap: 8px;
    }
    .ms-empty-icon { font-size: 36px; color: #d0d5dd; }
    .ms-empty-title { font-size: 14px; font-weight: 700; color: #374151; }
    .ms-empty-desc { font-size: 12px; color: #9ca3af; }

    /* Modal */
    .add-modal-body { display: flex; flex-direction: column; gap: 10px; padding: 4px 0; }
    .add-field { display: flex; flex-direction: column; gap: 3px; }
    .add-field label { font-size: 11px; font-weight: 600; color: #374151; }
    .required { color: #ef4444; }
    :host ::ng-deep .add-field .ant-input { height: 30px !important; font-size: 12px !important; border-radius: 6px !important; }
  `]
})
export class MastersComponent implements OnInit {
  categories = MASTER_CATEGORIES;
  selectedCategory: string = '';
  masterData: MasterDataItem[] = [];
  isLoading = false;
  isSaving = false;

  editId: number | null = null;
  editValue: string = '';

  categorySearch: string = '';
  tableSearch: string = '';

  isAddModalVisible = false;
  addCode = '';
  addValue = '';
  addSortOrder: number | null = null;

  constructor(
    private masterDataService: MasterDataService,
    private http: HttpClient,
    private notification: NzNotificationService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.loadCategoryCounts();
  }

  get loadedCount(): number {
    return this.categories.filter(c => c.count !== null).length;
  }

  get selectedCategoryName(): string {
    const cat = this.categories.find(c => c.code === this.selectedCategory);
    return cat ? cat.name : this.selectedCategory;
  }

  get selectedCategoryIcon(): string {
    const cat = this.categories.find(c => c.code === this.selectedCategory);
    return cat ? cat.icon : 'bi bi-appstore';
  }

  get filteredCategories(): CategoryInfo[] {
    if (!this.categorySearch) return this.categories;
    const q = this.categorySearch.toLowerCase();
    return this.categories.filter(c =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }

  get filteredTableData(): MasterDataItem[] {
    if (!this.tableSearch) return this.masterData;
    const q = this.tableSearch.toLowerCase();
    return this.masterData.filter(item =>
      item.code.toLowerCase().includes(q) ||
      item.value.toLowerCase().includes(q) ||
      item.sortOrder.toString().includes(q)
    );
  }

  private loadCategoryCounts(): void {
    this.categories.forEach(cat => {
      this.masterDataService.getByCategory(cat.code).subscribe({
        next: (data) => { cat.count = data.length; }
      });
    });
  }

  selectCategory(category: string): void {
    if (this.selectedCategory === category) return;
    this.cancelEdit();
    this.selectedCategory = category;
    this.tableSearch = '';
    this.loadCategoryData();
  }

  private loadCategoryData(): void {
    if (!this.selectedCategory) return;
    this.isLoading = true;
    this.masterDataService.getByCategory(this.selectedCategory).subscribe({
      next: (data) => {
        this.isLoading = false;
        this.masterData = data;
        const cat = this.categories.find(c => c.code === this.selectedCategory);
        if (cat) cat.count = data.length;
      },
      error: () => {
        this.isLoading = false;
        this.notification.error('Error', 'Error loading master data');
      }
    });
  }

  openAddModal(): void {
    this.addCode = '';
    this.addValue = '';
    this.addSortOrder = this.masterData.length + 1;
    this.isAddModalVisible = true;
  }

  closeAddModal(): void {
    this.isAddModalVisible = false;
    this.addCode = '';
    this.addValue = '';
    this.addSortOrder = null;
  }

  submitAddForm(): void {
    if (!this.addCode || !this.addValue) return;
    const payload = {
      category: this.selectedCategory,
      code: this.addCode.toUpperCase().trim(),
      value: this.addValue.trim(),
      sortOrder: this.addSortOrder || this.masterData.length + 1
    };
    this.isSaving = true;
    this.http.post(`${environment.apiUrl}/masters`, payload).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        if (response.success) {
          this.notification.success('Success', 'Value added successfully');
          this.isAddModalVisible = false;
          this.addCode = '';
          this.addValue = '';
          this.addSortOrder = null;
          this.masterDataService.refreshCategory(this.selectedCategory);
          this.loadCategoryData();
          this.loadCategoryCounts();
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.notification.error('Error', err.error?.message || 'Error adding value');
      }
    });
  }

  startEdit(item: MasterDataItem): void {
    this.editId = item.id;
    this.editValue = item.value;
    setTimeout(() => {
      const inputs = document.querySelectorAll('.inline-edit-input');
      if (inputs.length > 0) {
        (inputs[inputs.length - 1] as HTMLElement).focus();
      }
    }, 50);
  }

  saveEdit(item: MasterDataItem): void {
    if (!this.editValue || this.editValue === item.value) {
      this.cancelEdit();
      return;
    }
    this.http.put(`${environment.apiUrl}/masters/${item.id}`, {
      ...item, value: this.editValue
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.notification.success('Success', 'Value updated');
          this.masterDataService.refreshCategory(this.selectedCategory);
          this.loadCategoryData();
        }
        this.cancelEdit();
      },
      error: (err) => {
        this.notification.error('Error', err.error?.message || 'Error updating');
        this.cancelEdit();
      }
    });
  }

  cancelEdit(): void {
    this.editId = null;
    this.editValue = '';
  }

  toggleActive(item: MasterDataItem): void {
    this.http.put(`${environment.apiUrl}/masters/${item.id}`, {
      ...item, active: !item.active
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.masterDataService.refreshCategory(this.selectedCategory);
          this.loadCategoryData();
        }
      },
      error: () => { this.notification.error('Error', 'Error toggling status'); }
    });
  }

  deleteItem(item: MasterDataItem): void {
    this.modal.confirm({
      nzTitle: 'Delete Value',
      nzContent: `Delete "${item.value}" (${item.code})?`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        this.http.delete(`${environment.apiUrl}/masters/${item.id}`).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.notification.success('Success', 'Value deleted');
              this.masterDataService.refreshCategory(this.selectedCategory);
              this.loadCategoryData();
              this.loadCategoryCounts();
            }
          },
          error: (err) => { this.notification.error('Error', err.error?.message || 'Error deleting'); }
        });
      }
    });
  }
}
