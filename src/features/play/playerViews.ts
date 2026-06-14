import type { Player, Tier } from '../../game/types'
import type { PlayerView } from '../board'
import { TOKEN_COLORS } from '../board/theme'

/**
 * Rótulo visual de cada tier de catch-up (§3/§4). Exibido ao vivo no painel
 * de posições; o tier de `last` sinaliza o impulso de recuperação.
 */
const TIER_META: Record<Tier, { label: string; icon: string; className: string }> =
  {
    leader: { label: 'Líder', icon: '👑', className: 'bg-amber-100 text-amber-700' },
    middle: { label: 'Meio', icon: '•', className: 'bg-slate-200 text-slate-500' },
    last: { label: 'Impulso', icon: '🚀', className: 'bg-sky-100 text-sky-700' },
  }

/** Metadados de exibição (rótulo/ícone/cor) de um tier. */
export function tierMeta(tier: Tier) {
  return TIER_META[tier]
}

/** Customização LOCAL do peão do jogador (aplicada só ao próprio token). */
export interface LocalPawn {
  color?: string
  emoji?: string
}

/**
 * Converte os jogadores da sessão para a forma que o tabuleiro precisa,
 * atribuindo uma cor estável por índice e marcando o jogador local. A
 * customização (`custom`) sobrepõe cor/emoji APENAS do jogador local.
 */
export function toPlayerViews(
  players: Player[],
  myPlayerId: string | null,
  custom?: LocalPawn,
): PlayerView[] {
  return players.map((p, i) => {
    const isMe = p.id === myPlayerId
    return {
      id: p.id,
      name: p.name,
      color:
        isMe && custom?.color
          ? custom.color
          : TOKEN_COLORS[i % TOKEN_COLORS.length],
      square: p.square,
      isCurrentUser: isMe,
      emoji: isMe && custom?.emoji ? custom.emoji : undefined,
    }
  })
}

/** Cor do token de um jogador pelo seu índice na lista da sessão. */
export function colorForIndex(index: number): string {
  return TOKEN_COLORS[index % TOKEN_COLORS.length]
}
