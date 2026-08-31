import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MonthlyAttendance, AttendanceRecord } from '../models/attendance.models';
import { APIResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/attendance`;

  constructor(private http: HttpClient) {}

  getMonthlyAttendance(fromDate: string, toDate: string, page = 0, size = 20, process = '', search = ''): Observable<APIResponse<MonthlyAttendance>> {
    let params = new HttpParams()
      .set('fromDate', fromDate)
      .set('toDate', toDate)
      .set('page', page.toString())
      .set('size', size.toString());
    if (process) {
      params = params.set('process', process);
    }
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<APIResponse<MonthlyAttendance>>(`${this.apiUrl}/monthly`, { params });
  }

  getProcesses(): Observable<APIResponse<string[]>> {
    return this.http.get<APIResponse<string[]>>(`${this.apiUrl}/processes`);
  }

  getDepartments(): Observable<APIResponse<string[]>> {
    return this.http.get<APIResponse<string[]>>(`${this.apiUrl}/departments`);
  }

  bulkUpdate(records: AttendanceRecord[]): Observable<APIResponse<void>> {
    return this.http.put<APIResponse<void>>(`${this.apiUrl}/bulk`, records);
  }

  exportExcel(fromDate: string, toDate: string): Observable<Blob> {
    const params = new HttpParams().set('fromDate', fromDate).set('toDate', toDate);
    return this.http.get(`${this.apiUrl}/export`, { params, responseType: 'blob' });
  }

  importExcel(file: File, fromDate: string, toDate: string): Observable<APIResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fromDate', fromDate);
    formData.append('toDate', toDate);
    return this.http.post<APIResponse<any>>(`${this.apiUrl}/import`, formData);
  }

  seedMonthlyAttendance(year: number, month: number): Observable<APIResponse<any>> {
    return this.http.post<APIResponse<any>>(`${this.apiUrl}/seed-month?year=${year}&month=${month}`, {});
  }

  markAllForDate(date: string, status: string, process = ''): Observable<APIResponse<any>> {
    let params = new HttpParams().set('date', date).set('status', status);
    if (process) {
      params = params.set('process', process);
    }
    return this.http.post<APIResponse<any>>(`${this.apiUrl}/mark-all-for-date`, null, { params });
  }
}
