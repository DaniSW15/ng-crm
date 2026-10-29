import type { AuthenticatedSession } from '@features/auth/domain/authenticated-session';

/** Contrato de persistencia de sesión, independiente del navegador. */
export interface SessionStore {
  save(session: AuthenticatedSession): void;
}
