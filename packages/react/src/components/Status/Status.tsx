import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'
import type { BrandTone } from '../../utils/tone.ts'

export type StatusTone =
  'neutral' | BrandTone | 'positive' | 'negative' | 'warning' | 'info'

export interface StatusProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /**
   * The dot's colour: neutral, accent, a brand colour (primary, secondary,
   * tertiary), positive, negative, warning or info.
   * @default 'neutral'
   */
  tone?: StatusTone
  /**
   * What it means, for assistive tech ("Online"). Without it the dot is
   * decorative: say it in nearby text instead.
   */
  label?: string
  /** A ring that pulses outward, for live states. Still under reduced motion. */
  pulse?: boolean
  /** Dot diameter: `sm`, `md` or `lg`. @default 'md' */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * A small dot showing a state: online, error, building. Colour alone isn't
 * enough, so give it a `label` or put the state in text beside it.
 *
 * ```tsx
 * <Status tone="positive" label="Online" pulse />
 * ```
 */
export const Status = ({
  greese,
  tone = 'neutral',
  label,
  pulse,
  size = 'md',
  className,
  ...props
}: StatusProps): JSX.Element =>
  withGreese(
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...props}
      className={cx(
        'greese-Status',
        `greese-Status--${tone}`,
        `greese-Status--${size}`,
        pulse && 'greese-Status--pulse',
        className
      )}
    />,
    greese
  )
