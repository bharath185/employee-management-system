import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { APIResponse } from '../models/api-response.model';
import { PendingRegistration } from '../models/pending-registration.model';

@Injectable({ providedIn: 'root' })
export class PendingRegistrationService {

  private baseUrl = `${environment.apiUrl}/public/register`;
  private adminUrl = `${environment.apiUrl}/pending-registrations`;

  constructor(private http: HttpClient) {}

  submitRegistration(formData: FormData): Observable<APIResponse<PendingRegistration>> {
    return this.http.post<APIResponse<PendingRegistration>>(this.baseUrl, formData);
  }

  getAll(status?: string): Observable<APIResponse<PendingRegistration[]>> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<APIResponse<PendingRegistration[]>>(this.adminUrl, { params });
  }

  getById(id: number): Observable<APIResponse<PendingRegistration>> {
    return this.http.get<APIResponse<PendingRegistration>>(`${this.adminUrl}/${id}`);
  }

  approve(id: number, employeeCode: string): Observable<APIResponse<any>> {
    let params = new HttpParams().set('employeeCode', employeeCode);
    return this.http.post<APIResponse<any>>(`${this.adminUrl}/${id}/approve`, {}, { params });
  }

  reject(id: number, reason?: string): Observable<APIResponse<any>> {
    let params = new HttpParams();
    if (reason) params = params.set('reason', reason);
    return this.http.post<APIResponse<any>>(`${this.adminUrl}/${id}/reject`, {}, { params });
  }

  countPending(): Observable<APIResponse<number>> {
    return this.http.get<APIResponse<number>>(`${this.adminUrl}/count`);
  }

  getQrData(): Observable<APIResponse<string>> {
    return this.http.get<APIResponse<string>>(`${this.baseUrl}/qr-data`);
  }
}
