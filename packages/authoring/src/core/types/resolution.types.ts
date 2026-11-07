/**
 * Timeline resolution — the tick-space contract the timeline UI consumes for
 * ruler, zoom, labeling, and snapping. Supersedes {@link import('./timing.types').TimingModel}
 * for those concerns; `TimingModel` stays as the legacy seam for environments
 * that never adopt a `resolution` (see `useTimelineResolution`).
 */
import type { TimelineTick } from '../timeline/ticks.ts'

/** What a tick position means for a given shell. */
export enum TimeDomain {
  Frames = 'frames',
  Musical = 'musical',
  Seconds = 'seconds',
}

/** How tick positions are displayed in the ruler and readout. */
export enum TimeMode {
  Time = 'time',
  Frames = 'frames',
  Beats = 'beats',
}

/** A single snap candidate at a given tick, with a relative subdivision weight. */
export interface TickSnapPoint {
  tick: TimelineTick
  /** Coarseness of this subdivision — lower is coarser (e.g. a bar beats a 16th). */
  weight: number
}

/** A visible tick range, in ticks. */
export interface TickRange {
  startTick: TimelineTick
  endTick: TimelineTick
}

/**
 * Maps integer tick positions onto real time and human-readable labels for one
 * domain (animation frames, musical bars/beats, or plain seconds). The timeline
 * renders and edits ticks exclusively; only a `TimelineResolution` knows what a
 * tick *means*.
 */
export interface TimelineResolution {
  domain: TimeDomain
  /** Fixed structural constant — ticks per frame/quarter-note (e.g. 1000 or 960). */
  ticksPerUnit: number
  /** Convert a tick position to seconds (may be rate/tempo-curve-aware). */
  tickToSeconds(tick: TimelineTick): number
  /** Convert a time in seconds to the nearest tick. */
  secondsToTick(seconds: number): TimelineTick
  /**
   * Convert a raw `FrameBase.frame` grid value to ticks. The grid unit is
   * domain-specific: frame index for animation shells (×ticksPerUnit), the tick
   * itself for musical shells (identity — note starts are stored in ticks).
   */
  unitToTicks(unit: number): TimelineTick
  /** Convert a tick position back to its raw `FrameBase.frame` grid value. */
  ticksToUnit(tick: TimelineTick): number
  /**
   * Human-readable label for a tick. `mode` picks the formatter, defaulting to
   * the resolution's native mode (`Frames` for animation, `Beats` for musical)
   * when omitted.
   */
  format(tick: TimelineTick, mode?: TimeMode): string
  /** Snap candidates (beat/8th/16th/frame subdivisions, …) within a visible tick range. */
  getSnapPoints(range: TickRange, pixelsPerTick: number): TickSnapPoint[]
}

/**
 * The default `TimeMode` for a domain — `Time` is always offered alongside it
 * (see `timeMode.slice.ts`'s per-scope default, the Locked decision that the
 * two offered options derive from `resolution.domain` rather than a separate
 * `MediaConfig` field).
 */
export const nativeTimeModeForDomain = (domain: TimeDomain): TimeMode =>
  domain === TimeDomain.Musical ? TimeMode.Beats : TimeMode.Frames
