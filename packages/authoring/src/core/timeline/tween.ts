/**
 * Frame evaluation (§20c). Every timeline position resolves to exactly one type
 * — KeyFrame, TweenFrame, HoldFrame, or EmptyFrame — derived from the layer's
 * KeyFrames and Tweens (never stored). The framework owns this pure logic; media
 * modules supply the easing so interpolation stays media-agnostic.
 */
import { FrameKind, type FrameBase, type LayerTimeline } from '../types/frame.types.ts'
import type { Tween, TweenBoundRef } from '../types/tween.types.ts'

/**
 * A cubic-bézier ease from CSS-style control points: greese.js's, so the
 * editor and an exported game ease alike (ADR 0036). Re-exported here for
 * the code that imported Glop's copy.
 */
export { cubicBezier } from '@greese/js'

export type FrameEvaluation =
  | { type: 'empty' }
  | { type: 'keyframe'; keyframe: FrameBase }
  | { type: 'hold'; from: FrameBase }
  | { type: 'tween'; from: FrameBase; to: FrameBase; tween: Tween; local: number }

const keyframesOf = (timeline: LayerTimeline): FrameBase[] =>
  timeline.frames
    .filter((f) => f.kind !== FrameKind.SPAN)
    .sort((a, b) => a.frame - b.frame)

/**
 * Resolve the evaluated frame type at `frame`:
 * KeyFrame (exact) → TweenFrame (enabled tween between brackets) → HoldFrame
 * (after a key, no tween) → EmptyFrame (before the first key / no keys).
 */
export const evaluateFrame = (
  timeline: LayerTimeline,
  frame: number
): FrameEvaluation => {
  const keys = keyframesOf(timeline)
  if (keys.length === 0 || frame < keys[0]!.frame) return { type: 'empty' }

  let index = 0
  for (let i = 0; i < keys.length; i++) {
    if (keys[i]!.frame <= frame) index = i
    else break
  }
  const from = keys[index]!
  if (from.frame === frame) return { type: 'keyframe', keyframe: from }
  if (index === keys.length - 1) return { type: 'hold', from }

  const to = keys[index + 1]!
  const tween = timeline.tweens.find(
    (t) => t.enabled && t.startKeyframeId === from.id && t.endKeyframeId === to.id
  )
  if (!tween) return { type: 'hold', from }

  const span = to.frame - from.frame
  const local = span > 0 ? (frame - from.frame) / span : 0
  return { type: 'tween', from, to, tween, local }
}

/** Whether a stored frame is an empty keyframe (keyed, but explicitly holds nothing). */
export const isEmptyKeyframe = (frame: FrameBase): boolean =>
  frame.kind === FrameKind.EMPTY

/**
 * Whether `frame` falls in an empty region of the timeline: true when there is
 * no keyframe at or before it, or when its nearest ancestor keyframe is an
 * *empty* keyframe (the empty key and its derived hold/tween descendants are all
 * empty frames — nothing should render). The inverse defines "full frames":
 * a non-empty nearest ancestor keyframe and its non-keyframe descendants.
 *
 * Note: a timeline with no keyframes at all evaluates as empty everywhere;
 * callers that treat frameless layers as static content (e.g. a timelineless
 * graphics view) should check `timeline.frames.length` first.
 */
export const isEmptyAtFrame = (timeline: LayerTimeline, frame: number): boolean => {
  const evaluated = evaluateFrame(timeline, frame)
  switch (evaluated.type) {
    case 'empty':
      return true
    case 'keyframe':
      return isEmptyKeyframe(evaluated.keyframe)
    case 'hold':
      return isEmptyKeyframe(evaluated.from)
    case 'tween':
      return isEmptyKeyframe(evaluated.from)
  }
}

/** Resolve a Tween to an easing function `(t: 0..1) => 0..1`. */
export type TweenEaseResolver = (tween: Tween) => (t: number) => number

/** Options for {@link sampleTweenedNumber}. */
export interface SampleOptions {
  /**
   * Treat values as degrees: for tweens where `shortestRotation !== false`, take
   * the shortest arc (delta wrapped into ±180°). Media that animates angles pass
   * this; others leave it off so plain numeric interpolation is used.
   */
  angleMode?: boolean
}

/** Wrap an angular delta (degrees) into (-180, 180]. */
const shortestAngleDelta = (from: number, to: number): number => {
  let d = (to - from) % 360
  if (d > 180) d -= 360
  if (d <= -180) d += 360
  return d
}

