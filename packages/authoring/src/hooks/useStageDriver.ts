'use client'
import { useEffect, useRef, type RefObject } from 'react'
import { useAuthoringEnvironment } from '../environment/environment.tsx'
import type { AuthoringLayer } from '../core/types/layer.types.ts'
import type { LayerTypeDef } from '../environment/media.types.ts'
import type { NavFrame } from '../state/navigation.slice.ts'
import type { StageBackend } from '../core/stage/renderObject.types.ts'
import {
  applySelection,
  backendReconciles,
  indexLayerTypes,
  reconcileObjects,
  resolveEditInPlaceTransition,
  sampleLayers,
} from '../core/stage/stageDriver.ts'

/**
 * The render driver — the single seam between store state and the media backend.
 *
 * It runs synchronously off `store.subscribe` (not a frame-keyed React effect) so
 * it stays in lockstep with `currentFrame` whether it changes from scrubbing or
 * the playback clock. Each store change it does three things, in order:
 *
 *  1. **Reconcile** — diff the active scene's layers against `backend.objects`,
 *     creating objects for new layers (via the layer type's `createRenderObject`)
 *     and destroying objects whose layer was removed. This is what makes a nested
 *     subview render only its own scene: swapping the layer state removes the
 *     parent's objects and adds the child's. Exception: any tick where the
 *     navigation stack's top frame *lands on* `NavMode.EDIT_IN_PLACE` — whether by
 *     growing onto a fresh one (a stage double-click drill-in) or by shrinking
 *     back onto a shallower one that's still `EDIT_IN_PLACE` (a breadcrumb/
 *     blank-area-double-click step back out of a deeper drill) — for a backend
 *     that implements `composeEditInPlace`: the destroy half is skipped entirely
 *     (the backend reparents the previously-live objects into its own ghost
 *     backdrop, or back out of it, itself) and the hook is called once, positioned
 *     by the new top frame's own `stageTransform`. Both directions matter: a step
 *     back that's still `EDIT_IN_PLACE` is *not* a full exit — it needs
 *     `composeEditInPlace` re-run against the shallower level's own
 *     `liveLayerIds`, not `resetEditInPlace` (which only clears ghost dimming, it
 *     never reparents anything — leaving that level's own objects stranded
 *     wherever the deeper drill last left them). Landing on a *lower* stack
 *     length only, without checking the landed-on frame's own mode, used to be
 *     read as "not an entry" unconditionally, which — combined with
 *     `navigateToLevel` previously dispatching layers *before* the frame change,
 *     the opposite order this bridging relies on for every other navigation
 *     entry point — meant a step back within an edit-in-place chain always fell
 *     through to `resetEditInPlace` instead, corrupting parenting/ghost state one
 *     level at a time (see `navigateToLevel`'s own doc comment for the dispatch-
 *     order half of this fix). On every later tick while an `EDIT_IN_PLACE` frame
 *     is still on top and unchanged, the destroy half runs again as normal but
 *     skips whatever `backend.ghostedObjectIds` reports (see `reconcileObjects`'s
 *     doc comment) — a live-scene edit while still drilled in reconciles its own
 *     scene normally without sweeping up the ghost backdrop. Landing on anything
 *     other than `EDIT_IN_PLACE` (an `ISOLATED` open, landing back at the root, a
 *     backend without the hook) reconciles exactly as described above, no
 *     exceptions, and calls `resetEditInPlace` if there's anything ghosted to
 *     clear.
 *  2. **Sample** — push each layer's sampled value into its render object.
 *  3. **Select** — mirror the shared layer selection onto the objects.
 *
 * Media-agnostic: object construction, sampling, and drawing all come from the
 * media module's {@link LayerTypeDef}s and {@link StageBackend}.
 */
