import { describe, expect, it } from 'vitest'
import { MockGameClient } from './MockGameClient'
import { questionsBySubject } from '../../data/questions'
import type { Difficulty, QuestionPromptEvent, SessionState } from '../types'

/**
 * Feature logica-programacao (PROG-11): o modo demonstração serve perguntas das
 * categorias novas e repassa `code` no `questionPrompt`, como o backend.
 * Acessa membros privados do mock para disparar a pergunta sem simular a
 * partida inteira (dado, ordem, turnos).
 */
interface MockInternals {
  session: SessionState
  pendingQuestion: unknown
  triggerQuestion(player: SessionState['players'][number]): void
}

const SUBJECT = 'lacos-de-repeticao'

/** Dispara perguntas da categoria até esgotar o banco e devolve os prompts. */
function serveAll(difficulty: Difficulty): QuestionPromptEvent[] {
  const client = new MockGameClient({ botCount: 0, rng: () => 0 })
  const prompts: QuestionPromptEvent[] = []
  client.on('questionPrompt', (e) => prompts.push(e))
  client.createSession({ name: 'Ana', difficulty })

  const internals = client as unknown as MockInternals
  const me = internals.session.players[0]
  me.square = 1
  internals.session.board.subjectBySquare[1] = SUBJECT

  for (let i = 0; i < questionsBySubject[SUBJECT].length; i++) {
    internals.pendingQuestion = null
    internals.triggerQuestion(me)
  }
  client.dispose()
  return prompts
}

describe('MockGameClient — perguntas de lógica de programação', () => {
  it('emite questionPrompt com o code de cada pergunta da categoria', () => {
    const bank = questionsBySubject[SUBJECT]
    const prompts = serveAll('easy')

    expect(prompts.length).toBeGreaterThan(0)
    for (const p of prompts) {
      const source = bank.find((q) => q.id === p.questionId)!
      expect(p.subject).toBe(SUBJECT)
      expect(p.statement).toBe(source.statement)
      if (source.code === undefined) {
        expect('code' in p).toBe(false)
      } else {
        expect(p.code).toBe(source.code)
      }
    }
    // A categoria tem perguntas com e sem code: os dois ramos foram exercitados.
    expect(prompts.some((p) => p.code !== undefined)).toBe(true)
    expect(prompts.some((p) => p.code === undefined)).toBe(true)
  })

  it.each(['easy', 'normal', 'hard'] as const)(
    'na dificuldade %s serve só perguntas daquele nível (todas elas)',
    (difficulty) => {
      const bank = questionsBySubject[SUBJECT]
      const expected = bank
        .filter((q) => q.difficulty === difficulty)
        .map((q) => q.id)
        .sort()
      expect(expected.length).toBeGreaterThan(0)
      const served = serveAll(difficulty)
        .map((p) => p.questionId)
        .sort()
      expect(served).toEqual(expected)
    },
  )
})
