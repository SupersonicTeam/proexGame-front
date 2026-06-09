import type { Tier } from '../types'

/**
 * Classifica cada jogador por tier de posição a partir das casas atuais (§3).
 *
 * Regras (S3-F01):
 * - `leader` = casa máxima (empate no topo → todos os do topo são leader);
 * - `last` = casa mínima (empate na base → todos os da base são last);
 * - `middle` = os demais.
 *
 * Casos de borda:
 * - Partida de 2 jogadores: só há `leader`/`last` (não há "meio"); empate → ambos
 *   `leader`.
 * - `max === min` (todos na mesma casa): ninguém está atrás → não há catch-up,
 *   então TODOS recebem `leader` (T_p = 0).
 */
export function computeTiers(
  players: { id: string; square: number }[],
): Record<string, Tier> {
  const result: Record<string, Tier> = {}
  if (players.length === 0) return result

  const squares = players.map((p) => p.square)
  const max = Math.max(...squares)
  const min = Math.min(...squares)

  // Todos na mesma casa → ninguém atrás → todos leader (sem catch-up).
  if (max === min) {
    for (const p of players) result[p.id] = 'leader'
    return result
  }

  for (const p of players) {
    if (p.square === max) {
      result[p.id] = 'leader'
    } else if (p.square === min) {
      result[p.id] = 'last'
    } else {
      result[p.id] = 'middle'
    }
  }
  return result
}

/** T_p numérico por tier: leader 0, middle 1, last 2 (§4). */
export function tierBonus(tier: Tier): number {
  switch (tier) {
    case 'leader':
      return 0
    case 'middle':
      return 1
    case 'last':
      return 2
  }
}
