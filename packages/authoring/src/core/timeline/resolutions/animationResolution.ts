/**
 * `AnimationResolution` — the {@link TimelineResolution} for frame-based shells
 * (NeoPixels, Armature Studio). Default 1000 ticks/frame (sub-frame keys, no
 * floats, replacing the old `1/16`-frame span hack).
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
import type { LevelPoint } from '../levelEditor.types.ts'

/** Default ticks-per-frame — sub-frame keys, no float frame indices. */
export const DEFAULT_TICKS_PER_FRAME = 1000

export interface AnimationResolutionOptions {
  /** Live fps reader (e.g. closes over a scope's active fps, like `activeFps()` today). */
  getFps: () => number
  /** Live ticks-per-frame reader — editable via the timeline's TPF field. Defaults to 1000. */
  getTicksPerFrame?: () => number
  /**
   * Added to the displayed whole-frame index in `format` — e.g. Armature
   * Studio's existing `TimingModel.labelFor` shows 1-based frame numbers while
   * the store stays 0-based internally. Defaults to 0 (NeoPixels' 0-based display).
   */
  frameLabelOffset?: number
  /**
   * Live rate-curve reader (Phase 7's Rate tool) — point values are fps.
   * With 0 or 1 points this reduces exactly to the flat `getFps()` math.
   */
  getRatePoints?: () => LevelPoint[]
}

/** Build a `TimelineResolution` for a frame-indexed (animation) shell. */
export const createAnimationResolution = (
  options: AnimationResolutionOptions
): TimelineResolution => {
  const { getFps } = options
  // Read live on every use (not once) so the timeline's TPF field can retune
  // sub-frame granularity without rebuilding the environment — same pattern as
  // the live `getFps`/`getRatePoints` readers.
  const tpf = (): number => options.getTicksPerFrame?.() ?? DEFAULT_TICKS_PER_FRAME
  const frameLabelOffset = options.frameLabelOffset ?? 0
  const getRatePoints = options.getRatePoints ?? (() => [])

  const tickToSeconds = (tick: TimelineTick): number => {
    const points = getRatePoints()
    if (points.length < 2) return tick / tpf() / getFps()
    const table = cumulativeSecondsTable(
      points.map((p) => ({ tick: p.tick, ticksPerSecond: tpf() * p.value }))
    )
    return secondsForTick(table, tick)
  }
  const secondsToTick = (seconds: number): TimelineTick => {
    const points = getRatePoints()
    if (points.length < 2) return Math.round(seconds * getFps() * tpf())
    const table = cumulativeSecondsTable(
      points.map((p) => ({ tick: p.tick, ticksPerSecond: tpf() * p.value }))
    )
    return tickForSeconds(table, seconds)
  }
  const unitToTicks = (unit: number): TimelineTick => Math.round(unit * tpf())
  const ticksToUnit = (tick: TimelineTick): number => tick / tpf()

  const format = (tick: TimelineTick, mode: TimeMode = TimeMode.Frames): string => {
    if (mode === TimeMode.Time) return formatClockTime(tickToSeconds(tick))
    const base = Math.floor(tick / tpf())
    const remainder = tick - base * tpf()
    const frame = base + frameLabelOffset
    return remainder === 0 ? String(frame) : `${frame}+${remainder}`
  }

  const getSnapPoints = (range: TickRange, _pixelsPerTick: number): TickSnapPoint[] => {
    const points: TickSnapPoint[] = []
    const start = Math.floor(range.startTick / tpf()) * tpf()
    for (let tick = start; tick <= range.endTick; tick += tpf()) {
      if (tick >= range.startTick) points.push({ tick, weight: 1 })
    }
    return points
  }

  return {
    domain: TimeDomain.Frames,
    get ticksPerUnit() {
      return tpf()
    },
    tickToSeconds,
    secondsToTick,
    unitToTicks,
    ticksToUnit,
    format,
    getSnapPoints,
  }
}
