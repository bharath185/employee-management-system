import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { MasterDataService } from '../../../../core/services/master-data.service';

@Component({
  selector: 'app-bank-tab',
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
          <div class="form-section-icon"><i nz-icon nzType="bank"></i></div>
          <h4 class="form-section-title">Bank Details</h4>
        </div>
        <div class="form-grid">
          <nz-form-item>
            <nz-form-label>Bank Name</nz-form-label>
            <nz-form-control>
              <nz-select [formControl]="form.get('bankName')!" nzPlaceHolder="Select bank">
                <nz-option *ngFor="let opt of bankNameOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Account Number</nz-form-label>
            <nz-form-control nzErrorTip="Enter valid account number (9-18 digits)">
              <input nz-input [formControl]="form.get('accountNumber')!" placeholder="Account number" maxlength="15">
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>IFSC Code</nz-form-label>
            <nz-form-control nzErrorTip="Enter valid IFSC code (4 letters + 0 + 6 chars)">
              <input nz-input [formControl]="form.get('ifscCode')!" placeholder="SBIN0001234" maxlength="11" style="text-transform:uppercase">
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Branch</nz-form-label>
            <nz-form-control>
              <input nz-input [formControl]="form.get('branch')!" placeholder="Branch name" maxlength="40">
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
export class BankTabComponent implements OnInit {
  @Input() form: any;

  bankNameOptions: { value: string; label: string }[] = [];

  constructor(private masterDataService: MasterDataService) {}

  ngOnInit(): void {
    this.masterDataService.getByCategory('BANK_NAME').subscribe(data => {
      this.bankNameOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
  }
}
