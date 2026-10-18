import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'

export type BadgeTone =
  'neutral' | 'accent' | 'positive' | 'negative' | 'warning' | 'info'

export interface BadgeProps extends ComponentPropsWithRef<'span'> {
  /** @default 'neutral' */
  tone?: BadgeTone
  /** @default 'soft' */
  variant?: 'soft' | 'solid' | 'outline'
}

/**
 * A short status label: "New", "Beta", "3". Not interactive; for removable or
 * selectable labels use Chip.
 */
export const Badge = ({
  tone = 'neutral',
  variant = 'soft',
  className,
  ...props
}: BadgeProps): JSX.Element => (
  <span
    {...props}
    className={cx(
      'greese-Badge',
      `greese-Badge--${tone}`,
      `greese-Badge--${variant}`,
      className
    )}
  />
)
