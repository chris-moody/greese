'use client'
import type { JSX, ReactNode } from 'react'
import { cx } from '@greese/react'
import { RESERVED_STAGE_ID, RESERVED_TIMELINE_ID } from '../../core/layoutTree.types.ts'
import { useAuthoringSelector } from '../../environment/environment.tsx'
import { useUndoRedoKeymap } from '../../hooks/useHistory.ts'
import { selectShowRulers } from '../../state/selectors.ts'
import { PanelDock, type PanelDockProps } from '../PanelDock/PanelDock.tsx'
import { StageContext } from '../Stage/StageContext.tsx'
import { StageHost } from '../Stage/StageHost.tsx'
import { StageRulers } from '../Stage/StageRulers.tsx'
import { Timeline, type TimelineProps } from '../../timeline/Timeline/Timeline.tsx'

export interface AuthoringViewProps extends Omit<
  PanelDockProps,
  'renderReserved' | 'hasTimeline'
> {
  /** The timeline's props, or `false` for an editor without one (a still image). @default {} */
  timeline?: TimelineProps | false
  /** The bar above the stage: a `StageContext` of the editor's own. @default <StageContext /> */
  stageContext?: ReactNode
  /** Classes for the view's root. */
  className?: string
}

/**
 * A whole editor: the docked workspace, with the stage (its context bar,
 * renderer and rulers) and the timeline in their reserved places, and undo
 * and redo on the keyboard. Every editor built on the package had this shell.
 *
 * ```tsx
 * <env.Provider>
 *   <AuthoringView panels={[layersPanel, libraryPanel, tweenPanel]} />
 * </env.Provider>
 * ```
 */
export const AuthoringView = ({
  timeline = {},
  stageContext,
  className,
  ...dock
}: AuthoringViewProps): JSX.Element => {
  const showRulers = useAuthoringSelector(selectShowRulers)
  useUndoRedoKeymap()

  const renderReserved = (id: string): ReactNode => {
    if (id === RESERVED_STAGE_ID)
      return (
        <div className="greese-AuthoringView-stage">
          {stageContext ?? <StageContext />}
          <div className="greese-AuthoringView-canvas">
            <StageHost />
            {showRulers && <StageRulers />}
          </div>
        </div>
      )
    if (id === RESERVED_TIMELINE_ID && timeline) return <Timeline {...timeline} />
    return null
  }

  return (
    <div className={cx('greese-AuthoringView', className)}>
      <PanelDock
        {...dock}
        hasTimeline={timeline !== false}
        renderReserved={renderReserved}
      />
    </div>
  )
}
