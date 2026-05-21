import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee } from '../models/employee.model';
import { APIResponse, PagedResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/employees`;

  constructor(private http: HttpClient) {}

  getEmployees(params: {
    page?: number;
    size?: number;
    sort?: string;
    search?: string;
    employeeCode?: string;
    firstName?: string;
    surname?: string;
    gender?: string;
    employeeStatus?: string;
    designation?: string;
    religion?: string;
    socialCategory?: string;
  } = {}): Observable<APIResponse<PagedResponse<Employee>>> {
    let httpParams = new HttpParams()
      .set('page', (params.page ?? 0).toString())
      .set('size', (params.size ?? 10).toString())
      .set('sort', params.sort ?? 'createdAt,desc');

    const filterParams = [
      'search', 'employeeCode', 'firstName', 'surname',
      'gender', 'employeeStatus', 'designation', 'religion', 'socialCategory'
    ];

    filterParams.forEach(key => {
      const value = (params as any)[key];
      if (value) {
        httpParams = httpParams.set(key, value);
      }
    });

    return this.http.get<APIResponse<PagedResponse<Employee>>>(this.apiUrl, {
      params: httpParams
    });
  }

  getEmployeeById(id: number): Observable<APIResponse<Employee>> {
    return this.http.get<APIResponse<Employee>>(`${this.apiUrl}/${id}`);
  }

  createEmployee(employee: Employee, photo?: File): Observable<APIResponse<Employee>> {
    if (photo) {
      const formData = new FormData();
      formData.append('employee', new Blob([JSON.stringify(employee)], { type: 'application/json' }));
      formData.append('photo', photo);
      return this.http.post<APIResponse<Employee>>(`${this.apiUrl}/with-photo`, formData);
    }
    return this.http.post<APIResponse<Employee>>(this.apiUrl, employee);
  }

  updateEmployee(id: number, employee: Partial<Employee>, photo?: File): Observable<APIResponse<Employee>> {
    if (photo) {
      const formData = new FormData();
      formData.append('employee', new Blob([JSON.stringify(employee)], { type: 'application/json' }));
      formData.append('photo', photo);
      return this.http.put<APIResponse<Employee>>(`${this.apiUrl}/${id}/with-photo`, formData);
    }
    return this.http.put<APIResponse<Employee>>(`${this.apiUrl}/${id}`, employee);
  }

  deleteEmployee(id: number): Observable<APIResponse<void>> {
    return this.http.delete<APIResponse<void>>(`${this.apiUrl}/${id}`);
  }

  uploadPhoto(id: number, photo: File): Observable<APIResponse<{ photoPath: string }>> {
    const formData = new FormData();
    formData.append('photo', photo);
    return this.http.post<APIResponse<{ photoPath: string }>>(
      `${this.apiUrl}/${id}/photo`, formData
    );
  }

  exportToExcel(params: { employeeStatus?: string; designation?: string } = {}): Observable<Blob> {
    let httpParams = new HttpParams();
    if (params.employeeStatus) httpParams = httpParams.set('employeeStatus', params.employeeStatus);
    if (params.designation) httpParams = httpParams.set('designation', params.designation);
    return this.http.get(`${this.apiUrl}/export`, {
      params: httpParams,
      responseType: 'blob'
    });
  }

  downloadSampleExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/sample-excel`, { responseType: 'blob' });
  }

  importFromExcel(file: File): Observable<APIResponse<{ totalRows: number; successful: number; failed: number; errors: any[] }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<APIResponse<{ totalRows: number; successful: number; failed: number; errors: any[] }>>(
      `${this.apiUrl}/import`, formData
    );
  }
}
