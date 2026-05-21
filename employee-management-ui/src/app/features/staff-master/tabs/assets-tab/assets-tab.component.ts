import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { MasterDataService } from '../../../../core/services/master-data.service';

@Component({
  selector: 'app-assets-tab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzSelectModule,
    NzIconModule
  ],
  template: `
    <div class="tab-container">
      <h3 class="section-title">Household Assets</h3>
      <p class="section-desc">Indicate whether the employee owns each asset</p>
      <div class="assets-grid">
        <div class="asset-card" *ngFor="let asset of assets">
          <i nz-icon [nzType]="asset.icon" class="asset-icon"></i>
          <span class="asset-label">{{ asset.label }}</span>
          <nz-form-item class="asset-select">
            <nz-form-control>
              <nz-select [formControl]="form.get(asset.control)!" nzPlaceHolder="Select">
                <nz-option *ngFor="let opt of yesNoOptions" [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tab-container { padding: 24px 0; }
    .section-title { font-size: 16px; font-weight: 600; color: var(--color-primary-500); margin: 0 0 4px; padding-bottom: 8px; border-bottom: 2px solid #e3e8f0; }
    .section-desc { font-size: 13px; color: #666; margin: 0 0 20px; }
    .assets-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .asset-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 20px 16px;
      background: #f9f9f9;
      border-radius: var(--radius-md);
      border: 1px solid #eee;
      transition: all 0.2s;
    }
    .asset-card:hover { border-color: var(--color-primary-500); background: #f0f4ff; }
    .asset-icon { font-size: 36px; color: var(--color-primary-500); }
    .asset-label { font-size: 14px; font-weight: 500; color: #333; }
    .asset-select { width: 100%; margin-bottom: 0; }
    @media (max-width: 768px) { .assets-grid { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 480px) { .assets-grid { grid-template-columns: 1fr; } }
  `]
})
export class AssetsTabComponent implements OnInit {
  @Input() form: any;

  yesNoOptions: { value: string; label: string }[] = [];

  assets = [
    { label: 'TV', control: 'hasTv', icon: 'monitor' },
    { label: 'Fridge', control: 'hasFridge', icon: 'coffee' },
    { label: 'Laptop', control: 'hasLaptop', icon: 'laptop' },
    { label: 'WiFi', control: 'hasWifi', icon: 'wifi' },
    { label: '2 Wheeler', control: 'has2wheeler', icon: 'car' },
    { label: '4 Wheeler', control: 'has4wheeler', icon: 'car' }
  ];

  constructor(private masterDataService: MasterDataService) {}

  ngOnInit(): void {
    this.masterDataService.getByCategory('YES_NO').subscribe(data => {
      this.yesNoOptions = data.map(i => ({ value: i.code, label: i.value }));
    });
  }
}
