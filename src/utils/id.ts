/**
 * Identificadores locales. No usamos `crypto.randomUUID` porque no esta
 * disponible en todos los motores de RN sin polyfill.
 */
export function createId(prefix = 'id'): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}
