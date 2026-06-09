import { describe, expect, it } from 'vitest'
import type { BoardDescriptor } from '../types'
import {
  advanceForCorrect,
  applyAdvance,
  applyCorrectMovement,
  applyDiceMove,
  applyNudge,
  applyRetreat,
  isQuestionSquare,
  retreatForError,
} from './movement'

/** Tabuleiro mínimo de teste com casas-pergunta explícitas. */
function makeBoard(size: number, questionSquares: number[]): BoardDescriptor {
  const tileTypeBySquare: BoardDescriptor['tileTypeBySquare'] = {}
  for (const sq of questionSquares) tileTypeBySquare[sq] = 'question'
  return {
    size,
    questionSquares: [...questionSquares].sort((a, b) => a - b),
    subjectBySquare: {},
    tileTypeBySquare,
  }
}

describe('applyDiceMove', () => {
  it('avança para frente sem vencer', () => {
    expect(applyDiceMove(0, 3, 20)).toEqual({ toSquare: 3, won: false })
    expect(applyDiceMove(10, 4, 20)).toEqual({ toSquare: 14, won: false })
  })

  it('vence ao alcançar exatamente a chegada', () => {
    expect(applyDiceMove(17, 3, 20)).toEqual({ toSquare: 20, won: true })
  })

  it('vence e fixa na chegada ao ultrapassar (reach-or-pass + clamp)', () => {
    expect(applyDiceMove(18, 6, 20)).toEqual({ toSquare: 20, won: true })
  })
})

describe('advanceForCorrect', () => {
  it('amount = C_d + T_p por tier × dificuldade (§4)', () => {
    // leader (T_p = 0): só C_d.
    expect(advanceForCorrect('easy', 'leader')).toEqual({
      amount: 3,
      baseAdvance: 3,
      tierBonus: 0,
    })
    expect(advanceForCorrect('normal', 'leader')).toEqual({
      amount: 2,
      baseAdvance: 2,
      tierBonus: 0,
    })
    expect(advanceForCorrect('hard', 'leader')).toEqual({
      amount: 1,
      baseAdvance: 1,
      tierBonus: 0,
    })

    // middle (T_p = 1).
    expect(advanceForCorrect('easy', 'middle')).toEqual({
      amount: 4,
      baseAdvance: 3,
      tierBonus: 1,
    })
    expect(advanceForCorrect('normal', 'middle')).toEqual({
      amount: 3,
      baseAdvance: 2,
      tierBonus: 1,
    })
    expect(advanceForCorrect('hard', 'middle')).toEqual({
      amount: 2,
      baseAdvance: 1,
      tierBonus: 1,
    })

    // last (T_p = 2).
    expect(advanceForCorrect('easy', 'last')).toEqual({
      amount: 5,
      baseAdvance: 3,
      tierBonus: 2,
    })
    expect(advanceForCorrect('normal', 'last')).toEqual({
      amount: 4,
      baseAdvance: 2,
      tierBonus: 2,
    })
    expect(advanceForCorrect('hard', 'last')).toEqual({
      amount: 3,
      baseAdvance: 1,
      tierBonus: 2,
    })
  })
})

describe('retreatForError', () => {
  it('erro proximal por dificuldade', () => {
    expect(retreatForError('proximal', 'easy')).toBe(1)
    expect(retreatForError('proximal', 'normal')).toBe(2)
    expect(retreatForError('proximal', 'hard')).toBe(3)
  })

  it('erro totalmente errado por dificuldade', () => {
    expect(retreatForError('wrong', 'easy')).toBe(2)
    expect(retreatForError('wrong', 'normal')).toBe(3)
    expect(retreatForError('wrong', 'hard')).toBe(4)
  })
})

describe('isQuestionSquare', () => {
  it('detecta por tileTypeBySquare e por questionSquares', () => {
    const board = makeBoard(20, [5, 8])
    expect(isQuestionSquare(board, 5)).toBe(true)
    expect(isQuestionSquare(board, 8)).toBe(true)
    expect(isQuestionSquare(board, 6)).toBe(false)
  })
})

describe('applyAdvance', () => {
  it('avança sem vencer', () => {
    expect(applyAdvance(5, 2, 20)).toEqual({ toSquare: 7, won: false })
  })

  it('vence ao alcançar exatamente a chegada', () => {
    expect(applyAdvance(18, 2, 20)).toEqual({ toSquare: 20, won: true })
  })

  it('vence e fixa na chegada ao ultrapassar', () => {
    expect(applyAdvance(19, 5, 20)).toEqual({ toSquare: 20, won: true })
  })
})

describe('applyRetreat', () => {
  it('recua sem clampar', () => {
    expect(applyRetreat(10, 3)).toEqual({ toSquare: 7 })
  })

  it('clampa o mínimo em 1 (RF-10)', () => {
    expect(applyRetreat(2, 5)).toEqual({ toSquare: 1 })
    expect(applyRetreat(1, 1)).toEqual({ toSquare: 1 })
  })
})

