import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  const userRole = authService.getUserRole();

  // Support both singular 'role' and plural 'roles' (array)
  const requiredRole = route.data['role'] as string;
  const requiredRoles = route.data['roles'] as string[];

  if (requiredRoles) {
    if (!requiredRoles.includes(userRole || '')) {
      if (userRole === 'ADMIN' || userRole === 'HR') {
        router.navigate(['/admin/dashboard']);
      } else {
        router.navigate(['/employee/profile']);
      }
      return false;
    }
    return true;
  }

  if (requiredRole) {
    if (requiredRole === 'ADMIN' && userRole !== 'ADMIN') {
      if (userRole === 'HR') {
        router.navigate(['/admin/dashboard']);
      } else {
        router.navigate(['/employee/profile']);
      }
      return false;
    }
    if (requiredRole === 'HR' && !['ADMIN', 'HR'].includes(userRole || '')) {
      router.navigate(['/employee/profile']);
      return false;
    }
    return true;
  }

  return true;
};
