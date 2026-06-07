import { describe, expect, it } from 'vitest'
import { rollD6 } from './dice'

describe('rollD6', () => {
  it('sempre retorna um inteiro em 1..6 com rng aleatório', () => {
    for (let i = 0; i < 1000; i++) {
      const value = rollD6()
      expect(Number.isInteger(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(1)
      expect(value).toBeLessThanOrEqual(6)
    }
  })

  it('é determinístico com rng injetado', () => {
    expect(rollD6(() => 0)).toBe(1)
    expect(rollD6(() => 0.5)).toBe(4)
    expect(rollD6(() => 0.999)).toBe(6)
  })

  it('mapeia os limites das faixas corretamente', () => {
    // Cada face ocupa 1/6 do intervalo [0, 1).
    expect(rollD6(() => 0 / 6)).toBe(1)
    expect(rollD6(() => 1 / 6)).toBe(2)
    expect(rollD6(() => 5 / 6)).toBe(6)
  })
})
