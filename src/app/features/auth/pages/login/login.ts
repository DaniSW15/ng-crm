import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';
import { apiErrorMessage } from '@core/utils/api-error-message';
import { AuthShell } from '@features/auth/components/auth-shell/auth-shell';
import { LOGIN_USE_CASE } from '@features/auth/auth.providers';
import { InvalidLoginCredentialsError } from '@features/auth/domain/login-credentials';

@Component({
  imports: [FormRoot, FormField, RouterLink, AuthShell],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private readonly loginUseCase = inject(LOGIN_USE_CASE);
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
            await this.loginUseCase.execute(credentials);
            await this.router.navigate(['/deals']);
          } catch (error: unknown) {
            this.loginError.set(
              error instanceof InvalidLoginCredentialsError
                ? error.message
                : apiErrorMessage(
                    error,
                    'No pudimos iniciar sesión. Verifica tu correo y contraseña.',
                  ),
            );
          } finally {
            this.isSubmitting.set(false);
          }
        },
      },
    },
  );
}
