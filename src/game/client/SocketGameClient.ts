/**
 * Implementação real do `GameClient` sobre Socket.IO, seguindo os contratos
 * congelados CONTRACT-S1.md e CONTRACT-S2.md.
 *
 * O backend envia payloads ENXUTOS (deltas); este adapter mantém uma cópia
 * local do `SessionState` e reconstrói os eventos INTERNOS (mais ricos) que o
 * store/telas já consomem — então a UI não muda ao trocar mock → real.
 *
 * Notas de contrato:
 *  - `playerId` vem pelo ACK de `createSession`/`joinSession` (guardamos p/ reconexão).
 *  - `lobbyState` é a fonte da verdade dos jogadores no lobby.
 *  - `gameStarted.board` traz `tileTypeBySquare`/`subjectBySquare` (sem `questionSquares`).
 *  - `questionPrompt` NÃO traz `subject` → derivamos de `subjectBySquare[casa]`.
 *  - `answerResult.errorType` usa `'none'` p/ acerto (mapeado p/ `null`) e NÃO traz
 *    o índice da correta (RF-16).
 *  - `gameOver.winner` é o `playerId` (string) → resolvemos para a entry do ranking.
 */
import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import type {
  AnswerErrorType,
  CreateSessionInput,
  Difficulty,
  GameEventHandler,
  GameEventName,
  JoinSessionInput,
  Player,
  RankingEntry,
  ReconnectInput,
  SessionState,
  SessionStatus,
  Subject,
  SubmitAnswerInput,
  Tier,
  TileType,
} from '../types'
import type { GameClient } from './GameClient'
import { TypedEmitter } from './emitter'

/* ---- payloads crus do servidor (conforme os contratos) ---- */
interface Ack {
  code: string
  playerId: string
}
interface RawPlayerView {
  id: string
  name: string
  connected: boolean
  isHost: boolean
}
interface RawLobbyState {
  code: string
  status: string
  hostId: string
  players: RawPlayerView[]
}
interface RawBoard {
  size: number
  tileTypeBySquare?: Record<string, string>
  subjectBySquare?: Record<string, Subject>
}
interface RawDiceResult {
  playerId: string
  value: number
  fromSquare: number
  toSquare: number
}
interface RawQuestionPrompt {
  questionId: string
  statement: string
  options: string[]
}
interface RawAnswerResult {
  playerId: string
  correct: boolean
  errorType: 'none' | 'proximal' | 'wrong'
  movement: number
  fromSquare: number
  toSquare: number
  /**
   * Detalhamento do movimento de acerto (§4) — CONTRACT-S3, ADITIVO e OPCIONAL.
   * O backend S2 atual NÃO envia estes campos; só aparecem após o aceite da
   * proposta S3. Quando ausentes, ficam `undefined` (degradação graciosa).
   */
  tier?: Tier
  baseAdvance?: number
  tierBonus?: number
  nudged?: boolean
}

function buildBoard(raw: RawBoard): SessionState['board'] {
  const tileTypeBySquare: Record<number, TileType> = {}
  const questionSquares: number[] = []
  const rawTypes = raw.tileTypeBySquare ?? {}
  for (const key of Object.keys(rawTypes)) {
    const sq = Number(key)
    const t = rawTypes[key]
    if (t === 'question') {
      tileTypeBySquare[sq] = 'question'
      questionSquares.push(sq)
    } else if (t === 'prison') {
      tileTypeBySquare[sq] = 'prison'
    }
    // 'start' | 'finish' | 'normal' são tratados pela UI via índice (0 e size).
  }
  const subjectBySquare: Record<number, Subject> = {}
  const rawSubj = raw.subjectBySquare ?? {}
  for (const key of Object.keys(rawSubj)) {
    subjectBySquare[Number(key)] = rawSubj[key]
  }
  return { size: raw.size, questionSquares, subjectBySquare, tileTypeBySquare }
}

export class SocketGameClient implements GameClient {
  private readonly emitter = new TypedEmitter()
  private readonly socket: Socket
  private myPlayerId: string | null = null
  private session: SessionState | null = null

  constructor(url: string) {
    // URL vazia → conecta no MESMO domínio (produção atrás do Nginx).
    const target = url && url.length > 0 ? url : undefined
    this.socket = io(target, { autoConnect: true })
    this.registerHandlers()
  }

