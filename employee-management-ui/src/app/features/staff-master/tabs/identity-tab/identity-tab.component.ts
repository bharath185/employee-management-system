import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { MasterDataService } from '../../../../core/services/master-data.service';

@Component({
  selector: 'app-identity-tab',
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
      <div class="form-section">
        <div class="form-section-header">
          <div class="form-section-icon"><i nz-icon nzType="idcard"></i></div>
          <h4 class="form-section-title">Identity Documents</h4>
        </div>
        <div class="form-grid-3">
          <nz-form-item>
            <nz-form-label>Blood Group</nz-form-label>
            <nz-form-control>
              <nz-select [formControl]="form.get('bloodGroup')!" nzPlaceHolder="Select blood group">
                <nz-option *ngFor="let opt of bloodGroupOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Aadhar Number</nz-form-label>
            <nz-form-control nzErrorTip="Enter valid 12-digit Aadhar number">
              <input nz-input [formControl]="form.get('aadharNumber')!" placeholder="12-digit Aadhar number" maxlength="12">
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>PAN Number</nz-form-label>
            <nz-form-control nzErrorTip="Enter valid PAN (5 letters + 4 digits + 1 letter)">
              <input nz-input [formControl]="form.get('panNumber')!" placeholder="ABCDE1234F" maxlength="10" style="text-transform:uppercase">
            </nz-form-control>
          </nz-form-item>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tab-container { padding: 24px 0; }
    .form-section { background: #fff; border-radius: var(--radius-lg); padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid var(--color-border-light); }
    .form-section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 2px solid var(--color-primary-500); }
    .form-section-icon { width: 34px; height: 34px; border-radius: var(--radius-md); background: linear-gradient(135deg, var(--color-primary-500), #2a5298); display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
    .form-section-icon i { font-size: 18px; }
    .form-section-title { font-size: 15px; font-weight: 600; color: var(--color-primary-500); margin: 0; }
    nz-form-item { margin-bottom: 0; }
  `]
})
export class IdentityTabComponent implements OnInit {
  @Input() form: any;

  bloodGroupOptions: { value: string; label: string }[] = [];

  constructor(private masterDataService: MasterDataService) {}

  ngOnInit(): void {
    this.masterDataService.getByCategory('BLOOD_GROUP').subscribe(data => {
      this.bloodGroupOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
  }
}
