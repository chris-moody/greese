import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'
import type { BrandTone } from '../../utils/tone.ts'

export type BadgeTone =
  'neutral' | BrandTone | 'positive' | 'negative' | 'warning' | 'info'

export interface BadgeProps extends GreeseProps, ComponentPropsWithRef<'span'> {
  /**
   * The color and meaning: neutral, accent, a brand color (primary,
   * secondary, tertiary), positive, negative, warning or info.
   * @default 'neutral'
   */
  tone?: BadgeTone
  /** `soft` (a light tint), `solid` (filled) or `outline` (border only). @default 'soft' */
  variant?: 'soft' | 'solid' | 'outline'
}

/**
 * A short status label: "New", "Beta", "3". Not interactive; for removable or
 * selectable labels use Chip.
 *
 * ```tsx
 * <Badge tone="positive">Paid</Badge>
 * ```
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
