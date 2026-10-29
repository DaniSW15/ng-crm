import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import type { AuthRepository } from '@features/auth/application/auth.repository';
import type { AuthenticatedSession } from '@features/auth/domain/authenticated-session';
import type { LoginCredentials } from '@features/auth/domain/login-credentials';
import { authenticatedSessionFromApi, type AuthApiResponse } from './auth-api.mapper';

/** Habla con el backend; guardar la sesión corresponde al caso de uso. */
@Service()
export class HttpAuthRepository implements AuthRepository {
  private readonly http = inject(HttpClient);

  async login(credentials: LoginCredentials): Promise<AuthenticatedSession> {
    const response = await firstValueFrom(
      this.http.post<AuthApiResponse>(`${environment.apiUrl}/auth/login`, credentials),
    );
    return authenticatedSessionFromApi(response);
  }
}
