'use client'
import { useCallback, useSyncExternalStore } from 'react'
import {
  createStoredValue,
  DEFAULT_SCHEME_STORAGE_KEY,
  SCHEME_ATTR,
  type ColorScheme,
} from '@greese/ui'
import { useMediaQuery } from './useMediaQuery.ts'

// The source of truth is the attribute on <html>: the pre-paint script, this
// hook and any other code all read and write the same place.
const subscribe = (onChange: () => void): (() => void) => {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [SCHEME_ATTR],
  })
  return () => observer.disconnect()
}

const getSnapshot = (): ColorScheme => {
  const value = document.documentElement.getAttribute(SCHEME_ATTR)
  return value === 'light' || value === 'dark' ? value : 'system'
}

export interface UseColorSchemeOptions {
  /** localStorage key for the user's choice. Must match getSchemeScript's. */
  storageKey?: string
}

export interface UseColorSchemeResult {
  /** The user's choice. */
  scheme: ColorScheme
  /** What is actually showing: `system` resolved against the OS. */
  resolvedScheme: 'light' | 'dark'
  /** Applies and persists a choice: one attribute write, no re-styling in JS. */
  setScheme: (scheme: ColorScheme) => void
}

/**
 * The page-wide color scheme, set on `<html>` and persisted to localStorage.
 * Pair with `getSchemeScript()` in `<head>` so a saved choice applies before
 * first paint. For a section of the page, use `<ThemeProvider scheme>`.
 */
export const useColorScheme = ({
  storageKey = DEFAULT_SCHEME_STORAGE_KEY,
}: UseColorSchemeOptions = {}): UseColorSchemeResult => {
  const scheme = useSyncExternalStore(subscribe, getSnapshot, () => 'system' as const)
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')

  const setScheme = useCallback(
    (next: ColorScheme) => {
      const root = document.documentElement
      if (next === 'system') root.removeAttribute(SCHEME_ATTR)
      else root.setAttribute(SCHEME_ATTR, next)
      // Plain text, not JSON: getSchemeScript() reads it before first paint.
      // Where storage is unavailable, the choice still applies for the page view.
      const stored = createStoredValue<ColorScheme>(storageKey, 'system', {
        serialize: String,
        parse: (text) => text,
      })
      if (next === 'system') stored.remove()
      else stored.set(next)
    },
    [storageKey]
  )

  return {
    scheme,
    resolvedScheme: scheme === 'system' ? (prefersDark ? 'dark' : 'light') : scheme,
    setScheme,
  }
}
