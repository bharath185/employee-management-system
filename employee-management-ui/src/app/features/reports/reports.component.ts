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
import { DashboardService } from '../../core/services/dashboard.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { ReportTemplateService, ReportTemplate } from '../../core/services/report-template.service';
import { DashboardStats } from '../../core/models/api-response.model';
import { Employee } from '../../core/models/employee.model';
import { LabourReportsComponent } from '../labour-reports/labour-reports.component';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ReportColumn {
  key: string;
  label: string;
  category: 'Personal' | 'Employment' | 'Demographics' | 'Family' | 'Bank' | 'Verification';
  selected: boolean;
  width?: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzCardModule, NzButtonModule, NzIconModule,
    NzSelectModule, NzInputModule, NzDatePickerModule, NzCheckboxModule, NzRadioModule,
    NzSpinModule, NzGridModule, NzTabsModule, NzTableModule, NzTagModule, NzBadgeModule,
    NzDividerModule, NzModalModule, NzPopconfirmModule,
    LabourReportsComponent
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  activeSection: 'custom' | 'stats' | 'labour' = 'custom';

  // State
  isLoading = false;
  isExporting = false;
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];

  // Quick Filter & Search State
  searchTerm = '';
  dojFilterMode: 'ALL' | 'MONTH_YEAR' | 'YEAR' | 'RANGE' | 'THIS_MONTH' | 'THIS_YEAR' = 'ALL';
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number = new Date().getMonth() + 1;
  dateRange: [Date | null, Date | null] = [null, null];

  // Multi-Criteria Filters
  filterStatus = '';
  filterDesignation = '';
  filterDepartment = '';
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
  sortBy: 'doj' | 'employeeCodeNumeric' | 'name' | 'department' | 'designation' | 'status' | 'dob' = 'doj';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Options Dropdowns
  statusOptions: { value: string; label: string }[] = [];
  designationOptions: { value: string; label: string }[] = [];
  genderOptions: { value: string; label: string }[] = [];
  bloodGroupOptions: { value: string; label: string }[] = [];
  religionOptions: { value: string; label: string }[] = [];
  socialCategoryOptions: { value: string; label: string }[] = [];
  qualificationOptions: { value: string; label: string }[] = [];
  processOptions: string[] = [];
  departmentOptions: string[] = [];

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
    { key: 'fullName', label: 'Full Name', category: 'Personal', selected: true, width: 170 },
    { key: 'gender', label: 'Gender', category: 'Personal', selected: true, width: 90 },
    { key: 'dob', label: 'Date of Birth', category: 'Personal', selected: false, width: 110 },
    { key: 'age', label: 'Age', category: 'Personal', selected: false, width: 70 },
    { key: 'mobile', label: 'Mobile', category: 'Personal', selected: true, width: 120 },
    { key: 'email', label: 'Email', category: 'Personal', selected: true, width: 180 },
    { key: 'presentAddress', label: 'Present Address', category: 'Personal', selected: false, width: 200 },
    { key: 'permanentAddress', label: 'Permanent Address', category: 'Personal', selected: false, width: 200 },
    { key: 'closeRelativeName', label: 'Emergency Contact Name', category: 'Personal', selected: false, width: 150 },
    { key: 'closeRelativeMobile', label: 'Emergency Contact Mobile', category: 'Personal', selected: false, width: 130 },

    // Employment
    { key: 'doj', label: 'Date of Joining', category: 'Employment', selected: true, width: 120 },
    { key: 'employeeStatus', label: 'Status', category: 'Employment', selected: true, width: 110 },
    { key: 'designation', label: 'Designation', category: 'Employment', selected: true, width: 150 },
    { key: 'department', label: 'Department', category: 'Employment', selected: true, width: 140 },
    { key: 'processAssigned', label: 'Process / Unit', category: 'Employment', selected: true, width: 140 },
    { key: 'highestQualification', label: 'Qualification', category: 'Employment', selected: false, width: 130 },
    { key: 'levelOfEducation', label: 'Education Level', category: 'Employment', selected: false, width: 130 },
    { key: 'yearOfPassing', label: 'Year of Passing', category: 'Employment', selected: false, width: 100 },
    { key: 'percentageMarks', label: '% of Marks', category: 'Employment', selected: false, width: 90 },
    { key: 'pastExperience', label: 'Past Experience', category: 'Employment', selected: false, width: 110 },

    // Demographics
    { key: 'aadharNumber', label: 'Aadhar Number', category: 'Demographics', selected: false, width: 130 },
    { key: 'panNumber', label: 'PAN Number', category: 'Demographics', selected: false, width: 110 },
    { key: 'bloodGroup', label: 'Blood Group', category: 'Demographics', selected: false, width: 90 },
    { key: 'religion', label: 'Religion', category: 'Demographics', selected: false, width: 100 },
    { key: 'socialCategory', label: 'Social Category', category: 'Demographics', selected: false, width: 120 },
    { key: 'socialSubcategory', label: 'Subcategory', category: 'Demographics', selected: false, width: 120 },
    { key: 'rationCard', label: 'Ration Card', category: 'Demographics', selected: false, width: 90 },

    // Family
    { key: 'fatherHusbandName', label: 'Father / Husband Name', category: 'Family', selected: false, width: 160 },
    { key: 'fatherName', label: "Father's Name", category: 'Family', selected: false, width: 150 },
    { key: 'fatherPhone', label: "Father's Phone", category: 'Family', selected: false, width: 120 },
    { key: 'motherName', label: "Mother's Name", category: 'Family', selected: false, width: 150 },
    { key: 'motherPhone', label: "Mother's Phone", category: 'Family', selected: false, width: 120 },
    { key: 'spouseName', label: 'Spouse Name', category: 'Family', selected: false, width: 150 },
    { key: 'spousePhone', label: 'Spouse Phone', category: 'Family', selected: false, width: 120 },

    // Bank & Payroll
    { key: 'bankName', label: 'Bank Name', category: 'Bank', selected: false, width: 140 },
    { key: 'accountNumber', label: 'Account Number', category: 'Bank', selected: false, width: 140 },
    { key: 'ifscCode', label: 'IFSC Code', category: 'Bank', selected: false, width: 110 },
    { key: 'branch', label: 'Branch', category: 'Bank', selected: false, width: 130 },
    { key: 'basicSalary', label: 'Basic Salary (₹)', category: 'Bank', selected: false, width: 120 },
    { key: 'grossSalary', label: 'Gross Salary (₹)', category: 'Bank', selected: false, width: 120 },

    // Verification
    { key: 'aadhaarVerification', label: 'Aadhaar Verified', category: 'Verification', selected: false, width: 120 },
    { key: 'panVerification', label: 'PAN Verified', category: 'Verification', selected: false, width: 120 },
    { key: 'osv', label: 'OSV', category: 'Verification', selected: false, width: 80 },
    { key: 'remarks', label: 'Remarks', category: 'Verification', selected: false, width: 160 }
  ];

  // Templates Management
  savedTemplates: ReportTemplate[] = [];
  selectedTemplateId: number | null = null;
  isSaveTemplateModalVisible = false;
  templateFormName = '';
  templateFormDesc = '';

  // Pagination
  pageIndex = 1;
  pageSize = 25;
  pageSizeOptions = [10, 25, 50, 100, 500];

  // Statistics & Demographics Tab State
  statsLoading = false;
  stats: DashboardStats | null = null;
  analytics: any = null;
  demographics: any = null;

  constructor(
    private employeeService: EmployeeService,
    private dashboardService: DashboardService,
    private masterDataService: MasterDataService,
    private templateService: ReportTemplateService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    this.yearsList = [];
    for (let y = currentYear + 1; y >= 2010; y--) {
      this.yearsList.push(y);
    }

    this.loadMasterData();
    this.loadTemplates();
    this.loadReportData();
  }

  get selectedColumns(): ReportColumn[] {
    return this.availableColumns.filter(c => c.selected);
  }

  get columnCategories(): ('Personal' | 'Employment' | 'Demographics' | 'Family' | 'Bank' | 'Verification')[] {
    return ['Personal', 'Employment', 'Demographics', 'Bank', 'Family', 'Verification'];
  }

  getColumnsByCategory(category: string): ReportColumn[] {
    return this.availableColumns.filter(c => c.category === category && (!this.columnSearch || c.label.toLowerCase().includes(this.columnSearch.toLowerCase())));
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
      department: this.filterDepartment || undefined,
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
      params.dojFrom = this.formatDate(this.dateRange[0]);
      params.dojTo = this.formatDate(this.dateRange[1]);
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
          this.extractDistinctDepartments();
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

  private extractDistinctDepartments(): void {
    const depts = new Set<string>();
    this.employees.forEach(e => {
      if (e.department && e.department.trim()) {
        depts.add(e.department.trim());
      }
    });
    this.departmentOptions = Array.from(depts).sort();
  }

  formatDate(d: Date): string {
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
    this.filterDepartment = '';
    this.filterProcess = '';
    this.filterGender = '';
    this.filterBloodGroup = '';
    this.filterReligion = '';
    this.filterSocialCategory = '';
    this.filterSocialSubcategory = '';
    this.filterQualification = '';
    this.filterAadhaarVerification = '';
    this.filterPanVerification = '';
    this.sortBy = 'doj';
    this.sortDirection = 'desc';
    this.selectedTemplateId = null;

    this.applyFilters();
    this.notification.info('Filters Reset', 'All report filters have been reset to default.');
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
        return [emp.firstName, emp.surname].filter(Boolean).join(' ') || '-';
      case 'doj':
      case 'dob':
        return (emp as any)[colKey] || '-';
      case 'basicSalary':
        return (emp as any).basicSalary ? '₹' + Number((emp as any).basicSalary).toLocaleString('en-IN') : '-';
      case 'grossSalary':
        return (emp as any).grossSalary ? '₹' + Number((emp as any).grossSalary).toLocaleString('en-IN') : '-';
      case 'age':
        return emp.age != null ? emp.age : (emp.dob ? this.calculateAge(emp.dob) : '-');
      default:
        const val = (emp as any)[colKey];
        return (val !== undefined && val !== null && val !== '') ? val : '-';
    }
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
  applyColumnPreset(preset: 'standard' | 'onboarding' | 'payroll' | 'demographics' | 'all' | 'clear'): void {
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
      const keys = ['employeeCode', 'fullName', 'gender', 'mobile', 'email', 'doj', 'employeeStatus', 'designation', 'department', 'processAssigned'];
      this.availableColumns.forEach(c => c.selected = keys.includes(c.key));
    } else if (preset === 'onboarding') {
      const keys = ['employeeCode', 'fullName', 'gender', 'doj', 'designation', 'processAssigned', 'mobile', 'email', 'aadharNumber', 'bankName', 'accountNumber', 'employeeStatus'];
      this.availableColumns.forEach(c => c.selected = keys.includes(c.key));
    } else if (preset === 'payroll') {
      const keys = ['employeeCode', 'fullName', 'designation', 'department', 'bankName', 'accountNumber', 'ifscCode', 'branch', 'basicSalary', 'grossSalary', 'employeeStatus'];
      this.availableColumns.forEach(c => c.selected = keys.includes(c.key));
    } else if (preset === 'demographics') {
      const keys = ['employeeCode', 'fullName', 'gender', 'dob', 'age', 'bloodGroup', 'religion', 'socialCategory', 'socialSubcategory', 'highestQualification', 'presentAddress'];
      this.availableColumns.forEach(c => c.selected = keys.includes(c.key));
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
      filterDepartment: this.filterDepartment,
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
        this.filterDepartment = filters.filterDepartment || '';
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

  // Legacy Stats Tab Loading
  getStatValue(key: string): number {
    if (!this.stats) return 0;
    return (this.stats as any)[key] || 0;
  }

  loadStats(): void {
    this.statsLoading = true;
    this.dashboardService.getStats().subscribe({
      next: (response) => {
        this.statsLoading = false;
        if (response.success) {
          this.stats = response.data;
        }
      },
      error: () => {
        this.statsLoading = false;
        this.notification.error('Error', 'Error loading statistics');
      }
    });
  }

  statItems = [
    { key: 'totalEmployees', label: 'Total Employees', icon: 'team' },
    { key: 'activeEmployees', label: 'Active Employees', icon: 'check-circle' },
    { key: 'maleCount', label: 'Male', icon: 'man' },
    { key: 'femaleCount', label: 'Female', icon: 'woman' },
    { key: 'exitedEmployees', label: 'Exited', icon: 'logout' },
    { key: 'newThisMonth', label: 'New This Month', icon: 'user-add' },
  ];
}
