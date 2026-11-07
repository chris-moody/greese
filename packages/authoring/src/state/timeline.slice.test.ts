import { describe, expect, it } from 'vitest'
import { timelineReducer, timelineActions } from './timeline.slice.ts'

const init = () => timelineReducer(undefined, { type: '@@INIT' })

describe('timeline selection (keyframes + tweens)', () => {
  it('keeps keyframe and tween selection independent, combined by marquee', () => {
    let state = init()
    state = timelineReducer(
      state,
      timelineActions.setCombinedSelection({ keyframes: ['k1', 'k2'], tweens: ['t1'] })
    )
    expect([...state.selection]).toEqual(['k1', 'k2'])
    expect([...state.selectedTweens]).toEqual(['t1'])
  })

  it('toggleTween adds/removes without touching keyframes', () => {
    let state = timelineReducer(init(), timelineActions.setTimelineSelection(['k1']))
    state = timelineReducer(state, timelineActions.toggleTween({ tweenId: 't1' }))
    state = timelineReducer(state, timelineActions.toggleTween({ tweenId: 't2' }))
    expect([...state.selectedTweens].sort()).toEqual(['t1', 't2'])
    expect([...state.selection]).toEqual(['k1']) // keyframes untouched
    state = timelineReducer(state, timelineActions.toggleTween({ tweenId: 't1' }))
    expect([...state.selectedTweens]).toEqual(['t2'])
  })

  it('selecting a single tween clears the keyframe selection', () => {
    let state = timelineReducer(
      init(),
      timelineActions.setTimelineSelection(['k1', 'k2'])
    )
    state = timelineReducer(
      state,
      timelineActions.selectTween({ layerId: 'L', tweenId: 't1' })
    )
    expect([...state.selectedTweens]).toEqual(['t1'])
    expect(state.selection.size).toBe(0)
  })

  it('a keyframe-only selection clears tweens; clearAll clears both', () => {
    let state = timelineReducer(
      init(),
      timelineActions.setCombinedSelection({ keyframes: ['k1'], tweens: ['t1'] })
    )
    state = timelineReducer(state, timelineActions.setTimelineSelection(['k2']))
    expect(state.selectedTweens.size).toBe(0)
    state = timelineReducer(
      state,
      timelineActions.setCombinedSelection({ keyframes: ['k1'], tweens: ['t1'] })
    )
    state = timelineReducer(state, timelineActions.clearTimelineSelection())
    expect(state.selection.size).toBe(0)
    expect(state.selectedTweens.size).toBe(0)
  })
})

describe('markers', () => {
  it('addMarker dedupes by (scope, frame) and keeps the list sorted', () => {
    let state = timelineReducer(
      init(),
      timelineActions.addMarker({ scope: 'root', frame: 10 })
    )
    state = timelineReducer(state, timelineActions.addMarker({ scope: 'root', frame: 2 }))
    state = timelineReducer(
      state,
      timelineActions.addMarker({ scope: 'root', frame: 10 })
    ) // dupe, ignored
    expect(state.markers.map((m) => m.frame)).toEqual([2, 10])
  })

  it('allows the same frame in different scopes', () => {
    let state = timelineReducer(
      init(),
      timelineActions.addMarker({ scope: 'root', frame: 10 })
    )
    state = timelineReducer(
      state,
      timelineActions.addMarker({ scope: 'symbol:a', frame: 10 })
    )
    expect(state.markers).toHaveLength(2)
  })

  it('moveMarker re-sorts the list and setMarkerLabel edits in place', () => {
    let state = timelineReducer(
      init(),
      timelineActions.addMarker({ scope: 'root', frame: 0, label: 'a' })
    )
    state = timelineReducer(
      state,
      timelineActions.addMarker({ scope: 'root', frame: 5, label: 'b' })
    )
    const [first, second] = state.markers
    state = timelineReducer(
      state,
      timelineActions.moveMarker({ id: first!.id, frame: 9 })
    )
    expect(state.markers.map((m) => m.id)).toEqual([second!.id, first!.id])
    state = timelineReducer(
      state,
      timelineActions.setMarkerLabel({ id: second!.id, label: 'renamed' })
    )
    expect(state.markers.find((m) => m.id === second!.id)?.label).toBe('renamed')
  })

  it('removeMarker also drops it from the selection', () => {
    let state = timelineReducer(
      init(),
      timelineActions.addMarker({ scope: 'root', frame: 3 })
    )
    const id = state.markers[0]!.id
    state = timelineReducer(state, timelineActions.setMarkerSelection([id]))
    state = timelineReducer(state, timelineActions.removeMarker(id))
    expect(state.markers).toEqual([])
    expect(state.selectedMarkers.size).toBe(0)
  })

  it('toggleMarker adds/removes from the selection; clearMarkerSelection empties it', () => {
    let state = timelineReducer(init(), timelineActions.toggleMarker('m1'))
    state = timelineReducer(state, timelineActions.toggleMarker('m2'))
    expect([...state.selectedMarkers].sort()).toEqual(['m1', 'm2'])
    state = timelineReducer(state, timelineActions.toggleMarker('m1'))
    expect([...state.selectedMarkers]).toEqual(['m2'])
    state = timelineReducer(state, timelineActions.clearMarkerSelection())
    expect(state.selectedMarkers.size).toBe(0)
  })

  it('setMarkers replaces the full list (e.g. loading a persisted document)', () => {
    let state = timelineReducer(
      init(),
      timelineActions.addMarker({ scope: 'root', frame: 3 })
    )
    const persisted = [{ id: 'x1', scope: 'symbol:a', frame: 7, label: 'loaded' }]
    state = timelineReducer(state, timelineActions.setMarkers(persisted))
    expect(state.markers).toEqual(persisted)
  })
})

describe('level point selection', () => {
  it('setLevelPointSelection replaces the selection', () => {
    const state = timelineReducer(
      init(),
      timelineActions.setLevelPointSelection(['p1', 'p2'])
    )
    expect([...state.levelPointSelection].sort()).toEqual(['p1', 'p2'])
  })

  it('toggleLevelPoint adds/removes; clearLevelPointSelection empties it', () => {
    let state = timelineReducer(init(), timelineActions.toggleLevelPoint('p1'))
    state = timelineReducer(state, timelineActions.toggleLevelPoint('p2'))
    expect([...state.levelPointSelection].sort()).toEqual(['p1', 'p2'])
    state = timelineReducer(state, timelineActions.toggleLevelPoint('p1'))
    expect([...state.levelPointSelection]).toEqual(['p2'])
    state = timelineReducer(state, timelineActions.clearLevelPointSelection())
    expect(state.levelPointSelection.size).toBe(0)
  })
})
