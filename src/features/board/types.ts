/**
 * Tipos de view específicos do renderizador de tabuleiro. Tipos de domínio
 * (BoardDescriptor, Subject, TileType) vêm de `src/game/types.ts` e NÃO são
 * redefinidos aqui.
 */
import type { BoardDescriptor } from '../../game/types'

/** Um jogador como o renderizador precisa enxergá-lo (posição + cor + nome). */
export interface PlayerView {
  id: string
  name: string
  color: string
  square: number
  isCurrentUser?: boolean
}

/** Props do componente raiz `BoardSvg`. */
export interface BoardSvgProps {
  board: BoardDescriptor
  players: PlayerView[]
  /** Id do jogador da vez (anel pulsante no token). */
  currentTurnPlayerId?: string
  onTileClick?: (square: number) => void
}

/** Centro calculado de uma casa, em coordenadas de unidade (viewBox). */
export interface TilePoint {
  index: number
  cx: number
  cy: number
  row: number
  col: number
}

/** Resultado do cálculo de layout serpentino. */
export interface BoardLayout {
  cols: number
  rows: number
  viewBox: { w: number; h: number }
  points: TilePoint[]
  pathD: string
}
