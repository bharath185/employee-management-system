import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LeaveEncashment } from '../models/payroll.models';
import { APIResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EncashmentService {
  private apiUrl = `${environment.apiUrl}/leave/encashments`;

  constructor(private http: HttpClient) {}

  getEncashments(employeeId?: number): Observable<APIResponse<LeaveEncashment[]>> {
    let params = new HttpParams();
    if (employeeId) params = params.set('employeeId', employeeId.toString());
    return this.http.get<APIResponse<LeaveEncashment[]>>(this.apiUrl, { params });
  }

  getMyEncashments(): Observable<APIResponse<LeaveEncashment[]>> {
    return this.http.get<APIResponse<LeaveEncashment[]>>(`${this.apiUrl}/my`);
  }

  createEncashment(encashment: Partial<LeaveEncashment>): Observable<APIResponse<LeaveEncashment>> {
    return this.http.post<APIResponse<LeaveEncashment>>(this.apiUrl, encashment);
  }

  approveEncashment(id: number): Observable<APIResponse<LeaveEncashment>> {
    return this.http.put<APIResponse<LeaveEncashment>>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectEncashment(id: number): Observable<APIResponse<LeaveEncashment>> {
    return this.http.put<APIResponse<LeaveEncashment>>(`${this.apiUrl}/${id}/reject`, {});
  }

  exportExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export`, { responseType: 'blob' });
  }

  importExcel(file: File): Observable<APIResponse<{ imported: number; errors: any[] }>> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<APIResponse<{ imported: number; errors: any[] }>>(`${this.apiUrl}/import`, fd);
  }

  downloadSample(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/sample`, { responseType: 'blob' });
  }
}
