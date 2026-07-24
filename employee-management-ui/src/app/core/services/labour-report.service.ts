import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APIResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LabourReportService {
  private apiUrl = `${environment.apiUrl}/labour-reports`;

  constructor(private http: HttpClient) {}

  getBonusRegister(year: number, month: number): Observable<APIResponse<any[]>> {
    const params = new HttpParams().set('year', year).set('month', month);
    return this.http.get<APIResponse<any[]>>(`${this.apiUrl}/bonus-register`, { params });
  }

  getOvertimeRegister(year: number, month: number): Observable<APIResponse<any[]>> {
    const params = new HttpParams().set('year', year).set('month', month);
    return this.http.get<APIResponse<any[]>>(`${this.apiUrl}/overtime-register`, { params });
  }

  getCompOffRegister(year: number): Observable<APIResponse<any[]>> {
    const params = new HttpParams().set('year', year);
    return this.http.get<APIResponse<any[]>>(`${this.apiUrl}/comp-off-register`, { params });
  }
}