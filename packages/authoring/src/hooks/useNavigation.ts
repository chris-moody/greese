'use client'
import { useCallback } from 'react'
import { useAuthoringEnvironment } from '../environment/environment.tsx'
import { layersActions } from '../state/layers.slice.ts'
import { libraryActions } from '../state/library.slice.ts'
import { navigationActions, NavMode } from '../state/navigation.slice.ts'
import { timelineActions } from '../state/timeline.slice.ts'
import { clearHistory } from '../state/commandsMiddleware.ts'
import { emptyLayerState } from '../core/layers/layers.ts'
import { navigateToLevel } from '../state/navigation.helpers.ts'
import type { AuthoringRootState } from '../state/createAuthoringStore.ts'
import type { Matrix2D } from '../core/stage/renderObject.types.ts'

/**
 * Nested-subview navigation (Phase 5). Opening a library asset swaps the active
 * layer state to the asset's scene (remembering the enclosing scene to restore
 * on the way back); navigating a breadcrumb saves the edited scenes back to the
 * library. History is reset on each scene change so undo stays within a scene.
 */
export const useNavigation = () => {
  const { store } = useAuthoringEnvironment()
  const dispatch = store.dispatch

  const openAsset = useCallback(
    (
      assetId: string,
      mode: NavMode = NavMode.ISOLATED,
      stageTransform: Matrix2D | null = null
    ) => {
      const state = store.getState() as AuthoringRootState
      const asset = state.library.assets.get(assetId)
      if (!asset) return
      dispatch(
        navigationActions.pushFrame({
          assetId,
          name: asset.name,
          mode,
          parentLayers: state.layers,
          stageTransform,
        })
      )
      dispatch(layersActions.loadLayerState(asset.scene?.layerState ?? emptyLayerState()))
      dispatch(timelineActions.clearTimelineSelection())
      dispatch(clearHistory())
    },
    [store, dispatch]
  )

  /**
   * Like `openAsset`, but swaps the current top-of-stack frame for the new one
   * instead of nesting under it — for opening a sibling subview from within
   * the same hierarchy level (e.g. switching skin slots) without stacking a
   * redundant breadcrumb. Persists the outgoing frame's scene back to its
   * asset first, and the replacement frame inherits the outgoing frame's
   * `parentLayers` so back-navigation still restores the shared parent.
   * Falls back to `openAsset` when there's no frame to replace.
   */
  const openAssetReplacing = useCallback(
    (
      assetId: string,
      mode: NavMode = NavMode.ISOLATED,
      stageTransform: Matrix2D | null = null
    ) => {
      const state = store.getState() as AuthoringRootState
      const asset = state.library.assets.get(assetId)
      if (!asset) return
      const stack = state.navigation.stack
      const top = stack[stack.length - 1]
      if (!top) {
        openAsset(assetId, mode, stageTransform)
        return
      }
      dispatch(
        libraryActions.updateAssetScene({ id: top.assetId, layerState: state.layers })
      )
      dispatch(
        navigationActions.replaceTop({
          assetId,
          name: asset.name,
          mode,
          parentLayers: top.parentLayers,
          stageTransform,
        })
      )
      dispatch(layersActions.loadLayerState(asset.scene?.layerState ?? emptyLayerState()))
      dispatch(timelineActions.clearTimelineSelection())
      dispatch(clearHistory())
    },
    [store, dispatch, openAsset]
  )

  /** Navigate to a breadcrumb level (`index` -1 = root, else the stack index). */
  const navigateTo = useCallback(
    (index: number) => navigateToLevel(store, index),
    [store]
  )

  return { openAsset, openAssetReplacing, navigateTo }
}
