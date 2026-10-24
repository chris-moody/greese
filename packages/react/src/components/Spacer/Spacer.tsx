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
  block: 'greese-Spacer',
  prop: 'size',
  isToken: neverToken,
  toCss: spaceToCss,
}

/**
 * Flexible or fixed empty space inside a Stack (or any flex container).
 *
 * ```tsx
 * <Stack direction="row">
 *   <Logo />
 *   <Spacer />
 *   <Button>Sign in</Button>
 * </Stack>
 * ```
 */
export const Spacer = ({
  size,
  className,
  style,
  ...props
}: SpacerProps): JSX.Element => {
  const resolved = resolveResponsive([[size, SIZE]], {
    // A fixed size stops it growing (Spacer.scss).
    className: cx('greese-Spacer', size != null && 'greese-Spacer--fixed', className),
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
