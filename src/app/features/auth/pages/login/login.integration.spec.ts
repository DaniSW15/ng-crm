import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@environments/environment';
import { authInterceptor } from '@core/interceptors/auth-interceptor';
import { errorInterceptor } from '@core/interceptors/error-interceptor';
import { BrowserSessionStore } from '@features/auth/infrastructure/browser-session.store';
import { Login } from './login';

describe('Login: formulario, caso de uso, HTTP y sesión', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  async function submit() {
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    for (const [id, value] of [
      ['email', 'equipo@acme.com'],
      ['password', '  clave exacta  '],
    ]) {
      const input = fixture.nativeElement.querySelector('#' + id) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    await fixture.whenStable();
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { cancelable: true }));
    return fixture;
  }

  it('guarda token y rol antes de navegar a oportunidades', async () => {
    const session = TestBed.inject(BrowserSessionStore);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(async () => {
      expect(session.getToken()).toBe('token-confirmado');
      expect(session.currentUser()?.role).toBe('ADMIN');
      return true;
    });
    const fixture = await submit();
    const request = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(request.request.body).toEqual({
      email: 'equipo@acme.com',
      password: '  clave exacta  ',
    });
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({
      access_token: 'token-confirmado',
      token_type: 'bearer',
      user_id: 'user',
      tenant_id: 'tenant',
      email: 'equipo@acme.com',
      full_name: 'Equipo Acme',
      role: 'ADMIN',
    });
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/deals']);
    expect(localStorage.getItem('currentUser')).not.toContain('clave exacta');
  });

  it('presenta credenciales rechazadas sin guardar sesión ni navegar', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = await submit();
    http
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush(
        { detail: 'Correo o contraseña incorrectos' },
        { status: 401, statusText: 'Unauthorized' },
      );
    await fixture.whenStable();
    expect(TestBed.inject(BrowserSessionStore).isAuthenticated()).toBe(false);
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Correo o contraseña incorrectos',
    );
    expect(fixture.nativeElement.querySelector('[type="submit"]').disabled).toBe(false);
  });
});
