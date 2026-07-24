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
}
