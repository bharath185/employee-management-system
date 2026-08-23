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
    <div class="ms-container page-enter">
      <!-- Top Navigation & Controls Bar -->
      <div class="ms-top-bar">
        <div class="top-left">
          <div class="ms-title-group" *ngIf="!selectedCategory">
            <span class="ms-main-title"><i nz-icon nzType="control"></i> Master Setup</span>
            <span class="ms-sub-badge">{{ loadedCount }}/{{ categories.length }} Categories Configured</span>
          </div>
          <div class="ms-title-group" *ngIf="selectedCategory">
            <button nz-button nzType="default" class="btn-back" (click)="clearSelectedCategory()">
              <i nz-icon nzType="arrow-left"></i> All Masters
            </button>
            <div class="current-cat-info">
              <i [ngClass]="selectedCategoryIcon" class="cat-header-icon"></i>
              <span class="ms-main-title">{{ selectedCategoryName }}</span>
              <span class="ms-sub-badge">{{ masterData.length }} Values</span>
            </div>
          </div>
        </div>

        <div class="top-right">
          <!-- When in Grid View: Category Search -->
          <div *ngIf="!selectedCategory" class="search-wrapper">
            <nz-input-group nzPrefixIcon="search" class="ms-search-input">
              <input nz-input placeholder="Search master categories..." [(ngModel)]="categorySearch" />
            </nz-input-group>
          </div>

          <!-- When in Table View: Category Switcher, Table Search & Add Value -->
          <div *ngIf="selectedCategory" class="table-actions-group">
            <nz-select [(ngModel)]="selectedCategory" (ngModelChange)="selectCategory($event)" class="cat-quick-select" nzShowSearch nzPlaceHolder="Switch Master">
              <nz-option *ngFor="let c of categories" [nzValue]="c.code" [nzLabel]="c.name + ' (' + (c.count !== null ? c.count : '...') + ')'"></nz-option>
            </nz-select>

            <nz-input-group nzPrefixIcon="search" class="ms-table-search">
              <input nz-input placeholder="Filter values..." [(ngModel)]="tableSearch" />
            </nz-input-group>

            <button nz-button class="btn-primary-gradient" (click)="openAddModal()">
              <i nz-icon nzType="plus"></i> Add Value
            </button>
          </div>
        </div>
      </div>

      <!-- VIEW 1: MASTER CATEGORIES SMALL CARDS GRID -->
      <div *ngIf="!selectedCategory" class="ms-grid-view">
        <div class="ms-cards-grid">
          <div *ngFor="let cat of filteredCategories" class="ms-mini-card" (click)="selectCategory(cat.code)">
            <div class="card-top-row">
              <div class="card-icon-box">
                <i [ngClass]="cat.icon"></i>
              </div>
              <span class="card-count-badge">
                <ng-container *ngIf="cat.count !== null; else countLoading">
                  {{ cat.count }} {{ cat.count === 1 ? 'item' : 'items' }}
                </ng-container>
                <ng-template #countLoading><i nz-icon nzType="loading"></i></ng-template>
              </span>
            </div>
            
            <div class="card-body">
              <div class="card-name">{{ cat.name }}</div>
              <div class="card-code">{{ cat.code }}</div>
            </div>

            <div class="card-footer">
              <span class="card-action-hint">Manage Values</span>
              <i nz-icon nzType="arrow-right" class="card-arrow"></i>
            </div>
          </div>
        </div>

        <div *ngIf="filteredCategories.length === 0" class="ms-no-results">
          <i nz-icon nzType="frown" class="no-res-icon"></i>
          <span class="no-res-title">No master categories matching "{{ categorySearch }}"</span>
          <button nz-button nzType="default" nzSize="small" (click)="categorySearch = ''">Clear Search</button>
        </div>
      </div>

      <!-- VIEW 2: SELECTED MASTER DATA TABLE VIEW -->
      <div *ngIf="selectedCategory" class="ms-table-view">
        <div class="table-container">
          <nz-table 
            #dataTable 
            [nzData]="filteredTableData" 
            [nzFrontPagination]="true" 
            [nzPageSize]="10"
            [nzShowSizeChanger]="true" 
            [nzPageSizeOptions]="[10, 20, 50, 100]"
            [nzLoading]="isLoading"
            nzBordered 
            nzSize="small" 
            class="theme-table">
            <thead>
              <tr>
                <th class="th-sno">#</th>
                <th class="th-code">Code</th>
                <th class="th-value">Display Value</th>
                <th class="th-sort">Sort Order</th>
                <th class="th-status">Status</th>
                <th class="th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of dataTable.data; let i = index">
                <td class="td-center">{{ i + 1 }}</td>
                <td class="td-center"><span class="code-chip">{{ item.code }}</span></td>
                <td>
                  <div class="editable-cell">
                    <span *ngIf="editId !== item.id" (dblclick)="startEdit(item)" class="editable-value" title="Double-click to edit inline">
                      {{ item.value }}
                    </span>
                    <span *ngIf="editId === item.id" class="edit-inline-wrapper">
                      <input nz-input [(ngModel)]="editValue" (blur)="saveEdit(item)"
                        (keyup.enter)="saveEdit(item)" (keyup.escape)="cancelEdit()" class="inline-edit-input" autofocus />
                      <button nz-button nzType="link" nzSize="small" (click)="saveEdit(item)" class="edit-btn" nz-tooltip="Save"><i nz-icon nzType="check"></i></button>
                      <button nz-button nzType="link" nzSize="small" (click)="cancelEdit()" class="edit-btn" nz-tooltip="Cancel"><i nz-icon nzType="close"></i></button>
                    </span>
                  </div>
                </td>
                <td class="td-center"><span class="sort-badge">{{ item.sortOrder }}</span></td>
                <td class="td-center">
                  <nz-switch [ngModel]="item.active" (ngModelChange)="toggleActive(item)" class="ms-switch"></nz-switch>
                </td>
                <td class="td-actions">
                  <button nz-button nzType="link" nzSize="small" class="action-btn action-edit" (click)="startEdit(item)" nz-tooltip="Edit value">
                    <i nz-icon nzType="edit"></i>
                  </button>
                  <button nz-button nzType="link" nzSize="small" class="action-btn action-delete" (click)="deleteItem(item)" nz-tooltip="Delete value">
                    <i nz-icon nzType="delete"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="filteredTableData.length === 0 && !isLoading">
                <td colspan="6" class="empty-cell">
                  <div class="empty-table-msg">
                    <i nz-icon nzType="inbox" style="font-size:24px; color:#cbd5e1; margin-bottom:6px"></i>
                    <span>No values found for {{ selectedCategoryName }}. Click "Add Value" to create one.</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </nz-table>
        </div>
      </div>
    </div>

    <!-- Add Modal -->
    <nz-modal [(nzVisible)]="isAddModalVisible" [nzTitle]="'Add ' + selectedCategoryName + ' Value'"
      (nzOnCancel)="closeAddModal()" nzWidth="440px" [nzMaskClosable]="false">
      <ng-template nzModalContent>
        <div class="add-modal-body">
          <div class="add-field">
            <label>Code <span class="required">*</span></label>
            <input nz-input [(ngModel)]="addCode" placeholder="e.g. IT, HR, SALES (UPPERCASE)" style="text-transform:uppercase;" />
          </div>
          <div class="add-field">
            <label>Display Value <span class="required">*</span></label>
            <input nz-input [(ngModel)]="addValue" placeholder="e.g. Information Technology" />
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
          <i nz-icon nzType="plus"></i> Add Value
        </button>
      </ng-template>
    </nz-modal>
  `,
  styles: [`
    :host { display: block; }
    .ms-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 0 16px 16px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }

    /* ── Top Header & Controls Bar ── */
    .ms-top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 12px;
      background: #f0f4ff;
      border-radius: 10px;
      padding: 6px 12px;
      border: 1px solid #e0e7ff;
      flex-wrap: wrap;
    }
    .top-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ms-title-group {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .current-cat-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cat-header-icon {
      font-size: 16px;
      color: #2563eb;
    }
    .ms-main-title {
      font-size: 14px;
      font-weight: 700;
      color: #1f3d6e;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .ms-main-title i { font-size: 16px; }
    .ms-sub-badge {
      font-size: 11px;
      font-weight: 600;
      color: #4b5563;
      background: #ffffff;
      padding: 2px 9px;
      border-radius: 12px;
      border: 1px solid #d1d5db;
    }
    .btn-back {
      height: 30px !important;
      padding: 0 10px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      border-radius: 6px !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 5px !important;
      color: #1f3d6e !important;
    }

    .top-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-left: auto;
    }
    .search-wrapper { width: 260px; }
    .ms-search-input { width: 100%; }
    :host ::ng-deep .ms-search-input .ant-input {
      height: 30px !important;
      font-size: 12px !important;
      border-radius: 6px !important;
    }

    .table-actions-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .cat-quick-select { width: 190px; }
    :host ::ng-deep .cat-quick-select .ant-select-selector {
      border-radius: 6px !important;
      height: 30px !important;
      font-size: 12px !important;
    }
    .ms-table-search { width: 180px; }
    :host ::ng-deep .ms-table-search .ant-input {
      height: 30px !important;
      font-size: 12px !important;
      border-radius: 6px !important;
    }

    .btn-primary-gradient {
      height: 30px !important;
      padding: 0 14px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      border: none !important;
      border-radius: 6px !important;
      background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
      color: #fff !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 5px !important;
      box-shadow: 0 2px 6px rgba(37,99,235,0.25) !important;
      transition: all 0.2s ease !important;
    }
    .btn-primary-gradient:hover {
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 10px rgba(37,99,235,0.35) !important;
    }

    /* ── VIEW 1: CARDS GRID ── */
    .ms-grid-view {
      margin-top: 4px;
    }
    .ms-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 12px;
    }
    .ms-mini-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px 14px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      position: relative;
      overflow: hidden;
      min-height: 110px;
    }
    .ms-mini-card:hover {
      border-color: #3b82f6;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(37,99,235,0.12);
    }
    .ms-mini-card:hover .card-icon-box {
      background: #2563eb;
      color: #ffffff;
    }
    .ms-mini-card:hover .card-arrow {
      transform: translateX(3px);
      color: #2563eb;
    }
    .card-top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .card-icon-box {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #eff6ff;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      transition: all 0.2s ease;
    }
    .card-count-badge {
      font-size: 11px;
      font-weight: 600;
      color: #3b82f6;
      background: #eff6ff;
      padding: 2px 7px;
      border-radius: 10px;
    }
    .card-body {
      margin-bottom: 8px;
    }
    .card-name {
      font-size: 13px;
      font-weight: 600;
      color: #1f2937;
      line-height: 1.3;
      margin-bottom: 2px;
    }
    .card-code {
      font-size: 10px;
      font-weight: 500;
      color: #9ca3af;
      font-family: 'Courier New', monospace;
      letter-spacing: 0.3px;
    }
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #f3f4f6;
      padding-top: 6px;
      margin-top: auto;
    }
    .card-action-hint {
      font-size: 11px;
      font-weight: 500;
      color: #6b7280;
    }
    .card-arrow {
      font-size: 11px;
      color: #9ca3af;
      transition: transform 0.2s ease, color 0.2s ease;
    }

    .ms-no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      background: #ffffff;
      border-radius: 8px;
      border: 1px dashed #d1d5db;
      gap: 10px;
    }
    .no-res-icon { font-size: 32px; color: #9ca3af; }
    .no-res-title { font-size: 13px; color: #4b5563; font-weight: 500; }

    /* ── VIEW 2: TABLE VIEW ── */
    .ms-table-view {
      margin-top: 4px;
    }
    .table-container {
      background: #ffffff;
      border: 1px solid #e8eaed;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }
    :host ::ng-deep .theme-table { width: 100% !important; }
    :host ::ng-deep .theme-table .ant-table { font-size: 11.5px; }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th {
      background: #f8f9fc !important;
      color: #1f3d6e !important;
      font-size: 10.5px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.3px !important;
      padding: 6px 8px !important;
      border-bottom: 1px solid #cbd5e1 !important;
      white-space: nowrap;
      text-align: center !important;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr > td {
      padding: 5px 8px !important;
      border-bottom: 1px solid #f1f5f9 !important;
      font-size: 11.5px;
      color: #374151;
      vertical-align: middle;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr:hover > td {
      background: rgba(37,99,235,0.03) !important;
    }

    .th-sno { width: 40px !important; text-align: center !important; }
    .th-code { width: 160px !important; text-align: center !important; }
    .th-value { text-align: left !important; }
    .th-sort { width: 110px !important; text-align: center !important; }
    .th-status { width: 110px !important; text-align: center !important; }
    .th-actions { width: 90px !important; text-align: center !important; }
    .td-center { text-align: center !important; }
    .td-actions { text-align: center !important; }

    .code-chip {
      display: inline-block;
      background: #f0f4ff;
      padding: 2px 7px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #1f3d6e;
      font-weight: 600;
      border: 1px solid #dbeafe;
    }
    .editable-cell { min-height: 24px; display: flex; align-items: center; }
    .editable-value {
      padding: 2px 6px;
      border-radius: 4px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s ease;
      font-weight: 500;
    }
    .editable-value:hover { background: rgba(37,99,235,0.06); border-color: #bfdbfe; }
    .edit-inline-wrapper { display: inline-flex; align-items: center; gap: 4px; width: 100%; }
    :host ::ng-deep .inline-edit-input {
      border-radius: 4px !important;
      border-color: #2563eb !important;
      box-shadow: 0 0 0 2px rgba(37,99,235,0.1) !important;
      height: 26px !important;
      font-size: 11.5px !important;
    }
    .edit-btn { padding: 0 3px !important; height: 22px !important; font-size: 12px !important; }
    .sort-badge {
      display: inline-block;
      padding: 1px 7px;
      border-radius: 6px;
      background: #f3f4f6;
      color: #4b5563;
      font-size: 11px;
      font-weight: 600;
    }
    :host ::ng-deep .ms-switch.ant-switch-checked { background-color: #2563eb !important; }
    .action-btn { padding: 0 4px !important; font-size: 13px !important; }
    .action-edit { color: #2563eb !important; }
    .action-edit:hover { color: #1d4ed8 !important; }
    .action-delete { color: #ef4444 !important; }
    .action-delete:hover { color: #dc2626 !important; }
    .empty-cell { text-align: center !important; padding: 40px !important; }
    .empty-table-msg { display: flex; flex-direction: column; align-items: center; color: #64748b; font-size: 12.5px; }

    /* Modal */
    .add-modal-body { display: flex; flex-direction: column; gap: 12px; padding: 4px 0; }
    .add-field { display: flex; flex-direction: column; gap: 4px; }
    .add-field label { font-size: 12px; font-weight: 600; color: #374151; }
    .required { color: #ef4444; }
    :host ::ng-deep .add-field .ant-input { height: 32px !important; font-size: 12.5px !important; border-radius: 6px !important; }
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

  clearSelectedCategory(): void {
    this.selectedCategory = '';
    this.tableSearch = '';
    this.cancelEdit();
    this.loadCategoryCounts();
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
