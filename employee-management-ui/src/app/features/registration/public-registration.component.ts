import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

          <form *ngIf="!submitted && !loading" #regForm="ngForm" (ngSubmit)="onSubmit()" class="reg-form">
            <!-- Personal Information -->
            <h3 class="section-title">Personal Information</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Prefix</label>
                <nz-select [(ngModel)]="formData.prefix" name="prefix" nzPlaceHolder="Select prefix" style="width:100%">
                  <nz-option *ngFor="let opt of prefixes" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group">
                <label>First Name <span class="required">*</span></label>
                <input nz-input [(ngModel)]="formData.firstName" name="firstName" required placeholder="Enter first name" />
              </div>
              <div class="form-group">
                <label>Middle Name</label>
                <input nz-input [(ngModel)]="formData.middleName" name="middleName" placeholder="Enter middle name" />
              </div>
              <div class="form-group">
                <label>Surname <span class="required">*</span></label>
                <input nz-input [(ngModel)]="formData.surname" name="surname" required placeholder="Enter surname" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Gender <span class="required">*</span></label>
                <nz-select [(ngModel)]="formData.gender" name="gender" required nzPlaceHolder="Select gender" style="width:100%">
                  <nz-option *ngFor="let g of genders" [nzValue]="g.code" [nzLabel]="g.value"></nz-option>
                </nz-select>
              </div>
              <div class="form-group">
                <label>Date of Birth <span class="required">*</span></label>
                <input nz-input type="date" [(ngModel)]="formData.dob" name="dob" required />
              </div>
              <div class="form-group">
                <label>Marital Status</label>
                <nz-select [(ngModel)]="formData.maritalStatus" name="maritalStatus" nzPlaceHolder="Select marital status" style="width:100%">
                  <nz-option *ngFor="let opt of maritalStatuses" [nzValue]="opt.code" [nzLabel]="opt.value"></nz-option>
                </nz-select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Mobile <span class="required">*</span></label>
                <input nz-input [(ngModel)]="formData.mobile" name="mobile" required placeholder="Enter 10-digit mobile" maxlength="10" pattern="^[0-9]{10}$" />
              </div>
              <div class="form-group">
                <label>Email <span class="required">*</span></label>
                <input nz-input [(ngModel)]="formData.email" name="email" required email placeholder="Enter email" />
              </div>
              <div class="form-group">
                <label>Father's Name</label>
                <input nz-input [(ngModel)]="formData.fatherName" name="fatherName" placeholder="Enter father's name" />
              </div>
              <div class="form-group">
                <label>Father's Phone</label>
                <input nz-input [(ngModel)]="formData.fatherPhone" name="fatherPhone" placeholder="Enter father's phone" maxlength="10" pattern="^[0-9]{10}$" />
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

            <!-- Identity -->
            <h3 class="section-title">Identity</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Aadhar Number</label>
                <input nz-input [(ngModel)]="formData.aadharNumber" name="aadharNumber" placeholder="12-digit Aadhar number" maxlength="14" />
              </div>
              <div class="form-group">
                <label>PAN Number</label>
                <input nz-input [(ngModel)]="formData.panNumber" name="panNumber" placeholder="PAN number" maxlength="10" style="text-transform:uppercase" />
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
                <label>Designation</label>
                <nz-select [(ngModel)]="formData.designation" name="designation" nzPlaceHolder="Select designation" style="width:100%">
                  <nz-option *ngFor="let d of designations" [nzValue]="d.code" [nzLabel]="d.value"></nz-option>
                </nz-select>
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

            <!-- Documents -->
            <h3 class="section-title">Documents</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Photo</label>
                <input type="file" accept="image/jpeg,image/png" (change)="onFileChange($event, 'photo')" />
                <span *ngIf="selectedPhoto" class="file-name">{{ selectedPhoto.name }}</span>
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

            <div class="form-actions">
              <button nz-button nzType="primary" nzSize="large" [nzLoading]="isSaving" [disabled]="!regForm.valid">
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
    .form-actions {
      text-align: center;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
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
  `]
})
export class PublicRegistrationComponent implements OnInit {
  formData: any = {};
  selectedPhoto: File | null = null;
  selectedAadharDoc: File | null = null;
  selectedPanDoc: File | null = null;
  isSaving = false;
  submitted = false;
  registrationCode = '';
  loading = true;

  prefixes: any[] = [];
  genders: any[] = [];
  maritalStatuses: any[] = [];
  qualifications: any[] = [];
  designations: any[] = [];
  banks: any[] = [];
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
    private notification: NzNotificationService
  ) {}

  ngOnInit() {
    const api = environment.apiUrl + '/public/register/masters';
    this.loading = true;

    const categories = [
      { name: 'PREFIX', target: 'prefixes' },
      { name: 'GENDER', target: 'genders' },
      { name: 'MARITAL_STATUS', target: 'maritalStatuses' },
      { name: 'QUALIFICATION', target: 'qualifications' },
      { name: 'DESIGNATION', target: 'designations' },
      { name: 'BANK_NAME', target: 'banks' },
      { name: 'LANGUAGE', target: 'languageOptions' }
    ];

    let loadedCount = 0;
    categories.forEach(cat => {
      this.http.get<any>(api + '/' + cat.name).subscribe({
        next: (res) => {
          (this as any)[cat.target] = res.data || [];
        },
        error: () => {
          (this as any)[cat.target] = [];
        },
        complete: () => {
          loadedCount++;
          if (loadedCount === categories.length) {
            this.loading = false;
          }
        }
      });
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

  onSubmit() {
    if (!this.formData.firstName || !this.formData.surname || !this.formData.mobile || !this.formData.gender || !this.formData.dob || !this.formData.email) {
      this.notification.error('Error', 'Please fill in all required fields');
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
}
