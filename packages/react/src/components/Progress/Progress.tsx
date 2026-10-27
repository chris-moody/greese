import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'
import type { ControlSize } from '../Button/Button.tsx'

export interface ProgressProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'progress'>, 'value'> {
  /** Omit for an indeterminate (unknown duration) bar. */
  value?: number
  /** The value that means complete. @default 100 */
  max?: number
  /** Bar thickness, from the shared control sizes. @default 'md' */
  size?: ControlSize
  /**
   * Still working on it: the filled part runs with diagonal stripes in the
   * bar's two colors (still under reduced motion), and the bar is
   * `aria-busy`. For a known value that's being updated; leave `value` out
   * when there's no value at all.
   */
  loading?: boolean
}

/**
 * A native `<progress>` bar: announced with its percentage. Label it with
 * a Field, `aria-label` or `aria-labelledby`.
 *
 * ```tsx
 * <Progress value={40} aria-label="Uploading" />
 * <Progress value={40} loading aria-label="Uploading" />
 * ```
 */
export const Progress = ({
  greese,
  value,
  max = 100,
  size = 'md',
  loading,
  className,
  ...props
}: ProgressProps): JSX.Element =>
  withGreese(
    <progress
      aria-busy={loading || undefined}
      {...props}
      max={max}
      value={value}
      className={cx(
        'greese-Progress',
        `greese-Progress--${size}`,
        loading && 'greese-Progress--loading',
        className
      )}
    />,
    greese
  )
