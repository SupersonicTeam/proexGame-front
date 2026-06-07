import { describe, expect, it } from 'vitest'
import { resolveOrder, rollForOrder } from './turnOrder'

/**
 * Cria um rng que devolve valores de forma a produzir as faces 1d6 desejadas
 * na sequência informada. `rollD6` faz `floor(rng()*6)+1`; para obter a face
 * `f` usamos `(f - 1) / 6 + epsilon`.
 */
function scriptedRng(faces: number[]): () => number {
  let i = 0
  return () => {
    const face = faces[i % faces.length]
    i++
    return (face - 1) / 6 + 0.01
  }
}

describe('rollForOrder', () => {
  it('o maior valor define quem joga primeiro', () => {
    const rng = scriptedRng([2, 6, 4])
    const { rolls, tiedPlayerIds, turnOrder } = rollForOrder(
      ['a', 'b', 'c'],
      rng,
    )
    expect(rolls.map((r) => r.value)).toEqual([2, 6, 4])
    expect(tiedPlayerIds).toEqual([])
    expect(turnOrder).toEqual(['b', 'c', 'a'])
  })

  it('detecta empate no topo e pede re-rolagem', () => {
    const rng = scriptedRng([6, 6, 3])
    const { tiedPlayerIds, turnOrder } = rollForOrder(['a', 'b', 'c'], rng)
    expect(turnOrder).toBeNull()
    expect(tiedPlayerIds).toEqual(['a', 'b'])
  })

  it('empate fora do topo é resolvido pela ordem de entrada (estável)', () => {
    const rng = scriptedRng([6, 3, 3])
    const { turnOrder } = rollForOrder(['a', 'b', 'c'], rng)
    expect(turnOrder).toEqual(['a', 'b', 'c'])
  })
})

describe('resolveOrder', () => {
  it('resolve empate no topo em múltiplas rodadas', () => {
    // Rodada 1: a=6, b=6, c=2 -> empate topo (a,b); c fica por último.
    // Rodada 2 (só a,b): a=5, b=3 -> a vence.
    const rng = scriptedRng([6, 6, 2, 5, 3])
    const { turnOrder, rounds } = resolveOrder(['a', 'b', 'c'], rng)
    expect(turnOrder).toEqual(['a', 'b', 'c'])
    expect(rounds.length).toBe(2)
  })

  it('sem empate resolve em uma rodada', () => {
    const rng = scriptedRng([1, 5, 3])
    const { turnOrder, rounds } = resolveOrder(['a', 'b', 'c'], rng)
    expect(turnOrder).toEqual(['b', 'c', 'a'])
    expect(rounds.length).toBe(1)
  })
})
