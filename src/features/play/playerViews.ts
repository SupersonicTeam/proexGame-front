import type { Player } from '../../game/types'
import type { PlayerView } from '../board'
import { TOKEN_COLORS } from '../board/theme'

/**
 * Converte os jogadores da sessão para a forma que o tabuleiro precisa,
 * atribuindo uma cor estável por índice e marcando o jogador local.
 */
export function toPlayerViews(
  players: Player[],
  myPlayerId: string | null,
): PlayerView[] {
  return players.map((p, i) => ({
    id: p.id,
    name: p.name,
    color: TOKEN_COLORS[i % TOKEN_COLORS.length],
    square: p.square,
    isCurrentUser: p.id === myPlayerId,
  }))
}

/** Cor do token de um jogador pelo seu índice na lista da sessão. */
export function colorForIndex(index: number): string {
  return TOKEN_COLORS[index % TOKEN_COLORS.length]
}
