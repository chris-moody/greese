/**
 * Commands / undo-redo middleware.
 *
 * Design: every RTK state object is already an immutable snapshot, so pushing the
 * pre-action state onto a stack is O(1) and undo is a whole-state restore. This
 * naturally restores selection, playhead, folder-collapse, and scroll along with
 * the edit — exactly what the plan asks of undo — without per-action inverse
 * logic. A curated set of structural edits are "undoable"; transient actions
 * (playback ticks, selection, panel drags) don't create their own history steps
 * but ride along in the next snapshot.
 *
 * Coalescing: actions carrying the same `meta.coalesceKey` as the previous
 * undoable action merge into one history entry (e.g. dragging a keyframe or
 * typing a name).
 */
import type { Middleware, UnknownAction } from '@reduxjs/toolkit'
import { layersActions } from './layers.slice.ts'
import { historyActions } from './history.slice.ts'
import { timelineActions } from './timeline.slice.ts'

export const HISTORY_UNDO = 'history/undo'
export const HISTORY_REDO = 'history/redo'
export const HISTORY_CLEAR = 'history/clear'
export const RESTORE_STATE = 'authoring/restoreState'

export const undo = (): UnknownAction => ({ type: HISTORY_UNDO })
export const redo = (): UnknownAction => ({ type: HISTORY_REDO })
export const clearHistory = (): UnknownAction => ({ type: HISTORY_CLEAR })

/** Root-level action that replaces the whole state (used by undo/redo). */
export const restoreState = (payload: unknown): UnknownAction => ({
  type: RESTORE_STATE,
  payload,
})

/**
 * Mark an action as non-undoable (system/initialization). Even if its type is in
 * {@link UNDOABLE_TYPES}, it won't create a history entry — use for seeding a
 * project from saved data or other programmatic setup.
 */
export const silent = <A extends UnknownAction>(action: A): A => ({
  ...action,
  meta: { ...(action as { meta?: object }).meta, undoable: false },
})

/**
 * Tag an action with a coalesce key so a run of actions sharing that key
 * collapses into one undo step (e.g. all keyframes of one paste/duplicate).
 */
export const coalesce = <A extends UnknownAction>(action: A, key: string): A => ({
  ...action,
  meta: { ...(action as { meta?: object }).meta, coalesceKey: key },
})

/** Structural edits that create undo steps. */
const UNDOABLE_TYPES = new Set<string>([
  layersActions.addLayer.type,
  layersActions.updateLayer.type,
  layersActions.updateLayers.type,
  layersActions.removeLayer.type,
  layersActions.setRootOrder.type,
  layersActions.clearLayers.type,
  layersActions.addKeyframe.type,
  layersActions.addKeyframes.type,
  layersActions.updateNearestKeyframe.type,
  layersActions.updateNearestKeyframes.type,
  layersActions.removeKeyframe.type,
  layersActions.moveKeyframe.type,
  layersActions.addSpan.type,
  layersActions.resizeSpan.type,
  layersActions.splitSpan.type,
  layersActions.joinSpans.type,
  layersActions.insertFrames.type,
  layersActions.removeFrames.type,
  layersActions.rippleDeleteFrames.type,
  layersActions.createTween.type,
  layersActions.removeTween.type,
  layersActions.setTweenType.type,
  layersActions.setTweenEnabled.type,
  layersActions.setTweenBezier.type,
  layersActions.setTweenShortestRotation.type,
  layersActions.reverseTween.type,
  layersActions.mergeTweens.type,
  timelineActions.addMarker.type,
  timelineActions.removeMarker.type,
  timelineActions.moveMarker.type,
])

const HISTORY_LIMIT = 100

export const createCommandsMiddleware = (): Middleware => (store) => {
  let past: unknown[] = []
  let future: unknown[] = []
  let lastCoalesceKey: string | undefined

  const syncFlags = () =>
    store.dispatch(
      historyActions.setHistoryFlags({
        canUndo: past.length > 0,
        canRedo: future.length > 0,
      })
    )

  return (next) => (action) => {
    const typedAction = action as UnknownAction & {
      meta?: { coalesceKey?: string; undoable?: boolean }
    }

    switch (typedAction.type) {
      case HISTORY_UNDO: {
        if (past.length === 0) return undefined
        const previous = past.pop()
        future.push(store.getState())
        lastCoalesceKey = undefined
        next(restoreState(previous))
        syncFlags()
        return undefined
      }
      case HISTORY_REDO: {
        if (future.length === 0) return undefined
        const nextState = future.pop()
        past.push(store.getState())
        lastCoalesceKey = undefined
        next(restoreState(nextState))
        syncFlags()
        return undefined
      }
      case HISTORY_CLEAR: {
        past = []
        future = []
        lastCoalesceKey = undefined
        syncFlags()
        return undefined
      }
      default: {
        const isUndoable =
          UNDOABLE_TYPES.has(typedAction.type) && typedAction.meta?.undoable !== false
        if (!isUndoable) return next(action)

        const key = typedAction.meta?.coalesceKey
        const previous = store.getState()
        const result = next(action)

        // Merge with the previous entry when coalescing the same interaction.
        if (!(key !== undefined && key === lastCoalesceKey)) {
          past.push(previous)
          if (past.length > HISTORY_LIMIT) past.shift()
        }
        future = []
        lastCoalesceKey = key
        syncFlags()
        return result
      }
    }
  }
}
