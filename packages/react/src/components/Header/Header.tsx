import type { ComponentPropsWithRef, JSX, ReactNode } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'
import type { ContainerSize } from '../Container/Container.tsx'

export interface HeaderProps extends GreeseProps, ComponentPropsWithRef<'header'> {
  /** The wordmark or logo, at the start of the row. */
  brand?: ReactNode
  /** What sits at the end of the row: actions, a menu button. */
  actions?: ReactNode
  /**
   * Detached from the page's edges: inset, rounded and raised, so the page
   * scrolls under it with a gap all round. Without it, it spans the page with
   * a rule along its foot. @default false
   */
  floating?: boolean
  /**
   * Stay at the top while scrolling. A sticky header also sets the page's
   * scroll padding to its own height, so in-page links (`#section`) land with
   * their target just below it. @default true
   */
  sticky?: boolean
  /** How wide its row grows, as a Container: `lg` is 1024px, `full` the page. @default 'lg' */
  size?: ContainerSize
}

/**
 * The page's header: a `<header>` row of brand, navigation (its children) and
 * actions, padded for notches and the status bar. Sticky by default, spanning
 * the page or `floating` inset from it; a sticky one keeps in-page links clear
 * of itself, with no JavaScript.
 *
 * ```tsx
 * <Header floating brand={<Link href="/">Acme</Link>} actions={<Button size="sm">Sign in</Button>}>
 *   <nav aria-label="Main">…</nav>
 * </Header>
 * ```
 */
export const Header = ({
  greese,
  brand,
  actions,
  floating = false,
  sticky = true,
  size = 'lg',
  className,
  children,
  ...props
}: HeaderProps): JSX.Element =>
  withGreese(
    <header
      {...props}
      className={cx(
        'greese-Header',
        `greese-Header--size-${size}`,
        sticky && 'greese-Header--sticky',
        floating && 'greese-Header--floating',
        className
      )}
    >
      <div className="greese-Header-inner">
        {brand !== undefined && <div className="greese-Header-brand">{brand}</div>}
        <div className="greese-Header-nav">{children}</div>
        {actions !== undefined && <div className="greese-Header-actions">{actions}</div>}
      </div>
    </header>,
    greese
  )
