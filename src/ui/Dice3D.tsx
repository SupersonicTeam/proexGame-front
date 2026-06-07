/**
 * Dado d6 em 3D (cubo CSS com 6 faces). Dois modos:
 *  - estático (sem `rollKey`): mostra `value`, girando suavemente ao mudar.
 *  - arremesso (`rollKey` definido): parte inclinado, tomba/gira com arco e
 *    quica, assentando no `value`; chama `onSettled` ao fim.
 *
 * Implementação DECLARATIVA (props `initial`/`animate` + `onAnimationComplete`)
 * — robusta a StrictMode/AnimatePresence, sem controles imperativos. Cada
 * arremesso é uma montagem nova (key=rollKey no overlay). Tudo finito.
 */
import { motion } from 'framer-motion'
import { FACE_TRANSFORMS, PIPS, faceRotation } from './diceFaces'

interface Dice3DProps {
  value: number | null
  size?: number
  /** Definido (e único por rolagem) dispara a animação de arremesso. */
  rollKey?: number
  /** Chamado quando o arremesso assenta. */
  onSettled?: () => void
}

const SPINS_X = 2
const SPINS_Y = 3
const TILT = { x: -28, y: -40 }

function mod360(a: number): number {
  return ((a % 360) + 360) % 360
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function Dice3D({ value, size = 96, rollKey, onSettled }: Dice3DProps) {
  const face = value ?? 1
  const half = size / 2
  const isThrow = rollKey !== undefined
  const reduced = prefersReducedMotion()
  const fr = faceRotation(face)

  // Alvo do cubo: no arremesso parte da pose inclinada e adiciona voltas; no
  // modo estático vai direto para a face do valor.
  const target = isThrow
    ? {
        rotateX: TILT.x + 360 * SPINS_X + mod360(fr.rotX - mod360(TILT.x)),
        rotateY: TILT.y + 360 * SPINS_Y + mod360(fr.rotY - mod360(TILT.y)),
      }
    : { rotateX: fr.rotX, rotateY: fr.rotY }

  const cubeInitial = isThrow
    ? { rotateX: TILT.x, rotateY: TILT.y }
    : { rotateX: fr.rotX, rotateY: fr.rotY }

  const cubeTransition =
    isThrow && !reduced
      ? { duration: 1.0, ease: [0.16, 0.84, 0.3, 1] as const }
      : { duration: isThrow ? 0 : 0.4, ease: 'easeOut' as const }

  return (
    <div
      style={{ width: size, height: size, perspective: size * 4 }}
      role="img"
      aria-label={value ? `Dado mostrando ${value}` : 'Dado'}
    >
      <motion.div
        style={{
          width: size,
          height: size,
          transformStyle: 'preserve-3d',
          position: 'relative',
        }}
        initial={isThrow ? { y: 0, scale: 1 } : false}
        animate={
          isThrow && !reduced
            ? {
                y: [0, -size * 0.8, 0, -size * 0.18, 0],
                scale: [1, 1.12, 1, 1.04, 1],
              }
            : undefined
        }
        transition={
          isThrow && !reduced
            ? { duration: 1.0, times: [0, 0.4, 0.72, 0.86, 1], ease: 'easeOut' }
            : undefined
        }
      >
        <motion.div
          style={{
            width: size,
            height: size,
            transformStyle: 'preserve-3d',
            position: 'relative',
          }}
          initial={cubeInitial}
          animate={target}
          transition={cubeTransition}
          onAnimationComplete={() => {
            if (isThrow) onSettled?.()
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((v) => {
            const t = FACE_TRANSFORMS[v]
            return (
              <div
                key={v}
                style={{
                  position: 'absolute',
                  inset: 0,
                  transform: `rotateX(${t.rotX}deg) rotateY(${t.rotY}deg) translateZ(${half}px)`,
                  backfaceVisibility: 'hidden',
                }}
              >
                <DiceFace value={v} size={size} />
              </div>
            )
          })}
        </motion.div>
      </motion.div>
    </div>
  )
}

function DiceFace({ value, size }: { value: number; size: number }) {
  const pips = PIPS[value] ?? []
  const dot = size * 0.15
  return (
    <div
      style={{ width: size, height: size }}
      className="grid grid-cols-3 grid-rows-3 gap-1 rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-100 p-[12%] shadow-inner"
    >
      {Array.from({ length: 9 }, (_, i) => {
        const row = Math.floor(i / 3)
        const col = i % 3
        const on = pips.some(([r, c]) => r === row && c === col)
        return (
          <span
            key={i}
            className={
              'place-self-center rounded-full ' +
              (on ? 'bg-brand shadow' : 'bg-transparent')
            }
            style={{ width: dot, height: dot }}
          />
        )
      })}
    </div>
  )
}
