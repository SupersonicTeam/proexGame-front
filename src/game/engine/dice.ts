/**
 * Rolagem de dado de 6 faces.
 *
 * `rng` é injetável (default `Math.random`) para permitir testes determinísticos
 * — qualquer função que retorne um número em [0, 1).
 */
export function rollD6(rng: () => number = Math.random): number {
  return Math.floor(rng() * 6) + 1
}
