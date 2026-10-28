import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage } from './api-error-message';

describe('apiErrorMessage', () => {
  it('convierte la validación del servidor en texto legible', () => {
    const error = new HttpErrorResponse({
      status: 422,
      error: { detail: [{ msg: 'Correo no válido' }, { msg: 'Contraseña muy corta' }] },
    });
    expect(apiErrorMessage(error, 'Error')).toBe('Correo no válido Contraseña muy corta');
  });

  it('usa el mensaje alternativo para respuestas inesperadas', () => {
    expect(
      apiErrorMessage(
        new HttpErrorResponse({ status: 500, error: { detail: { internal: true } } }),
        'Intenta nuevamente',
      ),
    ).toBe('Intenta nuevamente');
  });
});
