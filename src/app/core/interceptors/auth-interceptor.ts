import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BrowserSessionStore } from '../../features/auth/infrastructure/browser-session.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(BrowserSessionStore).getToken();

  // Adjuntar el token si es para nuestra API y no es una ruta pública de autenticación
  const isApiUrl = req.url.startsWith(environment.apiUrl) || req.url.includes('/api/v1');
  const isAuthRoute = req.url.includes('/auth/login') || req.url.includes('/auth/register-tenant');

  if (token && isApiUrl && !isAuthRoute) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(authReq);
  }
  return next(req);
};
