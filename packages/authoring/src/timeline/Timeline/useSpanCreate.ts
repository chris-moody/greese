import { useCallback, useRef, useState, type PointerEvent } from 'react'
import { useAuthoringEnvironment } from '../../environment/environment.tsx'
import { beginPointerDrag } from '../../core/pointerDrag.ts'
import { layersActions } from '../../state/layers.slice.ts'
import { playbackActions } from '../../state/playback.slice.ts'
import { FrameKind } from '../../core/types/frame.types.ts'
import type { AuthoringRootState } from '../../state/createAuthoringStore.ts'
import { DRAG_THRESHOLD } from './frameInteractions.ts'

/**
 * Window (ms) after a double-press-drag commits a span within which the native
 * `dblclick` the browser also fires on that same release is suppressed. Native
 * click/dblclick detection ignores our own `DRAG_THRESHOLD`, so the second press of
 * a double-press-drag still completes a `click` — without this guard
 * `useMarqueeSelection`'s `onRowDoubleClick` would add a second, wrongly-sized span
 * on top of the one `beginSpanCreate` just sized.
 */
const SUPPRESS_DBLCLICK_MS = 500

/** A previewed span being created by press-drag, applied visually until drop. */
export interface SpanDraft {
  layerId: string
  frame: number
  duration: number
}

export interface SpanCreateApi {
  spanDraft: SpanDraft | null
  /** True when direct interaction on this layer creates spans, not keyframes. */
  isSpanLayer: (layerId: string) => boolean
  /** The pitch a new span on this layer should carry (from the layer type). */
  spanValueFor: (layerId: string) => number | undefined
  /**
   * Span-mode press: click to start, hold and drag to size a new span; a plain
   * click (no drag) just moves the playhead. Bypasses marquee/cell selection.
   */
  beginSpanCreate: (
    event: PointerEvent<HTMLElement>,
    layerId: string,
    rect: DOMRect
  ) => void
  /** True within {@link SUPPRESS_DBLCLICK_MS} of a span just committed by press-drag. */
  wasSpanJustCreatedByDrag: () => boolean
}

/** Span-creation state and gestures: press-drag sizing of a new span on a span-kind layer. */
export const useSpanCreate = (frameWidth: number): SpanCreateApi => {
  const { store, config } = useAuthoringEnvironment()
  const dispatch = store.dispatch
  const [spanDraft, setSpanDraft] = useState<SpanDraft | null>(null)
  /** Timestamp of the last span committed by a double-press-drag — see {@link SUPPRESS_DBLCLICK_MS}. */
  const spanCreatedByDragAtRef = useRef(0)

  const isSpanLayer = useCallback(
    (layerId: string): boolean => {
      const layer = (store.getState() as AuthoringRootState).layers.layers.get(layerId)
      const def = config.layerTypes.find((d) => d.layerType === String(layer?.layerType))
      return def?.defaultFrameKind === FrameKind.SPAN
    },
    [store, config]
  )

  const spanValueFor = useCallback(
    (layerId: string): number | undefined => {
      const layer = (store.getState() as AuthoringRootState).layers.layers.get(layerId)
      const def = config.layerTypes.find((d) => d.layerType === String(layer?.layerType))
      const captured = layer ? def?.captureValue?.(layer, 0) : undefined
      return typeof captured === 'number' ? captured : undefined
    },
    [store, config]
  )

  const beginSpanCreate = useCallback(
    (event: PointerEvent<HTMLElement>, layerId: string, rect: DOMRect) => {
      const pressFrame = Math.max(0, Math.floor((event.clientX - rect.left) / frameWidth))
      dispatch(playbackActions.setCurrentFrame(pressFrame))

      // Track the live draft in the closure too: dispatching from inside a
      // `setSpanDraft` updater runs during React's render phase and triggers
      // "Cannot update a component while rendering a different component".
      let draft: SpanDraft | null = null
      beginPointerDrag(event, {
        threshold: DRAG_THRESHOLD,
        onMove: (e) => {
          const curFrame = Math.max(0, Math.floor((e.clientX - rect.left) / frameWidth))
          const lo = Math.min(pressFrame, curFrame)
          const hi = Math.max(pressFrame, curFrame)
          const frame = config.snapSpanFrame?.(lo) ?? lo
          const duration = config.snapSpanDuration?.(hi - lo + 1, frame) ?? hi - lo + 1
          draft = { layerId, frame, duration }
          setSpanDraft(draft)
        },
        onEnd: () => {
          setSpanDraft(null)
          if (!draft) return
          dispatch(
            layersActions.addSpan({
              layerId,
              frame: draft.frame,
              duration: draft.duration,
              value: spanValueFor(layerId),
            })
          )
          // The native `dblclick` this same release also triggers must not add a
          // second span — see `useMarqueeSelection`'s `onRowDoubleClick` guard.
          spanCreatedByDragAtRef.current = Date.now()
        },
      })
    },
    [dispatch, frameWidth, spanValueFor, config]
  )

  const wasSpanJustCreatedByDrag = useCallback(
    (): boolean => Date.now() - spanCreatedByDragAtRef.current < SUPPRESS_DBLCLICK_MS,
    []
  )

  return {
    spanDraft,
    isSpanLayer,
    spanValueFor,
    beginSpanCreate,
    wasSpanJustCreatedByDrag,
  }
}
