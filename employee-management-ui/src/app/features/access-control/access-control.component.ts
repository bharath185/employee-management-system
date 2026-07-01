import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { PermissionService } from '../../core/services/permission.service';
import { RolePermission } from '../../core/models/permission.model';

@Component({
  selector: 'app-access-control',
  standalone: true,
  imports: [CommonModule, FormsModule, NzTabsModule, NzTableModule, NzCheckboxModule, NzButtonModule, NzIconModule],
  template: `
    <div class="ac-container page-enter">
      <!-- Gradient Header -->
      <div class="ac-header">
        <div class="ac-title">
          <div class="ac-brand">
            <div class="ac-icon"><i nz-icon nzType="safety"></i></div>
            <span class="ac-logo">ACCESS CONTROL</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="ac-tabs-wrap">
        <nz-tabset [nzSize]="'small'" nzType="card">
          <nz-tab *ngFor="let role of roles" [nzTitle]="role">
            <div class="ac-table-container">
              <nz-table [nzData]="getResourceList()" [nzShowPagination]="false" [nzFrontPagination]="false" nzSize="small" nzTableLayout="fixed">
                <thead>
                  <tr>
                    <th class="th-feature">Feature</th>
                    <th class="th-action">View</th>
                    <th class="th-action">Add</th>
                    <th class="th-action">Edit</th>
                    <th class="th-action">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let res of getResourceList()">
                    <td class="td-feature"><span class="feature-label">{{ getResourceLabel(res) }}</span></td>
                    <td class="td-action">
                      <label nz-checkbox [(ngModel)]="getPerm(role, res).canView" [nzDisabled]="role === 'ADMIN'" class="ac-checkbox"></label>
                    </td>
                    <td class="td-action">
                      <label nz-checkbox [(ngModel)]="getPerm(role, res).canAdd" [nzDisabled]="role === 'ADMIN'" class="ac-checkbox"></label>
                    </td>
                    <td class="td-action">
                      <label nz-checkbox [(ngModel)]="getPerm(role, res).canEdit" [nzDisabled]="role === 'ADMIN'" class="ac-checkbox"></label>
                    </td>
                    <td class="td-action">
                      <label nz-checkbox [(ngModel)]="getPerm(role, res).canDelete" [nzDisabled]="role === 'ADMIN'" class="ac-checkbox"></label>
                    </td>
                  </tr>
                </tbody>
              </nz-table>
            </div>

            <div class="ac-footer" *ngIf="role !== 'ADMIN'">
              <button nz-button class="ac-btn-save" [nzLoading]="saving" (click)="saveRole(role)">
                <i nz-icon nzType="save"></i> Save {{ role }} Permissions
              </button>
            </div>
            <div class="ac-footer ac-footer-info" *ngIf="role === 'ADMIN'">
              <i nz-icon nzType="info-circle" style="margin-right:6px"></i>
              Admin always has full access to everything.
            </div>
          </nz-tab>
        </nz-tabset>
      </div>
    </div>
  `,
  styles: [`
    /* ─── Page Enter Animation ─── */
    .page-enter { animation: pageFadeIn .35s ease-out; }
    @keyframes pageFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* ─── Scrollbar ─── */
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: #f1f3f6; border-radius: 4px; }
    ::-webkit-scrollbar-thumb { background: #c1c7d0; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #a0a8b4; }

    /* ─── Container ─── */
    .ac-container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; width: 100%; max-width: 100%; padding: 12px 16px; box-sizing: border-box; }

    /* ─── Gradient Header (matching Attendance UI) ─── */
    .ac-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: linear-gradient(135deg, #1f3d6e 0%, #16213e 100%); border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,.15); margin: 0 0 14px; }
    .ac-title { display: flex; align-items: center; gap: 12px; }
    .ac-brand { display: flex; align-items: center; gap: 10px; }
    .ac-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.15); border-radius: 8px; color: #fff; font-size: 16px; }
    .ac-logo { font-size: 17px; font-weight: 800; color: #fff; letter-spacing: 1.5px; }

    /* ─── Tabs ─── */
    .ac-tabs-wrap { margin-top: 12px; padding: 0; }
    .ac-tabs-wrap ::ng-deep .ant-tabs-card.ant-tabs-small > .ant-tabs-nav .ant-tabs-tab { padding: 4px 14px; font-size: 12px; font-weight: 600; color: #555; background: #f5f6fa; border: 1px solid #e8eaed; border-bottom: none; border-radius: 6px 6px 0 0; transition: all .2s; }
    .ac-tabs-wrap ::ng-deep .ant-tabs-card.ant-tabs-small > .ant-tabs-nav .ant-tabs-tab-active { background: #fff; color: #1f3d6e; border-bottom-color: #fff; }
    .ac-tabs-wrap ::ng-deep .ant-tabs-card.ant-tabs-small > .ant-tabs-nav .ant-tabs-tab:hover:not(.ant-tabs-tab-active) { color: #1f3d6e; background: #eef0f6; }
    .ac-tabs-wrap ::ng-deep .ant-tabs-nav { margin-bottom: 0; }
    .ac-tabs-wrap ::ng-deep .ant-tabs-nav::before { border-bottom: 1px solid #e8eaed; }
    .ac-tabs-wrap ::ng-deep .ant-tabs-tabpane { padding: 0; }

    /* ─── Table Container ─── */
    .ac-table-container { background: #fff; border: 1px solid #e8eaed; border-radius: 0; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.05); }

    /* ─── Table Header ─── */
    .ac-table-container ::ng-deep .ant-table-thead > tr > th { background: #f8f9fc !important; color: #1f3d6e !important; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: .5px; padding: 8px 12px !important; border-bottom: 2px solid #e8eaed !important; }
    .th-feature { width: 250px; text-align: left !important; }
    .th-action { width: 100px; text-align: center !important; }

    /* ─── Table Body ─── */
    .ac-table-container ::ng-deep .ant-table-tbody > tr > td { padding: 8px 12px !important; border-bottom: 1px solid #f0f2f5; font-size: 13px; transition: background .15s; }
    .ac-table-container ::ng-deep .ant-table-tbody > tr:hover > td { background: #f0f4ff !important; }
    .td-feature { text-align: left; }
    .feature-label { font-weight: 600; color: #2d3748; font-size: 13px; }
    .td-action { text-align: center !important; }

    /* ─── Checkboxes with Theme Colors ─── */
    .ac-checkbox { display: inline-flex; align-items: center; justify-content: center; }
    .ac-checkbox ::ng-deep .ant-checkbox-inner { width: 16px; height: 16px; border-radius: 4px; border: 2px solid #c1c7d0; transition: all .2s; }
    .ac-checkbox ::ng-deep .ant-checkbox-checked .ant-checkbox-inner { background: #4361ee; border-color: #4361ee; }
    .ac-checkbox ::ng-deep .ant-checkbox-checked::after { border-color: #4361ee; }
    .ac-checkbox ::ng-deep .ant-checkbox-wrapper:hover .ant-checkbox-inner { border-color: #4361ee; }
    .ac-checkbox ::ng-deep .ant-checkbox-disabled .ant-checkbox-inner { background: #e8eaed; border-color: #d0d5dd; }
    .ac-checkbox ::ng-deep .ant-checkbox-disabled.ant-checkbox-checked .ant-checkbox-inner { background: #a0a8b4; border-color: #a0a8b4; }

    /* ─── Footer ─── */
    .ac-footer { margin-top: 12px; padding: 4px 0 12px; }
    .ac-footer-info { color: #888; font-size: 13px; display: flex; align-items: center; }

    /* ─── Save Button with Gradient ─── */
    .ac-btn-save { height: 32px; padding: 0 18px; font-size: 12px; font-weight: 600; border: none; border-radius: 6px; background: linear-gradient(135deg, #4361ee, #3a0ca3); color: #fff; box-shadow: 0 2px 6px rgba(67, 97, 238, .35); transition: all .2s; letter-spacing: .3px; display: inline-flex; align-items: center; gap: 6px; }
    .ac-btn-save:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(67, 97, 238, .45); opacity: .95; }
    .ac-btn-save:active:not(:disabled) { transform: translateY(0); }
    .ac-btn-save:disabled { opacity: .6; cursor: not-allowed; box-shadow: none; }
    .ac-btn-save ::ng-deep .anticon { font-size: 14px; }
  `]
})
export class AccessControlComponent implements OnInit {
  roles = ['ADMIN', 'HR', 'EMPLOYEE'];
  saving = false;
  private permissions: RolePermission[] = [];

