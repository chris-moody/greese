import { breakpoints as defaults, type Breakpoint } from '@greese/ui'

let current: Record<string, number> = { ...defaults }
/** The keys of `current`, smallest value first. */
let keys: Breakpoint[] = Object.keys(current) as Breakpoint[]
const listeners = new Set<() => void>()

/** The breakpoint min-widths (px) in effect: the defaults unless configured. */
export const getBreakpoints = (): Readonly<Record<Breakpoint, number>> =>
  current as Record<Breakpoint, number>

/** The breakpoint keys in effect, smallest first (the defaults, plus any you added). */
export const getBreakpointKeys = (): readonly Breakpoint[] => keys

/**
 * The breakpoints the page's stylesheet was built with, from the custom
 * properties it declares (`--greese-breakpoint-keys`, then
 * `--greese-breakpoint-<key>`), or none without a document or the stylesheet.
 */
const fromStylesheet = (): Record<string, number> => {
  const found: Record<string, number> = {}
  if (typeof document != 'undefined') {
    const style = getComputedStyle(document.documentElement)
    const read = (name: string) => style.getPropertyValue('--greese-breakpoint-' + name)
    // `>= 0` leaves out what isn't a number (NaN), the empty key included.
    for (const key of read('keys').trim().split(/\s+/)) {
      const value = parseFloat(read(key))
      if (value >= 0) found[key] = value
    }
  }
  return found
}

/**
 * Use your own breakpoints in JS (useBreakpoint, useBreakpointValue,
 * Sidebar). Call once at startup, before rendering. With no argument, it
 * reads them from the stylesheet, which declares the ones it was built with,
 * so they can't disagree: `configureBreakpoints()` (load the CSS first). Or
 * pass the same values you compiled the SCSS with, added keys included:
 * `configureBreakpoints({ tablet: 700 })`. The keys xs/sm/md/lg/xl stay, and
 * `xs` is always 0. For TypeScript, add a new key to the `BreakpointKeys`
 * interface of `@greese/ui`.
 */
export const configureBreakpoints = (
  values: Partial<Record<Exclude<Breakpoint, 'xs'>, number>> &
    Record<string, number | undefined> = fromStylesheet()
): void => {
  const next: Record<string, number> = { ...current }
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) next[key] = value
  }
  next.xs = 0
  const ordered = Object.keys(next).sort((a, b) => next[a]! - next[b]!)
  const distinct = ordered.every(
    (key, i) => i === 0 || next[key]! > next[ordered[i - 1]!]!
  )
  if (!distinct) {
    throw new Error(
      `configureBreakpoints: every breakpoint needs its own value, above xs's 0, got ${JSON.stringify(next)}`
    )
  }
  const before = (Object.keys(defaults) as Breakpoint[]).map((key) => next[key]!)
  const inOrder = before.every((value, i) => i === 0 || value > before[i - 1]!)
  if (!inOrder) {
    throw new Error(
      `configureBreakpoints: values must increase from xs to xl, got ${JSON.stringify(next)}`
    )
  }
  current = next
  keys = ordered as Breakpoint[]
  listeners.forEach((listener) => listener())
}

/** Back to the defaults, added keys dropped (an editor that changes breakpoints live uses it). */
export const resetBreakpoints = (): void => {
  current = { ...defaults }
  keys = Object.keys(current) as Breakpoint[]
  listeners.forEach((listener) => listener())
}

/** Internal: lets caches (e.g. media query lists) reset when values change. */
export const onBreakpointsChange = (listener: () => void): void => {
  listeners.add(listener)
}
