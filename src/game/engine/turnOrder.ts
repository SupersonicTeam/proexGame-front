import { rollD6 } from './dice'
import type { OrderRollEntry } from '../types'

/**
 * Resultado de uma rodada de rolagem para definir a ordem (RF-04).
 *
 * - `rolls`: o valor que cada jogador tirou nesta rodada.
 * - `tiedPlayerIds`: jogadores empatados no MAIOR valor — precisam re-rolar.
 *   Vazio quando não há empate no topo.
 * - `turnOrder`: ordem final (maior → menor) quando resolvida; `null` enquanto
 *   houver empate no topo a desempatar.
 */
export interface OrderRollResult {
  rolls: OrderRollEntry[]
  tiedPlayerIds: string[]
  turnOrder: string[] | null
}

/**
 * Uma rodada de rolagem para ordem de turnos (RF-04).
 *
 * Cada jogador rola 1d6; o maior valor joga primeiro. Se houver empate no MAIOR
 * valor, os empatados precisam re-rolar entre si (`turnOrder=null`,
 * `tiedPlayerIds` preenchido) — o chamador re-invoca `rollForOrder` apenas com
 * os ids empatados e encaixa o sub-resultado no topo (ver `resolveOrder`).
 *
 * Empates fora do topo são resolvidos de forma determinística mantendo a ordem
 * de entrada de `playerIds` (estável) — suficiente e simples para a Sprint 1.
 */
export function rollForOrder(
  playerIds: string[],
  rng: () => number = Math.random,
): OrderRollResult {
  const rolls: OrderRollEntry[] = playerIds.map((playerId) => ({
    playerId,
    value: rollD6(rng),
  }))

  const maxValue = Math.max(...rolls.map((r) => r.value))
  const tied = rolls.filter((r) => r.value === maxValue)

  if (tied.length > 1) {
    return {
      rolls,
      tiedPlayerIds: tied.map((r) => r.playerId),
      turnOrder: null,
    }
  }

  // Ordenação estável por valor desc: empates fora do topo mantêm a ordem de
  // entrada (Array.prototype.sort é estável no ES2019+).
  const indexOf = new Map(playerIds.map((id, i) => [id, i]))
  const turnOrder = [...rolls]
    .sort(
      (a, b) =>
        b.value - a.value ||
        indexOf.get(a.playerId)! - indexOf.get(b.playerId)!,
    )
    .map((r) => r.playerId)

  return { rolls, tiedPlayerIds: [], turnOrder }
}

/**
 * Resolve a ordem completa atravessando múltiplas rodadas de desempate.
 *
 * Faz a rolagem entre todos os jogadores; enquanto houver empate no topo,
 * re-rola APENAS os empatados para decidir quais ocupam as primeiras posições,
 * e então acrescenta os demais jogadores (já resolvidos) abaixo. Útil para
 * testes e para o cliente resolver tudo de uma vez quando não precisa animar
 * cada rodada.
 *
 * Garante terminação prática: usa o `rng` fornecido; com `Math.random` o empate
 * eventualmente se desfaz.
 */
export function resolveOrder(
  playerIds: string[],
  rng: () => number = Math.random,
): { rounds: OrderRollResult[]; turnOrder: string[] } {
  const rounds: OrderRollResult[] = []
  let contenders = [...playerIds]
  // Jogadores já posicionados ABAIXO do grupo que ainda disputa o topo.
  let tail: string[] = []

  // Loop de desempate apenas para o TOPO.
  for (;;) {
    const result = rollForOrder(contenders, rng)
    rounds.push(result)

    if (result.turnOrder) {
      return { rounds, turnOrder: [...result.turnOrder, ...tail] }
    }

    // Empate no topo: os não-empatados desta rodada já ficam definidos logo
    // abaixo do grupo que ainda disputa o topo. Seguimos só com os empatados.
    const tiedSet = new Set(result.tiedPlayerIds)
    const losers = result.rolls
      .filter((r) => !tiedSet.has(r.playerId))
      .sort((a, b) => b.value - a.value)
      .map((r) => r.playerId)
    tail = [...losers, ...tail]
    contenders = result.tiedPlayerIds
  }
}
