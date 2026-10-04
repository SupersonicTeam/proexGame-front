/**
 * Paleta de cores e rótulos do renderizador. Cores cruas (hex) usadas nos
 * atributos SVG (fill/stroke). Vibrantes para o público teen (13-17).
 */
import type { Subject, TileType } from '../../game/types'

/** Cor de fundo de uma casa conforme seu tipo. */
export function tileColor(type: TileType): string {
  switch (type) {
    case 'question':
      return '#38bdf8' // azul céu
    case 'prison':
      return '#475569' // cinza-ardósia (cela)
    case 'normal':
    default:
      return '#84cc16' // verde claro
  }
}

/**
 * Metadados de exibição de uma matéria. `subject` é um SLUG ABERTO vindo do
 * backend (CONTRACT pós-S5 #4): este mapa cobre as 8 categorias de lógica de
 * programação (backend e demo); qualquer slug desconhecido cai num FALLBACK
 * determinístico (cor por hash + rótulo derivado do slug). Nunca quebrar a UI
 * por causa de uma matéria nova no backend.
 */
interface SubjectMeta {
  /** Nome completo PT-BR (badge/tooltip). */
  name: string
  /** Rótulo curto (cabe dentro da casa). */
  label: string
  /** Cor de destaque (hex). */
  color: string
  /** Ícone (emoji) da matéria. */
  icon: string
}

const SUBJECT_META: Record<string, SubjectMeta> = {
  // --- 8 categorias de lógica de programação (backend e modo demonstração) ---
  algoritmos: { name: 'Algoritmos', label: 'Algo', color: '#0ea5e9', icon: '🧭' },
  'variaveis-e-tipos': { name: 'Variáveis e Tipos', label: 'Var', color: '#d97706', icon: '📦' },
  condicionais: { name: 'Condicionais', label: 'Se', color: '#db2777', icon: '🔀' },
  'operadores-logicos': { name: 'Operadores Lógicos', label: 'E/OU', color: '#9333ea', icon: '🧩' },
  'lacos-de-repeticao': { name: 'Laços de Repetição', label: 'Laço', color: '#16a34a', icon: '🔁' },
  vetores: { name: 'Vetores', label: 'Vetor', color: '#2563eb', icon: '🗃️' },
  funcoes: { name: 'Funções', label: 'Func', color: '#0d9488', icon: '🧱' },
  'busca-e-ordenacao': { name: 'Busca e Ordenação', label: 'Busca', color: '#ea580c', icon: '🔍' },
}

/** Paleta determinística para o fallback de matérias desconhecidas. */
const FALLBACK_COLORS = ['#6d28d9', '#0ea5e9', '#db2777', '#0d9488', '#f59e0b', '#7c3aed']

/** Hash estável de um slug → índice na paleta de fallback. */
function slugHash(slug: string): number {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0
  return h
}

/** Converte um slug kebab-case em Título ("matematica-financeira" → "Matematica Financeira"). */
function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Cor associada a uma matéria (com fallback determinístico por slug). */
export function subjectColor(subject: Subject): string {
  return (
    SUBJECT_META[subject]?.color ??
    FALLBACK_COLORS[slugHash(subject) % FALLBACK_COLORS.length]
  )
}

/** Nome completo PT-BR de uma matéria (com fallback derivado do slug). */
export function subjectName(subject: Subject): string {
  return SUBJECT_META[subject]?.name ?? (subject ? titleFromSlug(subject) : 'Matéria')
}

/** Ícone (emoji) de uma matéria (com fallback genérico). */
export function subjectIcon(subject: Subject): string {
  return SUBJECT_META[subject]?.icon ?? '📚'
}

/**
 * Paleta arco-íris para as casas comuns. As cores ciclam por índice, dando ao
 * tabuleiro o visual multicolorido da referência. Cada cor tem um tom claro
 * (face) e um escuro (aro/sombra) para dar profundidade.
 */
export const TILE_PALETTE: { light: string; dark: string }[] = [
  { light: '#fb7185', dark: '#e11d48' }, // rosa
  { light: '#fbbf24', dark: '#d97706' }, // amarelo
  { light: '#34d399', dark: '#059669' }, // verde
  { light: '#38bdf8', dark: '#0284c7' }, // azul
  { light: '#a78bfa', dark: '#7c3aed' }, // roxo
  { light: '#fb923c', dark: '#ea580c' }, // laranja
  { light: '#22d3ee', dark: '#0891b2' }, // ciano
  { light: '#f472b6', dark: '#db2777' }, // magenta
]

/** Cor (clara/escura) de uma casa comum pelo índice. */
export function tilePaletteColor(index: number): {
  light: string
  dark: string
} {
  return TILE_PALETTE[index % TILE_PALETTE.length]
}

/** Rótulo curto PT-BR de uma matéria (com fallback derivado do slug). */
export function subjectLabel(subject: Subject): string {
  if (SUBJECT_META[subject]) return SUBJECT_META[subject].label
  if (!subject) return '?'
  // Fallback: 3 primeiras letras capitalizadas (ex.: "logica" → "Log").
  return subject.charAt(0).toUpperCase() + subject.slice(1, 3)
}

/** Cor de destaque do INÍCIO (casa 0). */
export const START_COLOR = '#22c55e'

/** Cor de destaque da CHEGADA (casa size). */
export const FINISH_COLOR = '#f59e0b'

/** 4 cores vibrantes e distintas para os tokens dos jogadores. */
export const TOKEN_COLORS: string[] = [
  '#ef4444',
  '#3b82f6',
  '#f59e0b',
  '#a855f7',
]
