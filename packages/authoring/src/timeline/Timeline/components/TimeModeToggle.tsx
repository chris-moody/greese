import type { JSX } from 'react'
import { Segment, SegmentedControl, Tooltip } from '@greese/react'
import { FilmIcon, MusicNoteIcon, TimerIcon, type IconComponent } from '@greese/icons'
import {
  useAuthoringDispatch,
  useAuthoringSelector,
} from '../../../environment/environment.tsx'
import { timeModeActions } from '../../../state/timeMode.slice.ts'
import {
  selectActiveTimeMode,
  selectActiveTimelineScope,
} from '../../../state/selectors.ts'
import {
  TimeMode,
  TimeDomain,
  nativeTimeModeForDomain,
} from '../../../core/types/resolution.types.ts'

export interface TimeModeToggleProps {
  domain: TimeDomain
}

/** The icon standing for each display mode. */
const MODE_ICON: Record<TimeMode, IconComponent> = {
  [TimeMode.Time]: TimerIcon,
  [TimeMode.Frames]: FilmIcon,
  [TimeMode.Beats]: MusicNoteIcon,
}

/**
 * Ruler/readout display-mode switch: `Time` (every shell) alongside the
 * resolution's native mode (`Frames` for animation, `Beats` for musical) — the
 * two offered options derive from `resolution.domain`, not a separate config
 * field.
 *
 * A segmented control rather than a pair of toggle buttons: the choice is
 * exclusive, and this one is built on native radios, so the arrow keys move
 * between the two modes. The MUI group it replaces also allowed deselecting to
 * nothing, which this component never wanted — it discarded that case.
 */
export const TimeModeToggle = ({ domain }: TimeModeToggleProps): JSX.Element => {
  const dispatch = useAuthoringDispatch()
  const scope = useAuthoringSelector(selectActiveTimelineScope)
  const stored = useAuthoringSelector(selectActiveTimeMode)
  const nativeMode = nativeTimeModeForDomain(domain)
  const mode = stored ?? nativeMode

  const nativeModeLabel = nativeMode === TimeMode.Beats ? 'Beats' : 'Frames'
  const TimeIcon = MODE_ICON[TimeMode.Time]
  const NativeIcon = MODE_ICON[nativeMode]

  return (
    <SegmentedControl
      className={'greese-TimeModeToggle-control'}
      label="Time display"
      size="sm"
      value={mode}
      onValueChange={(next) =>
        dispatch(timeModeActions.setTimeMode({ scope, mode: next as TimeMode }))
      }
    >
      <Tooltip content="Time">
        <Segment
          className={'greese-TimeModeToggle-segment'}
          value={TimeMode.Time}
          aria-label="Time"
        >
          <TimeIcon className={'greese-TimeModeToggle-icon'} size="12px" />
        </Segment>
      </Tooltip>
      <Tooltip content={nativeModeLabel}>
        <Segment
          className={'greese-TimeModeToggle-segment'}
          value={nativeMode}
          aria-label={nativeModeLabel}
        >
          <NativeIcon className={'greese-TimeModeToggle-icon'} size="12px" />
        </Segment>
      </Tooltip>
    </SegmentedControl>
  )
}
