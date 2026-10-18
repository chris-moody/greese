import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface ButtonGroupProps extends GreeseProps, ComponentPropsWithRef<'div'> {
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
  greese,
  orientation = 'horizontal',
  attached,
  className,
  ...props
}: ButtonGroupProps): JSX.Element =>
  withGreese(
    <div
      role="group"
      {...props}
      data-orientation={orientation}
      className={cx(
        'greese-ButtonGroup',
        attached && 'greese-ButtonGroup--attached',
        className
      )}
    />,
    greese
  )
