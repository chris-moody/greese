import {
  breakpoints as defaults,
  breakpointKeys,
  type Breakpoint,
} from '@sauce-ui/tokens'

let current: Record<Breakpoint, number> = { ...defaults }
const listeners = new Set<() => void>()

/** The breakpoint min-widths (px) in effect: the defaults unless configured. */
export const getBreakpoints = (): Readonly<Record<Breakpoint, number>> => current

/**
 * Use your own breakpoint values in JS (useBreakpoint, useBreakpointValue,
 * Sidebar). Call once at startup, before rendering, with the same values you
 * compiled the SCSS with (`@use 'pkg:@sauce-ui/react/scss' with ($breakpoints: …)`).
 * The keys stay xs/sm/md/lg/xl; `xs` is always 0.
 */
export const configureBreakpoints = (
  values: Partial<Omit<Record<Breakpoint, number>, 'xs'>>
): void => {
  const next = { ...current, ...values, xs: 0 }
  const ordered = breakpointKeys.every(
    (bp, i) => i === 0 || next[bp] > next[breakpointKeys[i - 1]!]
  )
  if (!ordered) {
    throw new Error(
      `configureBreakpoints: values must increase from xs to xl, got ${JSON.stringify(next)}`
    )
  }
  current = next
  listeners.forEach((listener) => listener())
}

/** Internal: lets caches (e.g. media query lists) reset when values change. */
export const onBreakpointsChange = (listener: () => void): void => {
  listeners.add(listener)
}
