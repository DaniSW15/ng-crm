import { describe, expect, it } from 'vitest';
import { createLoginCredentials, InvalidLoginCredentialsError } from './login-credentials';

describe('Credenciales de inicio de sesión', () => {
  it.each(['', '   '])('rechaza un correo vacío: %j', (email) => {
    expect(() => createLoginCredentials({ email, password: 'clave' })).toThrow(
      InvalidLoginCredentialsError,
    );
  });

  it('rechaza una contraseña vacía', () => {
    expect(() => createLoginCredentials({ email: 'equipo@acme.com', password: '' })).toThrow(
      'La contraseña es obligatoria',
    );
  });

  it('conserva exactamente la contraseña y solo elimina espacios externos del correo', () => {
    const input = Object.freeze({ email: '  Equipo@acme.com  ', password: '  mi Clave  ' });
    expect(createLoginCredentials(input)).toEqual({
      email: 'Equipo@acme.com',
      password: '  mi Clave  ',
    });
    expect(input.email).toBe('  Equipo@acme.com  ');
  });

  it('no aplica al login la longitud mínima del registro', () => {
    expect(createLoginCredentials({ email: 'equipo@acme.com', password: 'abc' }).password).toBe(
      'abc',
    );
  });
});
