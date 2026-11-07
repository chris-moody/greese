import type { LayerTypeDef } from '../../environment/media.types.ts'
import type { AuthoringLayer } from '../types/layer.types.ts'
import { NavMode, type NavFrame } from '../../state/navigation.slice.ts'
import type { StageBackend } from './renderObject.types.ts'

/** Index a media module's layer type defs by their `layerType` id. */
export const indexLayerTypes = (defs: LayerTypeDef[]): Map<string, LayerTypeDef> => {
  const map = new Map<string, LayerTypeDef>()
  defs.forEach((def) => map.set(def.layerType, def))
  return map
}

/** Whether the framework should drive object creation/removal for this backend. */
export const backendReconciles = (backend: StageBackend): boolean =>
  !!backend.addObject && !!backend.removeObject

/** What `useStageDriver`'s tick loop should do about edit-in-place state on a tick where the nav stack's top frame reference changed — see {@link resolveEditInPlaceTransition}. */
export interface EditInPlaceTransition {
  /** `topFrame` needs `composeEditInPlace` re-run against its own `liveLayerIds`/`stageTransform` — true whether this is a fresh drill-in (stack grew) or a step back to a shallower level that's still `NavMode.EDIT_IN_PLACE` (stack shrank/held). */
  landsOnEditInPlace: boolean
  /** Only true for a *growing* landing — see `useStageDriver.ts`'s own inline doc comment on `pendingEditInPlaceEntry` for why a shrinking/holding landing must run the driver's normal destroy pass instead (the shallower level's own objects are already protected by `ghostedObjectIds`; a deeper, now-abandoned level's objects are not, and need destroying, not ghosting a second time). Always `false` when `landsOnEditInPlace` is `false`. */
  skipDestroy: boolean
  /** `topFrame` landed on anything other than `NavMode.EDIT_IN_PLACE` (or the backend doesn't support `composeEditInPlace` at all) — a genuine exit, calling `resetEditInPlace` if anything is currently ghosted. Always the exact negation of `landsOnEditInPlace`, exposed separately for readability at call sites. */
  shouldReset: boolean
}

/**
 * Pure decision core of `useStageDriver`'s topFrame-change handling —
 * extracted so it's independently testable (the hook itself isn't: it's a
 * React hook wired to a live Redux store, and this repo's jest config can't
 * exercise that in isolation — see `rigatronEditInPlaceDepth.helpers.ts` for
 * the same extraction pattern used elsewhere in this codebase for the same
 * reason).
 *
 * Landing on an `EDIT_IN_PLACE` frame always needs `composeEditInPlace`
 * re-run against *that* frame's own state — whether the stack just grew onto
 * a fresh one (a stage double-click drill-in) or shrank/held back onto a
 * shallower one that's still `EDIT_IN_PLACE` (a breadcrumb click or
 * blank-area double-click stepping back out of a deeper drill — not a full
 * exit, since the shallower level's own objects still need un-ghosting and
 * re-compositing, and the deeper level's now-abandoned objects still need
 * destroying, not leaving as stale, duplicate ghosts of content the
 * un-ghosted parent instance is about to recomposite fresh on its own).
 * Landing on anything else (an `ISOLATED` frame, the root, or a backend that
 * doesn't implement `composeEditInPlace`) is a genuine exit instead.
 */
export const resolveEditInPlaceTransition = (
  topFrame: NavFrame | null,
  navStackLength: number,
  prevStackLength: number,
  supportsComposeEditInPlace: boolean
): EditInPlaceTransition => {
  const landsOnEditInPlace =
    topFrame?.mode === NavMode.EDIT_IN_PLACE && supportsComposeEditInPlace
  return {
    landsOnEditInPlace,
    skipDestroy: landsOnEditInPlace && navStackLength > prevStackLength,
    shouldReset: !landsOnEditInPlace,
  }
}

/**
 * Diff `layers` against `backend.objects`: destroy objects whose layer is gone and
 * create objects for layers not yet rendered (via the layer type's factory). This
 * is what makes a nested subview show only its own scene — swapping the layer map
 * removes the parent's objects and adds the child's. No-op unless the backend opts
 * in with {@link StageBackend.addObject}/{@link StageBackend.removeObject}.
 *
 * `skipDestroy` omits the destroy loop entirely — used by `useStageDriver` for
 * exactly the tick where the nav stack *enters* `NavMode.EDIT_IN_PLACE`, so a
 * backend that implements {@link StageBackend.composeEditInPlace} can reparent the
 * previously-live objects into its own ghost backdrop itself, rather than having
 * them torn down here first.
 *
 * On every *other* tick while an edit-in-place frame is still active,
 * `backend.ghostedObjectIds` (if the backend exposes it) is consulted instead: an
 * id in that set is never destroyed even if it's absent from `layers`, since
 * `layers` only ever reflects the current (live, drilled-into) scene — the
 * ghosted parent scene's ids intentionally aren't in it. This is what lets a
 * live-scene edit (adding/removing a layer inside the symbol being edited)
 * reconcile normally without also sweeping up the ghost backdrop. The create loop
 * always runs unconditionally — the new/current scene's own objects are added
 * exactly as they would be otherwise.
 */
