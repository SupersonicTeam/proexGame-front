import type {
  AnswerErrorType,
  CreateSessionInput,
  GameEventHandler,
  GameEventName,
  JoinSessionInput,
  Player,
  RankingEntry,
  ReconnectInput,
  SessionState,
  Subject,
  SubmitAnswerInput,
  TileType,
} from '../types'
import type { GameClient } from './GameClient'
import { TypedEmitter } from './emitter'
import {
  advanceForCorrect,
  applyAdvance,
  applyDiceMove,
  applyRetreat,
  buildOptions,
  generateBoard,
  generateSessionCode,
  retreatForError,
  rollD6,
  rollForOrder,
  selectQuestion,
} from '../engine'
import { allQuestions } from '../../data/questions'
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  createPlayer,
  createSimulatedPlayers,
} from '../../data/mockSessions'

/** Probabilidade de um bot acertar a pergunta. */
const BOT_CORRECT_PROB = 0.6
/** Atraso após uma resposta (mostra o feedback antes de prosseguir). */
const ANSWER_RESOLVE_DELAY_MS = 1500
/** Atraso ao pular o turno de quem está preso (mostra o aviso). */
const SKIP_DELAY_MS = 1500

/** Pergunta pendente aguardando resposta. */
interface PendingQuestion {
  playerId: string
  questionId: string
  subject: Subject
  correctIndex: number
  proximalIndex: number
}

/** Fases internas do loop simulado. */
type Phase = 'lobby' | 'order' | 'playing' | 'finished'

export interface MockGameClientOptions {
  /**
   * Quantidade de bots adicionados automaticamente ao criar a sessão
   * (modo hot-seat). Default 2 → 3 jogadores (host + 2 bots), permitindo
   * iniciar a partida numa única máquina (mín. 2 — RF-02). Use 0 para não
   * adicionar bots (ex.: ao testar o fluxo de join manual).
   */
  botCount?: number
  /** Atraso (ms) antes de um bot agir automaticamente. Default 700. */
  botDelayMs?: number
  /** RNG injetável (testes). Default Math.random. */
  rng?: () => number
}

/**
 * Implementação local (sem backend) do `GameClient`. Mantém um `SessionState`
 * em memória e dirige TODO o loop da Sprint 1: lobby → ordem → turnos → d6 →
 * movimento → vitória por alcançar/ultrapassar a chegada.
 *
 * Modo HOT-SEAT: o humano é o host; os demais assentos são bots simulados que
 * rolam o dado sozinhos no próprio turno (e re-rolam sozinhos na fase de
 * ordem). Os atrasos dos bots usam `setTimeout` e são cancelados em `dispose`.
 *
 * RF-16: nenhum payload emitido carrega dado de resposta (não há perguntas na
 * Sprint 1, de qualquer forma).
 */
export class MockGameClient implements GameClient {
  private readonly emitter = new TypedEmitter()
  private readonly rng: () => number
  private readonly botCount: number
  private readonly botDelayMs: number

  private session: SessionState | null = null
  private myPlayerId: string | null = null
  private botIds = new Set<string>()
  private phase: Phase = 'lobby'
  private timers = new Set<ReturnType<typeof setTimeout>>()
  /** Perguntas já usadas na sessão (RF-09: sem repetição). */
  private usedQuestionIds = new Set<string>()
  private pendingQuestion: PendingQuestion | null = null

