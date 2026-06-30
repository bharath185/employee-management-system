import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, catchError } from 'rxjs';
import { APIResponse } from '../models/api-response.model';
import { RolePermission, PermissionMatrix } from '../models/permission.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private apiUrl = `${environment.apiUrl}/permissions`;
  private matrixSubject = new BehaviorSubject<PermissionMatrix>({});
  matrix$ = this.matrixSubject.asObservable();

  private myPermsSubject = new BehaviorSubject<RolePermission[]>([]);
  myPerms$ = this.myPermsSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadPermissions(): Observable<APIResponse<PermissionMatrix>> {
    return this.http.get<APIResponse<PermissionMatrix>>(this.apiUrl).pipe(
      tap(res => { if (res.success) this.matrixSubject.next(res.data); }),
      catchError(() => { return of({ success: false, data: {} } as any); })
    );
  }

  loadMyPermissions(role: string): Observable<APIResponse<RolePermission[]>> {
    return this.http.get<APIResponse<RolePermission[]>>(`${this.apiUrl}/my`).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.myPermsSubject.next(res.data);
          const matrix = this.matrixSubject.value;
          matrix[role] = res.data;
          this.matrixSubject.next(matrix);
        }
      }),
      catchError(() => { return of({ success: false, data: [] } as any); })
    );
  }

  saveRolePermissions(role: string, permissions: RolePermission[]): Observable<APIResponse<void>> {
    return this.http.put<APIResponse<void>>(`${this.apiUrl}/role/${role}`, permissions).pipe(
      tap(() => this.loadPermissions().subscribe())
    );
  }

  hasPermission(role: string, resource: string, action: 'canView' | 'canAdd' | 'canEdit' | 'canDelete'): boolean {
    const matrix = this.matrixSubject.value;
    const perms = matrix[role];
    if (!perms || perms.length === 0) return false;
    const p = perms.find(x => x.resource === resource);
    return p ? p[action] : false;
  }

  getResources(): string[] {
    return ['dashboard', 'staff_master', 'company', 'masters', 'doc_templates', 'payroll', 'leave', 'reports', 'registrations', 'chat'];
  }

  getResourceLabel(resource: string): string {
    const labels: Record<string, string> = {
      dashboard: 'Dashboard', staff_master: 'Staff Master', company: 'Company Setup',
      masters: 'Master Data', doc_templates: 'Document Templates', payroll: 'Payroll',
      leave: 'Leave Management', reports: 'Statutory Reports', registrations: 'Registrations',
      chat: 'Chat Assistant'
    };
    return labels[resource] || resource;
  }
}
