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
 * Use your own breakpoints in JS (useBreakpoint, useBreakpointValue,
 * Sidebar). Call once at startup, before rendering, with the same values you
 * compiled the SCSS with (`@use 'pkg:@greese/ui/scss' with ($breakpoints: …)`),
 * added keys included: `configureBreakpoints({ tablet: 700 })`. The keys
 * xs/sm/md/lg/xl stay, and `xs` is always 0. For TypeScript, add a new key to
 * the `BreakpointKeys` interface of `@greese/ui`.
 */
export const configureBreakpoints = (
  values: Partial<Record<Exclude<Breakpoint, 'xs'>, number>> &
    Record<string, number | undefined>
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

/** Internal, for tests: back to the defaults, added keys dropped. */
export const resetBreakpoints = (): void => {
  current = { ...defaults }
  keys = Object.keys(current) as Breakpoint[]
  listeners.forEach((listener) => listener())
}

/** Internal: lets caches (e.g. media query lists) reset when values change. */
export const onBreakpointsChange = (listener: () => void): void => {
  listeners.add(listener)
}
