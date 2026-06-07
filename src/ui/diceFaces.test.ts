import { PIPS, faceRotation, FACE_TRANSFORMS } from './diceFaces'

describe('diceFaces', () => {
  it('cada face tem um número de pips igual ao seu valor', () => {
    for (let v = 1; v <= 6; v++) {
      expect(PIPS[v].length).toBe(v)
    }
  })

  it('faceRotation traz cada valor para a frente (rotação inversa da face)', () => {
    expect(faceRotation(1)).toEqual({ rotX: 0, rotY: 0 })
    expect(faceRotation(3)).toEqual({ rotX: 0, rotY: -90 })
    expect(faceRotation(4)).toEqual({ rotX: 0, rotY: 90 })
    expect(faceRotation(2)).toEqual({ rotX: -90, rotY: 0 })
    expect(faceRotation(5)).toEqual({ rotX: 90, rotY: 0 })
  })

  it('faceRotation é o inverso da posição da face (eixo único)', () => {
    for (let v = 1; v <= 6; v++) {
      const face = FACE_TRANSFORMS[v]
      const inv = faceRotation(v)
      // Um dos eixos é zero; o outro é o oposto (mod 360 p/ o caso 180).
      expect((face.rotX + inv.rotX) % 360 === 0).toBe(true)
      expect((face.rotY + inv.rotY) % 360 === 0).toBe(true)
    }
  })
})
