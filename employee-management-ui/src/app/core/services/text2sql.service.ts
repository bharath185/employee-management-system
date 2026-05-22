import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APIResponse } from '../models/api-response.model';
import { Text2SqlRequest, Text2SqlResponse } from '../models/text2sql.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Text2SqlService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  query(request: Text2SqlRequest): Observable<APIResponse<Text2SqlResponse>> {
    return this.http.post<APIResponse<Text2SqlResponse>>(`${this.baseUrl}/text2sql/query`, request);
  }
}
