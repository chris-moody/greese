import { useCallback } from 'react'
import { layersActions } from '../state/layers.slice.ts'
import { playbackActions } from '../state/playback.slice.ts'
import { timelineActions } from '../state/timeline.slice.ts'
import { coalesce } from '../state/commandsMiddleware.ts'
import { FrameKind } from '../core/types/frame.types.ts'
import type { AuthoringRootState } from '../state/createAuthoringStore.ts'
import {
  gatherSelected,
  cellsToRows,
  type TimelineEditingContext,
} from './timelineEditing.ts'

/**
 * Keyframe command group: whole-timeline frame count (insert/remove/ripple)
 * plus per-cell keyframe creation/clearing. Each op is an undoable command
 * (batched into a single history entry via `coalesce`).
 */
export const useKeyframeEditing = ({
  store,
  dispatch,
  config,
}: TimelineEditingContext) => {
  const insertFrame = useCallback(() => {
    const state = store.getState() as AuthoringRootState
    dispatch(layersActions.insertFrames({ at: state.playback.currentFrame, count: 1 }))
    dispatch(playbackActions.setFrameCount(state.playback.frameCount + 1))
  }, [store, dispatch])

  const removeFrame = useCallback(() => {
    const state = store.getState() as AuthoringRootState
    dispatch(layersActions.removeFrames({ at: state.playback.currentFrame, count: 1 }))
    dispatch(playbackActions.setFrameCount(state.playback.frameCount - 1))
  }, [store, dispatch])

  const rippleDelete = useCallback(() => {
    const rows = gatherSelected(store.getState() as AuthoringRootState)
    if (rows.length === 0) return
    const byLayer = new Map<string, number[]>()
    rows.forEach((row) =>
      byLayer.set(row.layerId, [...(byLayer.get(row.layerId) ?? []), row.frame])
    )
    const key = `ripple-${Date.now()}`
    byLayer.forEach((frames, layerId) =>
      dispatch(coalesce(layersActions.rippleDeleteFrames({ layerId, frames }), key))
    )
    dispatch(timelineActions.clearTimelineSelection())
  }, [store, dispatch])

  /**
   * Add a keyframe at (layer, frame), capturing the layer type's current live
   * value ({@link import('../types/media.types').LayerTypeDef.captureValue}) so a
   * new key preserves the object's present state (e.g. a bone's rotation).
   */
  const addKeyframeAt = useCallback(
    (layerId: string, frame: number) => {
      const layer = (store.getState() as AuthoringRootState).layers.layers.get(layerId)
      if (!layer) return
      const def = config.layerTypes.find((d) => d.layerType === String(layer.layerType))
      const captured = def?.captureValue?.(layer, frame)
      dispatch(
        typeof captured === 'object'
          ? layersActions.addKeyframe({ layerId, frame, values: captured })
          : layersActions.addKeyframe({ layerId, frame, value: captured })
      )
    },
    [store, config, dispatch]
  )

  /**
   * Add a keyframe to every selected cell (see `timeline.cellSelection`) in one
   * undoable command. Positions that already hold a keyframe are skipped.
   */
  const addKeyframesToCells = useCallback(() => {
    const state = store.getState() as AuthoringRootState
    const cells = state.timeline.cellSelection
    if (cells.size === 0) return
    const key = `add-cells-${Date.now()}`
    cells.forEach((cell) => {
      const sep = cell.lastIndexOf(':')
      const layerId = cell.slice(0, sep)
      const frame = Number(cell.slice(sep + 1))
      const layer = state.layers.layers.get(layerId)
      if (!layer || layer.timeline.frames.some((f) => f.frame === frame)) return
      const def = config.layerTypes.find((d) => d.layerType === String(layer.layerType))
      const captured = def?.captureValue?.(layer, frame)
      dispatch(
        coalesce(
          typeof captured === 'object'
            ? layersActions.addKeyframe({ layerId, frame, values: captured })
            : layersActions.addKeyframe({ layerId, frame, value: captured }),
          key
        )
      )
    })
  }, [store, config, dispatch])

  /**
   * Add an *empty* keyframe (keys the absence of content — the layer stops
   * rendering there until its next keyframe) to each target cell that has no
   * keyframe yet. Targets the explicit cells (e.g. the right-clicked frame),
   * else the cell selection. Cells already holding any frame are skipped.
   */
  const addEmptyKeyframesToCells = useCallback(
    (explicit?: { layerId: string; frame: number }[]) => {
      const state = store.getState() as AuthoringRootState
      const cells = explicit ?? cellsToRows(state.timeline.cellSelection)
      if (cells.length === 0) return
      const key = `add-empty-${Date.now()}`
      cells.forEach(({ layerId, frame }) => {
        const layer = state.layers.layers.get(layerId)
        if (!layer || layer.timeline.frames.some((f) => f.frame === frame)) return
        dispatch(
          coalesce(
            layersActions.addKeyframe({ layerId, frame, kind: FrameKind.EMPTY }),
            key
          )
        )
      })
    },
    [store, dispatch]
  )

  /**
   * Clear the keyframe in each target cell — converting it to an empty keyframe
   * (see `layersActions.clearKeyframe`). Cells without a keyframe, with a span,
   * or whose keyframe is already empty are skipped, so a mixed batch applies
   * only where it means something.
   */
  const clearKeyframesInCells = useCallback(
    (explicit?: { layerId: string; frame: number }[]) => {
      const state = store.getState() as AuthoringRootState
      const cells = explicit ?? cellsToRows(state.timeline.cellSelection)
      if (cells.length === 0) return
      const key = `clear-${Date.now()}`
      cells.forEach(({ layerId, frame }) => {
        const target = state.layers.layers
          .get(layerId)
          ?.timeline.frames.find((f) => f.frame === frame)
        if (!target || target.kind === FrameKind.SPAN || target.kind === FrameKind.EMPTY)
          return
        dispatch(coalesce(layersActions.clearKeyframe({ layerId, frame }), key))
      })
    },
    [store, dispatch]
  )

  /** Clear every selected (non-span, non-empty) keyframe — see {@link clearKeyframesInCells}. */
  const clearSelectedKeyframes = useCallback(() => {
    const rows = gatherSelected(store.getState() as AuthoringRootState).filter(
      (row) => row.kind !== FrameKind.SPAN && row.kind !== FrameKind.EMPTY
    )
    if (rows.length === 0) return
    const key = `clear-${Date.now()}`
    rows.forEach((row) =>
      dispatch(
        coalesce(
          layersActions.clearKeyframe({ layerId: row.layerId, frame: row.frame }),
          key
        )
      )
    )
  }, [store, dispatch])

  return {
    insertFrame,
    removeFrame,
    rippleDelete,
    addKeyframeAt,
    addKeyframesToCells,
    addEmptyKeyframesToCells,
    clearKeyframesInCells,
    clearSelectedKeyframes,
  }
}
