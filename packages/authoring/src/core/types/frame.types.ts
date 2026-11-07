/**
 * Frames & Timelines — each layer owns a {@link LayerTimeline} of typed frames
 * that describe its state over time. Frame kinds are a discriminated set that
 * media modules extend (Pose/Tween, NoteOn/NoteOff, Visibility/Property, …).
 */
import type { Tween } from './tween.types.ts'

/**
 * Framework-level frame kinds. Media modules register additional kinds through
 * their {@link import('./media.types').MediaConfig} rather than editing this enum.
 */
export enum FrameKind {
  /** No content at this frame. */
  EMPTY = 'empty',
  /** An explicit keyed value (the only type that stores authored data). */
  KEYFRAME = 'keyframe',
  /** Derived: holds the previous keyframe's value until the next key. */
  HOLD = 'hold',
  /** Derived: interpolates between the bracketing keyframes per a Tween. */
  TWEEN = 'tween',
  /** A ranged frame that spans multiple frame indices. */
  SPAN = 'span',
}

/** A media-defined reference a frame resolves its value from (e.g. a named pose). */
export interface FrameRef {
  /** Name of the pose this frame references (poseFrame kind). */
  pose: string
}

/** Minimal shape shared by every frame regardless of media type. */
export interface FrameBase {
  id: string
  /** Integer frame index on the owning layer's timeline. */
  frame: number
  /** Discriminant — framework or media-defined. */
  kind: FrameKind | string
  /**
   * Optional reference this frame derives its value from rather than storing it
   * directly (e.g. a `poseFrame` referencing a named pose). Kept in sync by the
   * media module when the referenced source changes.
   */
  ref?: FrameRef
  /** Optional keyed numeric value (for simple single-property/pose tracks). */
  value?: number
  /**
   * Optional multi-channel keyed values, for media that key several numeric
   * properties on one keyframe (e.g. a bone's rotation/x/y/length/origin/scale).
   * Sampled per channel by {@link import('../timeline/tween.helpers').sampleTweenedRecord}.
   */
  values?: Record<string, number>
  /** Number of frames a span covers (spans only; >= 1). */
  duration?: number
}

/**
 * Content-space window a span plays from, before any scaling/looping.
 * `end` is exclusive, matching the codebase's existing "play up to"
 * convention. Omitted on a span → the full content range.
 */
export interface SpanClampRange {
  start: number
  end: number
}

/**
 * Mutually exclusive by construction (a discriminated union, not booleans):
 * a span either doesn't time-stretch its content (`none`), stretches it to
 * exactly fill its own authored `duration` (`scaleToFit`), or stretches it
 * to fill an independently-specified frame/time count (`scaleWithin`) that
 * may be shorter than the span — leaving room for further loop repeats.
 */
export type SpanScaleMode =
  | { type: 'none' }
  | { type: 'scaleToFit' }
  | { type: 'scaleWithin'; targetFrames: number }

/**
 * Canonical shared shape for "outer span plays an inner timeline" playback —
 * see `resolveSpanContentFrame` (timeline/spanPlayback.helpers.ts) for the
 * composition semantics. Media modules that can't depend on `@beta/ui`
 * (e.g. `packages/armature`, `packages/sound-daw`) mirror these fields
 * verbatim onto their own persisted span schema rather than importing this
 * type directly.
 */
export interface SpanPlaybackProperties {
  /** Content-space window to play from. Omitted → the full content range. */
  clamp?: SpanClampRange
  /** Time-scaling mode. Omitted → `{ type: 'none' }`. */
  scaleMode?: SpanScaleMode
  /**
   * Number of repeats: `-1` = infinite (default when omitted), `0` = play
   * once with no repeat, `N > 0` = `N` additional repeats after the first
   * play-through.
   */
  loopCount?: number
  /** Content-space gap between successive loop repeats. Omitted → `0`. */
  loopDelay?: number
}

/** A span frame occupies a contiguous range of frames. */
export interface SpanFrame extends FrameBase, Partial<SpanPlaybackProperties> {
  kind: FrameKind.SPAN
  /** Number of frames the span covers (>= 1). */
  duration: number
}

/**
 * A per-layer timeline: a sparse, frame-sorted list of KeyFrames (+ spans) plus
 * the Tweens between them. Hold/Tween/Empty frames are derived at sample time.
 */
export interface LayerTimeline<F extends FrameBase = FrameBase> {
  /** KeyFrames/spans sorted ascending by `frame`. Sparse — gaps are `EMPTY`. */
  frames: F[]
  /** Interpolation segments connecting KeyFrames (§20c). */
  tweens: Tween[]
}
