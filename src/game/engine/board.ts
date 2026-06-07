import type { BoardDescriptor, Difficulty } from '../types'

/** Limites do tamanho do tabuleiro na Sprint 1. */
const MIN_SIZE = 20
const MAX_SIZE = 30

/**
 * Gera o descritor do tabuleiro.
 *
 * Sprint 1: `size` é um inteiro aleatório em [20, 30] e TODAS as casas são
 * normais — sem casas de pergunta nem de presídio (`questionSquares=[]`,
 * `subjectBySquare={}`, `tileTypeBySquare={}` — ausência de chave significa
 * `'normal'`).
 *
 * O parâmetro `difficulty` é mantido no contrato para Sprints futuras (vai
 * influenciar quantidade/distribuição de casas de pergunta), mas não altera
 * nada na Sprint 1.
 */
export function generateBoard(
  difficulty: Difficulty,
  rng: () => number = Math.random,
): BoardDescriptor {
  void difficulty
  const span = MAX_SIZE - MIN_SIZE + 1
  const size = MIN_SIZE + Math.floor(rng() * span)
  return {
    size,
    questionSquares: [],
    subjectBySquare: {},
    tileTypeBySquare: {},
  }
}
