import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
import { HttpClient } from '@angular/common/http';
import { PendingRegistrationService } from '../../core/services/pending-registration.service';
import { FormFieldConfigService, FormFieldConfig } from '../../core/services/form-field-config.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-public-registration',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    NzButtonModule, NzFormModule, NzInputModule, NzSelectModule,
    NzDatePickerModule, NzUploadModule, NzIconModule, NzSpinModule, NzCardModule, NzDividerModule, NzTableModule, NzCheckboxModule
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

            <!-- Documents -->
            <h3 class="section-title">Documents</h3>
            <div class="form-row">
              <div class="form-group" [class.has-error]="submitAttempted && !selectedPhoto">
                <label>Photo <span class="required">*</span></label>
                <input type="file" accept="image/jpeg,image/png" (change)="onFileChange($event, 'photo')" [class.input-error]="submitAttempted && !selectedPhoto" />
                <span *ngIf="selectedPhoto" class="file-name" style="color:#52c41a;font-weight:500;">
                  <i nz-icon nzType="check-circle" nzTheme="fill"></i> {{ selectedPhoto.name }}
                </span>
                <div class="field-error" *ngIf="submitAttempted && !selectedPhoto">
                  <i nz-icon nzType="close-circle"></i> Candidate photo is required (JPG or PNG)
                </div>
              </div>
              <div class="form-group">
                <label>Aadhar Document</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" (change)="onFileChange($event, 'aadharDoc')" />
                <span *ngIf="selectedAadharDoc" class="file-name">{{ selectedAadharDoc.name }}</span>
              </div>
              <div class="form-group">
                <label>PAN Document</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" (change)="onFileChange($event, 'panDoc')" />
                <span *ngIf="selectedPanDoc" class="file-name">{{ selectedPanDoc.name }}</span>
              </div>
            </div>
            <div class="form-row" style="margin-top:8px;">
              <div class="form-group">
                <label>Education Documents</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple (change)="onMultiFileChange($event, 'educationDocs')" />
                <div *ngFor="let f of selectedEducationDocs; let i = index" class="file-name">
                  {{ f.name }} <button nz-button nzType="text" nzDanger nzSize="small" (click)="removeMultiFile(i, 'educationDocs')"><i nz-icon nzType="close"></i></button>
                </div>
              </div>
              <div class="form-group">
                <label>Personal Documents</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple (change)="onMultiFileChange($event, 'personalDocs')" />
                <div *ngFor="let f of selectedPersonalDocs; let i = index" class="file-name">
                  {{ f.name }} <button nz-button nzType="text" nzDanger nzSize="small" (click)="removeMultiFile(i, 'personalDocs')"><i nz-icon nzType="close"></i></button>
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
    private notification: NzNotificationService
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
        // Assign categories
        categories.forEach(cat => {
          (this as any)[cat.target] = results[cat.target]?.data || [];
        });

        // Assign form fields
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

  onFileChange(event: any, type: string) {
    const file = event.target.files[0];
    if (file) {
      if (type === 'photo') this.selectedPhoto = file;
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

    if (form) {
      Object.values(form.controls).forEach(control => {
        control.markAsTouched();
        control.markAsDirty();
        control.updateValueAndValidity();
      });
    }

    const errors = this.getValidationErrors();
    if (errors.length > 0) {
      this.notification.error(
        'Incomplete Registration Form',
        `Please fix the ${errors.length} highlighted field(s) before submitting.`,
        { nzDuration: 6000 }
      );

      // Auto scroll to first invalid field
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
    fd.append('doj', this.formData.doj || '');
    fd.append('bankName', this.formData.bankName || '');
    fd.append('accountNumber', this.formData.accountNumber || '');
    fd.append('ifscCode', this.formData.ifscCode || '');
    fd.append('branch', this.formData.branch || '');
    fd.append('fatherName', this.formData.fatherName || '');
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
    if (this.selectedPhoto) fd.append('photo', this.selectedPhoto);
    if (this.selectedAadharDoc) fd.append('aadharDoc', this.selectedAadharDoc);
    if (this.selectedPanDoc) fd.append('panDoc', this.selectedPanDoc);

    this.pendingService.submitRegistration(fd).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.submitted = true;
        this.registrationCode = res.data.registrationCode;
        this.notification.success('Success', 'Registration submitted successfully!');
      },
      error: () => {
        this.isSaving = false;
        this.notification.error('Error', 'Failed to submit registration. Please try again.');
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
