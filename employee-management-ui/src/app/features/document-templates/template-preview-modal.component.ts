import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzInputModule } from 'ng-zorro-antd/input';

import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { DocumentTemplateService } from '../../core/services/document-template.service';
import { EmployeeService } from '../../core/services/employee.service';
import { Employee } from '../../core/models/employee.model';
import { openDocumentPrintPreview } from '../../shared/utils/print-document';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';

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
    NzInputModule,
    NzToolTipModule,
    SafeHtmlPipe
  ],
  template: `
    <nz-modal [(nzVisible)]="visible" [nzTitle]="modalTitleTpl" nzWidth="1020px"
      [nzBodyStyle]="{ padding: '0', background: '#323639', overflow: 'hidden' }"
      (nzOnCancel)="close()" (nzOnOk)="close()"
      [nzFooter]="null">

      <ng-template #modalTitleTpl>
        <div class="modal-head-title">
          <span class="pdf-tag-badge"><i nz-icon nzType="file-pdf" nzTheme="fill"></i> PDF</span>
          <span class="head-text">{{ templateName || 'Document Preview' }}</span>
        </div>
      </ng-template>

      <ng-template nzModalContent>
        <!-- Employee Selector Header (when previewing from editor or list) -->
        <div class="emp-selector-bar" *ngIf="!isDirectPreview">
          <div class="emp-selector-inner">
            <span class="emp-selector-label"><i nz-icon nzType="user"></i> Preview for Employee:</span>
            <nz-select [(ngModel)]="selectedEmployeeId" nzPlaceHolder="Search employee by name or code..."
              nzShowSearch [nzServerSearch]="true" (nzOnSearch)="onSearchEmployee($event)" (nzScrollToBottom)="loadMoreEmployees()"
              class="emp-select-box" (ngModelChange)="loadPreview()" [nzLoading]="isLoadingEmployees">
              <nz-option *ngFor="let emp of employeeOptions" [nzValue]="emp.id"
                [nzLabel]="(emp.surname ? emp.surname + ' ' : '') + (emp.firstName || '') + (emp.middleName ? ' ' + emp.middleName : '') + ' (' + emp.employeeCode + ')'">
              </nz-option>
              <nz-option *ngIf="isLoadingMore" nzDisabled nzCustomContent>
                <div style="text-align:center; padding: 4px;"><i nz-icon nzType="loading"></i> Loading more...</div>
              </nz-option>
            </nz-select>
            <button nz-button nzType="default" class="emp-refresh-btn" (click)="loadPreview()" [disabled]="!selectedEmployeeId" nz-tooltip="Reload preview data">
              <i nz-icon nzType="reload"></i> Refresh
            </button>
          </div>
        </div>

        <!-- PDF Reader Top Toolbar -->
        <div class="pdf-reader-toolbar">
          <div class="toolbar-left">
            <span class="doc-badge-pill"><i nz-icon nzType="file-text"></i> A4 Portrait</span>
            <span class="page-count-pill">Page 1 of 1</span>
          </div>

          <div class="toolbar-center">
            <button type="button" class="pdf-tool-btn" (click)="zoomOut()" [disabled]="zoomLevel <= 0.5" nz-tooltip="Zoom Out">
              <i nz-icon nzType="minus"></i>
            </button>
            <span class="zoom-value">{{ getZoomPercent() }}%</span>
            <button type="button" class="pdf-tool-btn" (click)="zoomIn()" [disabled]="zoomLevel >= 1.5" nz-tooltip="Zoom In">
              <i nz-icon nzType="plus"></i>
            </button>
            <div class="toolbar-divider"></div>
            <button type="button" class="pdf-tool-btn text-btn" [class.active-btn]="zoomLevel === 0.85" (click)="setZoom(0.85)" nz-tooltip="Fit Width">
              Fit Width
            </button>
            <button type="button" class="pdf-tool-btn text-btn" [class.active-btn]="zoomLevel === 1.0" (click)="setZoom(1.0)" nz-tooltip="Actual Size (100%)">
              100%
            </button>
          </div>

          <div class="toolbar-right">
            <button type="button" class="pdf-act-btn print-btn" (click)="printDocument()" [disabled]="!previewHtml" nz-tooltip="Print Document">
              <i nz-icon nzType="printer"></i> Print
            </button>
            <button type="button" class="pdf-act-btn download-btn" (click)="downloadPdf()" [disabled]="!selectedEmployeeId || !templateId" nz-tooltip="Save as PDF / Download">
              <i nz-icon nzType="download"></i> Save as PDF
            </button>
          </div>
        </div>

        <!-- PDF Canvas Viewport -->
        <div class="pdf-viewport-canvas" *ngIf="!isLoadingPreview; else loadingPreviewTpl">
          <div class="pdf-page-scaler" *ngIf="previewHtml"
            [style.transform]="'scale(' + zoomLevel + ')'"
            [style.transformOrigin]="'top center'"
            [style.marginBottom]="getScalerMarginBottom()">
            <iframe [srcdoc]="previewHtml | safeHtml" class="pdf-document-iframe"
              sandbox="allow-same-origin allow-scripts"></iframe>
          </div>
          <div class="preview-empty-state" *ngIf="!previewHtml">
            <div class="empty-icon-box">
              <i nz-icon nzType="file-pdf" class="empty-pdf-icon"></i>
            </div>
            <h4 class="empty-title">Ready for PDF Preview</h4>
            <p class="empty-desc">Select an employee from the dropdown above to render the filled document.</p>
          </div>
        </div>

        <ng-template #loadingPreviewTpl>
          <div class="pdf-loading-state">
            <i nz-icon nzType="loading" class="pdf-loading-icon"></i>
            <h4 class="loading-title">Generating PDF Document...</h4>
            <p class="loading-subtitle">Merging employee data and generating A4 print layout</p>
          </div>
        </ng-template>
      </ng-template>
    </nz-modal>
  `,
  styles: [`
    .modal-head-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pdf-tag-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #dc2626;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      padding: 1px 7px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
    .head-text {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }

    /* ── Employee Selector Bar ── */
    .emp-selector-bar {
      background: #f8fafc;
      padding: 10px 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    .emp-selector-inner {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .emp-selector-label {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .emp-select-box {
      flex: 1;
      min-width: 280px;
      max-width: 480px;
    }
    .emp-refresh-btn {
      height: 32px;
      border-radius: 6px;
      font-size: 12px;
    }

    /* ── PDF Reader Toolbar ── */
    .pdf-reader-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      background: #202124;
      border-bottom: 1px solid #17181a;
      color: #e8eaed;
      gap: 12px;
      flex-wrap: wrap;
    }
    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .doc-badge-pill {
      font-size: 11px;
      color: #cbd5e1;
      background: rgba(255, 255, 255, 0.08);
      padding: 3px 8px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .page-count-pill {
      font-size: 11px;
      color: #94a3b8;
    }

    .toolbar-center {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .pdf-tool-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: #e8eaed;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }
    .pdf-tool-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.22);
      color: #ffffff;
    }
    .pdf-tool-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
    .pdf-tool-btn.text-btn {
      font-size: 11px;
      font-weight: 500;
      padding: 4px 10px;
    }
    .pdf-tool-btn.text-btn.active-btn {
      background: rgba(67, 97, 238, 0.4);
      border-color: #4361ee;
      color: #ffffff;
    }
    .zoom-value {
      font-size: 12px;
      font-weight: 600;
      color: #f1f5f9;
      min-width: 44px;
      text-align: center;
      font-family: monospace;
    }
    .toolbar-divider {
      width: 1px;
      height: 18px;
      background: rgba(255, 255, 255, 0.16);
      margin: 0 4px;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pdf-act-btn {
      border: none;
      border-radius: 5px;
      padding: 5px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }
    .print-btn {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .print-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.25);
    }
    .print-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .download-btn {
      background: #2563eb;
      color: #ffffff;
    }
    .download-btn:hover:not(:disabled) {
      background: #1d4ed8;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
    }
    .download-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* ── PDF Canvas Viewport ── */
    .pdf-viewport-canvas {
      background: #525659;
      overflow-y: auto;
      overflow-x: auto;
      max-height: 72vh;
      min-height: 520px;
      padding: 24px 16px 36px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      box-sizing: border-box;
    }
    .pdf-page-scaler {
      transition: transform 0.18s cubic-bezier(0.2, 0, 0, 1);
      display: inline-block;
      margin: 0 auto;
    }
    .pdf-document-iframe {
      width: 210mm;
      min-height: 297mm;
      height: 310mm;
      border: none;
      border-radius: 2px;
      box-shadow: 0 6px 28px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 0, 0, 0.2);
      background: #ffffff;
      display: block;
    }

    /* ── Empty & Loading States ── */
    .preview-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 90px 24px;
      color: #cbd5e1;
      text-align: center;
    }
    .empty-icon-box {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .empty-pdf-icon {
      font-size: 32px;
      color: #f87171;
    }
    .empty-title {
      font-size: 16px;
      font-weight: 600;
      color: #f1f5f9;
      margin: 0;
    }
    .empty-desc {
      font-size: 13px;
      color: #94a3b8;
      max-width: 380px;
      margin: 0;
    }

    .pdf-loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      padding: 110px 24px;
      background: #525659;
      min-height: 480px;
    }
    .pdf-loading-icon {
      font-size: 36px;
      color: #60a5fa;
    }
    .loading-title {
      font-size: 16px;
      font-weight: 600;
      color: #f8fafc;
      margin: 0;
    }
    .loading-subtitle {
      font-size: 13px;
      color: #94a3b8;
      margin: 0;
    }
  `]
})
export class TemplatePreviewModalComponent implements OnInit, OnChanges, OnDestroy {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() templateId: number | null = null;
  @Input() templateName: string = '';
  @Input() templateContent: string = '';
  @Input() isDirectPreview = false;
  @Input() employeeId?: number;

