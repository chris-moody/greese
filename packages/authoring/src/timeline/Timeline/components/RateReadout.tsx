'use client'
import type { JSX } from 'react'
import { useAuthoringSelector } from '../../../environment/environment.tsx'
import { selectActiveRateCurve } from '../../../state/selectors.ts'
import { sampleLevelCurve } from '../../../core/timeline/levelEditor.ts'

export interface RateReadoutProps {
  /** Playhead position, in ticks. */
  currentTick: number
  /**
   * Flat rate shown when the active scope's curve has fewer than 2 points —
   * mirrors exactly how `AnimationResolution`/`MusicalResolution` decide
   * whether the curve or the flat fps/bpm governs timing.
   */
  flatRate: number
  units: string
}

/**
 * Read-only rate readout. Editing now happens through the Rate tool's curve
 * graph, so the corner just shows the effective rate at the playhead — sampled
 * from the active scope's curve when it has 2+ points, else the shell's flat
 * rate (a lone curve point doesn't govern timing, so it doesn't govern the
 * readout either).
 */
export const RateReadout = ({
  currentTick,
  flatRate,
  units,
}: RateReadoutProps): JSX.Element => {
  const points = useAuthoringSelector(selectActiveRateCurve)
  const value = points.length >= 2 ? sampleLevelCurve(points, currentTick) : flatRate
  return (
    <div className={'greese-TimelineHeader-readout'}>
      {Math.round(value)} {units}
    </div>
  )
}
