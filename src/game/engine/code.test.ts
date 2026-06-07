import { describe, expect, it } from 'vitest'
import { generateSessionCode } from './code'

describe('generateSessionCode', () => {
  it('gera string de exatamente 5 dígitos', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateSessionCode()
      expect(code).toMatch(/^\d{5}$/)
    }
  })

  it('preenche com zeros à esquerda', () => {
    expect(generateSessionCode(new Set(), () => 0)).toBe('00000')
    expect(generateSessionCode(new Set(), () => 4 / 100000)).toBe('00004')
  })

  it('evita colisões com códigos existentes', () => {
    let call = 0
    // Primeiras chamadas devolvem "00001" (colide), depois "00002".
    const rng = () => {
      call++
      return call === 1 ? 1 / 100000 : 2 / 100000
    }
    const code = generateSessionCode(new Set(['00001']), rng)
    expect(code).toBe('00002')
  })

  it('códigos são únicos ao acumular no conjunto', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 500; i++) {
      const code = generateSessionCode(seen)
      expect(seen.has(code)).toBe(false)
      seen.add(code)
    }
  })
})
