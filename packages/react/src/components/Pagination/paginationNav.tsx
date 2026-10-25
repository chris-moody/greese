import type { JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { ChevronLeftIcon } from '@greese/icons'
import { Button } from '../Button/Button.tsx'
import { withGreese } from '../../utils/greese.ts'
import type { PaginationProps } from './Pagination.tsx'

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

/**
 * Internal: Pagination's markup for `page`. Server-safe: `pick` is called on
 * a press only when given, so without it the DOM is handed no function.
 */
export const renderPagination = (
  {
    greese,
    count,
    getHref,
    siblings = 1,
    boundaries = 1,
    label = 'Pagination',
    labels,
    className,
    // The page state is the caller's: kept off the <nav>.
    page: _page,
    defaultPage,
    onPageChange,
    ...props
  }: PaginationProps,
  page: number,
  pick?: (page: number) => void
): JSX.Element => {
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
        <Button {...common} asChild onClick={pick && (() => pick(target))}>
          <a href={getHref(target)}>{content}</a>
        </Button>
      )
    }
    return (
      <Button {...common} disabled={disabled} onClick={pick && (() => pick(target))}>
        {content}
      </Button>
    )
  }

  return withGreese(
    <nav {...props} aria-label={label} className={cx('greese-Pagination', className)}>
      <ul className="greese-Pagination-list">
        <li>
          {control(page - 1, <ChevronLeftIcon />, {
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
                tone: item === page ? 'primary' : 'neutral',
              })}
            </li>
          ) : (
            <li key={item} className="greese-Pagination-ellipsis" aria-hidden="true">
              …
            </li>
          )
        )}
        <li>
          {control(page + 1, <ChevronLeftIcon />, {
            'aria-label': labels?.next ?? 'Next page',
            className: 'greese-Pagination-step greese-Pagination-step--next',
          })}
        </li>
      </ul>
    </nav>,
    greese
  )
}
