import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzAlertModule } from 'ng-zorro-antd/alert';

import { EmployeeService } from '../../core/services/employee.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { EmployeeDocumentService } from '../../core/services/employee-document.service';
import { Employee } from '../../core/models/employee.model';
import { EmployeeDocument, StagedDocumentItem, DOCUMENT_CATEGORIES, DocumentCategoryOption } from '../../core/models/employee-document.model';
import { MasterDataItem } from '../../core/models/api-response.model';
import { AuthService } from '../../core/services/auth.service';
import { saveAs } from 'file-saver';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DocumentTemplateListComponent } from '../document-templates/document-template-list.component';

@Component({
  selector: 'app-document-hub',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzTabsModule,
    NzSelectModule,
    NzInputModule,
    NzInputNumberModule,
    NzTableModule,
    NzModalModule,
    NzSpinModule,
    NzToolTipModule,
    NzBadgeModule,
    NzEmptyModule,
    NzProgressModule,
    NzRadioModule,
    NzCheckboxModule,
    NzAlertModule,
    DocumentTemplateListComponent
  ],
  template: `
    <div class="dh-container page-enter">
      <!-- Standard Sub Navigation Bar -->
      <div class="pp-sub-nav">
        <span class="pp-nav-item active">
          <i nz-icon nzType="folder-open"></i><span>Document Hub</span>
        </span>
        <div class="pp-sub-nav-actions">
          <span class="sub-nav-count" *ngIf="hasSearched">
            <i nz-icon nzType="file"></i> {{ documents.length }} Documents Found
          </span>
          <span class="sub-nav-count stat-selected" *ngIf="selectedDocIds.size > 0">
            <i nz-icon nzType="check-square"></i> {{ selectedDocIds.size }} Selected
          </span>
        </div>
      </div>

      <!-- Main Tabs Container -->
      <nz-card class="dh-main-card" [nzBodyStyle]="{ padding: '0px' }" nzSize="small">
        <nz-tabset [(nzSelectedIndex)]="activeTabIndex" class="dh-tabset">
          
          <!-- ========================================== -->
          <!-- 1. UPLOAD & SEGREGATION TAB -->
          <!-- ========================================== -->
          <nz-tab nzTitle="📤 Upload & Segregate Documents">
            <div class="tab-pane-content">
              
              <!-- Hidden File Inputs -->
              <input
                #imageFileInput
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,image/bmp"
                style="display:none"
                (change)="onImagesSelected($event)" />

              <input
                #pdfFileInput
                type="file"
                accept="application/pdf,.pdf"
                style="display:none"
                (change)="onPdfSelected($event)" />

              <!-- Unified Single-Line Header: Target Employee (Mandatory) & Upload Mode -->
              <div class="dh-upload-unified-card" *ngIf="stagedFiles.length === 0">
                <div class="upload-top-row">
                  <!-- 1. Target Employee Selector -->
                  <div class="emp-select-col">
                    <label class="dh-field-label">
                      <i nz-icon nzType="user"></i> 1. Target Employee <span class="req">* (Required)</span>
                    </label>
                    <div class="emp-select-row">
                      <nz-select
                        [(ngModel)]="selectedEmployeeId"
                        (ngModelChange)="onEmployeeSelected()"
                        nzShowSearch
                        nzPlaceHolder="Search & select employee first..."
                        class="dh-emp-select"
                        nzSize="large">
                        <nz-option
                          *ngFor="let emp of employees"
                          [nzValue]="emp.id"
                          [nzLabel]="(emp.employeeCode || '') + ' — ' + (emp.prefix ? emp.prefix + '. ' : '') + (emp.firstName || '') + (emp.middleName ? ' ' + emp.middleName : '') + (emp.surname ? ' ' + emp.surname : '') + (emp.processAssigned ? ' [' + emp.processAssigned + ']' : '') + ' (' + (emp.designation || 'Staff') + ')'">
                        </nz-option>
                      </nz-select>

                      <div class="dh-emp-badge-card" *ngIf="selectedEmployee">
                        <div class="emp-avatar-circle">{{ getInitials(selectedEmployee.firstName, selectedEmployee.surname) }}</div>
                        <div class="emp-badge-info">
                          <span class="emp-badge-name">{{ selectedEmployee.prefix ? selectedEmployee.prefix + '. ' : '' }}{{ selectedEmployee.firstName || '' }}{{ selectedEmployee.middleName ? ' ' + selectedEmployee.middleName : '' }}{{ selectedEmployee.surname ? ' ' + selectedEmployee.surname : '' }}</span>
                          <span class="emp-badge-sub">
                            <nz-tag nzColor="blue">{{ selectedEmployee.employeeCode }}</nz-tag>
                            {{ selectedEmployee.processAssigned || 'No Process' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 2. Choose Upload Mode (Compact Pill Options) -->
                  <div class="upload-mode-col">
                    <label class="dh-field-label"><i nz-icon nzType="sliders"></i> 2. Choose Upload Mode</label>
                    <div class="mode-options-inline">
                      <!-- Mode 1: Multiple Images -->
                      <div class="mode-card" [class.active]="uploadMode === 'images'" (click)="setUploadMode('images')">
                        <div class="mode-radio-circle">
                          <i nz-icon nzType="check" *ngIf="uploadMode === 'images'"></i>
                        </div>
                        <div class="mode-icon-box mode-icon-img">
                          <i nz-icon nzType="picture"></i>
                        </div>
                        <div class="mode-info">
                          <h4 class="mode-name">Option 1: Multiple Images</h4>
                          <p class="mode-desc">Photos / Scans (JPEG, PNG, WEBP)</p>
                        </div>
                      </div>

                      <!-- Mode 2: Single PDF with Auto Page Split -->
                      <div class="mode-card" [class.active]="uploadMode === 'pdf_split'" (click)="setUploadMode('pdf_split')">
                        <div class="mode-radio-circle">
                          <i nz-icon nzType="check" *ngIf="uploadMode === 'pdf_split'"></i>
                        </div>
                        <div class="mode-icon-box mode-icon-pdf">
                          <i nz-icon nzType="file-pdf"></i>
                        </div>
                        <div class="mode-info">
                          <h4 class="mode-name">Option 2: Single PDF Upload</h4>
                          <p class="mode-desc">Auto Split Pages into individual docs</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- MANDATORY EMPLOYEE SELECTION NOTICE / LOCKED DROPZONE (When no employee selected) -->
              <div
                *ngIf="!selectedEmployeeId && stagedFiles.length === 0"
                class="dh-dropzone mode-locked-dropzone"
                nz-tooltip="Please select an employee in the dropdown above first">
                <div class="dropzone-inner">
                  <div class="dropzone-icon-circle lock-circle">
                    <i nz-icon nzType="lock" class="dropzone-icon"></i>
                  </div>
                  <h3 class="dropzone-title" style="color: #1e3a8a;">Step 1: Select Target Employee First (Mandatory)</h3>
                  <p class="dropzone-subtitle">
                    Please search and select the target employee above to unlock file upload and page segregation.
                  </p>
                </div>
              </div>

              <!-- MODE 1: MULTIPLE IMAGES DROPZONE (Unlocked only after employee is selected) -->
              <div
                *ngIf="selectedEmployeeId && uploadMode === 'images' && stagedFiles.length === 0"
                class="dh-dropzone mode-images-dropzone"
                (dragover)="onDragOver($event)"
                (dragleave)="onDragLeave($event)"
                (drop)="onDropImages($event)"
                (click)="imageFileInput.click()">
                <div class="dropzone-inner">
                  <div class="dropzone-icon-circle img-circle">
                    <i nz-icon nzType="picture" class="dropzone-icon"></i>
                  </div>
                  <h3 class="dropzone-title">Click or Drag & Drop Multiple Images Here</h3>
                  <p class="dropzone-subtitle">
                    Uploading for <strong>{{ selectedEmployee?.employeeCode }} — {{ selectedEmployee?.prefix ? selectedEmployee?.prefix + '. ' : '' }}{{ selectedEmployee?.firstName }} {{ selectedEmployee?.middleName ? selectedEmployee?.middleName + ' ' : '' }}{{ selectedEmployee?.surname }}</strong>. Select multiple image files (<strong>JPEG, PNG, WEBP</strong>).
                  </p>
                  <button nz-button nzType="primary" class="btn-browse" (click)="$event.stopPropagation(); imageFileInput.click()">
                    <i nz-icon nzType="folder-add"></i> Choose Image Files
                  </button>
                </div>
              </div>

              <!-- MODE 2: SINGLE COMBINED PDF DROPZONE (Unlocked only after employee is selected) -->
              <div
                *ngIf="selectedEmployeeId && uploadMode === 'pdf_split' && (stagedFiles.length === 0 || isSplittingPdf)"
                class="dh-dropzone mode-pdf-dropzone"
                (dragover)="onDragOver($event)"
                (dragleave)="onDragLeave($event)"
                (drop)="onDropPdf($event)"
                (click)="!isSplittingPdf && pdfFileInput.click()">
                <div class="dropzone-inner" *ngIf="!isSplittingPdf">
                  <div class="dropzone-icon-circle pdf-circle">
                    <i nz-icon nzType="file-pdf" class="dropzone-icon"></i>
                  </div>
                  <h3 class="dropzone-title">Click or Drag & Drop Single Combined PDF File Here</h3>
                  <p class="dropzone-subtitle">
                    Uploading for <strong>{{ selectedEmployee?.employeeCode }} — {{ selectedEmployee?.prefix ? selectedEmployee?.prefix + '. ' : '' }}{{ selectedEmployee?.firstName }} {{ selectedEmployee?.middleName ? selectedEmployee?.middleName + ' ' : '' }}{{ selectedEmployee?.surname }}</strong>. The system will automatically <strong>extract and split each page</strong> into separate document records.
                  </p>
                  <button nz-button nzType="primary" class="btn-browse btn-pdf-browse" (click)="$event.stopPropagation(); pdfFileInput.click()">
                    <i nz-icon nzType="file-pdf"></i> Choose Combined PDF File
                  </button>
                </div>

                <!-- PDF Splitting Loading Progress -->
                <div class="dropzone-inner splitting-progress" *ngIf="isSplittingPdf">
                  <nz-spin nzSimple nzTip="Extracting & splitting PDF pages into individual documents..."></nz-spin>
                  <p style="margin-top: 12px; font-weight: 600; color: #1e3a8a;">Please wait while we split and generate previews for each page...</p>
                </div>
              </div>

              <!-- Staging & Segregation Workspace -->
              <div class="dh-staging-section" *ngIf="stagedFiles.length > 0">
                <div class="staging-header">
                  <div class="staging-title-wrap">
                    <h3 class="staging-title">
                      <i nz-icon nzType="appstore"></i> Staged Document Pages for Segregation
                      <span class="staging-count-badge">{{ stagedFiles.length }} pages/files</span>
                    </h3>
                    <p class="staging-desc">
                      Assign which page is which document (e.g. <code>Aadhar-1</code>, <code>Aadhar-2</code>, <code>PAN Card</code>, <code>Degree</code>). Click any thumbnail to preview full-screen.
                    </p>
                  </div>

                  <!-- Quick Staging Tools -->
                  <div class="staging-actions">
                    <button nz-button nzType="default" nzSize="small" (click)="uploadMode === 'images' ? imageFileInput.click() : pdfFileInput.click()" nz-tooltip="Add more files/pages to current staging">
                      <i nz-icon nzType="plus"></i> Add More Files
                    </button>
                    <button nz-button nzSize="small" (click)="autoNumberStagedPages()" nz-tooltip="Auto-assign sequential page numbers (1, 2, 3...) to same categories">
                      <i nz-icon nzType="ordered-list"></i> Auto-Number Pages
                    </button>
                    <button nz-button nzSize="small" (click)="openBulkCategoryModal()" nz-tooltip="Apply category to all staged pages">
                      <i nz-icon nzType="tag"></i> Set Category for All
                    </button>
                    <button nz-button nzSize="small" nzDanger (click)="clearStagedFiles()">
                      <i nz-icon nzType="delete"></i> Clear Staging
                    </button>
                  </div>
                </div>

                <!-- Staged Grid Cards (Compact Design) -->
                <div class="staged-compact-grid">
                  <div class="staged-compact-card" *ngFor="let item of stagedFiles; let i = index">
                    <!-- Left: Mini Thumbnail & Preview -->
                    <div class="mini-thumb-col" (click)="openPreviewModal(item)" nz-tooltip="Click to Preview Full Page">
                      <div class="mini-thumb-box">
                        <img *ngIf="item.isImage && item.previewUrl" [src]="item.previewUrl" alt="Thumb" class="mini-thumb-img" />
                        <div *ngIf="item.isPdf" class="mini-thumb-pdf">
                          <i nz-icon nzType="file-pdf" class="mini-pdf-ico"></i>
                          <span class="mini-pdf-pg">P.{{ item.pageNumber }}</span>
                        </div>
                        <div *ngIf="!item.isImage && !item.isPdf" class="mini-thumb-generic">
                          <i nz-icon nzType="file-text"></i>
                        </div>
                      </div>
                      <button nz-button nzType="link" nzSize="small" class="mini-preview-btn" (click)="$event.stopPropagation(); openPreviewModal(item)">
                        <i nz-icon nzType="eye"></i> View
                      </button>
                    </div>

                    <!-- Middle: Category & Document Title -->
                    <div class="mini-fields-col">
                      <div class="fields-top-row">
                        <div class="field-item cat-select-item">
                          <nz-select [(ngModel)]="item.documentType" (ngModelChange)="onCategoryChange(item)" nzSize="small" class="w-full" nzPlaceHolder="Category">
                            <nz-option *ngFor="let cat of categories" [nzValue]="cat.code" [nzLabel]="cat.label"></nz-option>
                          </nz-select>
                        </div>
                        <div class="field-item title-input-item">
                          <input nz-input [(ngModel)]="item.documentTitle" placeholder="Document Title (e.g. Aadhar-1)" nzSize="small" />
                        </div>
                      </div>

                      <div class="fields-bottom-row">
                        <div class="page-badge-item">
                          <span class="pg-label">Page:</span>
                          <nz-input-number [(ngModel)]="item.pageNumber" [nzMin]="1" [nzMax]="99" nzSize="small" class="pg-num-input"></nz-input-number>
                        </div>
                        <div class="file-name-item" [nz-tooltip]="item.file.name">
                          <i nz-icon nzType="paper-clip"></i>
                          <span class="file-name-text">{{ item.file.name }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Right: Quick Actions (Reorder & Remove) -->
                    <div class="mini-actions-col">
                      <div class="mini-reorder-group">
                        <button nz-button nzType="text" nzSize="small" [disabled]="i === 0" (click)="moveStaged(i, -1)" nz-tooltip="Move Left">
                          <i nz-icon nzType="arrow-left"></i>
                        </button>
                        <button nz-button nzType="text" nzSize="small" [disabled]="i === stagedFiles.length - 1" (click)="moveStaged(i, 1)" nz-tooltip="Move Right">
                          <i nz-icon nzType="arrow-right"></i>
                        </button>
                      </div>
                      <button nz-button nzType="text" nzDanger nzSize="small" class="mini-remove-btn" (click)="removeStaged(i)" nz-tooltip="Remove">
                        <i nz-icon nzType="delete"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Bottom Sticky Upload Bar -->
                <div class="dh-upload-submit-bar">
                  <div class="submit-bar-left">
                    <span class="submit-summary">
                      Ready to upload <strong>{{ stagedFiles.length }}</strong> document page(s) for <strong>{{ selectedEmployee ? (selectedEmployee.employeeCode + ' — ' + (selectedEmployee.prefix ? selectedEmployee.prefix + '. ' : '') + (selectedEmployee.firstName || '') + (selectedEmployee.middleName ? ' ' + selectedEmployee.middleName : '') + (selectedEmployee.surname ? ' ' + selectedEmployee.surname : '')) : 'Selected Employee' }}</strong>
                    </span>
                    <nz-progress *ngIf="isUploading" [nzPercent]="uploadProgressPercent" nzStatus="active" [nzStrokeWidth]="6" style="width: 180px; margin-left: 12px;"></nz-progress>
                  </div>
                  <div class="submit-bar-right">
                    <button nz-button nzType="default" (click)="clearStagedFiles()" [disabled]="isUploading">
                      Cancel
                    </button>
                    <button nz-button nzType="primary" class="btn-primary-gradient" (click)="uploadAllStaged()" [nzLoading]="isUploading" [disabled]="!selectedEmployeeId || stagedFiles.length === 0">
                      <i nz-icon nzType="cloud-upload"></i> Upload & Save All Documents ({{ stagedFiles.length }})
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </nz-tab>

          <!-- ========================================== -->
          <!-- 2. DOCUMENT LIBRARY & DOWNLOADS TAB -->
          <!-- ========================================== -->
          <nz-tab nzTitle="📥 Document Library & Downloads">
            <div class="tab-pane-content">
              
              <!-- Comprehensive Single-Line Filter Panel -->
              <div class="dh-filter-card">
                <div class="dh-filter-single-row">
                  
                  <!-- 1. Process Filter -->
                  <div class="filter-col filter-col-process">
                    <div class="label-with-actions">
                      <label class="dh-field-label"><i nz-icon nzType="branches"></i> 1. Process</label>
                      <button nz-button nzType="link" nzSize="small" *ngIf="filterProcess !== 'ALL'" (click)="filterProcess = 'ALL'; onProcessFilterChange()" class="link-btn">Reset</button>
                    </div>
                    <nz-select
                      [(ngModel)]="filterProcess"
                      (ngModelChange)="onProcessFilterChange()"
                      nzPlaceHolder="All Processes"
                      class="w-full">
                      <nz-option nzValue="ALL" nzLabel="All Processes"></nz-option>
                      <nz-option *ngFor="let p of processes" [nzValue]="p.value" [nzLabel]="p.value"></nz-option>
                    </nz-select>
                  </div>

                  <!-- 2. Multi-Employee Filter -->
                  <div class="filter-col filter-col-emp">
                    <div class="label-with-actions">
                      <label class="dh-field-label">
                        <i nz-icon nzType="team"></i> 2. Staff
                        <span class="sub-count-tag" *ngIf="filterProcess !== 'ALL'">
                          {{ filteredEmployees.length }}
                        </span>
                      </label>
                      <div class="quick-emp-actions">
                        <button nz-button nzType="link" nzSize="small" (click)="selectAllEmployees()" class="link-btn">
                          {{ filterProcess !== 'ALL' ? 'All in ' + filterProcess : 'All Staff' }}
                        </button>
                        <span class="sep">|</span>
                        <button nz-button nzType="link" nzSize="small" (click)="clearEmployeeSelection()" class="link-btn">Clear</button>
                      </div>
                    </div>
                    <nz-select
                      [(ngModel)]="filterEmployeeIds"
                      (ngModelChange)="onEmployeeFilterChange()"
                      nzMode="multiple"
                      [nzMaxTagCount]="1"
                      nzPlaceHolder="Search staff..."
                      class="w-full"
                      nzShowSearch>
                      <nz-option
                        *ngFor="let emp of filteredEmployees"
                        [nzValue]="emp.id"
                        [nzLabel]="(emp.employeeCode || '') + ' - ' + (emp.prefix ? emp.prefix + '. ' : '') + (emp.firstName || '') + (emp.middleName ? ' ' + emp.middleName : '') + (emp.surname ? ' ' + emp.surname : '')">
                      </nz-option>
                    </nz-select>
                  </div>

                  <!-- 3. Document Category Multi-Select with Checkboxes -->
                  <div class="filter-col filter-col-cat">
                    <div class="label-with-actions">
                      <label class="dh-field-label"><i nz-icon nzType="folder"></i> 3. Categories</label>
                      <div class="quick-emp-actions">
                        <button nz-button nzType="link" nzSize="small" (click)="selectAllCategories()" class="link-btn">All</button>
                        <span class="sep">|</span>
                        <button nz-button nzType="link" nzSize="small" (click)="clearCategories()" class="link-btn">Clear</button>
                      </div>
                    </div>
                    <nz-select
                      [(ngModel)]="filterCategories"
                      (ngModelChange)="onCategoriesFilterChange()"
                      nzMode="multiple"
                      [nzMaxTagCount]="1"
                      nzPlaceHolder="Check doc types..."
                      class="w-full">
                      <nz-option
                        *ngFor="let cat of categories"
                        [nzValue]="cat.code"
                        [nzLabel]="cat.label"
                        [nzCustomContent]="true">
                        <div class="cat-option-row">
                          <label nz-checkbox [nzChecked]="filterCategories.includes(cat.code)"></label>
                          <nz-tag [nzColor]="cat.color" style="margin-left: 6px; font-size: 10.5px;">{{ cat.label }}</nz-tag>
                        </div>
                      </nz-option>
                    </nz-select>
                  </div>

                  <!-- 4. Keyword Search -->
                  <div class="filter-col filter-col-search">
                    <label class="dh-field-label"><i nz-icon nzType="search"></i> 4. Search</label>
                    <nz-input-group [nzSuffix]="suffixIconSearch">
                      <input type="text" nz-input placeholder="Title / File / Code..." [(ngModel)]="searchKeyword" (keyup.enter)="searchDocuments()" />
                    </nz-input-group>
                    <ng-template #suffixIconSearch>
                      <i nz-icon nzType="search"></i>
                    </ng-template>
                  </div>

                  <!-- 5. Actions Row (Inline) -->
                  <div class="filter-col filter-col-actions">
                    <div class="dh-filter-actions-inline">
                      <button nz-button nzType="primary" class="btn-primary-gradient" (click)="searchDocuments()" [nzLoading]="isLoadingDocs">
                        <i nz-icon nzType="search"></i> Search & View
                      </button>
                      <button nz-button nzType="default" (click)="resetAllFilters()" nz-tooltip="Reset Filters" class="btn-reset">
                        <i nz-icon nzType="reload"></i>
                      </button>

                      <!-- View Mode Toggle (single employee view) -->
                      <nz-radio-group [(ngModel)]="viewMode" nzButtonStyle="solid" nzSize="small" *ngIf="hasSearched && documents.length > 0 && !isMultiEmployee">
                        <label nz-radio-button nzValue="grid" nz-tooltip="Grid View"><i nz-icon nzType="appstore"></i></label>
                        <label nz-radio-button nzValue="table" nz-tooltip="Table View"><i nz-icon nzType="bars"></i></label>
                      </nz-radio-group>

                      <!-- ZIP Download Tools -->
                      <button
                        *ngIf="hasSearched && documents.length > 0"
                        nz-button
                        nzType="default"
                        class="btn-zip-download"
                        (click)="downloadSelectedZip()"
                        [disabled]="selectedDocIds.size === 0"
                        [nzLoading]="isZipDownloading"
                        nz-tooltip="Download only selected documents as ZIP">
                        <i nz-icon nzType="file-zip"></i> Selected ({{ selectedDocIds.size }})
                      </button>

                      <button
                        *ngIf="hasSearched && documents.length > 0"
                        nz-button
                        nzType="default"
                        class="btn-zip-all"
                        (click)="downloadAllVisibleZip()"
                        [nzLoading]="isZipDownloading"
                        nz-tooltip="Download all documents found as ZIP">
                        <i nz-icon nzType="cloud-download"></i> All ({{ documents.length }})
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              <!-- 1. Initial Empty State (Before Searching) -->
              <div *ngIf="!hasSearched && !isLoadingDocs" class="dh-initial-state-card">
                <div class="initial-state-icon">
                  <i nz-icon nzType="file-search"></i>
                </div>
                <h3 class="initial-state-title">Ready to Search & Download Documents</h3>
                <p class="initial-state-desc">
                  Filter by <strong>Process</strong>, select <strong>Staff</strong>, check desired <strong>Document Types</strong>, and click <strong>Search & View Documents</strong>.
                </p>
                <div class="initial-quick-btns">
                  <button nz-button nzType="primary" (click)="searchAllDocuments()">
                    <i nz-icon nzType="database"></i> View All Staff Documents
                  </button>
                </div>
              </div>

              <!-- 2. Loading State -->
              <div *ngIf="isLoadingDocs" class="dh-loading-box">
                <nz-spin nzSimple nzTip="Fetching documents from repository..."></nz-spin>
              </div>

              <!-- 3. No Results Found State -->
              <div *ngIf="hasSearched && !isLoadingDocs && documents.length === 0" class="dh-empty-card">
                <nz-empty
                  nzNotFoundImage="simple"
                  [nzNotFoundContent]="'No documents matched your filter criteria.'">
                </nz-empty>
                <button nz-button nzType="default" (click)="resetAllFilters()">
                  <i nz-icon nzType="reload"></i> Reset All Filters
                </button>
              </div>

              <!-- ========================================================== -->
              <!-- 4. MULTI-EMPLOYEE DIRECT ZIP DOWNLOAD VIEW (> 1 Employee)  -->
              <!-- ========================================================== -->
              <div *ngIf="hasSearched && !isLoadingDocs && documents.length > 0 && isMultiEmployee" class="dh-multi-emp-panel">
                <!-- Top Direct Download Action Box -->
                <div class="multi-emp-action-card">
                  <div class="multi-emp-banner-left">
                    <div class="multi-emp-icon-circle">
                      <i nz-icon nzType="file-zip"></i>
                    </div>
                    <div class="multi-emp-header-content">
                      <div class="multi-emp-title-row">
                        <h3 class="multi-emp-title">Batch Document Export</h3>
                        <span class="multi-stat-pill staff-pill">
                          <i nz-icon nzType="team"></i> {{ distinctEmployeeCount }} Staff Members
                        </span>
                        <span class="multi-stat-pill docs-pill">
                          <i nz-icon nzType="file-text"></i> {{ selectedDocIds.size }} / {{ documents.length }} Documents Ready
                        </span>
                      </div>
                      
                      <!-- Category selection tags / breakdown -->
                      <div class="multi-cat-row">
                        <span class="multi-cat-title"><i nz-icon nzType="folder-open"></i> Included Categories:</span>
                        <ng-container *ngIf="selectedCategoryLabels.length > 0">
                          <nz-tag *ngFor="let cat of selectedCategoryLabels" [nzColor]="cat.color" class="multi-cat-pill">
                            <i nz-icon nzType="check-circle"></i> {{ cat.label }}
                          </nz-tag>
                        </ng-container>
                        <span *ngIf="selectedCategoryLabels.length === 0" class="multi-no-cat-hint">
                          <i nz-icon nzType="warning"></i> No document category selected. Check categories in the filter bar above.
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="multi-emp-banner-right">
                    <button
                      nz-button
                      nzType="primary"
                      class="btn-primary-gradient btn-lg-zip"
                      (click)="downloadSelectedZip()"
                      [disabled]="selectedDocIds.size === 0"
                      [nzLoading]="isZipDownloading"
                      nz-tooltip="Download all selected documents across all staff as a single structured ZIP">
                      <i nz-icon nzType="cloud-download"></i> Download Combined ZIP ({{ selectedDocIds.size }} Files)
                    </button>
                  </div>
                </div>

                <!-- Staff Breakdown Table with Direct Individual ZIP Downloads -->
                <div class="multi-emp-table-card">
                  <div class="multi-table-header">
                    <div class="multi-table-title-box">
                      <span class="multi-table-title"><i nz-icon nzType="usergroup-add"></i> Staff Breakdown & Individual Exports</span>
                      <span class="multi-table-badge">{{ groupedEmployeeSummaries.length }} Employees</span>
                    </div>
                    <span class="multi-table-hint">
                      <i nz-icon nzType="info-circle"></i> Individual ZIPs include only the selected document categories
                    </span>
                  </div>

                  <nz-table #empGroupTable [nzData]="groupedEmployeeSummaries" nzSize="middle" class="theme-table multi-emp-table" [nzPageSize]="10" [nzShowPagination]="groupedEmployeeSummaries.length > 10">
                    <thead>
                      <tr>
                        <th style="width: 140px;">Employee Code</th>
                        <th style="width: 220px;">Staff Member</th>
                        <th style="width: 160px;">Process / Department</th>
                        <th style="width: 130px; text-align: center;">Ready / Total</th>
                        <th>Included Document Types</th>
                        <th style="width: 170px; text-align: center;">Individual ZIP</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let emp of empGroupTable.data" class="multi-emp-row">
                        <td>
                          <span class="emp-code-pill">{{ emp.employeeCode || 'N/A' }}</span>
                        </td>
                        <td>
                          <div class="emp-profile-cell">
                            <div class="emp-mini-avatar">{{ getInitials(emp.employeeName, '') }}</div>
                            <div class="emp-profile-text">
                              <span class="emp-profile-name">{{ formatDisplayName(emp.employeeName) }}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div class="emp-dept-cell">
                            <nz-tag *ngIf="emp.process" nzColor="blue" class="emp-tag">{{ emp.process }}</nz-tag>
                            <nz-tag *ngIf="emp.department" nzColor="cyan" class="emp-tag">{{ emp.department }}</nz-tag>
                            <span *ngIf="!emp.process && !emp.department" class="text-muted-xs">-</span>
                          </div>
                        </td>
                        <td style="text-align: center;">
                          <div class="count-badge-wrap">
                            <span class="count-pill" [class.count-active]="emp.selectedCount > 0" [class.count-zero]="emp.selectedCount === 0">
                              {{ emp.selectedCount }}
                            </span>
                            <span class="count-total">/ {{ emp.count }}</span>
                          </div>
                        </td>
                        <td>
                          <div class="grouped-cat-wrap" *ngIf="emp.selectedDocuments.length > 0">
                            <nz-tag
                              *ngFor="let badge of getGroupedCategoryBadges(emp.selectedDocuments)"
                              [nzColor]="badge.color"
                              class="grouped-cat-badge">
                              {{ badge.label }} <span class="badge-multiplier">&times;{{ badge.count }}</span>
                            </nz-tag>
                          </div>
                          <span *ngIf="emp.selectedDocuments.length === 0" class="no-cat-hint-sm">
                            <i nz-icon nzType="close-circle"></i> No selected categories
                          </span>
                        </td>
                        <td style="text-align: center;">
                          <button
                            nz-button
                            nzType="primary"
                            nzSize="small"
                            class="btn-emp-export"
                            [disabled]="emp.selectedCount === 0"
                            (click)="downloadEmployeeDocumentsZip(emp)">
                            <i nz-icon nzType="download"></i> Download ({{ emp.selectedCount }})
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </nz-table>
                </div>
              </div>

              <!-- ========================================================== -->
              <!-- 5. SINGLE-EMPLOYEE VIEW (Thumbnails, Full Previews & Grid) -->
              <!-- ========================================================== -->
              <ng-container *ngIf="hasSearched && !isLoadingDocs && documents.length > 0 && !isMultiEmployee">
                <!-- Results Action Sub-bar (Selection Master) -->
                <div class="dh-results-bar">
                  <div class="results-bar-left">
                    <label nz-checkbox [nzChecked]="isAllSelected()" [nzIndeterminate]="isIndeterminate()" (nzCheckedChange)="onSelectAllDocsChange($event)">
                      Select All Visible ({{ documents.length }})
                    </label>
                    <span class="selection-indicator" *ngIf="selectedDocIds.size > 0">
                      <strong>{{ selectedDocIds.size }}</strong> document(s) selected
                    </span>
                  </div>
                  <div class="results-bar-right">
                    <span class="stats-text">Showing {{ documents.length }} document(s)</span>
                  </div>
                </div>

                <!-- Quick Category Check/Filter Chips -->
                <div class="cat-quick-chips-bar" *ngIf="presentCategories.length > 1" style="margin-top: -6px; margin-bottom: 14px; border-top: none; padding-top: 0;">
                  <span class="quick-chips-title"><i nz-icon nzType="filter"></i> Quick Select by Category:</span>
                  <div class="quick-chips-wrap">
                    <button
                      type="button"
                      *ngFor="let cat of presentCategories"
                      class="cat-chip-btn"
                      [class.chip-active]="isCategoryFullySelectedInDocs(cat.code)"
                      (click)="toggleCategoryDocSelection(cat.code)"
                      nz-tooltip="Check / Uncheck all {{ cat.label }} documents">
                      <i nz-icon nzType="check-square" *ngIf="isCategoryFullySelectedInDocs(cat.code)"></i>
                      <i nz-icon nzType="border" *ngIf="!isCategoryFullySelectedInDocs(cat.code)"></i>
                      <span>{{ cat.label }} ({{ categoryDocCounts[cat.code] || 0 }})</span>
                    </button>
                  </div>
                </div>

                <!-- 5A. COMPACT GRID VIEW (Single Employee) -->
                <div *ngIf="viewMode === 'grid'" class="dh-doc-compact-grid">
                  <div class="doc-compact-card" *ngFor="let doc of documents" [class.card-selected]="selectedDocIds.has(doc.id)">
                    
                    <!-- Left: Mini Thumbnail & Quick Preview -->
                    <div class="doc-mini-thumb-col" (click)="openServerDocPreview(doc)" nz-tooltip="Click to Preview Full High-Res Document">
                      <div class="doc-mini-thumb-box">
                        <img *ngIf="isImageContentType(doc.contentType)" [src]="getDocPreviewUrl(doc.id)" alt="Preview" class="doc-mini-img" (error)="onImgError($event)" />
                        <div *ngIf="isPdfContentType(doc.contentType)" class="doc-mini-pdf">
                          <i nz-icon nzType="file-pdf" class="mini-pdf-ico"></i>
                          <span class="mini-pdf-pg" *ngIf="doc.pageNumber">P.{{ doc.pageNumber }}</span>
                          <span class="mini-pdf-pg" *ngIf="!doc.pageNumber">PDF</span>
                        </div>
                        <div *ngIf="!isImageContentType(doc.contentType) && !isPdfContentType(doc.contentType)" class="doc-mini-generic">
                          <i nz-icon nzType="file-text"></i>
                        </div>
                      </div>
                      <button nz-button nzType="link" nzSize="small" class="mini-preview-btn" (click)="$event.stopPropagation(); openServerDocPreview(doc)">
                        <i nz-icon nzType="eye"></i> View
                      </button>
                    </div>

                    <!-- Middle: Document Details -->
                    <div class="doc-mini-info-col">
                      <div class="doc-mini-top-row">
                        <nz-tag [nzColor]="getCategoryColor(doc.documentType)" class="cat-tag-pill">{{ getCategoryLabel(doc.documentType) }}</nz-tag>
                        <span class="doc-mini-size">{{ formatBytes(doc.fileSize) }}</span>
                      </div>

                      <h4 class="doc-mini-title" [nz-tooltip]="doc.documentTitle || doc.originalName">
                        {{ doc.documentTitle || doc.originalName }}
                      </h4>

                      <div class="doc-mini-sub-row">
                        <span class="doc-mini-emp">
                          <i nz-icon nzType="user"></i> {{ doc.employeeCode }}
                        </span>
                        <span class="doc-mini-date">{{ doc.uploadedAt | date:'dd/MM/yyyy' }}</span>
                      </div>
                      <div class="doc-mini-notes" *ngIf="doc.notes" [nz-tooltip]="doc.notes">
                        <em>{{ doc.notes }}</em>
                      </div>
                    </div>

                    <!-- Right: Checkbox & Quick Actions -->
                    <div class="doc-mini-actions-col">
                      <label nz-checkbox [nzChecked]="selectedDocIds.has(doc.id)" (nzCheckedChange)="toggleDocSelection(doc.id, $event)" nz-tooltip="Select for Export"></label>
                      
                      <div class="doc-mini-btns">
                        <button nz-button nzType="text" nzSize="small" (click)="openEditModal(doc)" nz-tooltip="Edit Details">
                          <i nz-icon nzType="edit"></i>
                        </button>
                        <button nz-button nzType="text" nzSize="small" (click)="downloadDoc(doc)" nz-tooltip="Download File" style="color: #16a34a;">
                          <i nz-icon nzType="download"></i>
                        </button>
                        <button nz-button nzType="text" nzDanger nzSize="small" (click)="deleteDoc(doc)" nz-tooltip="Delete">
                          <i nz-icon nzType="delete"></i>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                <!-- 5B. TABLE VIEW (Single Employee) -->
                <div *ngIf="viewMode === 'table'" class="dh-table-wrap">
                  <nz-table #docTable [nzData]="documents" nzSize="middle" class="theme-table" [nzPageSize]="15">
                    <thead>
                      <tr>
                        <th style="width: 40px; text-align: center;">
                          <label nz-checkbox [nzChecked]="isAllSelected()" [nzIndeterminate]="isIndeterminate()" (nzCheckedChange)="onSelectAllDocsChange($event)"></label>
                        </th>
                        <th style="width: 50px; text-align: center;">View</th>
                        <th>Document Title</th>
                        <th>Category</th>
                        <th>Page</th>
                        <th>Employee</th>
                        <th>Original File</th>
                        <th>Size</th>
                        <th>Uploaded Date</th>
                        <th style="text-align: center; width: 140px;">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let doc of docTable.data" [class.row-selected]="selectedDocIds.has(doc.id)">
                        <td style="text-align: center;">
                          <label nz-checkbox [nzChecked]="selectedDocIds.has(doc.id)" (nzCheckedChange)="toggleDocSelection(doc.id, $event)"></label>
                        </td>
                        <td style="text-align: center;">
                          <div class="table-thumb" (click)="openServerDocPreview(doc)">
                            <img *ngIf="isImageContentType(doc.contentType)" [src]="getDocPreviewUrl(doc.id)" alt="Icon" class="table-thumb-img" (error)="onImgError($event)" />
                            <i *ngIf="isPdfContentType(doc.contentType)" nz-icon nzType="file-pdf" style="color: #ef4444; font-size: 20px;"></i>
                            <i *ngIf="!isImageContentType(doc.contentType) && !isPdfContentType(doc.contentType)" nz-icon nzType="file" style="color: #64748b; font-size: 20px;"></i>
                          </div>
                        </td>
                        <td>
                          <strong>{{ doc.documentTitle || doc.originalName }}</strong>
                          <div *ngIf="doc.notes" style="font-size: 11px; color: #64748b;">{{ doc.notes }}</div>
                        </td>
                        <td>
                          <nz-tag [nzColor]="getCategoryColor(doc.documentType)">{{ getCategoryLabel(doc.documentType) }}</nz-tag>
                        </td>
                        <td>
                          <nz-tag *ngIf="doc.pageNumber">P-{{ doc.pageNumber }}</nz-tag>
                          <span *ngIf="!doc.pageNumber" style="color: #94a3b8;">—</span>
                        </td>
                        <td>
                          <strong>{{ doc.employeeCode }}</strong>
                          <div style="font-size: 11px; color: #64748b;">{{ doc.employeeName }}</div>
                        </td>
                        <td><span style="font-size: 12px; color: #475569;">{{ doc.originalName }}</span></td>
                        <td>{{ formatBytes(doc.fileSize) }}</td>
                        <td>{{ doc.uploadedAt | date:'dd/MM/yyyy HH:mm' }}</td>
                        <td style="text-align: center;">
                          <div style="display: flex; gap: 4px; justify-content: center;">
                            <button nz-button nzType="link" nzSize="small" (click)="openServerDocPreview(doc)" nz-tooltip="View">
                              <i nz-icon nzType="eye"></i>
                            </button>
                            <button nz-button nzType="link" nzSize="small" (click)="openEditModal(doc)" nz-tooltip="Edit">
                              <i nz-icon nzType="edit"></i>
                            </button>
                            <button nz-button nzType="link" nzSize="small" (click)="downloadDoc(doc)" nz-tooltip="Download" style="color:#16a34a;">
                              <i nz-icon nzType="download"></i>
                            </button>
                            <button nz-button nzType="link" nzDanger nzSize="small" (click)="deleteDoc(doc)" nz-tooltip="Delete">
                              <i nz-icon nzType="delete"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </nz-table>
                </div>
              </ng-container>

            </div>
          </nz-tab>

          <!-- ========================================== -->
          <!-- 3. LETTER TEMPLATES TAB                    -->
          <!-- ========================================== -->
          <nz-tab nzTitle="📝 Letter Templates">
            <div class="tab-pane-content tab-pane-fit">
              <app-document-template-list></app-document-template-list>
            </div>
          </nz-tab>

        </nz-tabset>
      </nz-card>

      <!-- ========================================== -->
      <!-- PREVIEW MODAL (LIGHTBOX / PDF VIEWER) -->
      <!-- ========================================== -->
      <nz-modal
        [(nzVisible)]="isPreviewModalVisible"
        [nzTitle]="previewModalTitle"
        (nzOnCancel)="closePreviewModal()"
        [nzWidth]="900"
        [nzFooter]="previewModalFooter">
        <ng-template nzModalContent>
          <div class="preview-modal-body">
            <!-- Image High-Res Preview -->
            <div *ngIf="previewIsImage && previewUrl" class="preview-img-container">
              <img [src]="previewUrl" alt="Document Preview" class="preview-modal-img" [style.transform]="'rotate(' + previewRotation + 'deg) scale(' + previewZoom + ')'" />
            </div>

            <!-- PDF Viewer Iframe -->
            <div *ngIf="previewIsPdf && previewUrlSafe" class="preview-pdf-container">
              <iframe [src]="previewUrlSafe" class="preview-pdf-iframe" title="PDF Preview"></iframe>
            </div>

            <!-- Generic Preview / Loading fallback -->
            <div *ngIf="!previewIsImage && !previewIsPdf" class="preview-generic-box">
              <i nz-icon nzType="file-text" style="font-size: 48px; color: #94a3b8;"></i>
              <p style="margin-top: 12px; font-weight: 500;">Preview rendering mode active.</p>
              <button nz-button nzType="primary" *ngIf="currentServerDoc" (click)="downloadDoc(currentServerDoc)">
                <i nz-icon nzType="download"></i> Download File
              </button>
            </div>
          </div>
        </ng-template>

        <ng-template #previewModalFooter>
          <div class="preview-footer-wrap">
            <div class="preview-toolbar" *ngIf="previewIsImage">
              <button nz-button nzType="default" nzSize="small" (click)="previewZoom = previewZoom + 0.2">
                <i nz-icon nzType="zoom-in"></i> Zoom In
              </button>
              <button nz-button nzType="default" nzSize="small" (click)="previewZoom = Math.max(0.4, previewZoom - 0.2)">
                <i nz-icon nzType="zoom-out"></i> Zoom Out
              </button>
              <button nz-button nzType="default" nzSize="small" (click)="previewRotation = (previewRotation + 90) % 360">
                <i nz-icon nzType="redo"></i> Rotate
              </button>
              <button nz-button nzType="default" nzSize="small" (click)="previewZoom = 1; previewRotation = 0">
                Reset
              </button>
            </div>
            <div style="display: flex; gap: 8px;">
              <button nz-button nzType="default" (click)="closePreviewModal()">Close</button>
              <button nz-button nzType="primary" *ngIf="currentServerDoc" (click)="downloadDoc(currentServerDoc)">
                <i nz-icon nzType="download"></i> Download File
              </button>
            </div>
          </div>
        </ng-template>
      </nz-modal>

      <!-- ========================================== -->
      <!-- EDIT DOCUMENT METADATA MODAL -->
      <!-- ========================================== -->
      <nz-modal
        [(nzVisible)]="isEditModalVisible"
        nzTitle="Edit Document Details"
        (nzOnCancel)="isEditModalVisible = false"
        (nzOnOk)="saveEditMetadata()"
        [nzOkLoading]="isSavingEdit"
        nzWidth="520px">
        <ng-template nzModalContent>
          <div *ngIf="editingDoc" class="edit-doc-form">
            <div class="form-group-md">
              <label class="dh-field-label">Document Title / Label <span class="req">*</span></label>
              <input nz-input [(ngModel)]="editingDoc.documentTitle" placeholder="Enter document title" />
            </div>

            <div class="form-group-md">
              <label class="dh-field-label">Document Category <span class="req">*</span></label>
              <nz-select [(ngModel)]="editingDoc.documentType" class="w-full">
                <nz-option *ngFor="let cat of categories" [nzValue]="cat.code" [nzLabel]="cat.label"></nz-option>
              </nz-select>
            </div>

            <div class="form-group-md">
              <label class="dh-field-label">Page Number (Optional)</label>
              <nz-input-number [(ngModel)]="editingDoc.pageNumber" [nzMin]="1" [nzMax]="99" style="width: 100%;"></nz-input-number>
            </div>

            <div class="form-group-md">
              <label class="dh-field-label">Notes / Remarks</label>
              <textarea nz-input [(ngModel)]="editingDoc.notes" rows="3" placeholder="Add any notes about this document..."></textarea>
            </div>
          </div>
        </ng-template>
      </nz-modal>

      <!-- ========================================== -->
      <!-- BULK CATEGORY MODAL -->
      <!-- ========================================== -->
      <nz-modal
        [(nzVisible)]="isBulkCategoryModalVisible"
        nzTitle="Set Category for All Staged Documents"
        (nzOnCancel)="isBulkCategoryModalVisible = false"
        (nzOnOk)="applyBulkCategory()"
        nzWidth="460px">
        <ng-template nzModalContent>
          <div>
            <label class="dh-field-label">Select Category to apply to all {{ stagedFiles.length }} staged files:</label>
            <nz-select [(ngModel)]="bulkSelectedCategory" class="w-full" nzSize="large">
              <nz-option *ngFor="let cat of categories" [nzValue]="cat.code" [nzLabel]="cat.label"></nz-option>
            </nz-select>
            <p style="margin-top: 12px; font-size: 12px; color: #64748b;">
              This will update the category and auto-generate sequential names (e.g. <code>Aadhar-1</code>, <code>Aadhar-2</code>).
            </p>
          </div>
        </ng-template>
      </nz-modal>

    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      overflow: hidden;
    }
    .dh-container {
      padding: 10px 14px 14px;
      width: 100%;
      height: calc(100vh - 54px);
      min-height: 0;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #f0f4ff 0%, #f8fafc 50%, #edf2f7 100%);
    }

    /* GLASSY SUB NAVIGATION BAR */
    .pp-sub-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      background: rgba(255, 255, 255, 0.78);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-radius: 10px;
      padding: 8px 16px;
      border: 1px solid rgba(255, 255, 255, 0.85);
      box-shadow: 0 4px 20px 0 rgba(31, 38, 135, 0.05);
      flex-shrink: 0;
    }
    .pp-nav-item.active {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 13.5px;
      font-weight: 700;
      color: #1e3a8a;
    }
    .pp-nav-item.active i {
      font-size: 16px;
      color: #2563eb;
    }
    .pp-sub-nav-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .sub-nav-count {
      font-size: 12px;
      color: #1e3a8a;
      font-weight: 600;
      background: rgba(239, 246, 255, 0.85);
      backdrop-filter: blur(6px);
      padding: 3px 12px;
      border-radius: 16px;
      border: 1px solid rgba(191, 219, 254, 0.8);
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .sub-nav-count.stat-selected {
      color: #15803d;
      border-color: rgba(187, 247, 208, 0.9);
      background: rgba(240, 253, 244, 0.9);
    }

    /* GLASSY MAIN CARD & TABS CONTAINER */
    .dh-main-card {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      border-radius: 12px !important;
      border: 1px solid rgba(255, 255, 255, 0.85) !important;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.08) !important;
      background: rgba(255, 255, 255, 0.82) !important;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      overflow: hidden;
    }
    :host ::ng-deep .dh-main-card > .ant-card-body {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    :host ::ng-deep .dh-tabset {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    :host ::ng-deep .dh-tabset > .ant-tabs-nav {
      flex-shrink: 0;
      margin-bottom: 0 !important;
      padding: 0 16px !important;
      background: rgba(248, 250, 252, 0.7) !important;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(226, 232, 240, 0.85) !important;
    }
    :host ::ng-deep .dh-tabset .ant-tabs-tab {
      padding: 13px 18px !important;
      font-size: 13.5px !important;
      font-weight: 600 !important;
      color: #64748b !important;
      transition: all 0.2s ease;
    }
    :host ::ng-deep .dh-tabset .ant-tabs-tab:hover {
      color: #2563eb !important;
    }
    :host ::ng-deep .dh-tabset .ant-tabs-tab-active {
      color: #1e40af !important;
    }
    :host ::ng-deep .dh-tabset .ant-tabs-ink-bar {
      background: linear-gradient(90deg, #2563eb, #1e40af) !important;
      height: 3px !important;
      border-radius: 3px 3px 0 0;
    }
    :host ::ng-deep .dh-tabset > .ant-tabs-content-holder {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    :host ::ng-deep .dh-tabset > .ant-tabs-content-holder > .ant-tabs-content {
      height: 100%;
    }
    :host ::ng-deep .dh-tabset > .ant-tabs-content-holder > .ant-tabs-content > .ant-tabs-tabpane {
      height: 100%;
      overflow-y: auto;
      box-sizing: border-box;
    }
    :host ::ng-deep .dh-tabset > .ant-tabs-content-holder > .ant-tabs-content > .ant-tabs-tabpane::-webkit-scrollbar {
      width: 6px;
    }
    :host ::ng-deep .dh-tabset > .ant-tabs-content-holder > .ant-tabs-content > .ant-tabs-tabpane::-webkit-scrollbar-thumb {
      background: rgba(30, 58, 138, 0.18);
      border-radius: 3px;
    }

    .tab-pane-content {
      padding: 16px 20px;
      min-height: 100%;
      box-sizing: border-box;
    }
    .tab-pane-content.tab-pane-fit {
      padding: 10px 14px;
      height: 100%;
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .tab-pane-content.tab-pane-fit app-document-template-list {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* UPLOAD TAB UNIFIED SINGLE LINE HEADER (GLASSY) */
    .dh-upload-unified-card {
      background: rgba(248, 250, 252, 0.72);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 12px;
      border: 1px solid rgba(226, 232, 240, 0.85);
      padding: 10px 16px;
      margin-bottom: 14px;
      box-shadow: 0 4px 16px 0 rgba(31, 38, 135, 0.03);
    }
    .upload-top-row {
      display: flex;
      gap: 16px;
      align-items: flex-end;
      width: 100%;
    }
    @media (max-width: 1024px) {
      .upload-top-row { flex-direction: column; align-items: stretch; }
    }
    .emp-select-col {
      flex: 1.2;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .emp-select-row {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
    }
    .upload-mode-col {
      flex: 1.5;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .mode-options-inline {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      width: 100%;
    }
    .dh-field-label {
      display: block;
      font-size: 10.5px;
      font-weight: 700;
      color: #1e3a8a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .req { color: #ef4444; }
    .dh-emp-select { width: 100%; flex: 1; }

    .dh-emp-badge-card {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(8px);
      padding: 3px 10px;
      border-radius: 8px;
      border: 1px solid rgba(203, 213, 225, 0.8);
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
      flex-shrink: 0;
      height: 38px;
      box-sizing: border-box;
    }
    .emp-avatar-circle {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 11.5px;
      box-shadow: 0 2px 6px rgba(37,99,235,0.3);
      flex-shrink: 0;
    }
    .emp-badge-info { display: flex; flex-direction: column; gap: 0px; }
    .emp-badge-name { font-size: 12px; font-weight: 700; color: #1e293b; white-space: nowrap; }
    .emp-badge-sub { font-size: 10.5px; color: #64748b; display: flex; align-items: center; gap: 3px; }

    .mode-card {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(8px);
      border: 1.5px solid rgba(226, 232, 240, 0.9);
      border-radius: 8px;
      padding: 6px 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;
      height: 38px;
      box-sizing: border-box;
    }
    .mode-card:hover {
      border-color: #93c5fd;
      background: rgba(248, 250, 255, 0.95);
      transform: translateY(-1px);
    }
    .mode-card.active {
      border-color: #2563eb;
      background: rgba(239, 246, 255, 0.92);
      box-shadow: 0 2px 10px rgba(37,99,235,0.15);
    }
    .mode-radio-circle {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 1.5px solid #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 9px;
      flex-shrink: 0;
    }
    .mode-card.active .mode-radio-circle { background: #2563eb; border-color: #2563eb; }
    .mode-icon-box {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      flex-shrink: 0;
    }
    .mode-icon-img { background: #dbeafe; color: #2563eb; }
    .mode-icon-pdf { background: #fee2e2; color: #dc2626; }
    .mode-info { flex: 1; min-width: 0; }
    .mode-name { font-size: 11.5px; font-weight: 700; color: #0f172a; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .mode-desc { font-size: 10px; color: #64748b; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* DROPZONES (GLASSY) */
    .dh-dropzone {
      border: 2px dashed rgba(147, 197, 253, 0.9);
      border-radius: 12px;
      background: rgba(240, 247, 255, 0.65);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      padding: 24px 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.25s ease;
      margin-bottom: 20px;
    }
    .mode-locked-dropzone {
      border: 2px dashed rgba(203, 213, 225, 0.9);
      background: rgba(248, 250, 252, 0.75);
      cursor: not-allowed;
    }
    .lock-circle {
      background: #eff6ff;
      color: #2563eb;
    }
    .mode-pdf-dropzone {
      border-color: rgba(252, 165, 165, 0.9);
      background: rgba(254, 242, 242, 0.65);
    }
    .mode-pdf-dropzone:hover {
      border-color: #ef4444;
      background: rgba(254, 242, 242, 0.9);
    }
    .dh-dropzone:hover {
      border-color: #2563eb;
      background: rgba(224, 242, 254, 0.85);
      transform: translateY(-1px);
    }
    .dh-dropzone.has-files {
      padding: 14px;
      background: rgba(248, 250, 252, 0.75);
      border-color: #cbd5e1;
    }
    .dropzone-icon-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 8px;
      font-size: 22px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .img-circle { background: #dbeafe; color: #2563eb; }
    .pdf-circle { background: #fee2e2; color: #dc2626; }
    .dropzone-title { font-size: 14px; font-weight: 700; color: #1e3a8a; margin-bottom: 3px; }
    .mode-pdf-dropzone .dropzone-title { color: #991b1b; }
    .dropzone-subtitle { font-size: 11.5px; color: #64748b; margin-bottom: 10px; max-width: 600px; margin-left: auto; margin-right: auto; }
    .btn-browse { font-weight: 600; border-radius: 6px; }
    .btn-pdf-browse { background: #dc2626 !important; border-color: #dc2626 !important; }
    .btn-pdf-browse:hover { background: #b91c1c !important; }

    /* STAGING */
    .staging-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .staging-title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px; }
    .staging-count-badge { background: #dbeafe; color: #1e40af; font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 700; }
    .staging-desc { font-size: 11.5px; color: #64748b; margin: 2px 0 0; }
    .staging-actions { display: flex; gap: 6px; }

    /* STAGING COMPACT */
    .staged-compact-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 10px;
      margin-bottom: 18px;
    }
    @media (max-width: 768px) {
      .staged-compact-grid { grid-template-columns: 1fr; }
    }
    .staged-compact-card {
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(226, 232, 240, 0.9);
      border-radius: 8px;
      padding: 8px 10px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.03);
      transition: all 0.2s ease;
    }
    .staged-compact-card:hover {
      border-color: #93c5fd;
      box-shadow: 0 4px 12px rgba(37,99,235,0.08);
      transform: translateY(-1px);
    }
    .mini-thumb-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      cursor: pointer;
      flex-shrink: 0;
    }
    .mini-thumb-box {
      width: 44px;
      height: 48px;
      border-radius: 6px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .mini-thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .mini-thumb-pdf {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #ef4444;
      background: #fef2f2;
      width: 100%;
      height: 100%;
    }
    .mini-pdf-ico { font-size: 16px; }
    .mini-pdf-pg { font-size: 9px; font-weight: 700; color: #991b1b; }
    .mini-thumb-generic { font-size: 16px; color: #64748b; }
    .mini-preview-btn {
      font-size: 10px !important;
      height: 18px !important;
      padding: 0 2px !important;
      line-height: 18px !important;
      color: #2563eb !important;
    }
    .mini-fields-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    .fields-top-row {
      display: flex;
      gap: 6px;
    }
    .cat-select-item { width: 130px; flex-shrink: 0; }
    .title-input-item { flex: 1; min-width: 0; }
    .fields-bottom-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .page-badge-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #475569;
      font-weight: 600;
    }
    .pg-label { font-size: 11px; color: #64748b; }
    .pg-num-input { width: 50px !important; }
    .file-name-item {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 11px;
      color: #94a3b8;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      max-width: 140px;
    }
    .file-name-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .mini-actions-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      gap: 2px;
      flex-shrink: 0;
    }
    .mini-reorder-group { display: flex; gap: 0; }
    .mini-reorder-group button { padding: 0 3px !important; height: 20px !important; font-size: 11px !important; }
    .mini-remove-btn { padding: 0 4px !important; height: 20px !important; font-size: 11px !important; }

    .dh-upload-submit-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      background: rgba(248, 250, 252, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(226, 232, 240, 0.85);
      border-radius: 10px;
      flex-wrap: wrap;
      gap: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    }
    .submit-bar-left { display: flex; align-items: center; }
    .submit-summary { font-size: 12.5px; color: #1e293b; }
    .submit-bar-right { display: flex; gap: 8px; }

    /* DOWNLOAD TAB / FILTER CARD (GLASSY SINGLE LINE) */
    .dh-filter-card {
      background: rgba(248, 250, 252, 0.72);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(226, 232, 240, 0.85);
      border-radius: 10px;
      padding: 8px 14px;
      margin-bottom: 12px;
      box-shadow: 0 4px 16px 0 rgba(31, 38, 135, 0.03);
    }
    .dh-filter-single-row {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      width: 100%;
      flex-wrap: wrap;
    }
    .filter-col {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .filter-col-process { width: 140px; flex-shrink: 0; }
    .filter-col-emp { flex: 1.5; min-width: 170px; }
    .filter-col-cat { flex: 1.3; min-width: 160px; }
    .filter-col-search { flex: 1.1; min-width: 140px; }
    .filter-col-actions {
      flex-shrink: 0;
      margin-left: auto;
    }
    .dh-filter-actions-inline {
      display: flex;
      align-items: center;
      gap: 6px;
      height: 30px;
      flex-wrap: wrap;
    }

    .label-with-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .quick-emp-actions { display: flex; align-items: center; gap: 4px; font-size: 10.5px; }
    .link-btn { font-size: 10.5px !important; padding: 0 2px !important; height: auto !important; }
    .sep { color: #cbd5e1; font-size: 10px; }
    .sub-count-tag { font-size: 10.5px; font-weight: 600; color: #2563eb; background: #eff6ff; padding: 1px 5px; border-radius: 4px; margin-left: 3px; }

    .cat-option-row { display: flex; align-items: center; }

    /* Quick Chips Bar */
    .cat-quick-chips-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed #cbd5e1;
      flex-wrap: wrap;
    }
    .quick-chips-title { font-size: 10.5px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .quick-chips-wrap { display: flex; gap: 6px; flex-wrap: wrap; }
    .cat-chip-btn {
      font-size: 10.5px;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(4px);
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      padding: 1px 8px;
      cursor: pointer;
      color: #475569;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s ease;
    }
    .cat-chip-btn:hover { border-color: #2563eb; color: #2563eb; background: #eff6ff; }
    .cat-chip-btn.chip-active {
      background: #2563eb;
      color: #fff;
      border-color: #2563eb;
      box-shadow: 0 2px 6px rgba(37,99,235,0.25);
    }

    .btn-zip-download {
      background: rgba(240, 253, 244, 0.9) !important;
      border-color: #86efac !important;
      color: #166534 !important;
      font-weight: 600 !important;
      backdrop-filter: blur(4px);
      height: 30px !important;
      font-size: 11.5px !important;
      padding: 0 10px !important;
    }
    .btn-zip-download:hover { background: #dcfce7 !important; }
    .btn-zip-all {
      background: rgba(239, 246, 255, 0.9) !important;
      border-color: #93c5fd !important;
      color: #1e40af !important;
      font-weight: 600 !important;
      backdrop-filter: blur(4px);
      height: 30px !important;
      font-size: 11.5px !important;
      padding: 0 10px !important;
    }

    /* Initial State */
    .dh-initial-state-card {
      text-align: center;
      padding: 48px 24px;
      background: rgba(248, 250, 252, 0.65);
      backdrop-filter: blur(8px);
      border-radius: 12px;
      border: 1px dashed #cbd5e1;
      margin: 10px 0;
    }
    .initial-state-icon { font-size: 48px; color: #94a3b8; margin-bottom: 10px; }
    .initial-state-title { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
    .initial-state-desc { font-size: 12.5px; color: #64748b; max-width: 480px; margin: 0 auto 16px; }
    .initial-quick-btns { display: flex; justify-content: center; gap: 10px; }

    .dh-loading-box { text-align: center; padding: 40px; }
    .dh-empty-card { text-align: center; padding: 36px; }

    /* MULTI-EMPLOYEE DIRECT ZIP VIEW (GLASSY) */
    .dh-multi-emp-panel { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
    .multi-emp-action-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      background: linear-gradient(135deg, rgba(239, 246, 255, 0.9) 0%, rgba(219, 234, 254, 0.8) 100%);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(147, 197, 253, 0.85);
      border-radius: 10px;
      box-shadow: 0 4px 16px rgba(37,99,235,0.06);
      flex-wrap: wrap;
      gap: 12px;
    }
    .multi-emp-banner-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 280px; }
    .multi-emp-icon-circle {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(37,99,235,0.25);
    }
    .multi-emp-header-content { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .multi-emp-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .multi-emp-title { font-size: 14.5px; font-weight: 700; color: #1e3a8a; margin: 0; }
    .multi-stat-pill {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .multi-stat-pill.staff-pill { background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
    .multi-stat-pill.docs-pill { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .multi-cat-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .multi-cat-title { font-size: 11px; font-weight: 600; color: #475569; display: inline-flex; align-items: center; gap: 4px; }
    .multi-cat-pill { font-size: 10.5px !important; font-weight: 600 !important; border-radius: 6px !important; padding: 1px 7px !important; margin: 0 !important; }
    .multi-no-cat-hint { font-size: 11px; color: #d97706; background: #fef3c7; padding: 2px 8px; border-radius: 4px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
    .multi-emp-banner-right { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
    .btn-lg-zip { height: 34px !important; padding: 0 16px !important; font-size: 12px !important; font-weight: 700 !important; border-radius: 6px !important; }

    .multi-emp-table-card {
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(226, 232, 240, 0.9);
      border-radius: 10px;
      padding: 12px 16px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.03);
    }
    .multi-table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      flex-wrap: wrap;
      gap: 6px;
    }
    .multi-table-title-box { display: flex; align-items: center; gap: 8px; }
    .multi-table-title { font-size: 13px; font-weight: 700; color: #1e3a8a; display: flex; align-items: center; gap: 6px; }
    .multi-table-badge { font-size: 11px; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; font-weight: 700; padding: 1px 7px; border-radius: 10px; }
    .multi-table-hint { font-size: 11px; color: #64748b; display: flex; align-items: center; gap: 4px; }

    .multi-emp-table th { font-size: 11.5px !important; font-weight: 700 !important; color: #475569 !important; background: rgba(241, 245, 249, 0.8) !important; }
    .multi-emp-table td { font-size: 12px !important; vertical-align: middle !important; padding: 8px 12px !important; }
    .emp-code-pill {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 11px;
      font-weight: 700;
      color: #1e40af;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 2px 7px;
      border-radius: 5px;
      letter-spacing: 0.3px;
    }
    .emp-profile-cell { display: flex; align-items: center; gap: 8px; }
    .emp-mini-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: #fff;
      font-size: 10.5px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .emp-profile-text { display: flex; flex-direction: column; min-width: 0; }
    .emp-profile-name { font-weight: 600; color: #0f172a; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .emp-dept-cell { display: flex; gap: 4px; flex-wrap: wrap; align-items: center; }
    .emp-tag { font-size: 10.5px !important; padding: 1px 6px !important; border-radius: 4px !important; margin: 0 !important; }
    .text-muted-xs { font-size: 11px; color: #94a3b8; }
    .count-badge-wrap { display: inline-flex; align-items: center; gap: 3px; }
    .count-pill {
      font-size: 11.5px;
      font-weight: 700;
      padding: 1px 7px;
      border-radius: 10px;
    }
    .count-pill.count-active { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .count-pill.count-zero { background: #f1f5f9; color: #94a3b8; border: 1px solid #cbd5e1; }
    .count-total { font-size: 11px; color: #94a3b8; }
    .grouped-cat-wrap { display: flex; gap: 4px; flex-wrap: wrap; align-items: center; }
    .grouped-cat-badge {
      font-size: 10.5px !important;
      font-weight: 600 !important;
      border-radius: 5px !important;
      padding: 1px 6px !important;
      margin: 0 !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 3px !important;
    }
    .badge-multiplier { font-weight: 800; font-size: 10px; opacity: 0.9; }
    .no-cat-hint-sm { font-size: 11px; color: #94a3b8; font-style: italic; display: inline-flex; align-items: center; gap: 4px; }
    .btn-emp-export {
      font-size: 11px !important;
      font-weight: 600 !important;
      border-radius: 6px !important;
      background: #2563eb !important;
      border-color: #2563eb !important;
      height: 26px !important;
      padding: 0 10px !important;
    }
    .btn-emp-export:hover { background: #1d4ed8 !important; }
    .btn-emp-export:disabled { background: #f1f5f9 !important; border-color: #e2e8f0 !important; color: #94a3b8 !important; }

    .dh-results-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 14px;
      background: rgba(239, 246, 255, 0.8);
      backdrop-filter: blur(6px);
      border-radius: 8px;
      border: 1px solid rgba(191, 219, 254, 0.8);
      margin-bottom: 14px;
    }
    .results-bar-left { display: flex; align-items: center; gap: 12px; }
    .selection-indicator { font-size: 11.5px; color: #1e40af; }
    .stats-text { font-size: 11.5px; color: #64748b; font-weight: 600; }

    /* RESULTS COMPACT GRID (SINGLE EMPLOYEE - GLASSY) */
    .dh-doc-compact-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
      gap: 10px;
      margin-bottom: 16px;
    }
    @media (max-width: 768px) {
      .dh-doc-compact-grid { grid-template-columns: 1fr; }
    }
    .doc-compact-card {
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(226, 232, 240, 0.9);
      border-radius: 8px;
      padding: 8px 10px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.03);
      transition: all 0.2s ease;
      position: relative;
    }
    .doc-compact-card:hover {
      border-color: #93c5fd;
      box-shadow: 0 4px 12px rgba(37,99,235,0.08);
      transform: translateY(-1px);
    }
    .doc-compact-card.card-selected {
      border-color: #2563eb;
      background: rgba(239, 246, 255, 0.92);
      box-shadow: 0 0 0 1px #2563eb;
    }
    .doc-mini-thumb-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      cursor: pointer;
      flex-shrink: 0;
    }
    .doc-mini-thumb-box {
      width: 44px;
      height: 48px;
      border-radius: 6px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .doc-mini-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .doc-mini-pdf {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #ef4444;
      background: #fef2f2;
      width: 100%;
      height: 100%;
    }
    .doc-mini-generic {
      font-size: 16px;
      color: #64748b;
    }
    .doc-mini-info-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }
    .doc-mini-top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }
    .cat-tag-pill {
      font-size: 10px !important;
      line-height: 16px !important;
      padding: 0 6px !important;
      margin-right: 0 !important;
      border-radius: 10px !important;
    }
    .doc-mini-size {
      font-size: 10px;
      color: #64748b;
    }
    .doc-mini-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .doc-mini-sub-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: #64748b;
    }
    .doc-mini-emp {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-weight: 600;
      color: #1e40af;
    }
    .doc-mini-date {
      font-size: 10px;
      color: #94a3b8;
    }
    .doc-mini-notes {
      font-size: 10px;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      background: #f8fafc;
      padding: 1px 4px;
      border-radius: 3px;
    }
    .doc-mini-actions-col {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: space-between;
      gap: 4px;
      flex-shrink: 0;
    }
    .doc-mini-btns {
      display: flex;
      gap: 2px;
    }
    .doc-mini-btns button {
      padding: 0 4px !important;
      height: 22px !important;
      font-size: 12px !important;
    }

    /* TABLE VIEW (GLASSY) */
    .dh-table-wrap { width: 100%; overflow-x: auto; }
    .theme-table { width: 100%; }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th {
      background: rgba(248, 250, 252, 0.85) !important;
      border-bottom: 2px solid #2563eb !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      color: #1e3a8a !important;
      text-transform: uppercase !important;
      letter-spacing: 0.6px !important;
      padding: 10px 12px !important;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr > td {
      padding: 10px 12px !important;
      font-size: 12.5px !important;
      border-bottom: 1px solid rgba(241, 245, 249, 0.8) !important;
      vertical-align: middle !important;
      background: transparent !important;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr:hover > td {
      background: rgba(37, 99, 235, 0.04) !important;
    }

    .table-thumb {
      width: 34px;
      height: 34px;
      border-radius: 4px;
      overflow: hidden;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .table-thumb-img { width: 100%; height: 100%; object-fit: cover; }
    .row-selected { background: rgba(239, 246, 255, 0.7) !important; }

    /* PREVIEW MODAL */
    .preview-modal-body {
      min-height: 440px;
      max-height: 70vh;
      overflow: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f172a;
      border-radius: 8px;
    }
    .preview-img-container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .preview-modal-img { max-width: 100%; max-height: 65vh; object-fit: contain; transition: transform 0.2s ease; }
    .preview-pdf-container { width: 100%; height: 65vh; }
    .preview-pdf-iframe { width: 100%; height: 100%; border: none; }
    .preview-generic-box { text-align: center; color: #fff; padding: 40px; }
    .preview-footer-wrap { display: flex; align-items: center; justify-content: space-between; width: 100%; }
    .preview-toolbar { display: flex; gap: 6px; }

    /* MODAL FORMS */
    .edit-doc-form { display: flex; flex-direction: column; gap: 14px; }
    .form-group-md { display: flex; flex-direction: column; gap: 4px; }
    .w-full { width: 100%; }
    .btn-primary-gradient {
      border: none !important;
      background: linear-gradient(135deg, #2563eb, #1e40af) !important;
      color: #fff !important;
      font-weight: 600 !important;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25) !important;
    }
    .btn-primary-gradient:hover {
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35) !important;
    }
  `]
})
export class DocumentHubComponent implements OnInit, OnDestroy {
  readonly Math = Math;
  activeTabIndex = 0;

