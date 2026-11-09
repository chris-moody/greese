import { describe, expect, it } from 'vitest'
import {
  composeStageTransform,
  fromEditSceneLocal,
  invertStageTransform,
  toEditSceneLocal,
} from './editInPlace.ts'

const scaled = { a: 2, b: 0, c: 0, d: 2, tx: 10, ty: 20 }

describe('editing in place', () => {
  it('composes an instance’s placement inside the frame already in effect', () => {
    const local = { a: 1, b: 0, c: 0, d: 1, tx: 3, ty: 4 }
    expect(composeStageTransform(local, scaled)).toEqual({
      a: 2,
      b: 0,
      c: 0,
      d: 2,
      tx: 16,
      ty: 28,
    })
    expect(composeStageTransform(local, null)).toBe(local)
  })

  it('takes a root point into the scene and back', () => {
    const turned = { a: 0, b: 1, c: -1, d: 0, tx: 5, ty: 0 }
    for (const m of [scaled, turned]) {
      const p = { x: 7, y: -3 }
      const local = toEditSceneLocal(m, p)
      const back = fromEditSceneLocal(m, local)
      expect(back.x).toBeCloseTo(p.x)
      expect(back.y).toBeCloseTo(p.y)
    }
    expect(toEditSceneLocal(scaled, { x: 12, y: 24 })).toEqual({ x: 1, y: 2 })
  })

  it('leaves a point alone at the root, or through a flattening transform', () => {
    const p = { x: 1, y: 2 }
    expect(toEditSceneLocal(null, p)).toBe(p)
    const flat = { a: 0, b: 0, c: 0, d: 1, tx: 0, ty: 0 }
    expect(invertStageTransform(flat)).toBeNull()
    expect(toEditSceneLocal(flat, p)).toBe(p)
  })
})
