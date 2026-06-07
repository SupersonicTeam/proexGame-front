/**
 * Escolhe quantas colunas o tabuleiro deve ter, dado o número de casas e a
 * proporção (largura/altura) do contêiner. Os limites mudam por breakpoint:
 * retrato é estreito (poucas colunas), paisagem é largo (mais colunas).
 *
 * As faixas são propositalmente BAIXAS: menos colunas alongam a "cobra" e
 * geram mais linhas, reforçando o aspecto sinuoso da trilha. Pura/determinística.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function pickColumns(tileCount: number, aspect: number): number {
  let min: number
  let max: number

  if (aspect < 0.75) {
    // Retrato (mobile em pé): trilha alta e estreita.
    min = 3
    max = 4
  } else if (aspect >= 1.3) {
    // Paisagem (desktop): trilha mais larga.
    min = 5
    max = 6
  } else {
    // Intermediário (quadrado-ish / tablet).
    min = 4
    max = 5
  }

  const ideal = Math.round(Math.sqrt(tileCount * aspect))
  return clamp(ideal, min, max)
}
