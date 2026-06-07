import type { GameEventHandler, GameEventMap, GameEventName } from '../types'

/**
 * Emissor de eventos tipado e minimalista, compartilhado pelas implementações
 * de GameClient. Mantém um conjunto de handlers por nome de evento.
 */
export class TypedEmitter {
  private handlers: {
    [K in GameEventName]?: Set<GameEventHandler<K>>
  } = {}

  on<K extends GameEventName>(event: K, handler: GameEventHandler<K>): void {
    let set = this.handlers[event] as Set<GameEventHandler<K>> | undefined
    if (!set) {
      set = new Set<GameEventHandler<K>>()
      this.handlers[event] = set as (typeof this.handlers)[K]
    }
    set.add(handler)
  }

  off<K extends GameEventName>(event: K, handler: GameEventHandler<K>): void {
    const set = this.handlers[event] as Set<GameEventHandler<K>> | undefined
    set?.delete(handler)
  }

  emit<K extends GameEventName>(event: K, payload: GameEventMap[K]): void {
    const set = this.handlers[event] as Set<GameEventHandler<K>> | undefined
    if (!set) return
    for (const handler of [...set]) handler(payload)
  }

  clear(): void {
    this.handlers = {}
  }
}
