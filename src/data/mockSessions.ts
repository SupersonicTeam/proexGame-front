import type { Player } from '../game/types'
import { pickBotNames } from './botNames'

/** Limites de jogadores por sessão (RF-02). */
export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 4

let seq = 0

/** Gera um id de jogador simples e único dentro do processo. */
export function nextPlayerId(prefix = 'p'): string {
  seq += 1
  return `${prefix}-${seq}-${Math.floor(Math.random() * 1e6).toString(36)}`
}

/** Cria um `Player` no estado inicial (casa 0, conectado). */
export function createPlayer(
  name: string,
  options: { isHost?: boolean; id?: string } = {},
): Player {
  return {
    id: options.id ?? nextPlayerId(options.isHost ? 'host' : 'bot'),
    name,
    square: 0,
    connected: true,
    usedQuestionIds: [],
    skipTurns: 0,
    isHost: options.isHost ?? false,
  }
}

/**
 * Monta a lista de jogadores para o modo HOT-SEAT (uma única máquina):
 * o humano é o host e os demais assentos são bots que jogam sozinhos.
 *
 * `botCount` é fixado em [0, MAX_PLAYERS-1] para nunca exceder 4 jogadores.
 * Os ids dos bots são marcados (`isBot`) apenas para o cliente saber quais
 * deve automatizar — `Player` não carrega esse flag.
 */
export function createSimulatedPlayers(
  hostName: string,
  botCount: number,
  rng: () => number = Math.random,
): { players: Player[]; botIds: Set<string> } {
  const clampedBots = Math.max(0, Math.min(botCount, MAX_PLAYERS - 1))
  const host = createPlayer(hostName, { isHost: true })

  const names = pickBotNames(clampedBots, new Set([hostName]), rng)
  const bots = names.map((name) => createPlayer(name))

  return {
    players: [host, ...bots],
    botIds: new Set(bots.map((b) => b.id)),
  }
}
