import { describe, expect, it, vi } from 'vitest'
import { BACKEND_SUBJECTS } from '../types'
import type { QuestionPromptEvent } from '../types'

/**
 * Feature logica-programacao (PROG-07/10): o `questionPrompt` do backend pode
 * trazer `code` (pseudocódigo). O cliente mapeia o payload campo a campo, então
 * precisa repassar `code` explicitamente — e omiti-lo quando não vier.
 */

type Handler = (...args: unknown[]) => void

class FakeSocket {
  private handlers = new Map<string, Handler[]>()
  on(event: string, handler: Handler): this {
    const list = this.handlers.get(event) ?? []
    list.push(handler)
    this.handlers.set(event, list)
    return this
  }
  emit(): this {
    return this
  }
  removeAllListeners(): this {
    this.handlers.clear()
    return this
  }
  disconnect(): this {
    return this
  }
  serverEmit(event: string, payload?: unknown): void {
    for (const h of this.handlers.get(event) ?? []) h(payload)
  }
}

const fakeSocket = new FakeSocket()
vi.mock('socket.io-client', () => ({
  io: () => fakeSocket,
}))

const { SocketGameClient } = await import('./SocketGameClient')

const CODE = 's <- 0\npara i de 1 ate 4 faca\n  s <- s + i\nfimpara'

function receive(payload: Record<string, unknown>): QuestionPromptEvent {
  const client = new SocketGameClient('')
  const got: QuestionPromptEvent[] = []
  client.on('questionPrompt', (e) => got.push(e))
  fakeSocket.serverEmit('questionPrompt', payload)
  expect(got).toHaveLength(1)
  return got[0]
}

describe('SocketGameClient — questionPrompt com pseudocódigo', () => {
  it('repassa code idêntico ao enviado pelo backend', () => {
    const e = receive({
      questionId: 'laco-0013',
      subject: 'lacos-de-repeticao',
      statement: 'O que este algoritmo mostra?',
      code: CODE,
      options: ['15', '10', '5', '12345'],
    })
    expect(e.code).toBe(CODE)
    expect(e.statement).toBe('O que este algoritmo mostra?')
    expect(e.subject).toBe('lacos-de-repeticao')
    expect(e.options).toEqual(['15', '10', '5', '12345'])
  })

  it('omite a chave code quando o backend não envia', () => {
    const e = receive({
      questionId: 'alg-0001',
      subject: 'algoritmos',
      statement: 'O que é um algoritmo?',
      options: ['a', 'b', 'c', 'd'],
    })
    expect('code' in e).toBe(false)
  })
})

describe('BACKEND_SUBJECTS — categorias de lógica de programação', () => {
  it('lista exatamente as 8 categorias servidas pelo backend', () => {
    expect([...BACKEND_SUBJECTS].sort()).toEqual([
      'algoritmos',
      'busca-e-ordenacao',
      'condicionais',
      'funcoes',
      'lacos-de-repeticao',
      'operadores-logicos',
      'variaveis-e-tipos',
      'vetores',
    ])
  })
})
