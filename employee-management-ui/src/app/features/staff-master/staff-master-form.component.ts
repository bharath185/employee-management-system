import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';

import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { FormFieldConfigService, FormFieldConfig } from '../../core/services/form-field-config.service';
import { Employee } from '../../core/models/employee.model';
import { calculateAge, getAgeBracket } from '../../shared/pipes/age.pipe';
import { OnCanDeactivate } from '../../core/guards/can-deactivate.guard';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Subscription } from 'rxjs';

export function minAgeValidator(minAge: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const age = calculateAge(control.value);
    if (age < minAge) {
      return { minAge: { requiredAge: minAge, actualAge: age } };
    }
    return null;
  };
}

export interface ValidationErrorDetail {
  fieldKey: string;
  fieldLabel: string;
  tabIndex: number;
  tabName: string;
  errorKey: string;
  errorMessage: string;
}

const FIELD_METAS: Record<string, { label: string; tabIndex: number; tabName: string }> = {
  surname: { label: 'Surname', tabIndex: 0, tabName: 'Personal Info' },
  firstName: { label: 'First Name', tabIndex: 0, tabName: 'Personal Info' },
  middleName: { label: 'Middle Name', tabIndex: 0, tabName: 'Personal Info' },
  gender: { label: 'Gender', tabIndex: 0, tabName: 'Personal Info' },
  dob: { label: 'Date of Birth', tabIndex: 0, tabName: 'Personal Info' },
  email: { label: 'Email Address', tabIndex: 0, tabName: 'Personal Info' },
  mobile: { label: 'Mobile Number', tabIndex: 0, tabName: 'Personal Info' },
  prefix: { label: 'Prefix', tabIndex: 0, tabName: 'Personal Info' },
  maritalStatus: { label: 'Marital Status', tabIndex: 0, tabName: 'Personal Info' },
  fatherHusbandName: { label: 'Father/Husband Name', tabIndex: 0, tabName: 'Personal Info' },
  presentAddress: { label: 'Present Address', tabIndex: 0, tabName: 'Personal Info' },
  permanentAddress: { label: 'Permanent Address', tabIndex: 0, tabName: 'Personal Info' },
  closeRelativeName: { label: 'Emergency Contact Name', tabIndex: 0, tabName: 'Personal Info' },
  closeRelativeMobile: { label: 'Emergency Contact Mobile', tabIndex: 0, tabName: 'Personal Info' },
  doj: { label: 'Date of Joining', tabIndex: 0, tabName: 'Personal Info' },
  highestQualification: { label: 'Highest Qualification', tabIndex: 0, tabName: 'Personal Info' },
  levelOfEducation: { label: 'Level of Education', tabIndex: 0, tabName: 'Personal Info' },
  yearOfPassing: { label: 'Year of Passing', tabIndex: 0, tabName: 'Personal Info' },
  percentageMarks: { label: '% of Marks', tabIndex: 0, tabName: 'Personal Info' },

  // Tab 1: Employment
  employeeCode: { label: 'Employee Code', tabIndex: 1, tabName: 'Employment' },
  userRole: { label: 'Login Role', tabIndex: 1, tabName: 'Employment' },
  employeeStatus: { label: 'Employee Status', tabIndex: 1, tabName: 'Employment' },
  processAssigned: { label: 'Process / Unit', tabIndex: 1, tabName: 'Employment' },
  department: { label: 'Department', tabIndex: 1, tabName: 'Employment' },
  designation: { label: 'Designation', tabIndex: 1, tabName: 'Employment' },
  esicNo: { label: 'ESIC Number', tabIndex: 1, tabName: 'Employment' },
  uanNo: { label: 'UAN Number', tabIndex: 1, tabName: 'Employment' },
  pfNo: { label: 'PF Number', tabIndex: 1, tabName: 'Employment' },
  aadharSeeding: { label: 'Aadhar Seeding', tabIndex: 1, tabName: 'Employment' },
  uanActivation: { label: 'UAN Activation', tabIndex: 1, tabName: 'Employment' },

  // Tab 2: Bank & Identity
  bankName: { label: 'Bank Name', tabIndex: 2, tabName: 'Bank & Identity' },
  accountNumber: { label: 'Account Number', tabIndex: 2, tabName: 'Bank & Identity' },
  ifscCode: { label: 'IFSC Code', tabIndex: 2, tabName: 'Bank & Identity' },
  branch: { label: 'Bank Branch', tabIndex: 2, tabName: 'Bank & Identity' },
  bloodGroup: { label: 'Blood Group', tabIndex: 2, tabName: 'Bank & Identity' },
  aadharNumber: { label: 'Aadhaar Number', tabIndex: 2, tabName: 'Bank & Identity' },
  panNumber: { label: 'PAN Number', tabIndex: 2, tabName: 'Bank & Identity' },
  rationCard: { label: 'Ration Card', tabIndex: 2, tabName: 'Bank & Identity' },

  // Tab 3: Education
  sscStatus: { label: 'SSC / Std X', tabIndex: 3, tabName: 'Education' },
  intermediateStatus: { label: 'Intermediate / Std XII', tabIndex: 3, tabName: 'Education' },
  bachelorsDegree: { label: "Bachelor's Degree", tabIndex: 3, tabName: 'Education' },
  mastersDegree: { label: "Master's Degree", tabIndex: 3, tabName: 'Education' },
  aadhaarVerification: { label: 'Aadhaar Verification', tabIndex: 3, tabName: 'Education' },
  panVerification: { label: 'PAN Verification', tabIndex: 3, tabName: 'Education' },
  osv: { label: 'OSV', tabIndex: 3, tabName: 'Education' },
  remarks: { label: 'Remarks', tabIndex: 3, tabName: 'Education' },

  // Tab 4: Family & Kin
  fatherName: { label: "Father's Name", tabIndex: 4, tabName: 'Family & Kin' },
  fatherPhone: { label: "Father's Phone", tabIndex: 4, tabName: 'Family & Kin' },
  motherName: { label: "Mother's Name", tabIndex: 4, tabName: 'Family & Kin' },
  motherPhone: { label: "Mother's Phone", tabIndex: 4, tabName: 'Family & Kin' },
  spouseName: { label: "Spouse's Name", tabIndex: 4, tabName: 'Family & Kin' },
  spousePhone: { label: "Spouse's Phone", tabIndex: 4, tabName: 'Family & Kin' },

  // Tab 5: Experience & Ref.
  pastExperience: { label: 'Past Experience', tabIndex: 5, tabName: 'Experience & Ref.' },
  organizationName: { label: 'Previous Organization', tabIndex: 5, tabName: 'Experience & Ref.' },
  periodOfEmployment: { label: 'Period of Employment', tabIndex: 5, tabName: 'Experience & Ref.' },
  ref1Name: { label: 'Reference 1 Name', tabIndex: 5, tabName: 'Experience & Ref.' },
  ref1Relationship: { label: 'Reference 1 Relationship', tabIndex: 5, tabName: 'Experience & Ref.' },
  ref1Address: { label: 'Reference 1 Address', tabIndex: 5, tabName: 'Experience & Ref.' },
  ref1Mobile: { label: 'Reference 1 Mobile', tabIndex: 5, tabName: 'Experience & Ref.' },
  ref2Name: { label: 'Reference 2 Name', tabIndex: 5, tabName: 'Experience & Ref.' },
  ref2Relationship: { label: 'Reference 2 Relationship', tabIndex: 5, tabName: 'Experience & Ref.' },
  ref2Address: { label: 'Reference 2 Address', tabIndex: 5, tabName: 'Experience & Ref.' },
  ref2Mobile: { label: 'Reference 2 Mobile', tabIndex: 5, tabName: 'Experience & Ref.' },

  // Tab 6: Demographics & Assets
  religion: { label: 'Religion', tabIndex: 6, tabName: 'Demographics & Assets' },
  socialCategory: { label: 'Social Category', tabIndex: 6, tabName: 'Demographics & Assets' },
  socialSubcategory: { label: 'Social Subcategory', tabIndex: 6, tabName: 'Demographics & Assets' },
  hasTv: { label: 'Has TV', tabIndex: 6, tabName: 'Demographics & Assets' },
  hasFridge: { label: 'Has Fridge', tabIndex: 6, tabName: 'Demographics & Assets' },
  hasLaptop: { label: 'Has Laptop', tabIndex: 6, tabName: 'Demographics & Assets' },
  hasWifi: { label: 'Has WiFi', tabIndex: 6, tabName: 'Demographics & Assets' },
  has2wheeler: { label: 'Has 2-Wheeler', tabIndex: 6, tabName: 'Demographics & Assets' },
  has4wheeler: { label: 'Has 4-Wheeler', tabIndex: 6, tabName: 'Demographics & Assets' },

  // Tab 7: Exit & Docs
  doe: { label: 'Date of Exit', tabIndex: 7, tabName: 'Exit & Docs' },
  deletionMonth: { label: 'Deletion Month (MM/YYYY)', tabIndex: 7, tabName: 'Exit & Docs' },
  exitType: { label: 'Exit Type', tabIndex: 7, tabName: 'Exit & Docs' },
  exitReason: { label: 'Exit Reason', tabIndex: 7, tabName: 'Exit & Docs' }
};

