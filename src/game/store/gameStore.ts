import { create } from 'zustand'
import type {
  AnswerResultEvent,
  CreateSessionInput,
  DiceResultEvent,
  GameOverEvent,
  JoinSessionInput,
  OrderingState,
  OrderResultEvent,
  OrderRollEvent,
  Player,
  QuestionPromptEvent,
  RankingEntry,
  SessionState,
  SubmitAnswerInput,
  TurnSkippedEvent,
} from '../types'
import { createGameClient } from '../client'
import type { GameClient, MockGameClientOptions } from '../client'

/**
 * FLUXO DE DADOS (unidirecional):
 *
 *   componente → ação do store → comando no client → client emite evento
 *   → handler do store → set(...) → componente re-renderiza
 *
 * O componente NUNCA fala direto com o client; ele chama uma ação do store.
 * O client é a fonte da verdade do loop (hoje simulado localmente) e comunica
 * mudanças apenas por eventos, que o store traduz em estado reativo.
 */

/** Fase derivada exibível pela UI. */
type Phase = 'idle' | 'lobby' | 'order' | 'playing' | 'finished'

export interface GameStoreState {
  /* estado reativo */
  session: SessionState | null
  myPlayerId: string | null
  phase: Phase
  lastDice: DiceResultEvent | null
  order: OrderResultEvent | null
  /* fase de ordem interativa (S4): substado + rolagens da rodada atual */
  ordering: OrderingState | null
  orderRolls: OrderRollEvent[]
  winner: RankingEntry | null
  ranking: RankingEntry[]
  error: string | null
  /* pergunta atual (só do jogador local) + resultado + aviso de presídio */
  question: QuestionPromptEvent | null
  lastAnswer: AnswerResultEvent | null
  turnSkipped: TurnSkippedEvent | null

  /* ações (componente → client) */
  createSession: (input: CreateSessionInput) => void
  joinSession: (input: JoinSessionInput) => void
  startGame: () => void
  rollForOrder: () => void
  rollDice: () => void
  submitAnswer: (input: SubmitAnswerInput) => void
  leaveSession: () => void
  clearQuestion: () => void
  clearTurnSkipped: () => void
  reset: () => void
}

/**
 * Deriva a fase exibível diretamente do `status` da sessão (S4). O backend (e o
 * mock) são autoritativos sobre o `status`: `ordering` → tela de ordem; demais
 * mapeiam 1:1. Sem heurística de "ordem resolvida".
 */
function derivePhase(session: SessionState | null): Phase {
  if (!session) return 'idle'
  switch (session.status) {
    case 'lobby':
      return 'lobby'
    case 'ordering':
      return 'order'
    case 'finished':
      return 'finished'
    default:
      return 'playing'
  }
}

/** Opções de criação do client repassadas à factory (ex.: botCount). */
let clientOptions: MockGameClientOptions | undefined

/**
 * Permite ajustar as opções do client ANTES do primeiro uso do store
 * (ex.: em testes ou para configurar a quantidade de bots do hot-seat).
 */
export function configureGameClient(opts: MockGameClientOptions): void {
  clientOptions = opts
}

/**
 * Client singleton em escopo de módulo. Tanto o store quanto a camada de
 * playback do dado (`useDiceThrows`) usam a MESMA instância — assim a UI pode
 * assinar os eventos diretamente sem perder rolagens. Continua sendo o único
 * ponto de troca para o backend real (via `client/index.ts`).
 */
let clientSingleton: GameClient | null = null
export function getGameClient(): GameClient {
  if (!clientSingleton) clientSingleton = createGameClient(clientOptions)
  return clientSingleton
}

/** Atraso antes de exibir a tela de resultado, p/ a última rolagem animar. */
const FINISH_DELAY_MS = 3500
let finishTimer: ReturnType<typeof setTimeout> | null = null

const initialState = {
  session: null,
  myPlayerId: null,
  phase: 'idle' as Phase,
  lastDice: null,
  order: null,
  ordering: null,
  orderRolls: [] as OrderRollEvent[],
  winner: null,
  ranking: [] as RankingEntry[],
  error: null,
  question: null,
  lastAnswer: null,
  turnSkipped: null,
}

