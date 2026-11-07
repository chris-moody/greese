'use client'
import { useMemo, type PointerEvent, type MouseEvent, type RefObject } from 'react'
import { useAuthoringSelector } from '../../environment/environment.tsx'
import { selectActiveTimelineTool } from '../../state/selectors.ts'
import { TimelineToolId } from '../../state/timelineTools.slice.ts'
import type { MarqueeBox } from './frameInteractions.ts'
import { useSpanCreate } from './useSpanCreate.ts'
import type { SpanDraft } from './useSpanCreate.ts'
import { useMarqueeSelection } from './useMarqueeSelection.ts'
import { useKeyframeDrag } from './useKeyframeDrag.ts'
import type { KeyframeDrag } from './useKeyframeDrag.ts'
import { useSpanResize } from './useSpanResize.ts'
import type { SpanResize } from './useSpanResize.ts'

export type { MarqueeBox } from './frameInteractions.ts'
export type { SpanDraft } from './useSpanCreate.ts'
export type { KeyframeDrag } from './useKeyframeDrag.ts'
export type { SpanResize } from './useSpanResize.ts'

export interface FrameInteractions {
  marquee: MarqueeBox | null
  drag: KeyframeDrag | null
  resize: SpanResize | null
  spanDraft: SpanDraft | null
  onRowPointerDown: (event: PointerEvent<HTMLElement>, layerId: string) => void
  onRowDoubleClick: (event: MouseEvent<HTMLElement>, layerId: string) => void
  onKeyframePointerDown: (
    event: PointerEvent<HTMLElement>,
    layerId: string,
    frameId: string,
    frame: number
  ) => void
  onSpanTrimStart: (
    event: PointerEvent<HTMLElement>,
    layerId: string,
    spanId: string,
    side: 'left' | 'right',
    frame: number,
    duration: number
  ) => void
}

export interface FrameInteractionOptions {
  /** Skip frame-cell selection entirely (no cell dispatches from click/marquee). */
  disableCellSelection?: boolean
}

/**
 * Pointer interactions for the frame grid — composes the four gestures the frame
 * grid supports out of their own sibling hooks, so each stays independently
 * readable and testable:
 * - {@link useSpanCreate} — press-drag sizing of a new span on a span-kind layer.
 * - {@link useMarqueeSelection} — press-drag on empty grid → marquee select
 *   (replace, Shift adds, ⌘/Ctrl subtracts); a plain press clears the selection;
 *   double-click keys the frame.
 * - {@link useKeyframeDrag} — press a keyframe → select it (⌘ toggles, Shift
 *   ranges within the layer); drag → move the whole selection as a visual
 *   preview until drop.
 * - {@link useSpanResize} — drag a span's left/right edge to trim it.
 *
 * This hook only wires them together and re-exposes the exact same
 * `FrameInteractions` shape every consumer already depends on.
 */
export const useFrameInteractions = (
  frameWidth: number,
  bodyRef: RefObject<HTMLElement | null>,
  options: FrameInteractionOptions = {}
): FrameInteractions => {
  const { disableCellSelection = false } = options
  // Direct row/keyframe interaction is a Frame-tool-only concern — other tools
  // leave the frame grid visible but non-interactive (span trim stays active).
  const isFrameTool =
    useAuthoringSelector(selectActiveTimelineTool) === TimelineToolId.frame

  const spanCreate = useSpanCreate(frameWidth)
  const { spanDraft } = spanCreate
  const { marquee, onRowPointerDown, onRowDoubleClick } = useMarqueeSelection(
    frameWidth,
    bodyRef,
    isFrameTool,
    disableCellSelection,
    spanCreate
  )
  const { drag, onKeyframePointerDown } = useKeyframeDrag(frameWidth, isFrameTool)
  const { resize, onSpanTrimStart } = useSpanResize(frameWidth)

  // Memoized like useTimelineEditing's return: every field is either a stable
  // useCallback or preview state, so this object's identity only changes when
  // something real changes — required for a memo(TimelineFrames) boundary to
  // do anything (an unmemoized object literal here would defeat it every render).
  return useMemo(
    () => ({
      marquee,
      drag,
      resize,
      spanDraft,
      onRowPointerDown,
      onRowDoubleClick,
      onKeyframePointerDown,
      onSpanTrimStart,
    }),
    [
      marquee,
      drag,
      resize,
      spanDraft,
      onRowPointerDown,
      onRowDoubleClick,
      onKeyframePointerDown,
      onSpanTrimStart,
    ]
  )
}
