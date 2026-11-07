import { describe, expect, it } from 'vitest'
import { layersActions, layersReducer } from './layers.slice.ts'
import { FrameKind, type FrameBase } from '../core/types/frame.types.ts'
import { makeLayer } from '../core/layers/layers.ts'
import type { LayerStoreState } from '../core/types/layer.types.ts'

const seed = (frames: FrameBase[] = []): LayerStoreState => {
  let state = layersReducer(undefined, { type: '@@init' })
  const layer = makeLayer({ id: 'l1', name: 'L1', layerType: 'x' })
  layer.timeline.frames = frames
  state = layersReducer(state, layersActions.addLayer({ layer }))
  return state
}

const seedMulti = (ids: string[]): LayerStoreState => {
  let state = layersReducer(undefined, { type: '@@init' })
  for (const id of ids) {
    state = layersReducer(
      state,
      layersActions.addLayer({ layer: makeLayer({ id, name: id, layerType: 'x' }) })
    )
  }
  return state
}

const frames = (state: LayerStoreState) => state.layers.get('l1')!.timeline.frames
const tweens = (state: LayerStoreState) => state.layers.get('l1')!.timeline.tweens

const kf = (id: string, frame: number, value?: number): FrameBase => ({
  id,
  frame,
  kind: FrameKind.KEYFRAME,
  value,
})

describe('layers slice — keyframes', () => {
  it('adds and sorts keyframes; re-adding a frame updates its value', () => {
    let state = seed()
    state = layersReducer(
      state,
      layersActions.addKeyframe({ layerId: 'l1', frame: 5, value: 1 })
    )
    state = layersReducer(
      state,
      layersActions.addKeyframe({ layerId: 'l1', frame: 2, value: 2 })
    )
    expect(frames(state).map((f) => f.frame)).toEqual([2, 5])

    state = layersReducer(
      state,
      layersActions.addKeyframe({ layerId: 'l1', frame: 5, value: 9 })
    )
    expect(frames(state)).toHaveLength(2)
    expect(frames(state).find((f) => f.frame === 5)!.value).toBe(9)
  })

  it('re-adding a frame with values only (no ref) preserves an existing ref, but an explicit ref still overwrites it', () => {
    let state = seed()
    state = layersReducer(
      state,
      layersActions.addKeyframe({
        layerId: 'l1',
        frame: 5,
        values: { rotation: 1 },
        kind: 'poseFrame',
        ref: { pose: 'idle' },
      })
    )
    expect(frames(state).find((f) => f.frame === 5)!.ref).toEqual({ pose: 'idle' })

    // A plain value-only re-add (e.g. autokey capturing a joint's current
    // transform) must not silently strip the existing ref — this was the bug:
    // `existing.ref = payload.ref` used to unconditionally clear it to
    // `undefined` whenever a later dispatch omitted `ref`, even though `kind`
    // was left untouched, desyncing the two and making `commitAnimation`'s
    // `kind === POSE_FRAME_KIND && ref?.pose` filter silently drop the frame
    // from `poseFrames` on the next commit.
    state = layersReducer(
      state,
      layersActions.addKeyframe({ layerId: 'l1', frame: 5, values: { rotation: 1 } })
    )
    const frame5 = frames(state).find((f) => f.frame === 5)!
    expect(frame5.kind).toBe('poseFrame')
    expect(frame5.ref).toEqual({ pose: 'idle' })

    // An explicit new ref still legitimately overwrites the old one.
    state = layersReducer(
      state,
      layersActions.addKeyframe({
        layerId: 'l1',
        frame: 5,
        values: { rotation: 2 },
        kind: 'poseFrame',
        ref: { pose: 'walk' },
      })
    )
    expect(frames(state).find((f) => f.frame === 5)!.ref).toEqual({ pose: 'walk' })
  })

  it('moveKeyframe overwrites any keyframe at the destination', () => {
    let state = seed()
    state = layersReducer(state, layersActions.addKeyframe({ layerId: 'l1', frame: 3 }))
    state = layersReducer(state, layersActions.addKeyframe({ layerId: 'l1', frame: 6 }))
    state = layersReducer(
      state,
      layersActions.moveKeyframe({ layerId: 'l1', from: 3, to: 6 })
    )
    expect(frames(state).map((f) => f.frame)).toEqual([6])
  })

  it('removeKeyframe deletes only the targeted frame', () => {
    let state = seed()
    state = layersReducer(state, layersActions.addKeyframe({ layerId: 'l1', frame: 4 }))
    state = layersReducer(
      state,
      layersActions.removeKeyframe({ layerId: 'l1', frame: 4 })
    )
    expect(frames(state)).toHaveLength(0)
  })

  it('addKeyframes applies every item across multiple layers in one dispatch', () => {
    let state = seedMulti(['a', 'b', 'c'])
    state = layersReducer(
      state,
      layersActions.addKeyframes([
        { layerId: 'a', frame: 1, values: { x: 1 } },
        { layerId: 'b', frame: 1, values: { x: 2 } },
        { layerId: 'c', frame: 1, values: { x: 3 } },
      ])
    )
    expect(state.layers.get('a')!.timeline.frames[0]!.values).toEqual({ x: 1 })
    expect(state.layers.get('b')!.timeline.frames[0]!.values).toEqual({ x: 2 })
    expect(state.layers.get('c')!.timeline.frames[0]!.values).toEqual({ x: 3 })
  })

  it('addKeyframes updates an existing frame the same way addKeyframe does', () => {
    let state = seedMulti(['a'])
    state = layersReducer(
      state,
      layersActions.addKeyframes([{ layerId: 'a', frame: 5, values: { x: 1 } }])
    )
    state = layersReducer(
      state,
      layersActions.addKeyframes([{ layerId: 'a', frame: 5, values: { x: 9 } }])
    )
    expect(state.layers.get('a')!.timeline.frames).toHaveLength(1)
    expect(state.layers.get('a')!.timeline.frames[0]!.values).toEqual({ x: 9 })
  })

  it('addKeyframes skips items whose layer no longer exists rather than throwing', () => {
    const state = seedMulti(['a'])
    expect(() =>
      layersReducer(
        state,
        layersActions.addKeyframes([{ layerId: 'missing', frame: 1, values: { x: 1 } }])
      )
    ).not.toThrow()
  })
})