  selectedEmployeeId: number | null = null;
  previewHtml: string = '';
  isLoadingPreview = false;

  zoomLevel: number = 0.85;

  employeeOptions: Employee[] = [];
  currentPage = 0;
  pageSize = 10;
  hasMore = true;
  isLoadingEmployees = false;
  isLoadingMore = false;
  searchTerm = '';

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  constructor(
    private templateService: DocumentTemplateService,
    private employeeService: EmployeeService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((query) => {
      this.searchTerm = query;
      this.currentPage = 0;
      this.loadEmployees(false);
    });
    this.loadEmployees(false);
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      if (this.employeeId) {
        this.selectedEmployeeId = this.employeeId;
        this.loadPreview();
      } else if (this.selectedEmployeeId) {
        this.loadPreview();
      } else if (this.employeeOptions.length > 0 && this.employeeOptions[0].id) {
        this.selectedEmployeeId = this.employeeOptions[0].id;
        this.loadPreview();
      }
    }
  }

  getZoomPercent(): number {
    return Math.round(this.zoomLevel * 100);
  }

  zoomIn(): void {
    if (this.zoomLevel < 1.5) {
      this.zoomLevel = Math.min(1.5, +(this.zoomLevel + 0.1).toFixed(2));
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > 0.5) {
      this.zoomLevel = Math.max(0.5, +(this.zoomLevel - 0.1).toFixed(2));
    }
  }

  setZoom(level: number): void {
    this.zoomLevel = level;
  }

  getScalerMarginBottom(): string {
    if (this.zoomLevel < 1.0) {
      const heightReduction = (1 - this.zoomLevel) * 310;
      return `-${heightReduction * 3.77}px`;
    }
    return '0px';
  }

  printDocument(): void {
    if (!this.previewHtml) return;
    openDocumentPrintPreview(this.previewHtml);
  }

  loadEmployees(isAppend: boolean = false): void {
    if (isAppend) {
      this.isLoadingMore = true;
    } else {
      this.isLoadingEmployees = true;
    }

    const params: any = {
      page: this.currentPage,
      size: this.pageSize,
      sort: 'surname,asc'
    };
    if (this.searchTerm && this.searchTerm.trim()) {
      params.search = this.searchTerm.trim();
    }

    this.employeeService.getEmployees(params).subscribe({
      next: (response) => {
        this.isLoadingEmployees = false;
        this.isLoadingMore = false;
        if (response && response.success && response.data) {
          const content = response.data.content || [];
          if (isAppend) {
            this.employeeOptions = [...this.employeeOptions, ...content];
          } else {
            this.employeeOptions = content;
            if (!this.selectedEmployeeId && content.length > 0 && content[0].id) {
              this.selectedEmployeeId = content[0].id;
              if (this.visible) {
                this.loadPreview();
              }
            }
          }
          this.hasMore = response.data.page < (response.data.totalPages - 1);
        }
      },
      error: () => {
        this.isLoadingEmployees = false;
        this.isLoadingMore = false;
      }
    });
  }

  loadMoreEmployees(): void {
    if (this.isLoadingEmployees || this.isLoadingMore || !this.hasMore) return;
    this.currentPage++;
    this.loadEmployees(true);
  }

  onSearchEmployee(query: string): void {
    this.searchSubject.next(query || '');
  }

  loadPreview(): void {
    if (!this.selectedEmployeeId) return;

    this.isLoadingPreview = true;
    this.previewHtml = '';

    if (this.templateContent) {
      this.templateService.previewContent(this.templateContent, this.templateName || 'Document Preview', this.selectedEmployeeId).subscribe({
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
    } else if (this.templateId) {
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
    }
  }

  downloadPdf(): void {
    if (!this.selectedEmployeeId) {
      this.message.warning('Select an employee first');
      return;
    }

    if (this.previewHtml) {
      openDocumentPrintPreview(this.previewHtml);
      this.message.success('Document ready for Print / Save as PDF');
      return;
    }

    if (!this.templateId) {
      this.message.warning('Save the template first to enable PDF download');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      try {
        printWindow.document.open();
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head><title>Generating PDF Document...</title></head>
          <body style="font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc;color:#334155;">
            <div style="text-align:center;">
              <div style="font-size:28px;margin-bottom:12px;">📄</div>
              <div style="font-size:16px;font-weight:600;">Preparing Document...</div>
              <div style="font-size:13px;color:#64748b;margin-top:4px;">Print / Save as PDF will open in a moment</div>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
      } catch (e) {
        console.warn('Could not write placeholder to print window', e);
      }
    }

    this.templateService.generateDocument(this.templateId, this.selectedEmployeeId, 'pdf').subscribe({
      next: (response) => {
        if (response.success && response.data?.html) {
          openDocumentPrintPreview(response.data.html, printWindow);
          this.message.success('Document ready for Print / Save as PDF');
        } else {
          printWindow?.close();
          this.message.error('Error generating document');
        }
      },
      error: () => {
        printWindow?.close();
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
