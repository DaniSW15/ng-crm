import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { BrowserSessionStore } from '@features/auth/infrastructure/browser-session.store';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(BrowserSessionStore);
  const router = inject(Router);
  const requestedToken = session.getToken();
  const isPublicAuthRoute =
    req.url.includes('/auth/login') || req.url.includes('/auth/register-tenant');
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isPublicAuthRoute && session.getToken() === requestedToken) {
        session.clear();
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    }),
  );
};
