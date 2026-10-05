/**
 * Guard compartido de auto-envío para consultas delegadas por Tenshi.
 *
 * Existen dos mecanismos que pueden auto-enviar la misma consulta:
 *  1. `useQueryParams` (URL `?prompt=...&submit=true`)
 *  2. `ChatForm` (evento `tenshi-submit-agent-prompt`)
 *
 * Ambos deben "reclamar" el envío antes de ejecutar `submitMessage`.
 * Solo el primero en reclamar un prompt dentro de la ventana de tiempo lo envía.
 */

const DEDUPE_WINDOW_MS = 2500;

let lastClaim: { prompt: string; time: number } | null = null;

const normalize = (text: string) => (text || '').trim().replace(/\s+/g, ' ');

/**
 * Intenta reclamar el auto-envío de un prompt.
 * @returns `true` si el llamador debe enviarlo; `false` si ya fue enviado recientemente.
 */
export function claimAutoSubmit(prompt: string): boolean {
  const normalized = normalize(prompt);
  if (!normalized) {
    return false;
  }
  const now = Date.now();
  if (lastClaim && lastClaim.prompt === normalized && now - lastClaim.time < DEDUPE_WINDOW_MS) {
    return false;
  }
  lastClaim = { prompt: normalized, time: now };
  return true;
}

/**
 * Libera el reclamo de un prompt para permitir reintentos inmediatos si falló el despacho.
 */
export function releaseAutoSubmit(prompt?: string): void {
  if (!prompt || (lastClaim && lastClaim.prompt === normalize(prompt))) {
    lastClaim = null;
  }
}
