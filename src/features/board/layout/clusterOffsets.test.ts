import { computeClusterOffsets, tokenRadiusForCount } from './clusterOffsets'

describe('computeClusterOffsets', () => {
  it('retorna exatamente `count` entradas', () => {
    for (let n = 1; n <= 6; n++) {
      expect(computeClusterOffsets(n).length).toBe(n)
    }
  })

  it('count=1 fica centralizado em {0,0}', () => {
    expect(computeClusterOffsets(1)).toEqual([{ dx: 0, dy: 0 }])
  })

  it('count=2 produz um par horizontal espelhado', () => {
    const [a, b] = computeClusterOffsets(2)
    expect(a.dx).toBeCloseTo(-b.dx)
    expect(Math.abs(a.dy)).toBeLessThan(1e-9)
    expect(Math.abs(b.dy)).toBeLessThan(1e-9)
  })
})

describe('tokenRadiusForCount', () => {
  it('encolhe conforme mais tokens compartilham a casa', () => {
    expect(tokenRadiusForCount(1)).toBeGreaterThan(tokenRadiusForCount(2))
    expect(tokenRadiusForCount(2)).toBeGreaterThan(tokenRadiusForCount(4))
  })
})
