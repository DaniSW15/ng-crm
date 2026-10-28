import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  const login = vi.fn();

  beforeEach(async () => {
    login.mockReset();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: AuthService, useValue: { login } }],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra la contraseña sin enviar el formulario', async () => {
    fixture.nativeElement.querySelector('.password-toggle').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#password').type).toBe('text');
    expect(login).not.toHaveBeenCalled();
    fixture.nativeElement.querySelector('.password-toggle').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#password').type).toBe('password');
  });

  it('no envía credenciales vacías', async () => {
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    expect(login).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('El correo electrónico es obligatorio');
  });

  it('distingue un fallo de conexión de credenciales inválidas', async () => {
    login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    for (const [id, value] of [
      ['email', 'equipo@acme.com'],
      ['password', 'password123'],
    ]) {
      const input = fixture.nativeElement.querySelector('#' + id) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    await fixture.whenStable();
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    expect(login).toHaveBeenCalledWith({ email: 'equipo@acme.com', password: 'password123' });
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'No pudimos conectar',
    );
    expect(fixture.nativeElement.querySelector('[type="submit"]').disabled).toBe(false);
  });
});
