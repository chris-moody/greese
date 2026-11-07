/**
 * `TimelineLevelEditor` — a generic multi-point curve editor over the full
 * timeline width, generalizing `BezierEditor`'s two-fixed-handle drag
 * mechanics to an arbitrary number of points. Data-source agnostic: a point's
 * `value` means whatever the consumer says it means (Phase 7's rate curve,
 * later automation curves, …).
 */
import type { TimelineTick } from './ticks.ts'

/** One point on a level curve — real tick space (not a domain-native unit). */
export interface LevelPoint {
  id: string
  tick: TimelineTick
  value: number
}