export const useStageDriver = (
  container: RefObject<HTMLElement | null>
): RefObject<StageBackend | null> => {
  const { config, store } = useAuthoringEnvironment()
  const backendRef = useRef<StageBackend | null>(null)

  useEffect(() => {
    const el = container.current
    if (!el || !config.createStage) return

    const backend = config.createStage({ container: el, store })
    backendRef.current = backend

    const defs = indexLayerTypes(config.layerTypes as LayerTypeDef[])
    const canReconcile = backendReconciles(backend)

    let prevFrame = -1
    let prevLayers: unknown = null
    // Per-layer reference cache for `sampleLayers` — lets it skip re-sampling
    // layers that didn't actually change when *some* layer in the scene did
    // (e.g. autokeying one joint mid-drag shouldn't re-sample every other
    // joint too) — see that function's own doc comment.
    const lastLayerRefById = new Map<string, AuthoringLayer>()

    // Nav-stack top frame, tracked separately from `layers` because a
    // navigation action dispatches `pushFrame`/`replaceTop`/`setStack` and
    // `loadLayerState` as two *separate* actions (`useNavigation.openAsset`,
    // `PixelsPixiBackend.openInstanceInPlace`) — each triggers its own tick.
    // The frame reference changes on the first tick (layers unchanged yet);
    // the layers reference changes on the second (frame unchanged since the
    // first tick already caught it). `pendingEditInPlaceEntry` bridges the
    // two: latched the instant the frame changes into a genuine edit-in-place
    // *entry* (see below), consumed on whichever later tick actually sees
    // `layersChanged`.
    let prevTopFrame: NavFrame | null = null
    let prevStackLength = 0
    // `skipDestroy` — see `resolveEditInPlaceTransition`'s own doc comment.
    let pendingEditInPlaceEntry: { frame: NavFrame; skipDestroy: boolean } | null = null

    const tick = () => {
      const state = store.getState()
      const layers = state.layers.layers
      const frame = state.playback.currentFrame
      const layersChanged = layers !== prevLayers
      const frameChanged = frame !== prevFrame

      const navStack = state.navigation.stack
      const topFrame = navStack.length > 0 ? navStack[navStack.length - 1]! : null
      if (topFrame !== prevTopFrame) {
        // See `resolveEditInPlaceTransition`'s own doc comment for the full
        // reasoning — this hook isn't independently testable (a React hook
        // wired to a live store), so the decision itself lives in a plain,
        // unit-tested function in `stageDriver.helpers.ts` instead.
        const transition = resolveEditInPlaceTransition(
          topFrame,
          navStack.length,
          prevStackLength,
          !!backend.composeEditInPlace
        )
        if (transition.landsOnEditInPlace) {
          pendingEditInPlaceEntry = {
            frame: topFrame!,
            skipDestroy: transition.skipDestroy,
          }
        } else {
          pendingEditInPlaceEntry = null
          if (
            transition.shouldReset &&
            backend.resetEditInPlace &&
            backend.ghostedObjectIds?.size
          )
            backend.resetEditInPlace()
        }
        prevTopFrame = topFrame
        prevStackLength = navStack.length
      }

      if (layersChanged && canReconcile) {
        const editInPlaceEntry = pendingEditInPlaceEntry
        reconcileObjects(backend, defs, layers, {
          skipDestroy: editInPlaceEntry?.skipDestroy ?? false,
        })
        if (editInPlaceEntry) {
          backend.composeEditInPlace!(
            new Set(layers.keys()),
            editInPlaceEntry.frame.stageTransform
          )
          pendingEditInPlaceEntry = null
        }
      }
      if (layersChanged || frameChanged) {
        sampleLayers(backend, defs, layers, frame, { frameChanged, lastLayerRefById })
      }
      // Selection is cheap and its own concern; apply every tick.
      applySelection(backend, state.layers.selection)
      prevLayers = layers
      prevFrame = frame
    }

    tick()
    const unsubscribe = store.subscribe(tick)

    return () => {
      unsubscribe()
      backend.destroy()
      backendRef.current = null
    }
  }, [config, store, container])

  return backendRef
}
