import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';

import { EmployeeService } from '../../core/services/employee.service';
import { Employee } from '../../core/models/employee.model';
import { DateFormatPipe } from '../../shared/pipes/date-format.pipe';
import { TitleCasePipe } from '../../shared/pipes/title-case.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-staff-master-view',
  standalone: true,
  imports: [
    CommonModule,
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
    NzBreadCrumbModule,
    DateFormatPipe,
    TitleCasePipe,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="view-container fade-in">
      <!-- Breadcrumb -->
      <nz-breadcrumb>
        <nz-breadcrumb-item>
          <a routerLink="/admin/dashboard">Dashboard</a>
        </nz-breadcrumb-item>
        <nz-breadcrumb-item>
          <a routerLink="/admin/employees">Staff Master</a>
        </nz-breadcrumb-item>
        <nz-breadcrumb-item *ngIf="employee">
          {{ employee.employeeCode }}
        </nz-breadcrumb-item>
      </nz-breadcrumb>

      <!-- Profile Card -->
      <nz-card class="profile-card" *ngIf="employee" nzBorderless>
        <div class="profile-card-inner">
          <div class="profile-avatar-section">
            <img [src]="photoUrl" alt="Photo" class="profile-avatar-img" *ngIf="employee.photoPath"
                 (error)="onPhotoError($event)">
            <div class="profile-avatar" *ngIf="!employee.photoPath">
              <span class="avatar-initials">{{ getInitials(employee.firstName, employee.surname) }}</span>
            </div>
            <div class="status-dot-lg" [class.status-live]="employee.employeeStatus === 'LIVE'"
                 [class.status-other]="employee.employeeStatus !== 'LIVE'"></div>
          </div>
          <div class="profile-info">
            <h1>{{ employee.prefix ? employee.prefix + '. ' : '' }}{{ employee.firstName }} {{ employee.surname }}</h1>
            <div class="profile-code">{{ employee.employeeCode }}</div>
            <div class="profile-meta">
              <span class="meta-item"><i nz-icon nzType="tool"></i> {{ employee.designation | titleCase }}</span>
              <span class="meta-item"><i nz-icon nzType="mail"></i> {{ employee.email }}</span>
              <span class="meta-item"><i nz-icon nzType="phone"></i> {{ employee.mobile }}</span>
            </div>
          </div>
          <div class="profile-actions">
            <span class="status-badge-view" [class.live]="employee.employeeStatus === 'LIVE'"
                  [class.other]="employee.employeeStatus !== 'LIVE'">
              <span class="dot"></span>
              {{ employee.employeeStatus | titleCase }}
            </span>
            <button nz-button nzType="primary" [routerLink]="['/admin/employees', employee.id, 'edit']">
              <i nz-icon nzType="edit"></i> Edit
            </button>
          </div>
        </div>
      </nz-card>

      <app-loading-spinner [loading]="isLoading" message="Loading employee details..."></app-loading-spinner>

      <!-- Detail Tabs -->
      <div *ngIf="!isLoading && employee" class="detail-tabs-wrapper">
        <nz-tabset class="detail-tabs">
          <nz-tab nzTitle="Personal Info">
            <div class="tab-content">
              <nz-descriptions nzTitle="Basic Information" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Employee Code">{{ employee.employeeCode }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Prefix">{{ employee.prefix || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="First Name">{{ employee.firstName }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Surname">{{ employee.surname }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Gender">{{ employee.gender | titleCase }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Marital Status">{{ employee.maritalStatus | titleCase }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Date of Birth">{{ employee.dob | dateFormat }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Age">{{ employee.age }} yrs</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Age Bracket">{{ employee.ageBracket || '-' }}</nz-descriptions-item>
              </nz-descriptions>

              <nz-descriptions nzTitle="Family & Kin" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Father/Husband Name">{{ employee.fatherHusbandName || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="F/M/H">{{ employee.fMH || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Occupation of Kin">{{ employee.occupationKin || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Occupation Sub-Category">{{ employee.occupationKinSub || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Ration Card">{{ employee.rationCard || '-' }}</nz-descriptions-item>
              </nz-descriptions>

              <nz-descriptions nzTitle="Education" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Highest Qualification">{{ employee.highestQualification || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Level of Education">{{ employee.levelOfEducation || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Year of Passing">{{ employee.yearOfPassing || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="% of Marks">{{ employee.percentageMarks != null ? employee.percentageMarks + '%' : '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Date of Joining">{{ employee.doj | dateFormat }}</nz-descriptions-item>
              </nz-descriptions>

              <nz-descriptions nzTitle="Contact" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Email">{{ employee.email }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Mobile">{{ employee.mobile }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Close Relative">{{ employee.closeRelativeName || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Relative Mobile">{{ employee.closeRelativeMobile || '-' }}</nz-descriptions-item>
              </nz-descriptions>

              <nz-descriptions nzTitle="Addresses" nzBordered [nzColumn]="{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Present Address">{{ employee.presentAddress || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Permanent Address">{{ employee.permanentAddress || '-' }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>

          <nz-tab nzTitle="Demographics">
            <div class="tab-content">
              <nz-descriptions nzTitle="Demographics" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Religion">{{ employee.religion || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Social Category">{{ employee.socialCategory || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Social Subcategory">{{ employee.socialSubcategory || '-' }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>

          <nz-tab nzTitle="Assets">
            <div class="tab-content">
              <div class="assets-grid">
                <div class="asset-card" *ngFor="let asset of assetFields"
                     [class.owned]="getAssetValue(asset.key) === 'YES'">
                  <i nz-icon [nzType]="getAssetValue(asset.key) === 'YES' ? 'check-circle' : 'close-circle'" class="asset-icon"></i>
                  <span class="asset-label">{{ asset.label }}</span>
                  <span class="asset-status">{{ getAssetValue(asset.key) === 'YES' ? 'Owned' : 'Not Owned' }}</span>
                </div>
              </div>
            </div>
          </nz-tab>

          <nz-tab nzTitle="Identity">
            <div class="tab-content">
              <nz-descriptions nzTitle="Identity Documents" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Blood Group">{{ employee.bloodGroup || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Aadhar Number">{{ employee.aadharNumber || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="PAN Number">{{ employee.panNumber || '-' }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>

          <nz-tab nzTitle="Education">
            <div class="tab-content">
              <nz-descriptions nzTitle="Education Details" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="SSC / Std X">{{ employee.sscStatus || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Intermediate">{{ employee.intermediateStatus || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Bachelor's Degree">{{ employee.bachelorsDegree || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Master's Degree">{{ employee.mastersDegree || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Aadhaar Verification">{{ employee.aadhaarVerification || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="PAN Verification">{{ employee.panVerification || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="OSV">{{ employee.osv || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Remarks">{{ employee.remarks || '-' }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>

          <nz-tab nzTitle="Bank">
            <div class="tab-content">
              <nz-descriptions nzTitle="Bank Details" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Bank Name">{{ employee.bankName || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Account Number">{{ employee.accountNumber || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="IFSC Code">{{ employee.ifscCode || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Branch">{{ employee.branch || '-' }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>

          <nz-tab nzTitle="Employment">
            <div class="tab-content">
              <nz-descriptions nzTitle="Employment Details" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Employee Status">{{ employee.employeeStatus | titleCase }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Process Assigned">{{ employee.processAssigned || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="ESIC No.">{{ employee.esicNo || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Aadhar Seeding">{{ employee.aadharSeeding || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="UAN No.">{{ employee.uanNo || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="PF No.">{{ employee.pfNo || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="UAN Activation">{{ employee.uanActivation || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Languages">{{ employee.languagesCanSpeak || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Designation">{{ employee.designation | titleCase }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Date of Exit">{{ employee.doe | dateFormat }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>

          <nz-tab nzTitle="Family">
            <div class="tab-content">
              <nz-descriptions nzTitle="Family Members" nzBordered [nzColumn]="{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Father's Name">{{ employee.fatherName || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Father's Phone">{{ employee.fatherPhone || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Mother's Name">{{ employee.motherName || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Mother's Phone">{{ employee.motherPhone || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Spouse's Name">{{ employee.spouseName || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Spouse's Phone">{{ employee.spousePhone || '-' }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>

          <nz-tab nzTitle="Experience & Ref.">
            <div class="tab-content">
              <nz-descriptions nzTitle="Past Experience" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Has Experience">{{ employee.pastExperience || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Organization">{{ employee.organizationName || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Period">{{ employee.periodOfEmployment || '-' }}</nz-descriptions-item>
              </nz-descriptions>

              <nz-descriptions nzTitle="Reference 1" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Name">{{ employee.ref1Name || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Relationship">{{ employee.ref1Relationship || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Address">{{ employee.ref1Address || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Mobile">{{ employee.ref1Mobile || '-' }}</nz-descriptions-item>
              </nz-descriptions>

              <nz-descriptions nzTitle="Reference 2" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Name">{{ employee.ref2Name || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Relationship">{{ employee.ref2Relationship || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Address">{{ employee.ref2Address || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Mobile">{{ employee.ref2Mobile || '-' }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>

          <nz-tab nzTitle="Exit & Docs">
            <div class="tab-content">
              <nz-descriptions nzTitle="Exit Details" nzBordered [nzColumn]="{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }" class="tab-descriptions">
                <nz-descriptions-item nzTitle="Deletion Month">{{ employee.deletionMonth || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Exit Type">{{ employee.exitType | titleCase }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Exit Reason">{{ employee.exitReason || '-' }}</nz-descriptions-item>
              </nz-descriptions>
            </div>
          </nz-tab>
        </nz-tabset>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .view-container { max-width: 1200px; margin: 0 auto; }

    /* ===== BREADCRUMB ===== */
    nz-breadcrumb { margin-bottom: 16px; }

    /* ===== PROFILE CARD ===== */
    .profile-card { border-radius: var(--radius-lg); border: 1px solid var(--color-border-light); box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-bottom: 24px; }
    .profile-card-inner { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
    .profile-avatar-section { position: relative; flex-shrink: 0; }
    .profile-avatar { width: 80px; height: 80px; border-radius: var(--radius-full); background: linear-gradient(135deg, var(--color-primary-50), var(--color-primary-100)); display: flex; align-items: center; justify-content: center; }
    .avatar-initials { font-size: 28px; font-weight: 700; color: var(--color-primary-500); }
    .profile-avatar-img { width: 80px; height: 80px; border-radius: var(--radius-full); object-fit: cover; }
    .status-dot-lg { position: absolute; bottom: 2px; right: 2px; width: 16px; height: 16px; border-radius: var(--radius-full); border: 3px solid #fff; }
    .status-dot-lg.status-live { background: #28a745; }
    .status-dot-lg.status-other { background: #adb5bd; }
    .profile-info { flex: 1; min-width: 200px; }
    .profile-info h1 { font-size: 22px; font-weight: 700; color: var(--color-text-primary); margin: 0 0 2px; }
    .profile-code { font-size: 13px; color: var(--color-text-muted); margin-bottom: 10px; font-family: 'Cascadia Code', Consolas, monospace; }
    .profile-meta { display: flex; flex-wrap: wrap; gap: 16px; }
    .meta-item { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--color-text-secondary); }
    .meta-item i { font-size: 15px; color: var(--color-primary-500); opacity: 0.7; }
    .profile-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .status-badge-view { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: var(--radius-pill); font-size: 12px; font-weight: 600; }
    .status-badge-view .dot { width: 8px; height: 8px; border-radius: var(--radius-full); }
    .status-badge-view.live { background: #e8f5e9; color: #1e7e34; }
    .status-badge-view.live .dot { background: #28a745; }
    .status-badge-view.other { background: #f5f5f5; color: #5a6268; }
    .status-badge-view.other .dot { background: #adb5bd; }

    /* ===== DETAIL TABS ===== */
    .detail-tabs-wrapper { background: #fff; border-radius: var(--radius-lg); box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid var(--color-border-light); overflow: hidden; }
    .detail-tabs { padding: 0; }
    .tab-content { padding: 24px; }

    /* ===== TAB DESCRIPTIONS ===== */
    .tab-descriptions { margin-bottom: 20px; }
    .tab-descriptions:last-child { margin-bottom: 0; }

    /* ===== ASSETS GRID ===== */
    .assets-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .asset-card { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 20px 16px; background: #f8f9fc; border-radius: var(--radius-lg); border: 1px solid var(--color-border-light); transition: all 0.2s; }
    .asset-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .asset-card.owned { border-color: #c8e6c9; background: #f1f8f1; }
    .asset-icon { font-size: 32px; }
    .asset-card.owned .asset-icon { color: #2e7d32; }
    .asset-card:not(.owned) .asset-icon { color: #c62828; }
    .asset-label { font-size: 14px; font-weight: 600; color: #333; }
    .asset-status { font-size: 11px; font-weight: 500; color: #888; text-transform: uppercase; letter-spacing: 0.3px; }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      .profile-main { flex-direction: column; align-items: center; text-align: center; margin-top: 40px; }
      .profile-meta { justify-content: center; }
      .profile-actions { align-self: center; }
      .assets-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) {
      .assets-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class StaffMasterViewComponent implements OnInit {
  employee: Employee | null = null;
  isLoading = false;

  assetFields = [
    { label: 'TV', key: 'hasTv' },
    { label: 'Fridge', key: 'hasFridge' },
    { label: 'Laptop', key: 'hasLaptop' },
    { label: 'WiFi', key: 'hasWifi' },
    { label: '2 Wheeler', key: 'has2wheeler' },
    { label: '4 Wheeler', key: 'has4wheeler' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadEmployee(+id);
    }
  }

  private loadEmployee(id: number): void {
    this.isLoading = true;
    this.employeeService.getEmployeeById(id).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.employee = response.data;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error('Error', 'Error loading employee details');
        this.router.navigate(['/admin/employees']);
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
}
