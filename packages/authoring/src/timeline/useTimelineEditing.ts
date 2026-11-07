import { useMemo } from 'react'
import { useAuthoringEnvironment } from '../environment/environment.tsx'
import { useClipboardEditing } from './useClipboardEditing.ts'
import { useKeyframeEditing } from './useKeyframeEditing.ts'
import { useSpanEditing } from './useSpanEditing.ts'
import { useTweenEditing } from './useTweenEditing.ts'
import { useMarkerEditing } from './useMarkerEditing.ts'
import type { PasteDecision } from './timelineEditing.ts'

export type { PasteDecision }

/**
 * Core timeline-item editing operations, composed from focused command-group
 * hooks that each own one cohesive slice of the API:
 * {@link useClipboardEditing} (delete/copy/cut/paste/duplicate),
 * {@link useKeyframeEditing} (frame count + per-cell keyframes),
 * {@link useSpanEditing} (split/join/transform/create spans),
 * {@link useTweenEditing} (create/remove/merge/reverse tweens + curve presets),
 * and {@link useMarkerEditing} (delete/copy/paste markers). All five share the
 * same store/dispatch/config context (see `timelineEditing.helpers.ts`'s
 * `TimelineEditingContext`) so none re-derives it independently. This hook's
 * only job is composing their results into one flat, stable API — new timeline
 * commands belong in whichever group hook they logically extend, not here.
 */
export const useTimelineEditing = () => {
  const { store, config } = useAuthoringEnvironment()
  const dispatch = store.dispatch
  const ctx = { store, dispatch, config }

  const {
    deleteSelected,
    copy,
    cut,
    paste,
    pasteWithMapping,
    pasteIntoLayer,
    duplicate,
  } = useClipboardEditing(ctx)

  const {
    insertFrame,
    removeFrame,
    rippleDelete,
    addKeyframeAt,
    addKeyframesToCells,
    addEmptyKeyframesToCells,
    clearKeyframesInCells,
    clearSelectedKeyframes,
  } = useKeyframeEditing(ctx)

  const {
    splitAtPlayhead,
    joinSelected,
    transformSelectedSpans,
    addSpanAt,
    addSpansToCells,
    addSpanFillFromCells,
  } = useSpanEditing(ctx)

  const {
    createTweenFromSelection,
    createTweenAllAtTick,
    removeSelectedTween,
    mergeSelectedTween,
    reverseSelectedTweens,
    applyCurve,
  } = useTweenEditing(ctx)

  const { deleteSelectedMarkers, copyMarkers, pasteMarkers } = useMarkerEditing(ctx)

  // Memoized: every field above is itself a stable `useCallback` from its
  // command-group hook, so this object's identity only changes when something
  // real changes (not on every render) — consumers that put `editing` in an
  // effect dependency array (e.g. `useTimelineKeymap`) would otherwise tear
  // down and rebuild that effect on every render, which is wasteful and,
  // worse, can drop in-flight state a closure inside that effect was tracking
  // (e.g. a held-key flag).
  return useMemo(
    () => ({
      deleteSelected,
      copy,
      cut,
      paste,
      deleteSelectedMarkers,
      copyMarkers,
      pasteMarkers,
      pasteWithMapping,
      pasteIntoLayer,
      duplicate,
      splitAtPlayhead,
      joinSelected,
      transformSelectedSpans,
      insertFrame,
      removeFrame,
      rippleDelete,
      createTweenFromSelection,
      createTweenAllAtTick,
      removeSelectedTween,
      mergeSelectedTween,
      reverseSelectedTweens,
      addKeyframeAt,
      addKeyframesToCells,
      addEmptyKeyframesToCells,
      clearKeyframesInCells,
      clearSelectedKeyframes,
      addSpanAt,
      addSpansToCells,
      addSpanFillFromCells,
      applyCurve,
    }),
    [
      deleteSelected,
      copy,
      cut,
      paste,
      deleteSelectedMarkers,
      copyMarkers,
      pasteMarkers,
      pasteWithMapping,
      pasteIntoLayer,
      duplicate,
      splitAtPlayhead,
      joinSelected,
      transformSelectedSpans,
      insertFrame,
      removeFrame,
      rippleDelete,
      createTweenFromSelection,
      createTweenAllAtTick,
      removeSelectedTween,
      mergeSelectedTween,
      reverseSelectedTweens,
      addKeyframeAt,
      addKeyframesToCells,
      addEmptyKeyframesToCells,
      clearKeyframesInCells,
      clearSelectedKeyframes,
      addSpanAt,
      addSpansToCells,
      addSpanFillFromCells,
      applyCurve,
    ]
  )
}
