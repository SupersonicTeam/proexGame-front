import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionCreatedEvent } from '../types'

/**
 * Regressão: após auto-reconnect (refresh da página no lobby), o cliente precisa
 * RESTAURAR a identidade local (`playerId`) e propagá-la ao store. Sem isso,
 * `useMyPlayer()` devolve null, `isHost` vira false e o HOST perde o botão
 * "Iniciar partida". A identidade já está nas creds salvas em localStorage.
 */

/* ---- Fake socket controlável no lugar do socket.io-client real ---- */
type Handler = (...args: unknown[]) => void

class FakeSocket {
  private handlers = new Map<string, Handler[]>()
  /** Emissões do cliente → servidor (event, payload, ackCallback?). */
  emitted: { event: string; payload?: unknown; ack?: Handler }[] = []

  on(event: string, handler: Handler): this {
    const list = this.handlers.get(event) ?? []
    list.push(handler)
    this.handlers.set(event, list)
    return this
  }

  emit(event: string, payload?: unknown, ack?: Handler): this {
    this.emitted.push({ event, payload, ack })
    return this
  }

  removeAllListeners(): this {
    this.handlers.clear()
    return this
  }

  disconnect(): this {
    return this
  }

  /** Simula um evento vindo do servidor. */
  serverEmit(event: string, payload?: unknown): void {
    for (const h of this.handlers.get(event) ?? []) h(payload)
  }

  /** Última emissão do cliente para um dado evento. */
  lastEmit(event: string) {
    return [...this.emitted].reverse().find((e) => e.event === event)
  }
}

const fakeSocket = new FakeSocket()
vi.mock('socket.io-client', () => ({
  io: () => fakeSocket,
}))

// Import depois do mock para que o construtor use o fake.
const { SocketGameClient } = await import('./SocketGameClient')

describe('SocketGameClient — auto-reconnect restaura a identidade', () => {
  beforeEach(() => {
    localStorage.clear()
    fakeSocket.emitted = []
  })
  afterEach(() => {
    localStorage.clear()
  })

  it('reemite sessionCreated com o playerId salvo após reconnect no lobby', () => {
    // Cenário pós-refresh: creds do host persistidas, store/cliente sem identidade.
    localStorage.setItem(
      'tds-creds',
      JSON.stringify({ code: '01469', playerId: 'host-1' }),
    )

    const client = new SocketGameClient('')

    const identities: SessionCreatedEvent[] = []
    client.on('sessionCreated', (e) => identities.push(e))

    // Transporte (re)conecta → cliente deve reenviar reconnect com as creds.
    fakeSocket.serverEmit('connect')
    const reconnectEmit = fakeSocket.lastEmit('reconnect')
    expect(reconnectEmit?.payload).toEqual({ code: '01469', playerId: 'host-1' })

    // Servidor responde com o ACK e o lobbyState (host marcado como isHost).
    reconnectEmit?.ack?.({ code: '01469', playerId: 'host-1' })
    fakeSocket.serverEmit('lobbyState', {
      code: '01469',
      status: 'lobby',
      hostId: 'host-1',
      difficulty: 'normal',
      players: [
        { id: 'host-1', name: 'murillo', connected: true, isHost: true },
        { id: 'p-2', name: 'Luiz', connected: true, isHost: false },
      ],
    })

    // O cliente precisa ter reestabelecido a identidade local para o store.
    expect(identities.length).toBeGreaterThan(0)
    expect(identities.at(-1)?.playerId).toBe('host-1')
  })
})
