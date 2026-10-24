import type { ComponentPropsWithRef, CSSProperties, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface SkeletonProps extends GreeseProps, ComponentPropsWithRef<'span'> {
  /**
   * `text` lines, a `rect` block (for images and cards) or a `circle` (for
   * avatars).
   * @default 'text'
   */
  shape?: 'text' | 'rect' | 'circle'
  /** Any CSS length. Text defaults to full width; circles to 2.5rem. */
  width?: string
  /** Any CSS length. Text is one line high. */
  height?: string
  /** For text: render this many lines, the last one shorter. */
  lines?: number
}

/**
 * A placeholder in the shape of content that is still loading. Hidden from
 * screen readers: announce loading on the container (e.g. `aria-busy`)
 * instead. The shimmer stops under reduced motion.
 *
 * ```tsx
 * <Skeleton shape="circle" width="3rem" />
 * <Skeleton lines={3} />
 * ```
 */
export const Skeleton = ({
  greese,
  shape = 'text',
  width,
  height,
  lines,
  className,
  style,
  ...props
}: SkeletonProps): JSX.Element => {
  const sized = {
    ...(width && { '--greese-skeleton-width': width }),
    ...(height && { '--greese-skeleton-height': height }),
    ...style,
  } as CSSProperties

  if (shape === 'text' && lines && lines > 1) {
    return (
      <span
        aria-hidden="true"
        {...props}
        className={cx('greese-Skeleton-lines', className)}
        style={sized}
      >
        {Array.from({ length: lines }, (_, i) => (
          <span key={i} className="greese-Skeleton greese-Skeleton--text" />
        ))}
      </span>
    )
  }
  return withGreese(
    <span
      aria-hidden="true"
      {...props}
      className={cx('greese-Skeleton', `greese-Skeleton--${shape}`, className)}
      style={sized}
    />,
    greese
  )
}