describe('applyNudge', () => {
  it('não dispara em casa não-pergunta', () => {
    const board = makeBoard(20, [7])
    // rng baixo dispararia, mas a casa não é pergunta.
    expect(applyNudge(6, board, () => 0)).toEqual({ square: 6, nudged: false })
  })

  it('não dispara quando rng >= 0.7', () => {
    const board = makeBoard(20, [7])
    expect(applyNudge(7, board, () => 0.9)).toEqual({
      square: 7,
      nudged: false,
    })
  })

  it('dispara e prefere +1 quando viável', () => {
    const board = makeBoard(20, [7])
    expect(applyNudge(7, board, () => 0.5)).toEqual({ square: 8, nudged: true })
  })

  it('cai para -1 quando +1 também é casa-pergunta', () => {
    const board = makeBoard(20, [7, 8])
    expect(applyNudge(7, board, () => 0.5)).toEqual({ square: 6, nudged: true })
  })

  it('cai para -1 quando +1 ultrapassa o tabuleiro', () => {
    const board = makeBoard(8, [8])
    // targetSquare = 8 = size; +1 (=9) > size → tenta -1 (=7, não-pergunta).
    expect(applyNudge(8, board, () => 0.5)).toEqual({ square: 7, nudged: true })
  })

  it('permanece quando nenhum vizinho é viável', () => {
    const board = makeBoard(20, [6, 7, 8])
    expect(applyNudge(7, board, () => 0.5)).toEqual({
      square: 7,
      nudged: false,
    })
  })
})

describe('applyCorrectMovement', () => {
  it('aplica avanço por tier sem nudge (casa-alvo normal)', () => {
    const board = makeBoard(20, [12])
    // last + normal: amount = 2 + 2 = 4; 5 + 4 = 9 (não-pergunta).
    const r = applyCorrectMovement({
      fromSquare: 5,
      difficulty: 'normal',
      tier: 'last',
      board,
      rng: () => 0.5,
    })
    expect(r).toEqual({
      toSquare: 9,
      won: false,
      baseAdvance: 2,
      tierBonus: 2,
      nudged: false,
    })
  })

  it('nudgeia +1 quando a casa-alvo é casa-pergunta e rng dispara', () => {
    const board = makeBoard(20, [7])
    // leader + easy: amount = 3; 4 + 3 = 7 (pergunta) → nudge +1 → 8.
    const r = applyCorrectMovement({
      fromSquare: 4,
      difficulty: 'easy',
      tier: 'leader',
      board,
      rng: () => 0.5,
    })
    expect(r).toEqual({
      toSquare: 8,
      won: false,
      baseAdvance: 3,
      tierBonus: 0,
      nudged: true,
    })
  })

  it('não nudgeia quando rng não dispara (para na casa-pergunta → encadeia)', () => {
    const board = makeBoard(20, [7])
    const r = applyCorrectMovement({
      fromSquare: 4,
      difficulty: 'easy',
      tier: 'leader',
      board,
      rng: () => 0.9,
    })
    expect(r.toSquare).toBe(7)
    expect(r.nudged).toBe(false)
  })

  it('clamp mínimo: nunca abaixo de 1', () => {
    const board = makeBoard(20, [])
    // amount sempre positivo, então o piso 1 é garantido a partir de qualquer casa.
    const r = applyCorrectMovement({
      fromSquare: 1,
      difficulty: 'hard',
      tier: 'leader',
      board,
      rng: () => 0.5,
    })
    expect(r.toSquare).toBeGreaterThanOrEqual(1)
  })

  it('vence ao alcançar exatamente a chegada', () => {
    const board = makeBoard(20, [])
    // leader + normal: amount = 2; 18 + 2 = 20 = size → vitória.
    const r = applyCorrectMovement({
      fromSquare: 18,
      difficulty: 'normal',
      tier: 'leader',
      board,
      rng: () => 0.5,
    })
    expect(r).toEqual({
      toSquare: 20,
      won: true,
      baseAdvance: 2,
      tierBonus: 0,
      nudged: false,
    })
  })

  it('vence e fixa na chegada ao ultrapassar (reach-or-pass)', () => {
    const board = makeBoard(20, [])
    // last + easy: amount = 5; 18 + 5 = 23 > size → fixa em 20, vitória.
    const r = applyCorrectMovement({
      fromSquare: 18,
      difficulty: 'easy',
      tier: 'last',
      board,
      rng: () => 0.5,
    })
    expect(r.toSquare).toBe(20)
    expect(r.won).toBe(true)
  })

  it('não nudgeia quando o avanço já é vitória', () => {
    const board = makeBoard(20, [20])
    // chegada (20) marcada como pergunta não deve impedir a vitória nem nudgear.
    const r = applyCorrectMovement({
      fromSquare: 18,
      difficulty: 'normal',
      tier: 'leader',
      board,
      rng: () => 0.5,
    })
    expect(r).toEqual({
      toSquare: 20,
      won: true,
      baseAdvance: 2,
      tierBonus: 0,
      nudged: false,
    })
  })
})
