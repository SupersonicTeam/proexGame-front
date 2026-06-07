import { MockGameClient } from './MockGameClient'
import type { MockGameClientOptions } from './MockGameClient'
import type { GameClient } from './GameClient'

export type { GameClient } from './GameClient'
export type { MockGameClientOptions } from './MockGameClient'

/**
 * Único ponto de troca da implementação do cliente.
 *
 * Hoje devolve o `MockGameClient` (loop simulado local). Quando o backend
 * existir, basta retornar `new SocketGameClient(opts)` aqui — nenhuma tela ou
 * store muda, pois ambos respeitam a interface `GameClient`.
 */
export function createGameClient(opts?: MockGameClientOptions): GameClient {
  return new MockGameClient(opts)
}
