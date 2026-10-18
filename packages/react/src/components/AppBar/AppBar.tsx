import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'

export interface AppBarProps extends ComponentPropsWithRef<'header'> {
  /** Stay at the top while scrolling. @default true */
  sticky?: boolean
  /** Gain a shadow once the page scrolls (CSS scroll-driven; static where unsupported). @default true */
  elevateOnScroll?: boolean
}

/**
 * The top bar: a `<header>` row for brand, navigation and actions. Padded for
 * notches and the status bar (safe-area insets). Lay out its contents with
 * Stack and Spacer.
 */
export const AppBar = ({
  sticky = true,
  elevateOnScroll = true,
  className,
  ...props
}: AppBarProps): JSX.Element => (
  <header
    {...props}
    className={cx(
      'greese-AppBar',
      sticky && 'greese-AppBar--sticky',
      elevateOnScroll && 'greese-AppBar--elevate',
      className
    )}
  />
)
