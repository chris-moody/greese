import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'

export interface DividerProps extends ComponentPropsWithRef<'hr'> {
  /** `vertical` divides items in a row. @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical'
}

/**
 * A thematic separator: an `<hr>`, so assistive tech announces it. In a Stack
 * it stretches across the cross axis.
 */
export const Divider = ({
  orientation = 'horizontal',
  className,
  ...props
}: DividerProps): JSX.Element => (
  <hr
    aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
    data-orientation={orientation}
    {...props}
    className={cx('sauce-Divider', className)}
  />
)
