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
import { FormFieldConfigService, FormFieldConfig } from '../../core/services/form-field-config.service';
import { openDocumentPrintPreview } from '../../shared/utils/print-document';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';

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
    LoadingSpinnerComponent,
    SafeHtmlPipe
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

              <nz-descriptions nzTitle="Additional Personal Details" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions" *ngIf="getCustomFieldsForTab('Personal Info').length > 0">
                <nz-descriptions-item *ngFor="let cf of getCustomFieldsForTab('Personal Info')" [nzTitle]="cf.label">{{ cf.value || '-' }}</nz-descriptions-item>
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

              <nz-descriptions nzTitle="Additional Employment Details" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions" *ngIf="getCustomFieldsForTab('Employment').length > 0">
                <nz-descriptions-item *ngFor="let cf of getCustomFieldsForTab('Employment')" [nzTitle]="cf.label">{{ cf.value || '-' }}</nz-descriptions-item>
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

              <nz-descriptions nzTitle="Additional Bank & Identity Details" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions" *ngIf="getCustomFieldsForTab('Bank & Identity').length > 0">
                <nz-descriptions-item *ngFor="let cf of getCustomFieldsForTab('Bank & Identity')" [nzTitle]="cf.label">{{ cf.value || '-' }}</nz-descriptions-item>
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

              <nz-descriptions nzTitle="Additional Education Details" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions" *ngIf="getCustomFieldsForTab('Education').length > 0">
                <nz-descriptions-item *ngFor="let cf of getCustomFieldsForTab('Education')" [nzTitle]="cf.label">{{ cf.value || '-' }}</nz-descriptions-item>
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

              <nz-descriptions nzTitle="Additional Family Details" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions" *ngIf="getCustomFieldsForTab('Family & Kin').length > 0">
                <nz-descriptions-item *ngFor="let cf of getCustomFieldsForTab('Family & Kin')" [nzTitle]="cf.label">{{ cf.value || '-' }}</nz-descriptions-item>
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

              <nz-descriptions nzTitle="Additional Experience & References" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions" *ngIf="getCustomFieldsForTab('Experience & Ref.').length > 0">
                <nz-descriptions-item *ngFor="let cf of getCustomFieldsForTab('Experience & Ref.')" [nzTitle]="cf.label">{{ cf.value || '-' }}</nz-descriptions-item>
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

              <nz-descriptions nzTitle="Additional Demographics Details" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions" *ngIf="getCustomFieldsForTab('Demographics & Assets').length > 0 || getCustomFieldsForTab('Demographics').length > 0">
                <nz-descriptions-item *ngFor="let cf of (getCustomFieldsForTab('Demographics & Assets').concat(getCustomFieldsForTab('Demographics')))" [nzTitle]="cf.label">{{ cf.value || '-' }}</nz-descriptions-item>
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

    <nz-modal [(nzVisible)]="isGenerateModalVisible" [nzTitle]="docModalTitleTpl"
      (nzOnCancel)="closeGenerateModal()" nzWidth="1020px"
      [nzBodyStyle]="{ padding: '0', background: '#323639', overflow: 'hidden' }" [nzFooter]="null">
      
      <ng-template #docModalTitleTpl>
        <div class="modal-head-title">
          <span class="pdf-tag-badge"><i nz-icon nzType="file-pdf" nzTheme="fill"></i> PDF</span>
          <span class="head-text">Generate Document &bull; {{ employee ? (employee.firstName + ' ' + (employee.surname || '')) : '' }}</span>
        </div>
      </ng-template>

      <ng-template nzModalContent>
        <!-- Selection Bar -->
        <div class="gen-selector-bar">
          <div class="gen-selector-row">
            <div class="gen-field">
              <label class="gen-label">Document Type:</label>
              <nz-select [(ngModel)]="selectedTemplateType" nzPlaceHolder="Choose template type"
                (ngModelChange)="onTemplateTypeChange()" class="gen-select">
                <nz-option *ngFor="let t of templateTypes" [nzValue]="t.code" [nzLabel]="t.display"></nz-option>
              </nz-select>
            </div>
            <div class="gen-field" *ngIf="availableTemplates.length > 0">
              <label class="gen-label">Template:</label>
              <nz-select [(ngModel)]="selectedTemplateId" nzPlaceHolder="Choose template"
                (ngModelChange)="onTemplateSelect()" class="gen-select">
                <nz-option *ngFor="let tpl of availableTemplates" [nzValue]="tpl.id" [nzLabel]="tpl.templateName"></nz-option>
              </nz-select>
            </div>
          </div>
        </div>

        <!-- PDF Reader Toolbar -->
        <div class="pdf-reader-toolbar" *ngIf="previewHtml">
          <div class="toolbar-left">
            <span class="doc-badge-pill"><i nz-icon nzType="file-text"></i> A4 Portrait</span>
            <span class="page-count-pill">{{ getSelectedTemplateName() }}</span>
          </div>

          <div class="toolbar-center">
            <button type="button" class="pdf-tool-btn" (click)="docZoomOut()" [disabled]="docZoomLevel <= 0.5" nz-tooltip="Zoom Out">
              <i nz-icon nzType="minus"></i>
            </button>
            <span class="zoom-value">{{ getDocZoomPercent() }}%</span>
            <button type="button" class="pdf-tool-btn" (click)="docZoomIn()" [disabled]="docZoomLevel >= 1.5" nz-tooltip="Zoom In">
              <i nz-icon nzType="plus"></i>
            </button>
            <div class="toolbar-divider"></div>
            <button type="button" class="pdf-tool-btn text-btn" [class.active-btn]="docZoomLevel === 0.85" (click)="setDocZoom(0.85)" nz-tooltip="Fit Width">
              Fit Width
            </button>
            <button type="button" class="pdf-tool-btn text-btn" [class.active-btn]="docZoomLevel === 1.0" (click)="setDocZoom(1.0)" nz-tooltip="Actual Size (100%)">
              100%
            </button>
          </div>

          <div class="toolbar-right">
            <button type="button" class="pdf-act-btn print-btn" (click)="printPreviewDocument()" [disabled]="!previewHtml" nz-tooltip="Print Document">
              <i nz-icon nzType="printer"></i> Print
            </button>
            <button type="button" class="pdf-act-btn download-btn" (click)="downloadDocument('pdf')" [disabled]="isDownloading || !selectedTemplateId" nz-tooltip="Save as PDF / Download">
              <i nz-icon nzType="download"></i> Save as PDF
            </button>
          </div>
        </div>

        <!-- PDF Canvas Viewport -->
        <div class="pdf-viewport-canvas" *ngIf="previewHtml">
          <div class="pdf-page-scaler"
            [style.transform]="'scale(' + docZoomLevel + ')'"
            [style.transformOrigin]="'top center'"
            [style.marginBottom]="getDocScalerMarginBottom()">
            <iframe [srcdoc]="previewHtml | safeHtml" class="pdf-document-iframe"
              sandbox="allow-same-origin allow-scripts"></iframe>
          </div>
        </div>

        <div class="pdf-loading-state" *ngIf="!previewHtml && selectedTemplateId">
          <i nz-icon nzType="loading" class="pdf-loading-icon"></i>
          <h4 class="loading-title">Generating PDF Document...</h4>
          <p class="loading-subtitle">Merging employee data and generating A4 print layout</p>
        </div>

        <div class="preview-empty-state" *ngIf="!previewHtml && !selectedTemplateId">
          <div class="empty-icon-box">
            <i nz-icon nzType="file-pdf" class="empty-pdf-icon"></i>
          </div>
          <h4 class="empty-title">Select Document Template</h4>
          <p class="empty-desc">Choose a document type and template above to generate the PDF preview.</p>
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

    /* ── Generator Selector Bar ── */
    .gen-selector-bar {
      background: #f8fafc;
      padding: 10px 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    .gen-selector-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .gen-field {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 240px;
    }
    .gen-label {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      white-space: nowrap;
    }
    .gen-select {
      flex: 1;
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
      background: #525659;
      min-height: 480px;
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
  docZoomLevel = 0.85;
  fieldConfigs: FormFieldConfig[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private authService: AuthService,
    private notification: NzNotificationService,
    private templateService: DocumentTemplateService,
    private downloadTrackingService: DownloadTrackingService,
    private formFieldConfigService: FormFieldConfigService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.employeeId = this.getEmployeeId();
    if (this.employeeId) {
      this.loadEmployee(this.employeeId);
      this.loadTemplateTypes();
      this.loadFieldConfigurations();
    }
  }

  private loadFieldConfigurations(): void {
    this.formFieldConfigService.getVisibleConfigs().subscribe({
      next: (configs) => {
        this.fieldConfigs = configs;
      },
      error: () => {}
    });
  }

  getCustomFieldsForTab(tabName: string): { key: string; label: string; value: any }[] {
    if (!this.employee || !this.employee.customFields) return [];
    try {
      const parsed = typeof this.employee.customFields === 'string' ? JSON.parse(this.employee.customFields) : this.employee.customFields;
      if (!parsed || typeof parsed !== 'object') return [];

      const matchingConfigs = this.fieldConfigs.filter(f => f.isCustom && f.tabName === tabName);
      const result = matchingConfigs
        .filter(f => parsed[f.fieldKey] !== undefined && parsed[f.fieldKey] !== null && parsed[f.fieldKey] !== '')
        .map(f => ({
          key: f.fieldKey,
          label: f.fieldLabel,
          value: parsed[f.fieldKey]
        }));

      if (tabName === 'Personal Info') {
        const knownTabs = ['Personal Info', 'Employment', 'Bank & Identity', 'Education', 'Family & Kin', 'Experience & Ref.', 'Demographics & Assets', 'Exit & Docs', 'Exit & Documents', 'Demographics'];
        Object.keys(parsed).forEach(key => {
          const cfg = this.fieldConfigs.find(f => f.fieldKey === key);
          if (!cfg || !knownTabs.includes(cfg.tabName)) {
            if (!result.some(r => r.key === key) && parsed[key] !== undefined && parsed[key] !== null && parsed[key] !== '') {
              result.push({
                key,
                label: cfg ? cfg.fieldLabel : key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                value: parsed[key]
              });
            }
          }
        });
      }

      return result;
    } catch {
      return [];
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

  getDocZoomPercent(): number {
    return Math.round(this.docZoomLevel * 100);
  }

  docZoomIn(): void {
    if (this.docZoomLevel < 1.5) {
      this.docZoomLevel = Math.min(1.5, +(this.docZoomLevel + 0.1).toFixed(2));
    }
  }

  docZoomOut(): void {
    if (this.docZoomLevel > 0.5) {
      this.docZoomLevel = Math.max(0.5, +(this.docZoomLevel - 0.1).toFixed(2));
    }
  }

  setDocZoom(level: number): void {
    this.docZoomLevel = level;
  }

  getDocScalerMarginBottom(): string {
    if (this.docZoomLevel < 1.0) {
      const heightReduction = (1 - this.docZoomLevel) * 310;
      return `-${heightReduction * 3.77}px`;
    }
    return '0px';
  }

  printPreviewDocument(): void {
    if (!this.previewHtml) return;
    openDocumentPrintPreview(this.previewHtml);
  }

  getSelectedTemplateName(): string {
    const t = this.availableTemplates.find(x => x.id === this.selectedTemplateId);
    return t ? t.templateName : 'Document';
  }
}
