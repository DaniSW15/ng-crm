import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  if (error.status === 0)
    return 'No pudimos conectar con el servicio. Revisa tu conexión e intenta nuevamente.';
  if (error.status === 429)
    return 'Hay demasiados intentos. Espera un momento antes de volver a intentar.';

  const detail: unknown = error.error?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .filter((item): item is { msg: string } => typeof item?.msg === 'string')
      .map((item) => item.msg);
    if (messages.length) return messages.join(' ');
  }
  return fallback;
}
