import type { AuthenticatedSession } from '../domain/authenticated-session';
import type { LoginCredentials } from '../domain/login-credentials';

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthenticatedSession>;
}
