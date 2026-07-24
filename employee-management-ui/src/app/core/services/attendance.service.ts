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

  getMonthlyAttendance(fromDate: string, toDate: string, page = 0, size = 50, department = ''): Observable<APIResponse<MonthlyAttendance>> {
    let params = new HttpParams()
      .set('fromDate', fromDate)
      .set('toDate', toDate)
      .set('page', page.toString())
      .set('size', size.toString());
    if (department) {
      params = params.set('department', department);
    }
    return this.http.get<APIResponse<MonthlyAttendance>>(`${this.apiUrl}/monthly`, { params });
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
}
