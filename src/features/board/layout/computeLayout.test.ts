import {
  computeLayout,
  MARGIN_BOTTOM,
  MARGIN_TOP,
  MARGIN_X,
  SPACING,
} from './computeLayout'

describe('computeLayout', () => {
  it('produz uma serpentina: linha 0 da esquerda para a direita (cx crescente)', () => {
    const { points } = computeLayout(12, 4)
    const row0 = points.filter((p) => p.row === 0)
    for (let i = 1; i < row0.length; i++) {
      expect(row0[i].cx).toBeGreaterThan(row0[i - 1].cx)
    }
  })

  it('inverte a linha 1 (cx decrescente conforme o índice aumenta)', () => {
    const { points } = computeLayout(12, 4)
    const row1 = points.filter((p) => p.row === 1)
    for (let i = 1; i < row1.length; i++) {
      expect(row1[i].cx).toBeLessThan(row1[i - 1].cx)
    }
  })

  it('não tem duas casas no mesmo centro (cx,cy)', () => {
    const { points } = computeLayout(25, 5)
    const seen = new Set<string>()
    for (const p of points) {
      const key = `${p.cx}:${p.cy}`
      expect(seen.has(key)).toBe(false)
      seen.add(key)
    }
  })

  it('calcula viewBox com as dimensões corretas', () => {
    const tileCount = 21
    const cols = 5
    const { viewBox, rows } = computeLayout(tileCount, cols)
    expect(rows).toBe(Math.ceil(tileCount / cols))
    expect(viewBox.w).toBe(MARGIN_X * 2 + cols * SPACING)
    expect(viewBox.h).toBe(MARGIN_TOP + MARGIN_BOTTOM + rows * SPACING)
  })

  it('retorna um ponto por casa', () => {
    const { points } = computeLayout(31, 6)
    expect(points.length).toBe(31)
  })

  it('gera pathD suave (começa com M e usa curvas C)', () => {
    const { pathD } = computeLayout(10, 4)
    expect(pathD.startsWith('M')).toBe(true)
    expect(pathD).toContain('C')
  })

  it('mantém os extremos de cada linha alinhados (virada vertical limpa)', () => {
    const cols = 4
    const { points } = computeLayout(8, cols)
    const endRow0 = points[cols - 1]
    const startRow1 = points[cols]
    expect(endRow0.cx).toBe(startRow1.cx)
  })
})
