import { describe, expect, it } from 'vitest'
import {
  applySelection,
  backendReconciles,
  indexLayerTypes,
  reconcileObjects,
  sampleLayers,
} from './stageDriver.ts'
import { makeLayer } from '../layers/layers.ts'
import type { AuthoringLayer } from '../types/layer.types.ts'
import type { LayerTypeDef } from '../../environment/media.types.ts'
import type {
  Point,
  Rect,
  RenderObject,
  StageBackend,
  Transform2D,
} from './renderObject.types.ts'

/** A minimal render object that records the values pushed into it. */
class FakeObject implements RenderObject {
  visible = true
  selected = false
  updates: unknown[] = []
  readonly transform: Transform2D = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 }
  constructor(readonly id: string) {}
  update(model: unknown): void {
    this.updates.push(model)
  }
  setSelected(selected: boolean): void {
    this.selected = selected
  }
  bounds(): Rect {
    return { x: 0, y: 0, width: 0, height: 0 }
  }
  hitTest(_point: Point): boolean {
    return false
  }
  destroy(): void {}
}

/** A reconciling fake backend (implements add/removeObject). */
class FakeBackend implements StageBackend<FakeObject> {
  readonly map = new Map<string, FakeObject>()
  destroyed: string[] = []
  get objects(): ReadonlyMap<string, FakeObject> {
    return this.map
  }
  addObject(object: FakeObject): void {
    this.map.set(object.id, object)
  }
  removeObject(id: string): void {
    this.map.get(id)?.destroy()
    this.destroyed.push(id)
    this.map.delete(id)
  }
  getObjectAt(): FakeObject | null {
    return null
  }
  destroy(): void {}
}

const boneDef: LayerTypeDef = {
  layerType: 'bone',
  label: 'Bone',
  createRenderObject: (layer) => new FakeObject(layer.id),
  sample: (_timeline, frame) => frame,
}

const layerMap = (...layers: AuthoringLayer[]) =>
  new Map(layers.map((layer) => [layer.id, layer]))

describe('reconcileObjects', () => {
  it('creates objects for new layers and destroys objects for removed ones', () => {
    const backend = new FakeBackend()
    const defs = indexLayerTypes([boneDef])
    const a = makeLayer({ id: 'a', name: 'A', layerType: 'bone' })
    const b = makeLayer({ id: 'b', name: 'B', layerType: 'bone' })

    reconcileObjects(backend, defs, layerMap(a, b))
    expect([...backend.objects.keys()].sort()).toEqual(['a', 'b'])

    // Swap the whole scene (as a nested subview does): only 'c' should remain.
    const c = makeLayer({ id: 'c', name: 'C', layerType: 'bone' })
    reconcileObjects(backend, defs, layerMap(c))
    expect([...backend.objects.keys()]).toEqual(['c'])
    expect(backend.destroyed.sort()).toEqual(['a', 'b'])
  })

  it('skips layer types with no factory (renders nothing)', () => {
    const backend = new FakeBackend()
    const defs = indexLayerTypes([{ layerType: 'note', label: 'Note' }])
    reconcileObjects(
      backend,
      defs,
      layerMap(makeLayer({ id: 'n', name: 'N', layerType: 'note' }))
    )
    expect(backend.objects.size).toBe(0)
  })

  it('is a no-op for backends that manage their own objects', () => {
    const selfManaged: StageBackend = {
      objects: new Map(),
      getObjectAt: () => null,
      destroy: () => {},
    }
    expect(backendReconciles(selfManaged)).toBe(false)
    // Should not throw despite missing add/removeObject.
    reconcileObjects(
      selfManaged,
      indexLayerTypes([boneDef]),
      layerMap(makeLayer({ id: 'a', name: 'A', layerType: 'bone' }))
    )
    expect(selfManaged.objects.size).toBe(0)
  })
})

describe('sampleLayers + applySelection', () => {
  it('pushes the sampled value into each object', () => {
    const backend = new FakeBackend()
    const defs = indexLayerTypes([boneDef])
    const a = makeLayer({ id: 'a', name: 'A', layerType: 'bone' })
    reconcileObjects(backend, defs, layerMap(a))
    sampleLayers(backend, defs, layerMap(a), 7)
    expect(backend.objects.get('a')!.updates).toEqual([7])
  })

  it('mirrors the selection set onto object highlight state', () => {
    const backend = new FakeBackend()
    const defs = indexLayerTypes([boneDef])
    const a = makeLayer({ id: 'a', name: 'A', layerType: 'bone' })
    const b = makeLayer({ id: 'b', name: 'B', layerType: 'bone' })
    reconcileObjects(backend, defs, layerMap(a, b))
    applySelection(backend, new Set(['b']))
    expect(backend.objects.get('a')!.selected).toBe(false)
    expect(backend.objects.get('b')!.selected).toBe(true)
  })

  it('without a cache, resamples every layer every call (default/back-compat behavior)', () => {
    const backend = new FakeBackend()
    const defs = indexLayerTypes([boneDef])
    const a = makeLayer({ id: 'a', name: 'A', layerType: 'bone' })
    const b = makeLayer({ id: 'b', name: 'B', layerType: 'bone' })
    reconcileObjects(backend, defs, layerMap(a, b))
    sampleLayers(backend, defs, layerMap(a, b), 1)
    sampleLayers(backend, defs, layerMap(a, b), 1)
    expect(backend.objects.get('a')!.updates).toEqual([1, 1])
    expect(backend.objects.get('b')!.updates).toEqual([1, 1])
  })

  it('with a cache and an unchanged frame, skips layers whose reference is unchanged', () => {
    const backend = new FakeBackend()
    const defs = indexLayerTypes([boneDef])
    const a = makeLayer({ id: 'a', name: 'A', layerType: 'bone' })
    const b = makeLayer({ id: 'b', name: 'B', layerType: 'bone' })
    reconcileObjects(backend, defs, layerMap(a, b))
    const lastLayerRefById = new Map()

    // First call: nothing cached yet, so both layers sample (frameChanged: true, as on a fresh mount).
    sampleLayers(backend, defs, layerMap(a, b), 1, {
      frameChanged: true,
      lastLayerRefById,
    })
    expect(backend.objects.get('a')!.updates).toEqual([1])
    expect(backend.objects.get('b')!.updates).toEqual([1])

    // Second call: only `a`'s reference changed (simulating one joint's own layer being touched); frame unchanged.
    const a2 = { ...a }
    sampleLayers(backend, defs, layerMap(a2, b), 1, {
      frameChanged: false,
      lastLayerRefById,
    })
    expect(backend.objects.get('a')!.updates).toEqual([1, 1])
    expect(backend.objects.get('b')!.updates).toEqual([1])
  })

  it('with a cache, still resamples every layer when the frame changed', () => {
    const backend = new FakeBackend()
    const defs = indexLayerTypes([boneDef])
    const a = makeLayer({ id: 'a', name: 'A', layerType: 'bone' })
    const b = makeLayer({ id: 'b', name: 'B', layerType: 'bone' })
    reconcileObjects(backend, defs, layerMap(a, b))
    const lastLayerRefById = new Map()

    sampleLayers(backend, defs, layerMap(a, b), 1, {
      frameChanged: true,
      lastLayerRefById,
    })
    sampleLayers(backend, defs, layerMap(a, b), 2, {
      frameChanged: true,
      lastLayerRefById,
    })
    expect(backend.objects.get('a')!.updates).toEqual([1, 2])
    expect(backend.objects.get('b')!.updates).toEqual([1, 2])
  })
})
