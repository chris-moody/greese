import type { ComponentPropsWithRef, CSSProperties, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

/** The most items TextRotate cycles through: one keyframe set is compiled per count. */
export const TEXT_ROTATE_MAX = 6

export interface TextRotateProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** The words or lines to cycle through: 2 to 6. */
  items: string[]
  /** Seconds each item shows, the move included. @default 2.5 */
  duration?: number
}

/**
 * Cycles through a few words in place, in CSS alone ("Build *faster* /
 * *smaller* / *lighter*"). Screen readers hear every item once, and under
 * reduced motion the first item simply stays.
 *
 * ```tsx
 * <Text>Build <TextRotate items={['faster', 'smaller', 'lighter']} /></Text>
 * ```
 */
export const TextRotate = ({
  greese,
  items,
  duration = 2.5,
  className,
  style,
  ...props
}: TextRotateProps): JSX.Element => {
  const shown = items.slice(0, TEXT_ROTATE_MAX)
  return withGreese(
    <span
      {...props}
      className={cx(
        'greese-TextRotate',
        shown.length > 1 && `greese-TextRotate--${shown.length}`,
        className
      )}
      style={
        {
          '--greese-textrotate-duration': `${duration * shown.length}s`,
          ...style,
        } as CSSProperties
      }
    >
      <span className="greese-VisuallyHidden">{shown.join(', ')}</span>
      <span className="greese-TextRotate-track" aria-hidden="true">
        {/* The first again at the end, so the loop wraps without a jump. */}
        {[...shown, shown[0]].map((item, i) => (
          <span key={i} className="greese-TextRotate-item">
            {item}
          </span>
        ))}
      </span>
    </span>,
    greese
  )
}
