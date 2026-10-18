import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface ProgressProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'progress'>, 'value'> {
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
  greese,
  value,
  max = 100,
  size = 'md',
  className,
  ...props
}: ProgressProps): JSX.Element =>
  withGreese(
    <progress
      {...props}
      max={max}
      value={value}
      className={cx('greese-Progress', `greese-Progress--${size}`, className)}
    />,
    greese
  )
