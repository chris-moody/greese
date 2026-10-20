import type { ComponentPropsWithRef, JSX, ReactNode } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'
import { Slot, Slottable } from '../Slot/Slot.tsx'

export interface DockProps extends GreeseProps, ComponentPropsWithRef<'nav'> {
  /** Names the navigation landmark. @default 'Main' */
  'aria-label'?: string
  /**
   * `fixed` pins it to the bottom of the viewport, clear of the home
   * indicator; `static` leaves it in the flow. @default 'fixed'
   */
  position?: 'fixed' | 'static'
  /** Hide it from this breakpoint up, where other navigation takes over. */
  hideFrom?: 'sm' | 'md' | 'lg' | 'xl'
}

/**
 * A bottom navigation bar for phones: a `<nav>` of icon-and-label links.
 * Pair it with `hideFrom` and a sidebar or app bar for larger screens. Leave
 * room for it at the end of the page (`padding-block-end`).
 *
 * ```tsx
 * <Dock hideFrom="md">
 *   <DockItem href="/" icon={<HomeIcon />} current>Home</DockItem>
 *   <DockItem href="/search" icon={<SearchIcon />}>Search</DockItem>
 * </Dock>
 * ```
 */
export const Dock = ({
  greese,
  'aria-label': label = 'Main',
  position = 'fixed',
  hideFrom,
  className,
  children,
  ...props
}: DockProps): JSX.Element =>
  withGreese(
    <nav
      {...props}
      aria-label={label}
      className={cx(
        'greese-Dock',
        `greese-Dock--${position}`,
        hideFrom && `greese-Dock--hide-from-${hideFrom}`,
        className
      )}
    >
      <ul className="greese-Dock-list">{children}</ul>
    </nav>,
    greese
  )

export interface DockItemProps extends GreeseProps, ComponentPropsWithRef<'a'> {
  /** The icon above the label. Decorative: the label names the link. */
  icon: ReactNode
  /** The page it links to is the current one (`aria-current="page"`). */
  current?: boolean
  /** Render your own link (a router's) or a button instead of `<a>`. */
  asChild?: boolean
}

/** One destination in a Dock: an icon over a short label. */
export const DockItem = ({
  greese,
  icon,
  current,
  asChild,
  className,
  children,
  ...props
}: DockItemProps): JSX.Element => {
  const Root = (asChild ? Slot : 'a') as typeof Slot
  return withGreese(
    <li className="greese-DockItem">
      <Root
        aria-current={current ? 'page' : undefined}
        {...props}
        className={cx('greese-DockItem-link', className)}
      >
        <span className="greese-DockItem-icon" aria-hidden="true">
          {icon}
        </span>
        {/* With asChild, the child is the link and its text is the label. */}
        <Slottable>
          {asChild ? children : <span className="greese-DockItem-label">{children}</span>}
        </Slottable>
      </Root>
    </li>,
    greese
  )
}
