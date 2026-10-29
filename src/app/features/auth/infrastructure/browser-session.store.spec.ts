import { TestBed } from '@angular/core/testing';
import type { AuthenticatedSession } from '@features/auth/domain/authenticated-session';
import { BrowserSessionStore } from './browser-session.store';

describe('BrowserSessionStore', () => {
  const session: AuthenticatedSession = {
    accessToken: 'token',
    tokenType: 'bearer',
    user: {
      id: 'user',
      tenantId: 'tenant',
      email: 'equipo@acme.com',
      fullName: 'Equipo Acme',
      role: 'ADMIN',
    },
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('guarda solo token y perfil y publica el rol inmediatamente', () => {
    const store = TestBed.inject(BrowserSessionStore);
    store.save(session);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.currentUser()?.role).toBe('ADMIN');
    expect(localStorage.getItem('access_token')).toBe('token');
    const profile = JSON.parse(localStorage.getItem('currentUser')!);
    expect(profile).toMatchObject({ id: 'user', tenant_id: 'tenant', role: 'ADMIN' });
    expect(profile).not.toHaveProperty('password');
    expect(Object.keys(localStorage).sort()).toEqual(['access_token', 'currentUser']);
  });

  it('restaura una sesión guardada usando las claves anteriores', () => {
    localStorage.setItem('access_token', 'token-previo');
    localStorage.setItem('currentUser', JSON.stringify({ id: 'user', role: 'CLIENTE' }));
    const store = TestBed.inject(BrowserSessionStore);
    expect(store.getToken()).toBe('token-previo');
    expect(store.currentUser()?.role).toBe('CLIENTE');
  });

  it('tolera un perfil guardado con JSON inválido', () => {
    localStorage.setItem('currentUser', '{invalid');
    expect(TestBed.inject(BrowserSessionStore).currentUser()).toBeNull();
  });

  it('actualiza token y perfil cuando otra pestaña inicia una sesión', () => {
    const store = TestBed.inject(BrowserSessionStore);
    localStorage.setItem('currentUser', JSON.stringify({ id: 'other', role: 'CLIENTE' }));
    localStorage.setItem('access_token', 'token-de-otra-pestana');
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'access_token', storageArea: localStorage }),
    );
    expect(store.getToken()).toBe('token-de-otra-pestana');
    expect(store.currentUser()?.role).toBe('CLIENTE');
  });

  it('cierra la sesión si otra pestaña elimina los datos guardados', () => {
    const store = TestBed.inject(BrowserSessionStore);
    store.save(session);
    localStorage.clear();
    window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage }));
    expect(store.isAuthenticated()).toBe(false);
    expect(store.currentUser()).toBeNull();
  });

  it('retira el listener al destruirse el servicio', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    TestBed.inject(BrowserSessionStore);
    TestBed.resetTestingModule();
    expect(remove).toHaveBeenCalledWith('storage', expect.any(Function));
  });

  it('borra la sesión y conserva otros datos de la aplicación', () => {
    const store = TestBed.inject(BrowserSessionStore);
    localStorage.setItem('preferencias', 'datos');
    store.save(session);
    store.clear();
    expect(store.getToken()).toBeNull();
    expect(store.currentUser()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
    expect(localStorage.getItem('preferencias')).toBe('datos');
  });

  it('restaura los datos anteriores si falla el guardado del nuevo token', () => {
    const store = TestBed.inject(BrowserSessionStore);
    store.save(session);
    const previousProfile = localStorage.getItem('currentUser');
    const setItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key === 'access_token' && value === 'nuevo-token') throw new Error('Sin espacio');
      return setItem.call(this, key, value);
    });
    expect(() =>
      store.save({
        ...session,
        accessToken: 'nuevo-token',
        user: { ...session.user, fullName: 'Nuevo' },
      }),
    ).toThrow('Sin espacio');
    expect(store.getToken()).toBe('token');
    expect(store.currentUser()?.full_name).toBe('Equipo Acme');
    expect(localStorage.getItem('access_token')).toBe('token');
    expect(localStorage.getItem('currentUser')).toBe(previousProfile);
  });
});
