import { describe, expect, it } from 'vitest'
import { selectQuestion, buildOptions } from './questionPool'
import type { Question } from '../types'

/** Gerador linear-congruente determinístico, retorna valores em [0, 1). */
function seededRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function makeQuestion(id: string, subject: Question['subject']): Question {
  return {
    id,
    subject,
    statement: `pergunta ${id}`,
    correct: `${id}-correct`,
    proximal: `${id}-proximal`,
    wrong: [`${id}-wrong0`, `${id}-wrong1`],
  }
}

const pool: Question[] = [
  makeQuestion('m1', 'matematica'),
  makeQuestion('m2', 'matematica'),
  makeQuestion('m3', 'matematica'),
  makeQuestion('p1', 'portugues'),
]

describe('buildOptions', () => {
  it('contém exatamente as 4 alternativas', () => {
    const q = makeQuestion('m1', 'matematica')
    const { options } = buildOptions(q, seededRng(1))
    expect(options).toHaveLength(4)
    expect([...options].sort()).toEqual(
      [q.correct, q.proximal, q.wrong[0], q.wrong[1]].sort(),
    )
  })

  it('correctIndex e proximalIndex apontam para os textos certos', () => {
    const q = makeQuestion('m1', 'matematica')
    for (let seed = 1; seed <= 50; seed++) {
      const { options, correctIndex, proximalIndex } = buildOptions(
        q,
        seededRng(seed),
      )
      expect(options[correctIndex]).toBe(q.correct)
      expect(options[proximalIndex]).toBe(q.proximal)
      expect(correctIndex).not.toBe(proximalIndex)
    }
  })

  it('é determinístico para o mesmo seed', () => {
    const q = makeQuestion('m1', 'matematica')
    expect(buildOptions(q, seededRng(9))).toEqual(buildOptions(q, seededRng(9)))
  })
})

describe('selectQuestion', () => {
  it('seleciona uma pergunta da matéria pedida', () => {
    const q = selectQuestion('matematica', pool, new Set(), seededRng(1))
    expect(q).not.toBeNull()
    expect(q?.subject).toBe('matematica')
  })

  it('respeita usedIds e não repete', () => {
    const used = new Set<string>()
    const seen: string[] = []
    let rngSeed = 1
    for (let i = 0; i < 3; i++) {
      const q = selectQuestion('matematica', pool, used, seededRng(rngSeed++))
      expect(q).not.toBeNull()
      expect(used.has(q!.id)).toBe(false)
      used.add(q!.id)
      seen.push(q!.id)
    }
    expect(new Set(seen).size).toBe(3)
  })

  it('devolve null quando a matéria esgota', () => {
    const used = new Set(['m1', 'm2', 'm3'])
    expect(selectQuestion('matematica', pool, used, seededRng(1))).toBeNull()
  })

  it('devolve null quando não há perguntas da matéria', () => {
    expect(selectQuestion('historia', pool, new Set(), seededRng(1))).toBeNull()
  })

  it('é determinístico com rng sazonado', () => {
    const a = selectQuestion('matematica', pool, new Set(), seededRng(5))
    const b = selectQuestion('matematica', pool, new Set(), seededRng(5))
    expect(a?.id).toBe(b?.id)
  })
})
