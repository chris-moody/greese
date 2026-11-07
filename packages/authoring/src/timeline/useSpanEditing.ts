'use client'
import { useCallback } from 'react'
import { layersActions } from '../state/layers.slice.ts'
import { coalesce } from '../state/commandsMiddleware.ts'
import type { AuthoringRootState } from '../state/createAuthoringStore.ts'
import {
  gatherSelectedSpans,
  cellsToRows,
  type TimelineEditingContext,
} from './timelineEditing.ts'

/**
 * Span command group: split/join/transform for selected spans, plus creating
 * new spans (single-cell, per-cell-selection, or filled across a contiguous
 * run of cells). Each op is an undoable command (batched into a single
 * history entry via `coalesce`).
 */
export const useSpanEditing = ({ store, dispatch, config }: TimelineEditingContext) => {
  const splitAtPlayhead = useCallback(() => {
    const state = store.getState() as AuthoringRootState
    const spans = gatherSelectedSpans(state)
    const at = state.playback.currentFrame
    const splittable = spans.filter((s) => at > s.frame && at < s.frame + s.duration)
    if (splittable.length === 0) return
    const key = `split-${Date.now()}`
    splittable.forEach((span) =>
      dispatch(
        coalesce(
          layersActions.splitSpan({ layerId: span.layerId, spanId: span.spanId, at }),
          key
        )
      )
    )
  }, [store, dispatch])

  const joinSelected = useCallback(() => {
    const spans = gatherSelectedSpans(store.getState() as AuthoringRootState)
    const byLayer = new Map<string, string[]>()
    spans.forEach((span) =>
      byLayer.set(span.layerId, [...(byLayer.get(span.layerId) ?? []), span.spanId])
    )
    const key = `join-${Date.now()}`
    byLayer.forEach((spanIds, layerId) => {
      if (spanIds.length >= 2)
        dispatch(coalesce(layersActions.joinSpans({ layerId, spanIds }), key))
    })
  }, [store, dispatch])

  /**
   * Apply `transform` to every selected span's `{frame, duration}`, coalesced
   * into one undo step — generic scaffolding for "apply a snap/quantize/etc to
   * the current selection" actions. The framework has no opinion on what
   * `transform` does (e.g. Sound Studio's note-grid start-align/duration-snap,
   * via `config.snapSpanFrame`/`config.snapSpanDuration` — see
   * `MediaConfig`'s doc comment); callers supply it.
   */
  const transformSelectedSpans = useCallback(
    (
      transform: (span: { frame: number; duration: number }) => {
        frame: number
        duration: number
      }
    ) => {
      const spans = gatherSelectedSpans(store.getState() as AuthoringRootState)
      if (spans.length === 0) return
      const key = `transform-spans-${Date.now()}`
      spans.forEach((span) => {
        const next = transform({ frame: span.frame, duration: span.duration })
        dispatch(
          coalesce(
            layersActions.resizeSpan({
              layerId: span.layerId,
              spanId: span.spanId,
              frame: next.frame,
              duration: next.duration,
            }),
            key
          )
        )
      })
    },
    [store, dispatch]
  )

  /** The pitch a new span on this layer should carry (from the layer type). */
  const spanValueFor = useCallback(
    (layerId: string): number | undefined => {
      const state = store.getState() as AuthoringRootState
      const layer = state.layers.layers.get(layerId)
      if (!layer) return undefined
      const def = config.layerTypes.find((d) => d.layerType === String(layer.layerType))
      const captured = def?.captureValue?.(layer, 0)
      return typeof captured === 'number' ? captured : undefined
    },
    [store, config]
  )

  /** Add a single-step span at (layer, frame) carrying the layer's captured pitch. */
  const addSpanAt = useCallback(
    (layerId: string, frame: number) => {
      dispatch(
        layersActions.addSpan({
          layerId,
          frame,
          duration: 1,
          value: spanValueFor(layerId),
        })
      )
    },
    [dispatch, spanValueFor]
  )

  /**
   * Add an individual single-step span to each target cell (Add Span). Targets the
   * cell selection, or the explicitly-passed cells (e.g. the right-clicked frame).
   */
  const addSpansToCells = useCallback(
    (explicit?: { layerId: string; frame: number }[]) => {
      const state = store.getState() as AuthoringRootState
      const cells = explicit ?? cellsToRows(state.timeline.cellSelection)
      if (cells.length === 0) return
      const key = `add-spans-${Date.now()}`
      cells.forEach(({ layerId, frame }) =>
        dispatch(
          coalesce(
            layersActions.addSpan({
              layerId,
              frame,
              duration: 1,
              value: spanValueFor(layerId),
            }),
            key
          )
        )
      )
    },
    [store, dispatch, spanValueFor]
  )

  /** Fill each contiguous run of target cells with one multi-frame span (Add Span Fill). */
  const addSpanFillFromCells = useCallback(
    (explicit?: { layerId: string; frame: number }[]) => {
      const state = store.getState() as AuthoringRootState
      const cells = explicit ?? cellsToRows(state.timeline.cellSelection)
      if (cells.length === 0) return
      // Group frames per layer, then collapse each sorted run into a single span.
      const byLayer = new Map<string, number[]>()
      cells.forEach(({ layerId, frame }) =>
        byLayer.set(layerId, [...(byLayer.get(layerId) ?? []), frame])
      )
      const key = `span-fill-${Date.now()}`
      byLayer.forEach((frames, layerId) => {
        const sorted = [...new Set(frames)].sort((a, b) => a - b)
        const value = spanValueFor(layerId)
        let runStart = sorted[0]!
        let prev = sorted[0]!
        const flush = (end: number) =>
          dispatch(
            coalesce(
              layersActions.addSpan({
                layerId,
                frame: runStart,
                duration: end - runStart + 1,
                value,
              }),
              key
            )
          )
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i] === prev + 1) {
            prev = sorted[i]!
            continue
          }
          flush(prev)
          runStart = sorted[i]!
          prev = sorted[i]!
        }
        flush(prev)
      })
    },
    [store, dispatch, spanValueFor]
  )

  return {
    splitAtPlayhead,
    joinSelected,
    transformSelectedSpans,
    addSpanAt,
    addSpansToCells,
    addSpanFillFromCells,
  }
}
