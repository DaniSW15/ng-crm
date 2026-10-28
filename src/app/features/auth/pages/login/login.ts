import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { apiErrorMessage } from '../../../../core/utils/api-error-message';
import { AuthShell } from '../../components/auth-shell/auth-shell';

@Component({
  imports: [FormRoot, FormField, RouterLink, AuthShell],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loginError = signal<string | null>(null);
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly showPassword = signal(false);
  protected readonly model = signal({ email: '', password: '' });

  protected readonly form = form(
    this.model,
    (s) => {
      required(s.email, { message: 'El correo electrónico es obligatorio' });
      email(s.email, { message: 'El formato del correo electrónico no es válido' });
      required(s.password, { message: 'La contraseña es obligatoria' });
    },
    {
      submission: {
        action: async () => {
          this.loginError.set(null);
          this.isSubmitting.set(true);

          try {
            const credentials = this.model();
            await firstValueFrom(this.authService.login(credentials));
            await this.router.navigate(['/deals']);
          } catch (error: unknown) {
            this.loginError.set(
              apiErrorMessage(error, 'No pudimos iniciar sesión. Verifica tu correo y contraseña.'),
            );
          } finally {
            this.isSubmitting.set(false);
          }
        },
      },
    },
  );
}
