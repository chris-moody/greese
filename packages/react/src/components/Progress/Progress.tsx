import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'

export interface ProgressProps extends Omit<ComponentPropsWithRef<'progress'>, 'value'> {
  /** Omit for an indeterminate (unknown duration) bar. */
  value?: number
  /** @default 100 */
  max?: number
  /** @default 'md' */
  size?: 'sm' | 'md'
}

/**
 * A native `<progress>` bar: announced with its percentage. Label it with
 * a Field, `aria-label` or `aria-labelledby`.
 */
export const Progress = ({
  value,
  max = 100,
  size = 'md',
  className,
  ...props
}: ProgressProps): JSX.Element => (
  <progress
    {...props}
    max={max}
    value={value}
    className={cx('sauce-Progress', `sauce-Progress--${size}`, className)}
  />
)
