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

import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { MasterDataService } from '../../core/services/master-data.service';
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
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';

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
    <div class="staff-form-container">
      <div class="form-scroll">
        <div class="tab-progress" *ngIf="!isEditMode">
          <div class="tab-progress-bar">
            <div class="tab-progress-fill" [style.width.%]="completedTabs / totalTabs * 100"></div>
          </div>
          <span class="tab-progress-text">{{ completedTabs }} of {{ totalTabs }} tabs completed</span>
        </div>

        <form [formGroup]="employeeForm">
          <nz-tabset class="employee-tabs" [(nzSelectedIndex)]="selectedTabIndex" (nzSelectedIndexChange)="onTabChange($event)">
            <nz-tab nzTitle="Personal Info">
              <app-personal-info-tab [form]="employeeForm" [masterData]="masterData" [isEditMode]="isEditMode" (languagesChange)="onLanguagesChange($event)"></app-personal-info-tab>
            </nz-tab>
            <nz-tab nzTitle="Demographics">
              <app-demographics-tab [form]="employeeForm"></app-demographics-tab>
            </nz-tab>
            <nz-tab nzTitle="Assets">
              <app-assets-tab [form]="employeeForm"></app-assets-tab>
            </nz-tab>
            <nz-tab nzTitle="Identity">
              <app-identity-tab [form]="employeeForm"></app-identity-tab>
            </nz-tab>
            <nz-tab nzTitle="Education">
              <app-education-tab [form]="employeeForm"></app-education-tab>
            </nz-tab>
            <nz-tab nzTitle="Bank">
              <app-bank-tab [form]="employeeForm"></app-bank-tab>
            </nz-tab>
            <nz-tab nzTitle="Employment">
              <app-employment-tab [form]="employeeForm"></app-employment-tab>
            </nz-tab>
            <nz-tab nzTitle="Family">
              <app-family-tab [form]="employeeForm"></app-family-tab>
            </nz-tab>
            <nz-tab nzTitle="Experience & Ref.">
              <app-experience-ref-tab [form]="employeeForm"></app-experience-ref-tab>
            </nz-tab>
            <nz-tab nzTitle="Exit & Docs">
              <app-exit-docs-tab [form]="employeeForm" [existingPhotoUrl]="existingPhotoUrl"
                                 (photoChange)="onPhotoChange($event)"></app-exit-docs-tab>
            </nz-tab>
            <nz-tab nzTitle="Documents" [nzDisabled]="!isEditMode">
              <app-documents-tab [employeeId]="employeeId" [isEditMode]="isEditMode"></app-documents-tab>
            </nz-tab>
          </nz-tabset>
        </form>
      </div>

      <div class="action-bar">
        <div class="action-left">
          <span class="validation-summary" *ngIf="formErrors.length > 0">
            <i nz-icon nzType="warning"></i> {{ formErrors.length }} error(s)
          </span>
        </div>
        <div class="action-right">
          <button nz-button nzType="default" type="button" routerLink="/admin/employees" class="act-btn">Cancel</button>
          <button nz-button nzType="default" type="button" (click)="saveDraft()" [disabled]="isSaving" class="act-btn"><i nz-icon nzType="save"></i> Draft</button>
          <button nz-button nzType="primary" type="button" (click)="saveAndNew()" [disabled]="isSaving" class="act-btn act-primary" [nzLoading]="isSaving">Save & New</button>
          <button nz-button nzType="primary" type="button" (click)="saveAndClose()" [disabled]="isSaving" class="act-btn act-save" [nzLoading]="isSaving">{{ isEditMode ? 'Update' : 'Save & Close' }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .staff-form-container {
      height: calc(100vh - 56px);
      display: flex;
      flex-direction: column;
      width: 100%;
      padding: 0 16px;
      overflow: hidden;
    }
    .form-scroll { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0; }

    /* ===== TAB PROGRESS ===== */
    :host ::ng-deep .tab-progress {
      display: flex; align-items: center; gap: 10px; flex-shrink: 0;
      background: #ffffff !important;
      border: 1px solid #e8eaed !important;
      border-radius: 8px !important;
      padding: 8px 16px;
      margin-bottom: 8px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }
    :host ::ng-deep .tab-progress-bar { flex: 1; height: 5px; background: #e9ecef; border-radius: 3px; overflow: hidden; }
    :host ::ng-deep .tab-progress-fill { height: 100%; background: linear-gradient(90deg, #4361ee, #3a0ca3); border-radius: 3px; transition: width 0.4s ease; }
    :host ::ng-deep .tab-progress-text { font-size: 11px; color: #6c757d; white-space: nowrap; font-weight: 500; }

    /* ===== FORM ===== */
    form { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0; }

    /* ===== TABS ===== */
    .employee-tabs {
      background: #ffffff !important;
      border: 1px solid #e8eaed !important;
      border-radius: 10px !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
      flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0;
    }
    :host ::ng-deep .employee-tabs .ant-tabs-content-holder { flex: 1; overflow: hidden; min-height: 0; padding: 0; }
    :host ::ng-deep .employee-tabs .ant-tabs-content { height: 100%; }
    :host ::ng-deep .employee-tabs .ant-tabs-tabpane {
      height: 100%; overflow-y: auto; padding: 10px 16px !important;
    }
    :host ::ng-deep .employee-tabs .ant-tabs-tab {
      font-size: 12px; padding: 6px 12px; margin: 0 1px;
      color: #6c757d !important;
      transition: all 0.2s ease;
      border-radius: 6px 6px 0 0 !important;
    }
    :host ::ng-deep .employee-tabs .ant-tabs-tab:hover { color: #1f3d6e !important; background: rgba(31,61,110,0.04); }
    :host ::ng-deep .employee-tabs .ant-tabs-tab.ant-tabs-tab-active {
      color: #1f3d6e !important; font-weight: 600;
    }
    :host ::ng-deep .employee-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn { color: #1f3d6e !important; }
    :host ::ng-deep .employee-tabs .ant-tabs-ink-bar { background: #1f3d6e !important; height: 3px !important; border-radius: 3px 3px 0 0; }
    :host ::ng-deep .employee-tabs .ant-tabs-tab.ant-tabs-tab-complete .ant-tabs-tab-btn::before { content: '\\2713'; color: #10b981; margin-right: 3px; font-weight: 700; font-size: 11px; }
    :host ::ng-deep .employee-tabs .ant-tabs-nav {
      padding: 0 16px; margin-bottom: 0; flex-shrink: 0;
      background: #f8fafc !important;
      border-bottom: 1px solid #e8eaed !important;
    }
    :host ::ng-deep .employee-tabs .ant-tabs-nav-wrap { padding-top: 4px; }

    /* ===== TAB INNER COMPONENT OVERRIDES ===== */
    :host ::ng-deep .tab-container { padding: 6px 0 !important; }
    :host ::ng-deep .form-section { margin-bottom: 10px !important; padding: 14px 20px !important; }
    :host ::ng-deep .form-section-header { margin-bottom: 12px !important; padding-bottom: 10px !important; border-bottom-color: #e8edf5 !important; }
    :host ::ng-deep .form-section-header { border-bottom: 2px solid #e8edf5 !important; }
    :host ::ng-deep .form-section-title { font-size: 14px !important; }
    :host ::ng-deep .form-section-icon { width: 28px !important; height: 28px !important; background: linear-gradient(135deg, #1f3d6e, #16213e) !important; }
    :host ::ng-deep .form-section-icon i { font-size: 15px !important; }
    :host ::ng-deep .section-title { font-size: 14px !important; margin: 0 0 12px !important; padding-bottom: 6px !important; }
    :host ::ng-deep .subsection-title { font-size: 13px !important; margin: 0 0 12px !important; }
    :host ::ng-deep .subsection-title i { font-size: 16px !important; }
    :host ::ng-deep .photo-section { padding: 12px 16px !important; margin-top: 16px !important; }

    /* ===== COMPACT FORM GRIDS ===== */
    :host ::ng-deep .form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 24px; }
    :host ::ng-deep .form-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 24px; }
    :host ::ng-deep .form-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px 16px; }
    :host ::ng-deep .form-grid-full { grid-column: 1 / -1; }
    :host ::ng-deep nz-form-item { margin-bottom: 0 !important; }
    :host ::ng-deep .ant-form-item { margin-bottom: 0 !important; }
    :host ::ng-deep .ant-form-item-label { padding: 0 0 2px !important; }
    :host ::ng-deep .ant-form-item-label > label { height: 22px !important; font-size: 12px !important; color: #374151 !important; font-weight: 500 !important; }
    :host ::ng-deep .ant-form-item-control-input { min-height: 30px !important; }
    :host ::ng-deep .ant-input { height: 32px !important; font-size: 13px !important; padding: 4px 10px !important; border-radius: 6px !important; transition: all 0.2s !important; }
    :host ::ng-deep .ant-select { font-size: 13px !important; height: 32px !important; }
    :host ::ng-deep .ant-select-selector { border-radius: 6px !important; padding: 0 10px !important; height: 32px !important; display: flex; align-items: center; }
    :host ::ng-deep .ant-select-selection-item { line-height: 30px !important; font-size: 13px !important; }
    :host ::ng-deep .ant-picker { height: 32px !important; border-radius: 6px !important; padding: 0 10px !important; width: 100% !important; }
    :host ::ng-deep .ant-picker input { font-size: 13px !important; }
    :host ::ng-deep .ant-checkbox-wrapper { font-size: 13px !important; }
    :host ::ng-deep textarea.ant-input { height: auto !important; min-height: 60px !important; resize: vertical; }

    /* ===== FORM INPUT FOCUS STYLING ===== */
    :host ::ng-deep .ant-input:hover { border-color: #4361ee !important; }
    :host ::ng-deep .ant-input:focus, :host ::ng-deep .ant-input-focused { border-color: #4361ee !important; box-shadow: 0 0 0 2px rgba(67,97,238,0.12) !important; }
    :host ::ng-deep .ant-select-selector:hover { border-color: #4361ee !important; }
    :host ::ng-deep .ant-select-focused .ant-select-selector { border-color: #4361ee !important; box-shadow: 0 0 0 2px rgba(67,97,238,0.12) !important; }
    :host ::ng-deep .ant-picker:hover { border-color: #4361ee !important; }
    :host ::ng-deep .ant-picker-focused { border-color: #4361ee !important; box-shadow: 0 0 0 2px rgba(67,97,238,0.12) !important; }
    :host ::ng-deep .ant-checkbox-checked .ant-checkbox-inner { background: #4361ee !important; border-color: #4361ee !important; }

    /* ===== ACTION BAR ===== */
    .action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff !important;
      border: 1px solid #e8eaed !important;
      border-radius: 10px !important;
      padding: 10px 20px;
      margin-top: 8px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
      flex-shrink: 0;
    }
    .action-left { display: flex; align-items: center; }
    .validation-summary { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #ef4444; font-weight: 500; background: #fef2f2; padding: 4px 12px; border-radius: 6px; }
    .action-right { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .act-btn {
      height: 34px; line-height: 34px; border-radius: 8px; font-size: 13px;
      transition: all 0.2s; font-weight: 500;
      min-width: 90px; text-align: center;
    }
    .act-btn i { margin-right: 4px; font-size: 14px; }
    .act-btn[nzType="default"] {
      background: #ffffff !important;
      border: 1px solid #d1d5db !important;
      color: #374151 !important;
    }
    .act-btn[nzType="default"]:hover { border-color: #4361ee !important; color: #4361ee !important; box-shadow: 0 1px 4px rgba(67,97,238,0.1); }
    .act-primary {
      background: linear-gradient(135deg, #4361ee, #3a0ca3) !important;
      border: none !important;
      box-shadow: 0 2px 8px rgba(67,97,238,0.2) !important;
    }
    .act-save {
      background: linear-gradient(135deg, #1f3d6e, #16213e) !important;
      border: none !important;
      box-shadow: 0 2px 8px rgba(31,61,110,0.3) !important;
    }

    /* ===== SCROLLBAR ===== */
    :host ::ng-deep .ant-tabs-tabpane::-webkit-scrollbar { width: 5px; }
    :host ::ng-deep .ant-tabs-tabpane::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px; }
    :host ::ng-deep .ant-tabs-tabpane::-webkit-scrollbar-thumb { background: #c1c7cd; border-radius: 3px; }
    :host ::ng-deep .ant-tabs-tabpane::-webkit-scrollbar-thumb:hover { background: #a0a7ae; }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      :host ::ng-deep .form-grid, :host ::ng-deep .form-grid-3 { grid-template-columns: repeat(2, 1fr); }
      :host ::ng-deep .form-grid-4 { grid-template-columns: repeat(2, 1fr); }
      .action-bar { flex-direction: column; gap: 8px; }
      .action-left { width: 100%; }
      .action-right { width: 100%; justify-content: flex-end; }
      .act-btn { flex: 1; min-width: 0; font-size: 12px; height: 32px; line-height: 32px; }
    }
  `]
})
export class StaffMasterFormComponent implements OnInit, OnDestroy, OnCanDeactivate {
  @ViewChild(ExitDocsTabComponent) exitDocsTab!: ExitDocsTabComponent;

  employeeForm: FormGroup;
  isEditMode = false;
  employeeId: number | null = null;
  isSaving = false;
  masterData: any = {};
  selectedFile: File | null = null;
  existingPhotoUrl: string = '';
  formErrors: string[] = [];
  selectedTabIndex = 0;
  capturedLanguages: any[] = [];
  private previousTabIndex = 0;
  private readonly DRAFT_KEY = 'staff_form_draft';
  private valueChangesSub!: Subscription;

  canDeactivate(): boolean {
    return !this.employeeForm.dirty;
  }

  readonly totalTabs = 11;

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
    ['firstName', 'surname', 'gender', 'dob', 'email', 'mobile', 'employeeCode', 'prefix', 'maritalStatus', 'fatherHusbandName', 'fMH', 'occupationKin', 'occupationKinSub', 'rationCard', 'doj', 'highestQualification', 'levelOfEducation', 'yearOfPassing', 'percentageMarks', 'presentAddress', 'permanentAddress', 'closeRelativeName', 'closeRelativeMobile'],
    ['religion', 'socialCategory', 'socialSubcategory'],
    ['hasTv', 'hasFridge', 'hasLaptop', 'hasWifi', 'has2wheeler', 'has4wheeler'],
    ['bloodGroup', 'aadharNumber', 'panNumber'],
    ['sscStatus', 'intermediateStatus', 'bachelorsDegree', 'mastersDegree', 'aadhaarVerification', 'panVerification', 'osv', 'remarks'],
    ['bankName', 'accountNumber', 'ifscCode', 'branch'],
    ['employeeStatus', 'processAssigned', 'esicNo', 'aadharSeeding', 'uanNo', 'pfNo', 'uanActivation', 'designation'],
    ['fatherName', 'fatherPhone', 'motherName', 'motherPhone', 'spouseName', 'spousePhone'],
    ['pastExperience', 'organizationName', 'periodOfEmployment', 'ref1Name', 'ref1Relationship', 'ref1Address', 'ref1Mobile', 'ref2Name', 'ref2Relationship', 'ref2Address', 'ref2Mobile'],
    ['doe', 'deletionMonth', 'exitType', 'exitReason'],
    []
  ];

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private masterDataService: MasterDataService,
    private route: ActivatedRoute,
    private router: Router,
    private message: NzMessageService,
    private modal: NzModalService,
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
    });

    // Unsaved changes warning
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
      firstName: ['', [Validators.required, Validators.maxLength(40)]],
      surname: ['', [Validators.required, Validators.maxLength(40)]],
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
      },
      error: (err) => {
        this.message.error('Error loading employee data', { nzDuration: 3000 });
        this.router.navigate(['/admin/employees']);
      }
    });
  }

  onTabChange(index: number): void {
    if (this.employeeForm.dirty && index !== this.previousTabIndex) {
      this.modal.confirm({
        nzTitle: 'Unsaved Changes',
        nzContent: 'You have unsaved changes. Are you sure you want to switch tabs?',
        nzOnOk: () => {
          this.previousTabIndex = index;
          this.selectedTabIndex = index;
          this.focusFirstField();
        },
        nzOnCancel: () => {
          this.selectedTabIndex = this.previousTabIndex;
        }
      });
    } else {
      this.previousTabIndex = index;
      this.focusFirstField();
    }
  }

  private focusFirstField(): void {
    setTimeout(() => {
      const firstInput = document.querySelector('.ant-tabs-tabpane-active input, .ant-tabs-tabpane-active nz-select, .ant-tabs-tabpane-active nz-date-picker') as HTMLElement;
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

  private collectFormErrors(): string[] {
    const errors: string[] = [];
    Object.keys(this.employeeForm.controls).forEach(key => {
      const control = this.employeeForm.get(key);
      if (control?.errors) {
        Object.keys(control.errors).forEach(errorKey => {
          errors.push(`${key}: ${errorKey}`);
        });
      }
    });
    return errors;
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

    return employee;
  }

  validateForm(): boolean {
    this.formErrors = this.collectFormErrors();
    Object.keys(this.employeeForm.controls).forEach(key => {
      this.employeeForm.get(key)?.markAsTouched();
    });
    if (this.formErrors.length > 0) {
      setTimeout(() => {
        const firstError = document.querySelector('.ant-form-item-has-error');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const input = firstError.querySelector('input, textarea, nz-select, nz-date-picker') as HTMLElement;
          input?.focus();
        }
      }, 100);
    }
    return this.formErrors.length === 0;
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
    if (!this.isEditMode && !this.validateForm()) {
      this.message.warning('Please fix validation errors before saving', { nzDuration: 3000 });
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
        this.clearDraft();
        this.message.success(response.message || 'Saved successfully', { nzDuration: 3000 });
        this.employeeForm.reset();
        this.employeeForm.get('employeeCode')?.enable();
        this.selectedFile = null;
        this.existingPhotoUrl = '';
        this.employeeForm.markAsPristine();
        this.isEditMode = false;
        this.employeeId = null;
      },
      error: (err) => {
        this.isSaving = false;
        this.message.error(err.message || 'Error saving', { nzDuration: 3000 });
      }
    });
  }

  saveAndClose(): void {
    if (!this.isEditMode && !this.validateForm()) {
      this.message.warning('Please fix validation errors before saving', { nzDuration: 3000 });
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
        this.clearDraft();
        this.message.success(response.message || 'Saved successfully', { nzDuration: 3000 });
        this.router.navigate(['/admin/employees']);
      },
      error: (err) => {
        this.isSaving = false;
        this.message.error(err.message || 'Error saving', { nzDuration: 3000 });
      }
    });
  }
}
