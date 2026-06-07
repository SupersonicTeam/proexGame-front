/**
 * Jogadores de exemplo (1 a 4), incluindo dois na mesma casa para testar o
 * agrupamento de tokens.
 */
import type { PlayerView } from '../types'
import { TOKEN_COLORS } from '../theme'

export const onePlayer: PlayerView[] = [
  {
    id: 'p1',
    name: 'Ana',
    color: TOKEN_COLORS[0],
    square: 0,
    isCurrentUser: true,
  },
]

export const twoPlayers: PlayerView[] = [
  {
    id: 'p1',
    name: 'Ana',
    color: TOKEN_COLORS[0],
    square: 3,
    isCurrentUser: true,
  },
  { id: 'p2', name: 'Bruno', color: TOKEN_COLORS[1], square: 3 },
]

export const fourPlayers: PlayerView[] = [
  {
    id: 'p1',
    name: 'Ana',
    color: TOKEN_COLORS[0],
    square: 5,
    isCurrentUser: true,
  },
  { id: 'p2', name: 'Bruno', color: TOKEN_COLORS[1], square: 5 },
  { id: 'p3', name: 'Carla', color: TOKEN_COLORS[2], square: 5 },
  { id: 'p4', name: 'Diego', color: TOKEN_COLORS[3], square: 12 },
]

export interface PlayersFixture {
  label: string
  players: PlayerView[]
}

export const playersFixtures: PlayersFixture[] = [
  { label: '1 jogador', players: onePlayer },
  { label: '2 jogadores (mesma casa)', players: twoPlayers },
  { label: '4 jogadores (3 juntos)', players: fourPlayers },
]
