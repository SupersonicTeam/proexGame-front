/**
 * Uma casa do tabuleiro com profundidade (sombra + aro + brilho), cor
 * arco-íris (casas comuns) ou cor própria (pergunta/presídio/início/chegada),
 * número, ícones e faixas INÍCIO/CHEGADA. Interativa: destaca ao passar o mouse
 * (desktop) e ao tocar (mobile), exibindo um popover com a informação da casa.
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Subject, TileType } from '../../../game/types'
import {
  FINISH_COLOR,
  START_COLOR,
  subjectColor,
  subjectLabel,
  subjectName,
  tilePaletteColor,
} from '../theme'

interface TileProps {
  index: number
  cx: number
  cy: number
  radius: number
  type: TileType
  subject?: Subject
  isStart: boolean
  isFinish: boolean
  /** Selecionada por toque (mobile) — mostra o popover. */
  selected?: boolean
  /** Se o dispositivo tem mouse (habilita destaque por hover). */
  canHover?: boolean
  /** Toque/clique: alterna seleção e notifica o pai. */
  onActivate?: (square: number) => void
}

function faceColors(
  index: number,
  type: TileType,
  isStart: boolean,
  isFinish: boolean,
  subject?: Subject,
): { light: string; dark: string } {
  if (isStart) return { light: START_COLOR, dark: '#15803d' }
  if (isFinish) return { light: FINISH_COLOR, dark: '#b45309' }
  if (type === 'question' && subject) {
    return { light: subjectColor(subject), dark: '#1e3a8a' }
  }
  if (type === 'prison') return { light: '#64748b', dark: '#334155' }
  return tilePaletteColor(index)
}

function popoverLabel(
  index: number,
  type: TileType,
  isStart: boolean,
  isFinish: boolean,
  subject?: Subject,
): string {
  if (isStart) return 'Início'
  if (isFinish) return 'Chegada'
  if (type === 'prison') return 'Presídio'
  if (type === 'question' && subject) return subjectName(subject)
  return `Casa ${index}`
}

export function Tile({
  index,
  cx,
  cy,
  radius,
  type,
  subject,
  isStart,
  isFinish,
  selected = false,
  canHover = true,
  onActivate,
}: TileProps) {
  const [hovered, setHovered] = useState(false)
  const { light, dark } = faceColors(index, type, isStart, isFinish, subject)
  const ribbon = isStart ? 'INÍCIO' : isFinish ? 'CHEGADA' : null
  const active = (hovered && canHover) || selected
  const label = popoverLabel(index, type, isStart, isFinish, subject)

  return (
    <g transform={`translate(${cx} ${cy})`}>
      <motion.g
        style={{
          transformBox: 'fill-box',
          transformOrigin: 'center',
          cursor: 'pointer',
        }}
        initial={false}
        animate={{ scale: active ? 1.12 : 1 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onTap={() => onActivate?.(index)}
        role="button"
        aria-label={`Casa ${index}${type === 'question' && subject ? ` — ${subjectName(subject)}` : ''}`}
      >
        {/* Sombra projetada (barata, sem filtro). */}
        <circle cx={0} cy={4} r={radius} fill="#0f172a" opacity={0.22} />
        {/* Aro escuro. */}
        <circle r={radius} fill={dark} />
        {/* Face. */}
        <circle r={radius - 3.5} fill={light} />
        {/* Brilho superior. */}
        <ellipse
          cx={0}
          cy={-radius * 0.32}
          rx={radius * 0.62}
          ry={radius * 0.34}
          fill="#ffffff"
          opacity={0.28}
        />

        {/* Número da casa. */}
        <text
          x={0}
          y={type === 'question' && subject ? -radius * 0.12 : 0}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={radius * 0.66}
          fontWeight={800}
          fill="#ffffff"
          stroke={dark}
          strokeWidth={radius * 0.04}
          paintOrder="stroke"
          style={{ userSelect: 'none' }}
        >
          {index}
        </text>

        {/* Rótulo da matéria nas casas de pergunta. */}
        {type === 'question' && subject && (
          <text
            x={0}
            y={radius * 0.5}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={radius * 0.32}
            fontWeight={800}
            fill="#ffffff"
            style={{ userSelect: 'none' }}
          >
            {subjectLabel(subject)}
          </text>
        )}

        {/* Glifo de presídio: barras. */}
        {type === 'prison' && (
          <g stroke="#fbbf24" strokeWidth={2.5} strokeLinecap="round">
            <line
              x1={-radius * 0.4}
              y1={radius * 0.38}
              x2={-radius * 0.4}
              y2={radius * 0.74}
            />
            <line x1={0} y1={radius * 0.38} x2={0} y2={radius * 0.74} />
            <line
              x1={radius * 0.4}
              y1={radius * 0.38}
              x2={radius * 0.4}
              y2={radius * 0.74}
            />
          </g>
        )}
      </motion.g>

      {/* Faixa de INÍCIO / CHEGADA. */}
      {ribbon && (
        <g transform={`translate(0 ${-radius - 22})`}>
          <rect
            x={-radius - 6}
            y={-13}
            width={radius * 2 + 12}
            height={24}
            rx={12}
            fill="#1e293b"
          />
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
            fontWeight={800}
            fill="#ffffff"
            style={{ userSelect: 'none' }}
          >
            {ribbon}
          </text>
        </g>
      )}

      {/* Popover de informação (hover/seleção). */}
      {active && !ribbon && (
        <g
          transform={`translate(0 ${-radius - 20})`}
          style={{ pointerEvents: 'none' }}
        >
          <rect
            x={-label.length * 4.4 - 10}
            y={-15}
            width={label.length * 8.8 + 20}
            height={26}
            rx={13}
            fill="#1e293b"
          />
          <text
            x={0}
            y={-1}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
            fontWeight={700}
            fill="#ffffff"
            style={{ userSelect: 'none' }}
          >
            {label}
          </text>
        </g>
      )}
    </g>
  )
}
