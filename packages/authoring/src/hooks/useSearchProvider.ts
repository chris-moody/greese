'use client'
import { useEffect, useRef } from 'react'
import type { SearchProvider } from '../core/search/searchProvider.types.ts'

/**
 * Caches a `SearchProvider` instance and its index per data source: the
 * provider is created exactly once (lazily, via `createProvider`, mirroring
 * the `useRef<FC>(() => ...).current` lazy-init idiom used elsewhere in this
 * framework) and lives for as long as the calling component does; the index
 * is rebuilt only when `items`' reference changes — a fresh array from a new
 * selector/query result — never on every render. This is what keeps typing
 * in a search box responsive as a collection grows: indexing is the
 * expensive part, and it only reruns when the underlying collection actually
 * changed, not on every keystroke or unrelated re-render.
 *
 * Choosing a different `SearchProvider` implementation (fuzzy vs. prefix vs.
 * exact) is a one-time decision per list, not a per-render one — remount
 * (change the component's `key`) to switch algorithms rather than expecting
 * this hook to swap the underlying provider live.
 */
export function useSearchProvider<T>(
  items: readonly T[],
  createProvider: () => SearchProvider<T>
): SearchProvider<T> {
  const providerRef = useRef<SearchProvider<T> | null>(null)
  const indexedItemsRef = useRef<readonly T[] | null>(null)

  if (providerRef.current === null) {
    providerRef.current = createProvider()
  }
  if (indexedItemsRef.current !== items) {
    indexedItemsRef.current = items
    providerRef.current.index(items)
  }

  // Effect (not inline) so a Strict Mode double-invoked render never disposes
  // the provider it just created — only the real unmount does.
  useEffect(() => {
    const provider = providerRef.current
    return () => provider?.dispose()
  }, [])

  return providerRef.current
}
