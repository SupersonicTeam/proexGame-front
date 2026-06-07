import type {
  CreateSessionInput,
  GameEventHandler,
  GameEventName,
  JoinSessionInput,
  ReconnectInput,
  SubmitAnswerInput,
} from '../types'

/**
 * Contrato estável entre a UI e o "backend". Espelha exatamente a §7 da SPEC.
 *
 * Hoje existe só a implementação `MockGameClient` (loop simulado localmente,
 * dados em JSON). Quando o backend NestJS + Socket.IO existir, criamos
 * `SocketGameClient` com esta MESMA interface e trocamos apenas a factory em
 * `client/index.ts` — nenhuma tela ou store muda.
 *
 * Comandos = client → server. Eventos (`on`/`off`) = server → client.
 */
export interface GameClient {
  /* ---- comandos (client → server, §7) ---- */
  createSession(input: CreateSessionInput): void
  joinSession(input: JoinSessionInput): void
  startGame(): void
  rollForOrder(): void
  rollDice(): void
  submitAnswer(input: SubmitAnswerInput): void
  leaveSession(): void
  reconnect(input: ReconnectInput): void

  /* ---- assinatura de eventos (server → client, §7) ---- */
  on<K extends GameEventName>(event: K, handler: GameEventHandler<K>): void
  off<K extends GameEventName>(event: K, handler: GameEventHandler<K>): void

  /** Libera timers/listeners internos. */
  dispose(): void
}
