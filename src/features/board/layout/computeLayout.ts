/**
 * Calcula o layout da trilha em coordenadas de unidade (viewBox). Base
 * boustrophedon (linhas pares E→D, ímpares D→E), porém com **ondulação
 * vertical** por casa: linhas pares "afundam" e ímpares "sobem", dando à trilha
 * um traçado sinuoso. Nos extremos de cada linha a ondulação é zero, então as
 * viradas (U-turns) permanecem alinhadas e a curva fica contínua. Puro.
 */
import type { BoardLayout, TilePoint } from '../types'
import { catmullRomPath } from './smoothPath'

/** Distância entre centros de casas vizinhas. */
export const SPACING = 100
/** Raio base de uma casa. */
export const RADIUS = 34
/** Amplitude da ondulação vertical da trilha. */
export const WAVE_AMP = 16
/** Margem lateral (espaço para a moldura/cenário). */
export const MARGIN_X = 72
/** Margem superior (céu + faixa de INÍCIO). */
export const MARGIN_TOP = 116
/** Margem inferior (grama + faixa de CHEGADA). */
export const MARGIN_BOTTOM = 92

/** Mantida para compatibilidade com consumidores existentes. */
export const MARGIN = MARGIN_X

export function computeLayout(tileCount: number, cols: number): BoardLayout {
  const rows = Math.ceil(tileCount / cols)
  const points: TilePoint[] = []

  for (let i = 0; i < tileCount; i++) {
    const row = Math.floor(i / cols)
    const posInRow = i % cols
    // Serpentina: linhas ímpares são espelhadas horizontalmente.
    const col = row % 2 === 0 ? posInRow : cols - 1 - posInRow

    const cx = MARGIN_X + col * SPACING + SPACING / 2
    const cyBase = MARGIN_TOP + row * SPACING + SPACING / 2
    // Ondulação: 0 nos extremos (viradas alinhadas), máx. no meio da linha.
    // Sinal alterna por linha → afunda/sobe, reforçando o aspecto de cobra.
    const phase = Math.sin((posInRow / Math.max(1, cols - 1)) * Math.PI)
    const wave = (row % 2 === 0 ? 1 : -1) * WAVE_AMP * phase
    const cy = cyBase + wave

    points.push({ index: i, cx, cy, row, col })
  }

  const pathD = catmullRomPath(points)

  const viewBox = {
    w: MARGIN_X * 2 + cols * SPACING,
    h: MARGIN_TOP + MARGIN_BOTTOM + rows * SPACING,
  }

  return { cols, rows, viewBox, points, pathD }
}