  categories: DocumentCategoryOption[] = DOCUMENT_CATEGORIES;
  employees: Employee[] = [];
  processes: MasterDataItem[] = [];

  // 1. Upload Tab State
  uploadMode: 'images' | 'pdf_split' = 'images';
  selectedEmployeeId: number | null = null;
  selectedEmployee: Employee | null = null;
  stagedFiles: StagedDocumentItem[] = [];
  isUploading = false;
  isSplittingPdf = false;
  uploadProgressPercent = 0;

  // 2. Document Library / Download Tab State (INITIALLY EMPTY)
  hasSearched = false;
  isLoadingDocs = false;
  documents: EmployeeDocument[] = [];
  selectedDocIds = new Set<number>();
  viewMode: 'grid' | 'table' = 'grid';

  filterEmployeeIds: number[] = [];
  filterCategories: string[] = [];
  filterProcess = 'ALL';
  searchKeyword = '';
  isZipDownloading = false;

  // Precomputed cached properties for change-detection performance
  filteredEmployees: Employee[] = [];
  groupedEmployeeSummaries: Array<{
    employeeId: number;
    employeeCode: string;
    employeeName: string;
    process: string;
    department: string;
    count: number;
    selectedCount: number;
    documents: EmployeeDocument[];
    selectedDocuments: EmployeeDocument[];
  }> = [];
  presentCategories: DocumentCategoryOption[] = [];
  selectedCategoryLabels: DocumentCategoryOption[] = [];
  categoryDocCounts: Record<string, number> = {};
  distinctEmployeeCount = 0;
  isMultiEmployee = false;

