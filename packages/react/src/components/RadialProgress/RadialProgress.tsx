import type { ComponentPropsWithRef, CSSProperties, JSX, ReactNode } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface RadialProgressProps extends GreeseProps, ComponentPropsWithRef<'div'> {
  /** Omit for an indeterminate (unknown duration) spinner-like ring. */
  value?: number
  /** The value that means complete. @default 100 */
  max?: number
  /** Diameter, any CSS length. @default '4rem' */
  size?: string
  /** Ring width, any CSS length. @default '10%' of the size */
  thickness?: string
  /** In the centre. Defaults to the percentage; `null` shows nothing. */
  children?: ReactNode
}

/** The share of `max` that `value` is, as a whole percentage clamped to 0–100. */
export const radialPercent = (value: number, max: number): number =>
  max > 0 ? Math.round(Math.min(100, Math.max(0, (value / max) * 100))) : 0

/**
 * Progress as a ring, with the percentage in the middle. A
 * `role="progressbar"`: name it with `aria-label` or `aria-labelledby`.
 *
 * ```tsx
 * <RadialProgress value={72} aria-label="Storage used" />
 * ```
 */
export const RadialProgress = ({
  greese,
  value,
  max = 100,
  size,
  thickness,
  className,
  style,
  children,
  ...props
}: RadialProgressProps): JSX.Element => {
  const percent = value === undefined ? undefined : radialPercent(value, max)
  return withGreese(
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      {...props}
      className={cx(
        'greese-RadialProgress',
        percent === undefined && 'greese-RadialProgress--indeterminate',
        className
      )}
      style={
        {
          '--greese-radialprogress-value': percent ?? 25,
          '--greese-radialprogress-size': size,
          '--greese-radialprogress-thickness': thickness,
          ...style,
        } as CSSProperties
      }
    >
      <span className="greese-RadialProgress-label">
        {children === undefined ? percent !== undefined && `${percent}%` : children}
      </span>
    </div>,
    greese
  )
}
