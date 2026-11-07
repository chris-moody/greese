import type { JSX } from 'react'
import { Timeline, type TimelineProps } from '../Timeline/Timeline.tsx'

export type TimelinePanelProps = TimelineProps

/**
 * The timeline as a panel: a `Timeline` that fills its panel, for an editor
 * that docks it like any other (`PanelRegistrant.component`) rather than in
 * the dock's reserved timeline leaf.
 *
 * ```tsx
 * const timelinePanel = { id: 'timeline', title: 'Timeline', area: PanelArea.LEFT, component: TimelinePanel }
 * ```
 */
export const TimelinePanel = (props: TimelinePanelProps): JSX.Element => (
  <div className="greese-TimelinePanel">
    <Timeline {...props} />
  </div>
)
