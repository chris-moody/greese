import type { ComponentPropsWithRef, JSX, ReactNode } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export type IndicatorPlacement =
  | 'top-start'
  | 'top'
  | 'top-end'
  | 'start'
  | 'center'
  | 'end'
  | 'bottom-start'
  | 'bottom'
  | 'bottom-end'

export interface IndicatorProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'div'>, 'content'> {
  /** What sits on the corner: a Badge, a Status, a count. */
  content: ReactNode
  /** Logical: `start`/`end` follow the writing direction. @default 'top-end' */
  placement?: IndicatorPlacement
}

/**
 * Pins a small element (a Badge, a Status dot) to a corner or edge of its
 * child, centred on that corner.
 *
 * ```tsx
 * <Indicator content={<Badge tone="negative" variant="solid">3</Badge>}>
 *   <IconButton label="Inbox"><InboxIcon /></IconButton>
 * </Indicator>
 * ```
 */
export const Indicator = ({
  greese,
  content,
  placement = 'top-end',
  className,
  children,
  ...props
}: IndicatorProps): JSX.Element =>
  withGreese(
    <div {...props} className={cx('greese-Indicator', className)}>
      {children}
      <span
        className={cx('greese-Indicator-item', `greese-Indicator-item--${placement}`)}
      >
        {content}
      </span>
    </div>,
    greese
  )
