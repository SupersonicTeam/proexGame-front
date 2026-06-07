import type { Question, Subject } from '../types'

/**
 * Seleção e embaralhamento puros de perguntas (RF-09).
 *
 * O banco de perguntas (`pool`) é SEMPRE injetado — este módulo não importa os
 * JSON, mantendo-se livre de efeitos colaterais e testável com `rng` sazonado.
 */

/**
 * Sorteia uma pergunta da matéria `subject` que não esteja em `usedIds`.
 * Devolve `null` quando todas as perguntas da matéria já foram usadas.
 */
export function selectQuestion(
  subject: Subject,
  pool: Question[],
  usedIds: ReadonlySet<string>,
  rng: () => number = Math.random,
): Question | null {
  const available = pool.filter(
    (q) => q.subject === subject && !usedIds.has(q.id),
  )
  if (available.length === 0) {
    return null
  }
  const index = Math.floor(rng() * available.length)
  return available[index]
}

/**
 * Embaralha as 4 alternativas de uma pergunta e devolve o array já embaralhado
 * junto dos índices da alternativa correta e da proximal (RF-09).
 *
 * Usa Fisher–Yates com o `rng` injetável para embaralhamento determinístico.
 */
export function buildOptions(
  question: Question,
  rng: () => number = Math.random,
): { options: string[]; correctIndex: number; proximalIndex: number } {
  const options = [
    question.correct,
    question.proximal,
    question.wrong[0],
    question.wrong[1],
  ]

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = options[i]
    options[i] = options[j]
    options[j] = tmp
  }

  return {
    options,
    correctIndex: options.indexOf(question.correct),
    proximalIndex: options.indexOf(question.proximal),
  }
}
