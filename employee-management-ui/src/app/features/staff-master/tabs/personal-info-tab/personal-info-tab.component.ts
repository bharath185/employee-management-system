import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { MasterDataService } from '../../../../core/services/master-data.service';
import { MasterDataItem } from '../../../../core/models/api-response.model';
import { EmployeeLanguage } from '../../../../core/models/employee.model';

@Component({
  selector: 'app-personal-info-tab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzIconModule,
    NzCheckboxModule,
    NzButtonModule,
    NzTableModule
  ],
  template: `
    <div class="tab-container">
      <!-- Basic Information -->
      <div class="form-section">
        <div class="form-section-header">
          <div class="form-section-icon"><i nz-icon nzType="user"></i></div>
          <h4 class="form-section-title">Basic Information</h4>
        </div>
        <div class="form-grid">
          <nz-form-item>
            <nz-form-label>Employee Code</nz-form-label>
            <nz-form-control>
              <input nz-input [formControl]="form.get('employeeCode')!" [readonly]="true" [placeholder]="isEditMode ? 'Employee code' : 'Auto-generated on save'">
              <small *ngIf="!isEditMode" style="color:#999;display:block;margin-top:4px">Employee code will be auto-generated as PARI###</small>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Login Role</nz-form-label>
            <nz-form-control>
              <nz-select [formControl]="form.get('userRole')!" nzPlaceHolder="No login access" nzAllowClear>
                <nz-option nzValue="EMPLOYEE" nzLabel="EMPLOYEE"></nz-option>
                <nz-option nzValue="HR" nzLabel="HR"></nz-option>
                <nz-option nzValue="ADMIN" nzLabel="ADMIN"></nz-option>
              </nz-select>
              <small style="color:#999;display:block;margin-top:4px">Creates/updates login account (username = employee code, default password: Admin&#64;123)</small>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Prefix</nz-form-label>
            <nz-form-control>
              <nz-select [formControl]="form.get('prefix')!" nzPlaceHolder="Select prefix">
                <nz-option *ngFor="let opt of prefixOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label nzRequired>First Name *</nz-form-label>
            <nz-form-control nzErrorTip="First name is required">
              <input nz-input [formControl]="form.get('firstName')!" placeholder="Enter first name" maxlength="40">
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label nzRequired>Surname *</nz-form-label>
            <nz-form-control nzErrorTip="Surname is required">
              <input nz-input [formControl]="form.get('surname')!" placeholder="Enter surname" maxlength="40">
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label nzRequired>Gender *</nz-form-label>
            <nz-form-control nzErrorTip="Gender is required">
              <nz-select [formControl]="form.get('gender')!" nzPlaceHolder="Select gender">
                <nz-option *ngFor="let opt of genderOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Marital Status</nz-form-label>
            <nz-form-control>
              <nz-select [formControl]="form.get('maritalStatus')!" nzPlaceHolder="Select status">
                <nz-option *ngFor="let opt of maritalStatusOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>
        </div>
      </div>

      <!-- Family & Kin -->
      <div class="form-section">
        <div class="form-section-header">
          <div class="form-section-icon"><i nz-icon nzType="team"></i></div>
          <h4 class="form-section-title">Family & Kin</h4>
        </div>
        <div class="form-grid">
          <nz-form-item>
            <nz-form-label>Father/Husband Name</nz-form-label>
            <nz-form-control>
              <input nz-input [formControl]="form.get('fatherHusbandName')!" maxlength="40">
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Father/Husband</nz-form-label>
            <nz-form-control>
              <nz-select [formControl]="form.get('fMH')!" nzPlaceHolder="Select">
                <nz-option *ngFor="let opt of fmhOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Occupation of Kin</nz-form-label>
            <nz-form-control>
              <nz-select [formControl]="form.get('occupationKin')!" nzPlaceHolder="Select occupation">
                <nz-option *ngFor="let opt of occupationKinOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Occupation Sub-Category</nz-form-label>
            <nz-form-control>
              <input nz-input [formControl]="form.get('occupationKinSub')!" maxlength="40">
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Ration Card</nz-form-label>
            <nz-form-control>
              <nz-select [formControl]="form.get('rationCard')!" nzPlaceHolder="Select">
                <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>
        </div>
      </div>

      <!-- Education & Dates -->
      <div class="form-section">
        <div class="form-section-header">
          <div class="form-section-icon"><i nz-icon nzType="calendar"></i></div>
          <h4 class="form-section-title">Education & Key Dates</h4>
        </div>
        <div class="form-grid">
          <nz-form-item>
            <nz-form-label>Date of Joining</nz-form-label>
            <nz-form-control>
              <nz-date-picker [formControl]="form.get('doj')!" nzFormat="dd/MM/yyyy"></nz-date-picker>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label nzRequired>Date of Birth *</nz-form-label>
            <nz-form-control [nzErrorTip]="dobError">
              <nz-date-picker [formControl]="form.get('dob')!" nzFormat="dd/MM/yyyy" (ngModelChange)="onDobChange()"></nz-date-picker>
            </nz-form-control>
          </nz-form-item>
          <ng-template #dobError let-control>
            <ng-container *ngIf="control.hasError('required')">Date of birth is required</ng-container>
            <ng-container *ngIf="control.hasError('minAge')">Employee must be at least {{ control.errors?.['minAge']?.requiredAge }} years old (current: {{ control.errors?.['minAge']?.actualAge }})</ng-container>
          </ng-template>

          <nz-form-item>
            <nz-form-label>Age</nz-form-label>
            <nz-form-control>
              <input nz-input [formControl]="form.get('age')!" readonly>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Age Bracket</nz-form-label>
            <nz-form-control>
              <input nz-input [formControl]="form.get('ageBracket')!" readonly>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Highest Qualification</nz-form-label>
            <nz-form-control>
              <nz-select [formControl]="form.get('highestQualification')!" nzPlaceHolder="Select qualification">
                <nz-option *ngFor="let opt of qualificationOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Level of Education</nz-form-label>
            <nz-form-control>
              <nz-select [formControl]="form.get('levelOfEducation')!" nzPlaceHolder="Select level">
                <nz-option *ngFor="let opt of educationLevelOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Year of Passing</nz-form-label>
            <nz-form-control [nzErrorTip]="yearError">
              <input nz-input type="number" [formControl]="form.get('yearOfPassing')!" min="1950" [max]="currentYear + 1">
            </nz-form-control>
          </nz-form-item>
          <ng-template #yearError let-control>
            <ng-container *ngIf="control.hasError('min')">Year must be 1950 or later</ng-container>
            <ng-container *ngIf="control.hasError('max')">Year cannot be in the future</ng-container>
          </ng-template>

          <nz-form-item>
            <nz-form-label>% of Marks</nz-form-label>
            <nz-form-control [nzErrorTip]="marksError">
              <input nz-input type="number" [formControl]="form.get('percentageMarks')!" min="0" max="100" step="0.01">
            </nz-form-control>
          </nz-form-item>
          <ng-template #marksError let-control>
            <ng-container *ngIf="control.hasError('min')">Minimum 0%</ng-container>
            <ng-container *ngIf="control.hasError('max')">Maximum 100%</ng-container>
          </ng-template>
        </div>
      </div>

      <!-- Addresses -->
      <div class="form-section">
        <div class="form-section-header">
          <div class="form-section-icon"><i nz-icon nzType="environment"></i></div>
          <h4 class="form-section-title">Addresses</h4>
        </div>
        <div class="form-grid">
          <nz-form-item class="form-grid-full">
            <nz-form-label>Present Address</nz-form-label>
            <nz-form-control>
              <textarea nz-input [formControl]="form.get('presentAddress')!" rows="2" maxlength="256"></textarea>
              <small class="char-count">{{ (form.get('presentAddress')?.value || '').length }}/256</small>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item class="form-grid-full">
            <nz-form-control>
              <label nz-checkbox (ngModelChange)="copyAddress($event)" [ngModel]="sameAsPresent" style="font-weight:500;color:#1f3d6e;">
                Same as Present Address
              </label>
            </nz-form-control>
          </nz-form-item>
          <nz-form-item class="form-grid-full">
            <nz-form-label>Permanent Address</nz-form-label>
            <nz-form-control>
              <textarea nz-input [formControl]="form.get('permanentAddress')!" rows="2" maxlength="256"></textarea>
              <small class="char-count">{{ (form.get('permanentAddress')?.value || '').length }}/256</small>
            </nz-form-control>
          </nz-form-item>
        </div>
      </div>

      <!-- Contact -->
      <div class="form-section">
        <div class="form-section-header">
          <div class="form-section-icon"><i nz-icon nzType="mail"></i></div>
          <h4 class="form-section-title">Contact Details</h4>
        </div>
        <div class="form-grid">
          <nz-form-item>
            <nz-form-label nzRequired>Email *</nz-form-label>
            <nz-form-control [nzErrorTip]="emailError">
              <input nz-input [formControl]="form.get('email')!" placeholder="email@company.com" type="email" maxlength="56">
            </nz-form-control>
          </nz-form-item>
          <ng-template #emailError let-control>
            <ng-container *ngIf="control.hasError('required')">Email is required</ng-container>
            <ng-container *ngIf="control.hasError('email')">Invalid email format</ng-container>
          </ng-template>

          <nz-form-item>
            <nz-form-label nzRequired>Mobile *</nz-form-label>
            <nz-form-control [nzErrorTip]="mobileError">
              <input nz-input [formControl]="form.get('mobile')!" placeholder="9876543210" maxlength="10">
            </nz-form-control>
          </nz-form-item>
          <ng-template #mobileError let-control>
            <ng-container *ngIf="control.hasError('required')">Mobile is required</ng-container>
            <ng-container *ngIf="control.hasError('pattern')">Enter valid 10-digit mobile number</ng-container>
          </ng-template>

          <nz-form-item>
            <nz-form-label>Close Relative Name</nz-form-label>
            <nz-form-control>
              <input nz-input [formControl]="form.get('closeRelativeName')!" maxlength="40">
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Close Relative Mobile</nz-form-label>
            <nz-form-control nzErrorTip="Enter valid 10-digit mobile number">
              <input nz-input [formControl]="form.get('closeRelativeMobile')!" maxlength="10">
            </nz-form-control>
          </nz-form-item>
        </div>
      </div>

      <!-- Languages -->
      <div class="form-section">
        <div class="form-section-header">
          <div class="form-section-icon"><i nz-icon nzType="translation"></i></div>
          <h4 class="form-section-title">Languages</h4>
        </div>
        <div class="lang-add-row">
          <nz-select [ngModel]="selectedLanguage" (ngModelChange)="selectedLanguage = $event" [ngModelOptions]="{standalone: true}" nzPlaceHolder="Select language" style="width:240px">
            <nz-option *ngFor="let opt of availableLanguageOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
          </nz-select>
          <button nz-button nzType="primary" nzSize="small" (click)="addLanguage()" [disabled]="!selectedLanguage">
            <i nz-icon nzType="plus"></i> Add
          </button>
        </div>
        <nz-table *ngIf="languages.length > 0" [nzData]="languages" nzSize="small" nzFrontPagination="false" nzHideOnSinglePage="true" class="lang-table">
          <thead>
            <tr>
              <th>Language</th>
              <th class="lang-check-col">Read</th>
              <th class="lang-check-col">Write</th>
              <th class="lang-check-col">Speak</th>
              <th class="lang-remove-col"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let lang of languages; let i = index">
              <td>{{ lang.language }}</td>
              <td class="lang-check-col"><label nz-checkbox [ngModel]="lang.canRead" (ngModelChange)="lang.canRead = $event" [ngModelOptions]="{standalone: true}"></label></td>
              <td class="lang-check-col"><label nz-checkbox [ngModel]="lang.canWrite" (ngModelChange)="lang.canWrite = $event" [ngModelOptions]="{standalone: true}"></label></td>
              <td class="lang-check-col"><label nz-checkbox [ngModel]="lang.canSpeak" (ngModelChange)="lang.canSpeak = $event" [ngModelOptions]="{standalone: true}"></label></td>
              <td class="lang-remove-col"><button nz-button nzType="text" nzDanger (click)="removeLanguage(i)"><i nz-icon nzType="delete"></i></button></td>
            </tr>
          </tbody>
        </nz-table>
      </div>
    </div>
  `,
  styles: [`
    .tab-container { padding: 24px 0; }
    .form-section {
      background: #ffffff !important;
      border: 1px solid #e8eaed !important;
      border-radius: 10px !important;
      padding: 14px 20px;
      margin-bottom: 10px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04) !important;
    }
    .form-section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 2px solid #e8edf5; }
    .form-section-icon { width: 28px; height: 28px; border-radius: 6px; background: linear-gradient(135deg, #1f3d6e, #16213e); display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
    .form-section-icon i { font-size: 15px; }
    .form-section-title { font-size: 14px; font-weight: 600; color: #1f3d6e; margin: 0; }
    .lang-add-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .lang-check-col { text-align: center; width: 60px; }
    .lang-remove-col { text-align: center; width: 40px; }
    :host ::ng-deep .lang-table .ant-table-thead > tr > th { background: #f8fafc !important; font-size: 12px; color: #374151; padding: 6px 8px !important; }
    :host ::ng-deep .lang-table .ant-table-tbody > tr > td { padding: 6px 8px !important; font-size: 13px; }
  `]
})
export class PersonalInfoTabComponent implements OnInit {
  @Input() form!: any;
  @Input() masterData: any;
  @Input() isEditMode = false;
  @Output() languagesChange = new EventEmitter<EmployeeLanguage[]>();

