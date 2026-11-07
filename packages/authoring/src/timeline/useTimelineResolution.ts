/**
 * `useTimelineResolution` — the seam between the tick-space {@link TimelineResolution}
 * contract and environments that never adopt one. When `config.resolution` is
 * absent, builds a pass-through resolution from `config.timing`/`config.timing_model`
 * (`ticksPerUnit = 1`) so `armatureAuthoringPoc`/`shapesAuthoringPoc` and any other
 * environment that never sets `resolution` needs zero changes.
 */
import { useMemo } from 'react'
import { useAuthoringEnvironment } from '../environment/environment.tsx'
import {
  TimeDomain,
  TimeMode,
  type TickRange,
  type TickSnapPoint,
  type TimelineResolution,
} from '../core/types/resolution.types.ts'
import { TimingMode } from '../core/types/timing.types.ts'
import type { MediaConfig } from '../environment/media.types.ts'
import { createTimingModel } from '../core/timeline/timingModel.ts'

const domainForTimingMode = (mode: TimingMode): TimeDomain =>
  mode === TimingMode.BPM ? TimeDomain.Musical : TimeDomain.Frames

const createLegacyResolution = (config: MediaConfig): TimelineResolution => {
  const timingModel = config.timing_model ?? createTimingModel(config.timing)

  return {
    domain: domainForTimingMode(config.timing.mode),
    ticksPerUnit: 1,
    tickToSeconds: (tick) => timingModel.frameToTime(tick),
    secondsToTick: (seconds) => timingModel.timeToFrame(seconds),
    unitToTicks: (unit) => unit,
    ticksToUnit: (tick) => tick,
    format: (tick, _mode?: TimeMode) => timingModel.labelFor(tick),
    getSnapPoints: (range: TickRange) => {
      const start = Math.ceil(range.startTick)
      const end = Math.floor(range.endTick)
      const points: TickSnapPoint[] = []
      for (let tick = start; tick <= end; tick += 1) points.push({ tick, weight: 1 })
      return points
    },
  }
}

/** The active {@link TimelineResolution}, from `config.resolution` or a legacy fallback. */
export const useTimelineResolution = (): TimelineResolution => {
  const { config } = useAuthoringEnvironment()
  return useMemo(() => config.resolution ?? createLegacyResolution(config), [config])
}
