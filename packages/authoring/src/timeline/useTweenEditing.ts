'use client'
import { useCallback } from 'react'
import { layersActions } from '../state/layers.slice.ts'
import { timelineActions } from '../state/timeline.slice.ts'
import { coalesce } from '../state/commandsMiddleware.ts'
import { FrameKind } from '../core/types/frame.types.ts'
import type { AuthoringRootState } from '../state/createAuthoringStore.ts'
import type { StampedCurve } from '../core/timeline/curvePresets.ts'
import { gatherSelectedTweens, type TimelineEditingContext } from './timelineEditing.ts'

/**
 * Tween command group: create/remove/merge/reverse tweens for the current
 * selection, plus applying a keyframe-stamped curve preset. Each op is an
 * undoable command (batched into a single history entry via `coalesce`).
 */
export const useTweenEditing = ({ store, dispatch }: TimelineEditingContext) => {
  const createTweenFromSelection = useCallback(() => {
    const state = store.getState() as AuthoringRootState
    const selection = state.timeline.selection
    const byLayer = new Map<string, { id: string; frame: number }[]>()
    state.layers.layers.forEach((layer) =>
      layer.timeline.frames.forEach((f) => {
        if (selection.has(f.id) && f.kind !== FrameKind.SPAN) {
          byLayer.set(layer.id, [
            ...(byLayer.get(layer.id) ?? []),
            { id: f.id, frame: f.frame },
          ])
        }
      })
    )
    const key = `tween-${Date.now()}`
    byLayer.forEach((keyframes, layerId) => {
      const sorted = keyframes.sort((a, b) => a.frame - b.frame)
      for (let i = 0; i < sorted.length - 1; i++) {
        dispatch(
          coalesce(
            layersActions.createTween({
              layerId,
              startKeyframeId: sorted[i]!.id,
              endKeyframeId: sorted[i + 1]!.id,
            }),
            key
          )
        )
      }
    })
  }, [store, dispatch])

  /**
   * Create a tween on every layer whose adjacent keyframe/poseframe bracket
   * spans `tick` (`start.frame <= tick <= end.frame`) — the gap the playhead
   * (or the right-clicked frame, from the context menu) currently sits in.
   * Shared by the TweenAll header tool and the "Tween All" context menu item
   * so both go through identical logic. `createTween` itself already no-ops
   * on empty/span endpoints and duplicate pairs, so no extra filtering here.
   */
  const createTweenAllAtTick = useCallback(
    (tick: number) => {
      const state = store.getState() as AuthoringRootState
      const key = `tween-all-${Date.now()}`
      state.layers.layers.forEach((layer, layerId) => {
        const sorted = layer.timeline.frames
          .filter((f) => f.kind !== FrameKind.SPAN)
          .sort((a, b) => a.frame - b.frame)
        for (let i = 0; i < sorted.length - 1; i++) {
          const start = sorted[i]!
          const end = sorted[i + 1]!
          if (start.frame <= tick && tick <= end.frame) {
            dispatch(
              coalesce(
                layersActions.createTween({
                  layerId,
                  startKeyframeId: start.id,
                  endKeyframeId: end.id,
                }),
                key
              )
            )
            break
          }
        }
      })
    },
    [store, dispatch]
  )

  const removeSelectedTween = useCallback(() => {
    const refs = gatherSelectedTweens(store.getState() as AuthoringRootState)
    if (refs.length === 0) return
    const key = `remove-tween-${Date.now()}`
    refs.forEach((r) =>
      dispatch(
        coalesce(
          layersActions.removeTween({ layerId: r.layerId, tweenId: r.tween.id }),
          key
        )
      )
    )
    dispatch(timelineActions.clearTween())
  }, [store, dispatch])

  /** Reverse every selected tween — swaps its endpoint keyframe values. */
  const reverseSelectedTweens = useCallback(() => {
    const refs = gatherSelectedTweens(store.getState() as AuthoringRootState)
    if (refs.length === 0) return
    const key = `reverse-tween-${Date.now()}`
    refs.forEach((r) =>
      dispatch(
        coalesce(
          layersActions.reverseTween({ layerId: r.layerId, tweenId: r.tween.id }),
          key
        )
      )
    )
  }, [store, dispatch])

  const mergeSelectedTween = useCallback(() => {
    const state = store.getState() as AuthoringRootState
    const refs = gatherSelectedTweens(state)
    if (refs.length === 0) return
    // One selected: merge it with the following tween. Several: merge per layer.
    if (refs.length === 1) {
      const sel = refs[0]!
      const layer = state.layers.layers.get(sel.layerId)
      const next = layer?.timeline.tweens.find(
        (t) => t.startKeyframeId === sel.tween.endKeyframeId
      )
      if (next)
        dispatch(
          layersActions.mergeTweens({
            layerId: sel.layerId,
            tweenIds: [sel.tween.id, next.id],
          })
        )
      return
    }
    const byLayer = new Map<string, string[]>()
    refs.forEach((r) =>
      byLayer.set(r.layerId, [...(byLayer.get(r.layerId) ?? []), r.tween.id])
    )
    const key = `merge-tween-${Date.now()}`
    byLayer.forEach((ids, layerId) => {
      if (ids.length >= 2)
        dispatch(coalesce(layersActions.mergeTweens({ layerId, tweenIds: ids }), key))
    })
  }, [store, dispatch])

  /**
   * Apply a keyframe-stamped curve (Pulsing or Envelope Sweep — see
   * `curvePresets.helpers.ts`'s `stampPulse`/`stampEnvelope`) to `layerId`
   * over `[startFrame, endFrame]`: clears any existing keyframes/tweens in
   * that range, then splices in `result`'s. A single `updateLayer` dispatch
   * — one undo step, no per-keyframe coalescing needed.
   */
  const applyCurve = useCallback(
    (layerId: string, startFrame: number, endFrame: number, result: StampedCurve) => {
      const layer = (store.getState() as AuthoringRootState).layers.layers.get(layerId)
      if (!layer) return
      const keptFrames = layer.timeline.frames.filter(
        (f) => f.frame < startFrame || f.frame > endFrame
      )
      const keptFrameIds = new Set(keptFrames.map((f) => f.id))
      const keptTweens = layer.timeline.tweens.filter(
        (t) => keptFrameIds.has(t.startKeyframeId) && keptFrameIds.has(t.endKeyframeId)
      )
      const frames = [...keptFrames, ...result.frames].sort((a, b) => a.frame - b.frame)
      const tweens = [...keptTweens, ...result.tweens]
      dispatch(
        coalesce(
          layersActions.updateLayer({
            id: layerId,
            updates: { timeline: { frames, tweens } },
          }),
          `apply-curve-${Date.now()}`
        )
      )
    },
    [store, dispatch]
  )

  return {
    createTweenFromSelection,
    createTweenAllAtTick,
    removeSelectedTween,
    mergeSelectedTween,
    reverseSelectedTweens,
    applyCurve,
  }
}
