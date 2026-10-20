import type { ComponentPropsWithRef, JSX, ReactNode } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'
import type { BrandTone } from '../../utils/tone.ts'

export interface StatProps extends GreeseProps, ComponentPropsWithRef<'dl'> {
  /** What is measured: "Revenue". */
  label: ReactNode
  /** The figure: "$48,200". */
  value: ReactNode
  /** Context below it: "+12% on last month". */
  description?: ReactNode
  /**
   * Colors the description, for a change worth noticing (`positive`,
   * `negative`) or in a brand color (primary, secondary, tertiary). Say the
   * direction in its text too ("up 12%"): color alone isn't enough.
   * @default 'muted'
   */
  tone?: 'muted' | BrandTone | 'positive' | 'negative'
  /** A figure or icon at the inline end. */
  media?: ReactNode
}

/**
 * One headline number with its label: a native `<dl>`, so the label and the
 * value are read together. Put several in a StatGroup.
 *
 * ```tsx
 * <Stat label="Revenue" value="$48,200" description="up 12% on last month" tone="positive" />
 * ```
 */
export const Stat = ({
  greese,
  label,
  value,
  description,
  tone = 'muted',
  media,
  className,
  ...props
}: StatProps): JSX.Element =>
  withGreese(
    <dl {...props} className={cx('greese-Stat', className)}>
      <dt className="greese-Stat-label">{label}</dt>
      <dd className="greese-Stat-value">{value}</dd>
      {description && (
        <dd className={cx('greese-Stat-description', `greese-Stat-description--${tone}`)}>
          {description}
        </dd>
      )}
      {media && (
        <dd className="greese-Stat-media" aria-hidden="true">
          {media}
        </dd>
      )}
    </dl>,
    greese
  )

export interface StatGroupProps extends GreeseProps, ComponentPropsWithRef<'div'> {
  /**
   * Lay the stats out in a row with dividers from this width up; stacked
   * below. @default 'sm'
   */
  rowFrom?: 'xs' | 'sm' | 'md' | 'lg'
}

/** Stats side by side with dividers, stacking on narrow screens. */
export const StatGroup = ({
  greese,
  rowFrom = 'sm',
  className,
  ...props
}: StatGroupProps): JSX.Element =>
  withGreese(
    <div
      {...props}
      className={cx('greese-StatGroup', `greese-StatGroup--row-${rowFrom}`, className)}
    />,
    greese
  )
