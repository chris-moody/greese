import { describe, expect, it } from 'vitest'
import { timeModeReducer, timeModeActions } from './timeMode.slice.ts'
import { TimeMode } from '../core/types/resolution.types.ts'

const init = () => timeModeReducer(undefined, { type: '@@INIT' })

describe('timeMode', () => {
  it('starts with no scope overrides', () => {
    expect(init().modeByScope).toEqual({})
  })

  it('setTimeMode records the mode per scope', () => {
    let state = timeModeReducer(
      init(),
      timeModeActions.setTimeMode({ scope: 'root', mode: TimeMode.Beats })
    )
    state = timeModeReducer(
      state,
      timeModeActions.setTimeMode({ scope: 'loop:a', mode: TimeMode.Time })
    )
    expect(state.modeByScope).toEqual({ root: TimeMode.Beats, 'loop:a': TimeMode.Time })
  })

  it('hydrate replaces the whole map (e.g. loading a persisted document)', () => {
    let state = timeModeReducer(
      init(),
      timeModeActions.setTimeMode({ scope: 'root', mode: TimeMode.Frames })
    )
    state = timeModeReducer(state, timeModeActions.hydrate({ 'loop:b': TimeMode.Beats }))
    expect(state.modeByScope).toEqual({ 'loop:b': TimeMode.Beats })
  })
})
