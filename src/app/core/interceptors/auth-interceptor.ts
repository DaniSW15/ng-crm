import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../auth/auth-service';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Adjuntar el token si existe, es para nuestra API y no es una ruta pública de autenticación
  const isApiUrl = req.url.startsWith(environment.apiUrl);
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
