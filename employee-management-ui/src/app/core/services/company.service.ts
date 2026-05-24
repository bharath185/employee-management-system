import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Company, CompanyDocument } from '../models/company.model';
import { APIResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private apiUrl = `${environment.apiUrl}/company`;

  constructor(private http: HttpClient) {}

  getCompany(): Observable<APIResponse<Company>> {
    return this.http.get<APIResponse<Company>>(this.apiUrl);
  }

  updateCompany(company: Company, logo?: File): Observable<APIResponse<Company>> {
    if (logo) {
      const formData = new FormData();
      formData.append('company', new Blob([JSON.stringify(company)], { type: 'application/json' }));
      formData.append('logo', logo);
      return this.http.put<APIResponse<Company>>(this.apiUrl, formData);
    }
    return this.http.put<APIResponse<Company>>(this.apiUrl, company);
  }

  uploadLogo(logo: File): Observable<APIResponse<{ logoPath: string }>> {
    const formData = new FormData();
    formData.append('logo', logo);
    return this.http.post<APIResponse<{ logoPath: string }>>(`${this.apiUrl}/logo`, formData);
  }

  getLogo(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/logo`, { responseType: 'blob' });
  }

  getDocuments(): Observable<APIResponse<CompanyDocument[]>> {
    return this.http.get<APIResponse<CompanyDocument[]>>(`${this.apiUrl}/documents`);
  }

  uploadDocument(file: File, documentType: string): Observable<APIResponse<CompanyDocument>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    return this.http.post<APIResponse<CompanyDocument>>(`${this.apiUrl}/documents`, formData);
  }

  deleteDocument(id: number): Observable<APIResponse<void>> {
    return this.http.delete<APIResponse<void>>(`${this.apiUrl}/documents/${id}`);
  }
}
