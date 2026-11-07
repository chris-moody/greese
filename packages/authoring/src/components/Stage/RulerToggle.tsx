'use client'
import type { ComponentPropsWithRef, JSX } from 'react'
import { IconButton, Tooltip } from '@greese/react'
import { RulerIcon } from '@greese/icons'

export interface RulerToggleProps extends Omit<
  ComponentPropsWithRef<'button'>,
  'children' | 'onToggle'
> {
  /** Whether the rulers show: the button is pressed while they do. */
  showRulers: boolean
  /** Called when the button is pressed, to show or hide them. */
  onToggle: () => void
}

/**
 * The rulers' toggle button, pressed while they show. `StageContext` renders
 * it for every editor; it's exported for a shell that lays out its own bar.
 *
 * ```tsx
 * <RulerToggle showRulers={on} onToggle={() => setOn(!on)} />
 * ```
 */
export const RulerToggle = ({
  showRulers,
  onToggle,
  ...props
}: RulerToggleProps): JSX.Element => (
  <Tooltip content={showRulers ? 'Hide rulers' : 'Show rulers'} placement="bottom">
    <IconButton
      {...props}
      label="Rulers"
      aria-pressed={showRulers}
      size="sm"
      variant={showRulers ? 'soft' : 'ghost'}
      tone={showRulers ? 'primary' : 'neutral'}
      onClick={onToggle}
    >
      <RulerIcon />
    </IconButton>
  </Tooltip>
)
