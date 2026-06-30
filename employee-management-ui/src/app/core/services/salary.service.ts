import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Salary } from '../models/payroll.models';
import { APIResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SalaryService {
  private apiUrl = `${environment.apiUrl}/salaries`;

  constructor(private http: HttpClient) {}

  getSalaries(params: { year?: number; month?: number; page?: number; size?: number } = {}): Observable<APIResponse<Salary[]>> {
    let httpParams = new HttpParams()
      .set('page', (params.page ?? 0).toString())
      .set('size', (params.size ?? 50).toString());
    if (params.year) httpParams = httpParams.set('year', params.year.toString());
    if (params.month) httpParams = httpParams.set('month', params.month.toString());
    return this.http.get<APIResponse<Salary[]>>(this.apiUrl, { params: httpParams });
  }

  getSalariesByPeriod(year: number, month: number): Observable<APIResponse<Salary[]>> {
    const params = new HttpParams().set('year', year.toString()).set('month', month.toString());
    return this.http.get<APIResponse<Salary[]>>(`${this.apiUrl}/period`, { params });
  }

  getSalariesByEmployee(employeeId: number): Observable<APIResponse<Salary[]>> {
    return this.http.get<APIResponse<Salary[]>>(`${this.apiUrl}/employee/${employeeId}`);
  }

  getSalaryById(id: number): Observable<APIResponse<Salary>> {
    return this.http.get<APIResponse<Salary>>(`${this.apiUrl}/${id}`);
  }

  getDistinctYears(): Observable<APIResponse<number[]>> {
    return this.http.get<APIResponse<number[]>>(`${this.apiUrl}/years`);
  }

  getDistinctMonths(year: number): Observable<APIResponse<number[]>> {
    return this.http.get<APIResponse<number[]>>(`${this.apiUrl}/months/${year}`);
  }

  getSalaryStats(year: number, month: number): Observable<APIResponse<any>> {
    const params = new HttpParams().set('year', year.toString()).set('month', month.toString());
    return this.http.get<APIResponse<any>>(`${this.apiUrl}/stats`, { params });
  }

  createSalary(salary: Partial<Salary>): Observable<APIResponse<Salary>> {
    return this.http.post<APIResponse<Salary>>(this.apiUrl, salary);
  }

  updateSalary(id: number, salary: Partial<Salary>): Observable<APIResponse<Salary>> {
    return this.http.put<APIResponse<Salary>>(`${this.apiUrl}/${id}`, salary);
  }

  deleteSalary(id: number): Observable<APIResponse<void>> {
    return this.http.delete<APIResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
