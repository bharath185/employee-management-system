import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { MasterDataService } from '../../../../core/services/master-data.service';

@Component({
  selector: 'app-employment-tab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzIconModule
  ],
  template: `
    <div class="tab-container">
      <h3 class="section-title">Employment Details</h3>
      <div class="form-grid">
        <!-- Employee Status -->
        <nz-form-item>
          <nz-form-label nzRequired>Employee Status *</nz-form-label>
          <nz-form-control nzErrorTip="Status is required">
            <nz-select [formControl]="form.get('employeeStatus')!" nzPlaceHolder="Select status">
              <nz-option *ngFor="let opt of employeeStatusOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <!-- Process Assigned -->
        <nz-form-item>
          <nz-form-label>Process Assigned</nz-form-label>
          <nz-form-control>
            <nz-select [formControl]="form.get('processAssigned')!" nzPlaceHolder="Select process">
              <nz-option *ngFor="let opt of processOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <!-- Department -->
        <nz-form-item>
          <nz-form-label>Department</nz-form-label>
          <nz-form-control>
            <nz-select [formControl]="form.get('department')!" nzPlaceHolder="Select department">
              <nz-option *ngFor="let opt of departmentOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <!-- ESIC No. -->
        <nz-form-item>
          <nz-form-label>ESIC No.</nz-form-label>
          <nz-form-control>
            <input nz-input [formControl]="form.get('esicNo')!" maxlength="10" placeholder="ESIC number">
          </nz-form-control>
        </nz-form-item>

        <!-- Aadhar Seeding -->
        <nz-form-item>
          <nz-form-label>Aadhar Seeding</nz-form-label>
          <nz-form-control>
            <nz-select [formControl]="form.get('aadharSeeding')!" nzPlaceHolder="Select">
              <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <!-- UAN No. -->
        <nz-form-item>
          <nz-form-label>UAN No.</nz-form-label>
          <nz-form-control>
            <input nz-input [formControl]="form.get('uanNo')!" maxlength="12" placeholder="UAN number">
          </nz-form-control>
        </nz-form-item>

        <!-- PF No. -->
        <nz-form-item>
          <nz-form-label>PF No.</nz-form-label>
          <nz-form-control>
            <input nz-input [formControl]="form.get('pfNo')!" maxlength="22" placeholder="PF number">
          </nz-form-control>
        </nz-form-item>

        <!-- UAN Activation -->
        <nz-form-item>
          <nz-form-label>UAN Activation</nz-form-label>
          <nz-form-control>
            <nz-select [formControl]="form.get('uanActivation')!" nzPlaceHolder="Select">
              <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

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
      </div>
    </div>
  `,
  styles: [`
    .tab-container { padding: 24px 0; }
    .section-title { font-size: 16px; font-weight: 600; color: var(--color-primary-500); margin: 0 0 20px; padding-bottom: 8px; border-bottom: 2px solid #e3e8f0; }
    .hint-text { display: block; font-size: 12px; color: #999; margin-top: 4px; }
    nz-form-item { margin-bottom: 0; }
  `]
})
export class EmploymentTabComponent implements OnInit {
  @Input() form: any;

  yesNoOptions: { value: string; label: string }[] = [];
  employeeStatusOptions: { value: string; label: string }[] = [];
  processOptions: { value: string; label: string }[] = [];
  departmentOptions: { value: string; label: string }[] = [];
  designationOptions: { value: string; label: string }[] = [];

  constructor(private masterDataService: MasterDataService) {}

  ngOnInit(): void {
    this.masterDataService.getByCategory('YES_NO').subscribe(data => {
      this.yesNoOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('EMPLOYEE_STATUS').subscribe(data => {
      this.employeeStatusOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('PROCESS').subscribe(data => {
      this.processOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('DEPARTMENT').subscribe(data => {
      this.departmentOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('DESIGNATION').subscribe(data => {
      this.designationOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
  }
}
