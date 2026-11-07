import { useCallback } from 'react'
import { timelineActions, type ClipboardMarker } from '../state/timeline.slice.ts'
import { coalesce } from '../state/commandsMiddleware.ts'
import type { AuthoringRootState } from '../state/createAuthoringStore.ts'
import { gatherSelectedMarkers, type TimelineEditingContext } from './timelineEditing.ts'

/**
 * Marker command group: delete/copy/paste for timeline markers, mirroring the
 * keyframe clipboard's relative-offset scheme (§20b) but kept separate since
 * markers live outside any layer. Each op is an undoable command (batched
 * into a single history entry via `coalesce`).
 */
export const useMarkerEditing = ({ store, dispatch }: TimelineEditingContext) => {
  /** Delete every selected marker (one undo step). */
  const deleteSelectedMarkers = useCallback(() => {
    const rows = gatherSelectedMarkers(store.getState() as AuthoringRootState)
    if (rows.length === 0) return
    const key = `delete-markers-${Date.now()}`
    rows.forEach((m) => dispatch(coalesce(timelineActions.removeMarker(m.id), key)))
  }, [store, dispatch])

  /** Copy the selected markers to the clipboard, relative to their earliest frame. */
  const copyMarkers = useCallback(() => {
    const state = store.getState() as AuthoringRootState
    const rows = gatherSelectedMarkers(state)
    if (rows.length === 0) return
    const anchor = Math.min(...rows.map((r) => r.frame))
    const markers: ClipboardMarker[] = rows.map((r) => ({
      frameOffset: r.frame - anchor,
      label: r.label,
    }))
    dispatch(
      timelineActions.setClipboard({
        items: [],
        tweens: [],
        markers,
        mediaType: state.timeline.clipboard?.mediaType ?? 'unknown',
        version: 1,
      })
    )
  }, [store, dispatch])

  /** Paste the clipboard's markers relative to the playhead, into the active scope. */
  const pasteMarkers = useCallback(() => {
    const state = store.getState() as AuthoringRootState
    const clip = state.timeline.clipboard
    if (!clip?.markers?.length) return
    const origin = state.playback.currentFrame
    const scope = state.timelineScope.activeScope
    const key = `paste-markers-${Date.now()}`
    clip.markers.forEach((m) =>
      dispatch(
        coalesce(
          timelineActions.addMarker({
            scope,
            frame: origin + m.frameOffset,
            label: m.label,
          }),
          key
        )
      )
    )
  }, [store, dispatch])

  return { deleteSelectedMarkers, copyMarkers, pasteMarkers }
}
