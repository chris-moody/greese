import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { Slot } from '../Slot/Slot.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

// Its own file, without Breadcrumbs' 'use client': an item has no state, so
// it stays a Server Component (and can take your router's link) while only
// the collapsing list is a client component.
export interface BreadcrumbItemProps extends GreeseProps, ComponentPropsWithRef<'a'> {
  /** The current page: rendered as text with `aria-current="page"`. Implied when there is no `href`. */
  current?: boolean
  /** Render your router's link. */
  asChild?: boolean
}

/**
 * One step in Breadcrumbs.
 *
 * ```tsx
 * <BreadcrumbItem href="/docs">Docs</BreadcrumbItem>
 * ```
 */
export const BreadcrumbItem = ({
  greese,
  current,
  asChild,
  className,
  children,
  ...props
}: BreadcrumbItemProps): JSX.Element => {
  const isCurrent = current ?? (!props.href && !asChild)
  const Link = (asChild ? Slot : 'a') as typeof Slot
  return withGreese(
    <li className={cx('greese-BreadcrumbItem', className)}>
      {isCurrent ? (
        <span aria-current="page" className="greese-BreadcrumbItem-current">
          {children}
        </span>
      ) : (
        <Link {...props} className="greese-BreadcrumbItem-link">
          {children}
        </Link>
      )}
    </li>,
    greese
  )
}
