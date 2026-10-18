import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface SpinnerProps extends GreeseProps, ComponentPropsWithRef<'span'> {
  /** Announced to screen readers. @default 'Loading' */
  label?: string
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * An indeterminate loading indicator (`role="status"`). Under reduced motion
 * it pulses gently instead of spinning.
 */
export const Spinner = ({
  greese,
  label = 'Loading',
  size = 'md',
  className,
  ...props
}: SpinnerProps): JSX.Element =>
  withGreese(
    <span
      role="status"
      aria-label={label}
      {...props}
      className={cx('greese-Spinner', `greese-Spinner--${size}`, className)}
    />,
    greese
  )
