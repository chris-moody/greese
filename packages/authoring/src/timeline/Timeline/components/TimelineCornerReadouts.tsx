import type { JSX } from 'react'
import { useAuthoringSelector } from '../../../environment/environment.tsx'
import { selectPlayback } from '../../../state/selectors.ts'
import {
  TimeMode,
  type TimelineResolution,
} from '../../../core/types/resolution.types.ts'
import { RateReadout } from './RateReadout.tsx'
import { TimeSignatureReadout } from './TimeSignatureReadout.tsx'
import { TimeModeToggle } from './TimeModeToggle.tsx'

export interface TimelineCornerReadoutsProps {
  frameRate?: number
  frameRateUnits: string
  timeMode: TimeMode
  timelineResolution: TimelineResolution
  count: number
  showTimeSignature?: boolean
}

/**
 * Owns the corner readouts that need the live playhead position (rate, time
 * signature, tick/frame count) plus the time-mode toggle sandwiched between
 * them, so `Timeline.tsx` itself never subscribes to `currentFrame` — see
 * `sound-studio-timeline-perf-plan.md` Phase 2a.
 */
export const TimelineCornerReadouts = ({
  frameRate,
  frameRateUnits,
  timeMode,
  timelineResolution,
  count,
  showTimeSignature,
}: TimelineCornerReadoutsProps): JSX.Element => {
  const { currentFrame } = useAuthoringSelector(selectPlayback)
  const currentTick = timelineResolution.unitToTicks(currentFrame)

  return (
    <>
      <RateReadout
        currentTick={currentTick}
        flatRate={frameRate ?? 0}
        units={frameRateUnits}
      />
      {showTimeSignature && <TimeSignatureReadout currentTick={currentTick} />}
      <TimeModeToggle domain={timelineResolution.domain} />
      <div className={'greese-TimelineHeader-readout'}>
        {timelineResolution.format(currentTick, timeMode)} / {count}
      </div>
    </>
  )
}
