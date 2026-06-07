import { scatterProps } from './scatter'
import type { ScatterOptions } from './scatter'

const baseOpts: ScatterOptions = {
  width: 600,
  height: 800,
  tilePoints: [
    { cx: 100, cy: 100 },
    { cx: 300, cy: 300 },
    { cx: 500, cy: 500 },
  ],
  avoidRadius: 50,
  count: 10,
  variants: 5,
  seed: 42,
}

describe('scatterProps', () => {
  it('é determinístico para o mesmo seed', () => {
    const a = scatterProps(baseOpts)
    const b = scatterProps(baseOpts)
    expect(a).toEqual(b)
  })

  it('seeds diferentes produzem layouts diferentes', () => {
    const a = scatterProps(baseOpts)
    const b = scatterProps({ ...baseOpts, seed: 7 })
    expect(a).not.toEqual(b)
  })

  it('nunca posiciona props sobre as casas (respeita avoidRadius)', () => {
    const placements = scatterProps(baseOpts)
    for (const p of placements) {
      for (const t of baseOpts.tilePoints) {
        const dist = Math.hypot(t.cx - p.x, t.cy - p.y)
        expect(dist).toBeGreaterThanOrEqual(baseOpts.avoidRadius)
      }
    }
  })

  it('respeita o limite de quantidade e o intervalo de variantes', () => {
    const placements = scatterProps(baseOpts)
    expect(placements.length).toBeLessThanOrEqual(baseOpts.count)
    for (const p of placements) {
      expect(p.variant).toBeGreaterThanOrEqual(0)
      expect(p.variant).toBeLessThan(baseOpts.variants)
    }
  })
})
