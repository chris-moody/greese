'use client'
import type { JSX } from 'react'
import { useControllableState } from '../../hooks/useControllableState.ts'
import type { PaginationProps } from './Pagination.tsx'
import { renderPagination } from './paginationNav.tsx'

/** Internal: Pagination that keeps its own page (buttons, or uncontrolled links). */
export const PaginationState = (props: PaginationProps): JSX.Element => {
  const [page, setPage] = useControllableState({
    value: props.page,
    defaultValue: props.defaultPage ?? 1,
    onChange: props.onPageChange,
  })
  return renderPagination(props, page, setPage)
}
