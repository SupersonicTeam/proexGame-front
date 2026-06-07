import { pickColumns } from './pickColumns'

describe('pickColumns', () => {
  it('respeita os limites em retrato (min 3, max 4)', () => {
    const aspect = 0.5
    for (let n = 5; n <= 60; n += 5) {
      const cols = pickColumns(n, aspect)
      expect(cols).toBeGreaterThanOrEqual(3)
      expect(cols).toBeLessThanOrEqual(4)
    }
  })

  it('respeita os limites em paisagem (min 5, max 6)', () => {
    const aspect = 1.8
    for (let n = 5; n <= 60; n += 5) {
      const cols = pickColumns(n, aspect)
      expect(cols).toBeGreaterThanOrEqual(5)
      expect(cols).toBeLessThanOrEqual(6)
    }
  })

  it('respeita os limites intermediários (min 4, max 5)', () => {
    const aspect = 1.0
    for (let n = 5; n <= 60; n += 5) {
      const cols = pickColumns(n, aspect)
      expect(cols).toBeGreaterThanOrEqual(4)
      expect(cols).toBeLessThanOrEqual(5)
    }
  })

  it('é monotônico-ish: mais casas nunca reduzem o número de colunas', () => {
    const aspect = 1.8
    let prev = 0
    for (let n = 1; n <= 100; n++) {
      const cols = pickColumns(n, aspect)
      expect(cols).toBeGreaterThanOrEqual(
        prev === 0 ? cols : Math.min(prev, cols),
      )
      prev = cols
    }
    // Sanidade: cresce de fato em algum ponto até o teto.
    expect(pickColumns(100, aspect)).toBeGreaterThanOrEqual(
      pickColumns(10, aspect),
    )
  })
})
