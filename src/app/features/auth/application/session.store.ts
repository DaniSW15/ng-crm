import type { AuthenticatedSession } from '../domain/authenticated-session';

/** Contrato de persistencia de sesión, independiente del navegador. */
export interface SessionStore {
  save(session: AuthenticatedSession): void;
}
