/**
 * Stage contract — the backend-agnostic rendering surface, extracted from the
 * legacy `packages/pixels` (since removed) `PixelObject`/`Stage` classes.
 *
 * The framework never imports a renderer. A media module provides a concrete
 * backend (e.g. the legacy engine rendered with Pixi) whose objects satisfy
 * {@link RenderObject} and whose stage satisfies {@link StageBackend}. The
 * framework's render driver (dirty-set + timeline sampling) talks only to these
 * interfaces.
 *
 * Note on layout: a Pixi backend implementation does not belong here — a
 * backend that imports a Pixi renderer package cannot live in `@beta/ui`
 * (wrong dependency direction). `@beta/ui` owns the contract; media packages
 * implement it.
 */

export interface Point {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Transform2D {
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
}

/**
 * Plain-data 2D affine matrix — mirrors the `a,b,c,d,tx,ty` shape a Pixi
 * backend's own matrix type already exposes, so a backend can build one
 * directly (e.g. `new PIXI.Matrix(a, b, c, d, tx, ty)`) without the framework
 * depending on a renderer. Used to carry a nav frame's composed stage
 * transform (see `NavFrame.stageTransform`) — the world transform a
 * double-clicked instance had in its parent scene, so the drilled-into
 * scene can render positioned/rotated/scaled to match.
 */
export interface Matrix2D {
  a: number
  b: number
  c: number
  d: number
  tx: number
  ty: number
}

/**
 * A renderable, hit-testable object on the stage. Its `id` equals the id of the
 * layer it represents (the framework's layer↔render-object invariant).
 *
 * @typeParam TModel - the media-specific model this object renders from (the
 * value produced by sampling the layer's timeline at the current frame).
 */
export interface RenderObject<TModel = unknown> {
  readonly id: string
  /** Whether the object is drawn. */
  visible: boolean
  /** World transform (read-only projection; media updates it via {@link update}). */
  readonly transform: Transform2D
  /** Sync visual state from the layer's sampled model. */
  update(model: TModel): void
  /** Toggle the selection highlight. */
  setSelected(selected: boolean): void
  /** World-space bounding box. */
  bounds(): Rect
  /** True when `point` (world space) is inside this object. */
  hitTest(point: Point): boolean
  /** Release resources. */
  destroy(): void
}

/**
 * The renderer host that owns render objects and answers spatial queries.
 * Modeled on the media-agnostic surface of the pixels `Stage`.
 *
 * The framework's render driver ({@link import('./useStageDriver').useStageDriver})
 * reconciles `objects` against the active scene's layer state — when a backend
 * implements {@link addObject}/{@link removeObject} the driver calls them as layers
 * appear and disappear (including when a nested subview swaps the whole scene) so
 * the stage renders exactly the current scene, never the enclosing one. A backend
 * that manages its own objects from the store (e.g. the Pixi `Stage`) may omit
 * both; the driver then leaves reconciliation to it and only samples + selects.
 */
export interface StageBackend<TObject extends RenderObject = RenderObject> {
  /** Live render objects keyed by id. */
  readonly objects: ReadonlyMap<string, TObject>
  /** Attach a render object built for a layer (created via the layer type's factory). */
  addObject?(object: TObject): void
  /** Detach and destroy the render object with `id` (its layer was removed). */
  removeObject?(id: string): void
  /** Topmost object whose bounds contain `point`, or null. */
  getObjectAt(point: Point): TObject | null
  /**
   * Edit-in-place onion skin (POC fallback). {@link captureGhost} snapshots the
   * current stage pixels; while a ghost is held the backend draws it behind the
   * live scene at reduced alpha and never hit-tests it. {@link clearGhost} drops
   * it. Optional — backends without a raster surface may omit both. Used by the
   * generic `StageHost`-driven proof-of-concept views only — a backend that
   * implements {@link composeEditInPlace} instead gets a real per-object
   * compound scene from the render driver and doesn't need this.
   */
  captureGhost?(): void
  clearGhost?(): void
  /**
   * Opt-in replacement for the driver's normal destroy-and-rebuild reconcile
   * step, called instead of it for exactly one tick: the one where the
   * navigation stack's top frame *lands on* `NavMode.EDIT_IN_PLACE` — whether
   * by growing onto a fresh one (a stage double-click drill-in) or by
   * shrinking/holding back onto a shallower one that's still `EDIT_IN_PLACE`
   * (a breadcrumb click or blank-area double-click stepping back out of a
   * deeper drill, not a full exit — that shallower level's own objects need
   * to be un-ghosted and re-composited too, not just the entry direction).
   * Rather than tearing down every render object not in the new scene, the
   * backend keeps the previously-live objects on stage as a dimmed,
   * non-interactive backdrop (tracked in {@link ghostedObjectIds}) and
   * composites the new scene (`liveLayerIds`, positioned by `transform`) on
   * top of them. The driver still creates render objects for `liveLayerIds`
   * as normal (via `addObject`) immediately before calling this. Only a
   * *growing* landing skips the driver's normal destroy pass first (the
   * objects about to be ghosted aren't in {@link ghostedObjectIds} yet, so an
   * un-skipped destroy pass would tear them down instead of letting this
   * method ghost them) — a shrinking/holding landing runs the destroy pass as
   * normal beforehand, since the shallower level's own objects are *already*
   * protected there (still marked ghosted from the earlier drill-in) while
   * the deeper level's now-abandoned objects genuinely need destroying, not
   * ghosting a second time. Every other navigation transition (opening an
   * `ISOLATED` asset, landing at the root, `replaceTop`) is untouched — the
   * driver falls back to the normal destroy-and-rebuild `reconcileObjects`
   * for those, and for any backend that doesn't implement this method at all.
   */
  composeEditInPlace?(liveLayerIds: ReadonlySet<string>, transform: Matrix2D | null): void
  /**
   * Ids currently held as an edit-in-place ghost backdrop (see
   * {@link composeEditInPlace}) — consulted by the driver on *every* reconcile
   * tick, not just the entry one, so a live-scene edit while still drilled in
   * (adding/removing a layer inside the edited symbol) reconciles normally
   * without the destroy step sweeping up the ghosted parent objects too.
   * Backends that don't implement {@link composeEditInPlace} may omit this.
   */
  readonly ghostedObjectIds?: ReadonlySet<string>
  /**
   * Counterpart to {@link composeEditInPlace} — called the instant the
   * navigation stack's top frame lands on anything *other than*
   * `NavMode.EDIT_IN_PLACE` while ghosts are held (an `ISOLATED` open,
   * landing at the root). A landing whose own stored `mode` still reads
   * `EDIT_IN_PLACE` — including a breadcrumb/blank-double-click step back to
   * a shallower level within the same drill chain — is *not* a reset; it's
   * routed to {@link composeEditInPlace} instead (re-ghosting/un-ghosting
   * against that shallower level's own `liveLayerIds`), since the session is
   * still live, just one level up. Implementations should drop every id
   * currently reported by {@link ghostedObjectIds} and force those objects
   * back to their normal (undimmed, hit-testable) state immediately — don't
   * rely on the next sample pass to do it, since an unchanged layer's
   * `update()` may no-op and never re-trigger a resync. Optional — only
   * called when defined.
   */
  resetEditInPlace?(): void
  /**
   * Convert a container-relative screen point (same convention `StageHost`'s
   * pointer handlers already use: `clientX/Y` minus the container's bounding
   * rect) to this backend's world space, accounting for pan/zoom. Used to
   * place a dropped library instance under the cursor. Optional — backends
   * without pan/zoom (or without a `createStage`) may omit it; `StageHost`
   * falls back to the raw screen point.
   */
  screenToWorld?(point: Point): Point
  /**
   * Inverse of {@link screenToWorld} — this backend's own world space (in
   * whatever nested edit-in-place/instance-drill-in frame is currently live)
   * → real screen pixels, container-relative. Optional — only backends whose
   * render objects need a DOM overlay positioned exactly on top of their
   * on-stage rendering (e.g. a `contentEditable` text-edit surface) implement
   * it; a caller without one falls back to its own simpler pan/zoom math,
   * which is only correct for a backend with no deeper composed transform.
   */
  worldToScreen?(point: Point): Point
  /** Release all resources held by the backend. */
  destroy(options?: unknown): void
}
