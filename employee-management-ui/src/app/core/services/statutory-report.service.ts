import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APIResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StatutoryReportService {
  private apiUrl = `${environment.apiUrl}/statutory-reports`;

  constructor(private http: HttpClient) {}

  getIndividualWorkerDetails(year: number, month: number): Observable<APIResponse<string>> {
    const params = new HttpParams().set('year', year.toString()).set('month', month.toString());
    return this.http.get<APIResponse<string>>(`${this.apiUrl}/individual-worker-details`, { params });
  }

  getWagesRegister(year: number, month: number): Observable<APIResponse<string>> {
    const params = new HttpParams().set('year', year.toString()).set('month', month.toString());
    return this.http.get<APIResponse<string>>(`${this.apiUrl}/wages-register`, { params });
  }

  getLeaveRegister(year: number): Observable<APIResponse<string>> {
    const params = new HttpParams().set('year', year.toString());
    return this.http.get<APIResponse<string>>(`${this.apiUrl}/leave-register`, { params });
  }

  downloadIndividualWorkerDetailsExcel(year: number, month: number): Observable<Blob> {
    const params = new HttpParams().set('year', year.toString()).set('month', month.toString());
    return this.http.get(`${this.apiUrl}/individual-worker-details/excel`, {
      params, responseType: 'blob'
    });
  }

  downloadWagesRegisterExcel(year: number, month: number): Observable<Blob> {
    const params = new HttpParams().set('year', year.toString()).set('month', month.toString());
    return this.http.get(`${this.apiUrl}/wages-register/excel`, {
      params, responseType: 'blob'
    });
  }

  downloadLeaveRegisterExcel(year: number): Observable<Blob> {
    const params = new HttpParams().set('year', year.toString());
    return this.http.get(`${this.apiUrl}/leave-register/excel`, {
      params, responseType: 'blob'
    });
  }
}