describe('layers slice — frame ranges', () => {
  it('insertFrames shifts frames at/after the position right', () => {
    let state = seed()
    ;[2, 5].forEach((frame) => {
      state = layersReducer(state, layersActions.addKeyframe({ layerId: 'l1', frame }))
    })
    state = layersReducer(state, layersActions.insertFrames({ at: 3, count: 2 }))
    expect(frames(state).map((f) => f.frame)).toEqual([2, 7])
  })

  it('removeFrames deletes the range and shifts the rest left', () => {
    let state = seed()
    ;[1, 4, 8].forEach((frame) => {
      state = layersReducer(state, layersActions.addKeyframe({ layerId: 'l1', frame }))
    })
    state = layersReducer(state, layersActions.removeFrames({ at: 3, count: 3 })) // removes [3,6)
    expect(frames(state).map((f) => f.frame)).toEqual([1, 5]) // 4 removed, 8 -> 5
  })

  it('rippleDeleteFrames removes and closes gaps', () => {
    let state = seed()
    ;[0, 2, 4].forEach((frame) => {
      state = layersReducer(state, layersActions.addKeyframe({ layerId: 'l1', frame }))
    })
    state = layersReducer(
      state,
      layersActions.rippleDeleteFrames({ layerId: 'l1', frames: [2] })
    )
    expect(frames(state).map((f) => f.frame)).toEqual([0, 3]) // 4 shifts left by 1
  })
})