export const reconcileObjects = (
  backend: StageBackend,
  defs: Map<string, LayerTypeDef>,
  layers: ReadonlyMap<string, AuthoringLayer>,
  options?: { skipDestroy?: boolean }
): void => {
  if (!backendReconciles(backend)) return
  if (!options?.skipDestroy) {
    const protectedIds = backend.ghostedObjectIds
    for (const id of [...backend.objects.keys()]) {
      if (layers.has(id)) continue
      if (protectedIds?.has(id)) continue
      backend.removeObject!(id)
    }
  }
  layers.forEach((layer) => {
    if (backend.objects.has(layer.id)) return
    const object = defs.get(String(layer.layerType))?.createRenderObject?.(layer, backend)
    if (object) backend.addObject!(object)
  })
}

/** Optional per-layer skip cache for {@link sampleLayers} — see its doc comment. */
export interface SampleLayersOptions {
  /**
   * Whether `frame` changed since the last call. When `false`, a layer whose
   * own reference is unchanged since the last call (tracked in
   * `lastLayerRefById`) is skipped entirely — sampling/`update()` only runs
   * for layers that actually changed. Defaults to `true` (always resample
   * every layer), preserving this function's original behavior for callers
   * that don't opt into the cache.
   */
  frameChanged?: boolean
  /** Caller-owned cache of each layer's reference as of the last call this was passed to. Mutated in place. */
  lastLayerRefById?: Map<string, AuthoringLayer>
}

/**
 * Push each layer's sampled value into its render object.
 *
 * Two sampling strategies:
 *  1. `sampleProperties(layer)` — used by property-driven layers (e.g. graphics
 *     layers whose value lives in `layer.properties`, not the timeline).
 *  2. `sample(timeline, frame)` — used by timeline-keyed layers (bones, etc.).
 *
 * If neither is defined, or sample returns `undefined`, the render object is
 * not updated this tick (avoids calling update(undefined) which crashes).
 *
 * Called whenever *any* layer in the scene changes (see `useStageDriver`'s
 * `layersChanged` check) — without `options.lastLayerRefById`, that means
 * editing one layer (e.g. autokeying one joint mid-drag) re-samples and
 * re-`update()`s *every* layer in the scene every time, even ones nothing
 * changed about. Passing a cache skips layers whose own reference is
 * unchanged since the last call, cutting that down to just the layer(s) that
 * actually changed.
 */
export const sampleLayers = (
  backend: StageBackend,
  defs: Map<string, LayerTypeDef>,
  layers: ReadonlyMap<string, AuthoringLayer>,
  frame: number,
  options?: SampleLayersOptions
): void => {
  const frameChanged = options?.frameChanged ?? true
  const lastLayerRefById = options?.lastLayerRefById
  layers.forEach((layer) => {
    if (!frameChanged && lastLayerRefById?.get(layer.id) === layer) return
    const def = defs.get(String(layer.layerType))
    if (!def) return
    const obj = backend.objects.get(layer.id)
    if (!obj) return
    // Cache "seen" only once actually sampled — a render object can lag its
    // layer by a tick (e.g. an embedded/attached backend that lazily
    // constructs itself, or a create pass that lands on a later tick than
    // expected): marking the cache before this point, on a tick where `obj`
    // isn't there yet, would permanently blacklist the layer from ever being
    // sampled again — its own reference won't change until a real edit, so
    // the object would silently sit at its just-constructed default state
    // (empty geometry, identity transform) forever, only fixed by whatever
    // *next* dispatch happens to touch that specific layer.
    lastLayerRefById?.set(layer.id, layer)
    if (def.sampleProperties) {
      obj.update(def.sampleProperties(layer))
    } else if (def.sample) {
      const value = def.sample(layer.timeline, frame)
      if (value !== undefined) obj.update(value)
    }
  })
}

/** Mirror the shared layer selection onto the render objects' highlight state. */
export const applySelection = (
  backend: StageBackend,
  selection: ReadonlySet<string>
): void => {
  backend.objects.forEach((object) => object.setSelected(selection.has(object.id)))
}
