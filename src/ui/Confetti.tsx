/**
 * Chuva de confete leve (sem dependência externa). Gera N pedaços coloridos que
 * caem do topo com deriva e rotação, via framer-motion. Cada pedaço cai uma vez.
 * Overlay fixo que não bloqueia toques. Respeita prefers-reduced-motion.
 */
import { useMemo } from 'react'
import { motion } from 'framer-motion'

const COLORS = [
  '#ef4444',
  '#3b82f6',
  '#f59e0b',
  '#a855f7',
  '#22c55e',
  '#ec4899',
  '#06b6d4',
]

interface ConfettiProps {
  /** Quantidade de pedaços. */
  count?: number
}

function reducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** PRNG determinístico (mulberry32) — evita Math.random no render (regra purity). */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function Confetti({ count = 130 }: ConfettiProps) {
  const reduced = reducedMotion()
  const pieces = useMemo(() => {
    if (reduced) return []
    const rng = mulberry32(0x9e3779b9 ^ count)
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: rng() * 100,
      delay: rng() * 1.5,
      duration: 2.6 + rng() * 2.4,
      drift: (rng() - 0.5) * 160,
      rotate: rng() * 720 - 360,
      size: 7 + rng() * 9,
      color: COLORS[i % COLORS.length],
      round: rng() > 0.5,
    }))
  }, [count, reduced])

  if (reduced) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            top: '-8%',
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: p.round ? '50%' : 2,
          }}
          initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
          animate={{
            y: '112vh',
            x: p.drift,
            rotate: p.rotate,
            opacity: [1, 1, 0.9, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeIn',
            times: [0, 0.7, 0.9, 1],
          }}
        />
      ))}
    </div>
  )
}
