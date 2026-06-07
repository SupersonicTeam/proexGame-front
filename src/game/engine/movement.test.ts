import { describe, expect, it } from 'vitest'
import { applyDiceMove } from './movement'

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
