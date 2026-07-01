import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import * as QRCode from 'qrcode';

import { PendingRegistrationService } from '../../core/services/pending-registration.service';
import { PendingRegistration } from '../../core/models/pending-registration.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-pending-registrations',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    NzTableModule, NzButtonModule, NzIconModule, NzModalModule,
    NzTagModule, NzCardModule, NzDescriptionsModule, NzBadgeModule,
    NzSpinModule, NzInputModule, NzSelectModule,
    PageHeaderComponent
  ],
  template: `
    <div class="pending-page page-enter">
      <app-page-header icon="audit" title="Pending Registrations"></app-page-header>

      <div class="pending-content">
        <div class="stats-row">
          <nz-card class="stat-card" [nzBordered]="false">
            <div class="stat-inner">
              <i nz-icon nzType="clock-circle" style="font-size:28px;color:#faad14;"></i>
              <div>
                <div class="stat-num">{{ pendingCount }}</div>
                <div class="stat-label">Pending</div>
              </div>
            </div>
          </nz-card>
          <nz-card class="stat-card" [nzBordered]="false" (click)="showQrModal()" style="cursor:pointer;">
            <div class="stat-inner">
              <i nz-icon nzType="qrcode" style="font-size:28px;color:#1f3d6e;"></i>
              <div>
                <div class="stat-num">QR Code</div>
                <div class="stat-label">Click to display</div>
              </div>
            </div>
          </nz-card>
        </div>

        <div class="filter-row">
          <nz-select [(ngModel)]="statusFilter" (ngModelChange)="loadData()" nzPlaceHolder="Filter by status" style="width:200px">
            <nz-option nzValue="" nzLabel="All"></nz-option>
            <nz-option nzValue="PENDING" nzLabel="Pending"></nz-option>
            <nz-option nzValue="APPROVED" nzLabel="Approved"></nz-option>
            <nz-option nzValue="REJECTED" nzLabel="Rejected"></nz-option>
          </nz-select>
        </div>

        <nz-table #pendingTable [nzData]="registrations" [nzLoading]="loading" nzSize="small"
          nzShowPagination [nzPageSize]="10" [nzScroll]="{ x: '900px' }">
          <thead>
            <tr>
              <th>Reg. Code</th>
              <th>Name</th>
              <th>Mobile</th>
              <th>Email</th>
              <th>Designation</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let reg of pendingTable.data">
              <td><strong>{{ reg.registrationCode }}</strong></td>
              <td>{{ reg.firstName }} {{ reg.middleName ? reg.middleName + ' ' : '' }}{{ reg.surname }}</td>
              <td>{{ reg.mobile }}</td>
              <td>{{ reg.email || '-' }}</td>
              <td>{{ reg.designation || '-' }}</td>
              <td>{{ reg.createdAt | date:'short' }}</td>
              <td>
                <nz-tag [nzColor]="reg.status === 'PENDING' ? 'processing' : reg.status === 'APPROVED' ? 'success' : 'error'">
                  {{ reg.status }}
                </nz-tag>
              </td>
              <td>
                <button nz-button nzType="default" nzSize="small" (click)="viewDetails(reg)" nz-tooltip="View Details">
                  <i nz-icon nzType="eye"></i>
                </button>
                <button nz-button nzType="primary" nzSize="small" *ngIf="reg.status === 'PENDING'"
                  (click)="showApproveModal(reg)" nz-tooltip="Approve" class="btn-action">
                  <i nz-icon nzType="check"></i>
                </button>
                <button nz-button nzType="default" nzDanger nzSize="small" *ngIf="reg.status === 'PENDING'"
                  (click)="showRejectModal(reg)" nz-tooltip="Reject" class="btn-action">
                  <i nz-icon nzType="close"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="registrations.length === 0">
              <td colspan="8">
                <div class="empty-state">
                  <i nz-icon nzType="inbox" style="font-size:32px;color:#ccc;"></i>
                  <p>No pending registrations</p>
                </div>
              </td>
            </tr>
          </tbody>
        </nz-table>
      </div>
    </div>

    <nz-modal [(nzVisible)]="isViewModalVisible" [nzTitle]="'Registration: ' + selectedReg?.registrationCode"
      (nzOnCancel)="isViewModalVisible = false" nzWidth="600px" [nzFooter]="null">
      <ng-template nzModalContent>
        <nz-descriptions [nzColumn]="2" nzSize="small" *ngIf="selectedReg">
          <nz-descriptions-item nzTitle="First Name" [nzSpan]="1">{{ selectedReg.firstName }}</nz-descriptions-item>
          <nz-descriptions-item nzTitle="Surname" [nzSpan]="1">{{ selectedReg.surname }}</nz-descriptions-item>
          <nz-descriptions-item nzTitle="Mobile" [nzSpan]="1">{{ selectedReg.mobile }}</nz-descriptions-item>
          <nz-descriptions-item nzTitle="Email" [nzSpan]="1">{{ selectedReg.email || '-' }}</nz-descriptions-item>
          <nz-descriptions-item nzTitle="Gender" [nzSpan]="1">{{ selectedReg.gender || '-' }}</nz-descriptions-item>
          <nz-descriptions-item nzTitle="DOB" [nzSpan]="1">{{ selectedReg.dob || '-' }}</nz-descriptions-item>
          <nz-descriptions-item nzTitle="Aadhar" [nzSpan]="1">{{ selectedReg.aadharNumber || '-' }}</nz-descriptions-item>
          <nz-descriptions-item nzTitle="PAN" [nzSpan]="1">{{ selectedReg.panNumber || '-' }}</nz-descriptions-item>
          <nz-descriptions-item nzTitle="Qualification" [nzSpan]="1">{{ selectedReg.highestQualification || '-' }}</nz-descriptions-item>
          <nz-descriptions-item nzTitle="Designation" [nzSpan]="1">{{ selectedReg.designation || '-' }}</nz-descriptions-item>
          <nz-descriptions-item nzTitle="Status" [nzSpan]="2">
            <nz-tag [nzColor]="selectedReg.status === 'PENDING' ? 'processing' : selectedReg.status === 'APPROVED' ? 'success' : 'error'">
              {{ selectedReg.status }}
            </nz-tag>
          </nz-descriptions-item>
          <nz-descriptions-item nzTitle="Submitted" [nzSpan]="2">{{ selectedReg.createdAt | date:'medium' }}</nz-descriptions-item>
          <nz-descriptions-item nzTitle="Rejection Reason" *ngIf="selectedReg.rejectionReason" [nzSpan]="2">
            {{ selectedReg.rejectionReason }}
          </nz-descriptions-item>
          <nz-descriptions-item nzTitle="Address" [nzSpan]="2">{{ selectedReg.presentAddress || '-' }}</nz-descriptions-item>
        </nz-descriptions>
        <div *ngIf="selectedReg?.status === 'PENDING'" class="detail-actions">
          <button nz-button nzType="primary" (click)="showApproveModal(selectedReg!)">
            <i nz-icon nzType="check"></i> Approve
          </button>
          <button nz-button nzType="default" nzDanger (click)="showRejectModal(selectedReg!)" style="margin-left:8px">
            <i nz-icon nzType="close"></i> Reject
          </button>
        </div>
      </ng-template>
    </nz-modal>

    <nz-modal [(nzVisible)]="isRejectModalVisible" nzTitle="Reject Registration" (nzOnCancel)="isRejectModalVisible = false"
      [nzFooter]="rejectFooter" nzWidth="420px" [nzMaskClosable]="false">
      <ng-template nzModalContent>
        <p>Are you sure you want to reject <strong>{{ selectedReg?.registrationCode }}</strong>?</p>
        <div style="margin-top:12px">
          <label style="font-weight:600;font-size:13px;display:block;margin-bottom:6px;">Reason (optional)</label>
          <textarea nz-input [(ngModel)]="rejectReason" rows="3" placeholder="Enter rejection reason"></textarea>
        </div>
      </ng-template>
      <ng-template #rejectFooter>
        <button nz-button nzType="default" (click)="isRejectModalVisible = false">Cancel</button>
        <button nz-button nzType="primary" nzDanger (click)="confirmReject()" [nzLoading]="isRejecting">
          <i nz-icon nzType="close"></i> Reject
        </button>
      </ng-template>
    </nz-modal>

    <nz-modal [(nzVisible)]="isApproveModalVisible" nzTitle="Approve Registration"
      (nzOnCancel)="isApproveModalVisible = false" [nzFooter]="approveFooter" nzWidth="440px" [nzMaskClosable]="false">
      <ng-template nzModalContent>
        <div class="approve-modal-body">
          <div style="margin-bottom:16px">
            <p>Approve <strong>{{ selectedReg?.firstName }} {{ selectedReg?.surname }}</strong> ({{ selectedReg?.registrationCode }})</p>
            <p style="font-size:13px;color:#666;">Enter the employee code to assign to this joinee.</p>
          </div>
          <div class="approve-field">
            <label class="approve-label">Employee Code <span class="required">*</span></label>
            <input nz-input [(ngModel)]="approveEmpCode" name="approveEmpCode"
              placeholder="Enter employee code (e.g. EMP0001)"
              style="text-transform:uppercase;width:100%;" />
          </div>
        </div>
      </ng-template>
      <ng-template #approveFooter>
        <button nz-button nzType="default" (click)="isApproveModalVisible = false">Cancel</button>
        <button nz-button nzType="primary" (click)="confirmApprove()" [nzLoading]="isApproving" [disabled]="!approveEmpCode?.trim()">
          <i nz-icon nzType="check"></i> Approve
        </button>
      </ng-template>
    </nz-modal>

    <nz-modal [(nzVisible)]="isQrModalVisible" nzTitle="Registration QR Code" (nzOnCancel)="isQrModalVisible = false"
      [nzFooter]="null" nzWidth="400px">
      <ng-template nzModalContent>
        <div class="qr-section">
          <p style="text-align:center;margin-bottom:16px;color:#666;">
            Scan this QR code or share the link below for new joinees to register
          </p>
          <div class="qr-container">
            <img *ngIf="qrDataUrl" [src]="qrDataUrl" alt="QR Code" class="qr-image" />
            <div *ngIf="!qrDataUrl" class="qr-loading">
              <i nz-icon nzType="loading" style="font-size:32px;"></i>
            </div>
          </div>
          <div class="qr-url">
            <span class="url-label">Registration URL:</span>
            <div class="url-box">
              <input nz-input [value]="registrationUrl" readonly (click)="selectUrl($event)" />
              <button nz-button nzType="default" (click)="copyUrl()" nz-tooltip="Copy URL">
                <i nz-icon nzType="copy"></i>
              </button>
            </div>
          </div>
        </div>
      </ng-template>
    </nz-modal>
  `,
  styles: [`
    /* ── Page Layout ── */
    .pending-page {
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 12px 16px;
      box-sizing: border-box;
    }
    .pending-content {
      flex: 1;
      padding: 12px 0;
      overflow: visible;
      width: 100%;
    }

    /* ── Stats Row ── */
    .stats-row { display: flex; gap: 8px; margin-bottom: 16px; }
    .stat-card { flex: 1; border-radius: 8px; }
    .stat-inner { display: flex; align-items: center; gap: 12px; }
    .stat-num { font-size: 24px; font-weight: 700; color: #1f3d6e; }
    .stat-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }

    /* ── Filters ── */
    .filter-row { margin-bottom: 12px; }
    .filter-row nz-select { width: 200px; }
    .filter-row ::ng-deep .ant-select-selector {
      border-radius: 6px !important;
      border-color: #d9d9d9 !important;
    }
    .filter-row ::ng-deep .ant-select-focused .ant-select-selector {
      border-color: #1f3d6e !important;
      box-shadow: 0 0 0 2px rgba(31,61,110,0.1) !important;
    }

    /* ── Table ── */
    .pending-content ::ng-deep .ant-table-thead > tr > th {
      background: #f8f9fc !important;
      color: #1f3d6e !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
      border-bottom: 2px solid #1f3d6e !important;
      padding: 10px 12px !important;
    }
    .pending-content ::ng-deep .ant-table-tbody > tr > td {
      padding: 8px 12px !important;
    }
    .pending-content ::ng-deep .ant-table-tbody > tr:hover > td {
      background: #f8f9fc !important;
    }

    /* ── Buttons ── */
    button[nz-button][nzType="primary"] {
      background: linear-gradient(135deg, #4361ee, #3a0ca3) !important;
      border: none !important;
      color: #fff !important;
      box-shadow: 0 2px 6px rgba(67,97,238,0.3) !important;
    }
    button[nz-button][nzType="primary"]:hover {
      background: linear-gradient(135deg, #3a56d4, #2f0891) !important;
      box-shadow: 0 4px 12px rgba(67,97,238,0.4) !important;
    }
    button[nz-button][nzType="primary"][nzDanger] {
      background: linear-gradient(135deg, #ff4d4f, #c41d1d) !important;
      box-shadow: 0 2px 6px rgba(255,77,79,0.3) !important;
    }
    .btn-action { margin-left: 6px; }

    /* ── Modals ── */
    .pending-page ::ng-deep .ant-modal-header {
      background: #1f3d6e !important;
      border-radius: 8px 8px 0 0 !important;
      padding: 14px 20px !important;
    }
    .pending-page ::ng-deep .ant-modal-title {
      color: #fff !important;
      font-size: 15px !important;
      font-weight: 600 !important;
    }
    .pending-page ::ng-deep .ant-modal-close-x {
      color: rgba(255,255,255,0.7) !important;
    }
    .pending-page ::ng-deep .ant-modal-close:hover .ant-modal-close-x {
      color: #fff !important;
    }
    .pending-page ::ng-deep .ant-modal-content {
      border-radius: 8px !important;
      overflow: hidden !important;
    }
    .pending-page ::ng-deep .ant-modal-body {
      padding: 20px !important;
    }

    /* ── Empty State ── */
    .empty-state { text-align: center; padding: 40px 0; color: #999; }
    .empty-state p { margin: 8px 0 0; font-size: 14px; }

    /* ── Detail Actions ── */
    .detail-actions { margin-top: 16px; padding-top: 16px; border-top: 1px solid #f0f0f0; }

    /* ── QR Section ── */
    .qr-section { text-align: center; }
    .qr-container {
      display: inline-block; padding: 16px; background: #fff; border: 2px dashed #e0e0e0;
      border-radius: 12px; margin-bottom: 16px;
    }
    .qr-image { width: 220px; height: 220px; }
    .qr-loading { width: 220px; height: 220px; display: flex; align-items: center; justify-content: center; }
    .qr-url { text-align: left; }
    .url-label { font-size: 13px; font-weight: 600; color: #333; display: block; margin-bottom: 6px; }
    .url-box { display: flex; gap: 8px; }
    .url-box input { flex: 1; }

    /* ── Page Enter Animation ── */
    .page-enter {
      animation: fadeSlideUp .35s ease-out;
    }
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Scrollbar ── */
    .pending-content::-webkit-scrollbar { width: 6px; }
    .pending-content::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px; }
    .pending-content::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 3px; }
    .pending-content::-webkit-scrollbar-thumb:hover { background: #a1a1a1; }
  `]
})
export class PendingRegistrationsComponent implements OnInit {
  registrations: PendingRegistration[] = [];
  loading = false;
  pendingCount = 0;
  statusFilter = 'PENDING';

