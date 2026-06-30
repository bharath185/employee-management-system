import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { PermissionService } from '../../core/services/permission.service';
import { RolePermission } from '../../core/models/permission.model';

@Component({
  selector: 'app-access-control',
  standalone: true,
  imports: [CommonModule, FormsModule, NzTabsModule, NzTableModule, NzCheckboxModule, NzButtonModule],
  template: `
    <div class="page-header">
      <h2>Access Control</h2>
    </div>

    <p style="margin-bottom:20px;color:#666">Configure what each role can see and do across the application.</p>

    <nz-tabset>
      <nz-tab *ngFor="let role of roles" [nzTitle]="role">
        <nz-table [nzData]="getResourceList()" [nzShowPagination]="false" [nzFrontPagination]="false" nzSize="small">
          <thead>
            <tr>
              <th style="width:250px">Feature</th>
              <th style="width:100px;text-align:center">View</th>
              <th style="width:100px;text-align:center">Add</th>
              <th style="width:100px;text-align:center">Edit</th>
              <th style="width:100px;text-align:center">Delete</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let res of getResourceList()">
              <td><b>{{ getResourceLabel(res) }}</b></td>
              <td style="text-align:center">
                <label nz-checkbox [(ngModel)]="getPerm(role, res).canView" [nzDisabled]="role === 'ADMIN'"></label>
              </td>
              <td style="text-align:center">
                <label nz-checkbox [(ngModel)]="getPerm(role, res).canAdd" [nzDisabled]="role === 'ADMIN'"></label>
              </td>
              <td style="text-align:center">
                <label nz-checkbox [(ngModel)]="getPerm(role, res).canEdit" [nzDisabled]="role === 'ADMIN'"></label>
              </td>
              <td style="text-align:center">
                <label nz-checkbox [(ngModel)]="getPerm(role, res).canDelete" [nzDisabled]="role === 'ADMIN'"></label>
              </td>
            </tr>
          </tbody>
        </nz-table>
        <div style="margin-top:16px" *ngIf="role !== 'ADMIN'">
          <button nz-button nzType="primary" [nzLoading]="saving" (click)="saveRole(role)">
            Save {{ role }} Permissions
          </button>
        </div>
        <div *ngIf="role === 'ADMIN'" style="margin-top:16px;color:#999;font-size:13px">
          Admin always has full access to everything.
        </div>
      </nz-tab>
    </nz-tabset>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h2 { margin: 0; font-size: 20px; font-weight: 600; }
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
