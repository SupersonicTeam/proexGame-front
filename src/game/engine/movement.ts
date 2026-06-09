import type { AnswerErrorType, BoardDescriptor, Difficulty, Tier } from '../types'
import { tierBonus } from './tiers'

/** Probabilidade de o nudge anti-encadeamento disparar (§4 passo 2). */
const NUDGE_PROBABILITY = 0.7

/**
 * Movimentação simples por dado (RF-06).
 *
 * Avança `dice` casas a partir de `fromSquare`. Se alcançar OU ultrapassar a
 * casa final (`boardSize`, a CHEGADA), o jogador vence e `toSquare` é fixado em
 * `boardSize` (reach-or-pass — RF-06).
 */
export function applyDiceMove(
  fromSquare: number,
  dice: number,
  boardSize: number,
): { toSquare: number; won: boolean } {
  const target = fromSquare + dice
  if (target >= boardSize) {
    return { toSquare: boardSize, won: true }
  }
  return { toSquare: target, won: false }
}

/** Avanço-base por acerto (C_d da §4, sem tier). */
const ADVANCE_FOR_CORRECT: Record<Difficulty, number> = {
  easy: 3,
  normal: 2,
  hard: 1,
}

/** Casas recuadas ao errar, por tipo de erro (valores-base da §4). */
const RETREAT_FOR_ERROR: Record<AnswerErrorType, Record<Difficulty, number>> = {
  proximal: { easy: 1, normal: 2, hard: 3 },
  wrong: { easy: 2, normal: 3, hard: 4 },
}

/**
 * Número de casas a avançar ao acertar (§4): `amount = C_d + T_p`.
 *
 * - `baseAdvance` = C_d (por dificuldade);
 * - `tierBonus` = T_p (por tier, via {@link tierBonus});
 * - `amount` = soma dos dois (catch-up: último avança mais).
 */
export function advanceForCorrect(
  difficulty: Difficulty,
  tier: Tier,
): { amount: number; baseAdvance: number; tierBonus: number } {
  const baseAdvance = ADVANCE_FOR_CORRECT[difficulty]
  const bonus = tierBonus(tier)
  return { amount: baseAdvance + bonus, baseAdvance, tierBonus: bonus }
}

/** Número de casas a recuar ao errar, conforme o tipo de erro (§4). */
export function retreatForError(
  errorType: AnswerErrorType,
  difficulty: Difficulty,
): number {
  return RETREAT_FOR_ERROR[errorType][difficulty]
}

/** Indica se `square` é uma casa-pergunta no tabuleiro. */
export function isQuestionSquare(
  board: BoardDescriptor,
  square: number,
): boolean {
  return (
    board.tileTypeBySquare[square] === 'question' ||
    board.questionSquares.includes(square)
  )
}

/**
 * Aplica avanço por acerto (RF-08). Reach-or-pass: alcançar/ultrapassar
 * `boardSize` vence e fixa em `boardSize`.
 */
export function applyAdvance(
  fromSquare: number,
  amount: number,
  boardSize: number,
): { toSquare: number; won: boolean } {
  const target = fromSquare + amount
  if (target >= boardSize) {
    return { toSquare: boardSize, won: true }
  }
  return { toSquare: target, won: false }
}

/**
 * Aplica recuo por erro (RF-10). Clampa o mínimo em 1 — nunca abaixo da casa 1.
 * Recuo nunca vence (e nunca usa tier nem nudge).
 */
export function applyRetreat(
  fromSquare: number,
  amount: number,
): { toSquare: number } {
  const target = fromSquare - amount
  return { toSquare: target < 1 ? 1 : target }
}

/**
 * Nudge anti-encadeamento (§4 passo 2 / S3-F04).
 *
 * Só age quando `targetSquare` é casa-pergunta E `rng() < 0.7`. Nesse caso
 * procura a casa não-pergunta mais próxima dentro de ±1, preferindo `+1`:
 * - candidato `+1`: se `targetSquare+1 <= size` e não for casa-pergunta → usa-o;
 * - senão candidato `−1`: se `targetSquare-1 >= 1` e não for casa-pergunta → usa-o;
 * - senão permanece em `targetSquare`.
 *
 * Retorna `nudged: true` apenas quando a casa efetivamente mudou.
 */
export function applyNudge(
  targetSquare: number,
  board: BoardDescriptor,
  rng: () => number,
): { square: number; nudged: boolean } {
  // Só atua em casa-pergunta e com a probabilidade definida.
  if (!isQuestionSquare(board, targetSquare) || rng() >= NUDGE_PROBABILITY) {
    return { square: targetSquare, nudged: false }
  }

  const up = targetSquare + 1
  if (up <= board.size && !isQuestionSquare(board, up)) {
    return { square: up, nudged: true }
  }

  const down = targetSquare - 1
  if (down >= 1 && !isQuestionSquare(board, down)) {
    return { square: down, nudged: true }
  }

  // Nenhum vizinho viável: permanece (encadeia normalmente).
  return { square: targetSquare, nudged: false }
}

/**
 * Pipeline de acerto (§4 / S3-F05): advance → nudge → clamp/vitória.
 *
 * 1. `amount = C_d + T_p` ({@link advanceForCorrect}); `target = fromSquare + amount`;
 * 2. se `target < size` (ainda não é vitória), aplica {@link applyNudge};
 * 3. clamp: se `target >= size` → vence e fixa em `size`; senão `toSquare = max(1, target)`.
 *
 * Devolve também `baseAdvance`/`tierBonus` (para o breakdown) e `nudged`.
 */
export function applyCorrectMovement(args: {
  fromSquare: number
  difficulty: Difficulty
  tier: Tier
  board: BoardDescriptor
  rng: () => number
}): {
  toSquare: number
  won: boolean
  baseAdvance: number
  tierBonus: number
  nudged: boolean
} {
  const { fromSquare, difficulty, tier, board, rng } = args
  const { amount, baseAdvance, tierBonus: bonus } = advanceForCorrect(
    difficulty,
    tier,
  )

  let target = fromSquare + amount
  let nudged = false

  // Nudge só quando ainda não é vitória (não nudgeia uma chegada).
  if (target < board.size) {
    const r = applyNudge(target, board, rng)
    target = r.square
    nudged = r.nudged
  }

  if (target >= board.size) {
    return {
      toSquare: board.size,
      won: true,
      baseAdvance,
      tierBonus: bonus,
      nudged,
    }
  }

  return {
    toSquare: target < 1 ? 1 : target,
    won: false,
    baseAdvance,
    tierBonus: bonus,
    nudged,
  }
}
