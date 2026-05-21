import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRoles = route.data['roles'] as string[];
    const userRole = this.authService.getUserRole();

    if (!userRole || !requiredRoles) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    if (requiredRoles.includes(userRole)) {
      return true;
    }

    // Redirect based on actual role
    if (userRole === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    } else if (userRole === 'EMPLOYEE') {
      this.router.navigate(['/employee/profile']);
    } else {
      this.router.navigate(['/auth/login']);
    }

    return false;
  }
}
