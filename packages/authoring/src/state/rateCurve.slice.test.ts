import { describe, expect, it } from 'vitest'
import { rateCurveReducer, rateCurveActions } from './rateCurve.slice.ts'
import type { LevelPoint } from '../core/timeline/levelEditor.types.ts'

const init = () => rateCurveReducer(undefined, { type: '@@INIT' })

const points: LevelPoint[] = [
  { id: 'p1', tick: 0, value: 24 },
  { id: 'p2', tick: 1000, value: 30 },
]

describe('rateCurve', () => {
  it('starts with no scope overrides', () => {
    expect(init().curveByScope).toEqual({})
  })

  it('setRateCurve records the curve per scope', () => {
    const state = rateCurveReducer(
      init(),
      rateCurveActions.setRateCurve({ scope: 'root', points })
    )
    expect(state.curveByScope.root).toEqual(points)
  })

  it('clearRateCurve removes the scope override (absent = flat scalar)', () => {
    let state = rateCurveReducer(
      init(),
      rateCurveActions.setRateCurve({ scope: 'root', points })
    )
    state = rateCurveReducer(state, rateCurveActions.clearRateCurve({ scope: 'root' }))
    expect(state.curveByScope.root).toBeUndefined()
  })

  it('hydrate replaces the whole map (e.g. loading a persisted document)', () => {
    let state = rateCurveReducer(
      init(),
      rateCurveActions.setRateCurve({ scope: 'root', points })
    )
    state = rateCurveReducer(state, rateCurveActions.hydrate({ 'loop:b': points }))
    expect(state.curveByScope).toEqual({ 'loop:b': points })
  })
})
