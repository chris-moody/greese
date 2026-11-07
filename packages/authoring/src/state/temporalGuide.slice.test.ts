import { describe, expect, it } from 'vitest'
import { temporalGuideReducer, temporalGuideActions } from './temporalGuide.slice.ts'
import { PulseLayerId } from '../core/timeline/resolutions/pulseBoundaries.helpers.ts'

const init = () => temporalGuideReducer(undefined, { type: '@@INIT' })

describe('temporalGuide', () => {
  it('starts with no scope overrides (guide off everywhere)', () => {
    expect(init().enabledLayersByScope).toEqual({})
  })

  it('toggleLayer enables a layer for a scope', () => {
    const state = temporalGuideReducer(
      init(),
      temporalGuideActions.toggleLayer({ scope: 'root', layer: PulseLayerId.beat })
    )
    expect(state.enabledLayersByScope.root).toEqual([PulseLayerId.beat])
  })

  it('toggleLayer disables an already-enabled layer', () => {
    let state = temporalGuideReducer(
      init(),
      temporalGuideActions.toggleLayer({ scope: 'root', layer: PulseLayerId.beat })
    )
    state = temporalGuideReducer(
      state,
      temporalGuideActions.toggleLayer({ scope: 'root', layer: PulseLayerId.beat })
    )
    expect(state.enabledLayersByScope.root).toEqual([])
  })

  it('tracks layers independently per scope', () => {
    let state = temporalGuideReducer(
      init(),
      temporalGuideActions.toggleLayer({ scope: 'root', layer: PulseLayerId.beat })
    )
    state = temporalGuideReducer(
      state,
      temporalGuideActions.toggleLayer({ scope: 'loop:a', layer: PulseLayerId.measure })
    )
    expect(state.enabledLayersByScope).toEqual({
      root: [PulseLayerId.beat],
      'loop:a': [PulseLayerId.measure],
    })
  })

  it('supports multiple enabled layers on the same scope', () => {
    let state = temporalGuideReducer(
      init(),
      temporalGuideActions.toggleLayer({ scope: 'root', layer: PulseLayerId.beat })
    )
    state = temporalGuideReducer(
      state,
      temporalGuideActions.toggleLayer({ scope: 'root', layer: PulseLayerId.measure })
    )
    expect(state.enabledLayersByScope.root).toEqual([
      PulseLayerId.beat,
      PulseLayerId.measure,
    ])
  })
})
