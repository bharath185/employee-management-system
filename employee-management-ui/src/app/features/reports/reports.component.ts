import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';

import { EmployeeService } from '../../core/services/employee.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { ReportTemplateService, ReportTemplate } from '../../core/services/report-template.service';
import { Employee } from '../../core/models/employee.model';
import { LabourReportsComponent } from '../labour-reports/labour-reports.component';
import { FormFieldConfigService, FormFieldConfig } from '../../core/services/form-field-config.service';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ReportColumn {
  key: string;
  label: string;
  category: 'Personal' | 'Employment' | 'Demographics' | 'Family' | 'Bank' | 'Verification' | 'Custom Fields';
  selected: boolean;
  width?: number;
  isCustom?: boolean;
}

import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzCardModule, NzButtonModule, NzIconModule,
    NzSelectModule, NzInputModule, NzDatePickerModule, NzCheckboxModule, NzRadioModule,
    NzSpinModule, NzGridModule, NzTabsModule, NzTableModule, NzTagModule, NzBadgeModule,
    NzDividerModule, NzModalModule, NzPopconfirmModule, NzToolTipModule,
    LabourReportsComponent
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  Math = Math;
  activeSection: 'custom' | 'labour' = 'custom';
  isFiltersCollapsed = false;
  isAdvancedFiltersOpen = false;

  // State
  isLoading = false;
  isExporting = false;
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];

  private avatarColors: string[] = [
    'linear-gradient(135deg, #1f3d6e, #2a5298)',
    'linear-gradient(135deg, #2e7d32, #43a047)',
    'linear-gradient(135deg, #c62828, #e53935)',
    'linear-gradient(135deg, #e65100, #ff6d00)',
    'linear-gradient(135deg, #4a148c, #7b1fa2)',
    'linear-gradient(135deg, #004d40, #00897b)',
    'linear-gradient(135deg, #0d47a1, #1976d2)',
    'linear-gradient(135deg, #880e4f, #c2185b)',
    'linear-gradient(135deg, #3e2723, #5d4037)',
    'linear-gradient(135deg, #37474f, #607d8b)'
  ];

  getAvatarColor(code?: string): string {
    const index = (code?.length || 0) % this.avatarColors.length;
    return this.avatarColors[index];
  }

  getPhotoUrl(photoPath?: string): string {
    if (!photoPath) return '';
    const raw = photoPath.trim();
    if (raw.startsWith('data:image/') || raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }
    const clean = raw.replace(/\\/g, '/');
    return clean.startsWith('/') ? clean : '/' + clean;
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  get advancedFilterCount(): number {
    let count = 0;
    if (this.filterDesignation) count++;
    if (this.filterGender) count++;
    if (this.filterBloodGroup) count++;
    if (this.filterSocialCategory) count++;
    if (this.filterSocialSubcategory) count++;
    if (this.filterReligion) count++;
    if (this.filterQualification) count++;
    if (this.filterAadhaarVerification) count++;
    if (this.filterPanVerification) count++;
    if (this.dojFilterMode !== 'ALL') count++;
    return count;
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.searchTerm) count++;
    if (this.filterProcess) count++;
    if (this.filterStatus) count++;
    return count + this.advancedFilterCount;
  }

  clearFilter(filterKey: string): void {
    if (filterKey === 'search') this.searchTerm = '';
    if (filterKey === 'process') this.filterProcess = '';
    if (filterKey === 'status') this.filterStatus = '';
    if (filterKey === 'doj') {
      this.dojFilterMode = 'ALL';
      this.dateRange = [null, null];
    }
    if (filterKey === 'designation') this.filterDesignation = '';
    if (filterKey === 'gender') this.filterGender = '';
    if (filterKey === 'bloodGroup') this.filterBloodGroup = '';
    if (filterKey === 'socialCategory') this.filterSocialCategory = '';
    if (filterKey === 'socialSubcategory') this.filterSocialSubcategory = '';
    if (filterKey === 'religion') this.filterReligion = '';
    if (filterKey === 'qualification') this.filterQualification = '';
    if (filterKey === 'aadhaar') this.filterAadhaarVerification = '';
    if (filterKey === 'pan') this.filterPanVerification = '';
    this.applyFilters();
  }

  // Quick Filter & Search State
  searchTerm = '';
  dojFilterMode: 'ALL' | 'MONTH_YEAR' | 'YEAR' | 'RANGE' | 'THIS_MONTH' | 'THIS_YEAR' = 'ALL';
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number = new Date().getMonth() + 1;
  dateRange: [Date | null, Date | null] = [null, null];

  // Multi-Criteria Filters
  filterStatus = '';
  filterDesignation = '';
  filterProcess = '';
  filterGender = '';
  filterBloodGroup = '';
  filterReligion = '';
  filterSocialCategory = '';
  filterSocialSubcategory = '';
  filterQualification = '';
  filterAadhaarVerification = '';
  filterPanVerification = '';

  // Sorting
  sortBy: 'employeeCodeNumeric' | 'doj' | 'name' | 'designation' | 'status' | 'dob' = 'employeeCodeNumeric';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Options Dropdowns
  statusOptions: { value: string; label: string }[] = [];
  designationOptions: { value: string; label: string }[] = [];
  genderOptions: { value: string; label: string }[] = [];
  bloodGroupOptions: { value: string; label: string }[] = [];
  religionOptions: { value: string; label: string }[] = [];
  socialCategoryOptions: { value: string; label: string }[] = [];
  qualificationOptions: { value: string; label: string }[] = [];
  processOptions: string[] = [];

  yearsList: number[] = [];
  monthsList = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  // Column Selector State
  isColumnModalVisible = false;
  columnSearch = '';
  availableColumns: ReportColumn[] = [
    // Personal
    { key: 'employeeCode', label: 'Emp Code', category: 'Personal', selected: true, width: 110 },
    { key: 'fullName', label: 'Full Name', category: 'Personal', selected: true, width: 240 },
    { key: 'gender', label: 'Gender', category: 'Personal', selected: true, width: 90 },
    { key: 'dob', label: 'Date of Birth', category: 'Personal', selected: false, width: 120 },
    { key: 'age', label: 'Age', category: 'Personal', selected: false, width: 80 },
    { key: 'mobile', label: 'Mobile', category: 'Personal', selected: true, width: 130 },
    { key: 'email', label: 'Email', category: 'Personal', selected: true, width: 220 },
    { key: 'presentAddress', label: 'Present Address', category: 'Personal', selected: false, width: 240 },
    { key: 'permanentAddress', label: 'Permanent Address', category: 'Personal', selected: false, width: 240 },
    { key: 'closeRelativeName', label: 'Emergency Contact Name', category: 'Personal', selected: false, width: 190 },
    { key: 'closeRelativeMobile', label: 'Emergency Contact Mobile', category: 'Personal', selected: false, width: 150 },

    // Employment
    { key: 'doj', label: 'Date of Joining', category: 'Employment', selected: true, width: 120 },
    { key: 'employeeStatus', label: 'Status', category: 'Employment', selected: true, width: 110 },
    { key: 'designation', label: 'Designation', category: 'Employment', selected: true, width: 180 },
    { key: 'processAssigned', label: 'Process / Unit', category: 'Employment', selected: true, width: 160 },
    { key: 'highestQualification', label: 'Qualification', category: 'Employment', selected: false, width: 160 },
    { key: 'levelOfEducation', label: 'Education Level', category: 'Employment', selected: false, width: 160 },
    { key: 'yearOfPassing', label: 'Year of Passing', category: 'Employment', selected: false, width: 130 },
    { key: 'percentageMarks', label: '% of Marks', category: 'Employment', selected: false, width: 110 },
    { key: 'pastExperience', label: 'Past Experience', category: 'Employment', selected: false, width: 150 },

    // Demographics
    { key: 'aadharNumber', label: 'Aadhar Number', category: 'Demographics', selected: false, width: 150 },
    { key: 'panNumber', label: 'PAN Number', category: 'Demographics', selected: false, width: 130 },
    { key: 'bloodGroup', label: 'Blood Group', category: 'Demographics', selected: false, width: 110 },
    { key: 'religion', label: 'Religion', category: 'Demographics', selected: false, width: 120 },
    { key: 'socialCategory', label: 'Social Category', category: 'Demographics', selected: false, width: 140 },
    { key: 'socialSubcategory', label: 'Subcategory', category: 'Demographics', selected: false, width: 140 },
    { key: 'rationCard', label: 'Ration Card', category: 'Demographics', selected: false, width: 120 },

    // Family
    { key: 'fatherHusbandName', label: 'Father / Husband Name', category: 'Family', selected: false, width: 190 },
    { key: 'fatherName', label: "Father's Name", category: 'Family', selected: false, width: 180 },
    { key: 'fatherPhone', label: "Father's Phone", category: 'Family', selected: false, width: 140 },
    { key: 'motherName', label: "Mother's Name", category: 'Family', selected: false, width: 180 },
    { key: 'motherPhone', label: "Mother's Phone", category: 'Family', selected: false, width: 140 },
    { key: 'spouseName', label: 'Spouse Name', category: 'Family', selected: false, width: 180 },
    { key: 'spousePhone', label: 'Spouse Phone', category: 'Family', selected: false, width: 140 },

    // Bank & Payroll
    { key: 'bankName', label: 'Bank Name', category: 'Bank', selected: false, width: 170 },
    { key: 'accountNumber', label: 'Account Number', category: 'Bank', selected: false, width: 170 },
    { key: 'ifscCode', label: 'IFSC Code', category: 'Bank', selected: false, width: 130 },
    { key: 'branch', label: 'Branch', category: 'Bank', selected: false, width: 150 },
    { key: 'basicSalary', label: 'Basic Salary (₹)', category: 'Bank', selected: false, width: 140 },
    { key: 'grossSalary', label: 'Gross Salary (₹)', category: 'Bank', selected: false, width: 140 },

    // Verification
    { key: 'aadhaarVerification', label: 'Aadhaar Verified', category: 'Verification', selected: false, width: 150 },
    { key: 'panVerification', label: 'PAN Verified', category: 'Verification', selected: false, width: 140 },
    { key: 'osv', label: 'OSV', category: 'Verification', selected: false, width: 100 },
    { key: 'remarks', label: 'Remarks', category: 'Verification', selected: false, width: 190 }
  ];

  get tableScrollWidth(): string {
    const colsWidth = this.selectedColumns.reduce((sum, c) => sum + (c.width || 150), 0);
    return Math.max(colsWidth + 120, 1200) + 'px';
  }

  // Templates Management
  savedTemplates: ReportTemplate[] = [];
  selectedTemplateId: number | null = null;
  isSaveTemplateModalVisible = false;
  templateFormName = '';
  templateFormDesc = '';

  // Pagination
  pageIndex = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 50, 100, 500];

  constructor(
    private employeeService: EmployeeService,
    private masterDataService: MasterDataService,
    private templateService: ReportTemplateService,
    private formFieldConfigService: FormFieldConfigService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    this.yearsList = [];
    for (let y = currentYear + 1; y >= 2010; y--) {
      this.yearsList.push(y);
    }

    this.loadMasterData();
    this.loadFieldConfigurations();
    this.loadTemplates();
    this.loadReportData();
  }

  openColumnModal(): void {
    this.loadFieldConfigurations();
    this.isColumnModalVisible = true;
  }

  get selectedColumns(): ReportColumn[] {
    return this.availableColumns.filter(c => c.selected);
  }

  get columnCategories(): ('Personal' | 'Employment' | 'Custom Fields' | 'Demographics' | 'Family' | 'Bank' | 'Verification')[] {
    const cats: ('Personal' | 'Employment' | 'Custom Fields' | 'Demographics' | 'Family' | 'Bank' | 'Verification')[] = [
      'Personal', 'Employment'
    ];
    if (this.availableColumns.some(c => c.category === 'Custom Fields')) {
      cats.push('Custom Fields');
    }
    cats.push('Demographics', 'Bank', 'Family', 'Verification');
    return cats;
  }

  getColumnsByCategory(category: string): ReportColumn[] {
    return this.availableColumns.filter(c => {
      if (c.category !== category) return false;
      if (!this.columnSearch) return true;
      const q = this.columnSearch.toLowerCase();
      return (c.label && c.label.toLowerCase().includes(q)) || (c.key && c.key.toLowerCase().includes(q));
    });
  }

  loadFieldConfigurations(): void {
    this.formFieldConfigService.getVisibleConfigs().subscribe({
      next: (configs) => {
        const customConfigs = (configs || []).filter(c => c.isCustom);
        customConfigs.forEach(cfg => {
          const existing = this.availableColumns.find(col => col.key === cfg.fieldKey);
          if (existing) {
            existing.label = cfg.fieldLabel;
          } else {
            this.availableColumns.push({
              key: cfg.fieldKey,
              label: cfg.fieldLabel,
              category: 'Custom Fields',
              selected: false,
              width: 140,
              isCustom: true
            });
          }
        });
      },
      error: () => {}
    });
  }

  loadMasterData(): void {
    this.masterDataService.getByCategory('EMPLOYEE_STATUS').subscribe(data => {
      this.statusOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('DESIGNATION').subscribe(data => {
      this.designationOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('GENDER').subscribe(data => {
      this.genderOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('BLOOD_GROUP').subscribe(data => {
      this.bloodGroupOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('RELIGION').subscribe(data => {
      this.religionOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('SOCIAL_CATEGORY').subscribe(data => {
      this.socialCategoryOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('QUALIFICATION').subscribe(data => {
      this.qualificationOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.employeeService.getProcessOptions().subscribe(res => {
      if (res?.data) this.processOptions = res.data;
    });
  }

  loadTemplates(): void {
    this.templateService.getTemplates('EMPLOYEE').subscribe(res => {
      if (res?.data) {
        this.savedTemplates = res.data;
      }
    });
  }

  loadReportData(): void {
    this.isLoading = true;

    const params: any = {
      search: this.searchTerm || undefined,
      employeeStatus: this.filterStatus || undefined,
      designation: this.filterDesignation || undefined,
      processAssigned: this.filterProcess || undefined,
      gender: this.filterGender || undefined,
      bloodGroup: this.filterBloodGroup || undefined,
      religion: this.filterReligion || undefined,
      socialCategory: this.filterSocialCategory || undefined,
      socialSubcategory: this.filterSocialSubcategory || undefined,
      highestQualification: this.filterQualification || undefined,
      aadhaarVerification: this.filterAadhaarVerification || undefined,
      panVerification: this.filterPanVerification || undefined,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    // Date filters based on mode
    if (this.dojFilterMode === 'MONTH_YEAR') {
      params.dojYear = this.selectedYear;
      params.dojMonth = this.selectedMonth;
    } else if (this.dojFilterMode === 'YEAR') {
      params.dojYear = this.selectedYear;
    } else if (this.dojFilterMode === 'RANGE' && this.dateRange && this.dateRange[0] && this.dateRange[1]) {
      params.dojFrom = this.toIsoDateString(this.dateRange[0]);
      params.dojTo = this.toIsoDateString(this.dateRange[1]);
    } else if (this.dojFilterMode === 'THIS_MONTH') {
      const now = new Date();
      params.dojYear = now.getFullYear();
      params.dojMonth = now.getMonth() + 1;
    } else if (this.dojFilterMode === 'THIS_YEAR') {
      params.dojYear = new Date().getFullYear();
    }

    this.employeeService.getCustomReportEmployees(params).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res?.data) {
          this.employees = res.data;
          this.filteredEmployees = res.data;
        } else {
          this.employees = [];
          this.filteredEmployees = [];
        }
      },
      error: () => {
        this.isLoading = false;
        this.notification.error('Error', 'Failed to fetch employee report data');
      }
    });
  }

  toIsoDateString(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  applyFilters(): void {
    this.pageIndex = 1;
    this.loadReportData();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.dojFilterMode = 'ALL';
    this.selectedYear = new Date().getFullYear();
    this.selectedMonth = new Date().getMonth() + 1;
    this.dateRange = [null, null];
    this.filterStatus = '';
    this.filterDesignation = '';
    this.filterProcess = '';
    this.filterGender = '';
    this.filterBloodGroup = '';
    this.filterReligion = '';
    this.filterSocialCategory = '';
    this.filterSocialSubcategory = '';
    this.filterQualification = '';
    this.filterAadhaarVerification = '';
    this.filterPanVerification = '';
    this.sortBy = 'employeeCodeNumeric';
    this.sortDirection = 'asc';
    this.selectedTemplateId = null;

    this.applyFilters();
    this.notification.info('Filters Reset', 'All report filters have been reset to default.');
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  // Quick Stats KPI
  get activeCount(): number {
    return this.filteredEmployees.filter(e => (e.employeeStatus || '').toUpperCase() === 'ACTIVE').length;
  }

  get exitedCount(): number {
    return this.filteredEmployees.filter(e => ['RESIGNED', 'TERMINATED', 'EXITED'].includes((e.employeeStatus || '').toUpperCase())).length;
  }

  get maleCount(): number {
    return this.filteredEmployees.filter(e => (e.gender || '').toUpperCase() === 'MALE' || (e.gender || '').toUpperCase() === 'M').length;
  }

  get femaleCount(): number {
    return this.filteredEmployees.filter(e => (e.gender || '').toUpperCase() === 'FEMALE' || (e.gender || '').toUpperCase() === 'F').length;
  }

  // Value formatting helper for table cells
  getCellValue(emp: Employee, colKey: string): any {
    switch (colKey) {
      case 'fullName':
        return [emp.firstName, emp.middleName, emp.surname].filter(Boolean).join(' ') || '-';
      case 'doj':
      case 'dob':
      case 'doe':
        return this.formatDate((emp as any)[colKey]);
      case 'basicSalary':
        return (emp as any).basicSalary ? '₹' + Number((emp as any).basicSalary).toLocaleString('en-IN') : '-';
      case 'grossSalary':
        return (emp as any).grossSalary ? '₹' + Number((emp as any).grossSalary).toLocaleString('en-IN') : '-';
      case 'age':
        return emp.age != null ? emp.age : (emp.dob ? this.calculateAge(emp.dob) : '-');
      default:
        const val = (emp as any)[colKey];
        if (val !== undefined && val !== null && val !== '') {
          return val;
        }
        if (emp.customFields) {
          try {
            const parsed = typeof emp.customFields === 'string' ? JSON.parse(emp.customFields) : emp.customFields;
            if (parsed && parsed[colKey] !== undefined && parsed[colKey] !== null && parsed[colKey] !== '') {
              return parsed[colKey];
            }
          } catch {}
        }
        return '-';
    }
  }

  formatDate(val: any): string {
    if (!val) return '-';
    if (typeof val === 'string') {
      const trimmed = val.trim();
      const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return `${match[3]}/${match[2]}/${match[1]}`;
      }
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private calculateAge(dobStr: string): number | string {
    try {
      const dob = new Date(dobStr);
      const diff = Date.now() - dob.getTime();
      const ageDate = new Date(diff);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    } catch {
      return '-';
    }
  }

  // Preset Column Configurations
  applyColumnPreset(preset: 'standard' | 'onboarding' | 'payroll' | 'demographics' | 'custom' | 'all' | 'clear'): void {
    if (preset === 'all') {
      this.availableColumns.forEach(c => c.selected = true);
    } else if (preset === 'clear') {
      this.availableColumns.forEach(c => c.selected = false);
      // Keep basic required
      const req = this.availableColumns.find(c => c.key === 'employeeCode');
      if (req) req.selected = true;
      const name = this.availableColumns.find(c => c.key === 'fullName');
      if (name) name.selected = true;
    } else if (preset === 'standard') {
      const keys = ['employeeCode', 'fullName', 'gender', 'mobile', 'email', 'doj', 'employeeStatus', 'designation', 'processAssigned'];
      this.availableColumns.forEach(c => c.selected = keys.includes(c.key));
    } else if (preset === 'onboarding') {
      const keys = ['employeeCode', 'fullName', 'gender', 'doj', 'designation', 'processAssigned', 'mobile', 'email', 'aadharNumber', 'bankName', 'accountNumber', 'employeeStatus'];
      this.availableColumns.forEach(c => c.selected = keys.includes(c.key));
    } else if (preset === 'payroll') {
      const keys = ['employeeCode', 'fullName', 'designation', 'bankName', 'accountNumber', 'ifscCode', 'branch', 'basicSalary', 'grossSalary', 'employeeStatus'];
      this.availableColumns.forEach(c => c.selected = keys.includes(c.key));
    } else if (preset === 'demographics') {
      const keys = ['employeeCode', 'fullName', 'gender', 'dob', 'age', 'bloodGroup', 'religion', 'socialCategory', 'socialSubcategory', 'highestQualification', 'presentAddress'];
      this.availableColumns.forEach(c => c.selected = keys.includes(c.key));
    } else if (preset === 'custom') {
      this.availableColumns.forEach(c => {
        if (c.category === 'Custom Fields' || c.isCustom) {
          c.selected = true;
        }
      });
    }
  }

  // Template Management Actions
  openSaveTemplateModal(): void {
    this.templateFormName = '';
    this.templateFormDesc = '';
    this.isSaveTemplateModalVisible = true;
  }

  saveCurrentAsTemplate(): void {
    if (!this.templateFormName || !this.templateFormName.trim()) {
      this.notification.warning('Validation', 'Please enter a template name');
      return;
    }

    const filters = {
      searchTerm: this.searchTerm,
      dojFilterMode: this.dojFilterMode,
      selectedYear: this.selectedYear,
      selectedMonth: this.selectedMonth,
      dateRange: this.dateRange,
      filterStatus: this.filterStatus,
      filterDesignation: this.filterDesignation,
      filterProcess: this.filterProcess,
      filterGender: this.filterGender,
      filterBloodGroup: this.filterBloodGroup,
      filterReligion: this.filterReligion,
      filterSocialCategory: this.filterSocialCategory,
      filterSocialSubcategory: this.filterSocialSubcategory,
      filterQualification: this.filterQualification,
      filterAadhaarVerification: this.filterAadhaarVerification,
      filterPanVerification: this.filterPanVerification
    };

    const selectedColKeys = this.selectedColumns.map(c => c.key);

    const template: ReportTemplate = {
      name: this.templateFormName.trim(),
      description: this.templateFormDesc.trim(),
      category: 'EMPLOYEE',
      filtersJson: JSON.stringify(filters),
      columnsJson: JSON.stringify(selectedColKeys),
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    this.templateService.saveTemplate(template).subscribe({
      next: (res) => {
        this.isSaveTemplateModalVisible = false;
        this.loadTemplates();
        if (res?.data?.id) this.selectedTemplateId = res.data.id;
        this.notification.success('Success', `Report template "${template.name}" saved successfully!`);
      },
      error: () => {
        this.notification.error('Error', 'Failed to save report template');
      }
    });
  }

  onTemplateChange(templateId: number | null): void {
    if (!templateId) return;
    const t = this.savedTemplates.find(item => item.id === templateId);
    if (!t) return;

    try {
      if (t.filtersJson) {
        const filters = JSON.parse(t.filtersJson);
        this.searchTerm = filters.searchTerm || '';
        this.dojFilterMode = filters.dojFilterMode || 'ALL';
        this.selectedYear = filters.selectedYear || new Date().getFullYear();
        this.selectedMonth = filters.selectedMonth || (new Date().getMonth() + 1);
        if (filters.dateRange && Array.isArray(filters.dateRange)) {
          this.dateRange = [filters.dateRange[0] ? new Date(filters.dateRange[0]) : null, filters.dateRange[1] ? new Date(filters.dateRange[1]) : null];
        } else {
          this.dateRange = [null, null];
        }
        this.filterStatus = filters.filterStatus || '';
        this.filterDesignation = filters.filterDesignation || '';
        this.filterProcess = filters.filterProcess || '';
        this.filterGender = filters.filterGender || '';
        this.filterBloodGroup = filters.filterBloodGroup || '';
        this.filterReligion = filters.filterReligion || '';
        this.filterSocialCategory = filters.filterSocialCategory || '';
        this.filterSocialSubcategory = filters.filterSocialSubcategory || '';
        this.filterQualification = filters.filterQualification || '';
        this.filterAadhaarVerification = filters.filterAadhaarVerification || '';
        this.filterPanVerification = filters.filterPanVerification || '';
      }

      if (t.columnsJson) {
        const colKeys: string[] = JSON.parse(t.columnsJson);
        this.availableColumns.forEach(c => {
          c.selected = colKeys.includes(c.key);
        });
      }

      if (t.sortBy) this.sortBy = t.sortBy as any;
      if (t.sortDirection) this.sortDirection = t.sortDirection as any;

      this.applyFilters();
      this.notification.success('Template Loaded', `Applied "${t.name}" settings.`);
    } catch {
      this.notification.error('Error', 'Failed to parse template configuration');
    }
  }

  deleteCurrentTemplate(): void {
    if (!this.selectedTemplateId) return;
    const id = this.selectedTemplateId;
    this.templateService.deleteTemplate(id).subscribe({
      next: () => {
        this.selectedTemplateId = null;
        this.loadTemplates();
        this.notification.success('Success', 'Template deleted successfully');
      },
      error: () => {
        this.notification.error('Error', 'Failed to delete template');
      }
    });
  }

  // Export to Excel (.xlsx)
  exportCustomExcel(): void {
    if (this.filteredEmployees.length === 0) {
      this.notification.warning('Empty Data', 'No employee records to export');
      return;
    }

    this.isExporting = true;

    try {
      const activeCols = this.selectedColumns;
      const headers = activeCols.map(c => c.label);

      // Data Rows
      const rows = this.filteredEmployees.map(emp => {
        const row: any = {};
        activeCols.forEach(col => {
          row[col.label] = this.getCellValue(emp, col.key);
        });
        return row;
      });

      // Create Worksheet
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(rows, { header: headers });

      // Auto-fit column widths
      const colWidths = headers.map((h, i) => {
        let maxLen = h.length;
        this.filteredEmployees.forEach(emp => {
          const val = String(this.getCellValue(emp, activeCols[i].key) || '');
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.min(Math.max(maxLen + 4, 12), 45) };
      });
      ws['!cols'] = colWidths;

      // Create Workbook
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Employee Report');

      // Generate buffer and save
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

      const dateStr = new Date().toISOString().slice(0, 10);
      saveAs(blob, `PRIGENIX_Employee_Report_${dateStr}.xlsx`);

      this.isExporting = false;
      this.notification.success('Excel Exported', `Successfully exported ${this.filteredEmployees.length} employee records.`);
    } catch {
      this.isExporting = false;
      this.notification.error('Error', 'Failed to generate Excel export');
    }
  }

  // Export to CSV
  exportCustomCsv(): void {
    if (this.filteredEmployees.length === 0) {
      this.notification.warning('Empty Data', 'No employee records to export');
      return;
    }

    try {
      const activeCols = this.selectedColumns;
      const headers = activeCols.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');

      const lines = this.filteredEmployees.map(emp => {
        return activeCols.map(col => {
          const val = String(this.getCellValue(emp, col.key) || '');
          return `"${val.replace(/"/g, '""')}"`;
        }).join(',');
      });

      const csvContent = [headers, ...lines].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const dateStr = new Date().toISOString().slice(0, 10);
      saveAs(blob, `PRIGENIX_Employee_Report_${dateStr}.csv`);

      this.notification.success('CSV Exported', `Successfully exported ${this.filteredEmployees.length} employee records.`);
    } catch {
      this.notification.error('Error', 'Failed to generate CSV export');
    }
  }

  // Print Report
  printReport(): void {
    window.print();
  }

  // Graphical Analytics Dashboard State
  isAnalyticsModalVisible = false;

  openAnalyticsDashboard(): void {
    if (this.filteredEmployees.length === 0) {
      this.notification.warning('No Data', 'No filtered records available to generate visual analytics.');
      return;
    }
    this.isAnalyticsModalVisible = true;
  }

  closeAnalyticsDashboard(): void {
    this.isAnalyticsModalVisible = false;
  }

  // Dashboard Summary Metrics
  get analyticsTotalCount(): number {
    return this.filteredEmployees.length;
  }

  get analyticsLiveCount(): number {
    return this.filteredEmployees.filter(e => (e.employeeStatus || '').toUpperCase() === 'LIVE').length;
  }

  get analyticsLivePercent(): number {
    return this.analyticsTotalCount ? Math.round((this.analyticsLiveCount / this.analyticsTotalCount) * 100) : 0;
  }

  get analyticsMaleCount(): number {
    return this.filteredEmployees.filter(e => (e.gender || '').toUpperCase() === 'MALE' || (e.gender || '').toUpperCase() === 'M').length;
  }

  get analyticsFemaleCount(): number {
    return this.filteredEmployees.filter(e => (e.gender || '').toUpperCase() === 'FEMALE' || (e.gender || '').toUpperCase() === 'F').length;
  }

  get analyticsOtherGenderCount(): number {
    return this.analyticsTotalCount - (this.analyticsMaleCount + this.analyticsFemaleCount);
  }

  get analyticsMalePercent(): number {
    return this.analyticsTotalCount ? Math.round((this.analyticsMaleCount / this.analyticsTotalCount) * 100) : 0;
  }

  get analyticsFemalePercent(): number {
    return this.analyticsTotalCount ? Math.round((this.analyticsFemaleCount / this.analyticsTotalCount) * 100) : 0;
  }

  get analyticsOtherGenderPercent(): number {
    return Math.max(0, 100 - (this.analyticsMalePercent + this.analyticsFemalePercent));
  }

  // Status Distribution
  get analyticsStatusBreakdown(): { label: string; count: number; percent: number; color: string; bg: string }[] {
    const total = this.analyticsTotalCount || 1;
    const map = new Map<string, number>();
    this.filteredEmployees.forEach(e => {
      const st = (e.employeeStatus || 'UNSPECIFIED').toUpperCase();
      map.set(st, (map.get(st) || 0) + 1);
    });

    const colorMap: { [key: string]: { label: string; color: string; bg: string } } = {
      'LIVE': { label: 'Live Staff', color: '#10b981', bg: '#ecfdf5' },
      'QUIT': { label: 'Quit', color: '#f59e0b', bg: '#fffbe6' },
      'ASKED_TO_GO': { label: 'Asked To Go', color: '#f97316', bg: '#fff7ed' },
      'STOPPED_COMING': { label: 'Stopped Coming', color: '#64748b', bg: '#f8fafc' },
      'TERMINATED': { label: 'Terminated', color: '#ef4444', bg: '#fef2f2' }
    };

    const result: { label: string; count: number; percent: number; color: string; bg: string }[] = [];
    map.forEach((count, key) => {
      const meta = colorMap[key] || { label: key, color: '#6366f1', bg: '#e0e7ff' };
      result.push({
        label: meta.label,
        count,
        percent: Math.round((count / total) * 100),
        color: meta.color,
        bg: meta.bg
      });
    });

    return result.sort((a, b) => b.count - a.count);
  }

  // Designation Distribution (Top 8)
  get analyticsDesignationBreakdown(): { label: string; count: number; percent: number }[] {
    const total = this.analyticsTotalCount || 1;
    const map = new Map<string, number>();
    this.filteredEmployees.forEach(e => {
      const des = (e.designation || 'Unassigned').trim();
      map.set(des, (map.get(des) || 0) + 1);
    });

    const items: { label: string; count: number; percent: number }[] = [];
    map.forEach((count, label) => {
      items.push({ label, count, percent: Math.round((count / total) * 100) });
    });

    items.sort((a, b) => b.count - a.count);
    return items.slice(0, 8);
  }

  // Process / Unit Distribution
  get analyticsProcessBreakdown(): { label: string; count: number; percent: number; color: string }[] {
    const total = this.analyticsTotalCount || 1;
    const map = new Map<string, number>();
    this.filteredEmployees.forEach(e => {
      const proc = (e.processAssigned || 'General / Unassigned').trim();
      map.set(proc, (map.get(proc) || 0) + 1);
    });

    const colors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];
    const items: { label: string; count: number; percent: number; color: string }[] = [];
    let idx = 0;
    map.forEach((count, label) => {
      items.push({
        label,
        count,
        percent: Math.round((count / total) * 100),
        color: colors[idx % colors.length]
      });
      idx++;
    });

    return items.sort((a, b) => b.count - a.count);
  }

  // Joining Trend (Yearly Bar Heights)
  get analyticsJoiningTrend(): { year: string; count: number; heightPercent: number }[] {
    const map = new Map<string, number>();
    this.filteredEmployees.forEach(e => {
      let yr = 'Unknown';
      if (e.doj) {
        const match = String(e.doj).match(/^(\d{4})/);
        if (match) yr = match[1];
      }
      map.set(yr, (map.get(yr) || 0) + 1);
    });

    const sortedYears = Array.from(map.keys()).sort();
    let maxCount = 1;
    map.forEach(c => { if (c > maxCount) maxCount = c; });

    return sortedYears.map(year => {
      const count = map.get(year) || 0;
      return {
        year,
        count,
        heightPercent: Math.max(15, Math.round((count / maxCount) * 100))
      };
    });
  }

  // Active Filter Summary Labels for Dashboard Header
  get analyticsActiveFilterSummary(): string[] {
    const summary: string[] = [];
    if (this.searchTerm) summary.push(`Search: "${this.searchTerm}"`);
    if (this.filterStatus) summary.push(`Status: ${this.filterStatus}`);
    if (this.filterGender) summary.push(`Gender: ${this.filterGender}`);
    if (this.filterDesignation) summary.push(`Designation: ${this.filterDesignation}`);
    if (this.filterProcess) summary.push(`Process: ${this.filterProcess}`);
    if (this.dojFilterMode !== 'ALL') summary.push(`DOJ Filter Active`);
    if (summary.length === 0) summary.push('All Records (Unfiltered)');
    return summary;
  }
}

