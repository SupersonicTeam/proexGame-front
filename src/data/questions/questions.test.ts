import { describe, expect, it } from 'vitest'
import { BACKEND_SUBJECTS } from '../../game/types'
import { allQuestions, questionsBySubject } from './index'

/**
 * Feature logica-programacao (PROG-11): o banco do modo demonstração usa só as
 * 8 categorias de lógica de programação, com ≥ 3 perguntas cada.
 */
describe('banco da demonstração', () => {
  it('cobre exatamente as 8 categorias do backend', () => {
    expect(Object.keys(questionsBySubject).sort()).toEqual(
      [...BACKEND_SUBJECTS].sort(),
    )
  })

  it.each([...BACKEND_SUBJECTS])(
    '%s tem ≥ 3 perguntas da própria categoria',
    (s) => {
      const qs = questionsBySubject[s]
      expect(qs.length).toBeGreaterThanOrEqual(3)
      for (const q of qs) expect(q.subject).toBe(s)
    },
  )

  it('não contém matérias escolares antigas', () => {
    const subjects = new Set(allQuestions.map((q) => q.subject))
    for (const old of ['matematica', 'historia', 'artes', 'portugues']) {
      expect(subjects.has(old)).toBe(false)
    }
  })

  it('inclui perguntas com pseudocódigo (code)', () => {
    expect(allQuestions.some((q) => typeof q.code === 'string')).toBe(true)
  })
})
