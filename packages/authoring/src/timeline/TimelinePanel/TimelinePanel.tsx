import type { JSX } from 'react'
import { Box } from '@greese/react'
import { Timeline, type TimelineProps } from '../Timeline/Timeline.tsx'

export type TimelinePanelProps = TimelineProps

/**
 * TimelinePanel — a named, panel-registrant-ready wrapper around {@link Timeline}.
 * Use as `PanelRegistrant.component` in studio shells so the timeline can be
 * docked like any other panel (full-width, top-docked by default).
 */
export const TimelinePanel = (props: TimelinePanelProps): JSX.Element => (
  <Box className="w-full h-full overflow-hidden">
    <Timeline {...props} />
  </Box>
)
