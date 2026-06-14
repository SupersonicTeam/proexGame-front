/**
 * Uma casa do tabuleiro com profundidade (sombra + aro + brilho), cor
 * arco-íris (casas comuns) ou cor própria (pergunta/presídio/início/chegada),
 * número, ícones e faixas INÍCIO/CHEGADA. Interativa: destaca ao passar o mouse
 * (desktop) e ao tocar (mobile), exibindo um popover com a informação da casa.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
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
      {/* Halo verde pulsante (duas camadas) na casa de INÍCIO. */}
      {isStart && (
        <>
          <circle
            className="finish-glow"
            r={radius + 16}
            fill="#4ade80"
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center',
              animationDelay: '0.5s',
            }}
          />
          <circle
            className="finish-glow"
            r={radius + 8}
            fill="#86efac"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
          <Sparkles radius={radius} color="#bbf7d0" />
        </>
      )}
      {/* Halo dourado pulsante (multi-camada) + brilhos na casa de CHEGADA. */}
      {isFinish && (
        <>
          <circle
            className="finish-glow"
            r={radius + 18}
            fill="#f59e0b"
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center',
              animationDelay: '0.5s',
            }}
          />
          <circle
            className="finish-glow"
            r={radius + 10}
            fill="#fbbf24"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
          <Sparkles radius={radius} color="#fde68a" />
        </>
      )}

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

        {/* Grades da cela (presídio): barras de aço com leve 3D, atrás do nº. */}
        {type === 'prison' &&
          [-0.55, -0.27, 0.27, 0.55].map((f) => {
            const x = radius * f
            const inner = radius - radius * 0.16
            const h = Math.sqrt(Math.max(0, inner * inner - x * x))
            return (
              <g key={f}>
                <line
                  x1={x}
                  y1={-h}
                  x2={x}
                  y2={h}
                  stroke="#1e293b"
                  strokeWidth={radius * 0.11}
                  strokeLinecap="round"
                />
                <line
                  x1={x - radius * 0.015}
                  y1={-h}
                  x2={x - radius * 0.015}
                  y2={h}
                  stroke="#cbd5e1"
                  strokeWidth={radius * 0.045}
                  strokeLinecap="round"
                />
              </g>
            )
          })}

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

        {/* Cadeado dourado (presídio), na base da casa. */}
        {type === 'prison' && (
          <g transform={`translate(0 ${radius * 0.52})`}>
            <path
              d={`M ${-radius * 0.11} 0 a ${radius * 0.11} ${radius * 0.11} 0 0 1 ${radius * 0.22} 0`}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={radius * 0.05}
            />
            <rect
              x={-radius * 0.15}
              y={0}
              width={radius * 0.3}
              height={radius * 0.24}
              rx={radius * 0.05}
              fill="#fbbf24"
              stroke="#b45309"
              strokeWidth={radius * 0.02}
            />
            <circle
              cx={0}
              cy={radius * 0.11}
              r={radius * 0.04}
              fill="#7c2d12"
            />
          </g>
        )}
      </motion.g>

      {/* Bandeira quadriculada de linha de chegada. */}
      {isFinish && <FinishFlag radius={radius} />}

      {/* Faixa INÍCIO (acima) / CHEGADA (abaixo da casa). */}
      {ribbon && (
        <g transform={`translate(0 ${isFinish ? radius + 22 : -radius - 22})`}>
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

/**
 * Brilhos (sparkles) decorativos que cintilam ao redor de uma casa especial.
 * Cada estrela de 4 pontas é posicionada pelo `<g>` pai e cintila (escala+opacidade)
 * via classe CSS no próprio `<path>` (transform-box: fill-box), com atrasos
 * escalonados para um efeito vivo.
 */
function Sparkles({ radius, color }: { radius: number; color: string }) {
  const s = radius * 0.17
  const star = (sz: number) => {
    const q = sz * 0.34
    return `M0 ${-sz} L ${q} ${-q} L ${sz} 0 L ${q} ${q} L 0 ${sz} L ${-q} ${q} L ${-sz} 0 L ${-q} ${-q} Z`
  }
  const spots = [
    { x: -radius * 0.92, y: -radius * 0.66, d: 0, k: 1 },
    { x: radius * 0.96, y: -radius * 0.5, d: 0.4, k: 0.8 },
    { x: radius * 0.74, y: radius * 0.86, d: 0.85, k: 1.1 },
    { x: -radius * 0.82, y: radius * 0.62, d: 1.15, k: 0.7 },
  ]
  return (
    <g style={{ pointerEvents: 'none' }}>
      {spots.map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y})`}>
          <path
            className="sparkle"
            d={star(s * p.k)}
            fill={color}
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center',
              animationDelay: `${p.d}s`,
            }}
          />
        </g>
      ))}
    </g>
  )
}

/**
 * Bandeirinha quadriculada de linha de chegada, plantada no canto superior
 * direito da casa final (compacta, para não invadir a casa de cima).
 * Coordenadas locais: origem = centro da casa.
 */
function FinishFlag({ radius }: { radius: number }) {
  const cell = radius * 0.18
  const cols = 3
  const rows = 2
  const flagW = cols * cell
  const flagH = rows * cell
  const poleX = radius * 0.3 // canto superior direito
  const baseY = -radius * 0.45 // base do mastro (dentro da casa)
  const topY = baseY - radius * 0.78 // topo do mastro

  const squares: ReactNode[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 === 0) {
        squares.push(
          <rect
            key={`${r}-${c}`}
            x={poleX + c * cell}
            y={topY + r * cell}
            width={cell}
            height={cell}
            fill="#1f2937"
          />,
        )
      }
    }
  }

  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Mastro. */}
      <line
        x1={poleX}
        y1={baseY}
        x2={poleX}
        y2={topY}
        stroke="#78350f"
        strokeWidth={radius * 0.08}
        strokeLinecap="round"
      />
      <circle cx={poleX} cy={topY} r={radius * 0.07} fill="#fbbf24" />
      {/* Pano quadriculado que tremula (pivô no mastro). */}
      <g
        className="finish-flag-cloth"
        style={{ transformBox: 'fill-box', transformOrigin: '0% 50%' }}
      >
        <rect
          x={poleX}
          y={topY}
          width={flagW}
          height={flagH}
          fill="#ffffff"
          stroke="#1f2937"
          strokeWidth={0.8}
        />
        {squares}
      </g>
    </g>
  )
}
