import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '@environments/environment';
import { authInterceptor } from '@core/interceptors/auth-interceptor';
import { errorInterceptor } from '@core/interceptors/error-interceptor';
import type { AuthApiResponse } from './auth-api.mapper';
import { BrowserSessionStore } from './browser-session.store';
import { HttpAuthRepository } from './http-auth.repository';

describe('HttpAuthRepository', () => {
  let repository: HttpAuthRepository;
  let http: HttpTestingController;
  let session: BrowserSessionStore;

  const response: AuthApiResponse = {
    access_token: 'nuevo-token',
    token_type: 'bearer',
    user_id: 'user',
    tenant_id: 'tenant',
    email: 'equipo@acme.com',
    full_name: 'Equipo Acme',
    role: 'CLIENTE',
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
    repository = TestBed.inject(HttpAuthRepository);
    session = TestBed.inject(BrowserSessionStore);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('envía las credenciales y transforma la respuesta sin persistir sesión', async () => {
    const credentials = { email: 'equipo@acme.com', password: '  clave exacta  ' };
    const result = repository.login(credentials);
    const request = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(credentials);
    request.flush(response);
    await expect(result).resolves.toEqual({
      accessToken: 'nuevo-token',
      tokenType: 'bearer',
      user: {
        id: 'user',
        tenantId: 'tenant',
        email: 'equipo@acme.com',
        fullName: 'Equipo Acme',
        role: 'CLIENTE',
      },
    });
    expect(session.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('no adjunta el token anterior ni cierra su sesión cuando login devuelve 401', async () => {
    session.save({
      accessToken: 'token-anterior',
      tokenType: 'bearer',
      user: {
        id: 'previous',
        tenantId: 'tenant',
        email: 'anterior@acme.com',
        fullName: 'Anterior',
        role: 'ADMIN',
      },
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const result = repository.login({ email: 'equipo@acme.com', password: 'incorrecta' });
    const request = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush(
      { detail: 'Credenciales incorrectas' },
      { status: 401, statusText: 'Unauthorized' },
    );
    await expect(result).rejects.toMatchObject({ status: 401 });
    expect(session.getToken()).toBe('token-anterior');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('rechaza una respuesta de éxito que no contiene token', async () => {
    const result = repository.login({ email: 'equipo@acme.com', password: 'clave' });
    http.expectOne(`${environment.apiUrl}/auth/login`).flush({ ...response, access_token: '' });
    await expect(result).rejects.toThrow('no contiene un token válido');
    expect(session.getToken()).toBeNull();
  });
});
