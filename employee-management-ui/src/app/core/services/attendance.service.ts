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

  getMonthlyAttendance(year: number, month: number, page = 0, size = 50): Observable<APIResponse<MonthlyAttendance>> {
    const params = new HttpParams()
      .set('year', year.toString())
      .set('month', month.toString())
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<APIResponse<MonthlyAttendance>>(`${this.apiUrl}/monthly`, { params });
  }

  bulkUpdate(records: AttendanceRecord[]): Observable<APIResponse<void>> {
    return this.http.put<APIResponse<void>>(`${this.apiUrl}/bulk`, records);
  }

  exportExcel(year: number, month: number): Observable<Blob> {
    const params = new HttpParams().set('year', year.toString()).set('month', month.toString());
    return this.http.get(`${this.apiUrl}/export`, { params, responseType: 'blob' });
  }

  importExcel(file: File, year: number, month: number): Observable<APIResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('year', year.toString());
    formData.append('month', month.toString());
    return this.http.post<APIResponse<any>>(`${this.apiUrl}/import`, formData);
  }

  deleteFutureAttendance(cutOffDate: string): Observable<APIResponse<number>> {
    const params = new HttpParams().set('cutOffDate', cutOffDate);
    return this.http.delete<APIResponse<number>>(`${this.apiUrl}/future`, { params });
  }
}
