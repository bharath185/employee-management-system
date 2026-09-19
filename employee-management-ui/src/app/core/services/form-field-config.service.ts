import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { APIResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

export interface FormFieldConfig {
  id?: number;
  fieldKey: string;
  fieldLabel: string;
  tabName: string;
  fieldType: string; // 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'BOOLEAN' | 'TEXTAREA'
  masterCategory?: string;
  options?: string;
  isMandatory: boolean;
  isVisible: boolean;
  isCustom: boolean;
  sortOrder: number;
  placeholder?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FormFieldConfigService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllConfigs(): Observable<FormFieldConfig[]> {
    return this.http.get<APIResponse<FormFieldConfig[]>>(`${this.baseUrl}/form-fields`).pipe(
      map(res => res.data || [])
    );
  }

  getVisibleConfigs(): Observable<FormFieldConfig[]> {
    return this.http.get<APIResponse<FormFieldConfig[]>>(`${this.baseUrl}/form-fields/visible`).pipe(
      map(res => res.data || [])
    );
  }

  toggleMandatory(id: number): Observable<FormFieldConfig> {
    return this.http.put<APIResponse<FormFieldConfig>>(`${this.baseUrl}/form-fields/${id}/toggle-mandatory`, {}).pipe(
      map(res => res.data)
    );
  }

  toggleVisibility(id: number): Observable<FormFieldConfig> {
    return this.http.put<APIResponse<FormFieldConfig>>(`${this.baseUrl}/form-fields/${id}/toggle-visibility`, {}).pipe(
      map(res => res.data)
    );
  }

  updateBulk(configs: FormFieldConfig[]): Observable<FormFieldConfig[]> {
    return this.http.put<APIResponse<FormFieldConfig[]>>(`${this.baseUrl}/form-fields/bulk`, configs).pipe(
      map(res => res.data || [])
    );
  }

  createCustomField(config: Partial<FormFieldConfig>): Observable<FormFieldConfig> {
    return this.http.post<APIResponse<FormFieldConfig>>(`${this.baseUrl}/form-fields/custom`, config).pipe(
      map(res => res.data)
    );
  }

  deleteCustomField(id: number): Observable<void> {
    return this.http.delete<APIResponse<void>>(`${this.baseUrl}/form-fields/custom/${id}`).pipe(
      map(() => void 0)
    );
  }
}
