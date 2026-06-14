/**
 * Token de um jogador. Posição animada casa-a-casa via useTokenAnimation, com
 * transição CSS suave no transform. Tem sombra, brilho "glossy", aro branco e a
 * inicial do nome. Enquanto se move faz um leve "squash" e dá uma molinha ao
 * parar (framer-motion). O jogador da vez ganha um anel pulsante.
 */
import { motion } from 'framer-motion'
import type { PlayerView, TilePoint } from '../types'
import { useTokenAnimation } from '../hooks/useTokenAnimation'

interface PlayerTokenProps {
  player: PlayerView
  points: TilePoint[]
  offset: { dx: number; dy: number }
  radius: number
  /** É o jogador da vez? (anel pulsante) */
  isCurrentTurn?: boolean
}

export function PlayerToken({
  player,
  points,
  offset,
  radius,
  isCurrentTurn = false,
}: PlayerTokenProps) {
  const { cx, cy, moving } = useTokenAnimation(player.square, points)
  const x = cx + offset.dx
  const y = cy + offset.dy
  const initial = player.name.trim().charAt(0).toUpperCase() || '?'
  const glossId = `tok-gloss-${player.id}`

  return (
    <g
      transform={`translate(${x} ${y})`}
      style={{ transition: 'transform 280ms ease-out' }}
      aria-label={`Jogador ${player.name}`}
    >
      {/* Anel pulsante do jogador da vez (CSS: leve e compositor-driven). */}
      {isCurrentTurn && (
        <circle
          className="turn-ring"
          r={radius + 4}
          fill="none"
          stroke="#ffffff"
          strokeWidth={2.5}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />
      )}

      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        animate={{
          // "Pulinho" + squash enquanto anda (suspense no movimento da peça).
          y: moving ? -radius * 0.3 : 0,
          scaleX: moving ? 1.06 : 1,
          scaleY: moving ? 0.92 : 1,
        }}
        transition={{ type: 'spring', stiffness: 360, damping: 14 }}
      >
        <defs>
          {/* Verniz glossy: branco translúcido no alto-esquerdo, some no centro. */}
          <radialGradient id={glossId} cx="34%" cy="26%" r="78%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.6} />
            <stop offset="42%" stopColor="#ffffff" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* Sombra projetada no chão. */}
        <ellipse
          cx={0}
          cy={radius * 0.85}
          rx={radius * 0.8}
          ry={radius * 0.3}
          fill="#0f172a"
          opacity={0.25}
        />
        {/* Corpo. */}
        <circle
          r={radius}
          fill={player.color}
          stroke="#ffffff"
          strokeWidth={player.isCurrentUser ? 3.5 : 2.5}
        />
        {/* Aro interno escuro para dar volume. */}
        <circle
          r={radius - 1.5}
          fill="none"
          stroke="#0f172a"
          strokeOpacity={0.18}
          strokeWidth={1.5}
        />
        {/* Verniz glossy (esfera 3D). */}
        <circle r={radius - 1} fill={`url(#${glossId})`} />
        {/* Brilho especular. */}
        <ellipse
          cx={-radius * 0.3}
          cy={-radius * 0.36}
          rx={radius * 0.3}
          ry={radius * 0.18}
          fill="#ffffff"
          opacity={0.5}
        />
        {/* Emoji customizado (sem contorno) ou a inicial do nome. */}
        {player.emoji ? (
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={radius * 1.05}
            style={{ userSelect: 'none' }}
          >
            {player.emoji}
          </text>
        ) : (
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={radius * 0.92}
            fontWeight={800}
            fill="#ffffff"
            stroke={player.color}
            strokeWidth={radius * 0.04}
            paintOrder="stroke"
            style={{ userSelect: 'none' }}
          >
            {initial}
          </text>
        )}
      </motion.g>
    </g>
  )
}
