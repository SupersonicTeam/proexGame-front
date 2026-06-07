/**
 * Converte uma sequência de pontos numa curva suave usando spline de
 * Catmull-Rom convertida para Béziers cúbicas (comandos `C`). É isso que dá à
 * trilha o aspecto de "cobra" contínua, em vez de uma polilinha de segmentos
 * retos. Pura e determinística.
 */
interface Pt {
  cx: number
  cy: number
}

/**
 * @param points pontos por onde a curva passa (na ordem)
 * @param tension 0..1; quanto maior, mais "solta"/curvada. Default 1.
 */
export function catmullRomPath(points: Pt[], tension = 1): string {
  if (points.length === 0) return ''
  if (points.length === 1)
    return `M${round(points[0].cx)} ${round(points[0].cy)}`

  const d: string[] = [`M${round(points[0].cx)} ${round(points[0].cy)}`]

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? points[i + 1]

    const f = tension / 6
    const cp1x = p1.cx + (p2.cx - p0.cx) * f
    const cp1y = p1.cy + (p2.cy - p0.cy) * f
    const cp2x = p2.cx - (p3.cx - p1.cx) * f
    const cp2y = p2.cy - (p3.cy - p1.cy) * f

    d.push(
      `C${round(cp1x)} ${round(cp1y)} ${round(cp2x)} ${round(cp2y)} ${round(
        p2.cx,
      )} ${round(p2.cy)}`,
    )
  }

  return d.join(' ')
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
