import { describe, expect, it } from 'vitest'
import {
  applyDiceMove,
  advanceForCorrect,
  retreatForError,
  applyAdvance,
  applyRetreat,
} from './movement'

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
  it('valores-base por dificuldade (§4)', () => {
    expect(advanceForCorrect('easy')).toBe(3)
    expect(advanceForCorrect('normal')).toBe(2)
    expect(advanceForCorrect('hard')).toBe(1)
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
