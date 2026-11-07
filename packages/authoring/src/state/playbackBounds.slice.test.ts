import { describe, expect, it } from 'vitest'
import { playbackBoundsReducer, playbackBoundsActions } from './playbackBounds.slice.ts'

const init = () => playbackBoundsReducer(undefined, { type: '@@INIT' })

describe('playbackBounds', () => {
  it('starts with no scope overrides', () => {
    expect(init().boundsByScope).toEqual({})
  })

  it('setBounds records bounds per scope', () => {
    const state = playbackBoundsReducer(
      init(),
      playbackBoundsActions.setBounds({ scope: 'root', bounds: { start: 5, end: 20 } })
    )
    expect(state.boundsByScope.root).toEqual({ start: 5, end: 20 })
  })

  it('clearBounds removes the scope override entirely (absent = full range)', () => {
    let state = playbackBoundsReducer(
      init(),
      playbackBoundsActions.setBounds({ scope: 'root', bounds: { start: 5, end: 20 } })
    )
    state = playbackBoundsReducer(
      state,
      playbackBoundsActions.clearBounds({ scope: 'root' })
    )
    expect(state.boundsByScope.root).toBeUndefined()
  })

  it('hydrate replaces the whole map (e.g. loading a persisted document)', () => {
    let state = playbackBoundsReducer(
      init(),
      playbackBoundsActions.setBounds({ scope: 'root', bounds: { start: 5, end: 20 } })
    )
    state = playbackBoundsReducer(
      state,
      playbackBoundsActions.hydrate({ 'loop:b': { start: 0, end: 10 } })
    )
    expect(state.boundsByScope).toEqual({ 'loop:b': { start: 0, end: 10 } })
  })
})
