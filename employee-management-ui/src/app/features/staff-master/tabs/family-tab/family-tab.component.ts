import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-family-tab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzIconModule
  ],
  template: `
    <div class="tab-container">
      <h3 class="section-title">Family Details</h3>

      <div class="family-section">
        <h4 class="subsection-title">
          <i nz-icon nzType="user"></i> Father
        </h4>
        <div class="form-row">
          <nz-form-item>
            <nz-form-label>Father Name</nz-form-label>
            <nz-form-control>
              <input nz-input [formControl]="form.get('fatherName')!" maxlength="20">
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Father Phone</nz-form-label>
            <nz-form-control nzErrorTip="Enter valid 10-digit number">
              <input nz-input [formControl]="form.get('fatherPhone')!" maxlength="10" placeholder="10-digit mobile">
            </nz-form-control>
          </nz-form-item>
        </div>
      </div>

      <div class="family-section">
        <h4 class="subsection-title">
          <i nz-icon nzType="user"></i> Mother
        </h4>
        <div class="form-row">
          <nz-form-item>
            <nz-form-label>Mother Name</nz-form-label>
            <nz-form-control>
              <input nz-input [formControl]="form.get('motherName')!" maxlength="20">
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Mother Phone</nz-form-label>
            <nz-form-control nzErrorTip="Enter valid 10-digit number">
              <input nz-input [formControl]="form.get('motherPhone')!" maxlength="10" placeholder="10-digit mobile">
            </nz-form-control>
          </nz-form-item>
        </div>
      </div>

      <div class="family-section" *ngIf="form.get('maritalStatus')?.value === 'Married'">
        <h4 class="subsection-title">
          <i nz-icon nzType="heart"></i> Spouse
        </h4>
        <div class="form-row">
          <nz-form-item>
            <nz-form-label>Spouse Name</nz-form-label>
            <nz-form-control>
              <input nz-input [formControl]="form.get('spouseName')!" maxlength="20">
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Spouse Phone</nz-form-label>
            <nz-form-control nzErrorTip="Enter valid 10-digit number">
              <input nz-input [formControl]="form.get('spousePhone')!" maxlength="10" placeholder="10-digit mobile">
            </nz-form-control>
          </nz-form-item>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tab-container { padding: 24px 0; }
    .section-title { font-size: 16px; font-weight: 600; color: var(--color-primary-500); margin: 0 0 20px; padding-bottom: 8px; border-bottom: 2px solid #e3e8f0; }
    .family-section { margin-bottom: 24px; padding: 16px; background: #f9f9f9; border-radius: var(--radius-md); border: 1px solid #eee; }
    .subsection-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; color: var(--color-primary-500); margin: 0 0 16px; }
    .subsection-title i { font-size: 20px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    nz-form-item { margin-bottom: 0; }
    @media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } }
  `]
})
export class FamilyTabComponent {
  @Input() form: any;
}
