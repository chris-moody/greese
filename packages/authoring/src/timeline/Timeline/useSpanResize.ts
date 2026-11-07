'use client'
import { useCallback, useState, type PointerEvent } from 'react'
import { useAuthoringEnvironment } from '../../environment/environment.tsx'
import { beginPointerDrag } from '../../core/pointerDrag.ts'
import { layersActions } from '../../state/layers.slice.ts'
import type { AuthoringRootState } from '../../state/createAuthoringStore.ts'

/** Smallest span length; sub-frame values enable partial-frame note lengths. */
const MIN_SPAN_DURATION = 1 / 16

/** Active span trim: previewed frame/duration applied visually until drop. */
export interface SpanResize {
  spanId: string
  frame: number
  duration: number
}

export interface SpanResizeApi {
  resize: SpanResize | null
  onSpanTrimStart: (
    event: PointerEvent<HTMLElement>,
    layerId: string,
    spanId: string,
    side: 'left' | 'right',
    frame: number,
    duration: number
  ) => void
}

/** Drag a span's left/right edge to trim it; active regardless of the active timeline tool. */
export const useSpanResize = (frameWidth: number): SpanResizeApi => {
  const { store, config } = useAuthoringEnvironment()
  const dispatch = store.dispatch
  const [resize, setResize] = useState<SpanResize | null>(null)

  const onSpanTrimStart = useCallback(
    (
      event: PointerEvent<HTMLElement>,
      layerId: string,
      spanId: string,
      side: 'left' | 'right',
      frame: number,
      duration: number
    ) => {
      event.stopPropagation()
      if (event.button !== 0) return
      const snapping = (store.getState() as AuthoringRootState).timeline.snapping
      let current = { frame, duration }
      setResize({ spanId, frame, duration })

      beginPointerDrag(event, {
        onMove: (e, d) => {
          // Snapping off, or Shift held, gives sub-frame (partial) precision.
          const fine = !snapping || e.shiftKey
          const rawDelta = d.dx / frameWidth
          const delta = fine ? rawDelta : Math.round(rawDelta)
          if (side === 'left') {
            const newFrame = Math.min(
              frame + duration - MIN_SPAN_DURATION,
              Math.max(0, frame + delta)
            )
            // Snapping the start must keep the *right* edge fixed (the same
            // invariant the unsnapped math above already preserves) — recompute
            // duration from the snapped frame rather than snapping frame/duration
            // independently, which would let the right edge drift.
            const snappedFrame = config.snapSpanFrame?.(newFrame) ?? newFrame
            current = { frame: snappedFrame, duration: frame + duration - snappedFrame }
          } else {
            const rawDuration = Math.max(MIN_SPAN_DURATION, duration + delta)
            current = {
              frame,
              duration: config.snapSpanDuration?.(rawDuration, frame) ?? rawDuration,
            }
          }
          setResize({ spanId, frame: current.frame, duration: current.duration })
        },
        onEnd: () => {
          setResize(null)
          dispatch(
            layersActions.resizeSpan({
              layerId,
              spanId,
              frame: current.frame,
              duration: current.duration,
            })
          )
        },
      })
    },
    [dispatch, frameWidth, config, store]
  )

  return { resize, onSpanTrimStart }
}
