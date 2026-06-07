import { MockGameClient } from './MockGameClient'
import type { MockGameClientOptions } from './MockGameClient'
import { SocketGameClient } from './SocketGameClient'
import type { GameClient } from './GameClient'

export type { GameClient } from './GameClient'
export type { MockGameClientOptions } from './MockGameClient'

/**
 * Único ponto de troca da implementação do cliente. Nenhuma tela ou store muda —
 * ambos respeitam a interface `GameClient`.
 *
 * Regras:
 *  - **Build de produção** (`vite build`): SEMPRE backend real. Conecta no MESMO
 *    domínio (Nginx faz proxy de `/socket.io/`) quando `VITE_BACKEND_URL` está
 *    vazia; ou na URL informada, se definida.
 *  - **Dev** (`npm run dev`): usa o backend real se `VITE_BACKEND_URL` estiver
 *    definida (ex.: `.env.local` com `http://localhost:3000`); senão, roda o
 *    `MockGameClient` (modo demonstração, sem backend).
 */
export function createGameClient(opts?: MockGameClientOptions): GameClient {
  const env = import.meta.env
  if (env.PROD) {
    return new SocketGameClient(env.VITE_BACKEND_URL ?? '')
  }
  const url = env.VITE_BACKEND_URL
  if (url) return new SocketGameClient(url)
  return new MockGameClient(opts)
}
