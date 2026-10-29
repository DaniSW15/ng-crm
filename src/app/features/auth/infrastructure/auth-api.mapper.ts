import type { AuthenticatedSession } from '../domain/authenticated-session';

/** Respuesta documentada de /auth/login y /auth/register-tenant. */
export interface AuthApiResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'DEV' | 'CLIENTE';
}

export function authenticatedSessionFromApi(response: AuthApiResponse): AuthenticatedSession {
  if (!response.access_token?.trim()) {
    throw new Error('La respuesta de autenticación no contiene un token válido');
  }
  return {
    accessToken: response.access_token,
    tokenType: response.token_type,
    user: {
      id: response.user_id,
      tenantId: response.tenant_id,
      email: response.email,
      fullName: response.full_name,
      role: response.role,
    },
  };
}

/** Adaptación temporal para consumidores existentes de AuthService.login. */
export function authSessionToApi(session: AuthenticatedSession): AuthApiResponse {
  return {
    access_token: session.accessToken,
    token_type: session.tokenType,
    user_id: session.user.id,
    tenant_id: session.user.tenantId,
    email: session.user.email,
    full_name: session.user.fullName,
    role: session.user.role,
  };
}
