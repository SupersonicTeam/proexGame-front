/**
 * Camada de "playback" do dado: assina os eventos do client diretamente
 * (`diceResult`, `orderResult`, `gameStarted`) e serializa os arremessos numa
 * fila, processados UM A UM. Mantém as posições VISUAIS dos peões — que só
 * avançam DEPOIS que o dado assenta — desacoplando o visual do estado lógico
 * (que o store atualiza na hora). Sem isso, o peão andaria antes do dado cair.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { getGameClient, useGameStore } from '../../game/store/gameStore'
import type {
  DiceResultEvent,
  GameStartedEvent,
  OrderResultEvent,
} from '../../game/types'

export interface ThrowItem {
  id: number
  kind: 'move' | 'order'
  value: number
  playerId?: string
  toSquare?: number
}

/** Tempo após o dado assentar para o peão andar antes do próximo arremesso. */
const POST_MOVE_MS = 700

export interface DiceThrowsApi {
  activeThrow: ThrowItem | null
  visualSquares: Record<string, number>
  isThrowing: boolean
  onThrowSettled: () => void
}

export function useDiceThrows(): DiceThrowsApi {
  const queueRef = useRef<ThrowItem[]>([])
  const activeRef = useRef<ThrowItem | null>(null)
  const idRef = useRef(0)
  const nextTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [activeThrow, setActiveThrow] = useState<ThrowItem | null>(null)
  const [visualSquares, setVisualSquares] = useState<Record<string, number>>({})

  const processNext = useCallback(() => {
    if (activeRef.current) return
    const next = queueRef.current.shift()
    if (!next) return
    activeRef.current = next
    setActiveThrow(next)
  }, [])

  const enqueue = useCallback(
    (item: ThrowItem) => {
      queueRef.current.push(item)
      processNext()
    },
    [processNext],
  )

  const onThrowSettled = useCallback(() => {
    const item = activeRef.current
    if (!item) return
    if (item.kind === 'move' && item.playerId && item.toSquare !== undefined) {
      const { playerId, toSquare } = item
      setVisualSquares((prev) => ({ ...prev, [playerId]: toSquare }))
    }
    activeRef.current = null
    setActiveThrow(null)
    // Dá tempo de o peão andar antes do próximo arremesso aparecer.
    nextTimer.current = setTimeout(processNext, POST_MOVE_MS)
  }, [processNext])

  useEffect(() => {
    const client = getGameClient()

    const onDice = (e: DiceResultEvent) => {
      idRef.current += 1
      enqueue({
        id: idRef.current,
        kind: 'move',
        value: e.value,
        playerId: e.playerId,
        toSquare: e.toSquare,
      })
    }

    const onOrder = (e: OrderResultEvent) => {
      const myId = useGameStore.getState().myPlayerId
      const mine = e.rolls.find((r) => r.playerId === myId) ?? e.rolls[0]
      if (!mine) return
      idRef.current += 1
      enqueue({ id: idRef.current, kind: 'order', value: mine.value })
    }

    const onStarted = (e: GameStartedEvent) => {
      // Reinicia a fila e fixa as posições visuais iniciais (todas em 0).
      queueRef.current = []
      activeRef.current = null
      if (nextTimer.current) clearTimeout(nextTimer.current)
      setActiveThrow(null)
      setVisualSquares(
        Object.fromEntries(e.session.players.map((p) => [p.id, p.square])),
      )
    }

    client.on('diceResult', onDice)
    client.on('orderResult', onOrder)
    client.on('gameStarted', onStarted)

    return () => {
      client.off('diceResult', onDice)
      client.off('orderResult', onOrder)
      client.off('gameStarted', onStarted)
      if (nextTimer.current) clearTimeout(nextTimer.current)
    }
  }, [enqueue, processNext])

  return {
    activeThrow,
    visualSquares,
    isThrowing: activeThrow !== null,
    onThrowSettled,
  }
}
