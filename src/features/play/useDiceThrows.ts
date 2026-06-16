/**
 * Camada de "playback" do dado: assina os eventos do client diretamente
 * (`diceResult`, `orderResult`, `gameStarted`) e serializa os arremessos numa
 * fila, processados UM A UM. Mantém as posições VISUAIS dos peões — que só
 * avançam DEPOIS que o dado assenta — desacoplando o visual do estado lógico
 * (que o store atualiza na hora). Sem isso, o peão andaria antes do dado cair.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { getGameClient } from '../../game/store/gameStore'
import type {
  AnswerResultEvent,
  DiceResultEvent,
  GameStartedEvent,
  OrderRollEvent,
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

/**
 * Limite de segurança para um arremesso assentar. Se o `onSettled` do dado não
 * disparar (animação interrompida/desmontada), forçamos o assentamento para o
 * peão não ficar preso e o modal de pergunta (gated por `!isThrowing`) não sumir.
 * Folgado o bastante para nunca cortar a animação normal (~2,4s).
 */
const SETTLE_SAFETY_MS = 5000

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

  // Rede de segurança: se um arremesso fica ativo além do limite (o `onSettled`
  // do dado não disparou), força o assentamento. Evita o peão preso e o modal de
  // pergunta sumido por `isThrowing` travado em true.
  useEffect(() => {
    if (!activeThrow) return
    const w = setTimeout(onThrowSettled, SETTLE_SAFETY_MS)
    return () => clearTimeout(w)
  }, [activeThrow, onThrowSettled])

  useEffect(() => {
    const client = getGameClient()

    const onDice = (e: DiceResultEvent) => {
      // Ancora a posição VISUAL na ORIGEM antes do movimento lógico. Sem isto,
      // se o jogador ainda não tem entrada em `visualSquares`, a UI cai na casa
      // lógica (já atualizada para o destino) e o peão "salta" durante a rolagem
      // (bug: peão move enquanto o dado rola). Só semeia se faltar a entrada.
      setVisualSquares((prev) =>
        prev[e.playerId] !== undefined
          ? prev
          : { ...prev, [e.playerId]: e.fromSquare },
      )
      idRef.current += 1
      enqueue({
        id: idRef.current,
        kind: 'move',
        value: e.value,
        playerId: e.playerId,
        toSquare: e.toSquare,
      })
    }

    // S4: cada rolagem de ordem (de qualquer jogador) anima no overlay.
    const onOrderRoll = (e: OrderRollEvent) => {
      idRef.current += 1
      enqueue({ id: idRef.current, kind: 'order', value: e.value })
    }

    // Movimento por resposta (acerto/erro) não passa pelo overlay do dado;
    // move o peão diretamente quando o resultado chega.
    const onAnswer = (e: AnswerResultEvent) => {
      setVisualSquares((prev) => ({ ...prev, [e.playerId]: e.toSquare }))
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
    client.on('orderRoll', onOrderRoll)
    client.on('answerResult', onAnswer)
    client.on('gameStarted', onStarted)

    return () => {
      client.off('diceResult', onDice)
      client.off('orderRoll', onOrderRoll)
      client.off('answerResult', onAnswer)
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
