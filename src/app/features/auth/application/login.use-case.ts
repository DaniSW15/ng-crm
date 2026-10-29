import type { AuthenticatedSession } from '@features/auth/domain/authenticated-session';
import { createLoginCredentials, type LoginCredentials } from '@features/auth/domain/login-credentials';
import type { AuthRepository } from './auth.repository';
import type { SessionStore } from './session.store';

/** Autentica primero y guarda la sesión solo después de un resultado exitoso. */
export class LoginUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly sessionStore: SessionStore,
  ) {}

  async execute(input: LoginCredentials): Promise<AuthenticatedSession> {
    const credentials = createLoginCredentials(input);
    const session = await this.authRepository.login(credentials);
    this.sessionStore.save(session);
    return session;
  }
}
