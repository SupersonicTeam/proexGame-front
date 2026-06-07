/**
 * Quando vários jogadores ocupam a mesma casa, espalha seus tokens em volta do
 * centro para que todos fiquem visíveis (1 = centro, 2 = par horizontal, 3+ =
 * pétalas em círculo). Puro.
 */
import { RADIUS } from './computeLayout'

const SPREAD = RADIUS * 0.45

export function computeClusterOffsets(
  count: number,
): { dx: number; dy: number }[] {
  if (count <= 1) {
    return [{ dx: 0, dy: 0 }]
  }

  if (count === 2) {
    // Par horizontal: 180° (esquerda) e 0° (direita).
    return [
      { dx: Math.cos(Math.PI) * SPREAD, dy: Math.sin(Math.PI) * SPREAD },
      { dx: Math.cos(0) * SPREAD, dy: Math.sin(0) * SPREAD },
    ]
  }

  // Pétalas: distribuídas uniformemente começando no topo (-90°).
  const offsets: { dx: number; dy: number }[] = []
  for (let j = 0; j < count; j++) {
    const angle = -Math.PI / 2 + j * ((2 * Math.PI) / count)
    offsets.push({ dx: Math.cos(angle) * SPREAD, dy: Math.sin(angle) * SPREAD })
  }
  return offsets
}

/** Raio de cada token conforme quantos compartilham a casa (menor = mais). */
export function tokenRadiusForCount(count: number): number {
  if (count <= 1) return RADIUS * 0.5
  if (count <= 2) return RADIUS * 0.42
  return RADIUS * 0.34
}
