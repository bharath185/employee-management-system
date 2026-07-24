import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompOff } from '../models/payroll.models';
import { APIResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CompOffService {
  private apiUrl = `${environment.apiUrl}/leave/comp-offs`;

  constructor(private http: HttpClient) {}

  getCompOffs(employeeId?: number): Observable<APIResponse<CompOff[]>> {
    let params = new HttpParams();
    if (employeeId) params = params.set('employeeId', employeeId.toString());
    return this.http.get<APIResponse<CompOff[]>>(this.apiUrl, { params });
  }

  getMyCompOffs(): Observable<APIResponse<CompOff[]>> {
    return this.http.get<APIResponse<CompOff[]>>(`${this.apiUrl}/my`);
  }

  getMyAvailableCount(): Observable<APIResponse<number>> {
    return this.http.get<APIResponse<number>>(`${this.apiUrl}/available/my`);
  }

  earnCompOff(employeeId: number, date: string): Observable<APIResponse<CompOff>> {
    let params = new HttpParams().set('date', date);
    return this.http.post<APIResponse<CompOff>>(`${this.apiUrl}/earn/${employeeId}`, null, { params });
  }

  availCompOff(id: number): Observable<APIResponse<CompOff>> {
    return this.http.put<APIResponse<CompOff>>(`${this.apiUrl}/${id}/avail`, {});
  }
}
