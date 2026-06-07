import { describe, expect, it } from 'vitest'
import { generateBoard } from './board'
import type { Difficulty, Subject } from '../types'

/** Densidades esperadas por dificuldade (espelha board.ts / RF-07). */
const DENSITY: Record<Difficulty, number> = {
  easy: 0.4,
  normal: 0.6,
  hard: 0.8,
}

const SUBJECTS: readonly Subject[] = [
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

/** Gerador linear-congruente determinístico, retorna valores em [0, 1). */
function seededRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard']

describe('generateBoard', () => {
  it('tamanho fica no intervalo [20, 30]', () => {
    expect(generateBoard('normal', () => 0).size).toBe(20)
    expect(generateBoard('normal', () => 0.999).size).toBe(30)
    for (let i = 0; i < 200; i++) {
      const { size } = generateBoard('normal')
      expect(size).toBeGreaterThanOrEqual(20)
      expect(size).toBeLessThanOrEqual(30)
    }
  })

  it('contagem de presídios: 1 para size em [20, 24], 2 para [25, 30]', () => {
    for (let seed = 1; seed <= 60; seed++) {
      for (const difficulty of DIFFICULTIES) {
        const board = generateBoard(difficulty, seededRng(seed))
        const prisons = Object.entries(board.tileTypeBySquare).filter(
          ([, type]) => type === 'prison',
        )
        const expected = board.size <= 24 ? 1 : 2
        expect(prisons.length).toBe(expected)
      }
    }
  })

  it('presídios e perguntas nunca caem em 0 ou size', () => {
    for (let seed = 1; seed <= 60; seed++) {
      for (const difficulty of DIFFICULTIES) {
        const board = generateBoard(difficulty, seededRng(seed))
        for (const key of Object.keys(board.tileTypeBySquare)) {
          const square = Number(key)
          expect(square).toBeGreaterThanOrEqual(1)
          expect(square).toBeLessThanOrEqual(board.size - 1)
        }
      }
    }
  })

  it('sem interseção entre presídio e casa-pergunta (RF-17)', () => {
    for (let seed = 1; seed <= 60; seed++) {
      for (const difficulty of DIFFICULTIES) {
        const board = generateBoard(difficulty, seededRng(seed))
        const prisons = new Set(
          Object.entries(board.tileTypeBySquare)
            .filter(([, type]) => type === 'prison')
            .map(([key]) => Number(key)),
        )
        for (const square of board.questionSquares) {
          expect(prisons.has(square)).toBe(false)
        }
      }
    }
  })

  it('densidade de casas-pergunta aproximadamente correta (RF-07)', () => {
    for (let seed = 1; seed <= 60; seed++) {
      for (const difficulty of DIFFICULTIES) {
        const board = generateBoard(difficulty, seededRng(seed))
        // Densidade incide sobre as não-terminais MENOS os presídios (RF-07/17).
        const prisonCount = board.size <= 24 ? 1 : 2
        const eligible = board.size - 1 - prisonCount
        const expected = Math.round(eligible * DENSITY[difficulty])
        expect(board.questionSquares.length).toBe(expected)
      }
    }
  })

  it('subjectBySquare cobre exatamente as casas-pergunta', () => {
    for (let seed = 1; seed <= 60; seed++) {
      for (const difficulty of DIFFICULTIES) {
        const board = generateBoard(difficulty, seededRng(seed))
        const subjectKeys = Object.keys(board.subjectBySquare)
          .map(Number)
          .sort((a, b) => a - b)
        const sortedQuestions = [...board.questionSquares].sort((a, b) => a - b)
        expect(subjectKeys).toEqual(sortedQuestions)
        for (const square of board.questionSquares) {
          expect(SUBJECTS).toContain(board.subjectBySquare[square])
        }
      }
    }
  })

  it('tileTypeBySquare é coerente com questionSquares e presídios', () => {
    const board = generateBoard('normal', seededRng(42))
    for (const square of board.questionSquares) {
      expect(board.tileTypeBySquare[square]).toBe('question')
    }
    const totalTyped = Object.keys(board.tileTypeBySquare).length
    const prisons = totalTyped - board.questionSquares.length
    expect(prisons).toBe(board.size <= 24 ? 1 : 2)
  })

  it('é determinístico para o mesmo seed', () => {
    const a = generateBoard('hard', seededRng(7))
    const b = generateBoard('hard', seededRng(7))
    expect(a).toEqual(b)
  })
})
