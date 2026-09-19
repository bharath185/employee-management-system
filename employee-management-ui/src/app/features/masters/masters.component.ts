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
import { NzRadioModule } from 'ng-zorro-antd/radio';

import { MasterDataService } from '../../core/services/master-data.service';
import { FormFieldConfigService, FormFieldConfig } from '../../core/services/form-field-config.service';
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
  { code: 'FIELD_CONFIG', name: 'Employee Form Fields & Mandatory Settings', count: null, icon: 'bi bi-ui-checks-grid' },
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
    NzSwitchModule, NzTagModule, NzToolTipModule, NzRadioModule
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
              <span class="ms-sub-badge">
                {{ isFieldConfigMode ? fieldConfigs.length + ' Fields' : masterData.length + ' Values' }}
              </span>
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
              <input nz-input [placeholder]="isFieldConfigMode ? 'Filter fields by name or tab...' : 'Filter values...'" [(ngModel)]="tableSearch" />
            </nz-input-group>

            <!-- Standard Add Value Button -->
            <button *ngIf="!isFieldConfigMode" nz-button class="btn-primary-gradient" (click)="openAddModal()">
              <i nz-icon nzType="plus"></i> Add Value
            </button>

            <!-- Field Config Add Custom Field Button -->
            <button *ngIf="isFieldConfigMode" nz-button class="btn-primary-gradient" (click)="openAddCustomFieldModal()">
              <i nz-icon nzType="plus-circle"></i> Add Custom Field
            </button>
          </div>
        </div>
      </div>

      <!-- VIEW 1: MASTER CATEGORIES SMALL CARDS GRID -->
      <div *ngIf="!selectedCategory" class="ms-grid-view">
        <div class="ms-cards-grid">
          <div *ngFor="let cat of filteredCategories" 
               class="ms-mini-card" 
               [class.card-featured]="cat.code === 'FIELD_CONFIG'"
               (click)="selectCategory(cat.code)">
            <div class="card-top-row">
              <div class="card-icon-box" [class.icon-featured]="cat.code === 'FIELD_CONFIG'">
                <i [ngClass]="cat.icon"></i>
              </div>
              <span class="card-count-badge" [class.badge-featured]="cat.code === 'FIELD_CONFIG'">
                <ng-container *ngIf="cat.count !== null; else countLoading">
                  {{ cat.count }} {{ cat.code === 'FIELD_CONFIG' ? 'fields' : (cat.count === 1 ? 'item' : 'items') }}
                </ng-container>
                <ng-template #countLoading><i nz-icon nzType="loading"></i></ng-template>
              </span>
            </div>
            
            <div class="card-body">
              <div class="card-name">{{ cat.name }}</div>
              <div class="card-code">{{ cat.code }}</div>
            </div>

            <div class="card-footer">
              <span class="card-action-hint">{{ cat.code === 'FIELD_CONFIG' ? 'Configure Mandatory Fields' : 'Manage Values' }}</span>
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

      <!-- VIEW 2: FIELD CONFIGURATION & MANDATORY MANAGER -->
      <div *ngIf="selectedCategory && isFieldConfigMode" class="ms-table-view">
        <!-- Section/Tab Filter Pills -->
        <div class="field-tabs-pills">
          <button *ngFor="let tab of formTabs" 
                  class="pill-btn" 
                  [class.active]="selectedTabFilter === tab" 
                  (click)="selectedTabFilter = tab">
            {{ tab }}
            <span class="pill-count">{{ getTabFieldCount(tab) }}</span>
          </button>
        </div>

        <div class="table-container">
          <nz-table 
            #fieldTable 
            [nzData]="filteredFieldConfigs" 
            [nzFrontPagination]="true" 
            [nzPageSize]="15"
            [nzShowSizeChanger]="true" 
            [nzPageSizeOptions]="[15, 30, 50, 100]"
            [nzLoading]="isLoading"
            nzBordered 
            nzSize="small" 
            class="theme-table">
            <thead>
              <tr>
                <th class="th-sno">#</th>
                <th style="min-width: 170px;">Field Label</th>
                <th style="min-width: 140px;">Field Key</th>
                <th style="min-width: 130px;">Tab / Section</th>
                <th style="min-width: 100px;" class="th-center">Data Type</th>
                <th style="min-width: 130px;" class="th-center">Mandatory Status</th>
                <th style="min-width: 100px;" class="th-center">Form Visibility</th>
                <th style="min-width: 90px;" class="th-center">Type</th>
                <th style="min-width: 80px;" class="th-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let field of fieldTable.data; let i = index">
                <td class="td-center">{{ i + 1 }}</td>
                <td>
                  <strong style="color: #1e293b; font-size: 13px;">{{ field.fieldLabel }}</strong>
                  <span *ngIf="field.isMandatory" class="mand-star" title="Mandatory Field">*</span>
                </td>
                <td><span class="code-chip">{{ field.fieldKey }}</span></td>
                <td><span class="tab-badge">{{ field.tabName }}</span></td>
                <td class="td-center">
                  <span class="type-tag">{{ field.fieldType }}</span>
                </td>
                <td class="td-center">
                  <div class="mand-switch-box">
                    <nz-switch [(ngModel)]="field.isMandatory" (ngModelChange)="toggleFieldMandatory(field)" class="mand-switch"></nz-switch>
                    <span [class.text-danger]="field.isMandatory" [class.text-muted]="!field.isMandatory" class="mand-label">
                      {{ field.isMandatory ? 'Mandatory *' : 'Optional' }}
                    </span>
                  </div>
                </td>
                <td class="td-center">
                  <nz-switch [(ngModel)]="field.isVisible" (ngModelChange)="toggleFieldVisibility(field)" class="ms-switch"></nz-switch>
                </td>
                <td class="td-center">
                  <nz-tag [nzColor]="field.isCustom ? 'purple' : 'blue'">{{ field.isCustom ? 'Custom' : 'System' }}</nz-tag>
                </td>
                <td class="td-center">
                  <button *ngIf="field.isCustom" nz-button nzType="link" nzDanger nzSize="small" (click)="deleteCustomField(field)" nz-tooltip="Delete Custom Field">
                    <i nz-icon nzType="delete"></i>
                  </button>
                  <span *ngIf="!field.isCustom" class="text-muted" style="font-size: 11px;">Default</span>
                </td>
              </tr>
              <tr *ngIf="filteredFieldConfigs.length === 0 && !isLoading">
                <td colspan="9" class="empty-cell">
                  <div class="empty-table-msg">
                    <i nz-icon nzType="inbox" style="font-size:24px; color:#cbd5e1; margin-bottom:6px"></i>
                    <span>No fields match the current filter.</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </nz-table>
        </div>
      </div>

      <!-- VIEW 3: STANDARD MASTER DATA TABLE VIEW -->
      <div *ngIf="selectedCategory && !isFieldConfigMode" class="ms-table-view">
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

    <!-- Standard Master Value Add Modal -->
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

    <!-- Add Custom Field Modal -->
    <nz-modal [(nzVisible)]="isAddCustomFieldModalVisible" [nzTitle]="'Add New Custom Employee Field'"
      (nzOnCancel)="closeAddCustomFieldModal()" nzWidth="520px" [nzMaskClosable]="false">
      <ng-template nzModalContent>
        <div class="add-modal-body">
          <div class="add-field">
            <label>Field Label <span class="required">*</span></label>
            <input nz-input [(ngModel)]="customFieldLabel" placeholder="e.g. Passport Expiry Date, PF Nominee Name" />
          </div>

          <div class="add-field">
            <label>Section / Tab Placement <span class="required">*</span></label>
            <nz-select [(ngModel)]="customFieldTab" style="width: 100%;">
              <nz-option *ngFor="let tab of formPlacementTabs" [nzValue]="tab" [nzLabel]="tab"></nz-option>
            </nz-select>
          </div>

          <div class="add-field">
            <label>Field Data Type <span class="required">*</span></label>
            <nz-select [(ngModel)]="customFieldType" style="width: 100%;">
              <nz-option nzValue="TEXT" nzLabel="Text Input (Single Line)"></nz-option>
              <nz-option nzValue="NUMBER" nzLabel="Numeric Value"></nz-option>
              <nz-option nzValue="DATE" nzLabel="Date Picker"></nz-option>
              <nz-option nzValue="SELECT" nzLabel="Dropdown / Master List"></nz-option>
              <nz-option nzValue="TEXTAREA" nzLabel="Text Area (Multi Line)"></nz-option>
              <nz-option nzValue="BOOLEAN" nzLabel="Yes/No Checkbox"></nz-option>
            </nz-select>
          </div>

          <div class="add-field" *ngIf="customFieldType === 'SELECT'">
            <label>Linked Master List (Optional)</label>
            <nz-select [(ngModel)]="customFieldMasterCategory" nzAllowClear nzPlaceHolder="Select existing master category" style="width: 100%;">
              <nz-option *ngFor="let cat of regularCategories" [nzValue]="cat.code" [nzLabel]="cat.name"></nz-option>
            </nz-select>
          </div>

          <div class="add-field" *ngIf="customFieldType === 'SELECT' && !customFieldMasterCategory">
            <label>Custom Options (Comma separated)</label>
            <input nz-input [(ngModel)]="customFieldOptions" placeholder="e.g. Option 1, Option 2, Option 3" />
          </div>

          <div class="add-field">
            <label>Placeholder Hint</label>
            <input nz-input [(ngModel)]="customFieldPlaceholder" placeholder="e.g. Enter details..." />
          </div>

          <div class="custom-toggles-row">
            <label class="toggle-item">
              <nz-switch [(ngModel)]="customFieldIsMandatory" class="mand-switch"></nz-switch>
              <span [class.text-danger]="customFieldIsMandatory" style="font-weight:600; font-size:12px;">
                {{ customFieldIsMandatory ? 'Required / Mandatory *' : 'Optional Field' }}
              </span>
            </label>
            <label class="toggle-item">
              <nz-switch [(ngModel)]="customFieldIsVisible" class="ms-switch"></nz-switch>
              <span style="font-weight:600; font-size:12px; color:#475569;">Show in Registration & Add Employee</span>
            </label>
          </div>
        </div>
      </ng-template>
      <ng-template nzModalFooter>
        <button nz-button (click)="closeAddCustomFieldModal()">Cancel</button>
        <button nz-button nzType="primary" (click)="submitCustomField()" [nzLoading]="isSaving" [disabled]="!customFieldLabel">
          <i nz-icon nzType="plus"></i> Create Field
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
    .top-left { display: flex; align-items: center; gap: 8px; }
    .ms-title-group { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .current-cat-info { display: flex; align-items: center; gap: 8px; }
    .cat-header-icon { font-size: 16px; color: #2563eb; }
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

    .top-right { display: flex; align-items: center; gap: 8px; }
    .search-wrapper { display: flex; align-items: center; }
    .ms-search-input { width: 220px; }
    :host ::ng-deep .ms-search-input .ant-input {
      border-radius: 6px !important;
      height: 30px !important;
      font-size: 12px !important;
    }

    .table-actions-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .cat-quick-select { width: 200px; }
    :host ::ng-deep .cat-quick-select .ant-select-selector {
      border-radius: 6px !important;
      height: 30px !important;
      font-size: 12px !important;
    }
    .ms-table-search { width: 190px; }
    :host ::ng-deep .ms-table-search .ant-input {
      border-radius: 6px !important;
      height: 30px !important;
      font-size: 12px !important;
    }

    .btn-back {
      height: 28px !important;
      padding: 0 10px !important;
      font-size: 12px !important;
      border-radius: 6px !important;
    }
    .btn-primary-gradient {
      background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
      border: none !important;
      color: #ffffff !important;
      height: 30px !important;
      padding: 0 12px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      border-radius: 6px !important;
      box-shadow: 0 2px 6px rgba(37,99,235,0.25) !important;
    }
    .btn-primary-gradient:hover {
      background: linear-gradient(135deg, #1d4ed8, #1e40af) !important;
    }

    /* ── Grid Cards View ── */
    .ms-grid-view { width: 100%; }
    .ms-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
    }

    .ms-mini-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 10px 12px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    .ms-mini-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      border-color: #93c5fd;
    }
    .card-featured {
      background: linear-gradient(145deg, #ffffff, #eff6ff);
      border: 1.5px solid #3b82f6;
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
      border-radius: 6px;
      background: #eff6ff;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
    }
    .icon-featured {
      background: #2563eb;
      color: #ffffff;
    }
    .card-count-badge {
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
      background: #f3f4f6;
      padding: 1px 7px;
      border-radius: 10px;
    }
    .badge-featured {
      background: #dbeafe;
      color: #1e40af;
      font-weight: 700;
    }

    .card-body { margin-bottom: 8px; }
    .card-name {
      font-size: 13px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .card-code {
      font-size: 10.5px;
      color: #9ca3af;
      font-family: monospace;
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 6px;
      border-top: 1px solid #f3f4f6;
    }
    .card-action-hint {
      font-size: 11px;
      color: #2563eb;
      font-weight: 500;
    }
    .card-arrow {
      font-size: 11px;
      color: #2563eb;
      transition: transform 0.2s ease;
    }
    .ms-mini-card:hover .card-arrow { transform: translateX(3px); }

    /* Filter pills */
    .field-tabs-pills {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .pill-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 500;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .pill-btn:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
    .pill-btn.active {
      background: #1e3a8a;
      color: #ffffff;
      border-color: #1e3a8a;
    }
    .pill-count {
      background: rgba(0,0,0,0.06);
      padding: 1px 5px;
      border-radius: 8px;
      font-size: 10.5px;
      font-weight: 600;
    }
    .pill-btn.active .pill-count {
      background: rgba(255,255,255,0.25);
      color: #ffffff;
    }

    /* ── Table View ── */
    .ms-table-view { width: 100%; }
    .table-container {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .th-sno { width: 45px; text-align: center; }
    .th-code { width: 140px; text-align: center; }
    .th-sort { width: 90px; text-align: center; }
    .th-status { width: 90px; text-align: center; }
    .th-actions { width: 90px; text-align: center; }
    .th-center { text-align: center; }
    .td-center { text-align: center; }

    .code-chip {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #475569;
      font-family: monospace;
      font-size: 11px;
      font-weight: 600;
    }
    .tab-badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #334155;
      font-size: 11px;
      font-weight: 600;
    }
    .type-tag {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 4px;
      background: #e0f2fe;
      color: #0369a1;
      font-size: 11px;
      font-weight: 600;
    }
    .mand-star {
      color: #ef4444;
      font-weight: bold;
      font-size: 14px;
      margin-left: 2px;
    }
    .mand-switch-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .mand-label {
      font-size: 11px;
      font-weight: 600;
    }
    .text-danger { color: #dc2626 !important; }
    .text-muted { color: #94a3b8 !important; }

    .editable-cell { cursor: pointer; min-height: 22px; display: flex; align-items: center; }
    .editable-value {
      padding: 2px 6px;
      border-radius: 4px;
      transition: background 0.15s ease;
      display: inline-block;
      width: 100%;
    }
    .editable-value:hover {
      background: #eff6ff;
      outline: 1px dashed #93c5fd;
    }

    .edit-inline-wrapper { display: flex; align-items: center; gap: 4px; width: 100%; }
    .inline-edit-input {
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
    :host ::ng-deep .mand-switch.ant-switch-checked { background-color: #dc2626 !important; }

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
    .custom-toggles-row {
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: #f8fafc;
      padding: 10px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      margin-top: 4px;
    }
    .toggle-item {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
    }
  `]
})
export class MastersComponent implements OnInit {
  categories = MASTER_CATEGORIES;
  selectedCategory: string = '';
  masterData: MasterDataItem[] = [];
  fieldConfigs: FormFieldConfig[] = [];
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

  // Custom Field Form
  isAddCustomFieldModalVisible = false;
  customFieldLabel = '';
  customFieldTab = 'Personal Info';
  customFieldType = 'TEXT';
  customFieldMasterCategory = '';
  customFieldOptions = '';
  customFieldPlaceholder = '';
  customFieldIsMandatory = false;
  customFieldIsVisible = true;

  selectedTabFilter = 'All';
  readonly formTabs = [
    'All',
    'Personal Info',
    'Employment',
    'Bank & Identity',
    'Education',
    'Family & Kin',
    'Experience & Ref.',
    'Demographics & Assets',
    'Exit & Docs',
    'Custom Fields'
  ];

  readonly formPlacementTabs = [
    'Personal Info',
    'Employment',
    'Bank & Identity',
    'Education',
    'Family & Kin',
    'Experience & Ref.',
    'Demographics & Assets',
    'Exit & Docs'
  ];

  constructor(
    private masterDataService: MasterDataService,
    private formFieldConfigService: FormFieldConfigService,
    private http: HttpClient,
    private notification: NzNotificationService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.loadCategoryCounts();
  }

  get isFieldConfigMode(): boolean {
    return this.selectedCategory === 'FIELD_CONFIG';
  }

  get regularCategories(): CategoryInfo[] {
    return this.categories.filter(c => c.code !== 'FIELD_CONFIG');
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

  get filteredFieldConfigs(): FormFieldConfig[] {
    let list = this.fieldConfigs;
    if (this.selectedTabFilter === 'Custom Fields') {
      list = list.filter(f => f.isCustom);
    } else if (this.selectedTabFilter !== 'All') {
      list = list.filter(f => f.tabName === this.selectedTabFilter);
    }
    if (!this.tableSearch) return list;
    const q = this.tableSearch.toLowerCase();
    return list.filter(f =>
      f.fieldLabel.toLowerCase().includes(q) ||
      f.fieldKey.toLowerCase().includes(q) ||
      f.tabName.toLowerCase().includes(q) ||
      f.fieldType.toLowerCase().includes(q)
    );
  }

  getTabFieldCount(tab: string): number {
    if (tab === 'All') return this.fieldConfigs.length;
    if (tab === 'Custom Fields') return this.fieldConfigs.filter(f => f.isCustom).length;
    return this.fieldConfigs.filter(f => f.tabName === tab).length;
  }

  clearSelectedCategory(): void {
    this.selectedCategory = '';
    this.tableSearch = '';
    this.cancelEdit();
    this.loadCategoryCounts();
  }

  private loadCategoryCounts(): void {
    this.masterDataService.getCategoryCounts().subscribe({
      next: (response: any) => {
        const counts = response.data || response || {};
        this.categories.forEach(cat => {
          if (cat.code !== 'FIELD_CONFIG') {
            cat.count = counts[cat.code] !== undefined ? counts[cat.code] : (counts[cat.code.toUpperCase()] !== undefined ? counts[cat.code.toUpperCase()] : 0);
          }
        });
      },
      error: () => {
        this.categories.forEach(cat => {
          if (cat.code !== 'FIELD_CONFIG' && cat.count === null) cat.count = 0;
        });
      }
    });

    // Load Field Config count
    this.formFieldConfigService.getAllConfigs().subscribe({
      next: (configs) => {
        const fieldCat = this.categories.find(c => c.code === 'FIELD_CONFIG');
        if (fieldCat) fieldCat.count = configs.length;
      },
      error: () => {
        const fieldCat = this.categories.find(c => c.code === 'FIELD_CONFIG');
        if (fieldCat) fieldCat.count = 0;
      }
    });
  }

  selectCategory(category: string): void {
    if (this.selectedCategory === category) return;
    this.cancelEdit();
    this.selectedCategory = category;
    this.tableSearch = '';
    this.selectedTabFilter = 'All';
    this.loadCategoryData();
  }

  private loadCategoryData(): void {
    if (!this.selectedCategory) return;
    this.isLoading = true;

    if (this.isFieldConfigMode) {
      this.formFieldConfigService.getAllConfigs().subscribe({
        next: (data) => {
          this.isLoading = false;
          this.fieldConfigs = data;
          const cat = this.categories.find(c => c.code === 'FIELD_CONFIG');
          if (cat) cat.count = data.length;
        },
        error: () => {
          this.isLoading = false;
          this.notification.error('Error', 'Error loading form field configurations');
        }
      });
    } else {
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
  }

  // ========== FIELD CONFIG METHODS ==========
  toggleFieldMandatory(field: FormFieldConfig): void {
    if (!field.id) return;
    this.formFieldConfigService.toggleMandatory(field.id).subscribe({
      next: (updated) => {
        field.isMandatory = updated.isMandatory;
        this.notification.success('Field Updated', `${field.fieldLabel} is now ${field.isMandatory ? 'MANDATORY' : 'OPTIONAL'}`);
      },
      error: () => {
        field.isMandatory = !field.isMandatory;
        this.notification.error('Error', 'Failed to update mandatory status');
      }
    });
  }

  toggleFieldVisibility(field: FormFieldConfig): void {
    if (!field.id) return;
    this.formFieldConfigService.toggleVisibility(field.id).subscribe({
      next: (updated) => {
        field.isVisible = updated.isVisible;
        this.notification.success('Field Updated', `${field.fieldLabel} visibility updated`);
      },
      error: () => {
        field.isVisible = !field.isVisible;
        this.notification.error('Error', 'Failed to update visibility');
      }
    });
  }

  openAddCustomFieldModal(): void {
    this.customFieldLabel = '';
    this.customFieldTab = 'Personal Info';
    this.customFieldType = 'TEXT';
    this.customFieldMasterCategory = '';
    this.customFieldOptions = '';
    this.customFieldPlaceholder = '';
    this.customFieldIsMandatory = false;
    this.customFieldIsVisible = true;
    this.isAddCustomFieldModalVisible = true;
  }

  closeAddCustomFieldModal(): void {
    this.isAddCustomFieldModalVisible = false;
  }

  submitCustomField(): void {
    if (!this.customFieldLabel.trim()) return;
    this.isSaving = true;
    const payload: Partial<FormFieldConfig> = {
      fieldLabel: this.customFieldLabel.trim(),
      tabName: this.customFieldTab,
      fieldType: this.customFieldType,
      masterCategory: this.customFieldType === 'SELECT' ? this.customFieldMasterCategory : undefined,
      options: this.customFieldOptions ? this.customFieldOptions.trim() : undefined,
      placeholder: this.customFieldPlaceholder ? this.customFieldPlaceholder.trim() : undefined,
      isMandatory: this.customFieldIsMandatory,
      isVisible: this.customFieldIsVisible
    };

    this.formFieldConfigService.createCustomField(payload).subscribe({
      next: (created) => {
        this.isSaving = false;
        this.notification.success('Success', `Custom field "${created.fieldLabel}" created successfully`);
        this.closeAddCustomFieldModal();
        this.loadCategoryData();
      },
      error: (err) => {
        this.isSaving = false;
        this.notification.error('Error', err.error?.message || 'Failed to create custom field');
      }
    });
  }

  deleteCustomField(field: FormFieldConfig): void {
    if (!field.id || !field.isCustom) return;
    this.modal.confirm({
      nzTitle: 'Delete Custom Field',
      nzContent: `Are you sure you want to delete custom field "${field.fieldLabel}"? Any saved values for this field will remain in historical records.`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        this.formFieldConfigService.deleteCustomField(field.id!).subscribe({
          next: () => {
            this.notification.success('Success', 'Custom field deleted successfully');
            this.loadCategoryData();
          },
          error: (err) => {
            this.notification.error('Error', err.error?.message || 'Failed to delete custom field');
          }
        });
      }
    });
  }

  // ========== REGULAR MASTER VALUES METHODS ==========
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
