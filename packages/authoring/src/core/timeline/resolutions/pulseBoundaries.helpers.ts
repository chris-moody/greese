/**
 * Shared "which pulse boundaries fall in this tick range / were crossed between
 * these two ticks" math for the metronome click scheduler and the Temporal
 * Guide's visual pulse layers (see `docs/plans/metronome-modes-plan.md`). Built
 * directly on `timeSignature.helpers.ts`'s signature-bar-table math — the one
 * source of truth for "where is beat 1" — so the click, the ruler, and the
 * Temporal Guide can never disagree about boundary positions.
 *
 * Pure functions: `ctx` bundles whatever the caller already has in scope
 * (signature table, tick-per-beat unit, subdivision step, loop bounds) — no
 * redux/store access here.
 */
import type { TickRange } from '../../types/resolution.types.ts'
import type { TimelineTick } from '../ticks.ts'
import { barBoundaryTicks, type SignatureBarEntry } from './timeSignature.helpers.ts'

/** A kind of temporal pulse the Temporal Guide / metronome can track. */
export enum PulseLayerId {
  beat = 'beat',
  subdivision = 'subdivision',
  measure = 'measure',
  frame = 'frame',
  loop = 'loop',
}

export interface PulseBoundaryContext {
  /**
   * Signature bar table (`buildSignatureBarTable`'s output). Required for
   * `beat`/`measure`/`subdivision` — an empty/absent table yields no boundaries
   * for those layers (e.g. animation shells, which have no time signature).
   */
  signatureTable?: SignatureBarEntry[]
  /** Ticks per beat (the resolution's `ticksPerUnit`) — also the `frame` layer's step. */
  ticksPerUnit: number
  /**
   * Tick length of the active subdivision step (`ticksForStepDivision`'s
   * output). `0` (the `off` sentinel) yields no subdivision boundaries — never
   * divide/step by it directly.
   */
  subdivisionTicks?: number
  /** Loop start/end ticks — the `loop` layer's two boundaries. */
  loopBounds?: { start: TimelineTick; end: TimelineTick }
}

/**
 * Walk each signature segment in `table`, emitting every tick in `range` that's
 * an exact multiple of `step` ticks past the segment's own start — the same
 * per-segment-anchored walk `barBoundaryTicks` uses for bar boundaries,
 * generalized to an arbitrary fixed step (a beat, or a subdivision of one).
 * `step <= 0` (e.g. subdivision `off`) returns no boundaries.
 */
const segmentSteppedTicksInRange = (
  table: SignatureBarEntry[],
  range: TickRange,
  step: number
): TimelineTick[] => {
  if (step <= 0) return []
  const ticks: TimelineTick[] = []
  for (let i = 0; i < table.length; i++) {
    const segment = table[i]!
    const segmentEnd = table[i + 1]?.tick ?? Infinity
    const isLastSegment = segmentEnd === Infinity
    let t = segment.tick
    if (t < range.startTick) {
      const stepsIn = Math.floor((range.startTick - segment.tick) / step)
      t = segment.tick + stepsIn * step
    }
    const stop = Math.min(segmentEnd, range.endTick)
    while (isLastSegment ? t <= stop : t < stop) {
      if (t >= range.startTick) ticks.push(t)
      t += step
    }
    if (t > range.endTick) break
  }
  return ticks
}

/** Flat, origin-0 stepping — the `frame` layer, which has no signature-table concept. */
const flatSteppedTicksInRange = (range: TickRange, step: number): TimelineTick[] => {
  if (step <= 0) return []
  const ticks: TimelineTick[] = []
  let t = Math.ceil(range.startTick / step) * step
  while (t <= range.endTick) {
    ticks.push(t)
    t += step
  }
  return ticks
}

/** The `loop` layer's two fixed boundaries — start and end, each included only when in range. */
const loopBoundaryTicksInRange = (
  range: TickRange,
  loopBounds: { start: TimelineTick; end: TimelineTick } | undefined
): TimelineTick[] => {
  if (!loopBounds) return []
  const ticks: TimelineTick[] = []
  if (loopBounds.start >= range.startTick && loopBounds.start <= range.endTick)
    ticks.push(loopBounds.start)
  if (loopBounds.end >= range.startTick && loopBounds.end <= range.endTick)
    ticks.push(loopBounds.end)
  return ticks
}

/**
 * Every boundary tick of `layer` currently within `range` (inclusive both ends)
 * — for consumers that need "what's on screen right now" (the Temporal Guide
 * overlay), not "did we just cross one."
 */
export const boundaryTicksInRange = (
  range: TickRange,
  layer: PulseLayerId,
  ctx: PulseBoundaryContext
): TimelineTick[] => {
  switch (layer) {
    case PulseLayerId.measure:
      return barBoundaryTicks(ctx.signatureTable ?? [], ctx.ticksPerUnit, range)
    case PulseLayerId.beat:
      return segmentSteppedTicksInRange(ctx.signatureTable ?? [], range, ctx.ticksPerUnit)
    case PulseLayerId.subdivision:
      return segmentSteppedTicksInRange(
        ctx.signatureTable ?? [],
        range,
        ctx.subdivisionTicks ?? 0
      )
    case PulseLayerId.frame:
      return flatSteppedTicksInRange(range, ctx.ticksPerUnit)
    case PulseLayerId.loop:
      return loopBoundaryTicksInRange(range, ctx.loopBounds)
  }
}

/**
 * Boundary ticks of `layer` crossed while moving from `prevTick` to `nextTick`
 * — `(prevTick, nextTick]` moving forward, `[nextTick, prevTick)` moving
 * backward (a scrub). No-op when the ticks are equal.
 */
export const crossedBoundaries = (
  prevTick: TimelineTick,
  nextTick: TimelineTick,
  layer: PulseLayerId,
  ctx: PulseBoundaryContext
): TimelineTick[] => {
  if (nextTick === prevTick) return []
  const range: TickRange =
    nextTick > prevTick
      ? { startTick: prevTick + 1, endTick: nextTick }
      : { startTick: nextTick, endTick: prevTick - 1 }
  return boundaryTicksInRange(range, layer, ctx)
}
