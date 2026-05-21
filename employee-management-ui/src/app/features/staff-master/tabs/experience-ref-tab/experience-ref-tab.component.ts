import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { MasterDataService } from '../../../../core/services/master-data.service';

@Component({
  selector: 'app-experience-ref-tab',
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
      <h3 class="section-title">Past Experience</h3>

      <div class="experience-section">
        <div class="form-row">
          <nz-form-item>
            <nz-form-label>Past Experience</nz-form-label>
            <nz-form-control>
              <nz-select [formControl]="form.get('pastExperience')!" nzPlaceHolder="Select">
                <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>
          <nz-form-item *ngIf="form.get('pastExperience')?.value === 'Yes'">
            <nz-form-label>Organization Name(s)</nz-form-label>
            <nz-form-control>
              <input nz-input [formControl]="form.get('organizationName')!" maxlength="56">
            </nz-form-control>
          </nz-form-item>
          <nz-form-item *ngIf="form.get('pastExperience')?.value === 'Yes'">
            <nz-form-label>Period of Employment</nz-form-label>
            <nz-form-control>
              <input nz-input [formControl]="form.get('periodOfEmployment')!" maxlength="50" placeholder="e.g., 2 years">
            </nz-form-control>
          </nz-form-item>
        </div>
      </div>

      <h3 class="section-title" style="margin-top:32px;">References</h3>

      <div class="ref-section">
        <h4 class="subsection-title">
          <i nz-icon nzType="team"></i> Reference 1
        </h4>
        <div class="form-grid">
          <nz-form-item>
            <nz-form-label>Reference 1 Name</nz-form-label>
            <nz-form-control>
              <input nz-input [formControl]="form.get('ref1Name')!" maxlength="20">
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Reference 1 Relationship</nz-form-label>
            <nz-form-control>
              <nz-select [formControl]="form.get('ref1Relationship')!" nzPlaceHolder="Select relationship">
                <nz-option *ngFor="let opt of relationshipOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Reference 1 Address</nz-form-label>
            <nz-form-control>
              <input nz-input [formControl]="form.get('ref1Address')!" maxlength="256">
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Reference 1 Mobile</nz-form-label>
            <nz-form-control nzErrorTip="Enter valid 10-digit number">
              <input nz-input [formControl]="form.get('ref1Mobile')!" maxlength="10" placeholder="10-digit mobile">
            </nz-form-control>
          </nz-form-item>
        </div>
      </div>

      <div class="ref-section">
        <h4 class="subsection-title">
          <i nz-icon nzType="team"></i> Reference 2
        </h4>
        <div class="form-grid">
          <nz-form-item>
            <nz-form-label>Reference 2 Name</nz-form-label>
            <nz-form-control>
              <input nz-input [formControl]="form.get('ref2Name')!" maxlength="20">
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Reference 2 Relationship</nz-form-label>
            <nz-form-control>
              <nz-select [formControl]="form.get('ref2Relationship')!" nzPlaceHolder="Select relationship">
                <nz-option *ngFor="let opt of relationshipOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Reference 2 Address</nz-form-label>
            <nz-form-control>
              <input nz-input [formControl]="form.get('ref2Address')!" maxlength="256">
            </nz-form-control>
          </nz-form-item>
          <nz-form-item>
            <nz-form-label>Reference 2 Mobile</nz-form-label>
            <nz-form-control nzErrorTip="Enter valid 10-digit number">
              <input nz-input [formControl]="form.get('ref2Mobile')!" maxlength="10" placeholder="10-digit mobile">
            </nz-form-control>
          </nz-form-item>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tab-container { padding: 24px 0; }
    .section-title { font-size: 16px; font-weight: 600; color: var(--color-primary-500); margin: 0 0 20px; padding-bottom: 8px; border-bottom: 2px solid #e3e8f0; }
    .experience-section { margin-bottom: 24px; padding: 16px; background: #f9f9f9; border-radius: var(--radius-md); border: 1px solid #eee; }
    .ref-section { margin-bottom: 24px; padding: 16px; background: #f9f9f9; border-radius: var(--radius-md); border: 1px solid #eee; }
    .subsection-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; color: var(--color-primary-500); margin: 0 0 16px; }
    .subsection-title i { font-size: 20px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    nz-form-item { margin-bottom: 0; }
    @media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } }
  `]
})
export class ExperienceRefTabComponent implements OnInit {
  @Input() form: any;

  yesNoOptions: { value: string; label: string }[] = [];
  relationshipOptions: { value: string; label: string }[] = [];

  constructor(private masterDataService: MasterDataService) {}

  ngOnInit(): void {
    this.masterDataService.getByCategory('YES_NO').subscribe(data => {
      this.yesNoOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('RELATIONSHIP').subscribe(data => {
      this.relationshipOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
  }
}
