import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EmployeeDocument } from '../models/employee-document.model';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeDocumentService {
  private apiUrl = `${environment.apiUrl}/documents`;

  constructor(private http: HttpClient) {}

  getDocuments(params?: {
    employeeId?: number;
    employeeIds?: number[];
    documentType?: string;
    documentTypes?: string[];
    process?: string;
    department?: string;
    search?: string;
  }): Observable<ApiResponse<EmployeeDocument[]>> {
    let httpParams = new HttpParams();
    if (params?.employeeId) {
      httpParams = httpParams.set('employeeId', params.employeeId.toString());
    }
    if (params?.employeeIds && params.employeeIds.length > 0) {
      httpParams = httpParams.set('employeeIds', params.employeeIds.join(','));
    }
    if (params?.documentTypes && params.documentTypes.length > 0 && !params.documentTypes.includes('ALL')) {
      httpParams = httpParams.set('documentTypes', params.documentTypes.join(','));
    } else if (params?.documentType && params.documentType !== 'ALL') {
      httpParams = httpParams.set('documentType', params.documentType);
    }
    if (params?.process && params.process !== 'ALL') {
      httpParams = httpParams.set('process', params.process);
    }
    if (params?.department && params.department !== 'ALL') {
      httpParams = httpParams.set('department', params.department);
    }
    if (params?.search && params.search.trim()) {
      httpParams = httpParams.set('search', params.search.trim());
    }
    return this.http.get<ApiResponse<EmployeeDocument[]>>(this.apiUrl, { params: httpParams });
  }

  downloadSelectedAsZip(documentIds: number[]): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/download-zip`, documentIds, { responseType: 'blob' });
  }

  splitPdf(file: File): Observable<ApiResponse<{ pageNumber: number; totalPages: number; fileName: string; fileSize: number; base64Data: string }[]>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<{ pageNumber: number; totalPages: number; fileName: string; fileSize: number; base64Data: string }[]>>(`${this.apiUrl}/split-pdf`, formData);
  }

  getDocumentsByEmployee(employeeId: number): Observable<ApiResponse<EmployeeDocument[]>> {
    return this.http.get<ApiResponse<EmployeeDocument[]>>(`${this.apiUrl}/employee/${employeeId}`);
  }

  uploadDocument(
    employeeId: number,
    file: File,
    documentType: string,
    documentTitle?: string,
    pageNumber?: number,
    notes?: string
  ): Observable<ApiResponse<EmployeeDocument>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (documentTitle) formData.append('documentTitle', documentTitle);
    if (pageNumber !== undefined && pageNumber !== null) formData.append('pageNumber', pageNumber.toString());
    if (notes) formData.append('notes', notes);

    return this.http.post<ApiResponse<EmployeeDocument>>(`${this.apiUrl}/upload/${employeeId}`, formData);
  }

  uploadBatch(employeeId: number, items: { file: File; documentType: string; documentTitle: string; pageNumber: number; notes?: string }[]): Observable<ApiResponse<EmployeeDocument[]>> {
    const formData = new FormData();
    items.forEach((item) => {
      formData.append('files', item.file);
      formData.append('documentTypes', item.documentType);
      formData.append('documentTitles', item.documentTitle || item.file.name);
      formData.append('pageNumbers', (item.pageNumber || 1).toString());
      formData.append('notesList', item.notes || '');
    });

    return this.http.post<ApiResponse<EmployeeDocument[]>>(`${this.apiUrl}/upload-batch/${employeeId}`, formData);
  }

  uploadDocumentBatch(employeeId: number, items: { file: File; documentType: string; documentTitle: string; pageNumber: number; notes?: string }[]): Observable<ApiResponse<EmployeeDocument[]>> {
    return this.uploadBatch(employeeId, items);
  }

  updateDocument(
    documentId: number,
    data: { documentType?: string; documentTitle?: string; pageNumber?: number; notes?: string }
  ): Observable<ApiResponse<EmployeeDocument>> {
    let params = new HttpParams();
    if (data.documentType) params = params.set('documentType', data.documentType);
    if (data.documentTitle) params = params.set('documentTitle', data.documentTitle);
    if (data.pageNumber !== undefined && data.pageNumber !== null) params = params.set('pageNumber', data.pageNumber.toString());
    if (data.notes !== undefined && data.notes !== null) params = params.set('notes', data.notes);

    return this.http.put<ApiResponse<EmployeeDocument>>(`${this.apiUrl}/${documentId}`, null, { params });
  }

  updateDocumentMetadata(
    documentId: number,
    data: { documentType?: string; documentTitle?: string; pageNumber?: number; notes?: string }
  ): Observable<ApiResponse<EmployeeDocument>> {
    return this.updateDocument(documentId, data);
  }

  downloadDocument(documentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${documentId}`, { responseType: 'blob' });
  }

  downloadAllAsZip(employeeId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download-all/${employeeId}`, { responseType: 'blob' });
  }

  getPreviewUrl(documentId: number): string {
    return `${this.apiUrl}/preview/${documentId}`;
  }

  getPreviewStreamUrl(documentId: number): string {
    return this.getPreviewUrl(documentId);
  }

  deleteDocument(documentId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${documentId}`);
  }
}
