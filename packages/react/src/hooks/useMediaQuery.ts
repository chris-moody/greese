'use client'
import { useCallback, useSyncExternalStore } from 'react'

// One MediaQueryList per query, shared by every hook instance.
const lists = new Map<string, MediaQueryList>()
const getList = (query: string): MediaQueryList => {
  let list = lists.get(query)
  if (!list) {
    list = window.matchMedia(query)
    lists.set(query, list)
  }
  return list
}

export interface UseMediaQueryOptions {
  /**
   * Value during SSR and hydration, before the browser can be asked. The real
   * value follows on the first client render.
   * @default false
   */
  ssrMatch?: boolean
}

/**
 * Whether a media query matches, kept live.
 *
 * Reach for CSS first: media queries in a stylesheet cost nothing and never
 * mismatch on hydration. Use this only when the rendered tree itself must
 * differ, e.g. a sidebar that becomes a drawer.
 */
export const useMediaQuery = (
  query: string,
  { ssrMatch = false }: UseMediaQueryOptions = {}
): boolean => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = getList(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query]
  )
  return useSyncExternalStore(
    subscribe,
    () => getList(query).matches,
    () => ssrMatch
  )
}
