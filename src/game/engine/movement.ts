/**
 * Movimentação simples da Sprint 1.
 *
 * Avança `dice` casas a partir de `fromSquare`. Se alcançar OU ultrapassar a
 * casa final (`boardSize`, a CHEGADA), o jogador vence e `toSquare` é fixado em
 * `boardSize` (reach-or-pass — RF-06).
 *
 * TODO (Sprint 3): avanço/recuo por dificuldade da pergunta + tiers (acerto,
 * erro proximal, erro grave) entrará num módulo/parametro próprio.
 */
export function applyDiceMove(
  fromSquare: number,
  dice: number,
  boardSize: number,
): { toSquare: number; won: boolean } {
  const target = fromSquare + dice
  if (target >= boardSize) {
    return { toSquare: boardSize, won: true }
  }
  return { toSquare: target, won: false }
}
