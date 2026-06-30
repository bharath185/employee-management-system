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
  ) {
    window.addEventListener('storage', (event) => {
      if (event.key === this.TOKEN_KEY && !event.newValue) {
        this.isAuthenticatedSubject.next(false);
        this.currentUserSubject.next(null);
        this.router.navigate(['/auth/login']);
      }
    });
  }

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
    const token = this.getAccessToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const roles: string[] = payload.roles || [];
        if (roles.includes('ROLE_ADMIN')) return 'ADMIN';
        if (roles.includes('ROLE_HR')) return 'HR';
        return 'EMPLOYEE';
      } catch {
        return null;
      }
    }
    return null;
  }

  isAdmin(): boolean { return this.getUserRole() === 'ADMIN'; }
  isHr(): boolean { return this.getUserRole() === 'HR'; }
  isEmployee(): boolean { return this.getUserRole() === 'EMPLOYEE'; }
  canManageStaff(): boolean { const r = this.getUserRole(); return r === 'ADMIN' || r === 'HR'; }
  canDeleteStaff(): boolean { return this.getUserRole() === 'ADMIN'; }
  canManageSalary(): boolean { const r = this.getUserRole(); return r === 'ADMIN' || r === 'HR'; }
  canDeleteSalary(): boolean { return this.getUserRole() === 'ADMIN'; }
  canAccessReports(): boolean { const r = this.getUserRole(); return r === 'ADMIN' || r === 'HR'; }
  canManageSettings(): boolean { return this.getUserRole() === 'ADMIN'; }

  can(resource: string, action: 'canView' | 'canAdd' | 'canEdit' | 'canDelete'): boolean {
    const role = this.getUserRole();
    if (!role) return false;
    if (role === 'ADMIN') return true;
    return this.fallbackCheck(resource, action);
  }

  private fallbackCheck(resource: string, action: string): boolean {
    const role = this.getUserRole();
    if (role === 'ADMIN') return true;
    if (role === 'HR') {
      if (resource === 'company' || resource === 'masters' || resource === 'doc_templates') return false;
      if (action === 'canDelete' && (resource === 'staff_master' || resource === 'payroll')) return false;
      if (resource === 'reports' && action !== 'canView') return false;
      return true;
    }
    if (resource === 'reports' || resource === 'company' || resource === 'masters' || resource === 'doc_templates' || resource === 'registrations' || resource === 'payroll') return false;
    if (resource === 'leave') return action === 'canView' || action === 'canAdd';
    if (resource === 'staff_master') return action === 'canView';
    return false;
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

  getCurrentUser(): LoginResponse['employee'] | null {
    return this.currentUserSubject.getValue();
  }

  private getStoredUser(): LoginResponse['employee'] | null {
    const stored = localStorage.getItem(this.USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }
}
