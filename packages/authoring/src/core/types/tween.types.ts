/**
 * Tweens — interpolation between two KeyFrames (§20c). A Tween owns *how* the
 * frames between its endpoints are evaluated; it never stores authored data
 * (that lives only in KeyFrames). Hold/Tween/Empty frames are derived at sample
 * time, not stored.
 */

/**
 * Interpolation type. String values line up with common easing-curve names so a
 * media module can resolve most of them directly; `STEP` is handled as a hold.
 */
export enum TweenType {
  LINEAR = 'linear',
  STEP = 'step',
  EASE_IN = 'easeIn',
  EASE_OUT = 'easeOut',
  EASE_IN_OUT = 'easeInOut',
  ELASTIC = 'elastic',
  BOUNCE = 'bounce',
  BACK = 'back',
  /** Custom cubic-bézier curve (see {@link Tween.bezier}). */
  BEZIER = 'bezier',
}

/** Cubic-bézier control points `[x1, y1, x2, y2]` (CSS-style, endpoints fixed at 0,0 / 1,1). */
export type BezierControls = [number, number, number, number]

/** Default bézier ≈ CSS `ease`. */
export const DEFAULT_BEZIER: BezierControls = [0.25, 0.1, 0.25, 1]

/**
 * One edge of a tween's positional bound: either a literal stage-space number,
 * or a reference to a guide (resolved to that guide's current `pos` at sample
 * time — see `resolveBoundRef` in `timeline/tween.helpers.ts`). Guide
 * references let a bound track a guide the user later moves (e.g. a "Ground"
 * guide) instead of freezing to whatever pixel value it was at when set.
 */
export interface TweenBoundRef {
  kind: 'value' | 'guide'
  /** Set when `kind === 'value'`. */
  value?: number
  /** Set when `kind === 'guide'` — an `AuthoringGuide.id`. */
  guideId?: string
}

/**
 * Positional bounds on a tween's sampled x/y, e.g. capping a foot joint at a
 * ground guide while the rest of the rig keeps moving. Per axis, `keepBefore`/
 * `keepBelow` are minimum bounds and `keepBehind`/`keepAbove` are maximum
 * bounds — see `isValidAxisBounds`'s doc comment for the cross-validation rule
 * (max must resolve greater than min).
 */
export interface TweenBounds {
  x?: { keepBefore?: TweenBoundRef; keepBehind?: TweenBoundRef }
  y?: { keepBelow?: TweenBoundRef; keepAbove?: TweenBoundRef }
}

/** A first-class interpolation segment connecting two KeyFrames on one layer. */
export interface Tween {
  id: string
  startKeyframeId: string
  endKeyframeId: string
  type: TweenType
  enabled: boolean
  /** Control points when `type` is {@link TweenType.BEZIER}. */
  bezier?: BezierControls
  /**
   * For angle-valued tracks (media sampling in "angle mode"): interpolate along
   * the shortest arc, wrapping the delta into ±180°. Defaults to true (undefined
   * is treated as enabled); ignored by non-angle media.
   */
  shortestRotation?: boolean
  /** Optional x/y positional clamps — see {@link TweenBounds}. */
  bounds?: TweenBounds
}
