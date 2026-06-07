/**
 * Anima um token casa-a-casa: quando a casa de destino muda, percorre os
 * centros intermediários (~180ms cada) em vez de teletransportar. Respeita
 * `prefers-reduced-motion` (vai direto ao destino). Limpa timers ao desmontar.
 */
import { useEffect, useRef, useState } from 'react'
import type { TilePoint } from '../types'

const STEP_MS = 180

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function useTokenAnimation(
  targetSquare: number,
  points: TilePoint[],
): { cx: number; cy: number; moving: boolean } {
  const [displayed, setDisplayed] = useState<number>(targetSquare)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (prefersReducedMotion()) {
      // Snap imediato: agendado fora do corpo síncrono do efeito.
      timer.current = setTimeout(() => setDisplayed(targetSquare), 0)
      return () => {
        if (timer.current) clearTimeout(timer.current)
      }
    }

    const step = () => {
      setDisplayed((current) => {
        if (current === targetSquare) return current
        const dir = targetSquare > current ? 1 : -1
        const next = current + dir
        if (next !== targetSquare) {
          timer.current = setTimeout(step, STEP_MS)
        }
        return next
      })
    }

    timer.current = setTimeout(step, STEP_MS)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [targetSquare])

  const point = points[displayed] ?? points[targetSquare]
  const moving = displayed !== targetSquare
  return point
    ? { cx: point.cx, cy: point.cy, moving }
    : { cx: 0, cy: 0, moving }
}
