import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
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
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { DocumentTemplateService } from '../../core/services/document-template.service';
import { DocumentTemplate } from '../../core/models/document-template.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DateFormatPipe } from '../../shared/pipes/date-format.pipe';

@Component({
  selector: 'app-document-template-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
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
    PageHeaderComponent,
    DateFormatPipe
  ],
  template: `
    <div class="template-list-container">
      <app-page-header icon="file-text" title="Document Templates" subtitle="Manage document templates for employee letters and certificates"
        [breadcrumbs]="[{label: 'Dashboard', link: '/admin/dashboard'}, {label: 'Document Templates'}]">
        <button nz-button nzType="primary" routerLink="/admin/document-templates/new">
          <i nz-icon nzType="plus"></i> Add Template
        </button>
      </app-page-header>

      <!-- Filters -->
      <nz-card class="filter-section" nzBorderless>
        <div nz-row nzGutter="12" nzAlign="middle">
          <div nz-col nzXs="24" nzSm="12" nzMd="8" nzLg="8" class="filter-field-wrapper">
            <nz-input-group [nzPrefix]="searchIcon">
              <input nz-input [(ngModel)]="searchTerm" (input)="onSearch()" placeholder="Search templates...">
            </nz-input-group>
            <ng-template #searchIcon><i nz-icon nzType="search"></i></ng-template>
          </div>
          <div nz-col nzXs="12" nzSm="6" nzMd="4" nzLg="3" class="filter-field">
            <nz-select [(ngModel)]="filterType" (ngModelChange)="loadTemplates()" nzPlaceHolder="Type">
              <nz-option nzValue="" nzLabel="All Types"></nz-option>
              <nz-option *ngFor="let t of typeOptions" [nzValue]="t" [nzLabel]="t"></nz-option>
            </nz-select>
          </div>
          <div nz-col nzXs="12" nzSm="6" nzMd="4" nzLg="3" class="filter-field">
            <nz-select [(ngModel)]="filterActive" (ngModelChange)="loadTemplates()" nzPlaceHolder="Status">
              <nz-option nzValue="" nzLabel="All"></nz-option>
              <nz-option nzValue="true" nzLabel="Active"></nz-option>
              <nz-option nzValue="false" nzLabel="Inactive"></nz-option>
            </nz-select>
          </div>
          <div nz-col class="filter-actions-col">
            <button nz-button (click)="clearFilters()" *ngIf="hasActiveFilters" class="clear-filter-btn">
              <i nz-icon nzType="clear"></i> Clear
            </button>
          </div>
        </div>
      </nz-card>

      <!-- Table -->
      <div class="table-container">
        <div class="table-header">
          <div class="table-title">
            <i nz-icon nzType="file-text"></i> Templates
            <span class="table-count">{{ totalElements }} total</span>
          </div>
        </div>

        <ng-template #emptyTemplate>
          <div class="empty-state-content">
            <div class="empty-icon-wrapper">
              <i nz-icon nzType="file-text" class="empty-icon"></i>
            </div>
            <h3>No templates found</h3>
            <p *ngIf="hasActiveFilters">Try adjusting your search or filter criteria</p>
            <p *ngIf="!hasActiveFilters">Get started by creating your first document template</p>
            <button nz-button nzType="primary" routerLink="/admin/document-templates/new">
              <i nz-icon nzType="plus"></i> Add Template
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
          [nzPageSizeOptions]="[10, 25, 50]"
          [nzScroll]="{ x: '700px' }"
          [nzNoResult]="emptyTemplate"
          class="template-table"
          [nzLoading]="isLoading">
          <thead>
            <tr>
              <th nz-th nzColumnKey="templateName">Template Name</th>
              <th nz-th nzColumnKey="templateType">Type</th>
              <th nz-th nzColumnKey="description">Description</th>
              <th nz-th nzColumnKey="active">Active</th>
              <th nz-th nzColumnKey="createdAt">Created</th>
              <th nz-th nzColumnKey="actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let tpl of dataSource">
              <td nz-td>
                <span class="template-name">{{ tpl.templateName }}</span>
              </td>
              <td nz-td>
                <nz-tag [nzColor]="getTypeColor(tpl.templateType)">{{ tpl.templateType }}</nz-tag>
              </td>
              <td nz-td>
                <span class="desc-text">{{ tpl.description || '-' }}</span>
              </td>
              <td nz-td>
                <nz-switch [ngModel]="tpl.active" (ngModelChange)="toggleActive(tpl)"
                  [nzCheckedChildren]="activeChecked" [nzUnCheckedChildren]="activeUnchecked">
                </nz-switch>
                <ng-template #activeChecked><i nz-icon nzType="check"></i></ng-template>
                <ng-template #activeUnchecked><i nz-icon nzType="close"></i></ng-template>
              </td>
              <td nz-td>
                <span class="date-text">{{ tpl.createdAt | dateFormat }}</span>
              </td>
              <td nz-td (click)="$event.stopPropagation()">
                <div class="row-actions-cell">
                  <button nz-button nzType="text" nz-dropdown [nzDropdownMenu]="rowMenu" class="actions-btn">
                    <i nz-icon nzType="more"></i>
                  </button>
                  <nz-dropdown-menu #rowMenu="nzDropdownMenu">
                    <ul nz-menu class="row-menu">
                      <li nz-menu-item [routerLink]="['/admin/document-templates', tpl.id, 'edit']">
                        <i nz-icon nzType="edit"></i> Edit
                      </li>
                      <li nz-menu-item (click)="toggleActive(tpl)">
                        <i nz-icon [nzType]="tpl.active ? 'stop' : 'check-circle'"></i>
                        {{ tpl.active ? 'Deactivate' : 'Activate' }}
                      </li>
                      <li nz-menu-divider></li>
                      <li nz-menu-item (click)="deleteTemplate(tpl)" class="delete-action">
                        <i nz-icon nzType="delete"></i> Delete
                      </li>
                    </ul>
                  </nz-dropdown-menu>
                </div>
              </td>
            </tr>
          </tbody>
        </nz-table>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .template-list-container { max-width: 1400px; margin: 0 auto; }

    .filter-section { background: #fff; border-radius: var(--radius-lg); margin-bottom: 20px; border: 1px solid var(--color-border-light); box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
    .filter-section .ant-card-body { padding: 12px 16px; }
    .filter-field-wrapper { min-width: 0; }
    .filter-field { min-width: 0; }
    .filter-field .ant-select { width: 100%; }
    .filter-field .ant-select-selector { border-radius: var(--radius-md) !important; height: 36px !important; }
    .filter-actions-col { display: flex; align-items: center; }
    .clear-filter-btn { font-size: 13px; height: 36px; padding: 0 16px; border-radius: var(--radius-md); }

    .table-container { background: #fff; border-radius: var(--radius-lg); box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid var(--color-border-light); }
    .table-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--color-border-light); flex-wrap: wrap; gap: 12px; }
    .table-title { font-size: 16px; font-weight: 700; color: var(--color-primary-500); display: flex; align-items: center; gap: 8px; }
    .table-title i { font-size: 20px; }
    .table-count { font-size: 12px; font-weight: 500; color: #6c757d; background: #f0f2f5; padding: 2px 10px; border-radius: var(--radius-pill); }

    .template-table { width: 100%; }
    .template-table .ant-table-thead > tr > th {
      background: #f8f9fc;
      border-bottom: 2px solid #e8ebf0;
      font-size: 11px;
      font-weight: 700;
      color: var(--color-primary-500);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 10px 12px;
      white-space: nowrap;
    }
    .template-table .ant-table-tbody > tr > td {
      padding: 12px 12px;
      font-size: 13px;
      border-bottom: 1px solid #f0f2f5;
      vertical-align: middle;
    }
    .template-table .ant-table-tbody > tr:hover > td {
      background: #f0f4ff !important;
    }

    .template-name { font-weight: 600; color: #1a1a2e; }

    .desc-text { font-size: 12px; color: #666; max-width: 200px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .date-text { font-size: 12px; color: #555; }

    .row-actions-cell { display: flex; justify-content: center; align-items: center; }
    .actions-btn { min-width: 36px; width: 36px; height: 36px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); background: transparent; transition: all 0.15s; border: none; }
    .actions-btn i { font-size: 20px; color: #8a94a6; }
    .template-table .ant-table-tbody > tr:hover .actions-btn { background: #f0f4ff; }
    .template-table .ant-table-tbody > tr:hover .actions-btn i { color: var(--color-primary-500); }

    .row-menu { border-radius: var(--radius-md); padding: 6px; min-width: 180px; }
    .row-menu .ant-dropdown-menu-item { border-radius: var(--radius-md); font-size: 13px; padding: 8px 12px; display: flex; align-items: center; gap: 8px; }
    .row-menu .ant-dropdown-menu-item i { font-size: 16px; }
    .delete-action { color: #dc3545; }
    .delete-action:hover { color: #c82333 !important; }

    .empty-state-content { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 16px; text-align: center; }
    .empty-icon-wrapper { width: 72px; height: 72px; border-radius: var(--radius-full); background: #f0f4ff; display: flex; align-items: center; justify-content: center; }
    .empty-icon-wrapper .empty-icon { font-size: 36px; color: var(--color-primary-500); opacity: 0.5; }
    .empty-state-content h3 { font-size: 17px; font-weight: 600; color: #333; margin: 0; }
    .empty-state-content p { font-size: 13px; color: #888; margin: 0; max-width: 320px; }

    .template-table .ant-table-pagination {
      margin: 16px 20px !important;
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    @media (max-width: 768px) {
      .filter-field { min-width: 140px; }
      .table-header { flex-direction: column; align-items: flex-start; }
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

  typeOptions: string[] = [];

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
        if (response.success) {
          this.typeOptions = response.data || [];
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
