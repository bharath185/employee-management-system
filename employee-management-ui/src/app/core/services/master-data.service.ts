import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, shareReplay, catchError } from 'rxjs/operators';
import { APIResponse, MasterDataItem } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MasterDataService {
  private cache = new Map<string, MasterDataItem[]>();
  private loadingCategories = new Set<string>();
  private categorySubjects = new Map<string, BehaviorSubject<MasterDataItem[]>>();

  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getByCategory(category: string): Observable<MasterDataItem[]> {
    const normalizedCategory = category.toUpperCase();

    if (this.cache.has(normalizedCategory)) {
      return of(this.cache.get(normalizedCategory)!);
    }

    if (this.loadingCategories.has(normalizedCategory)) {
      const subject = this.categorySubjects.get(normalizedCategory);
      if (subject) {
        return subject.asObservable();
      }
    }

    const subject = new BehaviorSubject<MasterDataItem[]>([]);
    this.categorySubjects.set(normalizedCategory, subject);
    this.loadingCategories.add(normalizedCategory);

    this.http.get<APIResponse<MasterDataItem[]>>(`${this.baseUrl}/masters/${normalizedCategory}`)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.cache.set(normalizedCategory, response.data);
            subject.next(response.data);
          }
          this.loadingCategories.delete(normalizedCategory);
        }),
        catchError(error => {
          this.loadingCategories.delete(normalizedCategory);
          subject.error(error);
          return of([]);
        }),
        shareReplay(1)
      )
      .subscribe();

    return subject.asObservable();
  }

  refreshCategory(category: string): void {
    const normalizedCategory = category.toUpperCase();
    this.cache.delete(normalizedCategory);
    this.categorySubjects.delete(normalizedCategory);
  }

  clearCache(): void {
    this.cache.clear();
    this.categorySubjects.clear();
    this.loadingCategories.clear();
  }

  preloadCommonCategories(): void {
    const categories = [
      'GENDER', 'PREFIX', 'MARITAL_STATUS', 'BLOOD_GROUP',
      'EMPLOYEE_STATUS', 'RELIGION', 'SOCIAL_CATEGORY',
      'SOCIAL_SUBCATEGORY', 'DESIGNATION', 'YES_NO',
      'F_M_H', 'OCCUPATION_KIN', 'EXIT_TYPE', 'AGE_BRACKET'
    ];
    categories.forEach(cat => this.getByCategory(cat).subscribe());
  }
}
