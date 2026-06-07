/**
 * Posicionamento determinístico (seeded) de elementos decorativos nos espaços
 * livres do tabuleiro, evitando ficar por cima das casas. Mesmo seed → mesmo
 * resultado (estável por partida). Puro.
 */
interface Pt {
  cx: number
  cy: number
}

export interface Placement {
  x: number
  y: number
  rotation: number
  scale: number
  /** Índice do tipo de prop (o consumidor mapeia para uma ilustração). */
  variant: number
}

export interface ScatterOptions {
  width: number
  height: number
  /** Centros das casas a evitar. */
  tilePoints: Pt[]
  /** Distância mínima de qualquer casa. */
  avoidRadius: number
  /** Quantos props no máximo. */
  count: number
  /** Quantos tipos de prop existem (variant 0..variants-1). */
  variants: number
  /** Semente para reprodutibilidade. */
  seed: number
  /** Margem interna em que props podem aparecer. */
  padding?: number
}

/** PRNG simples e determinístico (mulberry32). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function scatterProps(opts: ScatterOptions): Placement[] {
  const {
    width,
    height,
    tilePoints,
    avoidRadius,
    count,
    variants,
    seed,
    padding = 28,
  } = opts

  const rand = mulberry32(seed)
  const placements: Placement[] = []
  const avoidSq = avoidRadius * avoidRadius
  const maxAttempts = count * 40

  for (
    let attempt = 0;
    attempt < maxAttempts && placements.length < count;
    attempt++
  ) {
    const x = padding + rand() * (width - padding * 2)
    const y = padding + rand() * (height - padding * 2)

    let tooClose = false
    for (const p of tilePoints) {
      const dx = p.cx - x
      const dy = p.cy - y
      if (dx * dx + dy * dy < avoidSq) {
        tooClose = true
        break
      }
    }
    if (tooClose) continue

    // Também evita amontoar props uns sobre os outros.
    let overlapsProp = false
    for (const q of placements) {
      const dx = q.x - x
      const dy = q.y - y
      if (dx * dx + dy * dy < avoidSq * 0.6) {
        overlapsProp = true
        break
      }
    }
    if (overlapsProp) continue

    placements.push({
      x,
      y,
      rotation: (rand() - 0.5) * 36,
      scale: 0.7 + rand() * 0.6,
      variant: Math.floor(rand() * variants) % variants,
    })
  }

  return placements
}
