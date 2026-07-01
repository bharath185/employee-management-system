import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
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
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { MasterDataService } from '../../core/services/master-data.service';
import { MasterDataItem } from '../../core/models/api-response.model';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface CategoryInfo {
  code: string;
  name: string;
  count: number | null;
  icon: string;
}

const MASTER_CATEGORIES: CategoryInfo[] = [
  { code: 'GENDER', name: 'Gender', count: null, icon: 'man-woman' },
  { code: 'PREFIX', name: 'Prefix', count: null, icon: 'user' },
  { code: 'MARITAL_STATUS', name: 'Marital Status', count: null, icon: 'heart' },
  { code: 'F_M_H', name: 'F/M/H', count: null, icon: 'team' },
  { code: 'RELIGION', name: 'Religion', count: null, icon: 'bank' },
  { code: 'SOCIAL_CATEGORY', name: 'Social Category', count: null, icon: 'group' },
  { code: 'SOCIAL_SUBCATEGORY', name: 'Social Subcategory', count: null, icon: 'cluster' },
  { code: 'BLOOD_GROUP', name: 'Blood Group', count: null, icon: 'drop' },
  { code: 'EMPLOYEE_STATUS', name: 'Employee Status', count: null, icon: 'safety' },
  { code: 'EXIT_TYPE', name: 'Exit Type', count: null, icon: 'logout' },
  { code: 'OCCUPATION_KIN', name: 'Occupation of Kin', count: null, icon: 'tool' },
  { code: 'QUALIFICATION', name: 'Qualification', count: null, icon: 'book' },
  { code: 'EDUCATION_LEVEL', name: 'Education Level', count: null, icon: 'bar-chart' },
  { code: 'DESIGNATION', name: 'Designation', count: null, icon: 'idcard' },
  { code: 'BANK_NAME', name: 'Bank Name', count: null, icon: 'dollar' },
  { code: 'PROCESS', name: 'Process', count: null, icon: 'setting' },
  { code: 'RELATIONSHIP', name: 'Relationship', count: null, icon: 'team' },
  { code: 'AGE_BRACKET', name: 'Age Bracket', count: null, icon: 'field-number' },
  { code: 'YES_NO', name: 'Yes/No', count: null, icon: 'check-square' }
];

