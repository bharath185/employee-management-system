import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzInputModule } from 'ng-zorro-antd/input';

import { DocumentTemplateService } from '../../core/services/document-template.service';
import { EmployeeService } from '../../core/services/employee.service';
import { Employee } from '../../core/models/employee.model';

@Component({
  selector: 'app-template-preview-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzModalModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzSelectModule,
    NzInputModule
  ],
  template: `
    <nz-modal [(nzVisible)]="visible" nzTitle="Template Preview" nzWidth="900px"
      (nzOnCancel)="close()" (nzOnOk)="close()"
      [nzFooter]="null">
      <ng-template nzModalContent>
        <div class="preview-controls" *ngIf="!isDirectPreview">
          <div class="preview-control-row">
            <label class="control-label">Preview with Employee:</label>
            <nz-select [(ngModel)]="selectedEmployeeId" nzPlaceHolder="Select employee" style="width:280px"
              (ngModelChange)="loadPreview()">
              <nz-option *ngFor="let emp of employeeOptions" [nzValue]="emp.id" [nzLabel]="emp.firstName + ' ' + emp.surname + ' (' + emp.employeeCode + ')'"></nz-option>
            </nz-select>
            <button nz-button nzType="default" (click)="loadPreview()" [disabled]="!selectedEmployeeId">
              <i nz-icon nzType="eye"></i> Refresh Preview
            </button>
          </div>
          <div class="preview-control-row">
            <button nz-button nzType="primary" (click)="downloadPdf()" [disabled]="!selectedEmployeeId">
              <i nz-icon nzType="download"></i> Download PDF
            </button>
          </div>
        </div>

        <div class="preview-content" *ngIf="!isLoadingPreview; else loadingPreview">
          <iframe *ngIf="previewHtml" [srcdoc]="previewHtml" class="preview-iframe"
            sandbox="allow-same-origin"></iframe>
          <div class="preview-empty" *ngIf="!previewHtml">
            <i nz-icon nzType="file-text" class="empty-icon"></i>
            <p>Select an employee to preview the template</p>
          </div>
        </div>
        <ng-template #loadingPreview>
          <div class="preview-loading">
            <i nz-icon nzType="loading" class="loading-icon"></i>
            <p>Generating preview...</p>
          </div>
        </ng-template>
      </ng-template>
    </nz-modal>
  `,
  styles: [`
    .preview-controls { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f0f2f5; }
    .preview-control-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .control-label { font-size: 13px; font-weight: 600; color: #333; white-space: nowrap; }

    .preview-content { min-height: 400px; }
    .preview-iframe { width: 100%; height: 600px; border: 1px solid #e8ebf0; border-radius: var(--radius-md); background: #fff; }
    .preview-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 16px; }
    .empty-icon { font-size: 48px; color: #d9d9d9; }
    .preview-empty p { font-size: 14px; color: #999; margin: 0; }

    .preview-loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 16px; }
    .loading-icon { font-size: 32px; color: var(--color-primary-500); }
    .preview-loading p { font-size: 14px; color: #666; margin: 0; }
  `]
})
export class TemplatePreviewModalComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() templateId: number | null = null;
  @Input() templateContent: string = '';
  @Input() isDirectPreview = false;
  @Input() employeeId?: number;

  selectedEmployeeId: number | null = null;
  previewHtml: string = '';
  isLoadingPreview = false;

  employeeOptions: Employee[] = [];

  constructor(
    private templateService: DocumentTemplateService,
    private employeeService: EmployeeService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      if (this.employeeId) {
        this.selectedEmployeeId = this.employeeId;
        this.loadPreview();
      }
    }
  }

  private loadEmployees(): void {
    this.employeeService.getEmployees({ page: 0, size: 200, sort: 'firstName,asc' }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.employeeOptions = response.data.content;
        }
      }
    });
  }

  loadPreview(): void {
    if (!this.selectedEmployeeId) return;

    this.isLoadingPreview = true;
    this.previewHtml = '';

    if (this.templateId) {
      this.templateService.previewTemplate(this.templateId, this.selectedEmployeeId).subscribe({
        next: (response) => {
          this.isLoadingPreview = false;
          if (response.success) {
            this.previewHtml = response.data;
          }
        },
        error: () => {
          this.isLoadingPreview = false;
          this.message.error('Error generating preview');
        }
      });
    } else if (this.templateContent) {
      this.generateLocalPreview();
    }
  }

  private generateLocalPreview(): void {
    if (!this.selectedEmployeeId) return;

    this.employeeService.getEmployeeById(this.selectedEmployeeId).subscribe({
      next: (response) => {
        this.isLoadingPreview = false;
        if (response.success && response.data) {
          const emp = response.data;
          let html = this.templateContent;
          html = html.replace(/\{\{employee_name\}\}/g, `${emp.firstName} ${emp.surname}`);
          html = html.replace(/\{\{employee_code\}\}/g, emp.employeeCode);
          html = html.replace(/\{\{designation\}\}/g, emp.designation || '');
          html = html.replace(/\{\{doj\}\}/g, emp.doj || '');
          html = html.replace(/\{\{doe\}\}/g, emp.doe || '');
          html = html.replace(/\{\{gender\}\}/g, emp.gender || '');
          html = html.replace(/\{\{address\}\}/g, emp.presentAddress || '');
          html = html.replace(/\{\{mobile\}\}/g, emp.mobile || '');
          html = html.replace(/\{\{email\}\}/g, emp.email || '');
          html = html.replace(/\{\{current_date\}\}/g, new Date().toLocaleDateString('en-IN'));
          this.previewHtml = html;
        }
      },
      error: () => {
        this.isLoadingPreview = false;
        this.message.error('Error loading employee data for preview');
      }
    });
  }

  downloadPdf(): void {
    if (!this.selectedEmployeeId || !this.templateId) {
      this.message.warning('Select an employee and save the template first');
      return;
    }

    this.templateService.generateDocument(this.templateId, this.selectedEmployeeId, 'pdf').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `document_${this.selectedEmployeeId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.message.success('Document downloaded');
      },
      error: () => {
        this.message.error('Error generating document');
      }
    });
  }

  close(): void {
    this.visibleChange.emit(false);
    this.previewHtml = '';
    this.selectedEmployeeId = null;
  }
}
