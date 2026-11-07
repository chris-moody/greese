/**
 * Signature-aware bar math for `musicalResolution.ts` — walks a sorted list of
 * time-signature changes so `format`/`getSnapPoints` compute correct bar:beat
 * labels and bar-boundary ticks across signature changes, not just a fixed 4/4.
 */
import type { TickRange } from '../../types/resolution.types.ts'
import type { TimelineTick } from '../ticks.ts'

export interface TimeSignatureChange {
  tick: TimelineTick
  numerator: number
  denominator: number
}

/** A signature change annotated with the (possibly fractional) bar count elapsed at its tick. */
export interface SignatureBarEntry extends TimeSignatureChange {
  barAtTick: number
}

/** Build a cumulative bar-count table from a (possibly unsorted) change list. */
export const buildSignatureBarTable = (
  changes: TimeSignatureChange[],
  ticksPerUnit: number
): SignatureBarEntry[] => {
  if (changes.length === 0) return []
  const sorted = [...changes].sort((a, b) => a.tick - b.tick)
  const table: SignatureBarEntry[] = [{ ...sorted[0]!, barAtTick: 0 }]
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]!
    const b = sorted[i + 1]!
    const beatsInSegment = (b.tick - a.tick) / ticksPerUnit
    const barsInSegment = beatsInSegment / Math.max(1, a.numerator)
    table.push({ ...b, barAtTick: table[table.length - 1]!.barAtTick + barsInSegment })
  }
  return table
}

/** The signature segment active at `tick` (the last entry whose tick is ≤ `tick`). */
export const activeSignatureAt = (
  table: SignatureBarEntry[],
  tick: TimelineTick
): SignatureBarEntry => {
  let active = table[0]!
  for (const entry of table) {
    if (entry.tick <= tick) active = entry
    else break
  }
  return active
}

/** 1-based `{ bar, beatInBar, tickInBeat }` for `tick`, walking signature changes. */
export const barBeatAt = (
  table: SignatureBarEntry[],
  ticksPerUnit: number,
  tick: TimelineTick
): { bar: number; beatInBar: number; tickInBeat: number } => {
  const active = activeSignatureAt(table, tick)
  const ticksIntoSegment = tick - active.tick
  const beatIndexInSegment = Math.floor(ticksIntoSegment / ticksPerUnit)
  const barsIntoSegment = Math.floor(beatIndexInSegment / Math.max(1, active.numerator))
  const beatInBar = (beatIndexInSegment % Math.max(1, active.numerator)) + 1
  const tickInBeat = ticksIntoSegment - beatIndexInSegment * ticksPerUnit
  const bar = Math.floor(active.barAtTick) + barsIntoSegment + 1
  return { bar, beatInBar, tickInBeat }
}

/** Every bar-boundary tick within `range`, walking each signature segment's own bar length. */
export const barBoundaryTicks = (
  table: SignatureBarEntry[],
  ticksPerUnit: number,
  range: TickRange
): TimelineTick[] => {
  const ticks: TimelineTick[] = []
  for (let i = 0; i < table.length; i++) {
    const segment = table[i]!
    const segmentEnd = table[i + 1]?.tick ?? Infinity
    const isLastSegment = segmentEnd === Infinity
    const barTicks = Math.max(1, segment.numerator) * ticksPerUnit
    let t = segment.tick
    if (t < range.startTick) {
      const stepsIn = Math.floor((range.startTick - segment.tick) / barTicks)
      t = segment.tick + stepsIn * barTicks
    }
    const stop = Math.min(segmentEnd, range.endTick)
    // Exclude the shared boundary tick when a next segment exists — its own
    // loop starts there, so including it here would emit it twice.
    while (isLastSegment ? t <= stop : t < stop) {
      if (t >= range.startTick) ticks.push(t)
      t += barTicks
    }
    if (t > range.endTick) break
  }
  return ticks
}
