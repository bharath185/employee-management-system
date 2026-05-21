import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { MasterDataService } from '../../../../core/services/master-data.service';

@Component({
  selector: 'app-education-tab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzIconModule
  ],
  template: `
    <div class="tab-container">
      <h3 class="section-title">Education & Verification</h3>
      <div class="form-grid-4">
        <!-- SSC -->
        <nz-form-item>
          <nz-form-label>SSC / Std X</nz-form-label>
          <nz-form-control>
            <nz-select [formControl]="form.get('sscStatus')!" nzPlaceHolder="Select">
              <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <!-- Intermediate -->
        <nz-form-item>
          <nz-form-label>Intermediate / Std XII</nz-form-label>
          <nz-form-control>
            <nz-select [formControl]="form.get('intermediateStatus')!" nzPlaceHolder="Select">
              <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <!-- Bachelor's Degree -->
        <nz-form-item>
          <nz-form-label>Bachelor's Degree</nz-form-label>
          <nz-form-control>
            <nz-select [formControl]="form.get('bachelorsDegree')!" nzPlaceHolder="Select">
              <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <!-- Master's Degree -->
        <nz-form-item>
          <nz-form-label>Master's Degree</nz-form-label>
          <nz-form-control>
            <nz-select [formControl]="form.get('mastersDegree')!" nzPlaceHolder="Select">
              <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <!-- Aadhaar Verification -->
        <nz-form-item>
          <nz-form-label>Aadhaar Verification</nz-form-label>
          <nz-form-control>
            <nz-select [formControl]="form.get('aadhaarVerification')!" nzPlaceHolder="Select">
              <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <!-- PAN Verification -->
        <nz-form-item>
          <nz-form-label>PAN Verification</nz-form-label>
          <nz-form-control>
            <nz-select [formControl]="form.get('panVerification')!" nzPlaceHolder="Select">
              <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <!-- OSV -->
        <nz-form-item>
          <nz-form-label>OSV</nz-form-label>
          <nz-form-control>
            <nz-select [formControl]="form.get('osv')!" nzPlaceHolder="Select">
              <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <!-- Spacer for grid alignment -->
        <div></div>

        <!-- Remarks (full width) -->
        <nz-form-item class="form-grid-full">
          <nz-form-label>Remarks</nz-form-label>
          <nz-form-control>
            <textarea nz-input [formControl]="form.get('remarks')!" rows="3" maxlength="140"></textarea>
            <small class="char-count">{{ (form.get('remarks')?.value || '').length }}/140</small>
          </nz-form-control>
        </nz-form-item>
      </div>
    </div>
  `,
  styles: [`
    .tab-container { padding: 24px 0; }
    .section-title { font-size: 16px; font-weight: 600; color: var(--color-primary-500); margin: 0 0 20px; padding-bottom: 8px; border-bottom: 2px solid #e3e8f0; }
    .char-count { display: block; text-align: right; font-size: 12px; color: #999; margin-top: 4px; }
    nz-form-item { margin-bottom: 0; }
  `]
})
export class EducationTabComponent implements OnInit {
  @Input() form: any;

  yesNoOptions: { value: string; label: string }[] = [];

  constructor(private masterDataService: MasterDataService) {}

  ngOnInit(): void {
    this.masterDataService.getByCategory('YES_NO').subscribe(data => {
      this.yesNoOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
  }
}
