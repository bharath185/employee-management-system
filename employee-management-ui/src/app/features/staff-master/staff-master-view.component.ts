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
import { openDocumentPrintPreview } from '../../shared/utils/print-document';

@Component({
  selector: 'app-staff-master-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NzCardModule,
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
    <div class="pl-container">
      <div class="pp-sub-nav">
        <a class="pp-nav-item" routerLink="/admin/employees">
          <i class="bi bi-arrow-left"></i><span>Back</span>
        </a>
        <span class="pp-nav-item active">
          <i class="bi bi-person-badge"></i><span>Employee Details</span>
        </span>
        <span class="pp-spacer"></span>
        <span class="view-status-badge" *ngIf="employee" [class.stat-live]="employee.employeeStatus === 'LIVE'" [class.stat-other]="employee.employeeStatus !== 'LIVE'">
          <span class="view-stat-dot"></span>
          {{ employee.employeeStatus }}
        </span>
        <button nz-button nzType="default" *ngIf="employee" (click)="showGenerateModal()" style="margin-right:8px">
          <i class="bi bi-file-earmark-text"></i> Generate
        </button>
        <button nz-button class="btn-primary-gradient" *ngIf="employee" [routerLink]="['/admin/employees', employee.id, 'edit']">
          <i class="bi bi-pencil"></i> Edit
        </button>
      </div>

      <nz-card class="pl-profile-card" nzSize="small" *ngIf="employee">
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
              <span class="view-meta-item"><i class="bi bi-briefcase"></i> {{ employee.designation }}</span>
              <span class="view-meta-item"><i class="bi bi-envelope"></i> {{ employee.email }}</span>
              <span class="view-meta-item"><i class="bi bi-telephone"></i> {{ employee.mobile }}</span>
            </div>
          </div>
        </div>
      </nz-card>

      <app-loading-spinner [loading]="isLoading" message="Loading employee details..."></app-loading-spinner>

      <div *ngIf="!isLoading && employee" class="pl-table-card-wrap">
        <nz-tabset class="detail-tabs">

          <!-- 1. PERSONAL INFO TAB -->
          <nz-tab nzTitle="Personal Info">
            <div class="tab-content">
              <nz-descriptions nzTitle="Personal Details" nzBordered [nzColumn]="{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Prefix">{{ employee.prefix || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="First Name">{{ employee.firstName }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Surname">{{ employee.surname }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Gender">{{ employee.gender | titleCase }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Marital Status">{{ employee.maritalStatus | titleCase }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Blood Group">
                  <span class="blood-badge" *ngIf="employee.bloodGroup">{{ employee.bloodGroup }}</span>
                  <span *ngIf="!employee.bloodGroup">-</span>
                </nz-descriptions-item>
                <nz-descriptions-item nzTitle="Date of Birth">{{ employee.dob | dateFormat }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Age">{{ employee.age ? employee.age + ' yrs' : '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Age Bracket">{{ employee.ageBracket || '-' }}</nz-descriptions-item>
              </nz-descriptions>

              <nz-descriptions nzTitle="Contact Information" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Mobile Number">{{ employee.mobile || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Email Address">{{ employee.email || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Emergency / Close Relative">{{ employee.closeRelativeName || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Relative Mobile">{{ employee.closeRelativeMobile || '-' }}</nz-descriptions-item>
              </nz-descriptions>

              <nz-descriptions nzTitle="Residential Addresses" nzBordered [nzColumn]="{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Present Address">{{ employee.presentAddress || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Permanent Address">{{ employee.permanentAddress || '-' }}</nz-descriptions-item>
              </nz-descriptions>

              <nz-descriptions nzTitle="Languages Known" nzBordered [nzColumn]="{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }" class="tab-descriptions" *ngIf="(employee.languages && employee.languages.length > 0) || employee.languagesCanSpeak">
                <nz-descriptions-item nzTitle="Languages">
                  <div *ngIf="employee.languages && employee.languages.length > 0">
                    <div *ngFor="let lang of employee.languages" style="margin-bottom:6px">
                      <strong style="color:#1f3d6e">{{ lang.language }}</strong>:
                      <span *ngIf="lang.canRead" style="color:#10b981;margin-left:8px;margin-right:8px"><i class="bi bi-check-circle-fill"></i> Read</span>
                      <span *ngIf="lang.canWrite" style="color:#10b981;margin-right:8px"><i class="bi bi-check-circle-fill"></i> Write</span>
                      <span *ngIf="lang.canSpeak" style="color:#10b981;margin-right:8px"><i class="bi bi-check-circle-fill"></i> Speak</span>
                    </div>
                  </div>
                  <div *ngIf="(!employee.languages || employee.languages.length === 0) && employee.languagesCanSpeak">
                    <span>{{ employee.languagesCanSpeak }}</span>
                  </div>
                </nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>

          <!-- 2. EMPLOYMENT TAB -->
          <nz-tab nzTitle="Employment">
            <div class="tab-content">
              <nz-descriptions nzTitle="Work & Role Information" nzBordered [nzColumn]="{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Employee Code">
                  <span class="emp-code-badge">{{ employee.employeeCode }}</span>
                </nz-descriptions-item>
                <nz-descriptions-item nzTitle="Designation">{{ employee.designation | titleCase }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Department">{{ employee.department || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Process Assigned">{{ employee.processAssigned || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Employment Status">
                  <nz-tag [nzColor]="employee.employeeStatus === 'LIVE' ? 'green' : 'default'">{{ employee.employeeStatus }}</nz-tag>
                </nz-descriptions-item>
                <nz-descriptions-item nzTitle="Date of Joining (DOJ)">{{ employee.doj | dateFormat }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="System Role">
                  <span class="role-tag" [class.role-admin]="employee.userRole === 'ADMIN'" [class.role-hr]="employee.userRole === 'HR'">
                    {{ employee.userRole || 'EMPLOYEE' }}
                  </span>
                </nz-descriptions-item>
              </nz-descriptions>

              <nz-descriptions nzTitle="Statutory & Compliance" nzBordered [nzColumn]="{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="PF Number">{{ employee.pfNo || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="UAN Number">{{ employee.uanNo || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="UAN Activation">{{ employee.uanActivation || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="ESIC Number">{{ employee.esicNo || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Aadhaar Seeding">{{ employee.aadharSeeding || '-' }}</nz-descriptions-item>
              </nz-descriptions>

              <nz-descriptions nzTitle="Exit & Separation Details" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Date of Exit (DOE)">{{ employee.doe | dateFormat }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Deletion Month">{{ employee.deletionMonth || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Exit Type">{{ employee.exitType | titleCase }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Exit Reason">{{ employee.exitReason || '-' }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>

          <!-- 3. BANK & IDENTITY TAB -->
          <nz-tab nzTitle="Bank & Identity">
            <div class="tab-content">
              <nz-descriptions nzTitle="Bank Account Details" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Bank Name">{{ employee.bankName || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Account Number">{{ employee.accountNumber || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="IFSC Code">{{ employee.ifscCode || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Branch">{{ employee.branch || '-' }}</nz-descriptions-item>
              </nz-descriptions>

              <nz-descriptions nzTitle="Identity Documents" nzBordered [nzColumn]="{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Aadhaar Number">{{ employee.aadharNumber || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="PAN Number">{{ employee.panNumber || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Ration Card">{{ employee.rationCard || '-' }}</nz-descriptions-item>
              </nz-descriptions>

              <nz-descriptions nzTitle="Verification & Audit" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Aadhaar Verification">{{ employee.aadhaarVerification || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="PAN Verification">{{ employee.panVerification || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="OSV (Original Seen & Verified)">{{ employee.osv || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Remarks">{{ employee.remarks || '-' }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>

          <!-- 4. EDUCATION TAB -->
          <nz-tab nzTitle="Education">
            <div class="tab-content">
              <nz-descriptions nzTitle="Educational Qualification Summary" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Highest Qualification">{{ employee.highestQualification || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Level of Education">{{ employee.levelOfEducation || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Year of Passing">{{ employee.yearOfPassing || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="% of Marks">{{ employee.percentageMarks != null ? employee.percentageMarks + '%' : '-' }}</nz-descriptions-item>
              </nz-descriptions>

              <nz-descriptions nzTitle="Qualifications by Level" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="SSC / Std X">{{ employee.sscStatus || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Intermediate / 10+2">{{ employee.intermediateStatus || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Bachelor's Degree">{{ employee.bachelorsDegree || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Master's Degree">{{ employee.mastersDegree || '-' }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>

          <!-- 5. FAMILY & KIN TAB -->
          <nz-tab nzTitle="Family & Kin">
            <div class="tab-content">
              <nz-descriptions nzTitle="Immediate Family Members" nzBordered [nzColumn]="{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Father's Name">{{ employee.fatherName || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Father's Phone">{{ employee.fatherPhone || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Mother's Name">{{ employee.motherName || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Mother's Phone">{{ employee.motherPhone || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Spouse's Name">{{ employee.spouseName || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Spouse's Phone">{{ employee.spousePhone || '-' }}</nz-descriptions-item>
              </nz-descriptions>

              <nz-descriptions nzTitle="Kin & Household Information" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Father/Husband Name">{{ employee.fatherHusbandName || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Relation (F/M/H)">{{ employee.fMH || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Occupation of Kin">{{ employee.occupationKin || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Occupation Sub-Category">{{ employee.occupationKinSub || '-' }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>

          <!-- 6. EXPERIENCE & REFERENCES TAB -->
          <nz-tab nzTitle="Experience & Ref.">
            <div class="tab-content">
              <nz-descriptions nzTitle="Past Work Experience" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Has Experience">{{ employee.pastExperience || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Organization Name">{{ employee.organizationName || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Period of Employment" [nzSpan]="2">{{ employee.periodOfEmployment || '-' }}</nz-descriptions-item>
              </nz-descriptions>

              <nz-descriptions nzTitle="Reference 1" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Name">{{ employee.ref1Name || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Relationship">{{ employee.ref1Relationship || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Mobile">{{ employee.ref1Mobile || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Address">{{ employee.ref1Address || '-' }}</nz-descriptions-item>
              </nz-descriptions>

              <nz-descriptions nzTitle="Reference 2" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Name">{{ employee.ref2Name || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Relationship">{{ employee.ref2Relationship || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Mobile">{{ employee.ref2Mobile || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Address">{{ employee.ref2Address || '-' }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>

          <!-- 7. DEMOGRAPHICS & ASSETS TAB -->
          <nz-tab nzTitle="Demographics & Assets">
            <div class="tab-content">
              <nz-descriptions nzTitle="Social Demographics" nzBordered [nzColumn]="{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Religion">{{ employee.religion || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Social Category">{{ employee.socialCategory || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Social Subcategory">{{ employee.socialSubcategory || '-' }}</nz-descriptions-item>
              </nz-descriptions>

              <nz-divider nzText="Household Assets Owned" nzOrientation="left"></nz-divider>
              <div class="assets-grid">
                <div class="asset-card" *ngFor="let asset of assetFields" [class.owned]="getAssetValue(asset.key) === 'YES'">
                  <i [class]="getAssetValue(asset.key) === 'YES' ? 'bi bi-check-circle-fill asset-icon owned' : 'bi bi-x-circle-fill asset-icon not-owned'"></i>
                  <span class="asset-label">{{ asset.label }}</span>
                  <span class="asset-status">{{ getAssetValue(asset.key) === 'YES' ? 'Owned' : 'Not Owned' }}</span>
                </div>
              </div>
            </div>
          </nz-tab>

          <!-- 8. DOCUMENTS TAB -->
          <nz-tab nzTitle="Documents">
            <div class="tab-content">
              <div class="documents-tab-header">
                <h3 class="documents-tab-title">Generate Documents</h3>
                <button nz-button class="btn-primary-gradient" (click)="showGenerateModal()">
                  <i class="bi bi-file-earmark-text"></i> Generate Document
                </button>
              </div>
              <nz-divider></nz-divider>
              <h4 class="doc-history-title">Recent Downloads</h4>
              <nz-table #historyTable [nzData]="downloadHistory" [nzFrontPagination]="true" [nzPageSize]="5"
                nzSize="small" [nzNoResult]="noHistory" class="theme-table">
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
                  <i class="bi bi-inbox"></i>
                  <p>No documents downloaded yet</p>
                </div>
              </ng-template>
            </div>
          </nz-tab>
        </nz-tabset>
      </div>
    </div>

    <nz-modal [(nzVisible)]="isGenerateModalVisible" nzTitle="Generate Document"
      (nzOnCancel)="closeGenerateModal()" nzWidth="960px" [nzFooter]="null">
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
              <iframe [srcdoc]="previewHtml" class="preview-iframe"
                sandbox="allow-same-origin allow-scripts"></iframe>
            </div>
            <div class="preview-actions">
              <button nz-button class="btn-primary-gradient" (click)="downloadDocument('pdf')" [nzLoading]="isDownloading">
                <i class="bi bi-download"></i> Download PDF
              </button>
            </div>
          </div>
          <div class="preview-empty" *ngIf="!previewHtml && selectedTemplateId">
            <i class="bi bi-hourglass-split loading-icon"></i>
            <p>Generating preview...</p>
          </div>
        </div>
      </ng-template>
    </nz-modal>
  `,
  styles: [`
    :host { display: block; scroll-behavior: smooth; }
    .pl-container {
      padding: 8px 12px;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      height: calc(100vh - 48px);
      overflow-y: auto;
      scroll-behavior: smooth;
    }
    .pl-container::-webkit-scrollbar { width: 6px; }
    .pl-container::-webkit-scrollbar-track { background: transparent; }
    .pl-container::-webkit-scrollbar-thumb { background: #d0d5dd; border-radius: 3px; }
    .pl-container::-webkit-scrollbar-thumb:hover { background: #98a2b3; }

    .pp-sub-nav {
      display: flex;
      gap: 2px;
      margin-bottom: 8px;
      background: #f0f4ff;
      border-radius: 8px;
      padding: 3px;
      border: 1px solid #e0e7ff;
      align-items: center;
    }
    .pp-nav-item {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #6c757d;
      text-decoration: none;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .pp-nav-item i { font-size: 14px; }
    .pp-nav-item:hover { background: rgba(31,61,110,0.06); color: #1f3d6e; }
    .pp-nav-item.active {
      background: #ffffff;
      color: #1f3d6e;
      box-shadow: 0 1px 4px rgba(31,61,110,0.1);
    }
    .pp-spacer { flex: 1; }

    .btn-primary-gradient {
      height: 30px !important;
      padding: 0 14px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      border: none !important;
      border-radius: 6px !important;
      background: linear-gradient(135deg, #4361ee, #3a0ca3) !important;
      color: #fff !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
      box-shadow: 0 2px 6px rgba(67,97,238,0.25) !important;
    }
    .btn-primary-gradient:hover { transform: translateY(-1px) !important; box-shadow: 0 3px 10px rgba(67,97,238,0.35) !important; }

    .view-status-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 3px 12px; border-radius: 12px; font-size: 11px; font-weight: 600;
    }
    .view-status-badge.stat-live { background: #ecfdf5; color: #059669; }
    .view-status-badge.stat-other { background: #f8fafc; color: #6c757d; }
    .view-stat-dot { width: 7px; height: 7px; border-radius: 50%; }
    .stat-live .view-stat-dot { background: #10b981; box-shadow: 0 0 4px rgba(16,185,129,0.4); }
    .stat-other .view-stat-dot { background: #adb5bd; }

    .pl-profile-card {
      border-radius: 8px !important;
      border: 1px solid #e8eaed !important;
      box-shadow: 0 1px 6px rgba(0,0,0,0.04) !important;
      margin-bottom: 8px;
      width: 100% !important;
    }
    :host ::ng-deep .pl-profile-card .ant-card-body { padding: 12px 16px !important; }
    .view-profile-inner { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .view-avatar { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #4361ee, #3a0ca3); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .view-avatar-initials { font-size: 20px; font-weight: 700; color: #fff; }
    .view-avatar-img { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 3px solid #eef2ff; flex-shrink: 0; }
    .view-profile-info { flex: 1; min-width: 200px; }
    .view-name { font-size: 16px; font-weight: 700; color: #1a1a2e; margin: 0 0 2px; letter-spacing: -0.2px; }
    .view-code { font-size: 12px; color: #6c757d; margin-bottom: 6px; font-family: 'Courier New', monospace; }
    .view-meta { display: flex; flex-wrap: wrap; gap: 12px; }
    .view-meta-item { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #6c757d; }
    .view-meta-item i { font-size: 13px; color: #4361ee; }

    .pl-table-card-wrap {
      background: #ffffff;
      border: 1px solid #e8eaed;
      border-radius: 8px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.04);
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;
    }

    :host ::ng-deep .detail-tabs.ant-tabs { display: flex; flex-direction: column; height: 100%; }
    :host ::ng-deep .detail-tabs.ant-tabs > .ant-tabs-nav { flex-shrink: 0; background: #f8f9fc !important; border-bottom: 1px solid #e8eaed !important; padding: 0 12px; margin-bottom: 0; }
    :host ::ng-deep .detail-tabs > .ant-tabs-nav .ant-tabs-nav-list { flex-wrap: wrap; }
    :host ::ng-deep .detail-tabs .ant-tabs-content-holder { overflow: auto; flex: 1; }
    :host ::ng-deep .detail-tabs .ant-tabs-content { height: 100%; }
    :host ::ng-deep .detail-tabs .ant-tabs-tabpane { height: 100%; }
    :host ::ng-deep .detail-tabs .ant-tabs-tab {
      color: #6c757d !important;
      font-size: 12px;
      padding: 8px 12px;
      transition: color 0.2s ease;
    }
    :host ::ng-deep .detail-tabs .ant-tabs-tab:hover { color: #1a1a2e !important; }
    :host ::ng-deep .detail-tabs .ant-tabs-tab.ant-tabs-tab-active { color: #2563eb !important; font-weight: 600; }
    :host ::ng-deep .detail-tabs .ant-tabs-ink-bar { background: #2563eb !important; height: 3px !important; border-radius: 2px; }
    .tab-content { padding: 12px 16px; height: 100%; overflow-y: auto; box-sizing: border-box; }

    :host ::ng-deep .tab-descriptions { margin-bottom: 18px; }
    :host ::ng-deep .tab-descriptions:last-child { margin-bottom: 0; }
    :host ::ng-deep .tab-descriptions .ant-descriptions-title {
      color: #1f3d6e !important;
      font-weight: 700;
      font-size: 13px;
      margin-bottom: 8px;
    }
    :host ::ng-deep .tab-descriptions .ant-descriptions-view {
      border: 1px solid #e8eaed !important;
      border-radius: 8px !important;
      overflow: hidden;
    }
    :host ::ng-deep .tab-descriptions .ant-descriptions-item-label {
      background: #f8fafc !important;
      color: #475569 !important;
      font-weight: 600;
      font-size: 12px;
      border-bottom: 1px solid #e8eaed !important;
      padding: 9px 14px !important;
      width: 170px;
    }
    :host ::ng-deep .tab-descriptions .ant-descriptions-item-content {
      background: #ffffff !important;
      color: #1e293b !important;
      font-size: 13px;
      font-weight: 500;
      border-bottom: 1px solid #e8eaed !important;
      padding: 9px 14px !important;
    }

    .emp-code-badge {
      font-weight: 700;
      color: #1f3d6e;
      font-size: 12px;
      background: #f0f4ff;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #e0e7ff;
      display: inline-block;
    }

    .blood-badge {
      font-weight: 700;
      color: #e11d48;
      background: #fff1f2;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #ffe4e6;
      font-size: 12px;
      display: inline-block;
    }

    .role-tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }
    .role-admin { background: #eef2ff; color: #4361ee; border: 1px solid #e0e7ff; }
    .role-hr { background: #ecfdf5; color: #059669; border: 1px solid #d1fae5; }

    .assets-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .asset-card {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 16px 12px; background: #ffffff; border-radius: 8px; border: 1px solid #e8eaed;
      transition: all 0.25s ease;
    }
    .asset-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); background: #f8fafc; }
    .asset-card.owned { border-color: #a7f3d0; background: #ecfdf5; }
    .asset-icon { font-size: 28px; }
    .asset-icon.owned { color: #10b981; }
    .asset-icon.not-owned { color: #fca5a5; }
    .asset-label { font-size: 12px; font-weight: 600; color: #1a1a2e; }
    .asset-status { font-size: 10px; font-weight: 500; color: #6c757d; text-transform: uppercase; letter-spacing: 0.3px; }

    :host ::ng-deep .theme-table { width: 100% !important; table-layout: fixed !important; }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th { background: #f8f9fc !important; color: #1f3d6e !important; font-size: 10px !important; font-weight: 700 !important; text-transform: uppercase !important; letter-spacing: 0.5px !important; padding: 6px 6px !important; border-bottom: 2px solid #1f3d6e !important; }
    :host ::ng-deep .theme-table .ant-table-tbody > tr > td { padding: 4px 6px !important; border-bottom: 1px solid #f0f2f5 !important; font-size: 11px; }

    .documents-tab-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .documents-tab-title { font-size: 14px; font-weight: 600; color: #1f3d6e; margin: 0; }
    .doc-history-title { font-size: 13px; font-weight: 600; color: #1a1a2e; margin: 0 0 10px; }
    .no-history { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px; }
    .no-history i { font-size: 28px; color: #d1d5db; }
    .no-history p { font-size: 12px; color: #6c757d; margin: 0; }

    :host ::ng-deep .ant-modal-content { background: #ffffff !important; border: 1px solid #e8eaed !important; border-radius: 10px !important; }
    .gen-modal-body { display: flex; flex-direction: column; gap: 16px; padding: 8px 0; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-label { font-size: 12px; font-weight: 600; color: #1a1a2e; }
    .preview-section { display: flex; flex-direction: column; gap: 10px; }
    .preview-frame {
      border: 1px solid #e8eaed;
      border-radius: 8px;
      overflow: auto;
      background: #cfd5de;
      max-height: 78vh;
    }
    .preview-iframe {
      width: 226mm;
      height: 320mm;
      border: none;
      display: block;
      margin: 0 auto;
      background: #cfd5de;
    }
    .preview-actions { display: flex; gap: 8px; }
    .preview-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 32px; }
    .loading-icon { font-size: 28px; color: #4361ee; }
    .preview-empty p { font-size: 12px; color: #6c757d; margin: 0; }

    @media (max-width: 768px) { .assets-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 480px) { .assets-grid { grid-template-columns: 1fr; } }
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

    // Open print window synchronously on user click so browsers don't block the popup
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

    this.isDownloading = true;
    this.templateService.generateDocument(this.selectedTemplateId, this.employeeId, format).subscribe({
      next: (response) => {
        this.isDownloading = false;
        if (response.success && response.data?.html) {
          openDocumentPrintPreview(response.data.html, printWindow);
          this.message.success('Document ready for Print / Save as PDF');
          this.loadDownloadHistory();
        } else {
          printWindow?.close();
          this.message.error('Error generating document');
        }
      },
      error: () => {
        this.isDownloading = false;
        printWindow?.close();
        this.message.error('Error generating document');
      }
    });
  }
}
