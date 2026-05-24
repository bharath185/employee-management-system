import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentTemplate } from '../models/document-template.model';
import { APIResponse, PagedResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocumentTemplateService {
  private apiUrl = `${environment.apiUrl}/document-templates`;

  constructor(private http: HttpClient) {}

  getTemplates(params: {
    page?: number;
    size?: number;
    sort?: string;
    search?: string;
    active?: boolean;
    templateType?: string;
  } = {}): Observable<APIResponse<PagedResponse<DocumentTemplate>>> {
    let httpParams = new HttpParams()
      .set('page', (params.page ?? 0).toString())
      .set('size', (params.size ?? 10).toString())
      .set('sort', params.sort ?? 'createdAt,desc');

    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.active !== undefined) httpParams = httpParams.set('active', params.active.toString());
    if (params.templateType) httpParams = httpParams.set('templateType', params.templateType);

    return this.http.get<APIResponse<PagedResponse<DocumentTemplate>>>(this.apiUrl, {
      params: httpParams
    });
  }

  getTemplateById(id: number): Observable<APIResponse<DocumentTemplate>> {
    return this.http.get<APIResponse<DocumentTemplate>>(`${this.apiUrl}/${id}`);
  }

  createTemplate(template: DocumentTemplate): Observable<APIResponse<DocumentTemplate>> {
    return this.http.post<APIResponse<DocumentTemplate>>(this.apiUrl, template);
  }

  updateTemplate(id: number, template: Partial<DocumentTemplate>): Observable<APIResponse<DocumentTemplate>> {
    return this.http.put<APIResponse<DocumentTemplate>>(`${this.apiUrl}/${id}`, template);
  }

  deleteTemplate(id: number): Observable<APIResponse<void>> {
    return this.http.delete<APIResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getTemplateTypes(): Observable<APIResponse<{code: string; display: string}[]>> {
    return this.http.get<APIResponse<{code: string; display: string}[]>>(`${this.apiUrl}/types`);
  }

  generateDocument(templateId: number, employeeId: number, format: string = 'pdf'): Observable<Blob> {
    let params = new HttpParams()
      .set('employeeId', employeeId.toString())
      .set('format', format);
    return this.http.get(`${this.apiUrl}/${templateId}/generate/${employeeId}`, {
      params,
      responseType: 'blob'
    });
  }

  previewTemplate(templateId: number, employeeId: number): Observable<APIResponse<string>> {
    let params = new HttpParams().set('employeeId', employeeId.toString());
    return this.http.get<APIResponse<string>>(`${this.apiUrl}/preview/${templateId}`, {
      params
    });
  }
}
