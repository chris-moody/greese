import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'

export interface SpinnerProps extends ComponentPropsWithRef<'span'> {
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
  label = 'Loading',
  size = 'md',
  className,
  ...props
}: SpinnerProps): JSX.Element => (
  <span
    role="status"
    aria-label={label}
    {...props}
    className={cx('sauce-Spinner', `sauce-Spinner--${size}`, className)}
  />
)
