'use client'
import { useSyncExternalStore } from 'react'
import { breakpointKeys, type Breakpoint } from '@sauce-ui/tokens'
import { getBreakpoints, onBreakpointsChange } from '../utils/breakpoints.ts'
import type { Responsive } from '../utils/responsive.ts'

/** Same queries as the SCSS `up()` mixin, so JS and CSS agree on boundaries. */
const query = (bp: Breakpoint): string => `(min-width: ${getBreakpoints()[bp]}px)`

let lists: Array<[Breakpoint, MediaQueryList]> | undefined
onBreakpointsChange(() => {
  lists = undefined
})
const getLists = (): Array<[Breakpoint, MediaQueryList]> =>
  (lists ??= breakpointKeys
    .filter((bp) => getBreakpoints()[bp] > 0)
    .map((bp) => [bp, window.matchMedia(query(bp))]))

const subscribe = (onChange: () => void): (() => void) => {
  const all = getLists()
  all.forEach(([, list]) => list.addEventListener('change', onChange))
  return () => all.forEach(([, list]) => list.removeEventListener('change', onChange))
}

const getSnapshot = (): Breakpoint => {
  let current: Breakpoint = 'xs'
  for (const [bp, list] of getLists()) if (list.matches) current = bp
  return current
}

export interface UseBreakpointOptions {
  /**
   * Breakpoint assumed during SSR and hydration. Mobile-first, so `xs` unless
   * you know better (e.g. from a user-agent hint).
   * @default 'xs'
   */
  ssrBreakpoint?: Breakpoint
}

/** The largest breakpoint whose `min-width` the viewport meets. */
export const useBreakpoint = ({
  ssrBreakpoint = 'xs',
}: UseBreakpointOptions = {}): Breakpoint =>
  useSyncExternalStore(subscribe, getSnapshot, () => ssrBreakpoint)

/**
 * Resolves a responsive value for the current viewport, falling back to the
 * nearest smaller breakpoint that sets one: the same rule CSS applies.
 *
 * ```ts
 * const columns = useBreakpointValue({ xs: 1, md: 3 }) // 1 below md, 3 from md
 * ```
 */
export const useBreakpointValue = <T>(
  value: Responsive<T>,
  options?: UseBreakpointOptions
): T | undefined => {
  const current = useBreakpoint(options)
  return resolveAt(value, current)
}

/** Pure core of useBreakpointValue, exported for tests and non-hook callers. */
export const resolveAt = <T>(value: Responsive<T>, bp: Breakpoint): T | undefined => {
  if (typeof value !== 'object' || value === null) return value
  const perBp = value as Partial<Record<Breakpoint, T>>
  for (let i = breakpointKeys.indexOf(bp); i >= 0; i--) {
    const v = perBp[breakpointKeys[i]!]
    if (v !== undefined) return v
  }
  return undefined
}
