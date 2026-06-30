import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    if (this.authService.isAuthenticated()) {
      return of(true);
    }

    const refreshToken = this.authService.getRefreshToken();
    if (refreshToken) {
      return this.authService.refreshToken().pipe(
        map(() => true),
        catchError(() => {
          this.authService.logout();
          this.router.navigate(['/auth/login'], {
            queryParams: { returnUrl: state.url }
          });
          return of(false);
        })
      );
    }

    this.authService.logout();
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return of(false);
  }
}