import { PersonalInfoTabComponent } from './tabs/personal-info-tab/personal-info-tab.component';
import { DemographicsTabComponent } from './tabs/demographics-tab/demographics-tab.component';
import { AssetsTabComponent } from './tabs/assets-tab/assets-tab.component';
import { IdentityTabComponent } from './tabs/identity-tab/identity-tab.component';
import { EducationTabComponent } from './tabs/education-tab/education-tab.component';
import { BankTabComponent } from './tabs/bank-tab/bank-tab.component';
import { EmploymentTabComponent } from './tabs/employment-tab/employment-tab.component';
import { FamilyTabComponent } from './tabs/family-tab/family-tab.component';
import { ExperienceRefTabComponent } from './tabs/experience-ref-tab/experience-ref-tab.component';
import { ExitDocsTabComponent } from './tabs/exit-docs-tab/exit-docs-tab.component';
import { DocumentsTabComponent } from './tabs/documents-tab/documents-tab.component';

@Component({
  selector: 'app-staff-master-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    NzTabsModule,
    NzButtonModule,
    NzIconModule,
    NzMessageModule,
    NzSpinModule,
    NzModalModule,
    NzBadgeModule,
    NzTagModule,
    NzAlertModule,
    NzNotificationModule,
    PersonalInfoTabComponent,
    DemographicsTabComponent,
    AssetsTabComponent,
    IdentityTabComponent,
    EducationTabComponent,
    BankTabComponent,
    EmploymentTabComponent,
    FamilyTabComponent,
    ExperienceRefTabComponent,
    ExitDocsTabComponent,
    DocumentsTabComponent
  ],
  template: `
    <div class="pl-container">
      <!-- Top Action Navigation Bar -->
      <div class="pp-sub-nav">
        <a class="pp-nav-item" routerLink="/admin/employees">
          <i class="bi bi-arrow-left"></i><span>Back</span>
        </a>
        <span class="pp-nav-item active">
          <i class="bi bi-pencil-square"></i><span>{{ isEditMode ? 'Edit Employee' : 'New Employee' }}</span>
          <span class="pp-emp-tag" *ngIf="isEditMode && (currentEmployeeCode || currentEmployeeFullName)">
            <span class="emp-tag-code" *ngIf="currentEmployeeCode">{{ currentEmployeeCode }}</span>
            <span class="emp-tag-dot" *ngIf="currentEmployeeCode && currentEmployeeFullName">&bull;</span>
            <span class="emp-tag-name" *ngIf="currentEmployeeFullName">{{ currentEmployeeFullName }}</span>
          </span>
        </span>
        <span class="pp-spacer"></span>

        <!-- Tab completion progress (Add Mode) -->
        <div class="pp-tab-progress" *ngIf="!isEditMode">
          <div class="pp-progress-bar">
            <div class="pp-progress-fill" [style.width.%]="completedTabs / totalTabs * 100"></div>
          </div>
          <span class="pp-progress-text">{{ completedTabs }}/{{ totalTabs }}</span>
        </div>

        <div class="pp-actions">
          <button nz-button nzType="default" type="button" routerLink="/admin/employees" class="act-btn">Cancel</button>
          <button nz-button nzType="default" type="button" (click)="saveDraft()" [disabled]="isSaving" class="act-btn">
            <i class="bi bi-save"></i> Draft
          </button>
          <button nz-button class="act-btn btn-primary-gradient" type="button" (click)="saveAndNew()" [disabled]="isSaving" [nzLoading]="isSaving">
            Save & New
          </button>
          <button nz-button class="act-btn act-save" type="button" (click)="saveAndClose()" [disabled]="isSaving" [nzLoading]="isSaving">
            {{ isEditMode ? 'Update Record' : 'Save & Close' }}
          </button>
        </div>

        <button type="button" class="validation-summary-badge" *ngIf="validationErrorsList.length > 0" (click)="showErrorsModal()">
          <i nz-icon nzType="exclamation-circle" nzTheme="fill"></i>
          <span>{{ validationErrorsList.length }} Validation Error{{ validationErrorsList.length > 1 ? 's' : '' }}</span>
        </button>
      </div>

      <!-- Prominent Validation Errors Banner (shown after save attempt or when invalid fields exist) -->
      <div class="validation-banner" *ngIf="submitAttempted && validationErrorsList.length > 0">
        <div class="vb-header">
          <div class="vb-title">
            <i nz-icon nzType="close-circle" nzTheme="fill" style="color: #ef4444; font-size: 16px;"></i>
            <strong>Please resolve the following {{ validationErrorsList.length }} field error{{ validationErrorsList.length > 1 ? 's' : '' }} before saving:</strong>
          </div>
          <button nz-button nzType="text" nzSize="small" (click)="submitAttempted = false" class="vb-close">
            <i nz-icon nzType="close"></i>
          </button>
        </div>
        <div class="vb-grid">
          <div class="vb-item" *ngFor="let err of validationErrorsList" (click)="goToField(err.tabIndex, err.fieldKey)">
            <span class="vb-tab-tag">{{ err.tabName }}</span>
            <div class="vb-info">
              <strong class="vb-field">{{ err.fieldLabel }}</strong>
              <span class="vb-msg">{{ err.errorMessage }}</span>
            </div>
            <span class="vb-arrow"><i nz-icon nzType="arrow-right"></i> Fix</span>
          </div>
        </div>
      </div>

      <!-- Main Multi-tab Employee Form -->
      <form [formGroup]="employeeForm" class="form-wrap">
        <nz-tabset class="employee-tabs" [(nzSelectedIndex)]="selectedTabIndex" (nzSelectedIndexChange)="onTabChange($event)">

          <!-- Tab 0: Personal Info -->
          <nz-tab [nzTitle]="tab0Title">
            <ng-template #tab0Title>
              <span>Personal Info</span>
              <nz-badge *ngIf="getTabErrorCount(0) > 0" [nzCount]="getTabErrorCount(0)" [nzStyle]="{ backgroundColor: '#ff4d4f', marginLeft: '6px' }"></nz-badge>
            </ng-template>
            <app-personal-info-tab [form]="employeeForm" [masterData]="masterData" [isEditMode]="isEditMode" [mandatoryMap]="mandatoryMap" [customFields]="getCustomFieldsForTab('Personal Info')" (languagesChange)="onLanguagesChange($event)"></app-personal-info-tab>
          </nz-tab>

          <!-- Tab 1: Employment -->
          <nz-tab [nzTitle]="tab1Title">
            <ng-template #tab1Title>
              <span>Employment</span>
              <nz-badge *ngIf="getTabErrorCount(1) > 0" [nzCount]="getTabErrorCount(1)" [nzStyle]="{ backgroundColor: '#ff4d4f', marginLeft: '6px' }"></nz-badge>
            </ng-template>
            <app-employment-tab [form]="employeeForm" [mandatoryMap]="mandatoryMap" [customFields]="getCustomFieldsForTab('Employment')"></app-employment-tab>
          </nz-tab>

          <!-- Tab 2: Bank & Identity -->
          <nz-tab [nzTitle]="tab2Title">
            <ng-template #tab2Title>
              <span>Bank & Identity</span>
              <nz-badge *ngIf="getTabErrorCount(2) > 0" [nzCount]="getTabErrorCount(2)" [nzStyle]="{ backgroundColor: '#ff4d4f', marginLeft: '6px' }"></nz-badge>
            </ng-template>
            <app-bank-tab [form]="employeeForm" [mandatoryMap]="mandatoryMap" [customFields]="getCustomFieldsForTab('Bank & Identity')"></app-bank-tab>
            <app-identity-tab [form]="employeeForm" [mandatoryMap]="mandatoryMap"></app-identity-tab>
          </nz-tab>

          <!-- Tab 3: Education -->
          <nz-tab [nzTitle]="tab3Title">
            <ng-template #tab3Title>
              <span>Education</span>
              <nz-badge *ngIf="getTabErrorCount(3) > 0" [nzCount]="getTabErrorCount(3)" [nzStyle]="{ backgroundColor: '#ff4d4f', marginLeft: '6px' }"></nz-badge>
            </ng-template>
            <app-education-tab [form]="employeeForm" [mandatoryMap]="mandatoryMap" [customFields]="getCustomFieldsForTab('Education')"></app-education-tab>
          </nz-tab>

          <!-- Tab 4: Family & Kin -->
          <nz-tab [nzTitle]="tab4Title">
            <ng-template #tab4Title>
              <span>Family & Kin</span>
              <nz-badge *ngIf="getTabErrorCount(4) > 0" [nzCount]="getTabErrorCount(4)" [nzStyle]="{ backgroundColor: '#ff4d4f', marginLeft: '6px' }"></nz-badge>
            </ng-template>
            <app-family-tab [form]="employeeForm" [mandatoryMap]="mandatoryMap" [customFields]="getCustomFieldsForTab('Family & Kin')"></app-family-tab>
          </nz-tab>

          <!-- Tab 5: Experience & Ref. -->
          <nz-tab [nzTitle]="tab5Title">
            <ng-template #tab5Title>
              <span>Experience & Ref.</span>
              <nz-badge *ngIf="getTabErrorCount(5) > 0" [nzCount]="getTabErrorCount(5)" [nzStyle]="{ backgroundColor: '#ff4d4f', marginLeft: '6px' }"></nz-badge>
            </ng-template>
            <app-experience-ref-tab [form]="employeeForm" [mandatoryMap]="mandatoryMap" [customFields]="getCustomFieldsForTab('Experience & Ref.')"></app-experience-ref-tab>
          </nz-tab>

          <!-- Tab 6: Demographics & Assets -->
          <nz-tab [nzTitle]="tab6Title">
            <ng-template #tab6Title>
              <span>Demographics & Assets</span>
              <nz-badge *ngIf="getTabErrorCount(6) > 0" [nzCount]="getTabErrorCount(6)" [nzStyle]="{ backgroundColor: '#ff4d4f', marginLeft: '6px' }"></nz-badge>
            </ng-template>
            <app-demographics-tab [form]="employeeForm" [mandatoryMap]="mandatoryMap" [customFields]="getCustomFieldsForTab('Demographics & Assets')"></app-demographics-tab>
            <app-assets-tab [form]="employeeForm" [mandatoryMap]="mandatoryMap"></app-assets-tab>
          </nz-tab>

          <!-- Tab 7: Exit & Docs -->
          <nz-tab [nzTitle]="tab7Title">
            <ng-template #tab7Title>
              <span>Exit & Docs</span>
              <nz-badge *ngIf="getTabErrorCount(7) > 0" [nzCount]="getTabErrorCount(7)" [nzStyle]="{ backgroundColor: '#ff4d4f', marginLeft: '6px' }"></nz-badge>
            </ng-template>
            <app-exit-docs-tab [form]="employeeForm" [existingPhotoUrl]="existingPhotoUrl" [mandatoryMap]="mandatoryMap" [customFields]="getCustomFieldsForTab('Exit & Docs')" (photoChange)="onPhotoChange($event)"></app-exit-docs-tab>
          </nz-tab>

          <!-- Tab 8: Documents -->
          <nz-tab nzTitle="Documents" [nzDisabled]="!isEditMode">
            <app-documents-tab [employeeId]="employeeId" [isEditMode]="isEditMode"></app-documents-tab>
          </nz-tab>
        </nz-tabset>
      </form>
    </div>
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

    .pp-sub-nav {
      display: flex; gap: 4px; margin-bottom: 8px;
      background: #f0f4ff; border-radius: 8px; padding: 4px 8px;
      border: 1px solid #e0e7ff; align-items: center; flex-wrap: wrap;
    }
    .pp-nav-item {
      display: flex; align-items: center; gap: 5px;
      padding: 5px 12px; border-radius: 6px; font-size: 12px;
      font-weight: 600; color: #6c757d; text-decoration: none;
      transition: all 0.2s ease; white-space: nowrap;
    }
    .pp-nav-item i { font-size: 14px; }
    .pp-nav-item:hover { background: rgba(31,61,110,0.06); color: #1f3d6e; }
    .pp-nav-item.active { background: #ffffff; color: #1f3d6e; box-shadow: 0 1px 4px rgba(31,61,110,0.1); }
    .pp-emp-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-left: 8px;
      padding: 2px 10px;
      background: linear-gradient(135deg, #1e3a8a, #2563eb);
      color: #ffffff;
      border-radius: 12px;
      font-size: 11.5px;
      font-weight: 600;
      letter-spacing: 0.2px;
      box-shadow: 0 1px 4px rgba(37,99,235,0.25);
    }
    .emp-tag-code {
      font-weight: 700;
      letter-spacing: 0.5px;
      background: rgba(255,255,255,0.22);
      padding: 1px 6px;
      border-radius: 4px;
    }
    .emp-tag-dot {
      opacity: 0.7;
    }
    .emp-tag-name {
      font-weight: 600;
    }
    .pp-spacer { flex: 1; }
    .pp-tab-progress { display: flex; align-items: center; gap: 8px; margin-right: 8px; }
    .pp-progress-bar { width: 80px; height: 4px; background: #e0e7ff; border-radius: 3px; overflow: hidden; }
    .pp-progress-fill { height: 100%; background: linear-gradient(90deg, #4361ee, #3a0ca3); border-radius: 3px; transition: width 0.4s ease; }
    .pp-progress-text { font-size: 11px; color: #6c757d; font-weight: 500; }

    .pp-actions {
      display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
    }
    .act-btn {
      height: 30px; line-height: 28px; border-radius: 6px; font-size: 12px;
      font-weight: 500; padding: 0 12px; display: inline-flex; align-items: center;
    }
    .act-btn i { margin-right: 4px; font-size: 13px; }
    .act-btn[nzType="default"] { background: #fff; border: 1px solid #d1d5db; color: #374151; }
    .act-btn[nzType="default"]:hover { border-color: #4361ee; color: #4361ee; }
    .btn-primary-gradient {
      background: linear-gradient(135deg, #4361ee, #3a0ca3) !important;
      border: none !important; color: #fff !important;
      box-shadow: 0 2px 6px rgba(67,97,238,0.25) !important;
    }
    .act-save {
      background: linear-gradient(135deg, #1f3d6e, #16213e) !important;
      border: none !important; color: #fff !important;
      box-shadow: 0 2px 8px rgba(31,61,110,0.3) !important;
    }

    .validation-summary-badge {
      display: inline-flex; align-items: center; gap: 6px; font-size: 11px;
      color: #b91c1c; font-weight: 600; background: #fef2f2;
      padding: 4px 10px; border-radius: 6px; border: 1px solid #fecaca;
      cursor: pointer; transition: all 0.2s ease;
    }
    .validation-summary-badge:hover {
      background: #fee2e2; border-color: #fca5a5;
    }

    /* Validation Banner */
    .validation-banner {
      background: #fff5f5; border: 1px solid #feb2b2; border-left: 4px solid #ef4444;
      border-radius: 8px; padding: 12px 16px; margin-bottom: 10px;
      animation: fadeIn 0.3s ease-in-out;
    }
    .vb-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
    }
    .vb-title {
      display: flex; align-items: center; gap: 8px; color: #991b1b; font-size: 13px;
    }
    .vb-close {
      color: #991b1b !important;
    }
    .vb-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 8px;
    }
    .vb-item {
      display: flex; align-items: center; gap: 8px; background: #ffffff;
      border: 1px solid #fee2e2; border-radius: 6px; padding: 6px 10px;
      cursor: pointer; transition: all 0.2s ease;
    }
    .vb-item:hover {
      border-color: #ef4444; background: #fffaf0; transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(239, 68, 68, 0.1);
    }
    .vb-tab-tag {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      background: #fee2e2; color: #b91c1c; padding: 2px 6px;
      border-radius: 4px; white-space: nowrap;
    }
    .vb-info {
      flex: 1; display: flex; flex-direction: column; min-width: 0;
    }
    .vb-field {
      font-size: 12px; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .vb-msg {
      font-size: 11px; color: #dc2626; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .vb-arrow {
      font-size: 11px; color: #4361ee; font-weight: 600; white-space: nowrap; display: flex; align-items: center; gap: 2px;
    }

    .form-wrap {
      flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0;
      background: #ffffff; border: 1px solid #e8eaed; border-radius: 8px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.04);
    }

    :host ::ng-deep .employee-tabs { display: flex; flex-direction: column; height: 100%; }
    :host ::ng-deep .employee-tabs .ant-tabs-nav {
      padding: 0 12px; margin-bottom: 0; flex-shrink: 0;
      background: #f8fafc !important; border-bottom: 1px solid #e8eaed !important;
    }
    :host ::ng-deep .employee-tabs .ant-tabs-content-holder { flex: 1; overflow: hidden; min-height: 0; padding: 0; }
    :host ::ng-deep .employee-tabs .ant-tabs-content { height: 100%; }
    :host ::ng-deep .employee-tabs .ant-tabs-tabpane { height: 100%; overflow-y: auto; padding: 10px 16px 20px !important; }
    :host ::ng-deep .employee-tabs .ant-tabs-tab {
      font-size: 12px; padding: 8px 12px; margin: 0 1px;
      color: #6c757d !important; transition: all 0.2s ease;
    }
    :host ::ng-deep .employee-tabs .ant-tabs-tab:hover { color: #1f3d6e !important; }
    :host ::ng-deep .employee-tabs .ant-tabs-tab.ant-tabs-tab-active { color: #1f3d6e !important; font-weight: 600; }
    :host ::ng-deep .employee-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn { color: #1f3d6e !important; }
    :host ::ng-deep .employee-tabs .ant-tabs-ink-bar { background: #1f3d6e !important; height: 3px !important; }

    :host ::ng-deep .tab-container { padding: 6px 0 !important; }
    :host ::ng-deep .form-section { margin-bottom: 10px !important; padding: 12px 16px !important; }
    :host ::ng-deep .form-section-header { margin-bottom: 10px !important; padding-bottom: 8px !important; border-bottom: 2px solid #e8edf5 !important; }
    :host ::ng-deep .form-section-title { font-size: 13px !important; }
    :host ::ng-deep .form-section-icon { width: 26px !important; height: 26px !important; background: linear-gradient(135deg, #1f3d6e, #16213e) !important; }
    :host ::ng-deep .form-section-icon i { font-size: 14px !important; }
    :host ::ng-deep .section-title { font-size: 13px !important; margin: 0 0 10px !important; padding-bottom: 6px !important; }
    :host ::ng-deep .subsection-title { font-size: 12px !important; margin: 0 0 10px !important; }
    :host ::ng-deep .photo-section { padding: 10px 14px !important; margin-top: 14px !important; }

    :host ::ng-deep .form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 20px; }
    :host ::ng-deep .form-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 20px; }
    :host ::ng-deep .form-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px 16px; }
    :host ::ng-deep .form-grid-full { grid-column: 1 / -1; }
    :host ::ng-deep nz-form-item { margin-bottom: 0 !important; }
    :host ::ng-deep .ant-form-item { margin-bottom: 0 !important; }
    :host ::ng-deep .ant-form-item-label { padding: 0 0 2px !important; }
    :host ::ng-deep .ant-form-item-label > label { height: 22px !important; font-size: 12px !important; color: #374151 !important; font-weight: 500 !important; }
    :host ::ng-deep .ant-form-item-control-input { min-height: 28px !important; }
    :host ::ng-deep .ant-input { height: 30px !important; font-size: 12px !important; padding: 4px 8px !important; border-radius: 6px !important; }
    :host ::ng-deep .ant-select { font-size: 12px !important; height: 30px !important; }
    :host ::ng-deep .ant-select-selector { border-radius: 6px !important; padding: 0 8px !important; height: 30px !important; }
    :host ::ng-deep .ant-select-selection-item { line-height: 28px !important; font-size: 12px !important; }
    :host ::ng-deep .ant-picker { height: 30px !important; border-radius: 6px !important; padding: 0 8px !important; width: 100% !important; }
    :host ::ng-deep .ant-picker input { font-size: 12px !important; }
    :host ::ng-deep .ant-checkbox-wrapper { font-size: 12px !important; }
    :host ::ng-deep textarea.ant-input { height: auto !important; min-height: 56px !important; resize: vertical; }
    :host ::ng-deep .ant-input:hover { border-color: #4361ee !important; }
    :host ::ng-deep .ant-input:focus, :host ::ng-deep .ant-input-focused { border-color: #4361ee !important; box-shadow: 0 0 0 2px rgba(67,97,238,0.12) !important; }
    :host ::ng-deep .ant-select-selector:hover { border-color: #4361ee !important; }
    :host ::ng-deep .ant-select-focused .ant-select-selector { border-color: #4361ee !important; box-shadow: 0 0 0 2px rgba(67,97,238,0.12) !important; }
    :host ::ng-deep .ant-picker:hover { border-color: #4361ee !important; }
    :host ::ng-deep .ant-picker-focused { border-color: #4361ee !important; box-shadow: 0 0 0 2px rgba(67,97,238,0.12) !important; }
    :host ::ng-deep .ant-checkbox-checked .ant-checkbox-inner { background: #4361ee !important; border-color: #4361ee !important; }

    :host ::ng-deep .ant-form-item-has-error .ant-input,
    :host ::ng-deep .ant-form-item-has-error .ant-select-selector,
    :host ::ng-deep .ant-form-item-has-error .ant-picker {
      border-color: #ef4444 !important;
      background-color: #fff8f8 !important;
    }

    :host ::ng-deep .highlight-pulse {
      animation: highlightPulse 1.8s ease-in-out;
    }

    @keyframes highlightPulse {
      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); border-color: #ef4444; }
      50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); border-color: #ef4444; }
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }

    :host ::ng-deep .ant-tabs-tabpane::-webkit-scrollbar { width: 5px; }
    :host ::ng-deep .ant-tabs-tabpane::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px; }
    :host ::ng-deep .ant-tabs-tabpane::-webkit-scrollbar-thumb { background: #c1c7cd; border-radius: 3px; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 768px) {
      :host ::ng-deep .form-grid, :host ::ng-deep .form-grid-3 { grid-template-columns: repeat(2, 1fr); }
      :host ::ng-deep .form-grid-4 { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class StaffMasterFormComponent implements OnInit, OnDestroy, OnCanDeactivate {
  allFieldConfigs: FormFieldConfig[] = [];
  mandatoryMap: Record<string, boolean> = {};
  loadedCustomFields: Record<string, any> = {};
  @ViewChild(ExitDocsTabComponent) exitDocsTab!: ExitDocsTabComponent;

  employeeForm: FormGroup;
  isEditMode = false;
  employeeId: number | null = null;
  loadedEmployee: Employee | null = null;
  isSaving = false;
  submitAttempted = false;
  masterData: any = {};
  selectedFile: File | null = null;
  existingPhotoUrl: string = '';
  formErrors: string[] = [];
  selectedTabIndex = 0;
  capturedLanguages: any[] = [];
  private previousTabIndex = 0;
  private readonly DRAFT_KEY = 'staff_form_draft';
  private valueChangesSub!: Subscription;

  get currentEmployeeCode(): string {
    return this.employeeForm.get('employeeCode')?.value || this.loadedEmployee?.employeeCode || '';
  }

  get currentEmployeeFullName(): string {
    const prefix = this.employeeForm.get('prefix')?.value || this.loadedEmployee?.prefix || '';
    const surname = this.employeeForm.get('surname')?.value || this.loadedEmployee?.surname || '';
    const firstName = this.employeeForm.get('firstName')?.value || this.loadedEmployee?.firstName || '';
    const middleName = this.employeeForm.get('middleName')?.value || this.loadedEmployee?.middleName || '';

    const parts = [
      prefix ? prefix.trim() + '.' : '',
      surname ? surname.trim() : '',
      firstName ? firstName.trim() : '',
      middleName ? middleName.trim() : ''
    ].filter(Boolean);

    return parts.join(' ');
  }

  canDeactivate(): boolean {
    return !this.employeeForm.dirty;
  }

  readonly totalTabs = 9;

  get completedTabs(): number {
    let count = 0;
    for (let i = 0; i < this.totalTabs; i++) {
      if (this.isTabComplete(i)) count++;
    }
    return count;
  }

  isTabComplete(index: number): boolean {
    const controls = this.tabControlMap[index];
    if (!controls) return false;
    return controls.some(key => {
      const val = this.employeeForm.get(key)?.value;
      return val !== null && val !== undefined && val !== '';
    });
  }

  private readonly tabControlMap: string[][] = [
    // 0: Personal Info
    ['firstName', 'surname', 'gender', 'dob', 'email', 'mobile', 'prefix', 'maritalStatus', 'bloodGroup', 'presentAddress', 'permanentAddress', 'closeRelativeName', 'closeRelativeMobile', 'doj', 'highestQualification', 'levelOfEducation', 'yearOfPassing', 'percentageMarks'],
    // 1: Employment
    ['employeeCode', 'userRole', 'employeeStatus', 'processAssigned', 'department', 'designation', 'esicNo', 'aadharSeeding', 'uanNo', 'pfNo', 'uanActivation'],
    // 2: Bank & Identity
    ['bankName', 'accountNumber', 'ifscCode', 'branch', 'aadharNumber', 'panNumber', 'rationCard'],
    // 3: Education
    ['sscStatus', 'intermediateStatus', 'bachelorsDegree', 'mastersDegree', 'aadhaarVerification', 'panVerification', 'osv', 'remarks'],
    // 4: Family & Kin
    ['fatherName', 'fatherPhone', 'motherName', 'motherPhone', 'spouseName', 'spousePhone', 'fatherHusbandName', 'fMH', 'occupationKin', 'occupationKinSub'],
    // 5: Experience & Ref.
    ['pastExperience', 'organizationName', 'periodOfEmployment', 'ref1Name', 'ref1Relationship', 'ref1Address', 'ref1Mobile', 'ref2Name', 'ref2Relationship', 'ref2Address', 'ref2Mobile'],
    // 6: Demographics & Assets
    ['religion', 'socialCategory', 'socialSubcategory', 'hasTv', 'hasFridge', 'hasLaptop', 'hasWifi', 'has2wheeler', 'has4wheeler'],
    // 7: Exit & Docs
    ['doe', 'deletionMonth', 'exitType', 'exitReason'],
    // 8: Documents
    []
  ];

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private masterDataService: MasterDataService,
    private formFieldConfigService: FormFieldConfigService,
    private route: ActivatedRoute,
    private router: Router,
    private message: NzMessageService,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private authService: AuthService
  ) {
    this.employeeForm = this.createForm();
  }

  ngOnInit(): void {
    this.employeeId = this.route.snapshot.params['id'] ? +this.route.snapshot.params['id'] : null;
    if (!this.employeeId) {
      const user = this.authService.getCurrentUser();
      if (user?.id) this.employeeId = user.id;
    }
    this.isEditMode = !!this.employeeId;
    this.loadFieldConfigurations();

    if (this.isEditMode && this.employeeId) {
      this.loadEmployee(this.employeeId);
    } else if (!this.isEditMode) {
      this.checkForDraft();
    }

    // Show validation errors as user types
    this.valueChangesSub = this.employeeForm.valueChanges.subscribe(() => {
      Object.keys(this.employeeForm.controls).forEach(key => {
        const control = this.employeeForm.get(key);
        if (control?.dirty && !control.touched) {
          control.markAsTouched();
        }
      });
      this.formErrors = this.collectFormErrors();
    });

    // Unsaved changes warning on tab/window close
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  ngOnDestroy(): void {
    this.valueChangesSub?.unsubscribe();
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
  }

  private beforeUnloadHandler = (event: BeforeUnloadEvent): void => {
    if (this.employeeForm.dirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  };

  private createForm(): FormGroup {
    return this.fb.group({
      // Personal Info
      employeeCode: ['', Validators.pattern('^[A-Za-z0-9]+$')],
      userRole: [''],
      prefix: [''],
      surname: ['', [Validators.required, Validators.maxLength(40)]],
      firstName: ['', [Validators.required, Validators.maxLength(40)]],
      middleName: ['', [Validators.maxLength(40)]],
      gender: ['', Validators.required],
      maritalStatus: [''],
      fatherHusbandName: ['', Validators.maxLength(40)],
      fMH: [''],
      occupationKin: [''],
      occupationKinSub: ['', Validators.maxLength(40)],
      rationCard: [''],
      doj: [''],
      highestQualification: [''],
      levelOfEducation: [''],
      yearOfPassing: [''],
      percentageMarks: [''],
      dob: ['', [Validators.required, minAgeValidator(18)]],
      age: [{ value: '', disabled: true }],
      ageBracket: [{ value: '', disabled: true }],
      presentAddress: ['', Validators.maxLength(256)],
      permanentAddress: ['', Validators.maxLength(256)],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(56)]],
      mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      closeRelativeName: ['', Validators.maxLength(40)],
      closeRelativeMobile: ['', [Validators.pattern(/^[0-9]{10}$/)]],

      // Demographics
      religion: [''],
      socialCategory: [''],
      socialSubcategory: [''],

      // Assets
      hasTv: [''],
      hasFridge: [''],
      hasLaptop: [''],
      hasWifi: [''],
      has2wheeler: [''],
      has4wheeler: [''],

      // Identity
      bloodGroup: [''],
      aadharNumber: ['', [Validators.pattern(/^[0-9]{12}$/)]],
      panNumber: ['', [Validators.pattern(/^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/)]],

      // Education
      sscStatus: [''],
      intermediateStatus: [''],
      bachelorsDegree: [''],
      mastersDegree: [''],
      aadhaarVerification: [''],
      panVerification: [''],
      osv: [''],
      remarks: ['', Validators.maxLength(140)],

      // Bank
      bankName: [''],
      accountNumber: ['', [Validators.pattern(/^[0-9]{9,18}$/)]],
      ifscCode: ['', [Validators.pattern(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/)]],
      branch: ['', Validators.maxLength(40)],

      // Employment
      employeeStatus: ['', Validators.required],
      processAssigned: [''],
      department: [''],
      esicNo: ['', Validators.maxLength(10)],
      aadharSeeding: [''],
      uanNo: ['', Validators.maxLength(12)],
      pfNo: ['', Validators.maxLength(22)],
      uanActivation: [''],
      languagesCanSpeak: ['', Validators.maxLength(100)],
      designation: [''],

      // Family
      fatherName: ['', Validators.maxLength(20)],
      fatherPhone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      motherName: ['', Validators.maxLength(20)],
      motherPhone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      spouseName: ['', Validators.maxLength(20)],
      spousePhone: ['', [Validators.pattern(/^[0-9]{10}$/)]],

      // Experience
      pastExperience: [''],
      organizationName: ['', Validators.maxLength(56)],
      periodOfEmployment: ['', Validators.maxLength(50)],

      // References
      ref1Name: ['', Validators.maxLength(20)],
      ref1Relationship: [''],
      ref1Address: ['', Validators.maxLength(256)],
      ref1Mobile: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      ref2Name: ['', Validators.maxLength(20)],
      ref2Relationship: [''],
      ref2Address: ['', Validators.maxLength(256)],
      ref2Mobile: ['', [Validators.pattern(/^[0-9]{10}$/)]],

      // Exit & Official
      doe: [''],
      deletionMonth: ['', [Validators.pattern(/^(0[1-9]|1[0-2])\/[0-9]{4}$/)]],
      exitType: [''],
      exitReason: ['', Validators.maxLength(256)],
      languages: [[]]
    });
  }

  private loadEmployee(id: number): void {
    this.employeeService.getEmployeeById(id).subscribe({
      next: (response) => {
        const emp = response.data;
        this.loadedEmployee = emp;
        this.employeeForm.patchValue({
          ...emp,
          doj: emp.doj ? new Date(emp.doj) : null,
          dob: emp.dob ? new Date(emp.dob) : null,
          doe: emp.doe ? new Date(emp.doe) : null
        });
        if (emp.photoPath) {
          this.existingPhotoUrl = emp.photoPath;
        }
        if (emp.age) this.employeeForm.get('age')?.setValue(emp.age);
        if (emp.ageBracket) this.employeeForm.get('ageBracket')?.setValue(emp.ageBracket);
        if (emp.languages && emp.languages.length > 0) {
          this.employeeForm.get('languages')?.setValue(emp.languages);
          this.capturedLanguages = emp.languages;
        }
        if (emp.customFields) {
          try {
            this.loadedCustomFields = typeof emp.customFields === 'string' ? JSON.parse(emp.customFields) : emp.customFields;
          } catch (e) {
            this.loadedCustomFields = {};
          }
          Object.keys(this.loadedCustomFields).forEach(key => {
            if (this.employeeForm.contains(key)) {
              this.employeeForm.get(key)?.setValue(this.loadedCustomFields[key]);
            }
          });
        }
      },
      error: () => {
        this.message.error('Error loading employee data', { nzDuration: 3000 });
        this.router.navigate(['/admin/employees']);
      }
    });
  }

  onTabChange(index: number): void {
    this.previousTabIndex = index;
    this.selectedTabIndex = index;
    this.focusFirstField();
  }

  private focusFirstField(): void {
    setTimeout(() => {
      const firstInput = document.querySelector('.ant-tabs-tabpane-active input:not([readonly]), .ant-tabs-tabpane-active nz-select, .ant-tabs-tabpane-active nz-date-picker') as HTMLElement;
      firstInput?.focus();
    }, 50);
  }

  onPhotoChange(file: File | null): void {
    this.selectedFile = file;
  }

  onLanguagesChange(languages: any[]): void {
    this.capturedLanguages = languages;
    this.employeeForm.get('languages')?.setValue(languages);
  }

  getErrorMessage(key: string, errorKey: string, errorVal: any): string {
    if (errorKey === 'required') {
      return 'is required';
    }
    if (errorKey === 'minAge') {
      return `Must be at least ${errorVal?.requiredAge || 18} years old (current age is ${errorVal?.actualAge || 'under 18'})`;
    }
    if (errorKey === 'email') {
      return 'Must be a valid email format (e.g. name@domain.com)';
    }
    if (errorKey === 'pattern') {
      if (['mobile', 'fatherPhone', 'motherPhone', 'spousePhone', 'closeRelativeMobile', 'ref1Mobile', 'ref2Mobile'].includes(key)) {
        return 'Must be a valid 10-digit mobile number';
      }
      if (key === 'aadharNumber') {
        return 'Must be a valid 12-digit Aadhaar number';
      }
      if (key === 'panNumber') {
        return 'Must be valid PAN format (e.g. ABCDE1234F)';
      }
      if (key === 'accountNumber') {
        return 'Must be valid account number (9 to 18 digits)';
      }
      if (key === 'ifscCode') {
        return 'Must be valid IFSC code (e.g. SBIN0001234)';
      }
      if (key === 'deletionMonth') {
        return 'Must be in MM/YYYY format (e.g. 05/2026)';
      }
      if (key === 'employeeCode') {
        return 'Can only contain letters and numbers';
      }
      return 'Invalid format';
    }
    if (errorKey === 'maxlength') {
      return `Cannot exceed ${errorVal?.requiredLength} characters`;
    }
    if (errorKey === 'min') {
      return `Value must be at least ${errorVal?.min}`;
    }
    if (errorKey === 'max') {
      return `Value cannot exceed ${errorVal?.max}`;
    }
    return 'Invalid value';
  }

  get validationErrorsList(): ValidationErrorDetail[] {
    const list: ValidationErrorDetail[] = [];
    Object.keys(this.employeeForm.controls).forEach(key => {
      const control = this.employeeForm.get(key);
      if (control && control.invalid && control.errors) {
        const meta = FIELD_METAS[key] || {
          label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          tabIndex: 0,
          tabName: 'Personal Info'
        };
        Object.keys(control.errors).forEach(errKey => {
          list.push({
            fieldKey: key,
            fieldLabel: meta.label,
            tabIndex: meta.tabIndex,
            tabName: meta.tabName,
            errorKey: errKey,
            errorMessage: this.getErrorMessage(key, errKey, control.errors?.[errKey])
          });
        });
      }
    });
    return list;
  }

  getTabErrorCount(tabIndex: number): number {
    return this.validationErrorsList.filter(e => e.tabIndex === tabIndex).length;
  }

  goToField(tabIndex: number, fieldKey: string): void {
    this.selectedTabIndex = tabIndex;
    setTimeout(() => {
      const control = this.employeeForm.get(fieldKey);
      if (control) {
        control.markAsTouched();
        control.markAsDirty();
      }

      // Try locating the input element
      const el = document.querySelector(`[formcontrolname="${fieldKey}"], input[name="${fieldKey}"], select[name="${fieldKey}"], nz-select[formcontrolname="${fieldKey}"]`) as HTMLElement;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('highlight-pulse');
        setTimeout(() => el.classList.remove('highlight-pulse'), 2000);
        el.focus();
      }
    }, 120);
  }

  showErrorsModal(): void {
    const errors = this.validationErrorsList;
    if (errors.length === 0) {
      this.message.success('All required fields are valid!', { nzDuration: 2500 });
      return;
    }

    const errorItemsHtml = errors.map(e => `
      <div style="display:flex; align-items:center; justify-content:space-between; padding: 8px 10px; margin-bottom: 6px; background: #fff5f5; border: 1px solid #fee2e2; border-radius: 6px;">
        <div style="display:flex; align-items:center; gap: 8px;">
          <span style="font-size:10px; font-weight:700; background:#fee2e2; color:#b91c1c; padding:2px 6px; border-radius:4px;">
            ${e.tabName}
          </span>
          <span style="font-size:12px; color:#111827;">
            <strong>${e.fieldLabel}</strong>: <span style="color:#dc2626;">${e.errorMessage}</span>
          </span>
        </div>
      </div>
    `).join('');

    this.modal.error({
      nzTitle: `⚠️ ${errors.length} Validation Error${errors.length > 1 ? 's' : ''} Need Attention`,
      nzContent: `
        <div style="max-height: 350px; overflow-y: auto; padding-right: 4px;">
          <p style="margin-bottom: 12px; color: #4b5563; font-size: 13px;">
            Please fix the following field(s) across form tabs:
          </p>
          ${errorItemsHtml}
        </div>
      `,
      nzOkText: 'Go to First Error',
      nzWidth: 560,
      nzOnOk: () => {
        if (errors.length > 0) {
          this.goToField(errors[0].tabIndex, errors[0].fieldKey);
        }
      }
    });
  }

  private collectFormErrors(): string[] {
    return this.validationErrorsList.map(e => `[${e.tabName}] ${e.fieldLabel}: ${e.errorMessage}`);
  }

  private buildEmployeeData(): Employee {
    const raw = this.employeeForm.getRawValue();
    const employee: Employee = { ...raw };

    // Format dates as ISO strings
    if (employee.doj && typeof employee.doj !== 'string') {
      employee.doj = new Date(employee.doj).toISOString().split('T')[0];
    }
    if (employee.dob && typeof employee.dob !== 'string') {
      employee.dob = new Date(employee.dob).toISOString().split('T')[0];
    }
    if (employee.doe && typeof employee.doe !== 'string') {
      employee.doe = new Date(employee.doe).toISOString().split('T')[0];
    }

    // Auto-calculate age
    if (employee.dob) {
      employee.age = calculateAge(employee.dob);
      employee.ageBracket = getAgeBracket(employee.age);
    }

    // Convert empty strings to null/undefined
    Object.keys(employee).forEach(key => {
      if ((employee as any)[key] === '') (employee as any)[key] = undefined;
    });

    if (this.capturedLanguages.length > 0) {
      employee.languages = this.capturedLanguages;
    }

    // Collect custom fields into JSON string
    const customValues: Record<string, any> = {};
    const customConfigs = (this.allFieldConfigs || []).filter(f => f.isCustom);
    customConfigs.forEach(cfg => {
      const val = this.employeeForm.get(cfg.fieldKey)?.value;
      if (val !== null && val !== undefined && val !== '') {
        customValues[cfg.fieldKey] = val;
      }
    });
    if (Object.keys(customValues).length > 0) {
      employee.customFields = JSON.stringify(customValues);
    } else {
      employee.customFields = undefined;
    }

    return employee;
  }

  validateForm(): boolean {
    this.submitAttempted = true;

    // Touch all controls to show inline field red borders and error tips
    Object.keys(this.employeeForm.controls).forEach(key => {
      const control = this.employeeForm.get(key);
      control?.markAsTouched();
      control?.markAsDirty();
      control?.updateValueAndValidity({ onlySelf: true });
    });

    this.formErrors = this.collectFormErrors();
    const errors = this.validationErrorsList;

    if (errors.length > 0) {
      // Auto-switch to the tab of the first error
      const firstError = errors[0];
      this.selectedTabIndex = firstError.tabIndex;
      setTimeout(() => {
        this.goToField(firstError.tabIndex, firstError.fieldKey);
      }, 100);

      this.notification.error(
        'Validation Errors Found',
        `Please correct ${errors.length} field(s) before saving. Click on the error banner or badges to jump directly to invalid fields.`,
        { nzDuration: 5000 }
      );
      return false;
    }
    return true;
  }

  saveDraft(): void {
    try {
      const raw = this.employeeForm.getRawValue();
      localStorage.setItem(this.DRAFT_KEY, JSON.stringify(raw));
      this.employeeForm.markAsPristine();
      this.message.success('Draft saved locally', { nzDuration: 2000 });
    } catch {
      this.message.error('Failed to save draft. Local storage may be full.', { nzDuration: 3000 });
    }
  }

  private checkForDraft(): void {
    const draft = localStorage.getItem(this.DRAFT_KEY);
    if (!draft) return;
    try {
      const data = JSON.parse(draft);
      const empCode = data.employeeCode;
      if (!empCode) { localStorage.removeItem(this.DRAFT_KEY); return; }
      this.modal.confirm({
        nzTitle: 'Draft Found',
        nzContent: `A saved draft for employee "${empCode}" was found. Would you like to restore it?`,
        nzOkText: 'Restore Draft',
        nzCancelText: 'Discard',
        nzOnOk: () => {
          Object.keys(data).forEach(key => {
            const control = this.employeeForm.get(key);
            if (control) {
              if (key === 'doj' || key === 'dob' || key === 'doe') {
                control.setValue(data[key] ? new Date(data[key]) : null);
              } else {
                control.setValue(data[key]);
              }
            }
          });
          this.updateAgeFromDob();
          this.employeeForm.markAsDirty();
          this.message.success('Draft restored', { nzDuration: 2000 });
        },
        nzOnCancel: () => localStorage.removeItem(this.DRAFT_KEY)
      });
    } catch { localStorage.removeItem(this.DRAFT_KEY); }
  }

  private clearDraft(): void {
    localStorage.removeItem(this.DRAFT_KEY);
  }

  private updateAgeFromDob(): void {
    const dob = this.employeeForm.get('dob')?.value;
    if (dob) {
      const age = calculateAge(dob);
      this.employeeForm.get('age')?.setValue(age);
      this.employeeForm.get('ageBracket')?.setValue(getAgeBracket(age));
    }
  }

  saveAndNew(): void {
    if (!this.validateForm()) {
      return;
    }

    const employee = this.buildEmployeeData();
    this.isSaving = true;

    const action = this.isEditMode
      ? this.employeeService.updateEmployee(this.employeeId!, employee, this.selectedFile || undefined)
      : this.employeeService.createEmployee(employee, this.selectedFile || undefined);

    action.subscribe({
      next: (response) => {
        this.isSaving = false;
        this.submitAttempted = false;
        this.clearDraft();
        this.message.success(response.message || 'Employee saved successfully', { nzDuration: 3000 });
        this.employeeForm.reset();
        this.employeeForm.get('employeeCode')?.enable();
        this.selectedFile = null;
        this.existingPhotoUrl = '';
        this.employeeForm.markAsPristine();
        this.isEditMode = false;
        this.employeeId = null;
        this.selectedTabIndex = 0;
      },
      error: (err) => {
        this.isSaving = false;
        this.handleBackendError(err);
      }
    });
  }

  saveAndClose(): void {
    if (!this.validateForm()) {
      return;
    }

    const employee = this.buildEmployeeData();
    this.isSaving = true;

    const action = this.isEditMode
      ? this.employeeService.updateEmployee(this.employeeId!, employee, this.selectedFile || undefined)
      : this.employeeService.createEmployee(employee, this.selectedFile || undefined);

    action.subscribe({
      next: (response) => {
        this.isSaving = false;
        this.submitAttempted = false;
        this.clearDraft();
        this.message.success(response.message || 'Employee saved successfully', { nzDuration: 3000 });
        this.router.navigate(['/admin/employees']);
      },
      error: (err) => {
        this.isSaving = false;
        this.handleBackendError(err);
      }
    });
  }

  private handleBackendError(err: any): void {
    let errorTitle = 'Save Failed';
    let errorMessage = 'An error occurred while saving employee record.';
    let fieldErrorsHtml = '';

    if (err?.error) {
      if (typeof err.error === 'string') {
        errorMessage = err.error;
      } else if (err.error.message) {
        errorMessage = err.error.message;
      }

      if (err.error.data && typeof err.error.data === 'object') {
        const entries = Object.entries(err.error.data);
        if (entries.length > 0) {
          fieldErrorsHtml = '<ul style="padding-left: 20px; margin-top: 8px;">' +
            entries.map(([f, msg]) => `<li><strong>${f}</strong>: ${msg}</li>`).join('') +
            '</ul>';
        }
      }
    } else if (err?.message) {
      errorMessage = err.message;
    }

    this.modal.error({
      nzTitle: `❌ ${errorTitle}`,
      nzContent: `<div><p style="margin-bottom:6px; color:#b91c1c; font-weight:500;">${errorMessage}</p>${fieldErrorsHtml}</div>`,
      nzOkText: 'Understood'
    });
  }

  getCustomFieldsForTab(tabName: string): FormFieldConfig[] {
    return this.allFieldConfigs.filter(f => f.isCustom && f.tabName === tabName && f.isVisible);
  }

  loadFieldConfigurations(): void {
    this.formFieldConfigService.getVisibleConfigs().subscribe({
      next: (configs) => {
        this.allFieldConfigs = configs;
        this.applyFieldConfigurations(configs);
      },
      error: (err) => {
        console.warn('Could not load field configs, using defaults', err);
      }
    });
  }

  applyFieldConfigurations(configs: FormFieldConfig[]): void {
    const map: Record<string, boolean> = {};
    configs.forEach(cfg => {
      map[cfg.fieldKey] = cfg.isMandatory;

      // Add custom field control if not present
      if (cfg.isCustom && !this.employeeForm.contains(cfg.fieldKey)) {
        const initialVal = this.loadedCustomFields[cfg.fieldKey] !== undefined ? this.loadedCustomFields[cfg.fieldKey] : '';
        this.employeeForm.addControl(cfg.fieldKey, this.fb.control(initialVal, cfg.isMandatory ? [Validators.required] : []));
      } else if (cfg.isCustom && this.loadedCustomFields[cfg.fieldKey] !== undefined) {
        this.employeeForm.get(cfg.fieldKey)?.setValue(this.loadedCustomFields[cfg.fieldKey]);
      }

      // Dynamically update validators for control
      const control = this.employeeForm.get(cfg.fieldKey);
      if (control) {
        if (cfg.isMandatory) {
          control.addValidators(Validators.required);
        } else {
          control.removeValidators(Validators.required);
        }
        control.updateValueAndValidity({ emitEvent: false });
      }
    });
    this.mandatoryMap = map;
    this.formErrors = this.collectFormErrors();
  }

}