  selectedReg: PendingRegistration | null = null;
  isViewModalVisible = false;
  isRejectModalVisible = false;
  rejectReason = '';
  isRejecting = false;
  isApproveModalVisible = false;
  approveEmpCode = '';
  isApproving = false;

  isQrModalVisible = false;
  qrDataUrl = '';
  registrationUrl = '';

  constructor(
    private pendingService: PendingRegistrationService,
    private notification: NzNotificationService,
    private modal: NzModalService
  ) {}

  ngOnInit() {
    this.loadData();
    this.loadPendingCount();
    this.registrationUrl = window.location.origin + '/register-new';
  }

  loadData() {
    this.loading = true;
    this.pendingService.getAll(this.statusFilter || undefined).subscribe({
      next: (res) => {
        this.registrations = res.data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadPendingCount() {
    this.pendingService.countPending().subscribe({
      next: (res) => this.pendingCount = res.data
    });
  }

  viewDetails(reg: PendingRegistration) {
    this.selectedReg = reg;
    this.isViewModalVisible = true;
  }

  showApproveModal(reg: PendingRegistration) {
    this.selectedReg = reg;
    this.approveEmpCode = '';
    this.isApproveModalVisible = true;
  }

  confirmApprove() {
    if (!this.approveEmpCode || !this.approveEmpCode.trim()) {
      this.notification.error('Error', 'Please enter an employee code');
      return;
    }
    this.isApproving = true;
    this.pendingService.approve(this.selectedReg!.id, this.approveEmpCode.trim()).subscribe({
      next: (res) => {
        this.isApproving = false;
        this.isApproveModalVisible = false;
        this.isViewModalVisible = false;
        this.notification.success('Approved', res.message);
        this.loadData();
        this.loadPendingCount();
      },
      error: (err) => {
        this.isApproving = false;
        const msg = err.error?.message || 'Failed to approve';
        if (msg.toLowerCase().includes('already exists')) {
          this.notification.error('Duplicate', msg);
        } else {
          this.notification.error('Error', msg);
        }
      }
    });
  }

  showRejectModal(reg: PendingRegistration) {
    this.selectedReg = reg;
    this.rejectReason = '';
    this.isRejectModalVisible = true;
  }

  confirmReject() {
    this.isRejecting = true;
    this.pendingService.reject(this.selectedReg!.id, this.rejectReason || undefined).subscribe({
      next: (res) => {
        this.isRejecting = false;
        this.isRejectModalVisible = false;
        this.isViewModalVisible = false;
        this.notification.success('Rejected', res.message);
        this.loadData();
        this.loadPendingCount();
      },
      error: (err) => {
        this.isRejecting = false;
        this.notification.error('Error', err.error?.message || 'Failed to reject');
      }
    });
  }

  async showQrModal() {
    this.isQrModalVisible = true;
    this.qrDataUrl = '';
    try {
      this.qrDataUrl = await QRCode.toDataURL(this.registrationUrl, {
        width: 220,
        margin: 2,
        color: { dark: '#1f3d6e', light: '#ffffff' }
      });
    } catch {
      this.notification.error('Error', 'Failed to generate QR code');
    }
  }

  copyUrl() {
    navigator.clipboard.writeText(this.registrationUrl).then(() => {
      this.notification.success('Copied', 'Registration URL copied to clipboard');
    });
  }

  selectUrl(event: MouseEvent) {
    (event.target as HTMLInputElement).select();
  }
}