describe('layers slice — spans', () => {
  it('splits a span into two adjacent spans', () => {
    let state = seed([{ id: 's1', frame: 0, kind: FrameKind.SPAN, duration: 10 }])
    state = layersReducer(
      state,
      layersActions.splitSpan({ layerId: 'l1', spanId: 's1', at: 4 })
    )
    const spans = frames(state).filter((f) => f.kind === FrameKind.SPAN)
    expect(spans).toHaveLength(2)
    expect(spans.map((s) => [s.frame, s.duration])).toEqual([
      [0, 4],
      [4, 6],
    ])
  })

  it('joins spans into one covering range', () => {
    let state = seed([
      { id: 'a', frame: 0, kind: FrameKind.SPAN, duration: 3 },
      { id: 'b', frame: 5, kind: FrameKind.SPAN, duration: 2 },
    ])
    state = layersReducer(
      state,
      layersActions.joinSpans({ layerId: 'l1', spanIds: ['a', 'b'] })
    )
    const spans = frames(state).filter((f) => f.kind === FrameKind.SPAN)
    expect(spans).toHaveLength(1)
    expect([spans[0]!.frame, spans[0]!.duration]).toEqual([0, 7])
  })

  it('addSpan carries an optional value (pitch) onto the new span', () => {
    let state = seed()
    state = layersReducer(
      state,
      layersActions.addSpan({ layerId: 'l1', frame: 2, duration: 3, value: 17 })
    )
    const span = frames(state).find((f) => f.kind === FrameKind.SPAN)!
    expect([span.frame, span.duration, span.value]).toEqual([2, 3, 17])
  })

  it('removeSpan deletes a span by id (leaving others at the same frame)', () => {
    let state = seed([
      { id: 'a', frame: 4, kind: FrameKind.SPAN, duration: 1 },
      { id: 'b', frame: 4, kind: FrameKind.SPAN, duration: 2 },
    ])
    state = layersReducer(state, layersActions.removeSpan({ layerId: 'l1', spanId: 'a' }))
    expect(frames(state).map((f) => f.id)).toEqual(['b'])
  })
})

describe('layers slice — tweens', () => {
  it('creates a tween and rejects reversed or duplicate connections', () => {
    let state = seed([kf('a', 0), kf('b', 10)])
    state = layersReducer(
      state,
      layersActions.createTween({
        layerId: 'l1',
        startKeyframeId: 'a',
        endKeyframeId: 'b',
      })
    )
    expect(tweens(state)).toHaveLength(1)

    // duplicate + reversed are rejected
    state = layersReducer(
      state,
      layersActions.createTween({
        layerId: 'l1',
        startKeyframeId: 'a',
        endKeyframeId: 'b',
      })
    )
    state = layersReducer(
      state,
      layersActions.createTween({
        layerId: 'l1',
        startKeyframeId: 'b',
        endKeyframeId: 'a',
      })
    )
    expect(tweens(state)).toHaveLength(1)
  })

  it('reverseTween swaps the values of its endpoint keyframes', () => {
    let state = seed([kf('a', 0, 10), kf('b', 10, 90)])
    state = layersReducer(
      state,
      layersActions.createTween({
        layerId: 'l1',
        startKeyframeId: 'a',
        endKeyframeId: 'b',
      })
    )
    const tweenId = tweens(state)[0]!.id
    state = layersReducer(state, layersActions.reverseTween({ layerId: 'l1', tweenId }))
    expect(frames(state).find((f) => f.id === 'a')!.value).toBe(90)
    expect(frames(state).find((f) => f.id === 'b')!.value).toBe(10)
  })

  it('drops connected tweens when a keyframe is removed', () => {
    let state = seed([kf('a', 0), kf('b', 10)])
    state = layersReducer(
      state,
      layersActions.createTween({
        layerId: 'l1',
        startKeyframeId: 'a',
        endKeyframeId: 'b',
      })
    )
    state = layersReducer(
      state,
      layersActions.removeKeyframe({ layerId: 'l1', frame: 10 })
    )
    expect(tweens(state)).toHaveLength(0)
  })

  it('splits a tween when a keyframe is inserted inside it', () => {
    let state = seed([kf('a', 0), kf('b', 10)])
    state = layersReducer(
      state,
      layersActions.createTween({
        layerId: 'l1',
        startKeyframeId: 'a',
        endKeyframeId: 'b',
      })
    )
    state = layersReducer(state, layersActions.addKeyframe({ layerId: 'l1', frame: 5 }))
    expect(tweens(state)).toHaveLength(2)
    // both tweens still terminate at 'b' via the new middle keyframe
    const endpoints = tweens(state).map((t) => t.endKeyframeId)
    expect(endpoints).toContain('b')
  })

  it('merges a chain of tweens into one', () => {
    let state = seed([kf('a', 0), kf('b', 5), kf('c', 10)])
    state = layersReducer(
      state,
      layersActions.createTween({
        layerId: 'l1',
        startKeyframeId: 'a',
        endKeyframeId: 'b',
      })
    )
    state = layersReducer(
      state,
      layersActions.createTween({
        layerId: 'l1',
        startKeyframeId: 'b',
        endKeyframeId: 'c',
      })
    )
    const ids = tweens(state).map((t) => t.id)
    state = layersReducer(
      state,
      layersActions.mergeTweens({ layerId: 'l1', tweenIds: ids })
    )
    expect(tweens(state)).toHaveLength(1)
    expect([tweens(state)[0]!.startKeyframeId, tweens(state)[0]!.endKeyframeId]).toEqual([
      'a',
      'c',
    ])
  })
})

