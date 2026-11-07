import { describe, expect, it } from 'vitest'
import { timeSignatureReducer, timeSignatureActions } from './timeSignature.slice.ts'

const init = () => timeSignatureReducer(undefined, { type: '@@INIT' })

describe('timeSignature', () => {
  it('starts with no scope overrides', () => {
    expect(init().changesByScope).toEqual({})
  })

  it('addChange appends and keeps the list sorted by tick', () => {
    let state = timeSignatureReducer(
      init(),
      timeSignatureActions.addChange({
        scope: 'root',
        tick: 3840,
        numerator: 3,
        denominator: 4,
      })
    )
    state = timeSignatureReducer(
      state,
      timeSignatureActions.addChange({
        scope: 'root',
        tick: 0,
        numerator: 4,
        denominator: 4,
      })
    )
    expect(state.changesByScope.root!.map((c) => c.tick)).toEqual([0, 3840])
  })

  it('addChange at an existing tick replaces the change there', () => {
    let state = timeSignatureReducer(
      init(),
      timeSignatureActions.addChange({
        scope: 'root',
        tick: 0,
        numerator: 4,
        denominator: 4,
      })
    )
    state = timeSignatureReducer(
      state,
      timeSignatureActions.addChange({
        scope: 'root',
        tick: 0,
        numerator: 3,
        denominator: 4,
      })
    )
    expect(state.changesByScope.root).toHaveLength(1)
    expect(state.changesByScope.root![0]!.numerator).toBe(3)
  })

  it('updateChange edits numerator/denominator in place', () => {
    let state = timeSignatureReducer(
      init(),
      timeSignatureActions.addChange({
        scope: 'root',
        tick: 0,
        numerator: 4,
        denominator: 4,
      })
    )
    const id = state.changesByScope.root![0]!.id
    state = timeSignatureReducer(
      state,
      timeSignatureActions.updateChange({
        scope: 'root',
        id,
        numerator: 6,
        denominator: 8,
      })
    )
    expect(state.changesByScope.root![0]).toMatchObject({ numerator: 6, denominator: 8 })
  })

  it('removeChange drops the change by id', () => {
    let state = timeSignatureReducer(
      init(),
      timeSignatureActions.addChange({
        scope: 'root',
        tick: 0,
        numerator: 4,
        denominator: 4,
      })
    )
    const id = state.changesByScope.root![0]!.id
    state = timeSignatureReducer(
      state,
      timeSignatureActions.removeChange({ scope: 'root', id })
    )
    expect(state.changesByScope.root).toEqual([])
  })

  it('hydrate replaces the whole map (e.g. loading a persisted document)', () => {
    let state = timeSignatureReducer(
      init(),
      timeSignatureActions.addChange({
        scope: 'root',
        tick: 0,
        numerator: 4,
        denominator: 4,
      })
    )
    const persisted = [{ id: 'x1', tick: 0, numerator: 3, denominator: 4 }]
    state = timeSignatureReducer(
      state,
      timeSignatureActions.hydrate({ 'loop:b': persisted })
    )
    expect(state.changesByScope).toEqual({ 'loop:b': persisted })
  })
})
