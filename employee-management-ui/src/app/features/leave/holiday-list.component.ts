import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { HolidayService } from '../../core/services/holiday.service';
import { Holiday } from '../../core/models/payroll.models';


@Component({
  selector: 'app-holiday-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NzTableModule, NzButtonModule, NzSelectModule,
    NzIconModule, NzDatePickerModule, NzInputModule, NzSwitchModule,
    NzPopconfirmModule, NzTagModule
  ],
  template: `
    <div class="page-enter">
      <div class="section-card">
        <div class="section-toolbar">
          <nz-select [(ngModel)]="selectedYear" (ngModelChange)="loadHolidays()" class="filter-select" style="width:110px">
            <nz-option *ngFor="let y of years" [nzValue]="y" [nzLabel]="y"></nz-option>
          </nz-select>
          <button nz-button (click)="showAddModal()">
            <i nz-icon nzType="plus"></i> Add Holiday
          </button>
        </div>

        <nz-table #t [nzData]="holidays" [nzLoading]="loading" class="theme-table" nzSize="small">
          <thead>
            <tr>
              <th>Name</th>
              <th>Date</th>
              <th>Day</th>
              <th>Optional</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let h of t.data">
              <td><strong>{{ h.name }}</strong></td>
              <td>{{ h.date }}</td>
              <td>{{ getDayName(h.date) }}</td>
              <td><nz-tag [nzColor]="h.isOptional ? 'orange' : 'blue'">{{ h.isOptional ? 'Optional' : 'Mandatory' }}</nz-tag></td>
              <td class="td-actions">
                <button nz-button nzType="link" nzSize="small" class="action-btn action-edit" (click)="editHoliday(h)" nz-tooltip="Edit">
                  <i nz-icon nzType="edit"></i>
                </button>
                <button nz-button nzType="link" nzSize="small" class="action-btn action-reject" nz-popconfirm nzPopconfirmTitle="Delete this holiday?" (nzOnConfirm)="deleteHoliday(h.id)" nz-tooltip="Delete">
                  <i nz-icon nzType="delete"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="holidays.length === 0 && !loading">
              <td colspan="5" class="empty-cell">No holidays found for {{ selectedYear }}</td>
            </tr>
          </tbody>
        </nz-table>
      </div>

      <div class="modal-overlay" *ngIf="modalVisible" (click)="modalVisible = false">
        <div class="modal-box" style="width:460px" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-header-left">
              <div class="modal-header-icon"><i nz-icon nzType="gift"></i></div>
              <span>{{ editingId ? 'Edit Holiday' : 'Add Holiday' }}</span>
            </div>
            <button class="modal-close" (click)="modalVisible = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <label>Holiday Name</label>
              <input nz-input [(ngModel)]="form.name" placeholder="e.g. Republic Day" class="theme-input" />
            </div>
            <div class="form-row">
              <label>Date</label>
              <nz-date-picker [(ngModel)]="form.date" class="theme-datepicker" nzFormat="yyyy-MM-dd"></nz-date-picker>
            </div>
            <div class="form-row">
              <label>Optional Holiday</label>
              <nz-switch [(ngModel)]="form.isOptional"></nz-switch>
            </div>
          </div>
          <div class="modal-footer">
            <button nz-button class="btn-cancel" (click)="modalVisible = false">Cancel</button>
            <button nz-button class="btn-primary-gradient" [nzLoading]="saving" (click)="save()">Save</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .section-card {
      background: #fff;
      border: 1px solid #e8eaed;
      border-radius: 10px;
      padding: 14px 16px;
      margin-top: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .section-toolbar {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 14px;
    }
    .filter-select {
      width: 170px;
    }
    :host ::ng-deep .filter-select .ant-select-selector {
      border-radius: 8px !important;
      border: 1px solid #e2e5ea !important;
      height: 34px !important;
    }
    :host ::ng-deep .theme-table {
      width: 100% !important;
    }
    :host ::ng-deep .theme-table .ant-table {
      font-size: 13px;
    }
    :host ::ng-deep .theme-table .ant-table-thead > tr > th {
      background: #f8f9fc !important;
      color: #1f3d6e !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      padding: 10px 12px !important;
      border-bottom: 2px solid #1f3d6e !important;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr > td {
      padding: 9px 12px !important;
      border-bottom: 1px solid #f0f2f5 !important;
    }
    :host ::ng-deep .theme-table .ant-table-tbody > tr:hover > td {
      background: rgba(31,61,110,0.03) !important;
    }
    :host ::ng-deep .theme-table .ant-table-placeholder { display: none !important; }
    .th-actions { text-align: center !important; width: 90px; }
    .td-actions { text-align: center !important; white-space: nowrap; }
    .action-btn { padding: 0 4px !important; font-size: 16px !important; }
    .action-edit { color: #1f3d6e !important; }
    .action-edit:hover { color: #16213e !important; }
    .action-reject { color: #ef4444 !important; }
    .action-reject:hover { color: #dc2626 !important; }
    .empty-cell { text-align: center !important; padding: 28px !important; color: #9ca3af !important; }
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(4px);
    }
    .modal-box {
      background: #fff; border-radius: 12px; max-height: 85vh;
      display: flex; flex-direction: column;
      box-shadow: 0 12px 48px rgba(0,0,0,0.2);
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 20px; border-bottom: 1px solid #e8eaed;
      background: #f8fafc; border-radius: 12px 12px 0 0;
    }
    .modal-header-left {
      display: flex; align-items: center; gap: 10px;
      font-size: 15px; font-weight: 600; color: #1f3d6e;
    }
    .modal-header-icon {
      width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #1f3d6e, #16213e);
      border-radius: 6px; color: #fff; font-size: 15px;
    }
    .modal-close {
      background: none; border: none; font-size: 24px; cursor: pointer;
      color: #9ca3af; padding: 0 6px; line-height: 1; border-radius: 4px;
    }
    .modal-close:hover { color: #374151; background: rgba(0,0,0,0.05); }
    .modal-body { padding: 20px; overflow-y: auto; flex: 1; }
    .modal-footer {
      padding: 12px 20px; border-top: 1px solid #e8eaed;
      display: flex; justify-content: flex-end; gap: 10px;
      background: #fafbfc; border-radius: 0 0 12px 12px;
    }
    .form-row { margin-bottom: 14px; }
    .form-row label {
      display: block; font-weight: 600; margin-bottom: 5px;
      font-size: 12px; color: #374151; text-transform: uppercase; letter-spacing: 0.4px;
    }
    .theme-input, .theme-datepicker, :host ::ng-deep .theme-datepicker {
      width: 100% !important;
    }
    :host ::ng-deep .theme-datepicker .ant-picker {
      border-radius: 8px !important; border: 1px solid #e2e5ea !important;
      min-height: 36px !important;
    }
    .btn-primary-gradient {
      height: 34px !important; padding: 0 20px !important;
      font-size: 13px !important; font-weight: 600 !important; border: none !important;
      border-radius: 8px !important;
      background: linear-gradient(135deg, #4361ee, #3a0ca3) !important;
      color: #fff !important;
      box-shadow: 0 2px 8px rgba(67,97,238,0.3) !important;
    }
    .btn-cancel {
      height: 34px !important; padding: 0 18px !important;
      font-size: 13px !important; font-weight: 500 !important;
      border-radius: 8px !important; border: 1px solid #e2e5ea !important;
      background: #fff !important; color: #6c757d !important;
    }
  `]
})
export class HolidayListComponent implements OnInit {
  holidays: Holiday[] = [];
  loading = false;
  saving = false;
  modalVisible = false;
  editingId: number | null = null;
  selectedYear = new Date().getFullYear();
  years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 1);

  form: any = { name: '', date: null, isOptional: false };

  constructor(
    private holidayService: HolidayService,
    private msg: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadHolidays();
  }

  loadHolidays(): void {
    this.loading = true;
    this.holidayService.getHolidays(this.selectedYear).subscribe({
      next: (res) => { this.holidays = res.data || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  getDayName(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }

  showAddModal(): void {
    this.editingId = null;
    this.form = { name: '', date: null, isOptional: false };
    this.modalVisible = true;
  }

  editHoliday(h: Holiday): void {
    this.editingId = h.id;
    this.form = { name: h.name, date: new Date(h.date), isOptional: h.isOptional };
    this.modalVisible = true;
  }

  save(): void {
    if (!this.form.name || !this.form.date) {
      this.msg.warning('Please fill in all fields');
      return;
    }
    this.saving = true;
    const payload = {
      name: this.form.name,
      date: this.formatDate(this.form.date),
      isOptional: this.form.isOptional
    };
    const obs = this.editingId
      ? this.holidayService.updateHoliday(this.editingId, payload)
      : this.holidayService.createHoliday(payload);

    obs.subscribe({
      next: () => {
        this.msg.success(this.editingId ? 'Holiday updated' : 'Holiday created');
        this.modalVisible = false;
        this.loadHolidays();
        this.saving = false;
      },
      error: (err) => {
        this.msg.error(err.error?.message || 'Failed to save');
        this.saving = false;
      }
    });
  }

  deleteHoliday(id: number): void {
    this.holidayService.deleteHoliday(id).subscribe({
      next: () => { this.msg.success('Holiday deleted'); this.loadHolidays(); },
      error: (err) => this.msg.error(err.error?.message || 'Failed to delete')
    });
  }

  private formatDate(d: Date): string {
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${d.getFullYear()}-${m < 10 ? '0' + m : m}-${day < 10 ? '0' + day : day}`;
  }
}
