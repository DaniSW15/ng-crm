import type { AuthenticatedSession } from '@features/auth/domain/authenticated-session';
import type { LoginCredentials } from '@features/auth/domain/login-credentials';

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthenticatedSession>;
}
