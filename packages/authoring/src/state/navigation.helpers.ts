import { layersActions } from './layers.slice.ts'
import { libraryActions } from './library.slice.ts'
import { navigationActions, NavMode, type NavFrame } from './navigation.slice.ts'
import { timelineActions } from './timeline.slice.ts'
import { clearHistory } from './commandsMiddleware.ts'
import type { AuthoringRootState } from './createAuthoringStore.ts'
import type { AuthoringStore } from './createAuthoringStore.ts'

/**
 * The topmost frame that isn't an `EDIT_IN_PLACE` drill-in — i.e. the frame
 * whose own subview/panel-layout identity should stay in effect while the
 * user drills into a nested symbol from the stage. A shell derives its
 * panel-layout key / stage-remount key from this instead of the raw stack
 * top, so an edit-in-place push doesn't read as "a new subview" the way an
 * `ISOLATED` open does — see `RigatronShell.tsx`'s `graphicsSubviewKey` and
 * `PixelsShell.tsx`'s `isEditingAnimationSymbol`.
 *
 * Returns `null` for an empty stack or a stack made up entirely of
 * `EDIT_IN_PLACE` frames (shouldn't happen in practice — a drill-in only ever
 * pushes on top of either an empty stack or an `ISOLATED` frame, since
 * `EDIT_IN_PLACE` only ever originates from double-clicking an instance on an
 * already-reachable scene).
 */
export const stableTopFrame = (stack: readonly NavFrame[]): NavFrame | null => {
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    const frame = stack[i]!
    if (frame.mode !== NavMode.EDIT_IN_PLACE) return frame
  }
  return null
}

/**
 * Plain-function core of `useNavigation.ts`'s `navigateTo` — same dispatch
 * sequence (persist every scene from the current level down to `index`+1
 * back to its asset, load the target level's layers, truncate the stack,
 * clear timeline selection/history), extracted so a call site with no
 * component to hook into — a `StageBackend` class's own pointer handler,
 * not a React component — can drive breadcrumb navigation directly against
 * a `store` reference, the same way `skinLayerState.helpers.ts`'s
 * `openSkinSlotInPlace` drives `pushFrame` directly instead of going through
 * `useNavigation.openAsset`. `useNavigation`'s own `navigateTo` is a thin
 * `useCallback` wrapper around this now, not a separate implementation.
 * `index` -1 = root, else the stack index to land on (its own frame stays
 * in the stack — the caller lands *inside* that frame, not above it).
 */
export const navigateToLevel = (store: AuthoringStore, index: number): void => {
  const state = store.getState() as AuthoringRootState
  const stack = state.navigation.stack
  if (stack.length === 0 || index === stack.length - 1) return

  for (let i = stack.length - 1; i >= index + 1; i--) {
    const layerState = i === stack.length - 1 ? state.layers : stack[i + 1]!.parentLayers
    store.dispatch(libraryActions.updateAssetScene({ id: stack[i]!.assetId, layerState }))
  }

  const targetLayers = index < 0 ? stack[0]!.parentLayers : stack[index + 1]!.parentLayers
  // `setStack` dispatches *before* `loadLayerState` — matching `openAsset`/
  // `openAssetReplacing`/`openInstanceInPlace`'s own frame-then-layers order
  // (every other navigation entry point in the app). `useStageDriver`'s tick
  // loop bridges a nav-frame change to the *next* tick's layers change via a
  // pending flag it only ever sets from the frame-change branch — reversed
  // here (as this used to be), the layers already land on the *first* tick,
  // before the frame change (still one tick away) has had any chance to set
  // that flag, so a still-`EDIT_IN_PLACE` step back to a shallower level
  // (deeper drill's breadcrumb, or the blank-area double-click) silently fell
  // through to a plain reconcile instead of `composeEditInPlace`'s
  // re-ghosting pass — see `useStageDriver.ts`'s own doc comment.
  store.dispatch(navigationActions.setStack(index < 0 ? [] : stack.slice(0, index + 1)))
  store.dispatch(layersActions.loadLayerState(targetLayers))
  store.dispatch(timelineActions.clearTimelineSelection())
  store.dispatch(clearHistory())
}

/**
 * Pops exactly one breadcrumb level — the "double-click a blank area of the
 * stage to go up one level" affordance both `RigatronPixiBackend` and
 * `PixelsPixiBackend` offer. A no-op at the root (empty stack), matching
 * that affordance's own "does nothing when at root" contract — `index`
 * would be `-2` there, which `navigateToLevel`'s own `stack.length === 0`
 * guard already catches before `index` is ever used for arithmetic.
 */
export const navigateUpOneLevel = (store: AuthoringStore): void => {
  const stack = (store.getState() as AuthoringRootState).navigation.stack
  navigateToLevel(store, stack.length - 2)
}
