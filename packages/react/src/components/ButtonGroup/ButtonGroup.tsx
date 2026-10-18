import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'

export interface ButtonGroupProps extends ComponentPropsWithRef<'div'> {
  /** @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical'
  /** Join the buttons into one segmented control. */
  attached?: boolean
}

/**
 * Groups related buttons (`role="group"`). Give it an `aria-label` when the
 * grouping itself needs a name, e.g. "Text formatting".
 */
export const ButtonGroup = ({
  orientation = 'horizontal',
  attached,
  className,
  ...props
}: ButtonGroupProps): JSX.Element => (
  <div
    role="group"
    {...props}
    data-orientation={orientation}
    className={cx(
      'sauce-ButtonGroup',
      attached && 'sauce-ButtonGroup--attached',
      className
    )}
  />
)
