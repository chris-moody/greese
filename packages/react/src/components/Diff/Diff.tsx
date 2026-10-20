'use client'
import type { ComponentPropsWithRef, CSSProperties, JSX, ReactNode } from 'react'
import { useControllableState } from '../../hooks/useControllableState.ts'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface DiffProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'div'>, 'onChange' | 'defaultValue'> {
  /** Shown on the inline-start side of the divider. */
  before: ReactNode
  /** Shown on the inline-end side. */
  after: ReactNode
  /** Names the divider's slider. @default 'Comparison' */
  label?: string
  /** Where the divider is, in percent from the inline start. */
  value?: number
  /** Where the divider starts, in percent, when it keeps its own state. @default 50 */
  defaultValue?: number
  /** Called with the divider's new position, in percent, as it moves. */
  onValueChange?: (value: number) => void
  /** Small tags in the top corners ("Before", "After"). */
  beforeLabel?: ReactNode
  /** A small tag in the top inline-end corner, over the `after` side. */
  afterLabel?: ReactNode
}

/**
 * Two versions of something (images, layouts, code) overlaid with a
 * draggable divider between them. The divider is a native range input:
 * drag, tap or use the arrow keys, and screen readers hear a percentage.
 *
 * ```tsx
 * <Diff before={<img src={raw} alt="Before" />} after={<img src={edited} alt="After" />} />
 * ```
 */
export const Diff = ({
  greese,
  before,
  after,
  label = 'Comparison',
  value: valueProp,
  defaultValue = 50,
  onValueChange,
  beforeLabel,
  afterLabel,
  className,
  style,
  ...props
}: DiffProps): JSX.Element => {
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  })
  return withGreese(
    <div
      {...props}
      className={cx('greese-Diff', className)}
      style={{ '--greese-diff-position': `${value}%`, ...style } as CSSProperties}
    >
      <div className="greese-Diff-item greese-Diff-item--after">
        {after}
        {afterLabel && (
          <span className="greese-Diff-tag greese-Diff-tag--after">{afterLabel}</span>
        )}
      </div>
      <div className="greese-Diff-item greese-Diff-item--before">
        {before}
        {beforeLabel && <span className="greese-Diff-tag">{beforeLabel}</span>}
      </div>
      <div className="greese-Diff-handle" aria-hidden="true" />
      <input
        type="range"
        className="greese-Diff-range"
        aria-label={label}
        aria-valuetext={`${Math.round(value)}%`}
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
      />
    </div>,
    greese
  )
}
