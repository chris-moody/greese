/**
 * `MusicalResolution` — the {@link TimelineResolution} for Sound Studio. Default
 * 960 ticks/quarter-note (TPQ): 16th = tick 240, 8th-triplet = tick 320, 32nd =
 * tick 120. Bar/beat math assumes the numerator counts quarter-note beats;
 * Phase 8 makes `getSignature` time-varying and signature-denominator-aware.
 */
import { TimeDomain, TimeMode } from '../../types/resolution.types.ts'
import type {
  TickRange,
  TickSnapPoint,
  TimelineResolution,
} from '../../types/resolution.types.ts'
import type { TimelineTick } from '../ticks.ts'
import { formatClockTime } from './clockTime.helpers.ts'
import {
  cumulativeSecondsTable,
  secondsForTick,
  tickForSeconds,
} from './rateCurve.helpers.ts'
import { MusicalStepDivision, ticksForStepDivision } from './stepDivisions.ts'
import {
  barBeatAt,
  barBoundaryTicks,
  buildSignatureBarTable,
} from './timeSignature.helpers.ts'
import type { TimeSignatureChange } from './timeSignature.helpers.ts'
import type { LevelPoint } from '../levelEditor.types.ts'

export type { TimeSignatureChange } from './timeSignature.helpers.ts'

/** Default ticks-per-quarter-note. */
export const DEFAULT_TICKS_PER_QUARTER = 960

const DEFAULT_SIGNATURE_CHANGES: TimeSignatureChange[] = [
  { tick: 0, numerator: 4, denominator: 4 },
]

export interface MusicalResolutionOptions {
  /** Live BPM reader (quarter-note beats per minute). */
  getBpm: () => number
  /** Ticks-per-quarter-note — a fixed structural constant, read once. Defaults to 960. */
  getTpq?: () => number
  /** Live time-signature-change-list reader. Defaults to a fixed 4/4 at tick 0. */
  getSignature?: () => TimeSignatureChange[]
  /**
   * Live rate-curve reader (Phase 7's Rate tool) — point values are BPM.
   * With 0 or 1 points this reduces exactly to the flat `getBpm()` math.
   */
  getRatePoints?: () => LevelPoint[]
}

/** Build a `TimelineResolution` for a musical (bars/beats/seconds) shell. */
export const createMusicalResolution = (
  options: MusicalResolutionOptions
): TimelineResolution => {
  const { getBpm } = options
  const ticksPerUnit = options.getTpq?.() ?? DEFAULT_TICKS_PER_QUARTER
  const getSignature = options.getSignature ?? (() => DEFAULT_SIGNATURE_CHANGES)
  const getRatePoints = options.getRatePoints ?? (() => [])

  const secondsPerBeat = (): number => 60 / Math.max(1, getBpm())

  const tickToSeconds = (tick: TimelineTick): number => {
    const points = getRatePoints()
    if (points.length < 2) return (tick / ticksPerUnit) * secondsPerBeat()
    const table = cumulativeSecondsTable(
      points.map((p) => ({ tick: p.tick, ticksPerSecond: (ticksPerUnit * p.value) / 60 }))
    )
    return secondsForTick(table, tick)
  }
  const secondsToTick = (seconds: number): TimelineTick => {
    const points = getRatePoints()
    if (points.length < 2) return Math.round((seconds / secondsPerBeat()) * ticksPerUnit)
    const table = cumulativeSecondsTable(
      points.map((p) => ({ tick: p.tick, ticksPerSecond: (ticksPerUnit * p.value) / 60 }))
    )
    return tickForSeconds(table, seconds)
  }
  // Musical shells store `FrameBase.frame` in ticks directly (AmpNote.start
  // is a tick), so the frame-grid unit IS the tick — unlike animation shells,
  // whose grid unit is the frame index (×1000). `ticksPerUnit` stays the TPQ
  // structural constant for beat/bar math, not the frame-grid conversion factor.
  const unitToTicks = (unit: number): TimelineTick => Math.round(unit)
  const ticksToUnit = (tick: TimelineTick): number => tick

  /** 1-based `bar:beat:tick` label, walking signature changes. */
  const formatBarBeat = (tick: TimelineTick): string => {
    const table = buildSignatureBarTable(getSignature(), ticksPerUnit)
    const { bar, beatInBar, tickInBeat } = barBeatAt(table, ticksPerUnit, tick)
    return `${bar}:${beatInBar}:${tickInBeat}`
  }

  const format = (tick: TimelineTick, mode: TimeMode = TimeMode.Beats): string => {
    if (mode === TimeMode.Time) return formatClockTime(tickToSeconds(tick))
    return formatBarBeat(tick)
  }

  const stepPoints = (
    range: TickRange,
    step: number,
    weight: number,
    into: Map<TimelineTick, number>
  ): void => {
    const start = Math.floor(range.startTick / step) * step
    for (let tick = start; tick <= range.endTick; tick += step) {
      if (tick < range.startTick) continue
      const existing = into.get(tick)
      if (existing === undefined || weight > existing) into.set(tick, weight)
    }
  }

  const getSnapPoints = (range: TickRange, pixelsPerTick: number): TickSnapPoint[] => {
    const points = new Map<TimelineTick, number>()
    const barTable = buildSignatureBarTable(getSignature(), ticksPerUnit)
    // Bar boundaries walk each signature segment's own bar length — the
    // coarsest tier, so the ruler can show bar numbers when zoomed far out.
    barBoundaryTicks(barTable, ticksPerUnit, range).forEach((tick) => points.set(tick, 5))
    // Skip tiers whose spacing is under a pixel at the current zoom — they're
    // invisible and unsnappable, and zoomed far out the visible range covers
    // hundreds of thousands of ticks (this is called on every scroll).
    const addTier = (step: number, weight: number): void => {
      if (step * pixelsPerTick >= 1) stepPoints(range, step, weight, points)
    }
    addTier(ticksForStepDivision(MusicalStepDivision.beat, ticksPerUnit), 4)
    addTier(ticksForStepDivision(MusicalStepDivision.eighth, ticksPerUnit), 3)
    addTier(ticksForStepDivision(MusicalStepDivision.eighthTriplet, ticksPerUnit), 2.5)
    addTier(ticksForStepDivision(MusicalStepDivision.sixteenth, ticksPerUnit), 2)
    addTier(ticksForStepDivision(MusicalStepDivision.thirtySecond, ticksPerUnit), 1)
    return [...points.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([tick, weight]) => ({ tick, weight }))
  }

  return {
    domain: TimeDomain.Musical,
    ticksPerUnit,
    tickToSeconds,
    secondsToTick,
    unitToTicks,
    ticksToUnit,
    format,
    getSnapPoints,
  }
}