/**
 * Sample a numeric track at `frame`, respecting Hold vs Tween. `easeFor` maps a
 * Tween to its easing curve (media-provided). Holds return the previous key's
 * value; empties return `fallback`. With `angleMode`, rotation tweens interpolate
 * along the shortest arc unless the tween disables it.
 */
export const sampleTweenedNumber = (
  timeline: LayerTimeline,
  frame: number,
  easeFor: TweenEaseResolver,
  fallback = 0,
  options: SampleOptions = {}
): number => {
  const evaluated = evaluateFrame(timeline, frame)
  switch (evaluated.type) {
    case 'empty':
      return fallback
    case 'keyframe':
      return evaluated.keyframe.value ?? fallback
    case 'hold':
      return evaluated.from.value ?? fallback
    case 'tween': {
      const a = evaluated.from.value ?? fallback
      const b = evaluated.to.value ?? fallback
      const t = easeFor(evaluated.tween)(evaluated.local)
      if (options.angleMode && evaluated.tween.shortestRotation !== false) {
        return a + shortestAngleDelta(a, b) * t
      }
      return a + (b - a) * t
    }
  }
}

/**
 * Resolves a {@link TweenBoundRef} to a plain number: a literal `value`
 * as-is, or a `guide` reference looked up via `guidePositionFor` (the
 * caller's own guide store access — this file has no redux/guide-slice
 * dependency). Returns `undefined` when the ref is a guide reference to a
 * guide that no longer exists (e.g. deleted after the bound was set) — callers
 * should treat that the same as "no bound set" rather than throwing.
 */
export const resolveBoundRef = (
  ref: TweenBoundRef | undefined,
  guidePositionFor: (guideId: string) => number | undefined
): number | undefined => {
  if (!ref) return undefined
  return ref.kind === 'value' ? ref.value : guidePositionFor(ref.guideId ?? '')
}

/** Clamps `value` into `[min, max]` (either bound omitted = unbounded on that side). */
export const clampAxis = (value: number, min?: number, max?: number): number => {
  let v = value
  if (min !== undefined) v = Math.max(v, min)
  if (max !== undefined) v = Math.min(v, max)
  return v
}

/**
 * Whether a resolved min/max pair is valid: the max bound must be strictly
 * greater than the min bound whenever both are set (e.g. `keepBehind >
 * keepBefore` on the x axis, `keepAbove > keepBelow` on the y axis — see
 * guides-tween-bounds-snapping-plan.md's Locked decisions). Either bound
 * unset is always valid (a one-sided clamp).
 */
export const isValidAxisBounds = (
  min: number | undefined,
  max: number | undefined
): boolean => min === undefined || max === undefined || max > min

/** Options for {@link sampleTweenedRecord}. */
export interface RecordSampleOptions {
  /** Channels interpolated along the shortest arc (unless a tween disables it). */
  angleChannels?: string[]
  /** Per-channel fallback used for empties / missing values. */
  fallback?: Record<string, number>
}

/**
 * Sample a **multi-channel** track at `frame` — like {@link sampleTweenedNumber} but
 * for keyframes that store a `values` record (e.g. a bone's rotation/x/y/length/…).
 * Each channel interpolates through the segment's tween; channels named in
 * `angleChannels` take the shortest arc.
 */
export const sampleTweenedRecord = (
  timeline: LayerTimeline,
  frame: number,
  easeFor: TweenEaseResolver,
  channels: string[],
  options: RecordSampleOptions = {}
): Record<string, number> => {
  const evaluated = evaluateFrame(timeline, frame)
  const angles = new Set(options.angleChannels ?? [])
  const fb = options.fallback ?? {}
  const out: Record<string, number> = {}
  const ease = evaluated.type === 'tween' ? easeFor(evaluated.tween)(evaluated.local) : 0
  for (const ch of channels) {
    switch (evaluated.type) {
      case 'empty':
        out[ch] = fb[ch] ?? 0
        break
      case 'keyframe':
        out[ch] = evaluated.keyframe.values?.[ch] ?? fb[ch] ?? 0
        break
      case 'hold':
        out[ch] = evaluated.from.values?.[ch] ?? fb[ch] ?? 0
        break
      case 'tween': {
        const a = evaluated.from.values?.[ch] ?? fb[ch] ?? 0
        const b = evaluated.to.values?.[ch] ?? fb[ch] ?? 0
        out[ch] =
          angles.has(ch) && evaluated.tween.shortestRotation !== false
            ? a + shortestAngleDelta(a, b) * ease
            : a + (b - a) * ease
        break
      }
    }
  }
  return out
}
