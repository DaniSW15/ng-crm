export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
}

export class InvalidLoginCredentialsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidLoginCredentialsError';
  }
}

/** Comprueba las entradas mínimas del caso de uso sin cambiar la contraseña. */
export function createLoginCredentials(input: LoginCredentials): LoginCredentials {
  const email = input.email.trim();
  if (!email) throw new InvalidLoginCredentialsError('El correo electrónico es obligatorio');
  if (!input.password.length)
    throw new InvalidLoginCredentialsError('La contraseña es obligatoria');

  return Object.freeze({ email, password: input.password });
}
