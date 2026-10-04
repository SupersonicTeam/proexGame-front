/**
 * Cenário decorativo do tabuleiro (tema programação), desenhado em SVG inline
 * dentro do mesmo viewBox — escala junto e não depende de assets externos.
 * Renderizado ATRÁS da trilha e das casas. Inclui céu/sol/nuvens, colinas,
 * grama, props de programação espalhados (determinístico) e a moldura arredondada.
 */
import { useMemo } from 'react'
import { scatterProps } from '../layout/scatter'
import type { TilePoint } from '../types'

interface BoardSceneryProps {
  width: number
  height: number
  tilePoints: TilePoint[]
  /** Semente para a disposição estável dos props (ex.: tamanho do tabuleiro). */
  seed: number
  /** Altura da faixa de céu (acima da primeira linha de casas). */
  skyHeight: number
  /** Sufixo único para os IDs de gradiente/clip (evita colisão no DOM). */
  uid: string
}

export function BoardScenery({
  width,
  height,
  tilePoints,
  seed,
  skyHeight,
  uid,
}: BoardSceneryProps) {
  const props = useMemo(
    () =>
      scatterProps({
        width,
        height,
        tilePoints,
        avoidRadius: 64,
        count: Math.max(6, Math.round((width * height) / 90000)),
        variants: 6,
        seed,
        padding: 30,
      }),
    [width, height, tilePoints, seed],
  )

  const clipId = `scene-clip-${uid}`
  const skyId = `sky-${uid}`
  const grassId = `grass-${uid}`
  const frameId = `frame-${uid}`
  const r = 36 // raio da moldura

  return (
    <g aria-hidden="true">
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="100%" stopColor="#e0f2fe" />
        </linearGradient>
        <linearGradient id={grassId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="55%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <linearGradient id={frameId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={width} height={height} rx={r} ry={r} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        {/* Céu + grama */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={`url(#${grassId})`}
        />
        <rect
          x={0}
          y={0}
          width={width}
          height={skyHeight + 20}
          fill={`url(#${skyId})`}
        />

        {/* Sol */}
        <g transform={`translate(${width - 70} 56)`}>
          <circle r={34} fill="#fde047" />
          <circle
            r={34}
            fill="none"
            stroke="#facc15"
            strokeWidth={6}
            opacity={0.6}
          />
        </g>

        {/* Nuvens */}
        <Cloud x={70} y={48} scale={1} />
        <Cloud x={width * 0.42} y={34} scale={0.8} />

        {/* Colina no horizonte */}
        <path
          d={`M0 ${skyHeight + 18} Q ${width * 0.3} ${skyHeight - 34} ${
            width * 0.62
          } ${skyHeight + 14} T ${width} ${skyHeight + 8} L ${width} ${
            skyHeight + 60
          } L 0 ${skyHeight + 60} Z`}
          fill="#86efac"
          opacity={0.9}
        />

        {/* Props de programação espalhados */}
        {props.map((p, i) => (
          <g
            key={i}
            transform={`translate(${p.x} ${p.y}) rotate(${p.rotation}) scale(${p.scale})`}
          >
            <CodeProp variant={p.variant} />
          </g>
        ))}
      </g>

      {/* Moldura arredondada por cima de tudo */}
      <rect
        x={6}
        y={6}
        width={width - 12}
        height={height - 12}
        rx={r - 4}
        ry={r - 4}
        fill="none"
        stroke={`url(#${frameId})`}
        strokeWidth={12}
      />
      <rect
        x={6}
        y={6}
        width={width - 12}
        height={height - 12}
        rx={r - 4}
        ry={r - 4}
        fill="none"
        stroke="#ffffff"
        strokeWidth={2}
        opacity={0.5}
      />
    </g>
  )
}

function Cloud({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      fill="#ffffff"
      opacity={0.92}
    >
      <ellipse cx={0} cy={0} rx={26} ry={16} />
      <ellipse cx={20} cy={4} rx={20} ry={13} />
      <ellipse cx={-20} cy={5} rx={18} ry={12} />
    </g>
  )
}

/** Ilustração de prop de programação, centrada em (0,0). */
function CodeProp({ variant }: { variant: number }) {
  switch (variant) {
    case 0:
      return <PropBraces />
    case 1:
      return <PropTag />
    case 2:
      return <PropChip />
    case 3:
      return <PropBalloon />
    case 4:
      return <PropTerminal />
    default:
      return <PropDecision />
  }
}

/** Cartão com chaves `{ }` (bloco de código). */
function PropBraces() {
  return (
    <g>
      <rect x={-20} y={-14} width={40} height={28} rx={6} fill="#a78bfa" />
      <text
        x={0}
        y={1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={18}
        fontWeight={800}
        fontFamily="monospace"
        fill="#ffffff"
      >
        {'{ }'}
      </text>
    </g>
  )
}

/** Etiqueta `</>`. */
function PropTag() {
  return (
    <g>
      <rect x={-22} y={-13} width={44} height={26} rx={13} fill="#f472b6" />
      <text
        x={0}
        y={1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={15}
        fontWeight={800}
        fontFamily="monospace"
        fill="#ffffff"
      >
        {'</>'}
      </text>
    </g>
  )
}

/** Microchip com perninhas. */
function PropChip() {
  return (
    <g>
      {[-9, 0, 9].map((t) => (
        <g key={t} stroke="#475569" strokeWidth={2.4} strokeLinecap="round">
          <line x1={t} y1={-19} x2={t} y2={-13} />
          <line x1={t} y1={13} x2={t} y2={19} />
          <line x1={-19} y1={t} x2={-13} y2={t} />
          <line x1={13} y1={t} x2={19} y2={t} />
        </g>
      ))}
      <rect x={-14} y={-14} width={28} height={28} rx={4} fill="#334155" />
      <rect x={-7} y={-7} width={14} height={14} rx={2} fill="#22d3ee" />
    </g>
  )
}

function PropBalloon() {
  return (
    <g>
      <circle r={18} fill="#38bdf8" />
      <path d="M-6 16 L0 26 L6 16 Z" fill="#38bdf8" />
      <text
        x={0}
        y={1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={20}
        fontWeight={800}
        fill="#ffffff"
      >
        ?
      </text>
    </g>
  )
}

/** Janelinha de terminal com prompt `>_`. */
function PropTerminal() {
  return (
    <g>
      <rect x={-22} y={-15} width={44} height={30} rx={4} fill="#1e293b" />
      <rect x={-22} y={-15} width={44} height={7} rx={3} fill="#475569" />
      <circle cx={-17} cy={-11.5} r={1.6} fill="#f87171" />
      <circle cx={-12} cy={-11.5} r={1.6} fill="#fbbf24" />
      <circle cx={-7} cy={-11.5} r={1.6} fill="#4ade80" />
      <text
        x={-15}
        y={5}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={800}
        fontFamily="monospace"
        fill="#4ade80"
      >
        {'>_'}
      </text>
    </g>
  )
}

/** Losango de decisão (fluxograma) com `?`. */
function PropDecision() {
  return (
    <g>
      <path
        d="M0 -20 L22 0 L0 20 L-22 0 Z"
        fill="#fbbf24"
        stroke="#d97706"
        strokeWidth={1.5}
      />
      <text
        x={0}
        y={1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={14}
        fontWeight={800}
        fontFamily="monospace"
        fill="#78350f"
      >
        {'se?'}
      </text>
    </g>
  )
}