  constructor(private permService: PermissionService, private msg: NzMessageService) {}

  ngOnInit() {
    this.permService.loadPermissions().subscribe({
      next: (res) => {
        if (res.success) {
          this.permissions = res.data['EMPLOYEE'] || [];
          this.loadAll();
        }
      }
    });
  }

  loadAll() {
    this.permService.loadPermissions().subscribe();
  }

  getResourceList(): string[] {
    return this.permService.getResources();
  }

  getResourceLabel(r: string): string {
    return this.permService.getResourceLabel(r);
  }

  getPerm(role: string, resource: string): RolePermission {
    const matrix = this.permService['matrixSubject'].value;
    const perms = matrix[role] || [];
    let p = perms.find(x => x.resource === resource);
    if (!p) {
      p = { role, resource, canView: false, canAdd: false, canEdit: false, canDelete: false };
      if (!matrix[role]) matrix[role] = [];
      matrix[role].push(p);
    }
    return p;
  }

  saveRole(role: string) {
    this.saving = true;
    const matrix = this.permService['matrixSubject'].value;
    const perms = (matrix[role] || []).map(p => ({
      ...p, role, id: undefined
    }));
    this.permService.saveRolePermissions(role, perms).subscribe({
      next: () => { this.msg.success(`${role} permissions saved`); this.saving = false; },
      error: () => { this.msg.error('Failed to save'); this.saving = false; }
    });
  }
}
