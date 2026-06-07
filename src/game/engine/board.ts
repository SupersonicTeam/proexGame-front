import type {
  BoardDescriptor,
  Difficulty,
  Subject,
  TileType,
} from '../types'

/** Limites do tamanho do tabuleiro. */
const MIN_SIZE = 20
const MAX_SIZE = 30

/** Densidade de casas-pergunta por dificuldade (RF-07). */
const QUESTION_DENSITY: Record<Difficulty, number> = {
  easy: 0.4,
  normal: 0.6,
  hard: 0.8,
}

/** As 10 matérias escolares (RF-09). */
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

/** Sorteia e remove um elemento de `pool`, devolvendo-o (mutação local). */
function takeRandom<T>(pool: T[], rng: () => number): T {
  const index = Math.floor(rng() * pool.length)
  return pool.splice(index, 1)[0]
}

/**
 * Gera o descritor do tabuleiro (SPEC §4 + RF-06/07/17/18).
 *
 * Ordem da geração:
 * 1. `size` aleatório em [20, 30]; casas não-terminais = índices 1..size-1.
 * 2. Presídio (RF-18): 1 casa se size ∈ [20, 24], 2 se size ∈ [25, 30],
 *    sorteadas entre as não-terminais (nunca 0 nem `size`).
 * 3. Casas-pergunta (RF-07): densidade por dificuldade sobre o nº de casas
 *    não-terminais restantes (descontando os presídios), arredondada.
 *    Mutuamente exclusivas com presídio (RF-17).
 * 4. `subjectBySquare`: uma matéria sorteada por casa-pergunta.
 * 5. `tileTypeBySquare`: `'question'`/`'prison'`; normais omitidas.
 * 6. `questionSquares`: índices das casas-pergunta.
 *
 * O `rng` injetável (default `Math.random`) cobre TODA aleatoriedade, tornando
 * a geração determinística sob teste.
 */
export function generateBoard(
  difficulty: Difficulty,
  rng: () => number = Math.random,
): BoardDescriptor {
  const span = MAX_SIZE - MIN_SIZE + 1
  const size = MIN_SIZE + Math.floor(rng() * span)

  // Casas não-terminais candidatas: 1..size-1.
  const candidates: number[] = []
  for (let i = 1; i < size; i++) {
    candidates.push(i)
  }

  // 2. Presídios: 1 para size em [20, 24], 2 para size em [25, 30].
  const prisonCount = size <= 24 ? 1 : 2
  const prisonSquares: number[] = []
  for (let i = 0; i < prisonCount; i++) {
    prisonSquares.push(takeRandom(candidates, rng))
  }

  // 3. Casas-pergunta: densidade sobre as não-terminais restantes.
  const questionCount = Math.round(candidates.length * QUESTION_DENSITY[difficulty])
  const questionSquares: number[] = []
  for (let i = 0; i < questionCount; i++) {
    questionSquares.push(takeRandom(candidates, rng))
  }
  questionSquares.sort((a, b) => a - b)

  // 4. Matéria por casa-pergunta.
  const subjectBySquare: Record<number, Subject> = {}
  for (const square of questionSquares) {
    subjectBySquare[square] = SUBJECTS[Math.floor(rng() * SUBJECTS.length)]
  }

  // 5. Tipos de casa (normais omitidas).
  const tileTypeBySquare: Record<number, TileType> = {}
  for (const square of questionSquares) {
    tileTypeBySquare[square] = 'question'
  }
  for (const square of prisonSquares) {
    tileTypeBySquare[square] = 'prison'
  }

  return { size, questionSquares, subjectBySquare, tileTypeBySquare }
}
