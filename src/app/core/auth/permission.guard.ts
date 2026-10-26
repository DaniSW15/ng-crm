import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from './permission.service';
import { AppPermission } from '../models/permission.model';

/**
 * Functional Route Guard para proteger rutas basándose en permisos atómicos de dominio.
 *
 * Ejemplo de uso en rutas:
 * ```typescript
 * {
 *   path: 'new',
 *   canActivate: [permissionGuard('deals:create')],
 *   loadComponent: () => import('./pages/deal-create/deal-create').then(m => m.DealCreate)
 * }
 * ```
 */
export const permissionGuard = (permission: AppPermission | AppPermission[]): CanActivateFn => {
  return () => {
    const permissionService = inject(PermissionService);
    const router = inject(Router);

    if (permissionService.hasPermission(permission)) {
      return true;
    }

    return router.createUrlTree(['/deals']);
  };
};