export const useGameStore = create<GameStoreState>((set, get) => {
  // Mesma instância usada pela camada de playback do dado.
  const client: GameClient = getGameClient()

  /* --- handlers: client emite → store atualiza --- */

  client.on('sessionCreated', ({ playerId, session }) => {
    set({
      myPlayerId: playerId,
      session,
      phase: derivePhase(session),
      error: null,
    })
  })

  client.on('lobbyState', ({ session }) => {
    set({ session, phase: derivePhase(session) })
  })

  client.on('playerJoined', ({ session }) => {
    set({ session, phase: derivePhase(session) })
  })

  client.on('gameStarted', ({ session }) => {
    set({
      session,
      phase: derivePhase(session),
      order: null,
      ordering: null,
      orderRolls: [],
      question: null,
      lastAnswer: null,
      turnSkipped: null,
    })
  })

  // Snapshot canônico (S4): resync/reconexão e transições de status.
  client.on('gameState', ({ session }) => {
    set({ session, phase: derivePhase(session), ordering: session.ordering })
  })

  // Início de uma rodada de ordem (S4): zera as rolagens da rodada.
  client.on('orderPhase', ({ round, playersToRoll }) => {
    set({
      ordering: { round, playersToRoll, rolled: [] },
      orderRolls: [],
      phase: 'order',
    })
  })

  // Rolagem individual de ordem (S4): acumula valor + marca quem já rolou.
  client.on('orderRoll', (roll) => {
    const cur = get().ordering
    set({
      orderRolls: [...get().orderRolls, roll],
      ordering: cur ? { ...cur, rolled: [...cur.rolled, roll.playerId] } : cur,
    })
  })

  client.on('orderResult', (order) => {
    // Ordem resolvida: guarda o resultado e encerra o substado de ordem. A
    // transição para 'playing' vem do gameState/turnChanged subsequentes.
    set({ order, ordering: null })
  })

  client.on('turnChanged', ({ session }) => {
    // Ao trocar de turno, qualquer pergunta/aviso pendente é descartado.
    set({
      session,
      phase: derivePhase(session),
      question: null,
      turnSkipped: null,
    })
  })

  client.on('questionPrompt', (question) => {
    set({ question, lastAnswer: null })
  })

  client.on('answerResult', (lastAnswer) => {
    // Atualiza a casa do jogador no estado local (placar) além do board visual.
    const session = get().session
    if (session) {
      const players: Player[] = session.players.map((p) =>
        p.id === lastAnswer.playerId
          ? { ...p, square: lastAnswer.toSquare }
          : p,
      )
      set({ lastAnswer, session: { ...session, players } })
    } else {
      set({ lastAnswer })
    }
  })

  client.on('turnSkipped', (turnSkipped) => {
    set({ turnSkipped })
  })

  client.on('diceResult', (lastDice) => {
    // Atualiza a casa do jogador na cópia local do estado para a UI animar.
    const session = get().session
    if (session) {
      const players: Player[] = session.players.map((p) =>
        p.id === lastDice.playerId ? { ...p, square: lastDice.toSquare } : p,
      )
      set({ lastDice, session: { ...session, players } })
    } else {
      set({ lastDice })
    }
  })

  client.on('gameOver', ({ winner, ranking }: GameOverEvent) => {
    const session = get().session
    // Define vencedor/ranking já, mas ADIA a troca para a tela de resultado
    // para a última rolagem (vitória) ter tempo de animar no overlay do dado.
    set({
      winner,
      ranking,
      session: session
        ? { ...session, status: 'finished', winner: winner.playerId }
        : session,
    })
    if (finishTimer) clearTimeout(finishTimer)
    finishTimer = setTimeout(() => set({ phase: 'finished' }), FINISH_DELAY_MS)
  })

  client.on('playerDisconnected', ({ session }) => set({ session }))
  client.on('playerReconnected', ({ session }) => set({ session }))
  client.on('error', ({ message }) => set({ error: message }))

  return {
    ...initialState,

    createSession: (input) => {
      set({ error: null })
      client.createSession(input)
    },
    joinSession: (input) => {
      set({ error: null })
      client.joinSession(input)
    },
    startGame: () => client.startGame(),
    rollForOrder: () => client.rollForOrder(),
    rollDice: () => client.rollDice(),
    submitAnswer: (input) => client.submitAnswer(input),
    leaveSession: () => client.leaveSession(),
    clearQuestion: () => set({ question: null, lastAnswer: null }),
    clearTurnSkipped: () => set({ turnSkipped: null }),
    reset: () => {
      if (finishTimer) {
        clearTimeout(finishTimer)
        finishTimer = null
      }
      set({ ...initialState })
    },
  }
})

/* ------------------------------------------------------------------ */
/* Seletores auxiliares                                                */
/* ------------------------------------------------------------------ */

/** O jogador local (host no hot-seat). */
export function useMyPlayer(): Player | null {
  return useGameStore((s) => {
    if (!s.session || !s.myPlayerId) return null
    return s.session.players.find((p) => p.id === s.myPlayerId) ?? null
  })
}

/** O jogador de quem é o turno atual (durante a partida). */
export function useCurrentTurnPlayer(): Player | null {
  return useGameStore((s) => {
    const session = s.session
    if (!session || session.turnOrder.length === 0) return null
    const id = session.turnOrder[session.currentTurnIndex]
    return session.players.find((p) => p.id === id) ?? null
  })
}

/** Se é o turno do jogador local. */
export function useIsMyTurn(): boolean {
  return useGameStore((s) => {
    const session = s.session
    if (!session || !s.myPlayerId || session.turnOrder.length === 0) {
      return false
    }
    return session.turnOrder[session.currentTurnIndex] === s.myPlayerId
  })
}
