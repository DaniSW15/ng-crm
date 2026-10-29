import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthenticatedSession } from '../domain/authenticated-session';
import { InvalidLoginCredentialsError } from '../domain/login-credentials';
import type { AuthRepository } from './auth.repository';
import type { SessionStore } from './session.store';
import { LoginUseCase } from './login.use-case';

describe('Caso de uso: iniciar sesión', () => {
  const session: AuthenticatedSession = {
    accessToken: 'token-de-prueba',
    tokenType: 'bearer',
    user: {
      id: 'user',
      tenantId: 'tenant',
      email: 'equipo@acme.com',
      fullName: 'Equipo Acme',
      role: 'ADMIN',
    },
  };
  const login = vi.fn<AuthRepository['login']>();
  const save = vi.fn<SessionStore['save']>();
  let useCase: LoginUseCase;

  beforeEach(() => {
    login.mockReset().mockResolvedValue(session);
    save.mockReset();
    useCase = new LoginUseCase({ login }, { save });
  });

  it('guarda la sesión confirmada después de autenticar y devuelve el resultado', async () => {
    const order: string[] = [];
    login.mockImplementation(async () => {
      order.push('autenticar');
      return session;
    });
    save.mockImplementation(() => {
      order.push('guardar');
    });

    const result = await useCase.execute({ email: 'equipo@acme.com', password: '  clave  ' });
    expect(login).toHaveBeenCalledExactlyOnceWith({
      email: 'equipo@acme.com',
      password: '  clave  ',
    });
    expect(save).toHaveBeenCalledExactlyOnceWith(session);
    expect(order).toEqual(['autenticar', 'guardar']);
    expect(result).toBe(session);
  });

  it('no autentica ni guarda cuando faltan credenciales', async () => {
    await expect(useCase.execute({ email: '', password: '' })).rejects.toBeInstanceOf(
      InvalidLoginCredentialsError,
    );
    expect(login).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('no guarda una sesión si la autenticación falla', async () => {
    const error = new Error('Credenciales rechazadas');
    login.mockRejectedValue(error);
    await expect(useCase.execute({ email: 'equipo@acme.com', password: 'clave' })).rejects.toBe(
      error,
    );
    expect(save).not.toHaveBeenCalled();
  });

  it('no completa el login cuando no se puede guardar la sesión', async () => {
    const error = new Error('Almacenamiento no disponible');
    save.mockImplementation(() => {
      throw error;
    });
    await expect(useCase.execute({ email: 'equipo@acme.com', password: 'clave' })).rejects.toBe(
      error,
    );
  });
});
