import type { Player, Tier } from '../../game/types'
import type { PlayerView } from '../board'
import { TOKEN_COLORS } from '../board/theme'
import { PAWN_EMOJIS } from '../lobby/usePlayerCustomization'

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
 * Converte os jogadores da sessão para a forma que o tabuleiro precisa e marca
 * o jogador local. Precedência de aparência (S5):
 *  1. `p.color`/`p.emoji` vindos do BACKEND (escolha sincronizada de QUALQUER
 *     jogador via `setAppearance`);
 *  2. customização LOCAL (`custom`) do jogador local — feedback imediato antes
 *     do eco do servidor;
 *  3. fallback determinístico por índice (peões distintos sem backend/escolha).
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
        p.color ??
        (isMe && custom?.color
          ? custom.color
          : TOKEN_COLORS[i % TOKEN_COLORS.length]),
      square: p.square,
      isCurrentUser: isMe,
      emoji:
        p.emoji ??
        (isMe && custom?.emoji
          ? custom.emoji
          : PAWN_EMOJIS[i % PAWN_EMOJIS.length]),
    }
  })
}

/** Cor do token de um jogador pelo seu índice na lista da sessão. */
export function colorForIndex(index: number): string {
  return TOKEN_COLORS[index % TOKEN_COLORS.length]
}

/**
 * Emoji PADRÃO de um jogador pelo índice na lista da sessão. Determinístico
 * (igual em todos os clientes, pois a ordem da lista vem do servidor), então
 * todo peão fica visualmente distinto e com emoji — sem precisar do backend
 * guardar a escolha de cada um. O jogador local pode sobrepor o seu no seletor.
 */
export function emojiForIndex(index: number): string {
  return PAWN_EMOJIS[index % PAWN_EMOJIS.length]
}
