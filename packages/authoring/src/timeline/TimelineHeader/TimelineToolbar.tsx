'use client'
import type { ReactNode, JSX } from 'react'
import { ButtonGroup, ToggleButton, Tooltip } from '@greese/react'
import {
  TimerIcon as TimeSigIcon,
  FlagIcon,
  SpeedIcon,
  ImagesIcon as FrameModeIcon,
} from '@greese/icons'
import {
  useAuthoringDispatch,
  useAuthoringEnvironment,
  useAuthoringSelector,
} from '../../environment/environment.tsx'
import { timelineToolsActions, TimelineToolId } from '../../state/timelineTools.slice.ts'
import {
  selectActiveTimelineScope,
  selectActiveTimelineTool,
} from '../../state/selectors.ts'

/**
 * Tool switcher rendered left of the breadcrumbs: Frame (default) and Marker are
 * always present; Rate is labeled per shell (`config.timelineTools?.rateLabel`);
 * Time Signature only appears when `config.timelineTools?.showTimeSignature`.
 */
export const TimelineToolbar = (): JSX.Element => {
  const dispatch = useAuthoringDispatch()
  const { config } = useAuthoringEnvironment()
  const scope = useAuthoringSelector(selectActiveTimelineScope)
  const activeTool = useAuthoringSelector(selectActiveTimelineTool)
  const rateLabel = config.timelineTools?.rateLabel ?? 'Framerate'
  const showTimeSignature = !!config.timelineTools?.showTimeSignature

  /*
   * Selecting a tool only ever sets one: pressing the active tool again is a
   * no-op, so there's always a tool.
   */
  const select = (tool: TimelineToolId) => () =>
    dispatch(timelineToolsActions.setTool({ scope, tool }))

  const tools: Array<{ id: TimelineToolId; label: string; icon: ReactNode }> = [
    { id: TimelineToolId.frame, label: 'Frame', icon: <FrameModeIcon size="1.25rem" /> },
    { id: TimelineToolId.rate, label: rateLabel, icon: <SpeedIcon size="1.25rem" /> },
    { id: TimelineToolId.marker, label: 'Marker', icon: <FlagIcon size="1.25rem" /> },
    ...(showTimeSignature
      ? [
          {
            id: TimelineToolId.timeSignature,
            label: 'Time Signature',
            icon: <TimeSigIcon size="1.25rem" />,
          },
        ]
      : []),
  ]

  return (
    <ButtonGroup
      className={'greese-TimelineToolbar-toolbar'}
      attached
      aria-label="Timeline tool"
    >
      {tools.map((tool) => (
        <Tooltip key={tool.id} content={tool.label}>
          <ToggleButton
            className={'greese-TimelineToolbar-button'}
            size="sm"
            variant="ghost"
            aria-label={tool.label}
            pressed={activeTool === tool.id}
            onPressedChange={select(tool.id)}
          >
            {tool.icon}
          </ToggleButton>
        </Tooltip>
      ))}
    </ButtonGroup>
  )
}
