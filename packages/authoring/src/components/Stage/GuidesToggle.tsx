'use client'
import type { ComponentPropsWithRef, JSX } from 'react'
import { IconButton, Tooltip } from '@greese/react'
import { GuidesIcon } from '@greese/icons'

export interface GuidesToggleProps extends Omit<
  ComponentPropsWithRef<'button'>,
  'children' | 'onToggle'
> {
  /** Whether the guides show: the button is pressed while they do. */
  showGuides: boolean
  /** Called when the button is pressed, to show or hide them. */
  onToggle: () => void
}

/**
 * The guides' toggle button, pressed while they show. Hiding them keeps them:
 * they come back as they were. `StageContext` renders it beside the rulers'
 * toggle; it's exported for a shell that lays out its own bar.
 *
 * ```tsx
 * <GuidesToggle showGuides={on} onToggle={() => setOn(!on)} />
 * ```
 */
export const GuidesToggle = ({
  showGuides,
  onToggle,
  ...props
}: GuidesToggleProps): JSX.Element => (
  <Tooltip content={showGuides ? 'Hide guides' : 'Show guides'} placement="bottom">
    <IconButton
      {...props}
      label="Guides"
      aria-pressed={showGuides}
      size="xs"
      variant={showGuides ? 'soft' : 'ghost'}
      tone={showGuides ? 'primary' : 'neutral'}
      onClick={onToggle}
    >
      <GuidesIcon />
    </IconButton>
  </Tooltip>
)
