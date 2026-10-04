import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { HttpClient } from '@angular/common/http';
import { PendingRegistrationService } from '../../core/services/pending-registration.service';
import { FormFieldConfigService, FormFieldConfig } from '../../core/services/form-field-config.service';
import { environment } from '../../../environments/environment';
import { ImageCropModalComponent, CropResult } from '../../shared/components/image-crop-modal/image-crop-modal.component';
import { DOCUMENT_CATEGORIES } from '../../core/models/employee-document.model';

@Component({
  selector: 'app-public-registration',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    NzButtonModule, NzFormModule, NzInputModule, NzSelectModule,
    NzDatePickerModule, NzUploadModule, NzIconModule, NzSpinModule, NzCardModule, NzDividerModule,
    NzTableModule, NzCheckboxModule, NzModalModule, NzTagModule, NzToolTipModule,
    NzProgressModule, NzInputNumberModule, ImageCropModalComponent
  ],
  template: `
    <div class="reg-page">
      <div class="reg-container">
        <div class="reg-header">
          <div class="reg-logo">
            <i nz-icon nzType="user-add" style="font-size:32px;color:#fff;background:#1f3d6e;padding:12px;border-radius:50%;"></i>
          </div>
          <h1>New Joinee Registration</h1>
          <p>Fill in your details to register. HR will review and complete your profile.</p>
        </div>

        <div class="reg-card">
          <div *ngIf="submitted" class="success-section">
            <i nz-icon nzType="check-circle" style="font-size:64px;color:#52c41a;"></i>
            <h2>Registration Submitted!</h2>
            <p>Your registration code: <strong>{{ registrationCode }}</strong></p>
            <p>HR will review your application and get back to you.</p>
            <button nz-button nzType="primary" routerLink="/auth/login">Go to Login</button>
          </div>

          <form *ngIf="!submitted && !loading" #regForm="ngForm" (ngSubmit)="onSubmit(regForm)" class="reg-form" novalidate>
            <!-- Personal Information -->
            <h3 class="section-title">Personal Information</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Prefix</label>
                <nz-select [(ngModel)]="formData.prefix" name="prefix" nzPlaceHolder="Select prefix" style="width:100%">
                  <nz-option *ngFor="let opt of prefixes" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group" [class.has-error]="(firstNameCtrl.invalid || !formData.firstName) && (firstNameCtrl.touched || submitAttempted)">
                <label>First Name <span class="required" *ngIf="isMandatory('firstName', true)">*</span></label>
                <input nz-input [(ngModel)]="formData.firstName" name="firstName" required placeholder="Enter first name"
                  #firstNameCtrl="ngModel" [class.input-error]="(firstNameCtrl.invalid || !formData.firstName) && (firstNameCtrl.touched || submitAttempted)" />
                <div class="field-error" *ngIf="(firstNameCtrl.invalid || !formData.firstName) && (firstNameCtrl.touched || submitAttempted)">
                  <i nz-icon nzType="close-circle"></i> First name is required
                </div>
              </div>
              <div class="form-group">
                <label>Middle Name</label>
                <input nz-input [(ngModel)]="formData.middleName" name="middleName" placeholder="Enter middle name" />
              </div>
              <div class="form-group" [class.has-error]="(surnameCtrl.invalid || !formData.surname) && (surnameCtrl.touched || submitAttempted)">
                <label>Surname <span class="required" *ngIf="isMandatory('surname', true)">*</span></label>
                <input nz-input [(ngModel)]="formData.surname" name="surname" required placeholder="Enter surname"
                  #surnameCtrl="ngModel" [class.input-error]="(surnameCtrl.invalid || !formData.surname) && (surnameCtrl.touched || submitAttempted)" />
                <div class="field-error" *ngIf="(surnameCtrl.invalid || !formData.surname) && (surnameCtrl.touched || submitAttempted)">
                  <i nz-icon nzType="close-circle"></i> Surname is required
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group" [class.has-error]="!formData.gender && (genderCtrl.touched || submitAttempted)">
                <label>Gender <span class="required" *ngIf="isMandatory('gender', true)">*</span></label>
                <nz-select [(ngModel)]="formData.gender" name="gender" required nzPlaceHolder="Select gender" style="width:100%"
                  #genderCtrl="ngModel" [class.input-error]="!formData.gender && (genderCtrl.touched || submitAttempted)">
                  <nz-option *ngFor="let g of genders" [nzValue]="g.code" [nzLabel]="g.value"></nz-option>
                </nz-select>
                <div class="field-error" *ngIf="!formData.gender && (genderCtrl.touched || submitAttempted)">
                  <i nz-icon nzType="close-circle"></i> Gender is required
                </div>
              </div>
              <div class="form-group" [class.has-error]="!formData.dob && (dobCtrl.touched || submitAttempted)">
                <label>Date of Birth <span class="required" *ngIf="isMandatory('dob', true)">*</span></label>
                <input nz-input type="date" [(ngModel)]="formData.dob" name="dob" required
                  #dobCtrl="ngModel" [class.input-error]="!formData.dob && (dobCtrl.touched || submitAttempted)" />
                <div class="field-error" *ngIf="!formData.dob && (dobCtrl.touched || submitAttempted)">
                  <i nz-icon nzType="close-circle"></i> Date of birth is required
                </div>
              </div>
              <div class="form-group">
                <label>Marital Status</label>
                <nz-select [(ngModel)]="formData.maritalStatus" name="maritalStatus" nzPlaceHolder="Select marital status" style="width:100%">
                  <nz-option *ngFor="let opt of maritalStatuses" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group" [class.has-error]="(mobileCtrl.invalid || !formData.mobile) && (mobileCtrl.touched || submitAttempted)">
                <label>Mobile <span class="required">*</span></label>
                <input nz-input [(ngModel)]="formData.mobile" name="mobile" required placeholder="Enter 10-digit mobile" maxlength="10" pattern="^[0-9]{10}$"
                  #mobileCtrl="ngModel" [class.input-error]="(mobileCtrl.invalid || !formData.mobile) && (mobileCtrl.touched || submitAttempted)" />
                <div class="field-error" *ngIf="(!formData.mobile || mobileCtrl.errors?.['required']) && (mobileCtrl.touched || submitAttempted)">
                  <i nz-icon nzType="close-circle"></i> Mobile number is required
                </div>
                <div class="field-error" *ngIf="formData.mobile && mobileCtrl.errors?.['pattern'] && (mobileCtrl.touched || submitAttempted)">
                  <i nz-icon nzType="close-circle"></i> Enter a valid 10-digit mobile number
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group" [class.has-error]="(emailCtrl.invalid || !formData.email) && (emailCtrl.touched || submitAttempted)" style="grid-column: span 2;">
                <label>Email <span class="required">*</span></label>
                <input nz-input [(ngModel)]="formData.email" name="email" required email placeholder="Enter email address"
                  #emailCtrl="ngModel" [class.input-error]="(emailCtrl.invalid || !formData.email) && (emailCtrl.touched || submitAttempted)" />
                <div class="field-error" *ngIf="(!formData.email || emailCtrl.errors?.['required']) && (emailCtrl.touched || submitAttempted)">
                  <i nz-icon nzType="close-circle"></i> Email address is required
                </div>
                <div class="field-error" *ngIf="formData.email && emailCtrl.errors?.['email'] && (emailCtrl.touched || submitAttempted)">
                  <i nz-icon nzType="close-circle"></i> Enter a valid email address (e.g. name&#64;domain.com)
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group full-width">
                <label>Present Address</label>
                <textarea nz-input [(ngModel)]="formData.presentAddress" name="presentAddress" rows="2" placeholder="Enter your present address"></textarea>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group full-width">
                <label>Permanent Address</label>
                <textarea nz-input [(ngModel)]="formData.permanentAddress" name="permanentAddress" rows="2" placeholder="Enter your permanent address"></textarea>
              </div>
            </div>

            <nz-divider></nz-divider>

            <!-- Identity & Demographics -->
            <h3 class="section-title">Identity & Demographics</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Aadhar Number</label>
                <input nz-input [(ngModel)]="formData.aadharNumber" name="aadharNumber" placeholder="12-digit Aadhar number" maxlength="14" />
              </div>
              <div class="form-group">
                <label>PAN Number</label>
                <input nz-input [(ngModel)]="formData.panNumber" name="panNumber" placeholder="PAN number" maxlength="10" style="text-transform:uppercase" />
              </div>
              <div class="form-group">
                <label>Blood Group</label>
                <nz-select [(ngModel)]="formData.bloodGroup" name="bloodGroup" nzPlaceHolder="Select blood group" style="width:100%">
                  <nz-option *ngFor="let opt of bloodGroups" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group">
                <label>Religion</label>
                <nz-select [(ngModel)]="formData.religion" name="religion" nzPlaceHolder="Select religion" style="width:100%">
                  <nz-option *ngFor="let opt of religions" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Social Category</label>
                <nz-select [(ngModel)]="formData.socialCategory" name="socialCategory" nzPlaceHolder="Select category" style="width:100%">
                  <nz-option *ngFor="let opt of socialCategories" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group">
                <label>Social Subcategory</label>
                <nz-select [(ngModel)]="formData.socialSubcategory" name="socialSubcategory" nzPlaceHolder="Select subcategory" style="width:100%">
                  <nz-option *ngFor="let opt of socialSubcategories" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group">
                <label>Ration Card</label>
                <nz-select [(ngModel)]="formData.rationCard" name="rationCard" nzPlaceHolder="Select" style="width:100%">
                  <nz-option nzValue="YES" nzLabel="Yes"></nz-option>
                  <nz-option nzValue="NO" nzLabel="No"></nz-option>
                </nz-select>
              </div>
            </div>

            <nz-divider></nz-divider>

            <!-- Employment & Education -->
            <h3 class="section-title">Employment & Education</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Date of Joining</label>
                <input nz-input type="date" [(ngModel)]="formData.doj" name="doj" />
              </div>
              <div class="form-group">
                <label>Highest Qualification</label>
                <nz-select [(ngModel)]="formData.highestQualification" name="highestQualification" nzPlaceHolder="Select qualification" style="width:100%">
                  <nz-option *ngFor="let q of qualifications" [nzValue]="q.code" [nzLabel]="q.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group">
                <label>Level of Education</label>
                <nz-select [(ngModel)]="formData.levelOfEducation" name="levelOfEducation" nzPlaceHolder="Select level" style="width:100%">
                  <nz-option *ngFor="let q of qualifications" [nzValue]="q.code" [nzLabel]="q.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group">
                <label>Designation</label>
                <nz-select [(ngModel)]="formData.designation" name="designation" nzPlaceHolder="Select designation" style="width:100%">
                  <nz-option *ngFor="let d of designations" [nzValue]="d.code" [nzLabel]="d.value"></nz-option>
                </nz-select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Year of Passing</label>
                <input nz-input [(ngModel)]="formData.yearOfPassing" name="yearOfPassing" placeholder="e.g. 2015" maxlength="4" />
              </div>
              <div class="form-group">
                <label>% of Marks</label>
                <input nz-input [(ngModel)]="formData.percentageMarks" name="percentageMarks" placeholder="e.g. 75" />
              </div>
            </div>

            <nz-divider></nz-divider>

            <!-- Family & Kin -->
            <h3 class="section-title">Family & Kin</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Father/Husband Name</label>
                <input nz-input [(ngModel)]="formData.fatherHusbandName" name="fatherHusbandName" placeholder="Father or husband name" />
              </div>
              <div class="form-group">
                <label>F/M/H</label>
                <nz-select [(ngModel)]="formData.fMH" name="fMH" nzPlaceHolder="Select" style="width:100%">
                  <nz-option *ngFor="let opt of fMhOptions" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group">
                <label>Occupation of Kin</label>
                <nz-select [(ngModel)]="formData.occupationKin" name="occupationKin" nzPlaceHolder="Select occupation" style="width:100%">
                  <nz-option *ngFor="let opt of occupationKins" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group">
                <label>Occupation Sub</label>
                <nz-select [(ngModel)]="formData.occupationKinSub" name="occupationKinSub" nzPlaceHolder="Select sub" style="width:100%">
                  <nz-option *ngFor="let opt of occupationSubs" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Close Relative Name</label>
                <input nz-input [(ngModel)]="formData.closeRelativeName" name="closeRelativeName" placeholder="Close relative name" />
              </div>
              <div class="form-group">
                <label>Close Relative Mobile</label>
                <input nz-input [(ngModel)]="formData.closeRelativeMobile" name="closeRelativeMobile" placeholder="Mobile number" maxlength="10" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Father Name</label>
                <input nz-input [(ngModel)]="formData.fatherName" name="fatherName" placeholder="Father's name" />
              </div>
              <div class="form-group">
                <label>Father Phone</label>
                <input nz-input [(ngModel)]="formData.fatherPhone" name="fatherPhone" placeholder="Phone" maxlength="10" />
              </div>
              <div class="form-group">
                <label>Mother Name</label>
                <input nz-input [(ngModel)]="formData.motherName" name="motherName" placeholder="Mother's name" />
              </div>
              <div class="form-group">
                <label>Mother Phone</label>
                <input nz-input [(ngModel)]="formData.motherPhone" name="motherPhone" placeholder="Phone" maxlength="10" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Spouse Name</label>
                <input nz-input [(ngModel)]="formData.spouseName" name="spouseName" placeholder="Spouse name" />
              </div>
              <div class="form-group">
                <label>Spouse Phone</label>
                <input nz-input [(ngModel)]="formData.spousePhone" name="spousePhone" placeholder="Phone" maxlength="10" />
              </div>
            </div>

            <nz-divider></nz-divider>

            <!-- Household Assets -->
            <h3 class="section-title">Household Assets</h3>
            <div class="form-row">
              <div class="form-group">
                <label>TV</label>
                <nz-select [(ngModel)]="formData.hasTv" name="hasTv" nzPlaceHolder="Select" style="width:100%">
                  <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group">
                <label>Fridge</label>
                <nz-select [(ngModel)]="formData.hasFridge" name="hasFridge" nzPlaceHolder="Select" style="width:100%">
                  <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group">
                <label>Laptop</label>
                <nz-select [(ngModel)]="formData.hasLaptop" name="hasLaptop" nzPlaceHolder="Select" style="width:100%">
                  <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group">
                <label>WiFi</label>
                <nz-select [(ngModel)]="formData.hasWifi" name="hasWifi" nzPlaceHolder="Select" style="width:100%">
                  <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>2 Wheeler</label>
                <nz-select [(ngModel)]="formData.has2wheeler" name="has2wheeler" nzPlaceHolder="Select" style="width:100%">
                  <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group">
                <label>4 Wheeler</label>
                <nz-select [(ngModel)]="formData.has4wheeler" name="has4wheeler" nzPlaceHolder="Select" style="width:100%">
                  <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
            </div>

            <nz-divider></nz-divider>

            <!-- Education Verification -->
            <h3 class="section-title">Education Verification</h3>
            <div class="form-row">
              <div class="form-group">
                <label>SSC / 10th Status</label>
                <nz-select [(ngModel)]="formData.sscStatus" name="sscStatus" nzPlaceHolder="Select" style="width:100%">
                  <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group">
                <label>Intermediate / 12th Status</label>
                <nz-select [(ngModel)]="formData.intermediateStatus" name="intermediateStatus" nzPlaceHolder="Select" style="width:100%">
                  <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group">
                <label>Bachelor Degree</label>
                <nz-select [(ngModel)]="formData.bachelorsDegree" name="bachelorsDegree" nzPlaceHolder="Select" style="width:100%">
                  <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group">
                <label>Master Degree</label>
                <nz-select [(ngModel)]="formData.mastersDegree" name="mastersDegree" nzPlaceHolder="Select" style="width:100%">
                  <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Aadhaar Verification</label>
                <nz-select [(ngModel)]="formData.aadhaarVerification" name="aadhaarVerification" nzPlaceHolder="Select" style="width:100%">
                  <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group">
                <label>PAN Verification</label>
                <nz-select [(ngModel)]="formData.panVerification" name="panVerification" nzPlaceHolder="Select" style="width:100%">
                  <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group">
                <label>OSV</label>
                <nz-select [(ngModel)]="formData.osv" name="osv" nzPlaceHolder="Select" style="width:100%">
                  <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group full-width">
                <label>Remarks</label>
                <textarea nz-input [(ngModel)]="formData.remarks" name="remarks" rows="2" placeholder="Any remarks"></textarea>
              </div>
            </div>

            <nz-divider></nz-divider>

            <!-- Bank Details -->
            <h3 class="section-title">Bank Details</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Bank Name</label>
                <nz-select [(ngModel)]="formData.bankName" name="bankName" nzPlaceHolder="Select bank" style="width:100%">
                  <nz-option *ngFor="let b of banks" [nzValue]="b.code" [nzLabel]="b.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group">
                <label>Account Number</label>
                <input nz-input [(ngModel)]="formData.accountNumber" name="accountNumber" placeholder="Account number" />
              </div>
              <div class="form-group">
                <label>IFSC Code</label>
                <input nz-input [(ngModel)]="formData.ifscCode" name="ifscCode" placeholder="IFSC code" maxlength="11" style="text-transform:uppercase" />
              </div>
              <div class="form-group">
                <label>Branch</label>
                <input nz-input [(ngModel)]="formData.branch" name="branch" placeholder="Branch name" />
              </div>
            </div>

            <nz-divider></nz-divider>

            <!-- Languages -->
            <h3 class="section-title">Languages</h3>
            <div class="lang-section">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                <nz-select [ngModel]="selectedLanguage" (ngModelChange)="selectedLanguage = $event" [ngModelOptions]="{standalone: true}" nzPlaceHolder="Select language" style="width:240px">
                  <nz-option *ngFor="let opt of availableLanguageOptions" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
                <button nz-button nzType="primary" nzSize="small" (click)="addLanguage()" [disabled]="!selectedLanguage">
                  <i nz-icon nzType="plus"></i> Add
                </button>
              </div>
              <nz-table *ngIf="languages.length > 0" [nzData]="languages" nzSize="small" nzFrontPagination="false" nzHideOnSinglePage="true">
                <thead>
                  <tr>
                    <th>Language</th>
                    <th style="text-align:center;width:60px">Read</th>
                    <th style="text-align:center;width:60px">Write</th>
                    <th style="text-align:center;width:60px">Speak</th>
                    <th style="text-align:center;width:40px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let lang of languages; let i = index">
                    <td>{{ lang.language }}</td>
                    <td style="text-align:center"><label nz-checkbox [ngModel]="lang.canRead" (ngModelChange)="lang.canRead = $event" [ngModelOptions]="{standalone: true}"></label></td>
                    <td style="text-align:center"><label nz-checkbox [ngModel]="lang.canWrite" (ngModelChange)="lang.canWrite = $event" [ngModelOptions]="{standalone: true}"></label></td>
                    <td style="text-align:center"><label nz-checkbox [ngModel]="lang.canSpeak" (ngModelChange)="lang.canSpeak = $event" [ngModelOptions]="{standalone: true}"></label></td>
                    <td style="text-align:center"><button nz-button nzType="text" nzDanger (click)="removeLanguage(i)"><i nz-icon nzType="delete"></i></button></td>
                  </tr>
                </tbody>
              </nz-table>
            </div>

            <nz-divider></nz-divider>

            <!-- Experience & References -->
            <h3 class="section-title">Past Experience</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Past Experience</label>
                <nz-select [(ngModel)]="formData.pastExperience" name="pastExperience" nzPlaceHolder="Select" style="width:100%">
                  <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group">
                <label>Organization Name</label>
                <input nz-input [(ngModel)]="formData.organizationName" name="organizationName" placeholder="Previous organization" />
              </div>
              <div class="form-group">
                <label>Employment Period</label>
                <input nz-input [(ngModel)]="formData.periodOfEmployment" name="periodOfEmployment" placeholder="e.g. 2019-2023" />
              </div>
            </div>
            <h3 class="section-title" style="margin-top:16px;">Reference 1</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Name</label>
                <input nz-input [(ngModel)]="formData.ref1Name" name="ref1Name" placeholder="Reference name" />
              </div>
              <div class="form-group">
                <label>Relationship</label>
                <nz-select [(ngModel)]="formData.ref1Relationship" name="ref1Relationship" nzPlaceHolder="Select" style="width:100%">
                  <nz-option *ngFor="let opt of relationships" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group">
                <label>Mobile</label>
                <input nz-input [(ngModel)]="formData.ref1Mobile" name="ref1Mobile" placeholder="Phone" maxlength="10" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group full-width">
                <label>Address</label>
                <textarea nz-input [(ngModel)]="formData.ref1Address" name="ref1Address" rows="2" placeholder="Reference address"></textarea>
              </div>
            </div>
            <h3 class="section-title" style="margin-top:16px;">Reference 2</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Name</label>
                <input nz-input [(ngModel)]="formData.ref2Name" name="ref2Name" placeholder="Reference name" />
              </div>
              <div class="form-group">
                <label>Relationship</label>
                <nz-select [(ngModel)]="formData.ref2Relationship" name="ref2Relationship" nzPlaceHolder="Select" style="width:100%">
                  <nz-option *ngFor="let opt of relationships" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group">
                <label>Mobile</label>
                <input nz-input [(ngModel)]="formData.ref2Mobile" name="ref2Mobile" placeholder="Phone" maxlength="10" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group full-width">
                <label>Address</label>
                <textarea nz-input [(ngModel)]="formData.ref2Address" name="ref2Address" rows="2" placeholder="Reference address"></textarea>
              </div>
            </div>

            <nz-divider></nz-divider>

            
            <!-- Additional / Custom Fields Section -->
            <div *ngIf="customFields.length > 0">
              <nz-divider></nz-divider>
              <h3 class="section-title"><i nz-icon nzType="appstore-add" style="margin-right:6px;"></i> Additional Information</h3>
              <div class="form-row">
                <ng-container *ngFor="let field of customFields">
                  <!-- Text Input -->
                  <div class="form-group" *ngIf="field.fieldType === 'TEXT'" [class.has-error]="isMandatory(field.fieldKey) && !formData.customFieldsMap[field.fieldKey] && submitAttempted">
                    <label>{{ field.fieldLabel }} <span class="required" *ngIf="isMandatory(field.fieldKey)">*</span></label>
                    <input nz-input [(ngModel)]="formData.customFieldsMap[field.fieldKey]" [name]="field.fieldKey" [placeholder]="field.placeholder || 'Enter ' + field.fieldLabel" />
                    <div class="field-error" *ngIf="isMandatory(field.fieldKey) && !formData.customFieldsMap[field.fieldKey] && submitAttempted">
                      <i nz-icon nzType="close-circle"></i> {{ field.fieldLabel }} is required
                    </div>
                  </div>

                  <!-- Number Input -->
                  <div class="form-group" *ngIf="field.fieldType === 'NUMBER'" [class.has-error]="isMandatory(field.fieldKey) && !formData.customFieldsMap[field.fieldKey] && submitAttempted">
                    <label>{{ field.fieldLabel }} <span class="required" *ngIf="isMandatory(field.fieldKey)">*</span></label>
                    <input nz-input type="number" [(ngModel)]="formData.customFieldsMap[field.fieldKey]" [name]="field.fieldKey" [placeholder]="field.placeholder || 'Enter ' + field.fieldLabel" />
                    <div class="field-error" *ngIf="isMandatory(field.fieldKey) && !formData.customFieldsMap[field.fieldKey] && submitAttempted">
                      <i nz-icon nzType="close-circle"></i> {{ field.fieldLabel }} is required
                    </div>
                  </div>

                  <!-- Date Picker -->
                  <div class="form-group" *ngIf="field.fieldType === 'DATE'" [class.has-error]="isMandatory(field.fieldKey) && !formData.customFieldsMap[field.fieldKey] && submitAttempted">
                    <label>{{ field.fieldLabel }} <span class="required" *ngIf="isMandatory(field.fieldKey)">*</span></label>
                    <input nz-input type="date" [(ngModel)]="formData.customFieldsMap[field.fieldKey]" [name]="field.fieldKey" />
                    <div class="field-error" *ngIf="isMandatory(field.fieldKey) && !formData.customFieldsMap[field.fieldKey] && submitAttempted">
                      <i nz-icon nzType="close-circle"></i> {{ field.fieldLabel }} is required
                    </div>
                  </div>

                  <!-- Dropdown / Select -->
                  <div class="form-group" *ngIf="field.fieldType === 'SELECT'" [class.has-error]="isMandatory(field.fieldKey) && !formData.customFieldsMap[field.fieldKey] && submitAttempted">
                    <label>{{ field.fieldLabel }} <span class="required" *ngIf="isMandatory(field.fieldKey)">*</span></label>
                    <nz-select [(ngModel)]="formData.customFieldsMap[field.fieldKey]" [name]="field.fieldKey" [nzPlaceHolder]="field.placeholder || 'Select ' + field.fieldLabel" style="width:100%" nzAllowClear>
                      <nz-option *ngFor="let opt of getCustomFieldOptions(field)" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
                    </nz-select>
                    <div class="field-error" *ngIf="isMandatory(field.fieldKey) && !formData.customFieldsMap[field.fieldKey] && submitAttempted">
                      <i nz-icon nzType="close-circle"></i> {{ field.fieldLabel }} is required
                    </div>
                  </div>

                  <!-- Textarea -->
                  <div class="form-group full-width" *ngIf="field.fieldType === 'TEXTAREA'" [class.has-error]="isMandatory(field.fieldKey) && !formData.customFieldsMap[field.fieldKey] && submitAttempted">
                    <label>{{ field.fieldLabel }} <span class="required" *ngIf="isMandatory(field.fieldKey)">*</span></label>
                    <textarea nz-input [(ngModel)]="formData.customFieldsMap[field.fieldKey]" [name]="field.fieldKey" rows="2" [placeholder]="field.placeholder || 'Enter ' + field.fieldLabel"></textarea>
                    <div class="field-error" *ngIf="isMandatory(field.fieldKey) && !formData.customFieldsMap[field.fieldKey] && submitAttempted">
                      <i nz-icon nzType="close-circle"></i> {{ field.fieldLabel }} is required
                    </div>
                  </div>

                  <!-- Checkbox / Boolean -->
                  <div class="form-group" *ngIf="field.fieldType === 'BOOLEAN'">
                    <label>{{ field.fieldLabel }}</label>
                    <label nz-checkbox [(ngModel)]="formData.customFieldsMap[field.fieldKey]" [name]="field.fieldKey">
                      <span>{{ field.placeholder || 'Yes / Active' }}</span>
                    </label>
                  </div>
                </ng-container>
              </div>
            </div>

            <!-- Documents Section (Aligned with Document Hub Flow) -->
            <div class="reg-doc-section">
              <div class="reg-doc-header">
                <div>
                  <h3 class="section-title" style="margin-bottom:2px;"><i nz-icon nzType="folder-open" style="color:#2563eb;margin-right:6px;"></i> Upload Documents &amp; Certificates</h3>
                  <p class="section-desc">Uploaded documents will be directly verified and synced to your official Document Hub repository upon approval.</p>
                </div>
              </div>

              <!-- 1. Mandatory Candidate Photo & Unified Document Segregation Hub Row -->
              <div class="docs-primary-row">
                <!-- Candidate Photo Card -->
                <div class="doc-photo-box" [class.has-error]="submitAttempted && !selectedPhoto" [class.box-uploaded]="!!selectedPhoto">
                  <div class="photo-box-header">
                    <span class="doc-box-badge badge-photo">
                      <i nz-icon nzType="camera"></i> Candidate Photo <span class="required">*</span>
                    </span>
                    <span *ngIf="selectedPhoto" class="doc-status-ok"><i nz-icon nzType="check-circle" nzTheme="fill"></i> Ready</span>
                  </div>
                  <div class="photo-box-body">
                    <div class="photo-circle-wrap" (click)="photoInput.click()" nz-tooltip="Click to Upload Photo">
                      <img *ngIf="photoPreviewUrl" [src]="photoPreviewUrl" alt="Photo" class="avatar-img" />
                      <div *ngIf="!photoPreviewUrl" class="avatar-placeholder">
                        <i nz-icon nzType="user"></i>
                        <span>Upload</span>
                      </div>
                    </div>
                    <div class="photo-actions-wrap">
                      <input #photoInput type="file" accept="image/jpeg,image/png,image/webp" style="display:none" (change)="onFileChange($event, 'photo')" />
                      <button nz-button nzType="default" nzSize="small" type="button" class="btn-crop-photo" (click)="photoInput.click()">
                        <i nz-icon nzType="camera"></i> {{ selectedPhoto ? 'Change Photo' : 'Upload & Crop' }}
                      </button>
                      <span class="photo-hint-text">Passport size (JPG/PNG)</span>
                    </div>
                  </div>
                  <div class="field-error" *ngIf="submitAttempted && !selectedPhoto">
                    <i nz-icon nzType="close-circle"></i> Candidate photo is mandatory
                  </div>
                </div>

                <!-- Unified Document Segregation Popup Action Card -->
                <div class="dh-launch-card">
                  <div class="dh-launch-card-content">
                    <div class="dh-launch-badge">
                      <i nz-icon nzType="appstore"></i> DOCUMENT HUB WORKSPACE
                    </div>
                    <h4 class="dh-launch-title">Identity &amp; Supporting Documents</h4>
                    <p class="dh-launch-desc">
                      Upload Aadhar Card, PAN Card, Degree Certificates, Marksheets, Resume &amp; Bank Passbook in one unified workspace. Supports multi-image uploads and single multi-page PDF auto-splitting.
                    </p>
                  </div>
                  <div class="dh-launch-actions">
                    <button nz-button nzType="primary" nzSize="large" type="button" class="btn-open-segregation-main" (click)="openSegregationModal('images')">
                      <i nz-icon nzType="cloud-upload"></i> Upload &amp; Segregate Documents
                    </button>
                  </div>
                </div>
              </div>

              <!-- 2. Staged Documents Summary Grid (Only displayed after documents are added from popup) -->
              <div class="dh-workspace-card" *ngIf="additionalUploadedDocs.length > 0">
                <div class="dh-staged-form-summary">
                  <div class="summary-bar-header">
                    <div class="summary-count-badge">
                      <i nz-icon nzType="check-circle" style="color:#10b981;"></i>
                      <strong>{{ additionalUploadedDocs.length }}</strong> Document(s) Attached &amp; Segregated
                    </div>
                    <button nz-button nzType="primary" nzGhost nzSize="small" type="button" class="link-edit-popup" (click)="openSegregationModal(uploadMode)">
                      <i nz-icon nzType="edit"></i> Manage in Popup
                    </button>
                  </div>

                  <div class="summary-cards-grid">
                    <div *ngFor="let doc of additionalUploadedDocs; let i = index" class="summary-card-item">
                      <div class="summary-thumb-col" (click)="openPreviewModal(doc)" nz-tooltip="Click to View Full-Size">
                        <div class="summary-thumb-box">
                          <img *ngIf="doc.isImage && doc.previewUrl" [src]="doc.previewUrl" alt="Thumb" class="summary-thumb-img" />
                          <div *ngIf="doc.isPdf" class="summary-thumb-pdf">
                            <i nz-icon nzType="file-pdf"></i>
                            <span class="pdf-pg-label" *ngIf="doc.pageNumber">P.{{ doc.pageNumber }}</span>
                          </div>
                          <div *ngIf="!doc.isImage && !doc.isPdf" class="summary-thumb-generic">
                            <i nz-icon nzType="file-text"></i>
                          </div>
                        </div>
                      </div>
                      <div class="summary-info-col">
                        <div class="summary-cat-pill">
                          <nz-tag [nzColor]="getCategoryBadge(doc.documentType).color">{{ getCategoryBadge(doc.documentType).label }}</nz-tag>
                          <span class="summary-file-size">{{ formatBytes(doc.file?.size || doc.fileSize) }}</span>
                        </div>
                        <div class="summary-title-text" [title]="doc.documentTitle || doc.file?.name">
                          {{ doc.documentTitle || doc.file?.name }}
                        </div>
                        <div class="summary-file-sub" [title]="doc.file?.name">
                          <i nz-icon nzType="paper-clip"></i> {{ doc.file?.name }}
                        </div>
                      </div>
                      <div class="summary-actions-col">
                        <button nz-button nzType="text" nzSize="small" type="button" (click)="openPreviewModal(doc)" nz-tooltip="Preview Document">
                          <i nz-icon nzType="eye" style="color:#2563eb;"></i>
                        </button>
                        <button nz-button nzType="text" nzDanger nzSize="small" type="button" (click)="removeAdditionalDoc(i)" nz-tooltip="Remove">
                          <i nz-icon nzType="delete"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Form Actions & Clear Error Reporting -->
            <div class="form-actions">
              <!-- Clear Validation Issue Box -->
              <div class="validation-summary-box" *ngIf="submitAttempted && getValidationErrors().length > 0">
                <div class="validation-summary-title">
                  <i nz-icon nzType="exclamation-circle" nzTheme="fill"></i>
                  <span>Please complete the following {{ getValidationErrors().length }} required field(s) to submit:</span>
                </div>
                <ul class="validation-summary-list">
                  <li *ngFor="let err of getValidationErrors()">
                    <i nz-icon nzType="close-circle" style="color: #ff4d4f; margin-right: 6px;"></i> {{ err }}
                  </li>
                </ul>
              </div>

              <button nz-button nzType="primary" nzSize="large" [nzLoading]="isSaving" type="submit" class="submit-btn">
                <i nz-icon nzType="check"></i> Submit Registration
              </button>
            </div>
          </form>

          <div *ngIf="loading" class="loading-section">
            <i nz-icon nzType="loading" style="font-size:32px;"></i>
            <p>Loading form data...</p>
          </div>

        </div>

        <div class="reg-footer">
          <p>Already have an account? <a routerLink="/auth/login">Login here</a></p>
        </div>

        <!-- ========================================== -->
        <!-- DOCUMENT SEGREGATION MODAL (POPUP) -->
        <!-- ========================================== -->
        <nz-modal
          [(nzVisible)]="isSegregationModalVisible"
          nzTitle="📑 Upload &amp; Segregate Documents"
          (nzOnCancel)="isSegregationModalVisible = false"
          [nzWidth]="960"
          [nzFooter]="segregationModalFooter"
          nzWrapClassName="dh-segregation-modal">
          <ng-template nzModalContent>
            <div class="seg-modal-container">
              
              <!-- Hidden File Inputs for Modal -->
              <input #modalImageFileInput type="file" multiple accept="image/jpeg,image/png,image/webp" style="display:none" (change)="onImagesSelected($event)" />
              <input #modalPdfFileInput type="file" accept="application/pdf,.pdf" style="display:none" (change)="onPdfSelected($event)" />

              <!-- Upload Mode Switcher (Option 1 vs Option 2) -->
              <div class="modal-mode-header">
                <div class="mode-header-label">
                  <i nz-icon nzType="sliders"></i> Choose Upload Mode:
                </div>
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

              <!-- Mode 1 Dropzone: Multiple Images -->
              <div
                *ngIf="uploadMode === 'images' && stagedModalFiles.length === 0"
                class="dh-dropzone mode-images-dropzone"
                (dragover)="$event.preventDefault()"
                (drop)="onDropImages($event)"
                (click)="modalImageFileInput.click()">
                <div class="dropzone-inner">
                  <div class="dropzone-icon-circle img-circle">
                    <i nz-icon nzType="picture" class="dropzone-icon"></i>
                  </div>
                  <h3 class="dropzone-title">Click or Drag &amp; Drop Multiple Images Here</h3>
                  <p class="dropzone-subtitle">
                    Select multiple image files (<strong>JPEG, PNG, WEBP</strong>). Each image will be added as a separate staged page for category assignment.
                  </p>
                  <button nz-button nzType="primary" class="btn-browse" (click)="$event.stopPropagation(); modalImageFileInput.click()">
                    <i nz-icon nzType="folder-add"></i> Choose Image Files
                  </button>
                </div>
              </div>

              <!-- Mode 2 Dropzone: Single Combined PDF with Auto-Split -->
              <div
                *ngIf="uploadMode === 'pdf_split' && (stagedModalFiles.length === 0 || isSplittingPdf)"
                class="dh-dropzone mode-pdf-dropzone"
                (dragover)="$event.preventDefault()"
                (drop)="onDropPdf($event)"
                (click)="!isSplittingPdf && modalPdfFileInput.click()">
                <div class="dropzone-inner" *ngIf="!isSplittingPdf">
                  <div class="dropzone-icon-circle pdf-circle">
                    <i nz-icon nzType="file-pdf" class="dropzone-icon"></i>
                  </div>
                  <h3 class="dropzone-title">Click or Drag &amp; Drop Single Combined PDF File Here</h3>
                  <p class="dropzone-subtitle">
                    The system will automatically <strong>extract and split each page</strong> into separate document records for categorization.
                  </p>
                  <button nz-button nzType="primary" class="btn-browse btn-pdf-browse" (click)="$event.stopPropagation(); modalPdfFileInput.click()">
                    <i nz-icon nzType="file-pdf"></i> Choose Combined PDF File
                  </button>
                </div>

                <!-- PDF Splitting Loading Progress -->
                <div class="dropzone-inner splitting-progress" *ngIf="isSplittingPdf">
                  <nz-spin nzSimple nzTip="Extracting &amp; splitting PDF pages into individual documents..."></nz-spin>
                  <p style="margin-top: 12px; font-weight: 600; color: #1e3a8a;">Please wait while we split and generate previews for each page...</p>
                </div>
              </div>

              <!-- Staging Section inside Modal -->
              <div class="modal-staging-section" *ngIf="stagedModalFiles.length > 0">
                <div class="staging-header">
                  <div class="staging-title-wrap">
                    <h4 class="staging-title">
                      <i nz-icon nzType="appstore"></i> Staged Document Pages
                      <span class="staging-count-badge">{{ stagedModalFiles.length }} pages/files</span>
                    </h4>
                    <p class="staging-desc">
                      Assign which page is which document (e.g. <code>Aadhar Front</code>, <code>Aadhar Back</code>, <code>PAN Card</code>, <code>Degree</code>). Click thumbnail to preview full-screen.
                    </p>
                  </div>
                  <div class="staging-actions">
                    <button nz-button nzType="default" nzSize="small" (click)="uploadMode === 'images' ? modalImageFileInput.click() : modalPdfFileInput.click()">
                      <i nz-icon nzType="plus"></i> Add More
                    </button>
                    <button nz-button nzSize="small" (click)="autoNumberStagedPages()">
                      <i nz-icon nzType="ordered-list"></i> Auto-Number
                    </button>
                    <button nz-button nzSize="small" (click)="openBulkCategoryModal()">
                      <i nz-icon nzType="tag"></i> Set Category for All
                    </button>
                    <button nz-button nzSize="small" nzDanger (click)="clearStagedFiles()">
                      <i nz-icon nzType="delete"></i> Clear
                    </button>
                  </div>
                </div>

                <!-- Staged Grid Cards -->
                <div class="staged-compact-grid">
                  <div class="staged-compact-card" *ngFor="let item of stagedModalFiles; let i = index">
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
                          <nz-select [(ngModel)]="item.documentType" (ngModelChange)="onCategoryChange(item)" nzSize="small" class="w-full" nzPlaceHolder="Select Category" nzAllowClear nzShowSearch>
                            <nz-option *ngFor="let cat of documentCategories" [nzValue]="cat.code" [nzLabel]="cat.label"></nz-option>
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
                        <div class="file-name-item" [nz-tooltip]="item.file?.name">
                          <i nz-icon nzType="paper-clip"></i>
                          <span class="file-name-text">{{ item.file?.name }}</span>
                          <span class="file-size-mini">({{ formatBytes(item.fileSize || item.file?.size) }})</span>
                        </div>
                      </div>
                    </div>

                    <!-- Right: Quick Actions (Reorder & Remove) -->
                    <div class="mini-actions-col">
                      <div class="mini-reorder-group">
                        <button nz-button nzType="text" nzSize="small" [disabled]="i === 0" (click)="moveStaged(i, -1)" nz-tooltip="Move Left">
                          <i nz-icon nzType="arrow-left"></i>
                        </button>
                        <button nz-button nzType="text" nzSize="small" [disabled]="i === stagedModalFiles.length - 1" (click)="moveStaged(i, 1)" nz-tooltip="Move Right">
                          <i nz-icon nzType="arrow-right"></i>
                        </button>
                      </div>
                      <button nz-button nzType="text" nzDanger nzSize="small" class="mini-remove-btn" (click)="removeStaged(i)" nz-tooltip="Remove">
                        <i nz-icon nzType="delete"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </ng-template>

          <ng-template #segregationModalFooter>
            <div class="modal-footer-flex">
              <div class="footer-summary-left">
                <span *ngIf="stagedModalFiles.length > 0" class="footer-count-text">
                  <i nz-icon nzType="info-circle" style="color:#2563eb;"></i> Ready to apply <strong>{{ stagedModalFiles.length }}</strong> document(s) to registration form
                </span>
              </div>
              <div class="footer-btns-right">
                <button nz-button nzType="default" (click)="isSegregationModalVisible = false">Cancel</button>
                <button nz-button nzType="primary" class="btn-apply-docs" (click)="applyStagedToForm()" [disabled]="stagedModalFiles.length === 0">
                  <i nz-icon nzType="check-circle"></i> Apply Documents to Form ({{ stagedModalFiles.length }})
                </button>
              </div>
            </div>
          </ng-template>
        </nz-modal>

        <!-- ========================================== -->
        <!-- LIGHTBOX PREVIEW MODAL (IMAGE & PDF) -->
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

              <!-- Generic Preview fallback -->
              <div *ngIf="!previewIsImage && !previewIsPdf" class="preview-generic-box">
                <i nz-icon nzType="file-text" style="font-size: 48px; color: #94a3b8;"></i>
                <p style="margin-top: 12px; font-weight: 500;">Document file attached.</p>
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
              <label class="dh-field-label">Select Category to apply to all {{ stagedModalFiles.length }} staged files:</label>
              <nz-select [(ngModel)]="bulkSelectedCategory" class="w-full" nzSize="large" style="width:100%;margin-top:8px;">
                <nz-option *ngFor="let cat of documentCategories" [nzValue]="cat.code" [nzLabel]="cat.label"></nz-option>
              </nz-select>
              <p style="margin-top: 12px; font-size: 12px; color: #64748b;">
                This will update the category and auto-generate sequential names (e.g. <code>Aadhar Card Front</code>, <code>Aadhar Card Back</code>).
              </p>
            </div>
          </ng-template>
        </nz-modal>

        <!-- Image Cropper Modal for Candidate Photo -->
        <app-image-crop-modal
          [(isVisible)]="isPhotoCropModalOpen"
          [imageFile]="pendingPhotoFile"
          mode="avatar"
          modalTitle="Adjust &amp; Crop Candidate Photo"
          (confirmed)="onPhotoCropConfirmed($event)"
          (cancelled)="onPhotoCropCancelled()"
        ></app-image-crop-modal>
      </div>
    </div>
  `,
  styles: [`
    .reg-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #f0f2f5 0%, #e6f0ff 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
    }
    .reg-container {
      width: 100%;
      max-width: 1000px;
    }
    .reg-header {
      text-align: center;
      margin-bottom: 30px;
    }
    .reg-header h1 {
      font-size: 28px;
      color: #1f3d6e;
      margin: 16px 0 8px;
    }
    .reg-header p {
      color: #666;
      font-size: 14px;
    }
    .reg-logo { margin-bottom: 8px; }
    .reg-card {
      background: #fff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.08);
    }
    .reg-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #1f3d6e;
      margin: 8px 0 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #e6f0ff;
    }
    .form-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    @media (max-width: 992px) {
      .form-row { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .form-row { grid-template-columns: 1fr; }
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-group label {
      font-size: 13px;
      font-weight: 600;
      color: #333;
    }
    .form-group .required { color: #ff4d4f; }
    .full-width { grid-column: 1 / -1; }
    .file-name {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }
    .field-error {
      color: #ff4d4f;
      font-size: 12px;
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
      line-height: 1.3;
    }
    .input-error,
    .has-error input,
    .has-error .ant-select-selector {
      border-color: #ff4d4f !important;
      box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.15) !important;
    }
    .validation-summary-box {
      width: 100%;
      max-width: 650px;
      background: #fff2f0;
      border: 1px solid #ffccc7;
      border-radius: 8px;
      padding: 16px 20px;
      text-align: left;
      box-shadow: 0 2px 8px rgba(255, 77, 79, 0.08);
      animation: fadeIn 0.3s ease-in-out;
      margin-bottom: 8px;
    }
    .validation-summary-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 14px;
      color: #cf1322;
      margin-bottom: 10px;
    }
    .validation-summary-list {
      margin: 0;
      padding-left: 4px;
      list-style-type: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .validation-summary-list li {
      font-size: 13px;
      color: #a8071a;
      display: flex;
      align-items: center;
    }
    .form-actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding-top: 20px;
      border-top: 1px solid #f0f0f0;
    }
    .submit-btn {
      min-width: 240px;
      height: 44px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px;
    }
    .success-section {
      text-align: center;
      padding: 40px 0;
    }
    .success-section h2 {
      color: #1f3d6e;
      margin: 16px 0 8px;
    }
    .loading-section {
      text-align: center;
      padding: 60px 0;
      color: #666;
    }
    .reg-footer {
      text-align: center;
      margin-top: 24px;
      color: #666;
    }
    .reg-footer a { color: #1f3d6e; font-weight: 600; }
    .lang-section { padding: 8px 0; }
    nz-table { margin-top: 8px; }

    /* ── Document Hub Synced Upload Section ── */
    .reg-doc-section {
      margin-top: 10px;
      margin-bottom: 20px;
      padding: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
    }
    .reg-doc-header {
      margin-bottom: 14px;
    }
    .section-desc {
      font-size: 11.5px;
      color: #64748b;
      margin: 2px 0 0;
    }
    .docs-primary-row {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 16px;
      margin-bottom: 16px;
      align-items: stretch;
    }
    @media (max-width: 860px) {
      .docs-primary-row { grid-template-columns: 1fr; }
    }
    .doc-photo-box {
      background: #ffffff;
      border: 1px dashed #cbd5e1;
      border-radius: 10px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 10px;
      transition: all 0.2s ease;
    }
    .doc-photo-box:hover {
      border-color: #93c5fd;
      box-shadow: 0 2px 8px rgba(37,99,235,0.06);
    }
    .doc-photo-box.box-uploaded {
      border: 1px solid #86efac;
      background: #f0fdf4;
    }
    .doc-photo-box.has-error {
      border-color: #ff4d4f !important;
      background: #fff2f0;
    }
    .photo-box-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .doc-box-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .badge-photo { background: #f3e8ff; color: #7e22ce; }
    .doc-status-ok {
      font-size: 11px;
      font-weight: 600;
      color: #16a34a;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .photo-box-body {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .photo-circle-wrap {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      border: 2px solid #3b82f6;
      background: #f1f5f9;
      cursor: pointer;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .photo-circle-wrap:hover {
      transform: scale(1.05);
      box-shadow: 0 2px 8px rgba(59,130,246,0.3);
    }
    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .avatar-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: 10px;
      color: #64748b;
    }
    .avatar-placeholder i { font-size: 18px; color: #94a3b8; }
    .photo-actions-wrap {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .btn-crop-photo {
      font-size: 11.5px !important;
      font-weight: 600 !important;
      border-radius: 6px !important;
    }
    .photo-hint-text {
      font-size: 10px;
      color: #94a3b8;
    }

    /* Unified Document Hub Launch Card */
    .dh-launch-card {
      background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%);
      border: 1.5px solid #bfdbfe;
      border-radius: 10px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 2px 8px rgba(37,99,235,0.05);
      flex-wrap: wrap;
    }
    .dh-launch-card-content {
      flex: 1;
      min-width: 260px;
    }
    .dh-launch-badge {
      font-size: 9.5px;
      font-weight: 800;
      color: #2563eb;
      letter-spacing: 0.5px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #ffffff;
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid #dbeafe;
      margin-bottom: 6px;
    }
    .dh-launch-title {
      font-size: 14.5px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 4px;
    }
    .dh-launch-desc {
      font-size: 11.5px;
      color: #475569;
      margin: 0;
      line-height: 1.45;
    }
    .dh-launch-actions {
      display: flex;
      align-items: center;
    }
    .btn-open-segregation-main {
      font-size: 13.5px !important;
      font-weight: 700 !important;
      height: 42px !important;
      padding: 0 20px !important;
      border-radius: 8px !important;
      background: #2563eb !important;
      border-color: #2563eb !important;
      box-shadow: 0 3px 10px rgba(37,99,235,0.3) !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 8px !important;
      transition: all 0.2s ease !important;
    }
    .btn-open-segregation-main:hover {
      background: #1d4ed8 !important;
      border-color: #1d4ed8 !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(37,99,235,0.4) !important;
    }

    /* Interactive Document Workspace Card (Glassy) */
    .dh-workspace-card {
      background: #ffffff;
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      padding: 16px;
      box-shadow: 0 2px 10px rgba(37,99,235,0.04);
    }
    .dh-workspace-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .dh-workspace-title-wrap { flex: 1; min-width: 260px; }
    .dh-hub-badge {
      font-size: 9.5px;
      font-weight: 800;
      color: #2563eb;
      letter-spacing: 0.5px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #eff6ff;
      padding: 2px 6px;
      border-radius: 4px;
      margin-bottom: 4px;
    }
    .dh-workspace-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 2px;
    }
    .dh-workspace-subtitle {
      font-size: 11px;
      color: #64748b;
      margin: 0;
    }
    .dh-workspace-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .btn-open-segregation {
      font-weight: 600 !important;
      border-radius: 6px !important;
      background: #2563eb !important;
      border-color: #2563eb !important;
    }
    .btn-pdf-open {
      font-weight: 600 !important;
      border-radius: 6px !important;
      background: #dc2626 !important;
      border-color: #dc2626 !important;
    }
    .btn-pdf-open:hover { background: #b91c1c !important; }
    .btn-open-popup {
      font-weight: 600 !important;
      border-radius: 6px !important;
      border-color: #93c5fd !important;
      color: #1e40af !important;
    }

    /* Workspace Empty Banner */
    .dh-workspace-empty-banner {
      border: 1.5px dashed #93c5fd;
      border-radius: 8px;
      background: linear-gradient(135deg, #f0f7ff 0%, #e0e7ff 100%);
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .dh-workspace-empty-banner:hover {
      background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%);
      border-color: #2563eb;
      transform: translateY(-1px);
    }
    .empty-banner-icon-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #2563eb;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(37,99,235,0.25);
    }
    .empty-banner-text { flex: 1; min-width: 0; }
    .empty-main-text { display: block; font-size: 13px; font-weight: 700; color: #1e3a8a; }
    .empty-sub-text { display: block; font-size: 11.5px; color: #475569; margin-top: 2px; }
    .btn-banner-action { font-weight: 600 !important; border-radius: 6px !important; }

    /* Staged Form Summary Cards */
    .dh-staged-form-summary { margin-top: 6px; }
    .summary-bar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
    }
    .summary-count-badge {
      font-size: 12px;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .link-edit-popup {
      font-size: 12px !important;
      font-weight: 600 !important;
      color: #2563eb !important;
    }
    .summary-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 10px;
    }
    .summary-card-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 10px;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.2s ease;
    }
    .summary-card-item:hover {
      border-color: #93c5fd;
      background: #ffffff;
      box-shadow: 0 2px 8px rgba(37,99,235,0.06);
    }
    .summary-thumb-col { cursor: pointer; flex-shrink: 0; }
    .summary-thumb-box {
      width: 40px;
      height: 44px;
      border-radius: 6px;
      background: #eff6ff;
      border: 1px solid #cbd5e1;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .summary-thumb-img { width: 100%; height: 100%; object-fit: cover; }
    .summary-thumb-pdf {
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: 14px;
      color: #dc2626;
    }
    .pdf-pg-label { font-size: 8px; font-weight: 800; color: #dc2626; margin-top: -2px; }
    .summary-thumb-generic { font-size: 16px; color: #64748b; }
    .summary-info-col { flex: 1; min-width: 0; }
    .summary-cat-pill { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; }
    .summary-file-size { font-size: 10px; color: #64748b; font-weight: 500; }
    .summary-title-text { font-size: 11.5px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .summary-file-sub { font-size: 10px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .summary-actions-col { display: flex; align-items: center; gap: 2px; }

    /* Modal Styling */
    .modal-mode-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding: 10px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .mode-header-label { font-size: 12.5px; font-weight: 700; color: #1e3a8a; display: flex; align-items: center; gap: 6px; }
    .mode-options-inline { display: flex; gap: 10px; flex-wrap: wrap; }
    .mode-card {
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      padding: 6px 12px;
      background: #ffffff;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
    }
    .mode-card:hover { border-color: #93c5fd; background: #eff6ff; }
    .mode-card.active { border-color: #2563eb; background: #eff6ff; box-shadow: 0 2px 6px rgba(37,99,235,0.12); }
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
      width: 26px;
      height: 26px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
    }
    .mode-icon-img { background: #dbeafe; color: #2563eb; }
    .mode-icon-pdf { background: #fee2e2; color: #dc2626; }
    .mode-info { min-width: 0; }
    .mode-name { font-size: 11.5px; font-weight: 700; color: #0f172a; margin: 0; }
    .mode-desc { font-size: 9.5px; color: #64748b; margin: 0; }

    /* Dropzones */
    .dh-dropzone {
      border: 2px dashed #93c5fd;
      border-radius: 10px;
      background: #f0f7ff;
      padding: 24px 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-bottom: 16px;
    }
    .dh-dropzone:hover {
      border-color: #2563eb;
      background: #e0f2fe;
    }
    .mode-pdf-dropzone {
      border-color: #fca5a5;
      background: #fef2f2;
    }
    .mode-pdf-dropzone:hover {
      border-color: #ef4444;
      background: #fee2e2;
    }
    .dropzone-icon-circle {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 8px;
      font-size: 22px;
    }
    .img-circle { background: #dbeafe; color: #2563eb; }
    .pdf-circle { background: #fee2e2; color: #dc2626; }
    .dropzone-title { font-size: 13.5px; font-weight: 700; color: #1e3a8a; margin-bottom: 3px; }
    .mode-pdf-dropzone .dropzone-title { color: #991b1b; }
    .dropzone-subtitle { font-size: 11.5px; color: #64748b; margin-bottom: 10px; max-width: 580px; margin-left: auto; margin-right: auto; }
    .btn-browse { font-weight: 600 !important; border-radius: 6px !important; }
    .btn-pdf-browse { background: #dc2626 !important; border-color: #dc2626 !important; }

    /* Modal Staging Grid */
    .modal-staging-section { margin-top: 10px; }
    .staging-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .staging-title { font-size: 13.5px; font-weight: 700; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px; }
    .staging-count-badge { background: #dbeafe; color: #1e40af; font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 700; }
    .staging-desc { font-size: 11px; color: #64748b; margin: 2px 0 0; }
    .staging-actions { display: flex; gap: 6px; flex-wrap: wrap; }
    .staged-compact-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 10px;
      max-height: 400px;
      overflow-y: auto;
      padding: 4px;
    }
    .staged-compact-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 10px;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.2s ease;
    }
    .staged-compact-card:hover {
      border-color: #93c5fd;
      box-shadow: 0 2px 8px rgba(37,99,235,0.08);
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
    }
    .mini-thumb-img { width: 100%; height: 100%; object-fit: cover; }
    .mini-thumb-pdf {
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: 16px;
      color: #dc2626;
    }
    .mini-pdf-pg { font-size: 8px; font-weight: 800; color: #dc2626; margin-top: -2px; }
    .mini-thumb-generic { font-size: 18px; color: #64748b; }
    .mini-preview-btn { font-size: 10.5px !important; padding: 0 !important; height: auto !important; }
    .mini-fields-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
    .fields-top-row { display: flex; gap: 6px; }
    .cat-select-item { flex: 1; }
    .title-input-item { flex: 1; }
    .fields-bottom-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
    .page-badge-item { display: flex; align-items: center; gap: 4px; }
    .pg-label { font-size: 10px; color: #64748b; font-weight: 600; }
    .pg-num-input { width: 56px !important; }
    .file-name-item { font-size: 10.5px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; text-align: right; }
    .file-name-text { max-width: 120px; display: inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; vertical-align: bottom; }
    .file-size-mini { font-size: 9.5px; color: #94a3b8; margin-left: 2px; }
    .mini-actions-col { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .mini-reorder-group { display: flex; }
    .mini-remove-btn { font-size: 13px !important; }

    /* Modal Footer */
    .modal-footer-flex { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .footer-count-text { font-size: 12.5px; color: #1e3a8a; }
    .footer-btns-right { display: flex; gap: 8px; }
    .btn-apply-docs {
      font-weight: 600 !important;
      background: #10b981 !important;
      border-color: #10b981 !important;
      border-radius: 6px !important;
    }
    .btn-apply-docs:hover { background: #059669 !important; }

    /* Lightbox Preview Modal */
    .preview-modal-body {
      min-height: 480px;
      max-height: 680px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f172a;
      border-radius: 8px;
      overflow: hidden;
      position: relative;
    }
    .preview-img-container {
      width: 100%;
      height: 100%;
      min-height: 480px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: auto;
    }
    .preview-modal-img {
      max-width: 100%;
      max-height: 600px;
      object-fit: contain;
      transition: transform 0.2s ease;
    }
    .preview-pdf-container {
      width: 100%;
      height: 600px;
    }
    .preview-pdf-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    .preview-generic-box {
      text-align: center;
      color: #fff;
    }
    .preview-footer-wrap {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .preview-toolbar { display: flex; gap: 6px; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class PublicRegistrationComponent implements OnInit {
  fieldConfigs: FormFieldConfig[] = [];
  mandatoryMap: Record<string, boolean> = {};
  formData: any = {
    customFieldsMap: {},
    customFields: ''
  };
  selectedPhoto: File | null = null;
  selectedAadharDoc: File | null = null;
  selectedPanDoc: File | null = null;
  selectedEducationDocs: File[] = [];
  selectedPersonalDocs: File[] = [];

  documentCategories = DOCUMENT_CATEGORIES;

  additionalUploadedDocs: Array<{
    uid?: string;
    file: File;
    documentType: string;
    documentTitle: string;
    isPdf: boolean;
    isImage: boolean;
    fileSize?: number;
    pageNumber?: number;
    previewUrl?: string;
    notes?: string;
  }> = [];

  // Segregation Modal States
  isSegregationModalVisible = false;
  uploadMode: 'images' | 'pdf_split' = 'images';
  isSplittingPdf = false;
  stagedModalFiles: Array<{
    uid: string;
    file: File;
    previewUrl?: string;
    isImage: boolean;
    isPdf: boolean;
    fileSize: number;
    documentType: string;
    documentTitle: string;
    pageNumber: number;
    notes?: string;
  }> = [];

  // Lightbox Preview Modal States
  isPreviewModalVisible = false;
  previewModalTitle = '';
  previewIsImage = false;
  previewIsPdf = false;
  previewUrl: string | null = null;
  previewUrlSafe: SafeResourceUrl | null = null;
  previewZoom = 1;
  previewRotation = 0;

  // Bulk Category Modal State
  isBulkCategoryModalVisible = false;
  bulkSelectedCategory = 'AADHAR_CARD';
  Math = Math;

  isSaving = false;
  submitted = false;
  submitAttempted = false;
  registrationCode = '';
  loading = true;

  prefixes: any[] = [];
  genders: any[] = [];
  maritalStatuses: any[] = [];
  qualifications: any[] = [];
  designations: any[] = [];
  banks: any[] = [];
  religions: any[] = [];
  socialCategories: any[] = [];
  socialSubcategories: any[] = [];
  bloodGroups: any[] = [];
  fMhOptions: any[] = [];
  occupationKins: any[] = [];
  occupationSubs: any[] = [];
  yesNoOptions: any[] = [];
  relationships: any[] = [];
  languageOptions: any[] = [];
  selectedLanguage: string | null = null;
  languages: { language: string; canRead: boolean; canWrite: boolean; canSpeak: boolean }[] = [];

  get availableLanguageOptions(): any[] {
    const added = new Set(this.languages.map(l => l.language));
    return this.languageOptions.filter(opt => !added.has(opt.value));
  }

  addLanguage(): void {
    if (!this.selectedLanguage) return;
    const opt = this.languageOptions.find(o => o.code === this.selectedLanguage);
    if (opt) {
      this.languages.push({ language: opt.value, canRead: false, canWrite: false, canSpeak: false });
    }
    this.selectedLanguage = null;
  }

  removeLanguage(index: number): void {
    this.languages.splice(index, 1);
  }

  constructor(
    private http: HttpClient,
    private pendingService: PendingRegistrationService,
    private formFieldConfigService: FormFieldConfigService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    const api = environment.apiUrl + '/public/register/masters';
    this.loading = true;
    if (!this.formData.customFieldsMap) this.formData.customFieldsMap = {};

    const categories = [
      { name: 'PREFIX', target: 'prefixes' },
      { name: 'GENDER', target: 'genders' },
      { name: 'MARITAL_STATUS', target: 'maritalStatuses' },
      { name: 'QUALIFICATION', target: 'qualifications' },
      { name: 'DESIGNATION', target: 'designations' },
      { name: 'BANK_NAME', target: 'banks' },
      { name: 'RELIGION', target: 'religions' },
      { name: 'SOCIAL_CATEGORY', target: 'socialCategories' },
      { name: 'SOCIAL_SUBCATEGORY', target: 'socialSubcategories' },
      { name: 'BLOOD_GROUP', target: 'bloodGroups' },
      { name: 'F_M_H', target: 'fMhOptions' },
      { name: 'OCCUPATION_KIN', target: 'occupationKins' },
      { name: 'OCCUPATION_SUB', target: 'occupationSubs' },
      { name: 'YES_NO', target: 'yesNoOptions' },
      { name: 'RELATIONSHIP', target: 'relationships' },
      { name: 'LANGUAGE', target: 'languageOptions' }
    ];

    const requests: Record<string, any> = {
      formFields: this.formFieldConfigService.getVisibleConfigs().pipe(catchError(() => of([])))
    };

    categories.forEach(cat => {
      requests[cat.target] = this.http.get<any>(`${api}/${cat.name}`).pipe(
        catchError(() => of({ data: [] }))
      );
    });

    forkJoin(requests).subscribe({
      next: (results: any) => {
        categories.forEach(cat => {
          (this as any)[cat.target] = results[cat.target]?.data || [];
        });

        const configs: FormFieldConfig[] = results.formFields || [];
        this.fieldConfigs = configs;
        const map: Record<string, boolean> = {};
        configs.forEach(c => map[c.fieldKey] = c.isMandatory);
        this.mandatoryMap = map;

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  // Photo Cropper State
  isPhotoCropModalOpen = false;
  pendingPhotoFile: File | null = null;
  photoPreviewUrl = '';

  onPhotoCropConfirmed(result: CropResult): void {
    this.selectedPhoto = result.file;
    this.photoPreviewUrl = result.dataUrl;
  }

  onPhotoCropCancelled(): void {
    this.isPhotoCropModalOpen = false;
  }

  onFileChange(event: any, type: string) {
    const file = event.target.files[0];
    if (file) {
      if (type === 'photo') {
        this.pendingPhotoFile = file;
        this.isPhotoCropModalOpen = true;
        event.target.value = '';
        return;
      }
      else if (type === 'aadharDoc') this.selectedAadharDoc = file;
      else if (type === 'panDoc') this.selectedPanDoc = file;
    }
  }

  onMultiFileChange(event: any, type: string) {
    const files = Array.from(event.target.files || []);
    if (type === 'educationDocs') {
      this.selectedEducationDocs = [...this.selectedEducationDocs, ...files] as File[];
    } else if (type === 'personalDocs') {
      this.selectedPersonalDocs = [...this.selectedPersonalDocs, ...files] as File[];
    }
    event.target.value = '';
  }

  removeMultiFile(index: number, type: string) {
    if (type === 'educationDocs') {
      this.selectedEducationDocs.splice(index, 1);
    } else if (type === 'personalDocs') {
      this.selectedPersonalDocs.splice(index, 1);
    }
  }

  // ================= SEGREGATION MODAL METHODS =================
  openSegregationModal(mode: 'images' | 'pdf_split' = 'images'): void {
    this.uploadMode = mode;
    this.stagedModalFiles = this.additionalUploadedDocs.map(d => ({
      uid: d.uid || `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      file: d.file,
      previewUrl: d.previewUrl,
      isImage: d.isImage,
      isPdf: d.isPdf,
      fileSize: d.fileSize || d.file?.size || 0,
      documentType: d.documentType || '',
      documentTitle: d.documentTitle || '',
      pageNumber: d.pageNumber || 1,
      notes: d.notes
    }));
    this.isSegregationModalVisible = true;
  }

  setUploadMode(mode: 'images' | 'pdf_split'): void {
    this.uploadMode = mode;
  }

  onDropImages(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer && e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (files.length > 0) {
        this.addImagesToStaging(files);
      } else {
        this.notification.warning('Format Notice', 'Please drop image files (PNG, JPG, WEBP) in this mode.');
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
    files.forEach(file => {
      const isImg = file.type.startsWith('image/');
      const previewUrl = isImg ? URL.createObjectURL(file) : '';

      const item = {
        uid: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        file: file,
        previewUrl: previewUrl,
        isImage: isImg,
        isPdf: false,
        fileSize: file.size,
        documentType: '',
        documentTitle: '',
        pageNumber: 1
      };
      this.stagedModalFiles.push(item);
    });
    this.notification.success('Images Added', `Added ${files.length} image(s) to staging. Please select a category for each.`);
  }

  onDropPdf(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        this.processCombinedPdf(file);
      } else {
        this.notification.warning('Invalid File', 'Please upload a valid PDF document.');
      }
    }
  }

  onPdfSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.processCombinedPdf(file);
      input.value = '';
    }
  }

  processCombinedPdf(file: File): void {
    this.isSplittingPdf = true;
    this.pendingService.splitPdf(file).subscribe({
      next: (res) => {
        this.isSplittingPdf = false;
        if (res.success && res.data && res.data.length > 0) {
          const splitPages = res.data;
          const baseName = file.name.replace(/\.[^/.]+$/, '');

          splitPages.forEach((pageData, index) => {
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

            const item = {
              uid: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              file: pageFile,
              previewUrl: pageBlobUrl,
              isImage: false,
              isPdf: true,
              fileSize: pageFile.size,
              documentType: '',
              documentTitle: '',
              pageNumber: index + 1,
              notes: `Extracted from ${file.name} (Page ${pageData.pageNumber} of ${pageData.totalPages})`
            };
            this.stagedModalFiles.push(item);
          });
          this.notification.success('PDF Split Success', `Split PDF into ${splitPages.length} individual document page(s). Please select a category for each.`);
        } else {
          this.notification.error('Error', res.message || 'Failed to split PDF');
        }
      },
      error: () => {
        this.isSplittingPdf = false;
        this.notification.error('Error', 'Failed to split PDF pages.');
      }
    });
  }

  onCategoryChange(item?: any): void {
    this.autoNumberStagedPages();
  }

  autoNumberStagedPages(): void {
    const categoryCounts: Record<string, number> = {};
    const categoryTotals: Record<string, number> = {};

    this.stagedModalFiles.forEach(item => {
      if (item.documentType) {
        categoryTotals[item.documentType] = (categoryTotals[item.documentType] || 0) + 1;
      }
    });

    this.stagedModalFiles.forEach(item => {
      const cat = item.documentType;
      if (!cat) {
        if (!item.documentTitle || item.documentTitle.startsWith('Document')) {
          item.documentTitle = '';
        }
        return;
      }
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      const count = categoryCounts[cat];
      item.pageNumber = count;

      const catObj = this.documentCategories.find(c => c.code === cat);
      const catLabel = catObj ? catObj.label : 'Document';
      if (categoryTotals[cat] > 1) {
        item.documentTitle = `${catLabel}-${count}`;
      } else {
        item.documentTitle = `${catLabel}`;
      }
    });
  }

  openBulkCategoryModal(): void {
    if (this.stagedModalFiles.length === 0) {
      this.notification.info('Info', 'No staged files to categorize.');
      return;
    }
    this.isBulkCategoryModalVisible = true;
  }

  applyBulkCategory(): void {
    this.stagedModalFiles.forEach(item => {
      item.documentType = this.bulkSelectedCategory;
    });
    this.autoNumberStagedPages();
    this.isBulkCategoryModalVisible = false;
    this.notification.success('Category Updated', `Updated category for all ${this.stagedModalFiles.length} files.`);
  }

  moveStaged(index: number, direction: -1 | 1): void {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= this.stagedModalFiles.length) return;
    const temp = this.stagedModalFiles[index];
    this.stagedModalFiles[index] = this.stagedModalFiles[newIdx];
    this.stagedModalFiles[newIdx] = temp;
    this.autoNumberStagedPages();
  }

  removeStaged(index: number): void {
    const item = this.stagedModalFiles[index];
    if (item && item.previewUrl && item.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(item.previewUrl);
    }
    this.stagedModalFiles.splice(index, 1);
    this.autoNumberStagedPages();
  }

  clearStagedFiles(): void {
    this.stagedModalFiles.forEach(item => {
      if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    this.stagedModalFiles = [];
  }

  applyStagedToForm(): void {
    this.additionalUploadedDocs = this.stagedModalFiles.map(d => ({
      ...d,
      documentType: d.documentType || 'OTHER',
      documentTitle: d.documentTitle || d.file?.name || 'Document'
    }));

    const aadharItem = this.additionalUploadedDocs.find(d => d.documentType === 'AADHAR_CARD');
    this.selectedAadharDoc = aadharItem ? aadharItem.file : null;

    const panItem = this.additionalUploadedDocs.find(d => d.documentType === 'PAN_CARD');
    this.selectedPanDoc = panItem ? panItem.file : null;

    this.isSegregationModalVisible = false;
    this.notification.success('Documents Synced', `Applied ${this.additionalUploadedDocs.length} document(s) to registration form.`);
  }

  openPreviewModal(item: any): void {
    this.previewModalTitle = `${item.documentTitle || item.file?.name || 'Document'} (Preview)`;
    this.previewIsImage = item.isImage || (item.file && item.file.type.startsWith('image/'));
    this.previewIsPdf = item.isPdf || (item.file && (item.file.type === 'application/pdf' || item.file.name.toLowerCase().endsWith('.pdf')));
    this.previewZoom = 1;
    this.previewRotation = 0;

    if (item.isImage && item.previewUrl) {
      this.previewUrl = item.previewUrl;
      this.previewUrlSafe = null;
    } else if (item.isPdf && item.previewUrl) {
      this.previewUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(item.previewUrl);
      this.previewUrl = null;
    } else if (item.file) {
      const url = URL.createObjectURL(item.file);
      if (item.isPdf || item.file.type === 'application/pdf') {
        this.previewIsPdf = true;
        this.previewUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.previewUrl = null;
      } else {
        this.previewIsImage = true;
        this.previewUrl = url;
        this.previewUrlSafe = null;
      }
    }
    this.isPreviewModalVisible = true;
  }

  closePreviewModal(): void {
    this.isPreviewModalVisible = false;
  }

  getCategoryBadge(code: string): { label: string; color: string } {
    const cat = this.documentCategories.find(c => c.code === code);
    return cat ? { label: cat.label, color: cat.color } : { label: code || 'Other', color: '#8c8c8c' };
  }

  onAdditionalFilesSelected(event: any, defaultType?: string) {
    const files = Array.from(event.target.files || []) as File[];
    files.forEach(file => {
      const type = defaultType || 'OTHER';
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImg = file.type.startsWith('image/');
      let previewUrl = '';
      if (isImg) {
        previewUrl = URL.createObjectURL(file);
      }
      this.additionalUploadedDocs.push({
        file: file,
        documentType: type,
        documentTitle: file.name.replace(/\.[^/.]+$/, ''),
        isPdf: isPdf,
        isImage: isImg,
        fileSize: file.size,
        pageNumber: 1,
        previewUrl: previewUrl
      });
    });
    event.target.value = '';
  }

  removeAdditionalDoc(index: number) {
    const item = this.additionalUploadedDocs[index];
    if (item && item.previewUrl && item.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(item.previewUrl);
    }
    this.additionalUploadedDocs.splice(index, 1);

    // Keep primary aadhar and pan in sync
    const aadharItem = this.additionalUploadedDocs.find(d => d.documentType === 'AADHAR_CARD');
    this.selectedAadharDoc = aadharItem ? aadharItem.file : null;

    const panItem = this.additionalUploadedDocs.find(d => d.documentType === 'PAN_CARD');
    this.selectedPanDoc = panItem ? panItem.file : null;
  }

  formatBytes(bytes?: number, decimals = 1): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  getValidationErrors(): string[] {
    const errors: string[] = [];

    // Personal
    if (this.isMandatory('firstName', true) && (!this.formData.firstName || !this.formData.firstName.trim())) {
      errors.push('First Name is required');
    }
    if (this.isMandatory('surname', true) && (!this.formData.surname || !this.formData.surname.trim())) {
      errors.push('Surname is required');
    }
    if (this.isMandatory('gender', true) && !this.formData.gender) {
      errors.push('Gender is required');
    }
    if (this.isMandatory('dob', true) && !this.formData.dob) {
      errors.push('Date of Birth is required');
    }
    if (this.isMandatory('mobile', true) && (!this.formData.mobile || !this.formData.mobile.trim())) {
      errors.push('Mobile number is required (10 digits)');
    } else if (this.formData.mobile && !/^[0-9]{10}$/.test(this.formData.mobile.trim())) {
      errors.push('Mobile number must be exactly 10 digits (e.g. 9876543210)');
    }
    if (this.isMandatory('email', true) && (!this.formData.email || !this.formData.email.trim())) {
      errors.push('Email address is required');
    } else if (this.formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email.trim())) {
      errors.push('Please enter a valid email address (e.g. name@domain.com)');
    }

    // Dynamic checks for other fields if marked mandatory in master
    if (this.isMandatory('maritalStatus') && !this.formData.maritalStatus) {
      errors.push('Marital Status is required');
    }
    if (this.isMandatory('presentAddress') && !this.formData.presentAddress) {
      errors.push('Present Address is required');
    }
    if (this.isMandatory('permanentAddress') && !this.formData.permanentAddress) {
      errors.push('Permanent Address is required');
    }
    if (this.isMandatory('highestQualification') && !this.formData.highestQualification) {
      errors.push('Highest Qualification is required');
    }
    if (this.isMandatory('bankName') && !this.formData.bankName) {
      errors.push('Bank Name is required');
    }
    if (this.isMandatory('accountNumber') && !this.formData.accountNumber) {
      errors.push('Account Number is required');
    }
    if (this.isMandatory('ifscCode') && !this.formData.ifscCode) {
      errors.push('IFSC Code is required');
    }
    if (this.isMandatory('aadharNumber') && !this.formData.aadharNumber) {
      errors.push('Aadhaar Number is required');
    }
    if (this.isMandatory('panNumber') && !this.formData.panNumber) {
      errors.push('PAN Number is required');
    }
    if (this.isMandatory('fatherName') && !this.formData.fatherName) {
      errors.push("Father's Name is required");
    }
    if (this.isMandatory('motherName') && !this.formData.motherName) {
      errors.push("Mother's Name is required");
    }
    if (this.isMandatory('bloodGroup') && !this.formData.bloodGroup) {
      errors.push('Blood Group is required');
    }

    // Custom field check
    this.customFields.forEach(cf => {
      if (this.isMandatory(cf.fieldKey) && !this.formData.customFieldsMap[cf.fieldKey]) {
        errors.push(`${cf.fieldLabel} is required`);
      }
    });

    if (!this.selectedPhoto) {
      errors.push('Candidate Photo is required (upload JPG/PNG)');
    }
    return errors;
  }

  onSubmit(form?: NgForm) {
    this.submitAttempted = true;

    if (!this.selectedAadharDoc) {
      const aadharItem = this.additionalUploadedDocs.find(d => d.documentType === 'AADHAR_CARD');
      if (aadharItem) this.selectedAadharDoc = aadharItem.file;
    }
    if (!this.selectedPanDoc) {
      const panItem = this.additionalUploadedDocs.find(d => d.documentType === 'PAN_CARD');
      if (panItem) this.selectedPanDoc = panItem.file;
    }

    if (form) {
      Object.values(form.controls).forEach(control => {
        control.markAsTouched();
        control.markAsDirty();
        control.updateValueAndValidity();
      });
    }

    const errors = this.getValidationErrors();
    if (errors.length > 0) {
      const errorListHtml = '<ul style="margin: 8px 0; padding-left: 20px; color: #dc2626; font-size: 13px; line-height: 1.7;">' +
        errors.map(err => `<li>${err}</li>`).join('') +
        '</ul>';

      this.modal.error({
        nzTitle: `⚠️ ${errors.length} Validation Error${errors.length > 1 ? 's' : ''} in Registration`,
        nzWidth: 540,
        nzContent: `
          <div style="max-height: 350px; overflow-y: auto;">
            <p style="margin-bottom: 8px; color: #4b5563; font-size: 13px;">
              Please correct the following field(s) before submitting your registration:
            </p>
            ${errorListHtml}
          </div>
        `,
        nzOkText: 'Go to First Error',
        nzOnOk: () => {
          setTimeout(() => {
            const firstInvalid = document.querySelector('.input-error, .has-error, .field-error');
            if (firstInvalid) {
              firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
              const focusable = firstInvalid.querySelector('input, select, textarea') || firstInvalid;
              if (focusable && typeof (focusable as HTMLElement).focus === 'function') {
                (focusable as HTMLElement).focus();
              }
            }
          }, 100);
        }
      });
      return;
    }

    this.isSaving = true;
    const fd = new FormData();
    fd.append('firstName', this.formData.firstName);
    fd.append('middleName', this.formData.middleName || '');
    fd.append('surname', this.formData.surname);
    fd.append('mobile', this.formData.mobile);
    fd.append('email', this.formData.email || '');
    fd.append('dob', this.formData.dob || '');
    fd.append('gender', this.formData.gender || '');
    fd.append('prefix', this.formData.prefix || '');
    fd.append('maritalStatus', this.formData.maritalStatus || '');
    fd.append('presentAddress', this.formData.presentAddress || '');
    fd.append('permanentAddress', this.formData.permanentAddress || '');
    fd.append('aadharNumber', this.formData.aadharNumber || '');
    fd.append('panNumber', this.formData.panNumber || '');
    fd.append('highestQualification', this.formData.highestQualification || '');
    fd.append('designation', this.formData.designation || '');
    fd.append('department', this.formData.department || '');
    fd.append('processAssigned', this.formData.processAssigned || '');
    fd.append('doj', this.formData.doj || '');
    fd.append('bankName', this.formData.bankName || '');
    fd.append('accountNumber', this.formData.accountNumber || '');
    fd.append('ifscCode', this.formData.ifscCode || '');
    fd.append('branch', this.formData.branch || '');
    fd.append('fatherHusbandName', this.formData.fatherHusbandName || this.formData.fatherName || '');
    fd.append('fMH', this.formData.fMH || '');
    fd.append('occupationKin', this.formData.occupationKin || '');
    fd.append('fatherName', this.formData.fatherName || this.formData.fatherHusbandName || '');
    fd.append('fatherPhone', this.formData.fatherPhone || '');
    fd.append('motherName', this.formData.motherName || '');
    fd.append('motherPhone', this.formData.motherPhone || '');
    fd.append('spouseName', this.formData.spouseName || '');
    fd.append('spousePhone', this.formData.spousePhone || '');
    fd.append('closeRelativeName', this.formData.closeRelativeName || '');
    fd.append('closeRelativeMobile', this.formData.closeRelativeMobile || '');
    fd.append('rationCard', this.formData.rationCard || '');
    fd.append('occupationKinSub', this.formData.occupationKinSub || '');
    fd.append('religion', this.formData.religion || '');
    fd.append('socialCategory', this.formData.socialCategory || '');
    fd.append('socialSubcategory', this.formData.socialSubcategory || '');
    fd.append('levelOfEducation', this.formData.levelOfEducation || '');
    fd.append('yearOfPassing', this.formData.yearOfPassing || '');
    fd.append('percentageMarks', this.formData.percentageMarks || '');
    fd.append('hasTv', this.formData.hasTv || '');
    fd.append('hasFridge', this.formData.hasFridge || '');
    fd.append('hasLaptop', this.formData.hasLaptop || '');
    fd.append('hasWifi', this.formData.hasWifi || '');
    fd.append('has2wheeler', this.formData.has2wheeler || '');
    fd.append('has4wheeler', this.formData.has4wheeler || '');
    fd.append('bloodGroup', this.formData.bloodGroup || '');
    fd.append('sscStatus', this.formData.sscStatus || '');
    fd.append('intermediateStatus', this.formData.intermediateStatus || '');
    fd.append('bachelorsDegree', this.formData.bachelorsDegree || '');
    fd.append('mastersDegree', this.formData.mastersDegree || '');
    fd.append('aadhaarVerification', this.formData.aadhaarVerification || '');
    fd.append('panVerification', this.formData.panVerification || '');
    fd.append('osv', this.formData.osv || '');
    fd.append('remarks', this.formData.remarks || '');
    fd.append('pastExperience', this.formData.pastExperience || '');
    fd.append('organizationName', this.formData.organizationName || '');
    fd.append('periodOfEmployment', this.formData.periodOfEmployment || '');
    fd.append('ref1Name', this.formData.ref1Name || '');
    fd.append('ref1Relationship', this.formData.ref1Relationship || '');
    fd.append('ref1Address', this.formData.ref1Address || '');
    fd.append('ref1Mobile', this.formData.ref1Mobile || '');
    fd.append('ref2Name', this.formData.ref2Name || '');
    fd.append('ref2Relationship', this.formData.ref2Relationship || '');
    fd.append('ref2Address', this.formData.ref2Address || '');
    fd.append('ref2Mobile', this.formData.ref2Mobile || '');
    if (this.languages.length > 0) {
      fd.append('languages', JSON.stringify(this.languages));
    }
    if (this.formData.customFieldsMap && Object.keys(this.formData.customFieldsMap).length > 0) {
      fd.append('customFields', JSON.stringify(this.formData.customFieldsMap));
    }
    if (this.selectedPhoto) fd.append('photo', this.selectedPhoto);
    if (this.selectedAadharDoc) fd.append('aadharDoc', this.selectedAadharDoc);
    if (this.selectedPanDoc) fd.append('panDoc', this.selectedPanDoc);

    // Support education and personal files
    this.selectedEducationDocs.forEach(f => fd.append('educationDocs', f));
    this.selectedPersonalDocs.forEach(f => fd.append('personalDocs', f));

    // Support categorized additional documents
    this.additionalUploadedDocs.forEach(doc => {
      fd.append('additionalDocs', doc.file);
      fd.append('additionalDocTypes', doc.documentType);
      fd.append('additionalDocTitles', doc.documentTitle || doc.file.name);
    });

    this.pendingService.submitRegistration(fd).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.submitted = true;
        this.registrationCode = res.data.registrationCode;
        this.notification.success('Success', 'Registration submitted successfully!');
      },
      error: (err) => {
        this.isSaving = false;
        let msg = 'Failed to submit registration. Please try again.';
        if (err?.error?.message) {
          msg = err.error.message;
        } else if (typeof err?.error === 'string') {
          msg = err.error;
        }
        this.modal.error({
          nzTitle: '❌ Registration Failed',
          nzContent: `<p style="color: #b91c1c; font-size: 13px; font-weight: 500;">${msg}</p>`,
          nzOkText: 'OK'
        });
      }
    });
  }

  loadFieldConfigs(): void {
    this.formFieldConfigService.getVisibleConfigs().subscribe({
      next: (configs) => {
        this.fieldConfigs = configs;
        const map: Record<string, boolean> = {};
        configs.forEach(c => map[c.fieldKey] = c.isMandatory);
        this.mandatoryMap = map;
      },
      error: () => {
        this.mandatoryMap = {
          firstName: true,
          surname: true,
          gender: true,
          dob: true,
          mobile: true,
          email: true
        };
      }
    });
  }

  isMandatory(key: string, fallback: boolean = false): boolean {
    return this.mandatoryMap[key] !== undefined ? this.mandatoryMap[key] : fallback;
  }


  get customFields(): FormFieldConfig[] {
    return (this.fieldConfigs || []).filter(f => f.isCustom && f.isVisible);
  }

  getCustomFieldOptions(field: FormFieldConfig): { label: string; value: string }[] {
    if (field.options) {
      return field.options.split(',').map(s => s.trim()).filter(s => !!s).map(s => ({
        label: s,
        value: s
      }));
    }
    return [];
  }


  getCustomFieldValue(key: string): any {
    if (!this.formData.customFieldsMap) this.formData.customFieldsMap = {};
    return this.formData.customFieldsMap[key];
  }

  setCustomFieldValue(key: string, val: any): void {
    if (!this.formData.customFieldsMap) this.formData.customFieldsMap = {};
    this.formData.customFieldsMap[key] = val;
  }

}