@Component({
  selector: 'app-masters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzTableModule,
    NzSpinModule,
    NzModalModule,
    NzSwitchModule,
    NzTagModule,
    NzPaginationModule,
    NzInputNumberModule,
    NzToolTipModule,
    LoadingSpinnerComponent,
    PageHeaderComponent
  ],
  template: `
    <div class="masters-page page-enter">
      <app-page-header icon="control" title="Masters Setup" subtitle="Manage dropdown values used throughout the application"
        [breadcrumbs]="[{label: 'Dashboard', link: '/admin/dashboard'}, {label: 'Masters Setup'}]">
      </app-page-header>

      <div class="masters-layout">
        <aside class="categories-panel">
          <div class="categories-header">
            <h3 class="categories-title">Categories</h3>
            <span class="categories-total" *ngIf="loadedCount > 0">{{ loadedCount }} of {{ categories.length }}</span>
          </div>

          <div class="category-search">
            <nz-input-group nzSuffixIcon="search">
              <input nz-input placeholder="Search categories..." [(ngModel)]="categorySearch" (ngModelChange)="onCategorySearch()" />
            </nz-input-group>
          </div>

          <div class="category-grid" *ngIf="filteredCategories.length > 0; else noCategoryMatch">
            <div *ngFor="let cat of filteredCategories" class="category-card"
              [class.active]="selectedCategory === cat.code"
              [class.loaded]="cat.count !== null"
              (click)="selectCategory(cat.code)">
              <div class="category-card-left">
                <div class="category-card-icon" [class.active-icon]="selectedCategory === cat.code">
                  <i nz-icon [nzType]="cat.icon"></i>
                </div>
              </div>
              <div class="category-card-body">
                <span class="category-card-name">{{ cat.name }}</span>
                <span class="category-card-count">
                  <ng-container *ngIf="cat.count !== null; else loadingCount">
                    {{ cat.count }} {{ cat.count === 1 ? 'item' : 'items' }}
                  </ng-container>
                  <ng-template #loadingCount>
                    <i nz-icon nzType="loading"></i>
                  </ng-template>
                </span>
              </div>
              <div class="category-card-check" *ngIf="selectedCategory === cat.code">
                <i nz-icon nzType="check-circle" nzTheme="fill"></i>
              </div>
            </div>
          </div>

          <ng-template #noCategoryMatch>
            <div class="category-empty">
              <i nz-icon nzType="search" style="font-size: 32px; color: var(--color-text-muted);"></i>
              <p>No categories match your search</p>
            </div>
          </ng-template>
        </aside>

        <main class="data-panel">
          <ng-container *ngIf="!selectedCategory">
            <div class="empty-selection">
              <div class="empty-selection-icon">
                <i nz-icon nzType="appstore" nzTheme="outline"></i>
              </div>
              <h3>Select a Category</h3>
              <p>Choose a master data category from the grid to view and manage its values.</p>
            </div>
          </ng-container>

          <ng-container *ngIf="selectedCategory">
            <app-loading-spinner [loading]="isLoading" message="Loading master data..."></app-loading-spinner>

            <div class="data-card" *ngIf="!isLoading">
              <div class="data-card-header">
                <div class="data-card-title">
                  <i nz-icon [nzType]="selectedCategoryIcon" nzTheme="fill" class="data-card-title-icon"></i>
                  <span>{{ selectedCategoryName }}</span>
                  <span class="data-card-count">{{ masterData.length }} value{{ masterData.length !== 1 ? 's' : '' }}</span>
                </div>
                <div class="data-card-actions">
                  <nz-input-group nzSuffixIcon="search" class="table-search">
                    <input nz-input placeholder="Search..." [(ngModel)]="tableSearch" />
                  </nz-input-group>
                  <button nz-button nzType="primary" (click)="openAddModal()">
                    <i nz-icon nzType="plus"></i> Add Value
                  </button>
                </div>
              </div>

              <nz-table #dataTable [nzData]="filteredTableData" [nzFrontPagination]="true" [nzPageSize]="10"
                [nzShowSizeChanger]="true" [nzPageSizeOptions]="[10, 25, 50]" nzShowQuickJumper nzSize="small">
                <thead>
                  <tr>
                    <th nzWidth="120px">Code</th>
                    <th>Display Value</th>
                    <th nzWidth="100px">Sort Order</th>
                    <th nzWidth="100px">Status</th>
                    <th nzWidth="80px">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of dataTable.data" class="table-row">
                    <td><span class="code-chip">{{ item.code }}</span></td>
                    <td>
                      <div class="editable-cell">
                        <span *ngIf="editId !== item.id" (dblclick)="startEdit(item)" class="editable-value"
                          [title]="'Double-click to edit'">
                          {{ item.value }}
                        </span>
                        <span *ngIf="editId === item.id" class="edit-inline-wrapper">
                          <input nz-input [(ngModel)]="editValue" (blur)="saveEdit(item)"
                            (keyup.enter)="saveEdit(item)" (keyup.escape)="cancelEdit()" class="inline-edit-input"
                            #editInput autofocus />
                          <button nz-button nzType="link" nzSize="small" (click)="saveEdit(item)" class="edit-action-btn">
                            <i nz-icon nzType="check"></i>
                          </button>
                          <button nz-button nzType="link" nzSize="small" (click)="cancelEdit()" class="edit-action-btn">
                            <i nz-icon nzType="close"></i>
                          </button>
                        </span>
                      </div>
                    </td>
                    <td><span class="sort-order-badge">{{ item.sortOrder }}</span></td>
                    <td>
                      <nz-switch [ngModel]="item.active" (ngModelChange)="toggleActive(item)"
                        [nzCheckedChildren]="activeChecked" [nzUnCheckedChildren]="activeUnchecked">
                      </nz-switch>
                      <ng-template #activeChecked>
                        <i nz-icon nzType="check"></i>
                      </ng-template>
                      <ng-template #activeUnchecked>
                        <i nz-icon nzType="close"></i>
                      </ng-template>
                    </td>
                    <td>
                      <button nz-button nzType="default" nzDanger nzSize="small" (click)="deleteItem(item)"
                        nz-tooltip="Delete" class="btn-delete">
                        <i nz-icon nzType="delete"></i>
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="filteredTableData.length === 0">
                    <td colspan="5">
                      <div class="table-empty">
                        <i nz-icon nzType="inbox" style="font-size: 32px; color: var(--color-text-muted);"></i>
                        <p *ngIf="tableSearch">No values match your search</p>
                        <p *ngIf="!tableSearch">No values found for this category</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </nz-table>
            </div>
          </ng-container>
        </main>
      </div>

      <nz-modal [(nzVisible)]="isAddModalVisible" [nzTitle]="'Add ' + selectedCategoryName + ' Value'"
        (nzOnCancel)="closeAddModal()" nzWidth="520px" [nzMaskClosable]="false" class="master-add-modal">
        <ng-template nzModalContent>
          <div class="add-modal-body">
            <div class="add-field">
              <label class="add-label">Code <span class="required">*</span></label>
              <input [(ngModel)]="addCode" placeholder="Enter code (uppercase)" name="addCode"
                class="add-modal-input" style="text-transform:uppercase;" />
            </div>
            <div class="add-field">
              <label class="add-label">Display Value <span class="required">*</span></label>
              <input [(ngModel)]="addValue" placeholder="Enter display value" name="addValue"
                class="add-modal-input" />
            </div>
            <div class="add-field">
              <label class="add-label">Sort Order</label>
              <input type="number" [(ngModel)]="addSortOrder" min="1" placeholder="Auto" name="addSortOrder"
                class="add-modal-input" />
            </div>
          </div>
        </ng-template>
        <ng-template nzModalFooter>
          <button nz-button nzType="default" (click)="closeAddModal()">Cancel</button>
          <button nz-button nzType="primary" (click)="submitAddForm()" [nzLoading]="isSaving" [disabled]="!addCode || !addValue">
            <i nz-icon nzType="plus"></i> Add
          </button>
        </ng-template>
      </nz-modal>
    </div>
  `,
  styles: [`
    /* ── Page Enter Animation ── */
    @keyframes page-enter {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .masters-page.page-enter {
      animation: page-enter 0.35s ease-out;
    }

    /* ── Scrollbar Styling ── */
    .masters-page ::-webkit-scrollbar { width: 6px; height: 6px; }
    .masters-page ::-webkit-scrollbar-track { background: transparent; }
    .masters-page ::-webkit-scrollbar-thumb { background: rgba(31,61,110,0.2); border-radius: 3px; }
    .masters-page ::-webkit-scrollbar-thumb:hover { background: rgba(31,61,110,0.35); }

    .masters-page {
      width: 100%;
      padding: 12px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .masters-layout {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 12px;
      flex: 1;
      min-height: 0;
    }

    @media (max-width: 968px) {
      .masters-layout {
        grid-template-columns: 1fr;
      }
    }

    .categories-panel {
      background: var(--color-card);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border-light);
      box-shadow: var(--shadow-md);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .categories-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 12px 6px;
    }

    .categories-title {
      font-size: 15px;
      font-weight: 700;
      color: #1f3d6e;
      margin: 0;
    }

    .categories-total {
      font-size: 12px;
      color: var(--color-text-muted);
      background: var(--color-bg-alt);
      padding: 2px 10px;
      border-radius: var(--radius-pill);
    }

    .category-search {
      padding: 6px 12px;
    }

    .category-search nz-input-group {
      border-radius: var(--radius-md);
    }

    .category-grid {
      flex: 1;
      padding: 6px 8px 16px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      overflow-y: auto;
      min-height: 0;
    }

    .category-card {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 10px;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--color-border-light);
      background: var(--color-card);
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      min-height: 34px;
    }

    .category-card:hover {
      border-color: rgba(31,61,110,0.15);
      box-shadow: 0 2px 8px rgba(31, 61, 110, 0.08);
      transform: translateX(2px);
    }

    .category-card.active {
      border-color: #1f3d6e;
      background: rgba(31,61,110,0.06);
      box-shadow: 0 2px 8px rgba(31, 61, 110, 0.12);
    }

    .category-card.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: #1f3d6e;
      border-radius: 0 2px 2px 0;
    }

    .category-card-left {
      flex-shrink: 0;
    }

    .category-card-icon {
      width: 24px;
      height: 24px;
      border-radius: var(--radius-md);
      background: var(--color-bg-alt);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-secondary);
      font-size: 13px;
      transition: all 0.2s ease;
    }

    .category-card-icon.active-icon {
      background: #1f3d6e;
      color: #ffffff;
    }

    .category-card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1px;
      min-width: 0;
    }

    .category-card-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .category-card.active .category-card-name {
      color: #1f3d6e;
    }

    .category-card-count {
      font-size: 11px;
      color: var(--color-text-muted);
      font-weight: 500;
    }

    .category-card-check {
      flex-shrink: 0;
      color: #1f3d6e;
      font-size: 14px;
    }

    .category-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 24px 12px;
      text-align: center;
    }

    .category-empty p {
      font-size: 13px;
      color: var(--color-text-muted);
      margin: 0;
    }

    .data-panel {
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    .empty-selection {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      text-align: center;
      background: var(--color-card);
      border-radius: var(--radius-lg);
      border: 1px dashed var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    .empty-selection-icon {
      width: 64px;
      height: 64px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, rgba(31,61,110,0.06), var(--color-bg-alt));
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }

    .empty-selection-icon i {
      font-size: 28px;
      color: rgba(31,61,110,0.3);
    }

    .empty-selection h3 {
      font-size: 18px;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0 0 6px;
    }

    .empty-selection p {
      font-size: 14px;
      color: var(--color-text-secondary);
      margin: 0;
      max-width: 320px;
    }

    .data-card {
      background: var(--color-card);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border-light);
      box-shadow: var(--shadow-md);
      overflow: hidden;
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    .data-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border-light);
      flex-wrap: wrap;
      gap: 8px;
    }

    .data-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 700;
      color: #1f3d6e;
    }

    .data-card-title-icon {
      font-size: 18px;
      color: #1f3d6e;
    }

    .data-card-count {
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text-secondary);
      background: var(--color-bg);
      padding: 2px 10px;
      border-radius: var(--radius-pill);
    }

    .data-card-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .table-search {
      width: 180px;
    }

    .table-search nz-input-group {
      border-radius: var(--radius-md);
    }

    @media (max-width: 768px) {
      .data-card-header {
        flex-direction: column;
        align-items: stretch;
      }
      .data-card-actions {
        flex-direction: column;
      }
      .table-search {
        width: 100%;
      }
      .data-card-actions button {
        width: 100%;
      }
    }

    nz-table {
      --ant-table-header-bg: var(--color-bg-alt);
    }

    nz-table ::ng-deep .ant-table-thead > tr > th {
      background: #f8f9fc;
      color: #1f3d6e;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 12px;
      border-bottom: 2px solid #1f3d6e;
    }

    nz-table ::ng-deep .ant-table-tbody > tr > td {
      padding: 8px 12px;
      border-bottom: 1px solid var(--color-border-light);
      font-size: 13px;
      vertical-align: middle;
    }

    nz-table ::ng-deep .ant-table-tbody > tr:hover > td {
      background: rgba(31,61,110,0.06) !important;
    }

    .table-row {
      transition: background 0.15s ease;
    }

    .code-chip {
      display: inline-block;
      background: var(--color-bg-dark);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
      font-size: 12px;
      color: #1f3d6e;
      font-weight: 600;
      letter-spacing: 0.3px;
    }

    .editable-cell {
      min-height: 26px;
      display: flex;
      align-items: center;
    }

    .editable-value {
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background 0.15s ease;
      border: 1.5px solid transparent;
      display: inline-block;
      max-width: 100%;
    }

    .editable-value:hover {
      background: rgba(31,61,110,0.06);
      border-color: rgba(31,61,110,0.15);
    }

    .edit-inline-wrapper {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      width: 100%;
      max-width: 320px;
    }

    .inline-edit-input {
      flex: 1;
      border-radius: var(--radius-sm) !important;
      border-color: #1f3d6e !important;
      box-shadow: 0 0 0 3px rgba(31,61,110,0.06) !important;
    }

    .edit-action-btn {
      padding: 0 4px !important;
      height: 22px !important;
      line-height: 22px !important;
      min-width: 22px !important;
    }

    .sort-order-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: var(--radius-pill);
      background: var(--color-bg-alt);
      color: var(--color-text-secondary);
      font-size: 12px;
      font-weight: 600;
      font-family: var(--font-mono);
    }

    .btn-delete {
      border-radius: var(--radius-sm);
      transition: all 0.15s ease;
    }

    .btn-delete:hover {
      background: var(--color-danger-light) !important;
      border-color: var(--color-danger) !important;
      color: var(--color-danger) !important;
    }

    .table-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 24px;
      text-align: center;
    }

    .table-empty p {
      font-size: 13px;
      color: var(--color-text-muted);
      margin: 0;
    }

    .add-form {
      padding: 8px 0;
    }

    .add-form nz-form-item {
      margin-bottom: 12px;
    }

    .add-form nz-form-item:last-child {
      margin-bottom: 0;
    }

    .add-modal-body { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
    .add-field { display: flex; flex-direction: column; gap: 4px; }
    .add-label { font-size: 13px; font-weight: 600; color: #333; }
    .add-label .required { color: #ff4d4f; }

    .add-modal-input {
      width: 100%;
      padding: 8px 12px;
      border: 1.5px solid #d9d9d9;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      box-sizing: border-box;
      background: #fff;
      color: #333;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .add-modal-input:focus {
      border-color: #1f3d6e;
      box-shadow: 0 0 0 3px rgba(31,61,110,0.12);
    }

    @media (max-width: 768px) {
      .masters-page {
        padding: 8px;
      }
    }

    ::ng-deep .ant-input-number {
      width: 100%;
      border-radius: var(--radius-md);
    }

    ::ng-deep .ant-input-number-focused {
      box-shadow: 0 0 0 3px rgba(31,61,110,0.06) !important;
      border-color: #1f3d6e !important;
    }

    /* ── Modal Title ── */
    ::ng-deep .master-add-modal .ant-modal-title {
      color: #1f3d6e !important;
      font-weight: 700;
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
    return cat ? cat.icon : 'appstore';
  }

  get filteredCategories(): CategoryInfo[] {
    if (!this.categorySearch) return this.categories;
    const q = this.categorySearch.toLowerCase();
    return this.categories.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
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
        next: (data) => {
          cat.count = data.length;
        }
      });
    });
  }

  onCategorySearch(): void {
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
      ...item,
      value: this.editValue
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.notification.success('Success', 'Value updated successfully');
          this.masterDataService.refreshCategory(this.selectedCategory);
          this.loadCategoryData();
        }
        this.cancelEdit();
      },
      error: (err) => {
        this.notification.error('Error', err.error?.message || 'Error updating value');
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
      ...item,
      active: !item.active
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.masterDataService.refreshCategory(this.selectedCategory);
          this.loadCategoryData();
        }
      },
      error: () => {
        this.notification.error('Error', 'Error toggling status');
      }
    });
  }

  deleteItem(item: MasterDataItem): void {
    this.modal.confirm({
      nzTitle: 'Delete Master Value',
      nzContent: `Are you sure you want to delete "${item.value}" (${item.code})?`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzCancelText: 'Cancel',
      nzOnOk: () => {
        this.http.delete(`${environment.apiUrl}/masters/${item.id}`).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.notification.success('Success', 'Value deleted successfully');
              this.masterDataService.refreshCategory(this.selectedCategory);
              this.loadCategoryData();
              this.loadCategoryCounts();
            }
          },
          error: (err) => {
            this.notification.error('Error', err.error?.message || 'Error deleting value');
          }
        });
      }
    });
  }
}
