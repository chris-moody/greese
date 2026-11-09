/**
 * Pure viewport coordinate-conversion helpers for the Canvas2D stage.
 *
 * Coordinate model
 * ────────────────
 * • Stage origin (0, 0) maps to canvas pixel (w/2 + panX, h/2 + panY).
 * • panX / panY are canvas-pixel offsets of the stage origin from the canvas centre.
 * • scale is the viewport zoom factor (1 = 100%).
 *
 * Conversions
 * ───────────
 * canvas pixel  →  stage:   stageX = (canvasX − halfW − panX) / scale
 * stage         →  canvas:  canvasX = halfW + panX + stageX * scale
 */

export const MIN_ZOOM = 0.01
export const MAX_ZOOM = 100

/** Clamp zoom to the supported range. */
export function clampZoom(z: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z))
}

/** Convert a canvas-pixel coordinate to stage space on one axis. */
export function canvasToStage(
  canvasPx: number,
  halfSize: number,
  pan: number,
  scale: number
): number {
  return (canvasPx - halfSize - pan) / scale
}

/** Convert a stage coordinate to canvas pixels on one axis. */
export function stageToCanvas(
  stageCoord: number,
  halfSize: number,
  pan: number,
  scale: number
): number {
  return halfSize + pan + stageCoord * scale
}

/**
 * Compute new pan values after a zoom change so that a given stage point
 * stays at the same canvas pixel (zoom-to-cursor / zoom-to-point).
 *
 * Derivation:
 *   Before:  cpx = halfW + panX     + stageX * oldScale
 *   After:   cpx = halfW + panX_new + stageX * newScale
 *   Equal →  panX_new = panX + stageX * (oldScale − newScale)
 */
export function panForZoomToPoint(
  stageX: number,
  stageY: number,
  oldScale: number,
  newScale: number,
  panX: number,
  panY: number
): { panX: number; panY: number } {
  return {
    panX: panX + stageX * (oldScale - newScale),
    panY: panY + stageY * (oldScale - newScale),
  }
}

/**
 * Resolves a wheel event into a pan delta, or `null` if the caller should
 * zoom instead — shared by every Pixi stage backend (Rigatron/Pixels/Palette
 * Studio) so horizontal-scroll, Shift+scroll, and plain-scroll semantics stay
 * identical across all three instead of drifting via triplicated inline
 * per-backend logic.
 *
 * - Shift held always pans vertically — checked *before* `deltaX`, because
 *   several browsers translate a physical vertical scroll wheel held with
 *   Shift into `deltaX` instead of `deltaY` (same wheel hardware, different
 *   reported axis; others leave it on `deltaY` and only set `shiftKey`), so
 *   whichever axis actually carries the amount is read here rather than
 *   assuming `deltaY`.
 * - Otherwise, non-zero `deltaX` (a native horizontal wheel/trackpad swipe,
 *   no Shift) pans horizontally — previously ignored entirely by every
 *   backend, which only ever read `deltaY`.
 * - Otherwise (a plain vertical wheel, no Shift) there's nothing to pan —
 *   the caller should zoom instead, using its own `deltaY`-driven logic.
 */
export function wheelPanDelta(event: WheelEvent): { x: number; y: number } | null {
  if (event.shiftKey) return { x: 0, y: event.deltaX !== 0 ? event.deltaX : event.deltaY }
  if (event.deltaX !== 0) return { x: event.deltaX, y: 0 }
  return null
}

/** How much one wheel notch zooms, in or out. */
export const WHEEL_ZOOM_STEP = 1.1

/** What a wheel event does to a stage: pan it, or zoom it about the pointer. */
export type WheelGesture =
  | { kind: 'pan'; x: number; y: number }
  /** `factor` multiplies the zoom: above 1 zooms in. */
  | { kind: 'zoom'; factor: number }

/**
 * A wheel event as every stage reads it, Pixels' rules: a horizontal swipe
 * or Shift pans (see `wheelPanDelta`), and a plain wheel zooms one step at
 * the pointer, in when it rolls away. A wheel that moves nothing does nothing.
 */
export function wheelGesture(
  event: Pick<WheelEvent, 'deltaX' | 'deltaY' | 'shiftKey'>,
  step = WHEEL_ZOOM_STEP
): WheelGesture | null {
  const pan = wheelPanDelta(event as WheelEvent)
  if (pan) return { kind: 'pan', ...pan }
  if (event.deltaY === 0) return null
  return { kind: 'zoom', factor: event.deltaY < 0 ? step : 1 / step }
}
