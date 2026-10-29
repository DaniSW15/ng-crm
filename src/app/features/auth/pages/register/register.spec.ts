import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Register } from './register';
import { provideRouter } from '@angular/router';
import { AuthService } from '@core/auth/auth-service';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([]), { provide: AuthService, useValue: { register: vi.fn() } }],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  async function fill(id: string, value: string): Promise<void> {
    const input = fixture.nativeElement.querySelector('#' + id) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
  }

  it('actualiza el identificador al escribir y conserva las letras acentuadas', async () => {
    await fill('company_name', 'Café');
    expect(fixture.nativeElement.querySelector('#slug').value).toBe('cafe');
    await fill('company_name', 'Café México');
    expect(fixture.nativeElement.querySelector('#slug').value).toBe('cafe-mexico');
  });

  it('conserva un identificador personalizado al cambiar el nombre de empresa', async () => {
    await fill('company_name', 'Acme');
    await fill('slug', 'mi-equipo');
    await fill('company_name', 'Acme México');
    expect(fixture.nativeElement.querySelector('#slug').value).toBe('mi-equipo');
  });
});
