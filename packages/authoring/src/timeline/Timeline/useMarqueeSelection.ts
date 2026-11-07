'use client'
import {
  useCallback,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from 'react'
import { useAuthoringEnvironment } from '../../environment/environment.tsx'
import { beginPointerDrag } from '../../core/pointerDrag.ts'
import { layersActions } from '../../state/layers.slice.ts'
import { playbackActions } from '../../state/playback.slice.ts'
import { timelineActions } from '../../state/timeline.slice.ts'
import { FrameKind } from '../../core/types/frame.types.ts'
import type { AuthoringRootState } from '../../state/createAuthoringStore.ts'
import {
  DRAG_THRESHOLD,
  cellsInRect,
  keyframesInRect,
  spansInRect,
  tweensInRect,
  type MarqueeBox,
} from './frameInteractions.ts'
import type { SpanCreateApi } from './useSpanCreate.ts'

/** Window (ms) within which a second press on the same frame counts as a double-press. */
const DOUBLE_PRESS_MS = 400
/** Default length (frames) of a span created by a plain double-click. */
const DEFAULT_SPAN_DURATION = 4

export interface MarqueeSelectionApi {
  marquee: MarqueeBox | null
  onRowPointerDown: (event: PointerEvent<HTMLElement>, layerId: string) => void
  onRowDoubleClick: (event: MouseEvent<HTMLElement>, layerId: string) => void
}

/**
 * Row press/double-click interactions on the frame grid:
 * - press-drag on empty grid → marquee select (replace, Shift adds, ⌘/Ctrl subtracts);
 *   a plain press clears the selection; double-click keys the frame.
 * - on a span-kind layer, a press-drag (or, in span-only mode, a double-press-drag)
 *   defers to {@link SpanCreateApi.beginSpanCreate} instead of the marquee.
 */
export const useMarqueeSelection = (
  frameWidth: number,
  bodyRef: RefObject<HTMLElement | null>,
  isFrameTool: boolean,
  disableCellSelection: boolean,
  spanCreate: SpanCreateApi
): MarqueeSelectionApi => {
  const { store, config } = useAuthoringEnvironment()
  const dispatch = store.dispatch
  const { isSpanLayer, spanValueFor, beginSpanCreate, wasSpanJustCreatedByDrag } =
    spanCreate
  const [marquee, setMarquee] = useState<MarqueeBox | null>(null)
  /** Last row press, for detecting a double-press (span create in span-only mode). */
  const lastPressRef = useRef<{ time: number; frame: number; layerId: string } | null>(
    null
  )
  const spanOnly = !!config.spanOnly

  const onRowPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>, layerId: string) => {
      if (!isFrameTool) return
      if (event.button !== 0) return
      const body = bodyRef.current
      if (!body) return
      const rect = body.getBoundingClientRect()
      const startX = event.clientX
      const startY = event.clientY
      const pressFrame = Math.max(0, Math.floor((startX - rect.left) / frameWidth))
      if (isSpanLayer(layerId)) {
        // Span-only mode: a single press-drag selects frames/spans; span creation
        // needs a double-press-drag. Other span layers create on a single drag.
        const now = Date.now()
        const last = lastPressRef.current
        const isDouble =
          !!last &&
          now - last.time < DOUBLE_PRESS_MS &&
          last.layerId === layerId &&
          Math.abs(last.frame - pressFrame) <= 1
        lastPressRef.current = { time: now, frame: pressFrame, layerId }
        if (!spanOnly || isDouble) {
          beginSpanCreate(event, layerId, rect)
          return
        }
        // else fall through to the selection path below.
      }
      const pressCell = `${layerId}:${pressFrame}`
      // Clicking anywhere in the frame space moves the playhead to that frame.
      dispatch(playbackActions.setCurrentFrame(pressFrame))
      const additive = event.shiftKey
      const subtractive = event.metaKey || event.ctrlKey
      const timeline = (store.getState() as AuthoringRootState).timeline
      const baseKeyframes = new Set(timeline.selection)
      const baseTweens = new Set(timeline.selectedTweens)
      const baseCells = new Set(timeline.cellSelection)

      beginPointerDrag(event, {
        threshold: DRAG_THRESHOLD,
        onMove: (e) => {
          const box: MarqueeBox = {
            left: Math.min(startX, e.clientX) - rect.left,
            top: Math.min(startY, e.clientY) - rect.top,
            width: Math.abs(e.clientX - startX),
            height: Math.abs(e.clientY - startY),
          }
          setMarquee(box)
          const state = store.getState() as AuthoringRootState
          // Union spans, keyframes, and tweens — a marquee doesn't know in advance
          // which rows under it are span-kind vs keyframe-kind (a mixed timeline,
          // e.g. Sound Studio's note/arrangement spans alongside property-tween
          // keyframe tracks, can have both). Both land in the same `selection`
          // set either way (spans and keyframes are distinguished later by `kind`).
          const kfHits = [
            ...spansInRect(state, box, frameWidth),
            ...keyframesInRect(state, box, frameWidth),
          ]
          const twHits = tweensInRect(state, box, frameWidth)
          const cellHits = disableCellSelection ? [] : cellsInRect(state, box, frameWidth)
          const nextKf =
            additive || subtractive ? new Set(baseKeyframes) : new Set<string>()
          const nextTw = additive || subtractive ? new Set(baseTweens) : new Set<string>()
          const nextCells =
            additive || subtractive ? new Set(baseCells) : new Set<string>()
          if (subtractive) {
            kfHits.forEach((id) => nextKf.delete(id))
            twHits.forEach((id) => nextTw.delete(id))
            cellHits.forEach((id) => nextCells.delete(id))
          } else {
            kfHits.forEach((id) => nextKf.add(id))
            twHits.forEach((id) => nextTw.add(id))
            cellHits.forEach((id) => nextCells.add(id))
          }
          dispatch(
            timelineActions.setCombinedSelection({
              keyframes: [...nextKf],
              tweens: [...nextTw],
            })
          )
          if (!disableCellSelection)
            dispatch(timelineActions.setCellSelection([...nextCells]))
        },
        onEnd: (_e, _d, didDrag) => {
          setMarquee(null)
          if (didDrag) return
          if (disableCellSelection) {
            // No cell dimension: a plain press just clears the keyframe/tween selection.
            if (!additive && !subtractive)
              dispatch(timelineActions.setTimelineSelection([]))
            return
          }
          // A plain press selects the single pressed cell; Shift adds, ⌘/Ctrl toggles.
          if (additive) dispatch(timelineActions.addCells([pressCell]))
          else if (subtractive) dispatch(timelineActions.toggleCell(pressCell))
          else {
            dispatch(timelineActions.setTimelineSelection([])) // clear keyframe/tween selection
            dispatch(timelineActions.setCellSelection([pressCell]))
          }
        },
      })
    },
    [
      store,
      dispatch,
      frameWidth,
      bodyRef,
      spanOnly,
      isSpanLayer,
      beginSpanCreate,
      isFrameTool,
      disableCellSelection,
    ]
  )

  const onRowDoubleClick = useCallback(
    (event: MouseEvent<HTMLElement>, layerId: string) => {
      if (!isFrameTool) return
      // A double-press-drag already committed a correctly-sized span via
      // beginSpanCreate; the native dblclick this same release also fires must not
      // add a second, wrongly-sized one on top of it.
      if (wasSpanJustCreatedByDrag()) return
      const body = bodyRef.current
      if (!body) return
      const rect = body.getBoundingClientRect()
      const frame = Math.max(0, Math.floor((event.clientX - rect.left) / frameWidth))
      const layer = (store.getState() as AuthoringRootState).layers.layers.get(layerId)
      if (!layer) return
      // Span-mode layers create a ranged span rather than a point keyframe.
      const def = config.layerTypes.find((d) => d.layerType === String(layer.layerType))
      if (def?.defaultFrameKind === FrameKind.SPAN) {
        dispatch(
          layersActions.addSpan({
            layerId,
            frame,
            duration: DEFAULT_SPAN_DURATION,
            value: spanValueFor(layerId),
          })
        )
        return
      }
      if (layer.timeline.frames.some((f) => f.frame === frame)) return
      // Capture the layer type's current live value(s) so the key preserves state.
      const captured = def?.captureValue?.(layer, frame)
      dispatch(
        typeof captured === 'object'
          ? layersActions.addKeyframe({ layerId, frame, values: captured })
          : layersActions.addKeyframe({ layerId, frame, value: captured })
      )
    },
    [
      store,
      config,
      dispatch,
      frameWidth,
      bodyRef,
      spanValueFor,
      isFrameTool,
      wasSpanJustCreatedByDrag,
    ]
  )

  return { marquee, onRowPointerDown, onRowDoubleClick }
}
