import { computed, DestroyRef, inject, Service, signal } from '@angular/core';
import type { UserProfileResponse } from '../../../core/models/auth.model';
import type { SessionStore } from '../application/session.store';
import type { AuthenticatedSession } from '../domain/authenticated-session';

/** Única autoridad de token y perfil en el navegador. No realiza peticiones HTTP. */
@Service()
export class BrowserSessionStore implements SessionStore {
  private readonly tokenSignal = signal<string | null>(localStorage.getItem('access_token'));
  private readonly userSignal = signal<UserProfileResponse | null>(this.readProfile());

  readonly accessToken = this.tokenSignal.asReadonly();
  readonly currentUser = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  constructor() {
    const synchronize = (event: StorageEvent) => {
      if (event.storageArea && event.storageArea !== localStorage) return;
      if (event.key !== null && event.key !== 'access_token' && event.key !== 'currentUser') return;
      const token = localStorage.getItem('access_token');
      this.userSignal.set(token ? this.readProfile() : null);
      this.tokenSignal.set(token);
    };
    window.addEventListener('storage', synchronize);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('storage', synchronize));
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  save(session: AuthenticatedSession, tenant?: UserProfileResponse['tenant']): void {
    const previousTenant = this.currentUser()?.tenant;
    const profile: UserProfileResponse = {
      id: session.user.id,
      tenant_id: session.user.tenantId,
      email: session.user.email,
      full_name: session.user.fullName,
      role: session.user.role,
      is_active: true,
      tenant:
        tenant ??
        (previousTenant?.id === session.user.tenantId
          ? previousTenant
          : {
              id: session.user.tenantId,
              name: 'Mi Organización',
              slug: '',
              plan: 'PRO',
              is_active: true,
            }),
    };

    const previousToken = localStorage.getItem('access_token');
    const previousUser = localStorage.getItem('currentUser');
    try {
      localStorage.setItem('currentUser', JSON.stringify(profile));
      localStorage.setItem('access_token', session.accessToken);
    } catch (error: unknown) {
      // Un fallo de almacenamiento no debe publicar una sesión parcialmente guardada.
      try {
        this.restore('currentUser', previousUser);
        this.restore('access_token', previousToken);
      } catch {
        // Conserva el error original si el navegador también rechaza la restauración.
      }
      throw error;
    }
    this.userSignal.set(profile);
    this.tokenSignal.set(session.accessToken);
  }

  updateProfile(profile: UserProfileResponse): void {
    localStorage.setItem('currentUser', JSON.stringify(profile));
    this.userSignal.set(profile);
  }

  clear(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('currentUser');
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }

  private readProfile(): UserProfileResponse | null {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private restore(key: string, value: string | null): void {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  }
}
