import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { PayrollService } from '../../core/services/payroll.service';
import { EmployeeService } from '../../core/services/employee.service';
import { AuthService } from '../../core/services/auth.service';
import { SalaryMasterDTO } from '../../core/models/payroll.models';

@Component({
  selector: 'app-salary-master',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzTableModule, NzButtonModule, NzIconModule,
    NzInputNumberModule, NzSelectModule, NzCardModule, NzSpinModule, NzTagModule,
    NzDrawerModule, NzTimelineModule, NzTabsModule, NzDescriptionsModule
  ],
  template: `
    <div class="sm-container page-enter">
      <div class="sm-header">
        <div class="sm-header-left">
          <div class="sm-header-icon">
            <i nz-icon nzType="bank"></i>
          </div>
          <div>
            <div class="sm-header-title">Salary Master</div>
            <div class="sm-header-sub">Set default salary structure per employee — auto-applies each month</div>
          </div>
        </div>
        <button nz-button class="sm-header-btn" (click)="initForAll()" [nzLoading]="initLoading">
          <i nz-icon nzType="sync"></i> Init Missing
        </button>
      </div>

      <nz-card class="sm-card" nzSize="small">
        <div class="sm-toolbar">
          <div class="sm-info">
            <i nz-icon nzType="info-circle" nzTheme="fill" style="color:#1f3d6e;font-size:14px"></i>
            Values set here carry forward every month. Use <strong>Employee Input</strong> for one-time adjustments (bonus, appraisal).
          </div>
          <button nz-button class="btn-primary-gradient" (click)="saveAll()" [nzLoading]="saving" [disabled]="!hasChanges">
            <i nz-icon nzType="save"></i> Save All
          </button>
        </div>

        <nz-table #smTable [nzData]="masters" [nzLoading]="loading" nzSize="small" nzBordered class="theme-table">
          <thead>
            <tr>
              <th class="th-sno">#</th>
              <th>Code</th>
              <th>Name</th>
              <th class="td-right">Basic</th>
              <th class="td-right">HRA</th>
              <th class="td-right">FPA</th>
              <th class="td-right">Other</th>
              <th class="td-right">Bonus</th>
              <th class="td-right">Appraisal</th>
              <th class="td-right">Late Sit</th>
              <th class="td-right">PF</th>
              <th class="td-right">ESI</th>
              <th class="td-right">PT</th>
              <th class="td-right">OT</th>
              <th>Worker</th>
              <th class="th-actions">History</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of smTable.data; let i = index">
              <td class="td-center">{{ i + 1 }}</td>
              <td><span class="emp-code">{{ m.employeeCode }}</span></td>
              <td>{{ m.employeeName }}</td>
              <td class="td-right">
                <nz-input-number [(ngModel)]="m.basic" [nzMin]="0" [nzPrecision]="2" (ngModelChange)="markChanged(m)" class="cell-input"></nz-input-number>
              </td>
              <td class="td-right">
                <nz-input-number [(ngModel)]="m.hra" [nzMin]="0" [nzPrecision]="2" (ngModelChange)="markChanged(m)" class="cell-input"></nz-input-number>
              </td>
              <td class="td-right">
                <nz-input-number [(ngModel)]="m.fixedPersonalAllowance" [nzMin]="0" [nzPrecision]="2" (ngModelChange)="markChanged(m)" class="cell-input"></nz-input-number>
              </td>
              <td class="td-right">
                <nz-input-number [(ngModel)]="m.otherAllowance" [nzMin]="0" [nzPrecision]="2" (ngModelChange)="markChanged(m)" class="cell-input"></nz-input-number>
              </td>
              <td class="td-right">
                <nz-input-number [(ngModel)]="m.bonus" [nzMin]="0" [nzPrecision]="2" (ngModelChange)="markChanged(m)" class="cell-input"></nz-input-number>
              </td>
              <td class="td-right">
                <nz-input-number [(ngModel)]="m.appraisalAmount" [nzMin]="0" [nzPrecision]="2" (ngModelChange)="markChanged(m)" class="cell-input"></nz-input-number>
              </td>
              <td class="td-right">
                <nz-input-number [(ngModel)]="m.lateSittingAmount" [nzMin]="0" [nzPrecision]="2" (ngModelChange)="markChanged(m)" class="cell-input"></nz-input-number>
              </td>
              <td class="td-right">
                <nz-input-number [(ngModel)]="m.pfDeduction" [nzMin]="0" [nzPrecision]="2" (ngModelChange)="markChanged(m)" class="cell-input"></nz-input-number>
              </td>
              <td class="td-right">
                <nz-input-number [(ngModel)]="m.esiDeduction" [nzMin]="0" [nzPrecision]="2" (ngModelChange)="markChanged(m)" class="cell-input"></nz-input-number>
              </td>
              <td class="td-right">
                <nz-input-number [(ngModel)]="m.ptDeduction" [nzMin]="0" [nzPrecision]="2" (ngModelChange)="markChanged(m)" class="cell-input"></nz-input-number>
              </td>
              <td class="td-right">
                <nz-input-number [(ngModel)]="m.overtimeWages" [nzMin]="0" [nzPrecision]="2" (ngModelChange)="markChanged(m)" class="cell-input"></nz-input-number>
              </td>
              <td>
                <nz-select [(ngModel)]="m.workerType" (ngModelChange)="markChanged(m)" nzSize="small" style="width:95px">
                  <nz-option nzValue="Permanent" nzLabel="Permanent"></nz-option>
                  <nz-option nzValue="Contract" nzLabel="Contract"></nz-option>
                  <nz-option nzValue="Casual" nzLabel="Casual"></nz-option>
                </nz-select>
              </td>
              <td class="td-center">
                <button nz-button nzType="link" nzSize="small" (click)="showHistory(m)" nz-tooltip="View change history">
                  <i nz-icon nzType="clock-circle"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="masters.length === 0 && !loading">
              <td colspan="16" class="empty-cell">No salary master records found</td>
            </tr>
          </tbody>
        </nz-table>
      </nz-card>

      <!-- ===== HISTORY DRAWER (with tabs) ===== -->
      <nz-drawer
        [nzVisible]="historyDrawer"
        [nzTitle]="drawerTitle"
        (nzOnClose)="historyDrawer = false"
        nzWidth="560">
        <div *nzDrawerContent>
          <nz-tabset>
            <nz-tab nzTitle="Monthly Snapshots">
              <div *ngIf="snapshotsLoading" style="text-align:center;padding:40px"><i nz-icon nzType="loading" style="font-size:24px"></i></div>
              <div *ngIf="!snapshotsLoading && snapshots.length === 0" style="text-align:center;padding:40px;color:#9ca3af">No snapshots yet. Snapshots are taken automatically when Salary Master is saved.</div>
              <nz-timeline *ngIf="!snapshotsLoading && snapshots.length > 0">
                <nz-timeline-item *ngFor="let s of snapshots" nzColor="blue">
                  <div class="snapshot-header">
                    <strong>{{ getMonthName(s.snapshotMonth) }} {{ s.snapshotYear }}</strong>
                    <span class="snapshot-by">by {{ s.changedBy }}</span>
                  </div>
                  <nz-descriptions nzSize="small" [nzColumn]="2" class="snapshot-desc">
                    <nz-descriptions-item nzTitle="Basic" [nzSpan]="1">₹{{ s.basic | number:'1.2-2' }}</nz-descriptions-item>
                    <nz-descriptions-item nzTitle="HRA" [nzSpan]="1">₹{{ s.hra | number:'1.2-2' }}</nz-descriptions-item>
                    <nz-descriptions-item nzTitle="FPA" [nzSpan]="1">₹{{ s.fixedPersonalAllowance | number:'1.2-2' }}</nz-descriptions-item>
                    <nz-descriptions-item nzTitle="Other" [nzSpan]="1">₹{{ s.otherAllowance | number:'1.2-2' }}</nz-descriptions-item>
                    <nz-descriptions-item nzTitle="Bonus" [nzSpan]="1" nzLabelStyle="color:#d97706;font-weight:700">₹{{ s.bonus | number:'1.2-2' }}</nz-descriptions-item>
                    <nz-descriptions-item nzTitle="Appraisal" [nzSpan]="1" nzLabelStyle="color:#059669;font-weight:700">₹{{ s.appraisalAmount | number:'1.2-2' }}</nz-descriptions-item>
                    <nz-descriptions-item nzTitle="Late Sitting" [nzSpan]="1">₹{{ s.lateSittingAmount | number:'1.2-2' }}</nz-descriptions-item>
                    <nz-descriptions-item nzTitle="PF" [nzSpan]="1">₹{{ s.pfDeduction | number:'1.2-2' }}</nz-descriptions-item>
                    <nz-descriptions-item nzTitle="ESI" [nzSpan]="1">₹{{ s.esiDeduction | number:'1.2-2' }}</nz-descriptions-item>
                    <nz-descriptions-item nzTitle="PT" [nzSpan]="1">₹{{ s.ptDeduction | number:'1.2-2' }}</nz-descriptions-item>
                    <nz-descriptions-item nzTitle="Worker" [nzSpan]="2">{{ s.workerType }}</nz-descriptions-item>
                  </nz-descriptions>
                  <div class="snapshot-divider"></div>
                </nz-timeline-item>
              </nz-timeline>
            </nz-tab>
            <nz-tab nzTitle="Field Changes">
              <div *ngIf="historyLoading" style="text-align:center;padding:40px"><i nz-icon nzType="loading" style="font-size:24px"></i></div>
              <nz-timeline *ngIf="!historyLoading && historyItems.length > 0">
                <nz-timeline-item *ngFor="let h of historyItems">
                  <span style="font-size:12px;color:#6c757d">{{ h.changedAt | date:'dd MMM yyyy HH:mm' }}</span>
                  <br/>
                  <span style="font-size:13px"><strong>{{ h.fieldName }}</strong>: {{ h.oldValue || '—' }} → {{ h.newValue }}</span>
                  <br/>
                  <span style="font-size:11px;color:#9ca3af">by {{ h.changedBy }}</span>
                </nz-timeline-item>
              </nz-timeline>
              <div *ngIf="!historyLoading && historyItems.length === 0" style="text-align:center;padding:40px;color:#9ca3af">No changes recorded yet</div>
            </nz-tab>
          </nz-tabset>
        </div>
      </nz-drawer>
    </div>
  `,
  styles: [`
    .sm-container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 12px 16px; width: 100%; min-width: 0; box-sizing: border-box; }
    .sm-header { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; padding:12px 16px; margin-bottom:14px; background:linear-gradient(135deg,#1f3d6e 0%,#16213e 100%); border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.15); }
    .sm-header-left { display:flex; align-items:center; gap:12px; }
    .sm-header-icon { width:36px; height:36px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.15); border-radius:8px; color:#fff; font-size:18px; flex-shrink:0; }
    .sm-header-title { font-size:17px; font-weight:700; color:#fff; letter-spacing:0.3px; }
    .sm-header-sub { font-size:12px; color:rgba(255,255,255,0.6); font-weight:400; margin-top:1px; }
    .sm-header-btn { height:34px !important; padding:0 18px !important; font-size:13px !important; font-weight:600 !important; border:none !important; border-radius:8px !important; background:rgba(255,255,255,0.18) !important; color:#fff !important; display:inline-flex !important; align-items:center !important; gap:6px !important; transition:all 0.2s ease !important; letter-spacing:0.3px !important; }
    .sm-header-btn:hover { background:rgba(255,255,255,0.28) !important; transform:translateY(-1px); }
    .sm-card { border-radius:10px !important; border:1px solid #e8eaed !important; box-shadow:0 2px 12px rgba(0,0,0,0.06) !important; width:100% !important; }
    :host ::ng-deep .sm-card .ant-card-body { padding:14px 16px !important; }
    .sm-toolbar { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:14px; }
    .sm-info { font-size:12px; color:#6c757d; background:#f0f4ff; padding:6px 12px; border-radius:6px; border:1px solid #d0d9f0; }
    /* ===== SNAPSHOT DRAWER STYLES ===== */
    .snapshot-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
    .snapshot-by { font-size:11px; color:#9ca3af; }
    .snapshot-desc { margin-bottom:4px; }
    :host ::ng-deep .snapshot-desc .ant-descriptions-item-label { font-size:11px !important; font-weight:600 !important; color:#6c757d !important; }
    :host ::ng-deep .snapshot-desc .ant-descriptions-item-content { font-size:12px !important; font-weight:600 !important; color:#374151 !important; }
    .snapshot-divider { height:1px; background:#e8eaed; margin:8px 0 12px; }
    /* ===== TABLE STYLES ===== */
    .cell-input, :host ::ng-deep .cell-input { width:100% !important; }
    :host ::ng-deep .cell-input .ant-input-number { border-radius:6px !important; border:1px solid #e2e5ea !important; width:100% !important; transition:all 0.2s ease !important; }
    :host ::ng-deep .cell-input .ant-input-number:hover { border-color:#1f3d6e !important; }
    :host ::ng-deep .cell-input .ant-input-number-focused { border-color:#4361ee !important; box-shadow:0 0 0 2px rgba(67,97,238,0.1) !important; }
    :host ::ng-deep .cell-input .ant-input-number-input { height:28px !important; font-size:12px !important; }
    :host ::ng-deep .cell-input .ant-input-number-handler-wrap { border-radius:0 6px 6px 0 !important; }
    :host ::ng-deep .theme-table { width:100% !important; }
    :host ::ng-deep .theme-table .ant-table { font-size:12px; }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th { background:#f8f9fc !important; color:#1f3d6e !important; font-size:10px !important; font-weight:700 !important; text-transform:uppercase !important; letter-spacing:0.5px !important; padding:8px 6px !important; border-bottom:2px solid #1f3d6e !important; white-space:nowrap; }
    :host ::ng-deep .theme-table .ant-table-tbody > tr > td { padding:4px 6px !important; border-bottom:1px solid #f0f2f5 !important; font-size:12px; color:#374151; }
    :host ::ng-deep .theme-table .ant-table-tbody > tr:hover > td { background:rgba(31,61,110,0.03) !important; }
    .th-sno { width:36px !important; text-align:center !important; }
    .th-actions { text-align:center !important; width:60px; }
    .td-center { text-align:center !important; }
    .td-right { text-align:right !important; }
    .emp-code { font-weight:600; color:#1f3d6e; font-size:11px; letter-spacing:0.3px; white-space:nowrap; }
    .empty-cell { text-align:center !important; padding:28px !important; color:#9ca3af !important; font-size:13px; font-style:italic; }
    .btn-primary-gradient { height:34px !important; padding:0 20px !important; font-size:13px !important; font-weight:600 !important; border:none !important; border-radius:8px !important; background:linear-gradient(135deg,#4361ee,#3a0ca3) !important; color:#fff !important; display:inline-flex !important; align-items:center !important; gap:6px !important; transition:all 0.2s ease !important; letter-spacing:0.3px !important; box-shadow:0 2px 8px rgba(67,97,238,0.3) !important; }
    .btn-primary-gradient:hover { transform:translateY(-1px) !important; box-shadow:0 4px 14px rgba(67,97,238,0.4) !important; }
    .btn-primary-gradient[disabled] { opacity:0.6; cursor:not-allowed !important; transform:none !important; }
  `]
})
export class SalaryMasterComponent implements OnInit {
  masters: SalaryMasterDTO[] = [];
  loading = false;
  saving = false;
  initLoading = false;
  hasChanges = false;
  changedIds = new Set<number>();

