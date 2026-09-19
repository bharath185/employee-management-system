import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FormFieldConfig } from '../../core/services/form-field-config.service';
import { MasterDataService } from '../../core/services/master-data.service';
import { MasterDataItem } from '../../core/models/api-response.model';

@Component({
  selector: 'app-custom-fields-renderer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzCheckboxModule,
    NzIconModule
  ],
  template: `
    <div class="form-section custom-fields-section" *ngIf="fields && fields.length > 0" [formGroup]="form">
      <div class="form-section-header">
        <div class="form-section-icon"><i nz-icon nzType="appstore-add"></i></div>
        <h4 class="form-section-title">{{ title }} (Custom Fields)</h4>
      </div>
      <div class="form-grid">
        <ng-container *ngFor="let field of fields">
          <!-- Text Input -->
          <nz-form-item *ngIf="field.fieldType === 'TEXT' && form.get(field.fieldKey)">
            <nz-form-label [nzRequired]="field.isMandatory">{{ field.fieldLabel }} {{ field.isMandatory ? '*' : '' }}</nz-form-label>
            <nz-form-control [nzErrorTip]="field.fieldLabel + ' is required'">
              <input nz-input [formControlName]="field.fieldKey" [placeholder]="field.placeholder || 'Enter ' + field.fieldLabel" />
            </nz-form-control>
          </nz-form-item>

          <!-- Number Input -->
          <nz-form-item *ngIf="field.fieldType === 'NUMBER' && form.get(field.fieldKey)">
            <nz-form-label [nzRequired]="field.isMandatory">{{ field.fieldLabel }} {{ field.isMandatory ? '*' : '' }}</nz-form-label>
            <nz-form-control [nzErrorTip]="field.fieldLabel + ' is required'">
              <input nz-input type="number" [formControlName]="field.fieldKey" [placeholder]="field.placeholder || 'Enter ' + field.fieldLabel" />
            </nz-form-control>
          </nz-form-item>

          <!-- Date Picker -->
          <nz-form-item *ngIf="field.fieldType === 'DATE' && form.get(field.fieldKey)">
            <nz-form-label [nzRequired]="field.isMandatory">{{ field.fieldLabel }} {{ field.isMandatory ? '*' : '' }}</nz-form-label>
            <nz-form-control [nzErrorTip]="field.fieldLabel + ' is required'">
              <nz-date-picker [formControlName]="field.fieldKey" nzFormat="yyyy-MM-dd" style="width: 100%;" [nzPlaceHolder]="field.placeholder || 'Select Date'"></nz-date-picker>
            </nz-form-control>
          </nz-form-item>

          <!-- Dropdown / Select -->
          <nz-form-item *ngIf="field.fieldType === 'SELECT' && form.get(field.fieldKey)">
            <nz-form-label [nzRequired]="field.isMandatory">{{ field.fieldLabel }} {{ field.isMandatory ? '*' : '' }}</nz-form-label>
            <nz-form-control [nzErrorTip]="field.fieldLabel + ' is required'">
              <nz-select [formControlName]="field.fieldKey" [nzPlaceHolder]="field.placeholder || 'Select ' + field.fieldLabel" nzAllowClear>
                <nz-option *ngFor="let opt of getFieldOptions(field)" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <!-- Textarea -->
          <nz-form-item *ngIf="field.fieldType === 'TEXTAREA' && form.get(field.fieldKey)" class="form-grid-full">
            <nz-form-label [nzRequired]="field.isMandatory">{{ field.fieldLabel }} {{ field.isMandatory ? '*' : '' }}</nz-form-label>
            <nz-form-control [nzErrorTip]="field.fieldLabel + ' is required'">
              <textarea nz-input [formControlName]="field.fieldKey" [placeholder]="field.placeholder || 'Enter ' + field.fieldLabel" rows="2"></textarea>
            </nz-form-control>
          </nz-form-item>

          <!-- Checkbox / Boolean -->
          <nz-form-item *ngIf="field.fieldType === 'BOOLEAN' && form.get(field.fieldKey)">
            <nz-form-label [nzRequired]="field.isMandatory">{{ field.fieldLabel }}</nz-form-label>
            <nz-form-control>
              <label nz-checkbox [formControlName]="field.fieldKey">
                <span>{{ field.placeholder || 'Yes / Active' }}</span>
              </label>
            </nz-form-control>
          </nz-form-item>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .custom-fields-section {
      margin-top: 14px;
      border: 1px dashed #cbd5e1;
      background: #fdfefe;
      padding: 12px 16px;
      border-radius: 8px;
    }
  `]
})
export class CustomFieldsRendererComponent implements OnInit, OnChanges {
  @Input() form!: FormGroup;
  @Input() fields: FormFieldConfig[] = [];
  @Input() title: string = 'Additional Information';

  masterOptionsCache: Record<string, { label: string; value: string }[]> = {};

  constructor(private masterDataService: MasterDataService) {}

  ngOnInit(): void {
    this.loadMasterOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields']) {
      this.loadMasterOptions();
    }
  }

  private loadMasterOptions(): void {
    if (!this.fields) return;
    this.fields.forEach(field => {
      if (field.fieldType === 'SELECT' && field.masterCategory && !this.masterOptionsCache[field.masterCategory]) {
        this.masterDataService.getByCategory(field.masterCategory).subscribe({
          next: (items: MasterDataItem[]) => {
            this.masterOptionsCache[field.masterCategory!] = items.map(it => ({
              label: it.value,
              value: it.value
            }));
          }
        });
      }
    });
  }

  getFieldOptions(field: FormFieldConfig): { label: string; value: string }[] {
    if (field.masterCategory && this.masterOptionsCache[field.masterCategory]) {
      return this.masterOptionsCache[field.masterCategory];
    }
    if (field.options) {
      return field.options.split(',').map(s => s.trim()).filter(s => !!s).map(s => ({
        label: s,
        value: s
      }));
    }
    return [];
  }
}