  /* ------------------------------------------------------------------ */
  /* Assinatura de eventos                                              */
  /* ------------------------------------------------------------------ */

  on<K extends GameEventName>(event: K, handler: GameEventHandler<K>): void {
    this.emitter.on(event, handler)
  }

  off<K extends GameEventName>(event: K, handler: GameEventHandler<K>): void {
    this.emitter.off(event, handler)
  }

  /* ------------------------------------------------------------------ */
  /* Comandos (client → server)                                         */
  /* ------------------------------------------------------------------ */

  createSession(input: CreateSessionInput): void {
    this.socket.emit('createSession', input, (ack: Ack) =>
      this.onIdentity(ack, input.difficulty),
    )
  }

  joinSession(input: JoinSessionInput): void {
    this.socket.emit('joinSession', input, (ack: Ack) =>
      this.onIdentity(ack, 'normal'),
    )
  }

  startGame(): void {
    this.socket.emit('startGame')
  }

  rollForOrder(): void {
    // No-op no backend (ordem resolvida no startGame); mantido por contrato.
    this.socket.emit('rollForOrder')
  }

  rollDice(): void {
    this.socket.emit('rollDice')
  }

  submitAnswer(input: SubmitAnswerInput): void {
    this.socket.emit('submitAnswer', input)
  }

  leaveSession(): void {
    this.socket.emit('leaveSession')
  }

  reconnect(input: ReconnectInput): void {
    this.socket.emit('reconnect', input)
  }

  dispose(): void {
    this.socket.removeAllListeners()
    this.socket.disconnect()
    this.emitter.clear()
    this.session = null
    this.myPlayerId = null
  }

  /* ------------------------------------------------------------------ */
  /* Tradução servidor → eventos internos                               */
  /* ------------------------------------------------------------------ */

  private registerHandlers(): void {
    const s = this.socket

    s.on('connect_error', (err: Error) => {
      this.emitter.emit('error', {
        code: 'CONNECT_ERROR',
        message: `Não foi possível conectar ao servidor: ${err.message}`,
      })
    })

    s.on('lobbyState', (raw: RawLobbyState) => {
      this.applyLobby(raw)
      this.emitter.emit('lobbyState', { session: this.snapshot() })
    })

    s.on('gameStarted', (raw: { board: RawBoard }) => {
      if (this.session) {
        this.session.board = buildBoard(raw.board)
        this.session.status = 'playing'
      }
      this.emitter.emit('gameStarted', {
        board: this.session ? this.session.board : buildBoard(raw.board),
        session: this.snapshot(),
      })
    })

    s.on(
      'orderResult',
      (raw: {
        rolls: { playerId: string; value: number }[]
        turnOrder: string[]
      }) => {
        if (this.session) {
          this.session.turnOrder = raw.turnOrder
          this.session.currentTurnIndex = 0
        }
        this.emitter.emit('orderResult', {
          rolls: raw.rolls,
          tiedPlayerIds: [],
          turnOrder: raw.turnOrder,
        })
      },
    )

    s.on('turnChanged', (raw: { playerId: string }) => {
      if (this.session) {
        const idx = this.session.turnOrder.indexOf(raw.playerId)
        if (idx >= 0) this.session.currentTurnIndex = idx
      }
      this.emitter.emit('turnChanged', {
        playerId: raw.playerId,
        session: this.snapshot(),
      })
    })

    s.on('diceResult', (raw: RawDiceResult) => {
      this.setSquare(raw.playerId, raw.toSquare)
      this.emitter.emit('diceResult', raw)
    })

    s.on('questionPrompt', (raw: RawQuestionPrompt) => {
      this.emitter.emit('questionPrompt', {
        questionId: raw.questionId,
        subject: this.subjectForLocalPlayer(),
        statement: raw.statement,
        options: raw.options,
      })
    })

    s.on('answerResult', (raw: RawAnswerResult) => {
      this.setSquare(raw.playerId, raw.toSquare)
      const errorType: AnswerErrorType | null =
        raw.errorType === 'none' ? null : raw.errorType
      // Repassa o breakdown de acerto (§4) APENAS quando o backend o envia
      // (CONTRACT-S3, aditivo). Sem os campos, ficam `undefined` e a UI cai no
      // fallback (mostra só `movement`). NÃO inventamos valores aqui.
      this.emitter.emit('answerResult', {
        playerId: raw.playerId,
        correct: raw.correct,
        errorType,
        movement: raw.movement,
        fromSquare: raw.fromSquare,
        toSquare: raw.toSquare,
        tier: raw.tier,
        baseAdvance: raw.baseAdvance,
        tierBonus: raw.tierBonus,
        nudged: raw.nudged,
      })
    })

    s.on('turnSkipped', (raw: { playerId: string; remaining: number }) => {
      this.emitter.emit('turnSkipped', {
        playerId: raw.playerId,
        remaining: raw.remaining,
        session: this.snapshot(),
      })
    })

    s.on('gameOver', (raw: { winner: string; ranking: RankingEntry[] }) => {
      const winner =
        raw.ranking.find((r) => r.playerId === raw.winner) ?? raw.ranking[0]
      this.emitter.emit('gameOver', { winner, ranking: raw.ranking })
    })

    s.on('playerDisconnected', (raw: { playerId: string }) => {
      this.setConnected(raw.playerId, false)
      this.emitter.emit('playerDisconnected', {
        playerId: raw.playerId,
        session: this.snapshot(),
      })
    })

    s.on('playerReconnected', (raw: { playerId: string }) => {
      this.setConnected(raw.playerId, true)
      this.emitter.emit('playerReconnected', {
        playerId: raw.playerId,
        session: this.snapshot(),
      })
    })

    s.on('sessionClosed', (raw: { reason: string }) => {
      this.emitter.emit('sessionClosed', raw)
    })

    s.on('error', (raw: { code: string; message: string }) => {
      this.emitter.emit('error', raw)
    })
    // 'sessionCreated'/'playerJoined' do servidor são ignorados: usamos o ACK
    // (identidade) e o 'lobbyState' (lista de jogadores).
  }

