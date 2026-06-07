/**
 * Gera um código de sessão de 5 dígitos (RF-01), p.ex. "04217".
 *
 * Garante unicidade em relação ao conjunto `existing` (re-rola em colisão).
 * `rng` injetável para testes.
 */
export function generateSessionCode(
  existing: Set<string> = new Set(),
  rng: () => number = Math.random,
): string {
  let code: string
  do {
    code = String(Math.floor(rng() * 100000)).padStart(5, '0')
  } while (existing.has(code))
  return code
}