  // 3. Preview Modal
  isPreviewModalVisible = false;
  previewModalTitle = 'Document Preview';
  previewUrl: string | null = null;
  previewUrlSafe: SafeResourceUrl | null = null;
  previewIsImage = false;
  previewIsPdf = false;
  previewZoom = 1;
  previewRotation = 0;
  currentServerDoc: EmployeeDocument | null = null;
  currentBlobUrl: string | null = null;

  // 4. Edit Modal
  isEditModalVisible = false;
  editingDoc: { id: number; documentTitle: string; documentType: string; pageNumber?: number; notes?: string } | null = null;
  isSavingEdit = false;

  // 5. Bulk Category Modal
  isBulkCategoryModalVisible = false;
  bulkSelectedCategory = 'AADHAR_CARD';

  constructor(
    private docService: EmployeeDocumentService,
    private employeeService: EmployeeService,
    private masterService: MasterDataService,
    private msg: NzMessageService,
    private modal: NzModalService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadProcesses();

    // Check query params if employeeId or tab passed
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'templates' || params['tab'] === '2') {
        this.activeTabIndex = 2;
      } else if (params['tab'] === 'downloads' || params['tab'] === '1') {
        this.activeTabIndex = 1;
      } else if (params['tab'] === 'upload' || params['tab'] === '0') {
        this.activeTabIndex = 0;
      }

