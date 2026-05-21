import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { APIResponse, LoginRequest, LoginResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'ems_access_token';
  private readonly REFRESH_KEY = 'ems_refresh_token';
  private readonly USER_KEY = 'ems_user';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<LoginResponse['employee'] | null>(
    this.getStoredUser()
  );
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  private baseUrl = environment.apiUrl;

  login(credentials: LoginRequest): Observable<APIResponse<LoginResponse>> {
    return this.http.post<APIResponse<LoginResponse>>(`${this.baseUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.storeSession(response.data);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  getUserRole(): string | null {
    const user = this.getStoredUser();
    const token = this.getAccessToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const roles: string[] = payload.roles || [];
        return roles.some(r => r === 'ROLE_ADMIN') ? 'ADMIN' : 'EMPLOYEE';
      } catch {
        return null;
      }
    }
    return null;
  }

  isAuthenticated(): boolean {
    return this.hasToken() && !this.isTokenExpired();
  }

  refreshToken(): Observable<APIResponse<LoginResponse>> {
    return this.http.post<APIResponse<LoginResponse>>(`${this.baseUrl}/auth/refresh`, {
      refreshToken: this.getRefreshToken()
    }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.storeSession(response.data);
        }
      })
    );
  }

  private storeSession(data: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, data.accessToken);
    localStorage.setItem(this.REFRESH_KEY, data.refreshToken);
    if (data.employee) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(data.employee));
    }
    this.isAuthenticatedSubject.next(true);
    this.currentUserSubject.next(data.employee);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  private isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  private getStoredUser(): LoginResponse['employee'] | null {
    const stored = localStorage.getItem(this.USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }
}
