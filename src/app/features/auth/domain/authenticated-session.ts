export interface AuthenticatedUser {
  readonly id: string;
  readonly tenantId: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: 'ADMIN' | 'DEV' | 'CLIENTE';
}

/** El resultado de autenticarse; nunca contiene la contraseña. */
export interface AuthenticatedSession {
  readonly accessToken: string;
  readonly tokenType: string;
  readonly user: AuthenticatedUser;
}
