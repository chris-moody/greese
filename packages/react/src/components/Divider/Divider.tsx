import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface DividerProps extends GreeseProps, ComponentPropsWithRef<'hr'> {
  /** `vertical` divides items in a row. @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical'
}

/**
 * A thematic separator: an `<hr>`, so assistive tech announces it. In a Stack
 * it stretches across the cross axis.
 */
export const Divider = ({
  greese,
  orientation = 'horizontal',
  className,
  ...props
}: DividerProps): JSX.Element =>
  withGreese(
    <hr
      aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
      data-orientation={orientation}
      {...props}
      className={cx('greese-Divider', className)}
    />,
    greese
  )