  currentYear = new Date().getFullYear();
  prefixOptions: { value: string; label: string }[] = [];
  genderOptions: { value: string; label: string }[] = [];
  maritalStatusOptions: { value: string; label: string }[] = [];
  fmhOptions: { value: string; label: string }[] = [];
  occupationKinOptions: { value: string; label: string }[] = [];
  yesNoOptions: { value: string; label: string }[] = [];
  qualificationOptions: { value: string; label: string }[] = [];
  educationLevelOptions: { value: string; label: string }[] = [];
  languageOptions: { value: string; label: string }[] = [];
  sameAsPresent = false;

  selectedLanguage: string | null = null;
  languages: EmployeeLanguage[] = [];

  get availableLanguageOptions(): { value: string; label: string }[] {
    const addedNames = new Set(this.languages.map(l => l.language));
    return this.languageOptions.filter(opt => !addedNames.has(opt.label));
  }

  constructor(private masterDataService: MasterDataService) {}

  ngOnInit(): void {
    this.masterDataService.getByCategory('PREFIX').subscribe(data => {
      this.prefixOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('GENDER').subscribe(data => {
      this.genderOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('MARITAL_STATUS').subscribe(data => {
      this.maritalStatusOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('F_M_H').subscribe(data => {
      this.fmhOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('OCCUPATION_KIN').subscribe(data => {
      this.occupationKinOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('YES_NO').subscribe(data => {
      this.yesNoOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('QUALIFICATION').subscribe(data => {
      this.qualificationOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('EDUCATION_LEVEL').subscribe(data => {
      this.educationLevelOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.refreshCategory('LANGUAGE');
    this.masterDataService.getByCategory('LANGUAGE').subscribe(data => {
      this.languageOptions = data.map(i => ({ value: i.code, label: i.value }));
    });

    // Listen for languages from the form input
    this.form.get('languages')?.valueChanges.subscribe((langs: EmployeeLanguage[]) => {
      if (langs && langs.length > 0) {
        this.languages = langs;
      }
    });
  }

  copyAddress(checked: boolean): void {
    if (checked) {
      const present = this.form.get('presentAddress')?.value || '';
      this.form.get('permanentAddress')?.setValue(present);
    }
  }

  onDobChange(): void {
    const dob = this.form.get('dob')?.value;
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      this.form.get('age')?.setValue(age);
      if (age <= 25) this.form.get('ageBracket')?.setValue('25_BELOW');
      else if (age <= 30) this.form.get('ageBracket')?.setValue('26_30');
      else if (age <= 35) this.form.get('ageBracket')?.setValue('31_35');
      else if (age <= 40) this.form.get('ageBracket')?.setValue('36_40');
      else if (age <= 50) this.form.get('ageBracket')?.setValue('41_50');
      else this.form.get('ageBracket')?.setValue('51_ABOVE');
    }
  }

  addLanguage(): void {
    if (!this.selectedLanguage) return;
    const label = this.languageOptions.find(o => o.value === this.selectedLanguage)?.label || this.selectedLanguage;
    this.languages.push({ language: label, canRead: false, canWrite: false, canSpeak: false });
    this.selectedLanguage = null;
    this.emitLanguages();
  }

  removeLanguage(index: number): void {
    this.languages.splice(index, 1);
    this.emitLanguages();
  }

  private emitLanguages(): void {
    this.languagesChange.emit(this.languages);
  }
}
