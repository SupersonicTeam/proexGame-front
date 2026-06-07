import { catmullRomPath } from './smoothPath'

describe('catmullRomPath', () => {
  it('retorna vazio para zero pontos', () => {
    expect(catmullRomPath([])).toBe('')
  })

  it('um único ponto vira apenas um moveTo', () => {
    const d = catmullRomPath([{ cx: 10, cy: 20 }])
    expect(d).toBe('M10 20')
  })

  it('começa com M e usa curvas C para múltiplos pontos', () => {
    const d = catmullRomPath([
      { cx: 0, cy: 0 },
      { cx: 100, cy: 0 },
      { cx: 100, cy: 100 },
    ])
    expect(d.startsWith('M0 0')).toBe(true)
    expect(d).toContain('C')
  })

  it('é determinístico', () => {
    const pts = [
      { cx: 0, cy: 0 },
      { cx: 50, cy: 30 },
      { cx: 90, cy: 10 },
    ]
    expect(catmullRomPath(pts)).toBe(catmullRomPath(pts))
  })
})
