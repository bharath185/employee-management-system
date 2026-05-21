import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { MasterDataService } from '../../../../core/services/master-data.service';
import { PhotoUploadComponent } from '../../../../shared/components/photo-upload/photo-upload.component';

@Component({
  selector: 'app-exit-docs-tab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzIconModule,
    NzButtonModule,
    PhotoUploadComponent
  ],
  template: `
    <div class="tab-container">
      <h3 class="section-title">Exit & Documents</h3>
      <div class="form-grid">
        <!-- Designation -->
        <nz-form-item>
          <nz-form-label>Designation</nz-form-label>
          <nz-form-control>
            <nz-select [formControl]="form.get('designation')!" nzPlaceHolder="Select designation">
              <nz-option *ngFor="let opt of designationOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <!-- DOE -->
        <nz-form-item>
          <nz-form-label>Date of Exit</nz-form-label>
          <nz-form-control>
            <nz-date-picker [formControl]="form.get('doe')!" nzFormat="dd/MM/yyyy"></nz-date-picker>
          </nz-form-control>
        </nz-form-item>

        <!-- Deletion Month -->
        <nz-form-item>
          <nz-form-label>Deletion Month (MM/YYYY)</nz-form-label>
          <nz-form-control nzErrorTip="Use MM/YYYY format">
            <input nz-input [formControl]="form.get('deletionMonth')!" placeholder="MM/YYYY" maxlength="7">
          </nz-form-control>
        </nz-form-item>

        <!-- Exit Type -->
        <nz-form-item>
          <nz-form-label>Exit Type</nz-form-label>
          <nz-form-control>
            <nz-select [formControl]="form.get('exitType')!" nzPlaceHolder="Select exit type">
              <nz-option *ngFor="let opt of exitTypeOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <!-- Exit Reason (full width) -->
        <nz-form-item class="form-grid-full">
          <nz-form-label>Exit Reason</nz-form-label>
          <nz-form-control>
            <textarea nz-input [formControl]="form.get('exitReason')!" rows="3" maxlength="256"></textarea>
            <small class="char-count">{{ (form.get('exitReason')?.value || '').length }}/256</small>
          </nz-form-control>
        </nz-form-item>
      </div>

      <!-- Photo Upload -->
      <div class="photo-section">
        <h4 class="subsection-title">
          <i nz-icon nzType="camera"></i> Employee Photo
        </h4>
        <div class="photo-upload-wrapper">
          <app-photo-upload [existingPhotoUrl]="existingPhotoUrl" (photoChange)="onPhotoChange($event)"></app-photo-upload>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tab-container { padding: 24px 0; }
    .section-title { font-size: 16px; font-weight: 600; color: var(--color-primary-500); margin: 0 0 20px; padding-bottom: 8px; border-bottom: 2px solid #e3e8f0; }
    .char-count { display: block; text-align: right; font-size: 12px; color: #999; margin-top: 4px; }
    .photo-section { margin-top: 32px; padding: 20px; background: #f9f9f9; border-radius: var(--radius-md); border: 1px solid #eee; }
    .subsection-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; color: var(--color-primary-500); margin: 0 0 16px; }
    .subsection-title i { font-size: 20px; }
    .photo-upload-wrapper { display: flex; justify-content: center; }
    nz-form-item { margin-bottom: 0; }
  `]
})
export class ExitDocsTabComponent implements OnInit {
  @Input() form: any;
  @Input() existingPhotoUrl: string = '';

  @Output() photoChange = new EventEmitter<File | null>();

  designationOptions: { value: string; label: string }[] = [];
  exitTypeOptions: { value: string; label: string }[] = [];

  constructor(private masterDataService: MasterDataService) {}

  ngOnInit(): void {
    this.masterDataService.getByCategory('DESIGNATION').subscribe(data => {
      this.designationOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('EXIT_TYPE').subscribe(data => {
      this.exitTypeOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
  }

  onPhotoChange(file: File | null): void {
    this.photoChange.emit(file);
  }
}
