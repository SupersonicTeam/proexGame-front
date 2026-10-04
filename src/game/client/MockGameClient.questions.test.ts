import { describe, expect, it } from 'vitest'
import { MockGameClient } from './MockGameClient'
import { questionsBySubject } from '../../data/questions'
import type { QuestionPromptEvent, SessionState } from '../types'

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

describe('MockGameClient — perguntas de lógica de programação', () => {
  it('emite questionPrompt com o code de cada pergunta da categoria', () => {
    const client = new MockGameClient({ botCount: 0, rng: () => 0 })
    const prompts: QuestionPromptEvent[] = []
    client.on('questionPrompt', (e) => prompts.push(e))
    client.createSession({ name: 'Ana', difficulty: 'easy' })

    const internals = client as unknown as MockInternals
    const me = internals.session.players[0]
    me.square = 1
    internals.session.board.subjectBySquare[1] = SUBJECT

    const bank = questionsBySubject[SUBJECT]
    for (let i = 0; i < bank.length; i++) {
      internals.pendingQuestion = null
      internals.triggerQuestion(me)
    }
    client.dispose()

    expect(prompts).toHaveLength(bank.length)
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
})
