import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzMessageService } from 'ng-zorro-antd/message';

import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { Employee } from '../../core/models/employee.model';
import { DateFormatPipe } from '../../shared/pipes/date-format.pipe';
import { TitleCasePipe } from '../../shared/pipes/title-case.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { environment } from '../../../environments/environment';
import { DocumentTemplateService } from '../../core/services/document-template.service';
import { DownloadTrackingService } from '../../core/services/download-tracking.service';
import { DocumentTemplate, DownloadLog } from '../../core/models/document-template.model';

@Component({
  selector: 'app-staff-master-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzDividerModule,
    NzTabsModule,
    NzSpinModule,
    NzToolTipModule,
    NzDescriptionsModule,
    NzAvatarModule,
    NzModalModule,
    NzSelectModule,
    NzTableModule,
    DateFormatPipe,
    TitleCasePipe,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="view-container">
      <div class="view-header">
        <div class="view-header-left">
          <div class="view-brand">
            <div class="view-icon"><i nz-icon nzType="user"></i></div>
            <span class="view-logo">EMPLOYEE DETAILS</span>
          </div>
          <span class="view-breadcrumb" *ngIf="employee">
            <a routerLink="/admin/dashboard">Dashboard</a> / <a routerLink="/admin/employees">Staff Master</a> / <span class="view-current">{{ employee.employeeCode }}</span>
          </span>
        </div>
        <div class="view-header-actions" *ngIf="employee">
          <span class="view-status-badge" [class.stat-live]="employee.employeeStatus === 'LIVE'" [class.stat-other]="employee.employeeStatus !== 'LIVE'">
            <span class="view-stat-dot"></span>
            {{ employee.employeeStatus | titleCase }}
          </span>
          <button nz-button nzType="primary" class="view-edit-btn" [routerLink]="['/admin/employees', employee.id, 'edit']">
            <i nz-icon nzType="edit"></i> Edit
          </button>
        </div>
      </div>

      <div class="view-profile-card" *ngIf="employee">
        <div class="view-profile-inner">
          <div class="view-avatar-section">
            <img [src]="photoUrl" alt="Photo" class="view-avatar-img" *ngIf="employee.photoPath" (error)="onPhotoError($event)">
            <div class="view-avatar" *ngIf="!employee.photoPath">
              <span class="view-avatar-initials">{{ getInitials(employee.firstName, employee.surname) }}</span>
            </div>
          </div>
          <div class="view-profile-info">
            <h1 class="view-name">{{ employee.prefix ? employee.prefix + '. ' : '' }}{{ employee.firstName }} {{ employee.surname }}</h1>
            <div class="view-code">{{ employee.employeeCode }}</div>
            <div class="view-meta">
              <span class="view-meta-item"><i nz-icon nzType="tool"></i> {{ employee.designation | titleCase }}</span>
              <span class="view-meta-item"><i nz-icon nzType="mail"></i> {{ employee.email }}</span>
              <span class="view-meta-item"><i nz-icon nzType="phone"></i> {{ employee.mobile }}</span>
            </div>
          </div>
        </div>
      </div>

      <app-loading-spinner [loading]="isLoading" message="Loading employee details..."></app-loading-spinner>

      <div *ngIf="!isLoading && employee" class="detail-tabs-wrapper">
        <nz-tabset class="detail-tabs">
          <nz-tab nzTitle="Personal Info">
            <div class="tab-content">
              <nz-descriptions nzTitle="Basic Information" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Employee Code">{{ employee.employeeCode }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Prefix">{{ employee.prefix || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="First Name">{{ employee.firstName }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Surname">{{ employee.surname }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Gender">{{ employee.gender | titleCase }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Marital Status">{{ employee.maritalStatus | titleCase }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Date of Birth">{{ employee.dob | dateFormat }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Age">{{ employee.age }} yrs</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Age Bracket">{{ employee.ageBracket || '-' }}</nz-descriptions-item>
              </nz-descriptions>

              <nz-descriptions nzTitle="Family & Kin" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Father/Husband Name">{{ employee.fatherHusbandName || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="F/M/H">{{ employee.fMH || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Occupation of Kin">{{ employee.occupationKin || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Occupation Sub-Category">{{ employee.occupationKinSub || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Ration Card">{{ employee.rationCard || '-' }}</nz-descriptions-item>
              </nz-descriptions>

              <nz-descriptions nzTitle="Education" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Highest Qualification">{{ employee.highestQualification || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Level of Education">{{ employee.levelOfEducation || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Year of Passing">{{ employee.yearOfPassing || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="% of Marks">{{ employee.percentageMarks != null ? employee.percentageMarks + '%' : '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Date of Joining">{{ employee.doj | dateFormat }}</nz-descriptions-item>
              </nz-descriptions>

              <nz-descriptions nzTitle="Contact" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Email">{{ employee.email }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Mobile">{{ employee.mobile }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Close Relative">{{ employee.closeRelativeName || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Relative Mobile">{{ employee.closeRelativeMobile || '-' }}</nz-descriptions-item>
              </nz-descriptions>

              <nz-descriptions nzTitle="Addresses" nzBordered [nzColumn]="{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Present Address">{{ employee.presentAddress || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Permanent Address">{{ employee.permanentAddress || '-' }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>

          <nz-tab nzTitle="Demographics">
            <div class="tab-content">
              <nz-descriptions nzTitle="Demographics" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Religion">{{ employee.religion || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Social Category">{{ employee.socialCategory || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Social Subcategory">{{ employee.socialSubcategory || '-' }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>

          <nz-tab nzTitle="Assets">
            <div class="tab-content">
              <div class="assets-grid">
                <div class="asset-card" *ngFor="let asset of assetFields"
                     [class.owned]="getAssetValue(asset.key) === 'YES'">
                  <i nz-icon [nzType]="getAssetValue(asset.key) === 'YES' ? 'check-circle' : 'close-circle'" class="asset-icon"></i>
                  <span class="asset-label">{{ asset.label }}</span>
                  <span class="asset-status">{{ getAssetValue(asset.key) === 'YES' ? 'Owned' : 'Not Owned' }}</span>
                </div>
              </div>
            </div>
          </nz-tab>

          <nz-tab nzTitle="Identity">
            <div class="tab-content">
              <nz-descriptions nzTitle="Identity Documents" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Blood Group">{{ employee.bloodGroup || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Aadhar Number">{{ employee.aadharNumber || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="PAN Number">{{ employee.panNumber || '-' }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>

          <nz-tab nzTitle="Education">
            <div class="tab-content">
              <nz-descriptions nzTitle="Education Details" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="SSC / Std X">{{ employee.sscStatus || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Intermediate">{{ employee.intermediateStatus || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Bachelor's Degree">{{ employee.bachelorsDegree || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Master's Degree">{{ employee.mastersDegree || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Aadhaar Verification">{{ employee.aadhaarVerification || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="PAN Verification">{{ employee.panVerification || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="OSV">{{ employee.osv || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Remarks">{{ employee.remarks || '-' }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>

          <nz-tab nzTitle="Bank">
            <div class="tab-content">
              <nz-descriptions nzTitle="Bank Details" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Bank Name">{{ employee.bankName || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Account Number">{{ employee.accountNumber || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="IFSC Code">{{ employee.ifscCode || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Branch">{{ employee.branch || '-' }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>

          <nz-tab nzTitle="Employment">
            <div class="tab-content">
              <nz-descriptions nzTitle="Employment Details" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Employee Status">{{ employee.employeeStatus | titleCase }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Process Assigned">{{ employee.processAssigned || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="ESIC No.">{{ employee.esicNo || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Aadhar Seeding">{{ employee.aadharSeeding || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="UAN No.">{{ employee.uanNo || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="PF No.">{{ employee.pfNo || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="UAN Activation">{{ employee.uanActivation || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Languages">{{ employee.languagesCanSpeak || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Designation">{{ employee.designation | titleCase }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Date of Exit">{{ employee.doe | dateFormat }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>

          <nz-tab nzTitle="Family">
            <div class="tab-content">
              <nz-descriptions nzTitle="Family Members" nzBordered [nzColumn]="{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Father's Name">{{ employee.fatherName || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Father's Phone">{{ employee.fatherPhone || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Mother's Name">{{ employee.motherName || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Mother's Phone">{{ employee.motherPhone || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Spouse's Name">{{ employee.spouseName || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Spouse's Phone">{{ employee.spousePhone || '-' }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>

          <nz-tab nzTitle="Experience & Ref.">
            <div class="tab-content">
              <nz-descriptions nzTitle="Past Experience" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Has Experience">{{ employee.pastExperience || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Organization">{{ employee.organizationName || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Period">{{ employee.periodOfEmployment || '-' }}</nz-descriptions-item>
              </nz-descriptions>

              <nz-descriptions nzTitle="Reference 1" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Name">{{ employee.ref1Name || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Relationship">{{ employee.ref1Relationship || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Address">{{ employee.ref1Address || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Mobile">{{ employee.ref1Mobile || '-' }}</nz-descriptions-item>
              </nz-descriptions>

              <nz-descriptions nzTitle="Reference 2" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Name">{{ employee.ref2Name || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Relationship">{{ employee.ref2Relationship || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Address">{{ employee.ref2Address || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Mobile">{{ employee.ref2Mobile || '-' }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>

          <nz-tab nzTitle="Exit & Docs">
            <div class="tab-content">
              <nz-descriptions nzTitle="Exit Details" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Deletion Month">{{ employee.deletionMonth || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Exit Type">{{ employee.exitType | titleCase }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Exit Reason">{{ employee.exitReason || '-' }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>

          <!-- Documents Tab -->
          <nz-tab nzTitle="Documents">
            <div class="tab-content">
              <div class="documents-tab-header">
                <h3 class="documents-tab-title">Generate Documents</h3>
                <button nz-button nzType="primary" (click)="showGenerateModal()">
                  <i nz-icon nzType="file-text"></i> Generate Document
                </button>
              </div>

              <nz-divider></nz-divider>

              <h4 class="doc-history-title">Recent Downloads</h4>
              <nz-table #historyTable [nzData]="downloadHistory" [nzFrontPagination]="true" [nzPageSize]="5"
                nzSize="small" [nzNoResult]="noHistory" class="history-table">
                <thead>
                  <tr>
                    <th>Template</th>
                    <th>Format</th>
                    <th>Financial Year</th>
                    <th>Downloaded At</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let log of historyTable.data">
                    <td>{{ log.templateName || 'Template #' + log.templateId }}</td>
                    <td><nz-tag [nzColor]="log.format === 'pdf' ? 'red' : 'blue'">{{ (log.format || '').toUpperCase() }}</nz-tag></td>
                    <td>{{ log.financialYear }}</td>
                    <td>{{ log.downloadedAt | dateFormat }}</td>
                  </tr>
                </tbody>
              </nz-table>
              <ng-template #noHistory>
                <div class="no-history">
                  <i nz-icon nzType="inbox"></i>
                  <p>No documents downloaded yet</p>
                </div>
              </ng-template>
            </div>
          </nz-tab>
        </nz-tabset>
      </div>
    </div>

    <!-- Generate Document Modal -->
    <nz-modal [(nzVisible)]="isGenerateModalVisible" nzTitle="Generate Document"
      (nzOnCancel)="closeGenerateModal()" nzWidth="700px" [nzFooter]="null">
      <ng-template nzModalContent>
        <div class="gen-modal-body">
          <div class="form-group">
            <label class="form-label">Select Template Type</label>
            <nz-select [(ngModel)]="selectedTemplateType" nzPlaceHolder="Choose template type"
              (ngModelChange)="onTemplateTypeChange()" style="width:100%">
              <nz-option *ngFor="let t of templateTypes" [nzValue]="t.code" [nzLabel]="t.display"></nz-option>
            </nz-select>
          </div>

          <div class="form-group" *ngIf="availableTemplates.length > 0">
            <label class="form-label">Select Template</label>
            <nz-select [(ngModel)]="selectedTemplateId" nzPlaceHolder="Choose template"
              (ngModelChange)="onTemplateSelect()" style="width:100%">
              <nz-option *ngFor="let tpl of availableTemplates" [nzValue]="tpl.id" [nzLabel]="tpl.templateName"></nz-option>
            </nz-select>
          </div>

          <div class="preview-section" *ngIf="previewHtml">
            <label class="form-label">Preview</label>
            <div class="preview-frame">
              <iframe [srcdoc]="previewHtml" class="preview-iframe" sandbox="allow-same-origin allow-scripts"></iframe>
            </div>
            <div class="preview-actions">
              <button nz-button nzType="primary" (click)="downloadDocument('pdf')" [nzLoading]="isDownloading">
                <i nz-icon nzType="download"></i> Download PDF
              </button>
            </div>
          </div>

          <div class="preview-empty" *ngIf="!previewHtml && selectedTemplateId">
            <i nz-icon nzType="loading" class="loading-icon"></i>
            <p>Generating preview...</p>
          </div>
        </div>
      </ng-template>
    </nz-modal>
  `,
  styles: [`
    :host { display: block; }
    .view-container { max-width: 1200px; margin: 0 auto; }

    .view-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px;padding:14px 20px;background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.12)}
    .view-header-left{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
    .view-brand{display:flex;align-items:center;gap:8px}
    .view-icon{width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.15);border-radius:8px;color:#fff;font-size:16px}
    .view-logo{font-size:17px;font-weight:800;color:#fff;letter-spacing:1.5px}
    .view-breadcrumb{font-size:12px;color:rgba(255,255,255,.65);font-weight:500;padding:2px 10px;background:rgba(255,255,255,.1);border-radius:12px}
    .view-breadcrumb a{color:rgba(255,255,255,.8);text-decoration:none}
    .view-breadcrumb a:hover{color:#fff;text-decoration:underline}
    .view-current{color:rgba(255,255,255,.5)}
    .view-header-actions{display:flex;align-items:center;gap:8px}
    .view-status-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600}
    .view-status-badge.stat-live{background:#ecfdf5;color:#059669}
    .view-status-badge.stat-other{background:#f8fafc;color:#6c757d}
    .view-stat-dot{width:8px;height:8px;border-radius:50%}
    .stat-live .view-stat-dot{background:#10b981;box-shadow:0 0 6px rgba(16,185,129,.5)}
    .stat-other .view-stat-dot{background:#adb5bd}
    .view-edit-btn{height:30px;font-size:12px;border-radius:6px;padding:0 14px;font-weight:600}

    .view-profile-card{background:#fff;border:1px solid #e8eaed;border-radius:10px;margin-bottom:16px;padding:20px 24px;box-shadow:0 1px 4px rgba(0,0,0,.05)}
    .view-profile-inner{display:flex;align-items:center;gap:20px;flex-wrap:wrap}
    .view-avatar-section{flex-shrink:0}
    .view-avatar{width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#4361ee,#3a0ca3);display:flex;align-items:center;justify-content:center}
    .view-avatar-initials{font-size:26px;font-weight:700;color:#fff}
    .view-avatar-img{width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #eef2ff}
    .view-profile-info{flex:1;min-width:200px}
    .view-name{font-size:22px;font-weight:700;color:#1a1a2e;margin:0 0 2px;letter-spacing:-.3px}
    .view-code{font-size:13px;color:#6c757d;margin-bottom:8px;font-family:'Cascadia Code','Consolas',monospace}
    .view-meta{display:flex;flex-wrap:wrap;gap:14px}
    .view-meta-item{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:#6c757d}
    .view-meta-item i{font-size:15px;color:#4361ee}

    :host ::ng-deep .detail-tabs-wrapper {
      background: #ffffff !important;
      border: 1px solid #e8eaed !important;
      border-radius: 8px !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06) !important;
      overflow: hidden;
    }
    :host ::ng-deep .detail-tabs .ant-tabs-nav {
      background: #f8fafc !important;
      border-bottom: 1px solid #e8eaed !important;
      padding: 0 16px;
      margin-bottom: 0;
    }
    :host ::ng-deep .detail-tabs .ant-tabs-tab {
      color: #6c757d !important;
      font-size: 13px;
      padding: 12px 16px;
      transition: color 0.2s ease;
    }
    :host ::ng-deep .detail-tabs .ant-tabs-tab:hover {
      color: #1a1a2e !important;
    }
    :host ::ng-deep .detail-tabs .ant-tabs-tab.ant-tabs-tab-active {
      color: #2563eb !important;
      font-weight: 600;
    }
    :host ::ng-deep .detail-tabs .ant-tabs-ink-bar {
      background: #2563eb !important;
      height: 3px !important;
      border-radius: 2px;
    }
    .tab-content { padding: 24px; }
    :host ::ng-deep .tab-descriptions {
      margin-bottom: 20px;
    }
    :host ::ng-deep .tab-descriptions:last-child { margin-bottom: 0; }
    :host ::ng-deep .tab-descriptions .ant-descriptions-title {
      color: #2563eb !important;
      font-weight: 600;
      font-size: 15px;
    }
    :host ::ng-deep .tab-descriptions .ant-descriptions-view {
      border: 1px solid #e8eaed !important;
      border-radius: 8px !important;
      overflow: hidden;
    }
    :host ::ng-deep .tab-descriptions .ant-descriptions-item-label {
      background: #f8fafc !important;
      color: #6c757d !important;
      font-weight: 500;
      font-size: 13px;
      border-bottom: 1px solid #e8eaed !important;
    }
    :host ::ng-deep .tab-descriptions .ant-descriptions-item-content {
      background: #ffffff !important;
      color: #1a1a2e !important;
      border-bottom: 1px solid #e8eaed !important;
    }

    .assets-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .asset-card { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 20px 16px; background: #ffffff; border-radius: 8px; border: 1px solid #e8eaed; transition: all 0.25s ease; }
    .asset-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); background: #f8fafc; }
    .asset-card.owned { border-color: #a7f3d0; background: #ecfdf5; }
    .asset-icon { font-size: 32px; }
    .asset-card.owned .asset-icon { color: #10b981; }
    .asset-card:not(.owned) .asset-icon { color: #fca5a5; }
    .asset-label { font-size: 14px; font-weight: 600; color: #1a1a2e; }
    .asset-status { font-size: 11px; font-weight: 500; color: #6c757d; text-transform: uppercase; letter-spacing: 0.3px; }

    /* Documents Tab */
    .documents-tab-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
    .documents-tab-title { font-size: 18px; font-weight: 600; color: #2563eb; margin: 0; }
    .doc-history-title { font-size: 14px; font-weight: 600; color: #1a1a2e; margin: 0 0 12px; }
    :host ::ng-deep .history-table .ant-table {
      background: transparent !important;
      color: #1a1a2e !important;
    }
    :host ::ng-deep .history-table .ant-table-thead > tr > th {
      background: #f8fafc !important;
      border-bottom: 1px solid #e8eaed !important;
      color: #6c757d !important;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    :host ::ng-deep .history-table .ant-table-tbody > tr > td {
      border-bottom: 1px solid #e8eaed !important;
      color: #1a1a2e !important;
      background: transparent !important;
    }
    :host ::ng-deep .history-table .ant-table-tbody > tr:hover > td {
      background: #f1f5f9 !important;
    }
    .no-history { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px; }
    .no-history i { font-size: 32px; color: #d1d5db; }
    .no-history p { font-size: 13px; color: #6c757d; margin: 0; }

    /* Generate Modal */
    :host ::ng-deep .ant-modal-content {
      background: #ffffff !important;
      border: 1px solid #e8eaed !important;
      border-radius: 16px !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1) !important;
    }
    :host ::ng-deep .ant-modal-header {
      background: #ffffff !important;
      border-bottom: 1px solid #e8eaed !important;
      border-radius: 16px 16px 0 0 !important;
    }
    :host ::ng-deep .ant-modal-title {
      color: #1a1a2e !important;
      font-weight: 600;
    }
    :host ::ng-deep .ant-modal-close {
      color: #6c757d !important;
    }
    :host ::ng-deep .ant-modal-close:hover {
      color: #2563eb !important;
    }
    .gen-modal-body { display: flex; flex-direction: column; gap: 20px; padding: 8px 0; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-size: 13px; font-weight: 600; color: #1a1a2e; }
    .preview-section { display: flex; flex-direction: column; gap: 12px; }
    .preview-frame { border: 1px solid #e8eaed; border-radius: 12px; overflow: hidden; }
    .preview-iframe { width: 100%; height: 400px; border: none; }
    .preview-actions { display: flex; gap: 8px; }
    .preview-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px; }
    .loading-icon { font-size: 32px; color: #2563eb; }
    .preview-empty p { font-size: 13px; color: #6c757d; margin: 0; }

    @media (max-width: 768px) {
      .profile-main { flex-direction: column; align-items: center; text-align: center; margin-top: 40px; }
      .profile-meta { justify-content: center; }
      .profile-actions { align-self: center; }
      .assets-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) {
      .assets-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class StaffMasterViewComponent implements OnInit {
  employee: Employee | null = null;
  isLoading = false;
  employeeId: number | null = null;

  assetFields = [
    { label: 'TV', key: 'hasTv' },
    { label: 'Fridge', key: 'hasFridge' },
    { label: 'Laptop', key: 'hasLaptop' },
    { label: 'WiFi', key: 'hasWifi' },
    { label: '2 Wheeler', key: 'has2wheeler' },
    { label: '4 Wheeler', key: 'has4wheeler' }
  ];

  templateTypes: {code: string; display: string}[] = [];
  availableTemplates: DocumentTemplate[] = [];
  selectedTemplateType: string = '';
  selectedTemplateId: number | null = null;
  previewHtml: string = '';
  isDownloading = false;

  downloadHistory: DownloadLog[] = [];

  isGenerateModalVisible = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private authService: AuthService,
    private notification: NzNotificationService,
    private templateService: DocumentTemplateService,
    private downloadTrackingService: DownloadTrackingService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.employeeId = this.getEmployeeId();
    if (this.employeeId) {
      this.loadEmployee(this.employeeId);
      this.loadTemplateTypes();
    }
  }

  private getEmployeeId(): number | null {
    const id = this.route.snapshot.params['id'];
    if (id) return +id;
    const user = this.authService.getCurrentUser();
    return user?.id ?? null;
  }

  private loadEmployee(id: number): void {
    this.isLoading = true;
    this.employeeService.getEmployeeById(id).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.employee = response.data;
          this.loadDownloadHistory();
        }
      },
      error: () => {
        this.isLoading = false;
        this.notification.error('Error', 'Error loading employee details');
        this.router.navigate(['/admin/employees']);
      }
    });
  }

  private loadTemplateTypes(): void {
    this.templateService.getTemplateTypes().subscribe({
      next: (response) => {
        if (response.success) {
          this.templateTypes = response.data || [];
        }
      }
    });
  }

  private loadDownloadHistory(): void {
    if (!this.employeeId) return;
    this.downloadTrackingService.getEmployeeLogs(this.employeeId).subscribe({
      next: (response) => {
        if (response.success) {
          this.downloadHistory = response.data || [];
        }
      }
    });
  }

  getInitials(firstName: string, surname: string): string {
    return (firstName?.charAt(0) || '') + (surname?.charAt(0) || '');
  }

  getAssetValue(key: string): string {
    return (this.employee as any)?.[key] || '';
  }

  onPhotoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  get photoUrl(): string {
    if (!this.employee?.photoPath) return '';
    return environment.apiUrl.replace('/api/v1', '') + this.employee.photoPath;
  }

  showGenerateModal(): void {
    this.selectedTemplateType = '';
    this.selectedTemplateId = null;
    this.previewHtml = '';
    this.availableTemplates = [];
    this.isGenerateModalVisible = true;
  }

  closeGenerateModal(): void {
    this.isGenerateModalVisible = false;
    this.selectedTemplateType = '';
    this.selectedTemplateId = null;
    this.previewHtml = '';
  }

  onTemplateTypeChange(): void {
    this.selectedTemplateId = null;
    this.previewHtml = '';
    if (!this.selectedTemplateType) {
      this.availableTemplates = [];
      return;
    }
    this.templateService.getTemplates({ templateType: this.selectedTemplateType, page: 0, size: 100 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableTemplates = response.data.content.filter(t => t.active);
        }
      }
    });
  }

  onTemplateSelect(): void {
    if (!this.selectedTemplateId || !this.employeeId) return;
    this.previewHtml = '';

    this.templateService.previewTemplate(this.selectedTemplateId, this.employeeId).subscribe({
      next: (response) => {
        if (response.success) {
          this.previewHtml = response.data;
        }
      },
      error: () => {
        this.message.error('Error generating preview');
      }
    });
  }

  downloadDocument(format: string): void {
    if (!this.selectedTemplateId || !this.employeeId) return;

    this.isDownloading = true;
    this.templateService.generateDocument(this.selectedTemplateId, this.employeeId, format).subscribe({
      next: (response) => {
        this.isDownloading = false;
        if (response.success && response.data) {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(response.data.html);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
          }
          this.message.success('Document generated successfully');
          this.closeGenerateModal();
          this.loadDownloadHistory();
        }
      },
      error: () => {
        this.isDownloading = false;
        this.message.error('Error generating document');
      }
    });
  }
}
