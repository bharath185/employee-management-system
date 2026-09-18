import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { APIResponse } from '../models/api-response.model';

export interface ReportTemplate {
  id?: number;
  name: string;
  description?: string;
  category?: string;
  filtersJson: string;
  columnsJson: string;
  sortBy?: string;
  sortDirection?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

const LOCAL_STORAGE_KEY = 'ems_saved_report_templates';

@Injectable({
  providedIn: 'root'
})
export class ReportTemplateService {
  private apiUrl = `${environment.apiUrl}/report-templates`;

  constructor(private http: HttpClient) {}

  getTemplates(category: string = 'EMPLOYEE'): Observable<APIResponse<ReportTemplate[]>> {
    const params = new HttpParams().set('category', category);
    return this.http.get<APIResponse<ReportTemplate[]>>(this.apiUrl, { params }).pipe(
      tap(res => {
        if (res?.data) {
          this.syncLocal(res.data);
        }
      }),
      catchError(() => {
        const local = this.getLocalTemplates();
        return of({ success: true, message: 'Local templates', data: local } as APIResponse<ReportTemplate[]>);
      })
    );
  }

  saveTemplate(template: ReportTemplate): Observable<APIResponse<ReportTemplate>> {
    return this.http.post<APIResponse<ReportTemplate>>(this.apiUrl, template).pipe(
      tap(res => {
        if (res?.data) {
          const list = this.getLocalTemplates();
          const idx = list.findIndex(t => t.id === res.data.id || t.name === res.data.name);
          if (idx >= 0) list[idx] = res.data;
          else list.unshift(res.data);
          this.syncLocal(list);
        }
      }),
      catchError(() => {
        const local = this.getLocalTemplates();
        const newT: ReportTemplate = { ...template, id: Date.now(), createdAt: new Date().toISOString() };
        local.unshift(newT);
        this.syncLocal(local);
        return of({ success: true, message: 'Template saved locally', data: newT } as APIResponse<ReportTemplate>);
      })
    );
  }

  updateTemplate(id: number, template: Partial<ReportTemplate>): Observable<APIResponse<ReportTemplate>> {
    return this.http.put<APIResponse<ReportTemplate>>(`${this.apiUrl}/${id}`, template).pipe(
      catchError(() => {
        const local = this.getLocalTemplates();
        const idx = local.findIndex(t => t.id === id);
        if (idx >= 0) {
          local[idx] = { ...local[idx], ...template };
          this.syncLocal(local);
          return of({ success: true, message: 'Updated locally', data: local[idx] } as APIResponse<ReportTemplate>);
        }
        return of({ success: false, message: 'Not found', data: null as any } as APIResponse<ReportTemplate>);
      })
    );
  }

  deleteTemplate(id: number): Observable<APIResponse<void>> {
    return this.http.delete<APIResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const local = this.getLocalTemplates().filter(t => t.id !== id);
        this.syncLocal(local);
      }),
      catchError(() => {
        const local = this.getLocalTemplates().filter(t => t.id !== id);
        this.syncLocal(local);
        return of({ success: true, message: 'Deleted locally', data: undefined } as APIResponse<void>);
      })
    );
  }

  private getLocalTemplates(): ReportTemplate[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private syncLocal(list: ReportTemplate[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }
}