  historyDrawer = false;
  drawerTitle = '';
  historyItems: any[] = [];
  historyLoading = false;
  snapshots: any[] = [];
  snapshotsLoading = false;

  constructor(
    private payrollService: PayrollService,
    private employeeService: EmployeeService,
    public authService: AuthService,
    private msg: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadMasters();
  }

  loadMasters(): void {
    this.loading = true;
    this.payrollService.getSalaryMaster().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.masters = res.data;
        } else {
          this.masters = [];
        }
        this.loading = false;
        this.hasChanges = false;
        this.changedIds.clear();
      },
      error: () => {
        this.loading = false;
        this.initForAll();
      }
    });
  }

  initForAll(): void {
    this.employeeService.getEmployees({ size: 200, employeeStatus: 'LIVE' }).subscribe({
      next: (res) => {
        const emps = res.data?.content || [];
        if (emps.length === 0) {
          this.loading = false;
          return;
        }
        this.initLoading = true;
        let completed = 0;
        emps.forEach((emp: any) => {
          this.payrollService.initSalaryMaster(emp.id).subscribe({
            next: (r) => {
              if (r.data) this.masters.push(r.data);
            },
            complete: () => {
              completed++;
              if (completed === emps.length) {
                this.initLoading = false;
                this.loadMasters();
              }
            }
          });
        });
      }
    });
  }

  markChanged(m: SalaryMasterDTO): void {
    if (m.id) this.changedIds.add(m.id);
    this.hasChanges = this.changedIds.size > 0;
  }

  saveAll(): void {
    this.saving = true;
    const changed = this.masters.filter(m => m.id && this.changedIds.has(m.id));
    let done = 0;
    let errors = 0;
    changed.forEach(m => {
      this.payrollService.saveSalaryMaster(m).subscribe({
        next: () => { done++; },
        error: () => { errors++; },
        complete: () => {
          if (done + errors === changed.length) {
            this.saving = false;
            if (errors === 0) this.msg.success(`${done} employee(s) saved`);
            else this.msg.warning(`${done} saved, ${errors} failed`);
            this.loadMasters();
          }
        }
      });
    });
    if (changed.length === 0) {
      this.saving = false;
      this.msg.info('No changes to save');
    }
  }

  showHistory(m: SalaryMasterDTO): void {
    if (!m.employeeId || !m.employeeName) return;
    this.drawerTitle = m.employeeCode + ' — ' + m.employeeName;
    this.historyDrawer = true;
    this.historyLoading = true;
    this.snapshotsLoading = true;
    this.historyItems = [];
    this.snapshots = [];
    this.payrollService.getSalaryMasterHistory(m.employeeId).subscribe({
      next: (res) => { this.historyItems = res.data || []; this.historyLoading = false; },
      error: () => { this.historyLoading = false; }
    });
    this.payrollService.getSalaryMasterSnapshots(m.employeeId).subscribe({
      next: (res) => { this.snapshots = res.data || []; this.snapshotsLoading = false; },
      error: () => { this.snapshotsLoading = false; }
    });
  }

  getMonthName(m: number): string {
    const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return names[m - 1] || '';
  }
}
