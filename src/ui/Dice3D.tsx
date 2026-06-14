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

const SPINS_X = 3
const SPINS_Y = 5
const TILT = { x: -28, y: -40 }
/** Duração do arremesso (s). Mais longo + desaceleração forte = suspense. */
const THROW_DURATION = 2.4
/** Pausa segurando o resultado antes de fechar/mover (mais suspense). */
const SETTLE_HOLD_MS = 450

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
      ? // Gira rápido no começo e "rasteja" até parar na face (suspense).
        { duration: THROW_DURATION, ease: [0.05, 0.7, 0.12, 1] as const }
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
                // Arremesso alto com uma "pairada" no ar antes de cair e quicar.
                y: [0, -size * 1.05, -size * 0.92, 0, -size * 0.16, 0],
                scale: [1, 1.14, 1.1, 1, 1.05, 1],
              }
            : undefined
        }
        transition={
          isThrow && !reduced
            ? {
                duration: THROW_DURATION,
                times: [0, 0.22, 0.45, 0.8, 0.9, 1],
                ease: 'easeOut',
              }
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
            if (!isThrow) return
            // Segura o resultado por um instante antes de mover o peão.
            window.setTimeout(() => onSettled?.(), reduced ? 0 : SETTLE_HOLD_MS)
          }}
        >
          {/* Núcleo opaco: 6 faces sólidas (quadradas, sem arredondar) logo
              atrás das faces com pips. Preenchem as quinas para o cubo nunca
              deixar ver o fundo durante o giro (bug "cantos invisíveis"). */}
          {[1, 2, 3, 4, 5, 6].map((v) => {
            const t = FACE_TRANSFORMS[v]
            return (
              <div
                key={`core-${v}`}
                style={{
                  position: 'absolute',
                  inset: 0,
                  transform: `rotateX(${t.rotX}deg) rotateY(${t.rotY}deg) translateZ(${half - 1.5}px)`,
                  backfaceVisibility: 'hidden',
                  background: '#e2e8f0',
                }}
              />
            )
          })}
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
      className="grid grid-cols-3 grid-rows-3 gap-1 rounded-md border-2 border-slate-300 bg-gradient-to-br from-white to-slate-100 p-[12%] shadow-inner"
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
