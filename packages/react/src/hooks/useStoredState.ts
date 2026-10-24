'use client'
import { useMemo, useSyncExternalStore } from 'react'
import { createStoredValue, type StoredValueOptions } from '@greese/ui'

/** What `useStoredState` returns: the value, a setter, and a way to forget it. */
export type StoredState<T> = [
  value: T,
  setValue: (value: T | ((current: T) => T)) => void,
  remove: () => void,
]

/**
 * State kept in localStorage (or sessionStorage), shared by every component
 * that reads the same key and kept in step with other tabs. Safe where
 * storage isn't: on the server it renders the fallback, and where storage is
 * blocked or full the value still works for the page view. Built on
 * `createStoredValue()` from @greese/ui, which code outside React can use.
 *
 * The fallback and options are read when the key is first used: pass the
 * same ones every render.
 *
 * ```tsx
 * const [layout, setLayout] = useStoredState<'grid' | 'list'>('photos-layout', 'grid')
 * ```
 */
export const useStoredState = <T,>(
  key: string,
  fallback: T,
  options?: StoredValueOptions<T>
): StoredState<T> => {
  const area = options?.area
  // One handle per key and area: its cache keeps the value's identity stable.
  const stored = useMemo(() => createStoredValue(key, fallback, options), [key, area])
  const value = useSyncExternalStore(stored.subscribe, stored.get, () => fallback)
  return [value, stored.set, stored.remove]
}
