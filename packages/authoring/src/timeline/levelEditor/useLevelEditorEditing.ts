import { nanoid } from '@reduxjs/toolkit'
import { useCallback } from 'react'
import {
  useAuthoringDispatch,
  useAuthoringEnvironment,
  useAuthoringSelector,
} from '../../environment/environment.tsx'
import { timelineActions, type ClipboardLevelPoint } from '../../state/timeline.slice.ts'
import { selectLevelPointSelection } from '../../state/selectors.ts'
import type { AuthoringRootState } from '../../state/createAuthoringStore.ts'
import { flattenPoints } from '../../core/timeline/levelEditor.ts'
import type { LevelPoint } from '../../core/timeline/levelEditor.types.ts'

/**
 * Copy/paste/delete/flatten for `TimelineLevelEditor` points, parallel to
 * `useTimelineEditing`'s keyframe operations. Points themselves live wherever
 * the consumer stores its curve (e.g. `rateCurve.slice.ts`, Phase 7) — passed
 * in as `points`/`onPointsChange`; only selection and the shared clipboard
 * live in `timeline.slice.ts`.
 */
export const useLevelEditorEditing = (
  points: LevelPoint[],
  onPointsChange: (points: LevelPoint[]) => void
) => {
  const { store } = useAuthoringEnvironment()
  const dispatch = useAuthoringDispatch()
  const selection = useAuthoringSelector(selectLevelPointSelection)

  const deleteSelectedPoints = useCallback(() => {
    if (selection.size === 0) return
    onPointsChange(points.filter((p) => !selection.has(p.id)))
    dispatch(timelineActions.clearLevelPointSelection())
  }, [selection, points, onPointsChange, dispatch])

  const copySelectedPoints = useCallback(() => {
    const rows = points.filter((p) => selection.has(p.id))
    if (rows.length === 0) return
    const anchor = Math.min(...rows.map((r) => r.tick))
    const levelPoints: ClipboardLevelPoint[] = rows.map((r) => ({
      offsetTick: r.tick - anchor,
      value: r.value,
    }))
    const state = store.getState() as AuthoringRootState
    dispatch(
      timelineActions.setClipboard({
        items: [],
        tweens: [],
        levelPoints,
        mediaType: state.timeline.clipboard?.mediaType ?? 'unknown',
        version: 1,
      })
    )
  }, [selection, points, store, dispatch])

  /** Paste the clipboard's points anchored at `anchorTick`. */
  const pasteSelectedPoints = useCallback(
    (anchorTick: number) => {
      const state = store.getState() as AuthoringRootState
      const clip = state.timeline.clipboard
      if (!clip?.levelPoints?.length) return
      const pasted: LevelPoint[] = clip.levelPoints.map((lp) => ({
        id: nanoid(),
        tick: anchorTick + lp.offsetTick,
        value: lp.value,
      }))
      onPointsChange([...points, ...pasted])
      dispatch(timelineActions.setLevelPointSelection(pasted.map((p) => p.id)))
    },
    [store, points, onPointsChange, dispatch]
  )

  /** Replace the selected points with a single point at their average value. */
  const flattenSelected = useCallback(() => {
    const rows = points.filter((p) => selection.has(p.id))
    if (rows.length === 0) return
    const average = rows.reduce((sum, r) => sum + r.value, 0) / rows.length
    const kept = points.filter((p) => !selection.has(p.id))
    const flat = flattenPoints(rows, average)
    onPointsChange([...kept, ...flat])
    dispatch(timelineActions.setLevelPointSelection(flat.map((p) => p.id)))
  }, [selection, points, onPointsChange, dispatch])

  return {
    deleteSelectedPoints,
    copySelectedPoints,
    pasteSelectedPoints,
    flattenSelected,
  }
}
