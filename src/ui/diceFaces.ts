/**
 * Dados puros do dado d6: posições dos pips por face e a rotação 3D que traz
 * cada valor para a frente do cubo. Sem dependências de React — testável.
 */

/** Posições dos pips (grade 3x3, [linha, coluna] de 0 a 2) para cada face. */
export const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],
  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],
  6: [
    [0, 0],
    [0, 2],
    [1, 0],
    [1, 2],
    [2, 0],
    [2, 2],
  ],
}

/**
 * Layout do cubo: cada face é posicionada com uma rotação + translateZ.
 * Faces opostas somam 7 (1↔6, 2↔5, 3↔4).
 *   front  = 1  → rotateY(0)
 *   back   = 6  → rotateY(180)
 *   right  = 3  → rotateY(90)
 *   left   = 4  → rotateY(-90)
 *   top    = 2  → rotateX(90)
 *   bottom = 5  → rotateX(-90)
 */
export const FACE_TRANSFORMS: Record<number, { rotX: number; rotY: number }> = {
  1: { rotX: 0, rotY: 0 },
  6: { rotX: 0, rotY: 180 },
  3: { rotX: 0, rotY: 90 },
  4: { rotX: 0, rotY: -90 },
  2: { rotX: 90, rotY: 0 },
  5: { rotX: -90, rotY: 0 },
}

/**
 * Rotação a aplicar ao cubo para que a face `value` fique de frente.
 * É a rotação INVERSA da posição da face. Para os eixos usados aqui, basta
 * negar; top/bottom usam rotateX oposto.
 */
export function faceRotation(value: number): { rotX: number; rotY: number } {
  switch (value) {
    case 1:
      return { rotX: 0, rotY: 0 }
    case 6:
      return { rotX: 0, rotY: -180 }
    case 3:
      return { rotX: 0, rotY: -90 }
    case 4:
      return { rotX: 0, rotY: 90 }
    case 2:
      return { rotX: -90, rotY: 0 }
    case 5:
      return { rotX: 90, rotY: 0 }
    default:
      return { rotX: 0, rotY: 0 }
  }
}
