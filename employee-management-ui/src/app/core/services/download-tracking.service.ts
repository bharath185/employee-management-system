import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DownloadLog, DownloadStats } from '../models/document-template.model';
import { APIResponse, PagedResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DownloadTrackingService {
  private apiUrl = `${environment.apiUrl}/document-templates/download-logs`;

  constructor(private http: HttpClient) {}

  getDownloadLogs(params: {
    page?: number;
    size?: number;
    employeeId?: number;
    templateId?: number;
    financialYear?: string;
  } = {}): Observable<APIResponse<PagedResponse<DownloadLog>>> {
    let httpParams = new HttpParams()
      .set('page', (params.page ?? 0).toString())
      .set('size', (params.size ?? 10).toString());

    if (params.employeeId) httpParams = httpParams.set('employeeId', params.employeeId.toString());
    if (params.templateId) httpParams = httpParams.set('templateId', params.templateId.toString());
    if (params.financialYear) httpParams = httpParams.set('financialYear', params.financialYear);

    return this.http.get<APIResponse<PagedResponse<DownloadLog>>>(this.apiUrl, {
      params: httpParams
    });
  }

  getStats(): Observable<APIResponse<DownloadStats>> {
    return this.http.get<APIResponse<DownloadStats>>(`${this.apiUrl}/stats`);
  }

  getEmployeeLogs(employeeId: number): Observable<APIResponse<DownloadLog[]>> {
    return this.http.get<APIResponse<DownloadLog[]>>(`${this.apiUrl}/employee/${employeeId}`);
  }

  getFinancialYears(): Observable<APIResponse<string[]>> {
    return this.http.get<APIResponse<string[]>>(`${this.apiUrl}/financial-years`);
  }
}
