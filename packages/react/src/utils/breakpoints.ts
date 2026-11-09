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
  responsiveKeys = [...keys, ...containerKeys()]
  listeners.forEach((listener) => listener())
}

/**
 * Back to the defaults, added keys dropped (an editor that changes breakpoints
 * live uses it). Container breakpoints stay: a library added them.
 */
export const resetBreakpoints = (): void => {
  current = { ...defaults }
  keys = Object.keys(current) as Breakpoint[]
  responsiveKeys = [...keys, ...containerKeys()]
  listeners.forEach((listener) => listener())
}

let container: Record<string, number> = {}
/** Every key `resolveResponsive()` writes classes for: the viewport's, then the containers'. */
let responsiveKeys: readonly Breakpoint[] = keys

/**
 * Breakpoints measured against a container rather than the viewport, which a
 * library adds with stylesheet rules of its own (`pkg:@greese/ui/scss/breakpoints`):
 * `resolveResponsive()` writes their classes, so a prop takes them beside the
 * viewport's (`size={{ xs: 12, panelmd: 6 }}`), while `useBreakpoint()` and
 * `useBreakpointValue()`, which follow the viewport, leave them out. Keys are
 * one word, never a viewport breakpoint's, and each needs its own value. Adding
 * a key again changes its value. For TypeScript, add the keys to
 * `BreakpointKeys` as for any added breakpoint.
 *
 * ```ts
 * addContainerBreakpoints({ panelsm: 240, panelmd: 360 })
 * ```
 */
export const addContainerBreakpoints = (values: Record<string, number>): void => {
  const next = { ...container, ...values }
  const ordered = Object.keys(next).sort((a, b) => next[a]! - next[b]!)
  if (
    ordered.some(
      (key, i) =>
        Object.hasOwn(current, key) ||
        !/^\w+$/.test(key) ||
        next[key] === next[ordered[i - 1]!]
    )
  )
    throw new Error(
      `addContainerBreakpoints: each key is one word, not a viewport breakpoint, with its own value; got ${JSON.stringify(next)}`
    )
  container = next
  responsiveKeys = [...keys, ...(ordered as Breakpoint[])]
}

/** The container breakpoints added, by key: min-widths in px. */
export const getContainerBreakpoints = (): Readonly<Record<string, number>> => container

/** Internal: the keys a responsive prop's classes are written for, viewport first. */
export const getResponsiveKeys = (): readonly Breakpoint[] => responsiveKeys

const containerKeys = () =>
  Object.keys(container).sort((a, b) => container[a]! - container[b]!) as Breakpoint[]

/** Internal: lets caches (e.g. media query lists) reset when values change. */
export const onBreakpointsChange = (listener: () => void): void => {
  listeners.add(listener)
}
