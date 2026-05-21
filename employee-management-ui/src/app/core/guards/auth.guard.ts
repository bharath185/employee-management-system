import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }

    // Try to refresh token
    const refreshToken = this.authService.getRefreshToken();
    if (refreshToken) {
      this.authService.refreshToken().subscribe({
        next: () => true,
        error: () => {
          this.authService.logout();
          this.router.navigate(['/auth/login'], {
            queryParams: { returnUrl: state.url }
          });
          return false;
        }
      });
      return true;
    }

    this.authService.logout();
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }
}
