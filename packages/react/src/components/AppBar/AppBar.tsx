import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface AppBarProps extends GreeseProps, ComponentPropsWithRef<'header'> {
  /** Stay at the top while scrolling. @default true */
  sticky?: boolean
  /** Gain a shadow once the page scrolls (CSS scroll-driven; static where unsupported). @default true */
  elevateOnScroll?: boolean
}

/**
 * The top bar: a `<header>` row for brand, navigation and actions. Padded for
 * notches and the status bar (safe-area insets). Lay out its contents with
 * Stack and Spacer.
 *
 * ```tsx
 * <AppBar sticky elevateOnScroll>
 *   <SidebarTrigger />
 *   <Heading level={1} variant="h5">Inbox</Heading>
 * </AppBar>
 * ```
 */
export const AppBar = ({
  greese,
  sticky = true,
  elevateOnScroll = true,
  className,
  ...props
}: AppBarProps): JSX.Element =>
  withGreese(
    <header
      {...props}
      className={cx(
        'greese-AppBar',
        sticky && 'greese-AppBar--sticky',
        elevateOnScroll && 'greese-AppBar--elevate',
        className
      )}
    />,
    greese
  )
