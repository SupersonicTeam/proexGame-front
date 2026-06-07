/**
 * Cenário decorativo do tabuleiro (tema escolar), desenhado em SVG inline
 * dentro do mesmo viewBox — escala junto e não depende de assets externos.
 * Renderizado ATRÁS da trilha e das casas. Inclui céu/sol/nuvens, colinas,
 * grama, props escolares espalhados (determinístico) e a moldura arredondada.
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

        {/* Props escolares espalhados */}
        {props.map((p, i) => (
          <g
            key={i}
            transform={`translate(${p.x} ${p.y}) rotate(${p.rotation}) scale(${p.scale})`}
          >
            <SchoolProp variant={p.variant} />
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

/** Ilustração de prop escolar, centrada em (0,0). */
function SchoolProp({ variant }: { variant: number }) {
  switch (variant) {
    case 0:
      return <PropBook />
    case 1:
      return <PropPencil />
    case 2:
      return <PropStar />
    case 3:
      return <PropBalloon />
    case 4:
      return <PropPlane />
    default:
      return <PropRuler />
  }
}

function PropBook() {
  return (
    <g>
      <rect x={-18} y={-13} width={36} height={26} rx={3} fill="#ef4444" />
      <rect x={-18} y={-13} width={8} height={26} fill="#b91c1c" />
      <rect x={-7} y={-9} width={22} height={3} rx={1.5} fill="#fecaca" />
      <rect x={-7} y={-2} width={22} height={3} rx={1.5} fill="#fecaca" />
      <rect x={-7} y={5} width={16} height={3} rx={1.5} fill="#fecaca" />
    </g>
  )
}

function PropPencil() {
  return (
    <g transform="rotate(-35)">
      <rect x={-4} y={-22} width={8} height={34} fill="#f59e0b" />
      <rect x={-4} y={-22} width={8} height={6} fill="#fcd34d" />
      <path d="M-4 12 L4 12 L0 22 Z" fill="#fbbf24" />
      <path d="M-1.6 16 L1.6 16 L0 22 Z" fill="#1f2937" />
      <rect x={-4} y={-26} width={8} height={5} rx={1.5} fill="#f472b6" />
    </g>
  )
}

function PropStar() {
  const pts = starPoints(5, 18, 8)
  return (
    <polygon points={pts} fill="#facc15" stroke="#eab308" strokeWidth={1.5} />
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

function PropPlane() {
  return (
    <g fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1} strokeLinejoin="round">
      <path d="M-22 0 L22 -8 L4 4 Z" />
      <path d="M4 4 L22 -8 L8 12 Z" fill="#cbd5e1" />
    </g>
  )
}

function PropRuler() {
  return (
    <g transform="rotate(20)">
      <rect x={-24} y={-7} width={48} height={14} rx={2} fill="#a78bfa" />
      {[-18, -12, -6, 0, 6, 12, 18].map((tx) => (
        <line
          key={tx}
          x1={tx}
          y1={-7}
          x2={tx}
          y2={tx % 12 === 0 ? 1 : -2}
          stroke="#ffffff"
          strokeWidth={1.4}
        />
      ))}
    </g>
  )
}

/** Gera os pontos de uma estrela de `spikes` pontas. */
function starPoints(spikes: number, outer: number, inner: number): string {
  const pts: string[] = []
  const step = Math.PI / spikes
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner
    const angle = i * step - Math.PI / 2
    pts.push(
      `${(Math.cos(angle) * radius).toFixed(2)},${(Math.sin(angle) * radius).toFixed(2)}`,
    )
  }
  return pts.join(' ')
}
