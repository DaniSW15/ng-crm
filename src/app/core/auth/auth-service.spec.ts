import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { authInterceptor } from '../interceptors/auth-interceptor';
import { errorInterceptor } from '../interceptors/error-interceptor';
import { BrowserSessionStore } from '../../features/auth/infrastructure/browser-session.store';
import type { AuthenticatedSession } from '../../features/auth/domain/authenticated-session';
import type { UserProfileResponse } from '../models/auth.model';
import { AuthService } from './auth-service';
import { PermissionService } from './permission.service';

describe('AuthService: compatibilidad de sesión y perfil', () => {
  let http: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/auth`;
  const session: AuthenticatedSession = {
    accessToken: 'token',
    tokenType: 'bearer',
    user: {
      id: 'user',
      tenantId: 'tenant',
      email: 'equipo@acme.com',
      fullName: 'Equipo Acme',
      role: 'ADMIN',
    },
  };
  const profile: UserProfileResponse = {
    id: 'user',
    tenant_id: 'tenant',
    email: 'equipo@acme.com',
    full_name: 'Equipo Acme',
    role: 'ADMIN',
    is_active: true,
    tenant: {
      id: 'tenant',
      name: 'Empresa Acme',
      slug: 'acme',
      plan: 'ENTERPRISE',
      is_active: true,
    },
  };
  const response = {
    access_token: 'token',
    token_type: 'bearer',
    user_id: 'user',
    tenant_id: 'tenant',
    email: 'equipo@acme.com',
    full_name: 'Equipo Acme',
    role: 'ADMIN',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    http.verify({ ignoreCancelled: true });
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('sin sesión no inicia peticiones de perfil', () => {
    const service = TestBed.inject(AuthService);
    TestBed.tick();
    expect(service.isAuthenticated()).toBe(false);
    http.expectNone(`${baseUrl}/me`);
  });

  it('restaura el token y carga /me sin dependencias circulares', () => {
    localStorage.setItem('access_token', 'guardado');
    const service = TestBed.inject(AuthService);
    TestBed.tick();
    const request = http.expectOne(`${baseUrl}/me`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer guardado');
    request.flush(profile);
    expect(service.currentUser()).toEqual(profile);
    expect(TestBed.inject(PermissionService).hasPermission('deals:delete')).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('mantiene login Observable compatible y refresca el perfil una sola vez', async () => {
    const service = TestBed.inject(AuthService);
    const login = service.login({ email: 'equipo@acme.com', password: 'clave' });
    http.expectNone(`${baseUrl}/login`);
    const result = firstValueFrom(login);
    http.expectOne(`${baseUrl}/login`).flush(response);
    await expect(result).resolves.toEqual(response);
    expect(service.currentUser()?.role).toBe('ADMIN');
    TestBed.tick();
    http.expectOne(`${baseUrl}/me`).flush(profile);
    expect(service.currentUser()?.tenant.name).toBe('Empresa Acme');
  });

  it('mantiene la empresa del registro e inicia su sesión', async () => {
    const service = TestBed.inject(AuthService);
    const payload = {
      company_name: 'Nueva Empresa',
      slug: 'nueva',
      admin_full_name: 'Equipo Acme',
      admin_email: 'equipo@acme.com',
      admin_password: 'password123',
    };
    const result = firstValueFrom(service.register(payload));
    const request = http.expectOne(`${baseUrl}/register-tenant`);
    expect(request.request.body).toEqual(payload);
    request.flush(response);
    await result;
    expect(service.currentUser()?.tenant).toMatchObject({ name: 'Nueva Empresa', slug: 'nueva' });
    expect(service.getToken()).toBe('token');
    TestBed.tick();
    http.expectOne(`${baseUrl}/me`).flush(profile);
  });

  it('una sesión vencida en /me borra token, perfil y vuelve a login', () => {
    localStorage.setItem('access_token', 'vencido');
    const service = TestBed.inject(AuthService);
    TestBed.tick();
    http
      .expectOne(`${baseUrl}/me`)
      .flush({ detail: 'Token vencido' }, { status: 401, statusText: 'Unauthorized' });
    expect(service.getToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('un fallo temporal de /me conserva la sesión y el perfil guardado', () => {
    localStorage.setItem('access_token', 'token');
    localStorage.setItem('currentUser', JSON.stringify(profile));
    const service = TestBed.inject(AuthService);
    TestBed.tick();
    http.expectOne(`${baseUrl}/me`).flush({}, { status: 503, statusText: 'Unavailable' });
    expect(service.getToken()).toBe('token');
    expect(service.currentUser()).toEqual(profile);
    expect(TestBed.inject(Router).navigate).not.toHaveBeenCalled();
  });

  it('cancela el refresco en curso al cerrar sesión', () => {
    localStorage.setItem('access_token', 'token');
    const service = TestBed.inject(AuthService);
    TestBed.tick();
    const request = http.expectOne(`${baseUrl}/me`);
    service.logout();
    TestBed.tick();
    expect(request.cancelled).toBe(true);
    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('ignora una respuesta manual de perfil que llega después de logout', () => {
    const store = TestBed.inject(BrowserSessionStore);
    store.save(session);
    const service = TestBed.inject(AuthService);
    TestBed.tick();
    http.expectOne(`${baseUrl}/me`).flush(profile);
    service.loadUserProfile().subscribe();
    const late = http.expectOne(`${baseUrl}/me`);
    service.logout();
    late.flush(profile);
    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
  });

  it('al cambiar sesión cancela el perfil anterior y usa el token nuevo', () => {
    const store = TestBed.inject(BrowserSessionStore);
    store.save(session);
    const service = TestBed.inject(AuthService);
    TestBed.tick();
    const previous = http.expectOne(`${baseUrl}/me`);
    store.save({
      ...session,
      accessToken: 'nuevo',
      user: { ...session.user, id: 'other', role: 'CLIENTE' },
    });
    TestBed.tick();
    expect(previous.cancelled).toBe(true);
    const current = http.expectOne(`${baseUrl}/me`);
    expect(current.request.headers.get('Authorization')).toBe('Bearer nuevo');
    current.flush({ ...profile, id: 'other', role: 'CLIENTE' });
    expect(service.currentUser()?.id).toBe('other');
    expect(TestBed.inject(PermissionService).hasPermission('deals:delete')).toBe(false);
  });

  it('un 401 de una petición antigua no cierra la sesión nueva', () => {
    const store = TestBed.inject(BrowserSessionStore);
    store.save(session);
    TestBed.inject(HttpClient)
      .get(`${environment.apiUrl}/deals`)
      .subscribe({ error: () => {} });
    const oldRequest = http.expectOne(`${environment.apiUrl}/deals`);
    store.save({ ...session, accessToken: 'nuevo' });
    oldRequest.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(store.getToken()).toBe('nuevo');
    expect(TestBed.inject(Router).navigate).not.toHaveBeenCalled();
  });

  it('el logout en otra pestaña cancela /me y elimina el token de las peticiones nuevas', () => {
    TestBed.inject(BrowserSessionStore).save(session);
    const service = TestBed.inject(AuthService);
    TestBed.tick();
    const request = http.expectOne(`${baseUrl}/me`);
    localStorage.removeItem('access_token');
    localStorage.removeItem('currentUser');
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'access_token', storageArea: localStorage }),
    );
    TestBed.tick();
    expect(request.cancelled).toBe(true);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();

    TestBed.inject(HttpClient).get(`${environment.apiUrl}/deals`).subscribe();
    const nextRequest = http.expectOne(`${environment.apiUrl}/deals`);
    expect(nextRequest.request.headers.has('Authorization')).toBe(false);
    nextRequest.flush([]);
  });
});
