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

/** Cor associada a cada matéria escolar. */
export function subjectColor(subject: Subject): string {
  switch (subject) {
    case 'matematica':
      return '#6d28d9'
    case 'portugues':
      return '#fb7185'
    case 'historia':
      return '#b45309'
    case 'geografia':
      return '#059669'
    case 'ciencias':
      return '#0ea5e9'
    case 'biologia':
      return '#16a34a'
    case 'fisica':
      return '#7c3aed'
    case 'quimica':
      return '#db2777'
    case 'ingles':
      return '#2563eb'
    case 'artes':
      return '#f59e0b'
    default:
      return '#6d28d9'
  }
}

/** Nome completo PT-BR de cada matéria (para tooltip/popover). */
export function subjectName(subject: Subject): string {
  switch (subject) {
    case 'matematica':
      return 'Matemática'
    case 'portugues':
      return 'Português'
    case 'historia':
      return 'História'
    case 'geografia':
      return 'Geografia'
    case 'ciencias':
      return 'Ciências'
    case 'biologia':
      return 'Biologia'
    case 'fisica':
      return 'Física'
    case 'quimica':
      return 'Química'
    case 'ingles':
      return 'Inglês'
    case 'artes':
      return 'Artes'
    default:
      return 'Matéria'
  }
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

/** Rótulo curto PT-BR de cada matéria (para caber dentro da casa). */
export function subjectLabel(subject: Subject): string {
  switch (subject) {
    case 'matematica':
      return 'Mat'
    case 'portugues':
      return 'Port'
    case 'historia':
      return 'Hist'
    case 'geografia':
      return 'Geo'
    case 'ciencias':
      return 'Cien'
    case 'biologia':
      return 'Bio'
    case 'fisica':
      return 'Fis'
    case 'quimica':
      return 'Qui'
    case 'ingles':
      return 'Ing'
    case 'artes':
      return 'Art'
    default:
      return '?'
  }
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
