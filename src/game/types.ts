/**
 * Tipos de domínio do jogo. Espelham §6 (modelo de dados) e §7 (contrato de
 * eventos WebSocket) da SPEC. Mantidos em inglês (convenção da SPEC).
 *
 * Estes tipos são a fonte única da verdade: tanto o `MockGameClient` (hoje)
 * quanto o futuro `SocketGameClient` produzem/consomem exatamente estas formas.
 */

export type Difficulty = 'easy' | 'normal' | 'hard'

export type SessionStatus = 'lobby' | 'playing' | 'finished'

/** 10 matérias escolares (RF-09). */
export type Subject =
  | 'matematica'
  | 'portugues'
  | 'historia'
  | 'geografia'
  | 'ciencias'
  | 'biologia'
  | 'fisica'
  | 'quimica'
  | 'ingles'
  | 'artes'

/** Tipo de casa. `prison` e `question` chegam nas Sprints 2/3. */
export type TileType = 'normal' | 'question' | 'prison'

/** Classificação de erro de resposta (Sprint 2). `null` em acerto. */
export type AnswerErrorType = 'proximal' | 'wrong'

/**
 * Descritor do tabuleiro. Índices de casa vão de 0 a `size` (inclusive):
 * casa 0 = INÍCIO, casa `size` = CHEGADA. Total de casas = `size + 1` (RF-06).
 *
 * `subjectBySquare` / `tileTypeBySquare` usam chave numérica; ao serializar em
 * JSON as chaves viram string — sempre normalizar com Number() ao ler.
 */
export interface BoardDescriptor {
  size: number
  questionSquares: number[]
  subjectBySquare: Record<number, Subject>
  tileTypeBySquare: Record<number, TileType>
}

/** Estado de um jogador (§6 + emenda Presídio: `skipTurns`). */
export interface Player {
  id: string
  name: string
  square: number
  connected: boolean
  usedQuestionIds: string[]
  skipTurns: number
  isHost: boolean
}

/** Pergunta do banco (§6). `correct` NUNCA é enviado ao client (RF-16). */
export interface Question {
  id: string
  subject: Subject
  statement: string
  correct: string
  proximal: string
  wrong: [string, string]
}

/** Estado completo da sessão (§6). É o que o servidor é autoritativo sobre. */
export interface SessionState {
  code: string
  status: SessionStatus
  difficulty: Difficulty
  board: BoardDescriptor
  players: Player[]
  turnOrder: string[]
  currentTurnIndex: number
  winner: string | null
  createdAt: number
  lastActivityAt: number
}

/** Entrada do ranking final (RF-12). */
export interface RankingEntry {
  playerId: string
  name: string
  square: number
  position: number
}

/* ------------------------------------------------------------------ */
/* Contrato de eventos WebSocket (§7)                                  */
/* ------------------------------------------------------------------ */

/** Comandos client → server. */
export interface CreateSessionInput {
  name: string
  difficulty: Difficulty
}
export interface JoinSessionInput {
  code: string
  name: string
}
export interface SubmitAnswerInput {
  questionId: string
  optionIndex: number
}
export interface ReconnectInput {
  code: string
  playerId: string
}

/** Payloads server → client. */
export interface SessionCreatedEvent {
  code: string
  playerId: string
  session: SessionState
}
export interface LobbyStateEvent {
  session: SessionState
}
export interface PlayerJoinedEvent {
  player: Player
  session: SessionState
}
export interface GameStartedEvent {
  board: BoardDescriptor
  session: SessionState
}
export interface OrderRollEntry {
  playerId: string
  value: number
}
export interface OrderResultEvent {
  rolls: OrderRollEntry[]
  /** Jogadores ainda empatados que precisam re-rolar (RF-04). */
  tiedPlayerIds: string[]
  /** Definido quando a ordem foi resolvida. */
  turnOrder: string[] | null
}
export interface TurnChangedEvent {
  playerId: string
  session: SessionState
}
export interface DiceResultEvent {
  playerId: string
  value: number
  fromSquare: number
  toSquare: number
}
export interface QuestionPromptEvent {
  questionId: string
  subject: Subject
  statement: string
  /** Alternativas já embaralhadas; a correta nunca é identificada (RF-16). */
  options: string[]
}
export interface AnswerResultEvent {
  playerId: string
  correct: boolean
  errorType: AnswerErrorType | null
  /** Casas movidas (positivo = avanço, negativo = recuo). */
  movement: number
  fromSquare: number
  toSquare: number
  /** Índice da alternativa correta, revelado só após a submissão. */
  correctIndex: number
}
export interface GameOverEvent {
  winner: RankingEntry
  ranking: RankingEntry[]
}
export interface PlayerConnectionEvent {
  playerId: string
  session: SessionState
}
export interface TurnSkippedEvent {
  playerId: string
  remaining: number
  session: SessionState
}
export interface SessionClosedEvent {
  reason: string
}
export interface GameErrorEvent {
  code: string
  message: string
}

/**
 * Mapa de eventos server → client. Chave = nome do evento (§7),
 * valor = tipo do payload. Usado para tipar `on`/`off` do GameClient.
 */
export interface GameEventMap {
  sessionCreated: SessionCreatedEvent
  playerJoined: PlayerJoinedEvent
  lobbyState: LobbyStateEvent
  gameStarted: GameStartedEvent
  orderResult: OrderResultEvent
  turnChanged: TurnChangedEvent
  diceResult: DiceResultEvent
  questionPrompt: QuestionPromptEvent
  answerResult: AnswerResultEvent
  gameOver: GameOverEvent
  playerDisconnected: PlayerConnectionEvent
  playerReconnected: PlayerConnectionEvent
  turnSkipped: TurnSkippedEvent
  sessionClosed: SessionClosedEvent
  error: GameErrorEvent
}

export type GameEventName = keyof GameEventMap
export type GameEventHandler<K extends GameEventName> = (
  payload: GameEventMap[K],
) => void
