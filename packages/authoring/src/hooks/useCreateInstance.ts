'use client'
import { useCallback } from 'react'
import { useAuthoringEnvironment } from '../environment/environment.tsx'
import { layersActions } from '../state/layers.slice.ts'
import {
  SYMBOL_INSTANCE_LAYER_TYPE,
  IMAGE_LAYER_TYPE,
} from '../core/library/layerTypes.ts'
import { makeLayer } from '../core/layers/layers.ts'
import {
  classifyLibraryAsset,
  LibraryAssetKind,
} from '../core/library/libraryAssetKind.ts'
import type { AuthoringRootState } from '../state/createAuthoringStore.ts'
import { nextInstanceName } from '../core/library/symbolNaming.ts'

/**
 * Places a library-asset instance in the current scene — the drop-target side
 * of drag-to-place instancing (`HierarchicalList.onExternalDrop`, stage drop).
 * Mirrors `useNavigation`'s "read state, guard, dispatch" shape. A
 * Graphic/Animation-kind asset places a single `SYMBOL_INSTANCE_LAYER_TYPE`
 * layer — the stage backend composites the referenced asset's current scene
 * into it live (see `NeoPixelsPixiBackend.compositeInstance`), so unlike
 * `openAsset` this never needs to read the asset's own layer state. An
 * Image-kind asset places a single `IMAGE_LAYER_TYPE` layer instead — it has
 * no nested scene at all, so it's built directly via `layersActions.addLayer`
 * (the generic `layersActions.createInstance` reducer hard-codes
 * `SymbolInstanceProperties`' own shape — `{ assetId, x, y, rotation,
 * scaleX, scaleY }`, with no `imageId`/`width`/`height` concept — not
 * reusable as-is for this kind).
 */
export const useCreateInstance = () => {
  const { store } = useAuthoringEnvironment()

  return useCallback(
    (assetId: string, x = 0, y = 0): boolean => {
      const state = store.getState() as AuthoringRootState
      const asset = state.library.assets.get(assetId)
      if (!asset) return false
      // Reject placing a symbol inside itself (directly, or inside a subview
      // nested anywhere under it) — every frame on the nav stack records the
      // asset id it drilled into, so that stack *is* the ancestry chain.
      if (state.navigation.stack.some((frame) => frame.assetId === assetId)) return false

      if (classifyLibraryAsset(asset) === LibraryAssetKind.Image) {
        if (!asset.image) {
          return false
        }
        const name = nextInstanceName(asset.name, state.layers.layers)
        const layer = makeLayer({
          name,
          layerType: IMAGE_LAYER_TYPE,
          properties: {
            imageId: asset.image.imageId,
            width: asset.image.width,
            height: asset.image.height,
            x,
            y,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
          },
        })
        store.dispatch(layersActions.addLayer({ layer }))
        store.dispatch(layersActions.setSelection([layer.id]))
        return true
      }

      // Checked before dispatching `createInstance` below — the new layer's
      // own timeline always starts empty, so this has to ask whether the
      // *scope being dropped into* is already animated (some existing layer
      // there has its own keyframes), not whether the new layer does.
      const hasAnimatedSibling = [...state.layers.layers.values()].some(
        (l) => l.timeline.frames.length > 0
      )

      const name = nextInstanceName(asset.name, state.layers.layers)
      store.dispatch(
        layersActions.createInstance({
          assetId,
          layerType: SYMBOL_INSTANCE_LAYER_TYPE,
          x,
          y,
          name,
        })
      )

      // Seed a matching keyframe for the new instance at the current
      // playhead when dropped into an already-animated scope — otherwise it
      // has no timeline presence at all and silently doesn't participate in
      // the scene's animation until someone happens to keyframe it directly.
      // `createInstance`'s reducer generates the new layer's id internally
      // and only surfaces it via selection, so read it back post-dispatch
      // (safe — Redux dispatch is synchronous).
      if (hasAnimatedSibling) {
        const after = store.getState() as AuthoringRootState
        const newLayerId = [...after.layers.selection][0]
        if (newLayerId) {
          store.dispatch(
            layersActions.addKeyframe({
              layerId: newLayerId,
              frame: after.playback.currentFrame,
              values: { x, y, rotation: 0, scaleX: 1, scaleY: 1 },
            })
          )
        }
      }

      return true
    },
    [store]
  )
}
