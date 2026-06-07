import type { AnswerErrorType, Difficulty } from '../types'

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

/** Casas avançadas ao acertar (valores-base da §4, sem tiers/nudge). */
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

/** Número de casas a avançar ao acertar (§4). */
export function advanceForCorrect(difficulty: Difficulty): number {
  return ADVANCE_FOR_CORRECT[difficulty]
}

/** Número de casas a recuar ao errar, conforme o tipo de erro (§4). */
export function retreatForError(
  errorType: AnswerErrorType,
  difficulty: Difficulty,
): number {
  return RETREAT_FOR_ERROR[errorType][difficulty]
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
 * Recuo nunca vence.
 */
export function applyRetreat(
  fromSquare: number,
  amount: number,
): { toSquare: number } {
  const target = fromSquare - amount
  return { toSquare: target < 1 ? 1 : target }
}
