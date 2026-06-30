import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LeaveType, LeaveBalance, LeaveApplication } from '../models/payroll.models';
import { APIResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  private apiUrl = `${environment.apiUrl}/leave`;

  constructor(private http: HttpClient) {}

  getLeaveTypes(): Observable<APIResponse<LeaveType[]>> {
    return this.http.get<APIResponse<LeaveType[]>>(`${this.apiUrl}/types`);
  }

  createLeaveType(leaveType: Partial<LeaveType>): Observable<APIResponse<LeaveType>> {
    return this.http.post<APIResponse<LeaveType>>(`${this.apiUrl}/types`, leaveType);
  }

  getLeaveBalances(employeeId?: number, year?: number): Observable<APIResponse<LeaveBalance[]>> {
    let params = new HttpParams();
    if (employeeId) params = params.set('employeeId', employeeId.toString());
    if (year) params = params.set('year', year.toString());
    return this.http.get<APIResponse<LeaveBalance[]>>(`${this.apiUrl}/balances`, { params });
  }

  initializeBalances(employeeId: number, year: number): Observable<APIResponse<void>> {
    return this.http.post<APIResponse<void>>(`${this.apiUrl}/balances/init/${employeeId}?year=${year}`, {});
  }

  initializeAllBalances(year: number): Observable<APIResponse<string>> {
    return this.http.post<APIResponse<string>>(`${this.apiUrl}/balances/init-all?year=${year}`, {});
  }

  updateLeaveBalance(id: number, data: any): Observable<APIResponse<LeaveBalance>> {
    return this.http.put<APIResponse<LeaveBalance>>(`${this.apiUrl}/balances/${id}`, data);
  }

  getApplications(params: { status?: string; page?: number; size?: number } = {}): Observable<APIResponse<any>> {
    let httpParams = new HttpParams()
      .set('page', (params.page ?? 0).toString())
      .set('size', (params.size ?? 20).toString());
    if (params.status) httpParams = httpParams.set('status', params.status);
    return this.http.get<APIResponse<any>>(`${this.apiUrl}/applications`, { params: httpParams });
  }

  getApplicationsByEmployee(employeeId: number): Observable<APIResponse<LeaveApplication[]>> {
    return this.http.get<APIResponse<LeaveApplication[]>>(`${this.apiUrl}/applications/employee/${employeeId}`);
  }

  getApplicationsByMonth(year: number, month: number): Observable<APIResponse<LeaveApplication[]>> {
    const params = new HttpParams().set('year', year.toString()).set('month', month.toString());
    return this.http.get<APIResponse<LeaveApplication[]>>(`${this.apiUrl}/applications/month`, { params });
  }

  applyLeave(application: Partial<LeaveApplication>): Observable<APIResponse<LeaveApplication>> {
    return this.http.post<APIResponse<LeaveApplication>>(`${this.apiUrl}/applications`, application);
  }

  approveLeave(id: number): Observable<APIResponse<LeaveApplication>> {
    return this.http.put<APIResponse<LeaveApplication>>(`${this.apiUrl}/applications/${id}/approve`, {});
  }

  rejectLeave(id: number): Observable<APIResponse<LeaveApplication>> {
    return this.http.put<APIResponse<LeaveApplication>>(`${this.apiUrl}/applications/${id}/reject`, {});
  }

  cancelLeave(id: number): Observable<APIResponse<void>> {
    return this.http.put<APIResponse<void>>(`${this.apiUrl}/applications/${id}/cancel`, {});
  }

  getMyBalances(): Observable<APIResponse<LeaveBalance[]>> {
    return this.http.get<APIResponse<LeaveBalance[]>>(`${this.apiUrl}/balances/my`);
  }

  applyLeaveSelf(application: Partial<LeaveApplication>): Observable<APIResponse<LeaveApplication>> {
    return this.http.post<APIResponse<LeaveApplication>>(`${this.apiUrl}/applications/self`, application);
  }

  getMyApplications(): Observable<APIResponse<LeaveApplication[]>> {
    return this.http.get<APIResponse<LeaveApplication[]>>(`${this.apiUrl}/applications/my`);
  }

  cancelMyLeave(id: number): Observable<APIResponse<void>> {
    return this.http.put<APIResponse<void>>(`${this.apiUrl}/applications/${id}/cancel/self`, {});
  }
}
