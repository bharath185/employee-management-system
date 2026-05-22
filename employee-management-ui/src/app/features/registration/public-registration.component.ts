import { Component } from '@angular/core';
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
import { PendingRegistrationService } from '../../core/services/pending-registration.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-public-registration',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    NzButtonModule, NzFormModule, NzInputModule, NzSelectModule,
    NzDatePickerModule, NzUploadModule, NzIconModule, NzSpinModule, NzCardModule
  ],
  template: `
    <div class="reg-page">
      <div class="reg-container">
        <div class="reg-header">
          <div class="reg-logo">
            <i nz-icon nzType="user-add" style="font-size:32px;color:#fff;background:#1f3d6e;padding:12px;border-radius:50%;"></i>
          </div>
          <h1>New Joinee Registration</h1>
          <p>Fill in your basic details to register. HR will review and complete your profile.</p>
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
            <div class="form-row">
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
                <label>Mobile <span class="required">*</span></label>
                <input nz-input [(ngModel)]="formData.mobile" name="mobile" required placeholder="Enter 10-digit mobile" maxlength="10" />
              </div>
              <div class="form-group">
                <label>Email</label>
                <input nz-input [(ngModel)]="formData.email" name="email" placeholder="Enter email" />
              </div>
              <div class="form-group">
                <label>Date of Birth</label>
                <input nz-input type="date" [(ngModel)]="formData.dob" name="dob" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Gender</label>
                <nz-select [(ngModel)]="formData.gender" name="gender" nzPlaceHolder="Select gender" style="width:100%">
                  <nz-option *ngFor="let g of genders" [nzValue]="g.code" [nzLabel]="g.value"></nz-option>
                </nz-select>
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

            <div class="form-group full-width">
              <label>Present Address</label>
              <textarea nz-input [(ngModel)]="formData.presentAddress" name="presentAddress" rows="2" placeholder="Enter your address"></textarea>
            </div>

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
      max-width: 800px;
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
      gap: 20px;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
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
  `]
})
export class PublicRegistrationComponent {
  formData: any = {};
  selectedPhoto: File | null = null;
  selectedAadharDoc: File | null = null;
  selectedPanDoc: File | null = null;
  isSaving = false;
  submitted = false;
  registrationCode = '';
  loading = true;

  genders: any[] = [];
  qualifications: any[] = [];
  designations: any[] = [];

  constructor(
    private pendingService: PendingRegistrationService,
    private masterDataService: MasterDataService,
    private notification: NzNotificationService
  ) {}

  ngOnInit() {
    this.masterDataService.getByCategory('GENDER').subscribe(g => {
      this.genders = g;
      this.loading = false;
    });
    this.masterDataService.getByCategory('QUALIFICATION').subscribe(q => this.qualifications = q);
    this.masterDataService.getByCategory('DESIGNATION').subscribe(d => this.designations = d);
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
    if (!this.formData.firstName || !this.formData.surname || !this.formData.mobile) {
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
    fd.append('presentAddress', this.formData.presentAddress || '');
    fd.append('aadharNumber', this.formData.aadharNumber || '');
    fd.append('panNumber', this.formData.panNumber || '');
    fd.append('highestQualification', this.formData.highestQualification || '');
    fd.append('designation', this.formData.designation || '');
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
