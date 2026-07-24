import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Holiday } from '../models/payroll.models';
import { APIResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HolidayService {
  private apiUrl = `${environment.apiUrl}/leave/holidays`;

  constructor(private http: HttpClient) {}

  getHolidays(year?: number): Observable<APIResponse<Holiday[]>> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    return this.http.get<APIResponse<Holiday[]>>(this.apiUrl, { params });
  }

  createHoliday(holiday: Partial<Holiday>): Observable<APIResponse<Holiday>> {
    return this.http.post<APIResponse<Holiday>>(this.apiUrl, holiday);
  }

  updateHoliday(id: number, holiday: Partial<Holiday>): Observable<APIResponse<Holiday>> {
    return this.http.put<APIResponse<Holiday>>(`${this.apiUrl}/${id}`, holiday);
  }

  deleteHoliday(id: number): Observable<APIResponse<void>> {
    return this.http.delete<APIResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
