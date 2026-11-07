import type { JSX } from 'react'
import { useAuthoringSelector } from '../../../environment/environment.tsx'
import { selectActiveTimeSignatureChanges } from '../../../state/selectors.ts'

export interface TimeSignatureReadoutProps {
  /** Playhead position, in ticks. */
  currentTick: number
}

/**
 * Read-only time-signature readout. Editing now happens through the Time
 * Signature tool's overlay, so the corner just shows the signature in effect
 * at the playhead — the latest change at or before `currentTick` (the active
 * scope always has at least the default 4/4-at-tick-0 entry).
 */
export const TimeSignatureReadout = ({
  currentTick,
}: TimeSignatureReadoutProps): JSX.Element | null => {
  const changes = useAuthoringSelector(selectActiveTimeSignatureChanges)
  const active = changes.filter((c) => c.tick <= currentTick).pop() ?? changes[0]
  if (!active) return null
  return (
    <div className={'greese-TimelineHeader-readout'}>
      {active.numerator}/{active.denominator}
    </div>
  )
}
