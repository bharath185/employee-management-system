import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APIResponse, DashboardStats } from '../models/api-response.model';
import { Employee } from '../models/employee.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getStats(): Observable<APIResponse<DashboardStats>> {
    return this.http.get<APIResponse<DashboardStats>>(`${this.baseUrl}/dashboard/stats`);
  }

  getRecentEmployees(limit: number = 10): Observable<APIResponse<Employee[]>> {
    return this.http.get<APIResponse<Employee[]>>(`${this.baseUrl}/dashboard/recent?limit=${limit}`);
  }

  getAgeBracketDistribution(): Observable<APIResponse<{ bracket: string; count: number }[]>> {
    return this.http.get<APIResponse<{ bracket: string; count: number }[]>>(`${this.baseUrl}/dashboard/charts/age-bracket`);
  }

  getDesignationDistribution(): Observable<APIResponse<{ designation: string; count: number }[]>> {
    return this.http.get<APIResponse<{ designation: string; count: number }[]>>(`${this.baseUrl}/dashboard/charts/designation`);
  }
}