describe('layers slice — empty keyframes', () => {
  it('clearKeyframe converts a keyframe to an empty key and strips its data', () => {
    let state = seed()
    state = layersReducer(
      state,
      layersActions.addKeyframe({ layerId: 'l1', frame: 3, value: 7, values: { x: 1 } })
    )
    state = layersReducer(state, layersActions.clearKeyframe({ layerId: 'l1', frame: 3 }))
    const cleared = frames(state)[0]!
    expect(cleared.kind).toBe(FrameKind.EMPTY)
    expect(cleared.value).toBeUndefined()
    expect(cleared.values).toBeUndefined()
  })

  it('clearKeyframe drops tweens touching the cleared key', () => {
    let state = seed([kf('a', 0, 1), kf('b', 10, 2)])
    state = layersReducer(
      state,
      layersActions.createTween({
        layerId: 'l1',
        startKeyframeId: 'a',
        endKeyframeId: 'b',
      })
    )
    expect(tweens(state)).toHaveLength(1)
    state = layersReducer(
      state,
      layersActions.clearKeyframe({ layerId: 'l1', frame: 10 })
    )
    expect(tweens(state)).toHaveLength(0)
  })

  it('authoring data onto an empty keyframe promotes it to a real keyframe', () => {
    let state = seed()
    state = layersReducer(
      state,
      layersActions.addKeyframe({ layerId: 'l1', frame: 2, kind: FrameKind.EMPTY })
    )
    state = layersReducer(
      state,
      layersActions.addKeyframe({ layerId: 'l1', frame: 2, value: 5 })
    )
    expect(frames(state)[0]!.kind).toBe(FrameKind.KEYFRAME)
    expect(frames(state)[0]!.value).toBe(5)
  })

  it('createTween refuses endpoints that are empty keyframes', () => {
    let state = seed([kf('a', 0, 1), { id: 'e', frame: 10, kind: FrameKind.EMPTY }])
    state = layersReducer(
      state,
      layersActions.createTween({
        layerId: 'l1',
        startKeyframeId: 'a',
        endKeyframeId: 'e',
      })
    )
    expect(tweens(state)).toHaveLength(0)
  })

  it('inserting an empty keyframe inside a tween cuts the tween instead of splitting it', () => {
    let state = seed([kf('a', 0, 1), kf('b', 10, 2)])
    state = layersReducer(
      state,
      layersActions.createTween({
        layerId: 'l1',
        startKeyframeId: 'a',
        endKeyframeId: 'b',
      })
    )
    state = layersReducer(
      state,
      layersActions.addKeyframe({ layerId: 'l1', frame: 5, kind: FrameKind.EMPTY })
    )
    expect(frames(state).map((f) => f.frame)).toEqual([0, 5, 10])
    expect(tweens(state)).toHaveLength(0)
  })
})
