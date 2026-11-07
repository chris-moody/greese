/**
 * Shared tick↔seconds math for a piecewise-constant rate curve, used by both
 * `animationResolution.ts` and `musicalResolution.ts`. Each resolution converts
 * its own rate unit (fps, bpm) to ticks-per-second before calling these — the
 * table itself only knows about ticks-per-second, so the accumulation math
 * never branches on domain.
 */
import type { TimelineTick } from '../ticks.ts'

/** One rate change: the ticks-per-second rate holding constant from `tick` onward. */
export interface RateSegment {
  tick: TimelineTick
  ticksPerSecond: number
}

/** A cumulative-seconds table entry — `seconds` is the time `tick` occurs at. */
export interface CumulativeSecondsEntry {
  tick: TimelineTick
  seconds: number
  ticksPerSecond: number
}

const MIN_TICKS_PER_SECOND = 1e-6

/**
 * Build a monotonic tick→seconds lookup by summing `segmentTicks / ticksPerSecond`
 * across segments (piecewise-constant rate — each segment holds the rate of its
 * *starting* point, like a tempo change takes effect going forward, not a ramp).
 */
export const cumulativeSecondsTable = (
  segments: RateSegment[]
): CumulativeSecondsEntry[] => {
  if (segments.length === 0) return []
  const sorted = [...segments].sort((a, b) => a.tick - b.tick)
  const table: CumulativeSecondsEntry[] = [
    { tick: sorted[0]!.tick, seconds: 0, ticksPerSecond: sorted[0]!.ticksPerSecond },
  ]
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]!
    const b = sorted[i + 1]!
    const rate = Math.max(MIN_TICKS_PER_SECOND, a.ticksPerSecond)
    const segmentSeconds = (b.tick - a.tick) / rate
    table.push({
      tick: b.tick,
      seconds: table[table.length - 1]!.seconds + segmentSeconds,
      ticksPerSecond: b.ticksPerSecond,
    })
  }
  return table
}

/** Look up (interpolating within a segment, extrapolating past the ends) the seconds at `tick`. */
export const secondsForTick = (
  table: CumulativeSecondsEntry[],
  tick: TimelineTick
): number => {
  if (table.length === 0) return 0
  const first = table[0]!
  if (tick <= first.tick) {
    return (
      first.seconds +
      (tick - first.tick) / Math.max(MIN_TICKS_PER_SECOND, first.ticksPerSecond)
    )
  }
  const last = table[table.length - 1]!
  if (tick >= last.tick) {
    return (
      last.seconds +
      (tick - last.tick) / Math.max(MIN_TICKS_PER_SECOND, last.ticksPerSecond)
    )
  }
  for (let i = 0; i < table.length - 1; i++) {
    const a = table[i]!
    const b = table[i + 1]!
    if (tick >= a.tick && tick <= b.tick) {
      return (
        a.seconds + (tick - a.tick) / Math.max(MIN_TICKS_PER_SECOND, a.ticksPerSecond)
      )
    }
  }
  return last.seconds
}

/** Inverse of {@link secondsForTick} — binary-searches the table for the tick at `seconds`. */
export const tickForSeconds = (
  table: CumulativeSecondsEntry[],
  seconds: number
): TimelineTick => {
  if (table.length === 0) return 0
  const first = table[0]!
  if (seconds <= first.seconds) {
    return Math.round(
      first.tick +
        (seconds - first.seconds) * Math.max(MIN_TICKS_PER_SECOND, first.ticksPerSecond)
    )
  }
  const last = table[table.length - 1]!
  if (seconds >= last.seconds) {
    return Math.round(
      last.tick +
        (seconds - last.seconds) * Math.max(MIN_TICKS_PER_SECOND, last.ticksPerSecond)
    )
  }
  let lo = 0
  let hi = table.length - 1
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2)
    if (table[mid]!.seconds <= seconds) lo = mid
    else hi = mid
  }
  const a = table[lo]!
  return Math.round(
    a.tick + (seconds - a.seconds) * Math.max(MIN_TICKS_PER_SECOND, a.ticksPerSecond)
  )
}
