import { describe, expect, it } from 'vitest'
import { layersActions } from '../state/layers.slice.ts'
import { makeLayer } from '../core/layers/layers.ts'
import { createAuthoringEnvironment } from './environment.tsx'
import { TimingMode } from '../core/types/timing.types.ts'

describe('createAuthoringEnvironment', () => {
  it('fills the config from defaults and seeds the timeline’s length', () => {
    const env = createAuthoringEnvironment({
      config: {
        mediaType: 'svg',
        timing: {
          mode: TimingMode.FPS,
          fps: 30,
          frameCount: 90,
          loop: true,
          playbackSpeed: 1,
        },
      },
    })
    expect(env.config.mediaType).toBe('svg')
    expect(env.config.layerTypes.map((t) => t.layerType)).toEqual(['layer'])
    expect(env.store.getState().playback.frameCount).toBe(90)
    // Seeding the length isn't an edit to undo.
    expect(env.store.getState().history.canUndo).toBe(false)
  })

  it('serializes the document and loads it into another editor', () => {
    const source = createAuthoringEnvironment({ meta: { id: 'doc', name: 'Logo' } })
    const layer = makeLayer({ name: 'Star', layerType: 'layer' })
    source.store.dispatch(layersActions.addLayer({ layer }))
    const project = source.serialize()
    expect(project).toMatchObject({ id: 'doc', name: 'Logo', mediaType: 'generic' })

    const target = createAuthoringEnvironment()
    target.deserialize(project)
    const { layers } = target.store.getState()
    expect(layers.rootOrder).toEqual([layer.id])
    expect(layers.layers.get(layer.id)?.name).toBe('Star')
  })
})
