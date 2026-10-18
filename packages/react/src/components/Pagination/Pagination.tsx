'use client'
import type { ComponentPropsWithRef, JSX } from 'react'
import { useControllableState } from '../../hooks/useControllableState.ts'
import { cx } from '../../utils/cx.ts'
import { ChevronGlyph } from '../../utils/glyphs.tsx'
import { Button } from '../Button/Button.tsx'

export type PageItem = number | 'ellipsis-start' | 'ellipsis-end'

/**
 * The page numbers to show: always the first and last `boundaries` pages,
 * `siblings` either side of the current page, and an ellipsis for each gap.
 * Never shows an ellipsis that hides a single page; that page is shown instead.
 */
export const paginationRange = (
  page: number,
  count: number,
  siblings = 1,
  boundaries = 1
): PageItem[] => {
  const range = (from: number, to: number) =>
    Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i)
  // Slots: boundaries ×2, siblings ×2, current, two ellipses.
  if (count <= boundaries * 2 + siblings * 2 + 3) return range(1, count)

  const start = Math.max(
    Math.min(page - siblings, count - boundaries - siblings * 2 - 1),
    boundaries + 2
  )
  const end = Math.min(
    Math.max(page + siblings, boundaries + siblings * 2 + 2),
    count - boundaries - 1
  )

  return [
    ...range(1, boundaries),
    ...(start > boundaries + 2 ? ['ellipsis-start' as const] : [boundaries + 1]),
    ...range(start, end),
    ...(end < count - boundaries - 1 ? ['ellipsis-end' as const] : [count - boundaries]),
    ...range(count - boundaries + 1, count),
  ]
}

export interface PaginationProps extends Omit<ComponentPropsWithRef<'nav'>, 'onChange'> {
  /** Total pages. */
  count: number
  page?: number
  /** @default 1 */
  defaultPage?: number
  onPageChange?: (page: number) => void
  /**
   * Render real links, e.g. `(page) => \`?page=${page}\``: crawlable, and they
   * work without JS. Without it, pages are buttons.
   */
  getHref?: (page: number) => string
  /** @default 1 */
  siblings?: number
  /** @default 1 */
  boundaries?: number
  /** @default 'Pagination' */
  label?: string
  /** @default { previous: 'Previous page', next: 'Next page', page: (n) => `Page ${n}` } */
  labels?: { previous?: string; next?: string; page?: (page: number) => string }
}

/**
 * Page navigation. On phones it condenses to previous / current / next; from
 * `sm` it shows the full range.
 */
export const Pagination = ({
  count,
  page: pageProp,
  defaultPage = 1,
  onPageChange,
  getHref,
  siblings = 1,
  boundaries = 1,
  label = 'Pagination',
  labels,
  className,
  ...props
}: PaginationProps): JSX.Element => {
  const [page, setPage] = useControllableState({
    value: pageProp,
    defaultValue: defaultPage,
    onChange: onPageChange,
  })
  const pageLabel = labels?.page ?? ((n: number) => `Page ${n}`)

  const control = (target: number, content: JSX.Element | number, extra: object) => {
    const disabled = target < 1 || target > count
    const common = {
      size: 'sm' as const,
      variant: 'ghost' as const,
      tone: 'neutral' as const,
      ...extra,
    }
    if (getHref && !disabled) {
      return (
        <Button {...common} asChild onClick={() => setPage(target)}>
          <a href={getHref(target)}>{content}</a>
        </Button>
      )
    }
    return (
      <Button {...common} disabled={disabled} onClick={() => setPage(target)}>
        {content}
      </Button>
    )
  }

  return (
    <nav {...props} aria-label={label} className={cx('greese-Pagination', className)}>
      <ul className="greese-Pagination-list">
        <li>
          {control(page - 1, <ChevronGlyph />, {
            'aria-label': labels?.previous ?? 'Previous page',
            className: 'greese-Pagination-step',
          })}
        </li>
        {paginationRange(page, count, siblings, boundaries).map((item) =>
          typeof item === 'number' ? (
            <li
              key={item}
              className={cx(
                'greese-Pagination-page',
                item === page && 'greese-Pagination-page--current'
              )}
            >
              {control(item, item, {
                'aria-label': pageLabel(item),
                'aria-current': item === page ? 'page' : undefined,
                variant: item === page ? 'soft' : 'ghost',
                tone: item === page ? 'accent' : 'neutral',
              })}
            </li>
          ) : (
            <li key={item} className="greese-Pagination-ellipsis" aria-hidden="true">
              …
            </li>
          )
        )}
        <li>
          {control(page + 1, <ChevronGlyph />, {
            'aria-label': labels?.next ?? 'Next page',
            className: 'greese-Pagination-step greese-Pagination-step--next',
          })}
        </li>
      </ul>
    </nav>
  )
}
