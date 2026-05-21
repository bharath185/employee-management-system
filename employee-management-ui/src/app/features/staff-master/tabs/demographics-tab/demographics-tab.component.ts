import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { MasterDataService } from '../../../../core/services/master-data.service';

@Component({
  selector: 'app-demographics-tab',
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
          <div class="form-section-icon"><i nz-icon nzType="team"></i></div>
          <h4 class="form-section-title">Demographics</h4>
        </div>
        <div class="form-grid-3">
          <nz-form-item>
            <nz-form-label>Religion</nz-form-label>
            <nz-form-control>
              <nz-select [formControl]="form.get('religion')!" nzPlaceHolder="Select religion">
                <nz-option *ngFor="let opt of religionOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Social Category</nz-form-label>
            <nz-form-control>
              <nz-select [formControl]="form.get('socialCategory')!" (nzSelectChange)="onCategoryChange()" nzPlaceHolder="Select category">
                <nz-option *ngFor="let opt of socialCategoryOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Social Subcategory</nz-form-label>
            <nz-form-control>
              <nz-select [formControl]="form.get('socialSubcategory')!" nzPlaceHolder="Select subcategory">
                <nz-option *ngFor="let opt of filteredSubcategories" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
              </nz-select>
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
export class DemographicsTabComponent implements OnInit {
  @Input() form: any;

  religionOptions: { value: string; label: string }[] = [];
  socialCategoryOptions: { value: string; label: string }[] = [];
  allSubcategories: { value: string; label: string; categoryPrefix: string }[] = [];
  filteredSubcategories: { value: string; label: string }[] = [];

  constructor(private masterDataService: MasterDataService) {}

  ngOnInit(): void {
    this.masterDataService.getByCategory('RELIGION').subscribe(data => {
      this.religionOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('SOCIAL_CATEGORY').subscribe(data => {
      this.socialCategoryOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
    this.masterDataService.getByCategory('SOCIAL_SUBCATEGORY').subscribe(data => {
      this.allSubcategories = data.map(i => {
        const prefix = i.code.split('-')[0];
        return { value: i.code, label: i.value, categoryPrefix: prefix };
      });
    });

    // If a category is already selected, filter
    setTimeout(() => this.onCategoryChange());
  }

  onCategoryChange(): void {
    const category = this.form.get('socialCategory')?.value || '';
    if (!category) {
      this.filteredSubcategories = [];
      return;
    }
    this.filteredSubcategories = this.allSubcategories
      .filter(s => s.categoryPrefix === category)
      .map(s => ({ value: s.value, label: s.label }));
  }
}
