import { describe, expect, it } from 'vitest'
import { computeTiers, tierBonus } from './tiers'

describe('computeTiers', () => {
  it('2 jogadores: frente = leader, trás = last', () => {
    const tiers = computeTiers([
      { id: 'a', square: 5 },
      { id: 'b', square: 2 },
    ])
    expect(tiers).toEqual({ a: 'leader', b: 'last' })
  })

  it('empate no topo → todos leader (resto last/middle)', () => {
    const tiers = computeTiers([
      { id: 'a', square: 8 },
      { id: 'b', square: 8 },
      { id: 'c', square: 3 },
    ])
    expect(tiers).toEqual({ a: 'leader', b: 'leader', c: 'last' })
  })

  it('empate na base → todos last', () => {
    const tiers = computeTiers([
      { id: 'a', square: 9 },
      { id: 'b', square: 2 },
      { id: 'c', square: 2 },
    ])
    expect(tiers).toEqual({ a: 'leader', b: 'last', c: 'last' })
  })

  it('todos na mesma casa → TODOS leader (sem catch-up)', () => {
    const tiers = computeTiers([
      { id: 'a', square: 4 },
      { id: 'b', square: 4 },
      { id: 'c', square: 4 },
    ])
    expect(tiers).toEqual({ a: 'leader', b: 'leader', c: 'leader' })
  })

  it('3 jogadores → há middle entre leader e last', () => {
    const tiers = computeTiers([
      { id: 'a', square: 10 },
      { id: 'b', square: 6 },
      { id: 'c', square: 1 },
    ])
    expect(tiers).toEqual({ a: 'leader', b: 'middle', c: 'last' })
  })

  it('4 jogadores → dois middle no meio', () => {
    const tiers = computeTiers([
      { id: 'a', square: 12 },
      { id: 'b', square: 8 },
      { id: 'c', square: 5 },
      { id: 'd', square: 1 },
    ])
    expect(tiers).toEqual({
      a: 'leader',
      b: 'middle',
      c: 'middle',
      d: 'last',
    })
  })

  it('lista vazia → objeto vazio', () => {
    expect(computeTiers([])).toEqual({})
  })
})

describe('tierBonus', () => {
  it('leader 0 / middle 1 / last 2', () => {
    expect(tierBonus('leader')).toBe(0)
    expect(tierBonus('middle')).toBe(1)
    expect(tierBonus('last')).toBe(2)
  })
})
