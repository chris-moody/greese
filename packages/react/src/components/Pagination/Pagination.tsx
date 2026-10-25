import type { ComponentPropsWithRef, JSX } from 'react'
import type { GreeseProps } from '../../utils/greese.ts'
import { renderPagination } from './paginationNav.tsx'
import { PaginationState } from './PaginationState.tsx'

export { paginationRange, type PageItem } from './paginationNav.tsx'

export interface PaginationProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'nav'>, 'onChange'> {
  /** Total pages. */
  count: number
  /** The current page, from 1, when you control it. Pair with `onPageChange`. */
  page?: number
  /** The page shown first, when it keeps its own state. @default 1 */
  defaultPage?: number
  /** Called with the new page number when the user picks one. */
  onPageChange?: (page: number) => void
  /**
   * Render real links, e.g. `(page) => \`?page=${page}\``: crawlable, and they
   * work without JS. Without it, pages are buttons. With `page` as well (read
   * from the URL, say), it's a Server Component and ships no JavaScript.
   */
  getHref?: (page: number) => string
  /** How many page numbers to show on each side of the current one. @default 1 */
  siblings?: number
  /** How many page numbers to always show at the start and the end. @default 1 */
  boundaries?: number
  /** Names the navigation landmark for screen readers. @default 'Pagination' */
  label?: string
  /**
   * Accessible names for the previous and next buttons and each page, for
   * translation.
   * @default { previous: 'Previous page', next: 'Next page', page: (n) => `Page ${n}` }
   */
  labels?: { previous?: string; next?: string; page?: (page: number) => string }
}

/**
 * Page navigation. On phones it condenses to previous / current / next; from
 * `sm` it shows the full range.
 *
 * ```tsx
 * <Pagination count={20} page={page} getHref={(page) => `?page=${page}`} />
 * ```
 *
 * Links with a controlled `page` render from a Server Component; buttons,
 * or links that track their own page, are a client component.
 */
export const Pagination = (props: PaginationProps): JSX.Element =>
  // Links for a known page need no state: the URL holds it. Calling `getHref`
  // here, on the server, is what lets a Server Component pass it at all.
  props.getHref && props.page !== undefined ? (
    renderPagination(props, props.page, props.onPageChange)
  ) : (
    <PaginationState {...props} />
  )
