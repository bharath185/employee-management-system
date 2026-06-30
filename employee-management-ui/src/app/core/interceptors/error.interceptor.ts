import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        switch (error.status) {
          case 400:
            errorMessage = error.error?.message || 'Bad request';
            break;
          case 401:
            errorMessage = 'Session expired. Please login again.';
            router.navigate(['/auth/login']);
            break;
          case 403:
            errorMessage = 'You do not have permission to perform this action.';
            break;
          case 404:
            errorMessage = 'Resource not found.';
            break;
          case 409:
            errorMessage = error.error?.message || 'Data conflict. Please refresh and try again.';
            break;
          case 413:
            errorMessage = 'File size too large. Maximum size is 2MB.';
            break;
          case 422:
            errorMessage = 'Validation failed. Please check your input.';
            break;
          case 500:
            errorMessage = error.error?.message || 'Server error. Please try again later.';
            break;
          default:
            errorMessage = error.error?.message || `Error: ${error.status}`;
        }
      }

      console.error(`HTTP Error [${error.status}]:`, errorMessage);
      // You could inject a toast/notification service here
      // toastService.error(errorMessage);

      return throwError(() => new Error(errorMessage));
    })
  );
};
