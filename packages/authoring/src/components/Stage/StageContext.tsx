'use client'
import type { ComponentPropsWithRef, JSX, ReactNode } from 'react'
import { cx } from '@greese/react'
import {
  useAuthoringDispatch,
  useAuthoringEnvironment,
  useAuthoringSelector,
} from '../../environment/environment.tsx'
import { guidesActions } from '../../state/guides.slice.ts'
import { panelsActions } from '../../state/panels.slice.ts'
import { selectGuidesHidden, selectShowRulers } from '../../state/selectors.ts'
import { GuidesToggle } from './GuidesToggle.tsx'
import { RulerToggle } from './RulerToggle.tsx'

export interface StageContextProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'children'
> {
  /** A breadcrumb trail at its start: where in the nested subviews the stage is. */
  breadcrumbs?: ReactNode
}

/**
 * The bar above the stage: a breadcrumb slot, the media's own controls
 * (`MediaConfig.stageBarSlot`) and the rulers' and guides' toggles. It runs in the editor's
 * provider, so the slot can read and change the store.
 *
 * ```tsx
 * <StageContext breadcrumbs={<Breadcrumbs />} />
 * ```
 */
export const StageContext = ({
  breadcrumbs,
  className,
  ...props
}: StageContextProps): JSX.Element => {
  const { config } = useAuthoringEnvironment()
  const dispatch = useAuthoringDispatch()
  const showRulers = useAuthoringSelector(selectShowRulers)
  const guidesHidden = useAuthoringSelector(selectGuidesHidden)
  const Slot = config.stageBarSlot
  return (
    <div {...props} className={cx('greese-StageContext', className)}>
      {breadcrumbs}
      <div className="greese-StageContext-spacer" />
      {Slot && <Slot />}
      <RulerToggle
        showRulers={showRulers}
        onToggle={() => dispatch(panelsActions.setShowRulers(!showRulers))}
      />
      <GuidesToggle
        showGuides={!guidesHidden}
        onToggle={() => dispatch(guidesActions.setGuidesHidden(!guidesHidden))}
      />
    </div>
  )
}
