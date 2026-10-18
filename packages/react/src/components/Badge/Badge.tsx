import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export type BadgeTone =
  'neutral' | 'accent' | 'positive' | 'negative' | 'warning' | 'info'

export interface BadgeProps extends GreeseProps, ComponentPropsWithRef<'span'> {
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
  greese,
  tone = 'neutral',
  variant = 'soft',
  className,
  ...props
}: BadgeProps): JSX.Element =>
  withGreese(
    <span
      {...props}
      className={cx(
        'greese-Badge',
        `greese-Badge--${tone}`,
        `greese-Badge--${variant}`,
        className
      )}
    />,
    greese
  )