  /* ------------------------------------------------------------------ */
  /* Estado local                                                       */
  /* ------------------------------------------------------------------ */

  private onIdentity(ack: Ack, difficulty: Difficulty): void {
    this.myPlayerId = ack.playerId
    if (!this.session) {
      this.session = this.blankSession(ack.code, difficulty)
    } else {
      this.session.code = ack.code
    }
    this.emitter.emit('sessionCreated', {
      code: ack.code,
      playerId: ack.playerId,
      session: this.snapshot(),
    })
  }

  private applyLobby(raw: RawLobbyState): void {
    if (!this.session) this.session = this.blankSession(raw.code, 'normal')
    this.session.code = raw.code
    this.session.status = raw.status as SessionStatus
    const previous = new Map(this.session.players.map((p) => [p.id, p]))
    this.session.players = raw.players.map((pv) => {
      const ex = previous.get(pv.id)
      return {
        id: pv.id,
        name: pv.name,
        connected: pv.connected,
        isHost: pv.isHost,
        square: ex?.square ?? 0,
        skipTurns: ex?.skipTurns ?? 0,
        usedQuestionIds: ex?.usedQuestionIds ?? [],
      }
    })
  }

  private blankSession(code: string, difficulty: Difficulty): SessionState {
    const now = Date.now()
    return {
      code,
      status: 'lobby',
      difficulty,
      board: {
        size: 0,
        questionSquares: [],
        subjectBySquare: {},
        tileTypeBySquare: {},
      },
      players: [],
      turnOrder: [],
      currentTurnIndex: 0,
      winner: null,
      createdAt: now,
      lastActivityAt: now,
    }
  }

  private setSquare(playerId: string, square: number): void {
    const p = this.session?.players.find((x) => x.id === playerId)
    if (p) p.square = square
  }

  private setConnected(playerId: string, value: boolean): void {
    const p = this.session?.players.find((x) => x.id === playerId)
    if (p) p.connected = value
  }

  private subjectForLocalPlayer(): Subject {
    const me = this.session?.players.find((p) => p.id === this.myPlayerId)
    const square = me?.square ?? 0
    return this.session?.board.subjectBySquare[square] ?? 'matematica'
  }

  private snapshot(): SessionState {
    const s = this.session
    if (!s) return this.blankSession('', 'normal')
    return {
      ...s,
      board: { ...s.board },
      players: s.players.map((p: Player) => ({ ...p })),
      turnOrder: [...s.turnOrder],
    }
  }
}
