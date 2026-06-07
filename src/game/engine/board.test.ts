import { describe, expect, it } from 'vitest'
import { generateBoard } from './board'

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

  it('todas as casas são normais na Sprint 1', () => {
    const board = generateBoard('hard', () => 0.5)
    expect(board.questionSquares).toEqual([])
    expect(board.subjectBySquare).toEqual({})
    expect(board.tileTypeBySquare).toEqual({})
  })
})
