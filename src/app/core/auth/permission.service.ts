import { computed, inject, Service, Signal } from '@angular/core';
import { AuthService } from './auth-service';
import { AppPermission, ROLE_PERMISSIONS } from '../models/permission.model';
import { UserRole } from '../models/auth.model';

@Service()
export class PermissionService {
  private readonly authService = inject(AuthService);

  /**
   * Conjunto reactivo de permisos del usuario actualmente logueado.
   */
  readonly userPermissions = computed<readonly AppPermission[]>(() => {
    const role = this.authService.currentUser()?.role;
    return role ? ROLE_PERMISSIONS[role] ?? [] : [];
  });

  /**
   * Comprueba de manera síncrona si el usuario cuenta con uno o varios permisos.
   * Si se pasa un array, verifica que cumpla con TODOS ellos (AND).
   */
  hasPermission(permission: AppPermission | AppPermission[]): boolean {
    const userPerms = this.userPermissions();
    if (Array.isArray(permission)) {
      return permission.every((p) => userPerms.includes(p));
    }
    return userPerms.includes(permission);
  }

  /**
   * Helper reactivo que retorna un Signal<boolean> listo para enlazar en templates o computed.
   */
  can(permission: AppPermission | AppPermission[]): Signal<boolean> {
    return computed(() => this.hasPermission(permission));
  }

  /**
   * Comprueba si el rol del usuario coincide con alguno de los roles permitidos.
   */
  hasRole(allowedRoles: UserRole | UserRole[]): boolean {
    const currentRole = this.authService.currentUser()?.role;
    if (!currentRole) return false;
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(currentRole);
    }
    return currentRole === allowedRoles;
  }
}

