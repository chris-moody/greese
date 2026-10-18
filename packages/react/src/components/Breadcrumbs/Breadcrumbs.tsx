'use client'
import {
  Children,
  useState,
  type ComponentPropsWithRef,
  type JSX,
  type ReactNode,
} from 'react'
import { cx } from '../../utils/cx.ts'
import { Slot } from '../Slot/Slot.tsx'

export interface BreadcrumbsProps extends ComponentPropsWithRef<'nav'> {
  /** Collapse the middle into "…" beyond this many items; the button expands them. */
  maxItems?: number
  /** @default 'Breadcrumb' */
  label?: string
  /** Name of the expand button. @default 'Show full path' */
  expandLabel?: string
  children: ReactNode
}

/**
 * Where the current page sits in the hierarchy: a labelled `<nav>` with an
 * ordered list. Separators are CSS and silent to screen readers.
 */
export const Breadcrumbs = ({
  maxItems,
  label = 'Breadcrumb',
  expandLabel = 'Show full path',
  className,
  children,
  ...props
}: BreadcrumbsProps): JSX.Element => {
  const [expanded, setExpanded] = useState(false)
  const items = Children.toArray(children)
  const collapse = !expanded && maxItems !== undefined && items.length > maxItems
  const shown = collapse
    ? [
        items[0],
        <li key="greese-ellipsis" className="greese-BreadcrumbItem">
          <button
            type="button"
            className="greese-Breadcrumbs-expand"
            aria-label={expandLabel}
            onClick={() => setExpanded(true)}
          >
            …
          </button>
        </li>,
        ...items.slice(items.length - (maxItems - 1)),
      ]
    : items

  return (
    <nav {...props} aria-label={label} className={cx('greese-Breadcrumbs', className)}>
      <ol className="greese-Breadcrumbs-list">{shown}</ol>
    </nav>
  )
}

export interface BreadcrumbItemProps extends ComponentPropsWithRef<'a'> {
  /** The current page: rendered as text with `aria-current="page"`. Implied when there is no `href`. */
  current?: boolean
  /** Render your router's link. */
  asChild?: boolean
}

/** One step in Breadcrumbs. */
export const BreadcrumbItem = ({
  current,
  asChild,
  className,
  children,
  ...props
}: BreadcrumbItemProps): JSX.Element => {
  const isCurrent = current ?? (!props.href && !asChild)
  const Link = (asChild ? Slot : 'a') as typeof Slot
  return (
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
    </li>
  )
}
