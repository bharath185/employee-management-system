import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Bill } from '../models/bill.model';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class BillService {
  private apiUrl = `${environment.apiUrl}/bills`;

  constructor(private http: HttpClient) {}

  getBills(month?: number, year?: number): Observable<ApiResponse<Bill[]>> {
    let params = new HttpParams();
    if (month !== undefined && month !== null) params = params.set('month', month);
    if (year !== undefined && year !== null) params = params.set('year', year);
    return this.http.get<ApiResponse<Bill[]>>(this.apiUrl, { params });
  }

  getBill(id: number): Observable<ApiResponse<Bill>> {
    return this.http.get<ApiResponse<Bill>>(`${this.apiUrl}/${id}`);
  }

  createBill(formData: FormData): Observable<ApiResponse<Bill>> {
    return this.http.post<ApiResponse<Bill>>(this.apiUrl, formData);
  }

  updateBill(id: number, formData: FormData): Observable<ApiResponse<Bill>> {
    return this.http.put<ApiResponse<Bill>>(`${this.apiUrl}/${id}`, formData);
  }

  toggleStatus(id: number): Observable<ApiResponse<Bill>> {
    return this.http.put<ApiResponse<Bill>>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  deleteBill(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getFileUrl(id: number): string {
    return `${this.apiUrl}/${id}/file`;
  }
}