  constructor(options: MockGameClientOptions = {}) {
    this.rng = options.rng ?? Math.random
    this.botCount = options.botCount ?? 2
    // Ritmo dos bots alinhado à animação de arremesso do dado (overlay ~1s +
    // movimento do peão), para a fila de playback não acumular.
    this.botDelayMs = options.botDelayMs ?? 2000
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
  /* Comandos                                                           */
  /* ------------------------------------------------------------------ */

  createSession(input: CreateSessionInput): void {
    const code = generateSessionCode(new Set(), this.rng)
    const board = generateBoard(input.difficulty, this.rng)
    const { players, botIds } = createSimulatedPlayers(
      input.name,
      this.botCount,
      this.rng,
    )

    const now = Date.now()
    this.session = {
      code,
      status: 'lobby',
      difficulty: input.difficulty,
      board,
      players,
      turnOrder: [],
      currentTurnIndex: 0,
      winner: null,
      createdAt: now,
      lastActivityAt: now,
    }
    this.myPlayerId = players[0].id
    this.botIds = botIds
    this.phase = 'lobby'
    this.usedQuestionIds = new Set()
    this.pendingQuestion = null

    this.emitter.emit('sessionCreated', {
      code,
      playerId: this.myPlayerId,
      session: this.snapshot(),
    })
    // Cada bot pré-preenchido é anunciado como um jogador que entrou.
    for (const player of players.slice(1)) {
      this.emitter.emit('playerJoined', {
        player: { ...player },
        session: this.snapshot(),
      })
    }
    this.emitLobby()
  }

  joinSession(input: JoinSessionInput): void {
    if (!this.session) {
      this.fail('NO_SESSION', 'Nenhuma sessão ativa para entrar.')
      return
    }
    if (this.session.players.length >= MAX_PLAYERS) {
      this.fail('SESSION_FULL', 'A sessão já está cheia (máx. 4 jogadores).')
      return
    }
    const player = createPlayer(input.name)
    this.session.players.push(player)
    this.touch()

    this.emitter.emit('playerJoined', {
      player: { ...player },
      session: this.snapshot(),
    })
    this.emitLobby()
  }

  startGame(): void {
    if (!this.session) {
      this.fail('NO_SESSION', 'Nenhuma sessão ativa.')
      return
    }
    if (this.session.players.length < MIN_PLAYERS) {
      this.fail('NOT_ENOUGH_PLAYERS', 'São necessários ao menos 2 jogadores.')
      return
    }
    this.session.status = 'playing'
    this.phase = 'order'
    this.touch()

    this.emitter.emit('gameStarted', {
      board: this.session.board,
      session: this.snapshot(),
    })
  }

  rollForOrder(): void {
    if (!this.session || this.phase !== 'order') {
      this.fail('BAD_PHASE', 'Rolagem de ordem fora de fase.')
      return
    }
    this.resolveOrderRound(this.session.players.map((p) => p.id))
  }

  rollDice(): void {
    if (!this.session || this.phase !== 'playing') {
      this.fail('BAD_PHASE', 'Rolagem fora da fase de jogo.')
      return
    }
    const current = this.currentPlayer()
    if (!current) return
    this.doRoll(current.id)
  }

  submitAnswer(input: SubmitAnswerInput): void {
    const pq = this.pendingQuestion
    // Só o jogador local submete pelo client; valida a pergunta pendente.
    if (!pq || pq.questionId !== input.questionId) return
    if (pq.playerId !== this.myPlayerId) return
    this.resolveAnswer(input.optionIndex)
  }

  leaveSession(): void {
    if (!this.session || !this.myPlayerId) return
    const me = this.session.players.find((p) => p.id === this.myPlayerId)
    if (!me) return
    me.connected = false
    this.touch()
    this.emitter.emit('playerDisconnected', {
      playerId: me.id,
      session: this.snapshot(),
    })
  }

  reconnect(input: ReconnectInput): void {
    if (!this.session || this.session.code !== input.code) {
      this.fail('NO_SESSION', 'Sessão não encontrada para reconexão.')
      return
    }
    const me = this.session.players.find((p) => p.id === input.playerId)
    if (me) {
      me.connected = true
      this.myPlayerId = me.id
      this.touch()
      this.emitter.emit('playerReconnected', {
        playerId: me.id,
        session: this.snapshot(),
      })
    }
    // Reenvia o estado atual conforme a fase para a UI se ressincronizar.
    if (this.phase === 'lobby') {
      this.emitLobby()
    } else {
      const player = this.currentPlayer()
      if (player) {
        this.emitter.emit('turnChanged', {
          playerId: player.id,
          session: this.snapshot(),
        })
      }
    }
  }

  dispose(): void {
    for (const timer of this.timers) clearTimeout(timer)
    this.timers.clear()
    this.emitter.clear()
    this.session = null
    this.myPlayerId = null
    this.botIds.clear()
    this.pendingQuestion = null
    this.usedQuestionIds.clear()
  }

  /* ------------------------------------------------------------------ */
  /* Loop interno                                                       */
  /* ------------------------------------------------------------------ */

  /** Resolve uma rodada de ordem entre `contenders`, automatizando bots. */
  private resolveOrderRound(contenders: string[]): void {
    if (!this.session) return
    const result = rollForOrder(contenders, this.rng)

    this.emitter.emit('orderResult', {
      rolls: result.rolls,
      tiedPlayerIds: result.tiedPlayerIds,
      turnOrder: result.turnOrder,
    })

    if (result.turnOrder) {
      this.session.turnOrder = result.turnOrder
      this.session.currentTurnIndex = 0
      this.phase = 'playing'
      this.touch()
      this.announceTurn()
      return
    }

    // Empate no topo: re-rola automaticamente apenas entre os empatados.
    this.schedule(() => this.resolveOrderRound(result.tiedPlayerIds))
  }

  /** Executa a rolagem de dado e o movimento de `playerId`. */
  private doRoll(playerId: string): void {
    if (!this.session) return
    const player = this.session.players.find((p) => p.id === playerId)
    if (!player) return

    const value = rollD6(this.rng)
    const fromSquare = player.square
    const { toSquare, won } = applyDiceMove(
      fromSquare,
      value,
      this.session.board.size,
    )
    player.square = toSquare

    this.emitter.emit('diceResult', {
      playerId,
      value,
      fromSquare,
      toSquare,
    })
    this.touch()

    if (won) {
      this.finish(player)
      return
    }

    const type = this.tileType(toSquare)
    if (type === 'prison') {
      // Presídio dispara SÓ por dado (RF-19): perde a próxima jogada (RF-20).
      player.skipTurns += 1
      this.touch()
      this.advanceTurn()
      return
    }
    if (type === 'question') {
      // Pergunta dispara ao aterrissar via dado (RF-08).
      this.triggerQuestion(player)
      return
    }
    this.advanceTurn()
  }

  /** Tipo da casa (normaliza ausências como 'normal'). */
  private tileType(square: number): TileType {
    const b = this.session!.board
    return (
      b.tileTypeBySquare[square] ??
      (b.questionSquares.includes(square) ? 'question' : 'normal')
    )
  }

  /**
   * Dispara uma pergunta para `player`. Para o jogador local, emite
   * `questionPrompt` (sem a resposta correta — RF-16) e aguarda `submitAnswer`.
   * Para bots, agenda a resposta automática.
   */
  private triggerQuestion(player: Player): void {
    if (!this.session) return
    const subject = this.session.board.subjectBySquare[player.square]
    if (!subject) {
      this.advanceTurn()
      return
    }
    const q = selectQuestion(
      subject,
      allQuestions,
      this.usedQuestionIds,
      this.rng,
    )
    if (!q) {
      // Banco da matéria esgotado na sessão: trata a casa como normal.
      this.advanceTurn()
      return
    }
    this.usedQuestionIds.add(q.id)
    const { options, correctIndex, proximalIndex } = buildOptions(q, this.rng)
    this.pendingQuestion = {
      playerId: player.id,
      questionId: q.id,
      subject,
      correctIndex,
      proximalIndex,
    }

    if (player.id === this.myPlayerId) {
      this.emitter.emit('questionPrompt', {
        questionId: q.id,
        subject,
        statement: q.statement,
        options,
      })
    } else {
      this.scheduleAfter(this.botDelayMs, () => this.botAnswer())
    }
  }

  /** Bot decide a resposta (probabilístico) e resolve. */
  private botAnswer(): void {
    const pq = this.pendingQuestion
    if (!pq) return
    let optionIndex: number
    if (this.rng() < BOT_CORRECT_PROB) {
      optionIndex = pq.correctIndex
    } else {
      const wrong = [0, 1, 2, 3].filter((i) => i !== pq.correctIndex)
      optionIndex = wrong[Math.floor(this.rng() * wrong.length)]
    }
    this.resolveAnswer(optionIndex)
  }

  /**
   * Resolve a resposta: calcula movimento (§4 base), emite `answerResult`
   * (revelando a correta só agora) e, após o feedback, encadeia (acerto em
   * casa-pergunta — RF-11) ou passa a vez. Recuo nunca dispara pergunta (RF-08).
   */
  private resolveAnswer(optionIndex: number): void {
    if (!this.session) return
    const pq = this.pendingQuestion
    if (!pq) return
    this.pendingQuestion = null
    const player = this.session.players.find((p) => p.id === pq.playerId)
    if (!player) return

    const correct = optionIndex === pq.correctIndex
    const fromSquare = player.square
    let toSquare: number
    let won = false
    let errorType: AnswerErrorType | null = null

    if (correct) {
      const amount = advanceForCorrect(this.session.difficulty)
      const r = applyAdvance(fromSquare, amount, this.session.board.size)
      toSquare = r.toSquare
      won = r.won
    } else {
      errorType = optionIndex === pq.proximalIndex ? 'proximal' : 'wrong'
      const amount = retreatForError(errorType, this.session.difficulty)
      toSquare = applyRetreat(fromSquare, amount).toSquare
    }
    player.square = toSquare
    this.touch()

    this.emitter.emit('answerResult', {
      playerId: player.id,
      correct,
      errorType,
      movement: toSquare - fromSquare,
      fromSquare,
      toSquare,
      correctIndex: pq.correctIndex,
    })

    if (won) {
      this.scheduleAfter(ANSWER_RESOLVE_DELAY_MS, () => {
        const p = this.session?.players.find((x) => x.id === player.id)
        if (p) this.finish(p)
      })
      return
    }

    this.scheduleAfter(ANSWER_RESOLVE_DELAY_MS, () => {
      if (!this.session) return
      if (correct && this.tileType(player.square) === 'question') {
        this.triggerQuestion(player)
      } else {
        this.advanceTurn()
      }
    })
  }

  /** Avança para o próximo turno e anuncia (automatiza bot se for o caso). */
  private advanceTurn(): void {
    if (!this.session) return
    this.session.currentTurnIndex =
      (this.session.currentTurnIndex + 1) % this.session.turnOrder.length
    this.touch()
    this.announceTurn()
  }

  /** Emite `turnChanged`, trata presídio (perde a vez) e automatiza bots. */
  private announceTurn(): void {
    const player = this.currentPlayer()
    if (!player || !this.session) return

    // Preso: perde a vez (RF-20). Decrementa, avisa e passa sem rolar.
    if (player.skipTurns > 0) {
      player.skipTurns -= 1
      this.touch()
      this.emitter.emit('turnChanged', {
        playerId: player.id,
        session: this.snapshot(),
      })
      this.emitter.emit('turnSkipped', {
        playerId: player.id,
        remaining: player.skipTurns,
        session: this.snapshot(),
      })
      this.scheduleAfter(SKIP_DELAY_MS, () => this.advanceTurn())
      return
    }

    this.emitter.emit('turnChanged', {
      playerId: player.id,
      session: this.snapshot(),
    })
    if (this.botIds.has(player.id)) {
      this.schedule(() => this.doRoll(player.id))
    }
  }

  /** Encerra a partida e emite o ranking final (RF-12). */
  private finish(winner: Player): void {
    if (!this.session) return
    this.session.status = 'finished'
    this.session.winner = winner.id
    this.phase = 'finished'
    this.touch()

    const ranking = this.buildRanking()
    const winnerEntry =
      ranking.find((r) => r.playerId === winner.id) ?? ranking[0]
    this.emitter.emit('gameOver', { winner: winnerEntry, ranking })
  }

  /** Ranking por casa desc; empate desfeito pela ordem de turnos. */
  private buildRanking(): RankingEntry[] {
    if (!this.session) return []
    const orderIndex = new Map(this.session.turnOrder.map((id, i) => [id, i]))
    return [...this.session.players]
      .sort(
        (a, b) =>
          b.square - a.square ||
          (orderIndex.get(a.id) ?? Infinity) -
            (orderIndex.get(b.id) ?? Infinity),
      )
      .map((p, i) => ({
        playerId: p.id,
        name: p.name,
        square: p.square,
        position: i + 1,
      }))
  }

  /* ------------------------------------------------------------------ */
  /* Utilitários                                                        */
  /* ------------------------------------------------------------------ */

  private currentPlayer(): Player | undefined {
    if (!this.session) return undefined
    const id = this.session.turnOrder[this.session.currentTurnIndex]
    return this.session.players.find((p) => p.id === id)
  }

  /** Cópia defensiva do estado para emissão (evita mutação externa). */
  private snapshot(): SessionState {
    const s = this.session!
    return {
      ...s,
      board: { ...s.board },
      players: s.players.map((p) => ({ ...p })),
      turnOrder: [...s.turnOrder],
    }
  }

  private emitLobby(): void {
    if (!this.session) return
    this.emitter.emit('lobbyState', { session: this.snapshot() })
  }

  private fail(code: string, message: string): void {
    this.emitter.emit('error', { code, message })
  }

  private touch(): void {
    if (this.session) this.session.lastActivityAt = Date.now()
  }

  /** Agenda uma ação cancelável no ritmo padrão dos bots. */
  private schedule(fn: () => void): void {
    this.scheduleAfter(this.botDelayMs, fn)
  }

  /** Agenda uma ação cancelável após `ms` (limpa em `dispose`). */
  private scheduleAfter(ms: number, fn: () => void): void {
    const timer = setTimeout(() => {
      this.timers.delete(timer)
      fn()
    }, ms)
    this.timers.add(timer)
  }
}