      if (params['employeeId']) {
        const empId = Number(params['employeeId']);
        this.selectedEmployeeId = empId;
        this.filterEmployeeIds = [empId];
        this.onEmployeeSelected();
        this.updateMultiEmployeeState();
      }
    });
  }

  ngOnDestroy(): void {
    this.clearStagedFiles();
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
    }
  }

  setUploadMode(mode: 'images' | 'pdf_split'): void {
    this.uploadMode = mode;
  }

  loadEmployees(): void {
    this.employeeService.getAllEmployees().subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.employees = res.data.content || res.data || [];
          this.updateFilteredEmployees();
        }
        if (this.selectedEmployeeId) {
          this.onEmployeeSelected();
        }
      },
      error: () => this.msg.error('Failed to load employee directory')
    });
  }

  loadProcesses(): void {
    this.masterService.getByCategory('PROCESS').subscribe({
      next: (items: MasterDataItem[]) => {
        this.processes = items || [];
      }
    });
  }

  onEmployeeSelected(): void {
    this.selectedEmployee = this.employees.find(e => e.id === this.selectedEmployeeId) || null;
  }

  updateFilteredEmployees(): void {
    if (!this.filterProcess || this.filterProcess === 'ALL') {
      this.filteredEmployees = [...this.employees];
    } else {
      const proc = this.filterProcess.trim().toLowerCase();
      this.filteredEmployees = this.employees.filter(
        e => e.processAssigned && e.processAssigned.trim().toLowerCase() === proc
      );
    }
  }

  onProcessFilterChange(): void {
    this.updateFilteredEmployees();
    const validStaffIds = new Set(this.filteredEmployees.map(e => e.id));
    this.filterEmployeeIds = this.filterEmployeeIds.filter(id => validStaffIds.has(id));
    this.updateMultiEmployeeState();
  }

  onEmployeeFilterChange(): void {
    this.updateMultiEmployeeState();
  }

  // ================= UPLOAD MODE 1: MULTIPLE IMAGES =================
  onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
  }

  onDragLeave(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
  }

  onDropImages(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer && e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (files.length > 0) {
        this.addImagesToStaging(files);
      } else {
        this.msg.warning('Please drop image files (PNG, JPG, WEBP) in this mode.');
      }
    }
  }

  onImagesSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.addImagesToStaging(Array.from(input.files));
      input.value = '';
    }
  }

  addImagesToStaging(files: File[]): void {
    if (!this.selectedEmployeeId) {
      this.msg.warning('Please select a Target Employee first before uploading files.');
      return;
    }

    files.forEach(file => {
      const isImg = file.type.startsWith('image/');
      const previewUrl = isImg ? URL.createObjectURL(file) : undefined;
      const guessedCat = this.guessCategoryFromFileName(file.name);
      const catObj = this.categories.find(c => c.code === guessedCat) || this.categories[0];

      const item: StagedDocumentItem = {
        uid: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        file: file,
        previewUrl: previewUrl,
        isImage: isImg,
        isPdf: false,
        fileSize: file.size,
        documentType: guessedCat,
        documentTitle: `${catObj.label}`,
        pageNumber: 1,
        status: 'pending'
      };

      this.stagedFiles.push(item);
    });

    this.autoNumberStagedPages();
    this.msg.success(`Added ${files.length} image(s) to staging.`);
  }

  // ================= UPLOAD MODE 2: COMBINED PDF WITH AUTO-SPLIT =================
  onDropPdf(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    if (!this.selectedEmployeeId) {
      this.msg.warning('Please select a Target Employee first before uploading files.');
      return;
    }
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        this.processCombinedPdf(file);
      } else {
        this.msg.warning('Please upload a valid PDF document.');
      }
    }
  }

  onPdfSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (!this.selectedEmployeeId) {
      this.msg.warning('Please select a Target Employee first before uploading files.');
      input.value = '';
      return;
    }
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.processCombinedPdf(file);
      input.value = '';
    }
  }

  processCombinedPdf(file: File): void {
    if (!this.selectedEmployeeId) {
      this.msg.warning('Please select a Target Employee first before uploading files.');
      return;
    }

    this.isSplittingPdf = true;
    this.docService.splitPdf(file).subscribe({
      next: res => {
        this.isSplittingPdf = false;
        if (res.success && res.data && res.data.length > 0) {
          const splitPages = res.data;
          const baseName = file.name.replace(/\.[^/.]+$/, '');

          splitPages.forEach((pageData, index) => {
            // Convert base64 to File object
            const byteCharacters = atob(pageData.base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const pageBlob = new Blob([byteArray], { type: 'application/pdf' });
            const pageFileName = `${baseName}_Page_${pageData.pageNumber}.pdf`;
            const pageFile = new File([pageBlob], pageFileName, { type: 'application/pdf' });
            const pageBlobUrl = URL.createObjectURL(pageBlob);

            // Default categories in sequence or other
            let defaultCat = 'OTHER';
            if (index === 0) defaultCat = 'AADHAR_CARD';
            else if (index === 1 && splitPages.length > 1) defaultCat = 'AADHAR_CARD';
            else if (index === 2) defaultCat = 'PAN_CARD';
            else if (index === 3) defaultCat = 'DEGREE_CERTIFICATE';
            else if (index === 4) defaultCat = 'BANK_PASSBOOK';

            const catObj = this.categories.find(c => c.code === defaultCat) || this.categories[0];
            const title = (defaultCat === 'AADHAR_CARD' && index === 1) ? 'Aadhar Card Back' : (defaultCat === 'AADHAR_CARD' ? 'Aadhar Card Front' : `${catObj.label}`);

            const item: StagedDocumentItem = {
              uid: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              file: pageFile,
              previewUrl: pageBlobUrl,
              isImage: false,
              isPdf: true,
              fileSize: pageFile.size,
              documentType: defaultCat,
              documentTitle: title,
              pageNumber: index + 1,
              notes: `Extracted from ${file.name} (Page ${pageData.pageNumber} of ${pageData.totalPages})`,
              status: 'pending'
            };

            this.stagedFiles.push(item);
          });

          this.autoNumberStagedPages();
          this.msg.success(`Successfully split PDF into ${splitPages.length} individual document page(s). You can now assign categories!`);
        } else {
          this.msg.error(res.message || 'Failed to split PDF');
        }
      },
      error: () => {
        this.isSplittingPdf = false;
        this.msg.error('Error occurred while splitting PDF pages');
      }
    });
  }

  // ================= GENERAL STAGING LOGIC =================
  guessCategoryFromFileName(fileName: string): string {
    const fn = fileName.toLowerCase();
    if (fn.includes('aadhar') || fn.includes('adhaar') || fn.includes('uidai')) return 'AADHAR_CARD';
    if (fn.includes('pan')) return 'PAN_CARD';
    if (fn.includes('passport') && !fn.includes('photo')) return 'PASSPORT';
    if (fn.includes('photo') || fn.includes('pic') || fn.includes('profile')) return 'PASSPORT_PHOTO';
    if (fn.includes('voter') || fn.includes('license') || fn.includes('driving') || fn.includes('dl')) return 'VOTER_ID';
    if (fn.includes('degree') || fn.includes('convocation') || fn.includes('bachelor') || fn.includes('master') || fn.includes('diploma')) return 'DEGREE_CERTIFICATE';
    if (fn.includes('10th') || fn.includes('12th') || fn.includes('marksheet') || fn.includes('sslc') || fn.includes('hsc')) return '10TH_12TH_MARKSHEET';
    if (fn.includes('resume') || fn.includes('cv') || fn.includes('biodata')) return 'RESUME_CV';
    if (fn.includes('exp') || fn.includes('reliev') || fn.includes('experience') || fn.includes('service')) return 'EXPERIENCE_LETTER';
    if (fn.includes('bank') || fn.includes('passbook') || fn.includes('cheque') || fn.includes('statement')) return 'BANK_PASSBOOK';
    if (fn.includes('join') || fn.includes('appointment') || fn.includes('offer')) return 'JOINING_FORM';
    if (fn.includes('medical') || fn.includes('fitness') || fn.includes('health')) return 'MEDICAL_FITNESS';
    if (fn.includes('salary') || fn.includes('payslip') || fn.includes('pay-slip')) return 'SALARY_SLIP_PREVIOUS';
    return 'OTHER';
  }

  onCategoryChange(item: StagedDocumentItem): void {
    this.autoNumberStagedPages();
  }

  autoNumberStagedPages(): void {
    const categoryCounts: Record<string, number> = {};
    const categoryTotals: Record<string, number> = {};

    this.stagedFiles.forEach(item => {
      categoryTotals[item.documentType] = (categoryTotals[item.documentType] || 0) + 1;
    });

    this.stagedFiles.forEach(item => {
      const cat = item.documentType;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      const count = categoryCounts[cat];
      item.pageNumber = count;

      const catObj = this.categories.find(c => c.code === cat);
      const catLabel = catObj ? catObj.label : 'Document';
      if (categoryTotals[cat] > 1) {
        item.documentTitle = `${catLabel}-${count}`;
      } else {
        item.documentTitle = `${catLabel}`;
      }
    });
  }

  moveStaged(index: number, direction: -1 | 1): void {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= this.stagedFiles.length) return;
    const temp = this.stagedFiles[index];
    this.stagedFiles[index] = this.stagedFiles[newIdx];
    this.stagedFiles[newIdx] = temp;
    this.autoNumberStagedPages();
  }

  removeStaged(index: number): void {
    const item = this.stagedFiles[index];
    if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(item.previewUrl);
    }
    this.stagedFiles.splice(index, 1);
    this.autoNumberStagedPages();
  }

  clearStagedFiles(): void {
    this.stagedFiles.forEach(f => {
      if (f.previewUrl && f.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(f.previewUrl);
      }
    });
    this.stagedFiles = [];
  }

  openBulkCategoryModal(): void {
    this.isBulkCategoryModalVisible = true;
  }

  applyBulkCategory(): void {
    this.stagedFiles.forEach(item => {
      item.documentType = this.bulkSelectedCategory;
    });
    this.autoNumberStagedPages();
    this.isBulkCategoryModalVisible = false;
    this.msg.success(`Category updated for all ${this.stagedFiles.length} files.`);
  }

  uploadAllStaged(): void {
    if (!this.selectedEmployeeId || this.stagedFiles.length === 0) return;
    this.isUploading = true;
    this.uploadProgressPercent = 25;

    this.docService.uploadDocumentBatch(this.selectedEmployeeId, this.stagedFiles).subscribe({
      next: res => {
        this.uploadProgressPercent = 100;
        this.isUploading = false;
        if (res.success) {
          this.msg.success(res.message || `Successfully uploaded ${this.stagedFiles.length} document(s).`);
          this.clearStagedFiles();
          // Switch to library tab and search for this employee's documents
          this.activeTabIndex = 1;
          this.filterEmployeeIds = [this.selectedEmployeeId!];
          this.searchDocuments();
        } else {
          this.msg.error(res.message || 'Upload failed');
        }
      },
      error: () => {
        this.isUploading = false;
        this.msg.error('Failed to upload batch documents');
      }
    });
  }

  // ================= DOCUMENT LIBRARY & SEARCH LOGIC =================
  selectAllEmployees(): void {
    this.filterEmployeeIds = this.filteredEmployees.map(e => e.id!).filter(id => !!id);
    this.updateMultiEmployeeState();
    this.msg.info(`Selected all ${this.filterEmployeeIds.length} staff members.`);
  }

  clearEmployeeSelection(): void {
    this.filterEmployeeIds = [];
    this.updateMultiEmployeeState();
  }

  selectAllCategories(): void {
    this.filterCategories = this.categories.map(c => c.code);
    if (this.documents.length > 0) {
      this.documents.forEach(d => this.selectedDocIds.add(d.id));
    }
    this.updateDerivedDocumentState();
  }

  clearCategories(): void {
    this.filterCategories = [];
    this.selectedDocIds.clear();
    this.updateDerivedDocumentState();
  }

  onCategoriesFilterChange(): void {
    if (this.documents.length > 0) {
      if (this.filterCategories.length > 0) {
        this.selectedDocIds.clear();
        this.documents.forEach(doc => {
          if (this.filterCategories.includes(doc.documentType)) {
            this.selectedDocIds.add(doc.id);
          }
        });
      } else {
        this.selectedDocIds.clear();
      }
    }
    this.updateDerivedDocumentState();
  }

  syncDocumentSelectionWithCategories(): void {
    if (this.documents.length === 0) {
      this.updateDerivedDocumentState();
      return;
    }

    this.selectedDocIds.clear();
    if (this.filterCategories.length > 0) {
      this.documents.forEach(doc => {
        if (this.filterCategories.includes(doc.documentType)) {
          this.selectedDocIds.add(doc.id);
        }
      });
    }
    this.updateDerivedDocumentState();
  }

  updateMultiEmployeeState(): void {
    if (this.filterEmployeeIds.length > 1) {
      this.isMultiEmployee = true;
    } else if (this.filterEmployeeIds.length === 1) {
      this.isMultiEmployee = false;
    } else {
      const empIds = new Set(this.documents.map(d => d.employeeId));
      this.isMultiEmployee = empIds.size > 1;
    }

    const empIds = new Set(this.documents.map(d => d.employeeId));
    this.distinctEmployeeCount = empIds.size > 0 ? empIds.size : this.filterEmployeeIds.length;
  }

  updateDerivedDocumentState(): void {
    this.updateMultiEmployeeState();

    // 1. Present Categories
    const presentCodes = new Set(this.documents.map(d => d.documentType));
    this.presentCategories = this.categories.filter(c => presentCodes.has(c.code));

    // 2. Category doc counts
    const counts: Record<string, number> = {};
    this.documents.forEach(d => {
      counts[d.documentType] = (counts[d.documentType] || 0) + 1;
    });
    this.categoryDocCounts = counts;

    // 3. Selected Category Labels
    const activeCats = new Set<string>();
    if (this.filterCategories.length > 0) {
      this.filterCategories.forEach(c => activeCats.add(c));
    } else {
      this.documents.forEach(d => {
        if (this.selectedDocIds.has(d.id)) {
          activeCats.add(d.documentType);
        }
      });
    }
    this.selectedCategoryLabels = this.categories.filter(c => activeCats.has(c.code));

    // 4. Grouped Employee Summaries
    const map = new Map<number, {
      employeeId: number;
      employeeCode: string;
      employeeName: string;
      process: string;
      department: string;
      count: number;
      selectedCount: number;
      documents: EmployeeDocument[];
      selectedDocuments: EmployeeDocument[];
    }>();

    this.documents.forEach(doc => {
      if (!map.has(doc.employeeId)) {
        const matchedEmp = this.employees.find(e => e.id === doc.employeeId);
        map.set(doc.employeeId, {
          employeeId: doc.employeeId,
          employeeCode: doc.employeeCode || (matchedEmp?.employeeCode || ''),
          employeeName: doc.employeeName || (matchedEmp ? `${matchedEmp.prefix ? matchedEmp.prefix + '. ' : ''}${matchedEmp.firstName || ''}${matchedEmp.middleName ? ' ' + matchedEmp.middleName : ''}${matchedEmp.surname ? ' ' + matchedEmp.surname : ''}`.trim() : ''),
          process: doc.process || (matchedEmp?.processAssigned || ''),
          department: doc.department || (matchedEmp?.department || ''),
          count: 0,
          selectedCount: 0,
          documents: [],
          selectedDocuments: []
        });
      }
      const item = map.get(doc.employeeId)!;
      item.count++;
      item.documents.push(doc);
      if (this.selectedDocIds.has(doc.id)) {
        item.selectedCount++;
        item.selectedDocuments.push(doc);
      }
    });

    this.groupedEmployeeSummaries = Array.from(map.values());
  }

  isCategoryFullySelectedInDocs(categoryCode: string): boolean {
    const matching = this.documents.filter(d => d.documentType === categoryCode);
    if (matching.length === 0) return false;
    return matching.every(d => this.selectedDocIds.has(d.id));
  }

  toggleCategoryDocSelection(categoryCode: string): void {
    const matching = this.documents.filter(d => d.documentType === categoryCode);
    if (matching.length === 0) return;

    const allChecked = matching.every(d => this.selectedDocIds.has(d.id));
    if (allChecked) {
      // Uncheck all documents of this category
      matching.forEach(d => this.selectedDocIds.delete(d.id));
      // Remove from filterCategories
      const idx = this.filterCategories.indexOf(categoryCode);
      if (idx !== -1) {
        this.filterCategories.splice(idx, 1);
        this.filterCategories = [...this.filterCategories];
      }
    } else {
      // Check all documents of this category
      matching.forEach(d => this.selectedDocIds.add(d.id));
      // Add to filterCategories
      if (!this.filterCategories.includes(categoryCode)) {
        this.filterCategories.push(categoryCode);
        this.filterCategories = [...this.filterCategories];
      }
    }
    this.updateDerivedDocumentState();
  }

  toggleCategoryFilter(code: string): void {
    const idx = this.filterCategories.indexOf(code);
    if (idx !== -1) {
      this.filterCategories.splice(idx, 1);
    } else {
      this.filterCategories.push(code);
    }
    this.onCategoriesFilterChange();
  }

  resetAllFilters(): void {
    this.filterEmployeeIds = [];
    this.filterCategories = [];
    this.filterProcess = 'ALL';
    this.searchKeyword = '';
    this.documents = [];
    this.selectedDocIds.clear();
    this.hasSearched = false;
    this.updateFilteredEmployees();
    this.updateDerivedDocumentState();
  }

  searchAllDocuments(): void {
    this.filterEmployeeIds = [];
    this.filterCategories = [];
    this.filterProcess = 'ALL';
    this.searchKeyword = '';
    this.searchDocuments();
  }

  searchDocuments(): void {
    this.hasSearched = true;
    this.isLoadingDocs = true;
    this.selectedDocIds.clear();

    this.docService.getDocuments({
      employeeIds: this.filterEmployeeIds.length > 0 ? this.filterEmployeeIds : undefined,
      documentTypes: this.filterCategories.length > 0 ? this.filterCategories : undefined,
      process: this.filterProcess !== 'ALL' ? this.filterProcess : undefined,
      search: this.searchKeyword.trim() ? this.searchKeyword.trim() : undefined
    }).subscribe({
      next: res => {
        this.isLoadingDocs = false;
        if (res.success && res.data) {
          this.documents = res.data;
        } else {
          this.documents = [];
        }
        this.syncDocumentSelectionWithCategories();
      },
      error: () => {
        this.isLoadingDocs = false;
        this.documents = [];
        this.updateDerivedDocumentState();
        this.msg.error('Failed to load documents');
      }
    });
  }

  // Selection
  toggleDocSelection(docId: number, checked: boolean): void {
    const doc = this.documents.find(d => d.id === docId);
    if (checked) {
      this.selectedDocIds.add(docId);
      if (doc && !this.filterCategories.includes(doc.documentType)) {
        this.filterCategories.push(doc.documentType);
        this.filterCategories = [...this.filterCategories];
      }
    } else {
      this.selectedDocIds.delete(docId);
      if (doc) {
        const hasOtherSelected = this.documents.some(
          d => d.documentType === doc.documentType && this.selectedDocIds.has(d.id)
        );
        if (!hasOtherSelected) {
          const idx = this.filterCategories.indexOf(doc.documentType);
          if (idx !== -1) {
            this.filterCategories.splice(idx, 1);
            this.filterCategories = [...this.filterCategories];
          }
        }
      }
    }
    this.updateDerivedDocumentState();
  }

  onSelectAllDocsChange(checked: boolean): void {
    if (checked) {
      this.documents.forEach(d => this.selectedDocIds.add(d.id));
      const present = this.presentCategories.map(c => c.code);
      this.filterCategories = Array.from(new Set([...this.filterCategories, ...present]));
    } else {
      this.selectedDocIds.clear();
      this.filterCategories = [];
    }
    this.updateDerivedDocumentState();
  }

  isAllSelected(): boolean {
    return this.documents.length > 0 && this.selectedDocIds.size === this.documents.length;
  }

  isIndeterminate(): boolean {
    return this.selectedDocIds.size > 0 && this.selectedDocIds.size < this.documents.length;
  }

  downloadEmployeeDocumentsZip(empSummary: { employeeCode: string; selectedDocuments?: EmployeeDocument[]; documents: EmployeeDocument[] }): void {
    const targetDocs = (empSummary.selectedDocuments && empSummary.selectedDocuments.length > 0)
      ? empSummary.selectedDocuments
      : empSummary.documents.filter(d => this.selectedDocIds.has(d.id));

    if (targetDocs.length === 0) {
      this.msg.warning(`No selected documents for staff ${empSummary.employeeCode}`);
      return;
    }

    const ids = targetDocs.map(d => d.id);
    this.isZipDownloading = true;
    this.docService.downloadSelectedAsZip(ids).subscribe({
      next: blob => {
        this.isZipDownloading = false;
        saveAs(blob, `${empSummary.employeeCode}_Selected_Documents_${ids.length}_files.zip`);
        this.msg.success(`Downloaded ZIP (${ids.length} files) for ${empSummary.employeeCode}`);
      },
      error: () => {
        this.isZipDownloading = false;
        this.msg.error('Download failed');
      }
    });
  }

  // Downloads
  downloadDoc(doc: EmployeeDocument): void {
    this.docService.downloadDocument(doc.id).subscribe({
      next: blob => {
        const ext = doc.fileName && doc.fileName.includes('.') ? doc.fileName.substring(doc.fileName.lastIndexOf('.')) : '';
        const cleanName = `${doc.employeeCode}_${doc.documentTitle || doc.originalName}${ext}`;
        saveAs(blob, cleanName);
        this.msg.success('Download started');
      },
      error: () => this.msg.error('Download failed')
    });
  }

  downloadSelectedZip(): void {
    if (this.selectedDocIds.size === 0) return;
    this.isZipDownloading = true;
    const ids = Array.from(this.selectedDocIds);

    this.docService.downloadSelectedAsZip(ids).subscribe({
      next: blob => {
        this.isZipDownloading = false;
        saveAs(blob, `Selected_Documents_${ids.length}_files.zip`);
        this.msg.success('ZIP package downloaded successfully.');
      },
      error: () => {
        this.isZipDownloading = false;
        this.msg.error('Failed to download selected documents ZIP.');
      }
    });
  }

  downloadAllVisibleZip(): void {
    if (this.documents.length === 0) return;
    this.isZipDownloading = true;
    const allIds = this.documents.map(d => d.id);

    this.docService.downloadSelectedAsZip(allIds).subscribe({
      next: blob => {
        this.isZipDownloading = false;
        saveAs(blob, `Documents_Export_${allIds.length}_files.zip`);
        this.msg.success('Full documents ZIP package downloaded.');
      },
      error: () => {
        this.isZipDownloading = false;
        this.msg.error('Failed to download documents ZIP.');
      }
    });
  }

  deleteDoc(doc: EmployeeDocument): void {
    this.modal.confirm({
      nzTitle: 'Delete Document',
      nzContent: `Are you sure you want to delete "${doc.documentTitle || doc.originalName}" (${doc.employeeCode})?`,
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzOnOk: () => {
        this.docService.deleteDocument(doc.id).subscribe({
          next: res => {
            if (res.success) {
              this.msg.success('Document deleted successfully');
              this.documents = this.documents.filter(d => d.id !== doc.id);
              this.selectedDocIds.delete(doc.id);
            }
          },
          error: () => this.msg.error('Delete failed')
        });
      }
    });
  }

  // ================= PREVIEW MODAL LOGIC =================
  openPreviewModal(item: StagedDocumentItem): void {
    this.currentServerDoc = null;
    this.previewModalTitle = `${item.documentTitle || item.file.name} (Staged Preview)`;
    this.previewIsImage = item.isImage;
    this.previewIsPdf = item.isPdf;
    this.previewZoom = 1;
    this.previewRotation = 0;

    if (item.isImage && item.previewUrl) {
      this.previewUrl = item.previewUrl;
      this.previewUrlSafe = null;
    } else if (item.isPdf) {
      const blobUrl = item.previewUrl || URL.createObjectURL(item.file);
      this.previewUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
      this.previewUrl = null;
    }
    this.isPreviewModalVisible = true;
  }

  openServerDocPreview(doc: EmployeeDocument): void {
    this.currentServerDoc = doc;
    this.previewModalTitle = `${doc.documentTitle || doc.originalName} (${doc.employeeCode} - ${doc.employeeName || ''})`;
    this.previewIsImage = this.isImageContentType(doc.contentType);
    this.previewIsPdf = this.isPdfContentType(doc.contentType);
    this.previewZoom = 1;
    this.previewRotation = 0;

    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }

    // Fetch binary as blob to guarantee rendering across all browsers/auth states
    this.docService.downloadDocument(doc.id).subscribe({
      next: (blob: Blob) => {
        const mimeType = doc.contentType || (this.previewIsPdf ? 'application/pdf' : 'image/jpeg');
        const typedBlob = new Blob([blob], { type: mimeType });
        this.currentBlobUrl = URL.createObjectURL(typedBlob);

        if (this.previewIsImage) {
          this.previewUrl = this.currentBlobUrl;
          this.previewUrlSafe = null;
        } else if (this.previewIsPdf) {
          this.previewUrl = null;
          this.previewUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.currentBlobUrl);
        }
        this.isPreviewModalVisible = true;
      },
      error: () => {
        // Fallback to direct stream URL
        const streamUrl = this.docService.getPreviewUrl(doc.id);
        if (this.previewIsImage) {
          this.previewUrl = streamUrl;
          this.previewUrlSafe = null;
        } else {
          this.previewUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(streamUrl);
          this.previewUrl = null;
        }
        this.isPreviewModalVisible = true;
      }
    });
  }

  closePreviewModal(): void {
    this.isPreviewModalVisible = false;
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
  }

  onImgError(event: any): void {
    event.target.style.display = 'none';
  }

  // ================= METADATA EDIT LOGIC =================
  openEditModal(doc: EmployeeDocument): void {
    this.editingDoc = {
      id: doc.id,
      documentTitle: doc.documentTitle || doc.originalName,
      documentType: doc.documentType,
      pageNumber: doc.pageNumber,
      notes: doc.notes
    };
    this.isEditModalVisible = true;
  }

  saveEditMetadata(): void {
    if (!this.editingDoc || !this.editingDoc.documentTitle.trim()) {
      this.msg.warning('Document Title cannot be empty');
      return;
    }
    this.isSavingEdit = true;
    this.docService.updateDocumentMetadata(this.editingDoc.id, {
      documentTitle: this.editingDoc.documentTitle.trim(),
      documentType: this.editingDoc.documentType,
      pageNumber: this.editingDoc.pageNumber,
      notes: this.editingDoc.notes
    }).subscribe({
      next: res => {
        this.isSavingEdit = false;
        if (res.success) {
          this.msg.success('Document updated successfully');
          this.isEditModalVisible = false;
          // Update in local list
          const idx = this.documents.findIndex(d => d.id === this.editingDoc!.id);
          if (idx !== -1 && res.data) {
            this.documents[idx] = res.data;
          }
          this.syncDocumentSelectionWithCategories();
        } else {
          this.msg.error(res.message || 'Update failed');
        }
      },
      error: () => {
        this.isSavingEdit = false;
        this.msg.error('Failed to update document metadata');
      }
    });
  }

  // ================= UTILITIES =================
  getCategoryLabel(code: string): string {
    const cat = this.categories.find(c => c.code === code);
    return cat ? cat.label : (code || 'Other');
  }

  getCategoryColor(code: string): string {
    const cat = this.categories.find(c => c.code === code);
    return cat ? cat.color : '#64748b';
  }

  isImageContentType(ct: string): boolean {
    return !!ct && ct.startsWith('image/');
  }

  isPdfContentType(ct: string): boolean {
    return !!ct && (ct.includes('pdf') || ct.endsWith('/pdf'));
  }

  getDocPreviewUrl(docId: number): string {
    return this.docService.getPreviewUrl(docId);
  }

  getInitials(firstName?: string, surname?: string): string {
    const f = firstName ? firstName.charAt(0).toUpperCase() : '';
    const s = surname ? surname.charAt(0).toUpperCase() : '';
    return (f + s) || 'EM';
  }

  formatDisplayName(name?: string): string {
    if (!name) return 'Unknown Staff';
    return name.replace(/_\s*/g, ' ').replace(/\s+/g, ' ').trim();
  }

  getGroupedCategoryBadges(docs: EmployeeDocument[]): Array<{ label: string; count: number; color: string }> {
    if (!docs || docs.length === 0) return [];
    const counts = new Map<string, number>();
    docs.forEach(d => {
      counts.set(d.documentType, (counts.get(d.documentType) || 0) + 1);
    });

    return Array.from(counts.entries()).map(([catCode, count]) => {
      const cat = this.categories.find(c => c.code === catCode);
      return {
        label: cat ? cat.label : catCode,
        count: count,
        color: cat ? cat.color : '#64748b'
      };
    });
  }

  formatBytes(bytes: number, decimals = 1): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
