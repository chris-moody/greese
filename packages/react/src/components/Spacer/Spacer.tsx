import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import {
  neverToken,
  resolveResponsive,
  spaceToCss,
  type Responsive,
  type ResponsiveConfig,
  type SpaceValue,
} from '../../utils/responsive.ts'

export interface SpacerProps extends ComponentPropsWithRef<'div'> {
  /**
   * A fixed gap along the parent's main axis. Omit to grow and push
   * neighbours apart, e.g. a toolbar's trailing actions.
   */
  size?: Responsive<SpaceValue>
}

const SIZE: ResponsiveConfig = {
  block: 'sauce-Spacer',
  prop: 'size',
  isToken: neverToken,
  toCss: spaceToCss,
}

/** Flexible or fixed empty space inside a Stack (or any flex container). */
export const Spacer = ({
  size,
  className,
  style,
  ...props
}: SpacerProps): JSX.Element => {
  const resolved = resolveResponsive([[size, SIZE]], {
    className: cx('sauce-Spacer', className),
    style,
  })
  return (
    <div
      aria-hidden="true"
      {...props}
      className={resolved.className}
      style={resolved.style}
    />
  )
}
