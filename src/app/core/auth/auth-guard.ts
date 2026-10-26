import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth-service';

/**
 * Protege rutas privadas (CRM): si no hay sesión, envía a /auth/login
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() || !!authService.getToken()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};

/**
 * Protege rutas públicas (Login/Registro): si ya hay sesión, envía a /deals
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() || !!authService.getToken()) {
    return router.createUrlTree(['/deals']);
  }

  return true;
};

