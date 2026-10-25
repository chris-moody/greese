'use client'
import {
  Children,
  useState,
  type ComponentPropsWithRef,
  type JSX,
  type ReactNode,
} from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface BreadcrumbsProps extends GreeseProps, ComponentPropsWithRef<'nav'> {
  /** Collapse the middle into "…" beyond this many items; the button expands them. */
  maxItems?: number
  /** Names the navigation landmark for screen readers. @default 'Breadcrumb' */
  label?: string
  /** Name of the expand button. @default 'Show full path' */
  expandLabel?: string
  /** BreadcrumbItems, from the top level to the current page. */
  children: ReactNode
}

/**
 * Where the current page sits in the hierarchy: a labelled `<nav>` with an
 * ordered list. Separators are CSS and silent to screen readers.
 *
 * ```tsx
 * <Breadcrumbs>
 *   <BreadcrumbItem href="/">Home</BreadcrumbItem>
 *   <BreadcrumbItem href="/docs">Docs</BreadcrumbItem>
 *   <BreadcrumbItem>Install</BreadcrumbItem>
 * </Breadcrumbs>
 * ```
 */
export const Breadcrumbs = ({
  greese,
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

  return withGreese(
    <nav {...props} aria-label={label} className={cx('greese-Breadcrumbs', className)}>
      <ol className="greese-Breadcrumbs-list">{shown}</ol>
    </nav>,
    greese
  )
}
