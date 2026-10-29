import { effect, inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { defer, map, Observable, tap } from 'rxjs';
import { AuthResponse, RegisterRequest, UserProfileResponse } from '../models/auth.model';
import { environment } from '../../../environments/environment';
import { LOGIN_USE_CASE } from '../../features/auth/auth.providers';
import {
  authenticatedSessionFromApi,
  authSessionToApi,
} from '../../features/auth/infrastructure/auth-api.mapper';
import { BrowserSessionStore } from '../../features/auth/infrastructure/browser-session.store';

/** Fachada compatible para guards, permisos, registro y perfil durante la migración. */
@Service()
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly session = inject(BrowserSessionStore);
  private readonly loginUseCase = inject(LOGIN_USE_CASE);

  readonly currentUser = this.session.currentUser;
  readonly isAuthenticated = this.session.isAuthenticated;

  constructor() {
    // Cada cambio de token refresca el perfil; logout o una nueva sesión cancelan el anterior.
    effect((onCleanup) => {
      if (!this.session.accessToken()) return;
      const request = this.loadUserProfile().subscribe({
        error: () => console.warn('No se pudo actualizar el perfil de la sesión.'),
      });
      onCleanup(() => request.unsubscribe());
    });
  }

  getToken(): string | null {
    return this.session.getToken();
  }

  /** Conserva la API anterior; el formulario nuevo utiliza directamente LOGIN_USE_CASE. */
  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return defer(() => this.loginUseCase.execute(credentials)).pipe(map(authSessionToApi));
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register-tenant`, payload).pipe(
      tap((response) => {
        if (!response.access_token) return;
        this.session.save(authenticatedSessionFromApi(response), {
          id: response.tenant_id,
          name: payload.company_name,
          slug: payload.slug,
          plan: 'PRO',
          is_active: true,
        });
      }),
    );
  }

  loadUserProfile(): Observable<UserProfileResponse> {
    return defer(() => {
      const requestedToken = this.session.getToken();
      return this.http.get<UserProfileResponse>(`${this.baseUrl}/me`).pipe(
        tap((profile) => {
          // Una respuesta de una sesión anterior no puede restaurar un usuario después de logout.
          if (requestedToken && this.session.getToken() === requestedToken) {
            this.session.updateProfile(profile);
          }
        }),
      );
    });
  }

  logout(): void {
    this.session.clear();
    this.router.navigate(['/auth/login']);
  }
}
