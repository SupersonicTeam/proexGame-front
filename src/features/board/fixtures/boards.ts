/**
 * Tabuleiros de exemplo para desenvolvimento/preview do renderizador, sem
 * backend. Incluem casas de pergunta (com matéria) e algumas de presídio.
 */
import type { BoardDescriptor, Subject, TileType } from '../../../game/types'

const SUBJECTS: Subject[] = [
  'matematica',
  'portugues',
  'historia',
  'geografia',
  'ciencias',
  'biologia',
  'fisica',
  'quimica',
  'ingles',
  'artes',
]

/** Monta um descritor: casas a cada `step` viram perguntas; `prisons` viram presídio. */
function buildBoard(
  size: number,
  step: number,
  prisons: number[],
): BoardDescriptor {
  const questionSquares: number[] = []
  const subjectBySquare: Record<number, Subject> = {}
  const tileTypeBySquare: Record<number, TileType> = {}

  for (let i = 1; i < size; i++) {
    if (i % step === 0) {
      questionSquares.push(i)
      subjectBySquare[i] = SUBJECTS[i % SUBJECTS.length]
      tileTypeBySquare[i] = 'question'
    }
  }

  for (const p of prisons) {
    if (p > 0 && p < size) {
      tileTypeBySquare[p] = 'prison'
      // Presídio não é pergunta.
      const idx = questionSquares.indexOf(p)
      if (idx >= 0) {
        questionSquares.splice(idx, 1)
        delete subjectBySquare[p]
      }
    }
  }

  return { size, questionSquares, subjectBySquare, tileTypeBySquare }
}

export const board20: BoardDescriptor = buildBoard(20, 3, [7])
export const board25: BoardDescriptor = buildBoard(25, 2, [9, 18])
export const board30: BoardDescriptor = buildBoard(30, 3, [11, 22])

export interface BoardFixture {
  label: string
  board: BoardDescriptor
}

export const boardFixtures: BoardFixture[] = [
  { label: '20 casas', board: board20 },
  { label: '25 casas', board: board25 },
  { label: '30 casas', board: board30 },
]
