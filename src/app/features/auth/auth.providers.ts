import { inject, InjectionToken } from '@angular/core';
import { LoginUseCase } from '@features/auth/application/login.use-case';
import { BrowserSessionStore } from '@features/auth/infrastructure/browser-session.store';
import { HttpAuthRepository } from '@features/auth/infrastructure/http-auth.repository';

/** Angular conecta dos implementaciones con un caso de uso que solo conoce sus contratos. */
export const LOGIN_USE_CASE = new InjectionToken<LoginUseCase>('LoginUseCase', {
  providedIn: 'root',
  factory: () => new LoginUseCase(inject(HttpAuthRepository), inject(BrowserSessionStore)),
});
