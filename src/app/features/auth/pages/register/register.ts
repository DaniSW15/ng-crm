import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { email, form, FormField, FormRoot, minLength, pattern, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { RegisterRequest } from '../../../../core/models/auth.model';

@Component({
  imports: [FormRoot, FormField, RouterLink],
  selector: 'app-register',
  styleUrl: './register.scss',
  templateUrl: './register.html',
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly registerError = signal<string | null>(null);
  protected readonly isSubmitting = signal<boolean>(false);

  protected readonly model = signal<RegisterRequest>({
    company_name: '',
    slug: '',
    admin_full_name: '',
    admin_email: '',
    admin_password: '',
  });

  protected readonly form = form(
    this.model,
    (s) => {
      required(s.company_name, { message: 'El nombre de la empresa es obligatorio' });

      required(s.slug, { message: 'El identificador o slug es obligatorio' });
      pattern(s.slug, /^[a-z0-9-]+$/, {
        message: 'El slug solo debe contener letras minúsculas, números y guiones (ej. acme-corp)',
      });

      required(s.admin_full_name, { message: 'El nombre completo del administrador es obligatorio' });

      required(s.admin_email, { message: 'El correo electrónico es obligatorio' });
      email(s.admin_email, { message: 'El formato del correo electrónico no es válido' });

      required(s.admin_password, { message: 'La contraseña es obligatoria' });
      minLength(s.admin_password, 8, { message: 'La contraseña debe tener al menos 8 caracteres' });
    },
    {
      submission: {
        action: async () => {
          this.registerError.set(null);
          this.isSubmitting.set(true);

          try {
            const payload = this.model();
            await firstValueFrom(this.authService.register(payload));
            await this.router.navigate(['/deals']);
          } catch (error: any) {
            console.error('Error al registrar empresa:', error);
            this.registerError.set(
              error.error?.detail || 'No se pudo completar el registro. Verifica los datos e intenta nuevamente.'
            );
          } finally {
            this.isSubmitting.set(false);
          }
        },
      },
    }
  );

  /**
   * Genera automáticamente un slug amigable para URL a partir del nombre de la empresa.
   */
  onCompanyNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const generated = this.toSlug(input.value);
    const currentSlug = this.model().slug;

    // Solo auto-completa si el slug actual est á vacío o coincide con el generado previo
    if (!currentSlug || currentSlug === this.toSlug(this.model().company_name)) {
      this.model.update((m) => ({ ...m, slug: generated }));
    }
  }

  private toSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
