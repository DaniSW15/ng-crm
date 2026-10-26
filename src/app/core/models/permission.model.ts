import { UserRole } from './auth.model';

/**
 * Capacidades atómicas de negocio (Domain Permissions)
 * Alineadas con la especificación del Backend API en FastAPI.
 */
export type AppPermission =
  | 'deals:create'
  | 'deals:read'
  | 'deals:update'
  | 'deals:delete'
  | 'deals:move_stage'
  | 'pipelines:read'
  | 'tenants:manage';

/**
 * Matriz de Control de Acceso Basado en Roles (RBAC Policy Matrix)
 * Define las capacidades permitidas por rol dentro del dominio.
 *
 * Backend endpoints mapping:
 * - ADMIN:   Control total (GET, POST, PUT, DELETE)
 * - DEV:     Control total de desarrollo (GET, POST, PUT, DELETE)
 * - CLIENTE: Consulta y edición (GET, POST, PUT). Prohibido DELETE (403 Forbidden)
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly AppPermission[]> = {
  ADMIN: [
    'deals:create',
    'deals:read',
    'deals:update',
    'deals:delete',
    'deals:move_stage',
    'pipelines:read',
    'tenants:manage',
  ],
  DEV: [
    'deals:create',
    'deals:read',
    'deals:update',
    'deals:delete',
    'deals:move_stage',
    'pipelines:read',
  ],
  CLIENTE: [
    'deals:create',
    'deals:read',
    'deals:update',
    'deals:move_stage',
    'pipelines:read',
    // 'deals:delete' restringido por política de negocio
  ],
};

