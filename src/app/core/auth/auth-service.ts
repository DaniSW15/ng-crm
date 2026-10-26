import { AuthResponse, RegisterRequest, UserProfileResponse } from '../models/auth.model';
import { computed, inject, Service, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Service()
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  private http = inject(HttpClient);
  private router = inject(Router);

  // Estado reactivo con Signals
  private readonly tokenSignal = signal<string | null>(this.getStoredToken());
  private readonly currentUserSignal = signal<UserProfileResponse | null>(this.getSavedUser());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  constructor() {
    // Sincronizar el perfil en segundo plano sin interrumpir la sesión existente
    if (this.getToken()) {
      this.loadUserProfile().subscribe({
        error: (err) => {
          console.warn('No se pudo refrescar el perfil en segundo plano:', err);
        },
      });
    }
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getSavedUser(): UserProfileResponse | null {
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return this.tokenSignal() ?? this.getStoredToken();
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap((response) => {
        localStorage.setItem('access_token', response.access_token);
        this.tokenSignal.set(response.access_token);

        // Guardar de inmediato los datos del usuario que ya vienen en el response de login
        const user: UserProfileResponse = {
          id: response.user_id,
          tenant_id: response.tenant_id,
          email: response.email,
          full_name: response.full_name,
          role: response.role,
          is_active: true,
          tenant: {
            id: response.tenant_id,
            name: 'Mi Organización',
            slug: '',
            plan: 'PRO',
            is_active: true,
          },
        };
        this.currentUserSignal.set(user);
        localStorage.setItem('currentUser', JSON.stringify(user));

        // Enriquecer en segundo plano con /me
        this.loadUserProfile().subscribe({
          error: (err) => console.warn('Could not load full profile from /me:', err),
        });
      })
    );
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register-tenant`, payload).pipe(
      tap((response) => {
        if (response.access_token) {
          localStorage.setItem('access_token', response.access_token);
          this.tokenSignal.set(response.access_token);

          const user: UserProfileResponse = {
            id: response.user_id,
            tenant_id: response.tenant_id,
            email: response.email,
            full_name: response.full_name,
            role: response.role,
            is_active: true,
            tenant: {
              id: response.tenant_id,
              name: payload.company_name,
              slug: payload.slug,
              plan: 'PRO',
              is_active: true,
            },
          };
          this.currentUserSignal.set(user);
          localStorage.setItem('currentUser', JSON.stringify(user));

          this.loadUserProfile().subscribe({
            error: (err) => console.warn('Could not load full profile from /me:', err),
          });
        }
      })
    );
  }

  loadUserProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.baseUrl}/me`).pipe(
      tap((user) => {
        this.currentUserSignal.set(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('currentUser');
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }
}
