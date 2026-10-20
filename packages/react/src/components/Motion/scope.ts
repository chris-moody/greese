/**
 * Scopes: a parent that sets when the entrances inside it start. Nothing here
 * animates: it only chooses each member's start time, as `--greese-motion-scope`,
 * and the CSS entrances (Motion.scss) play from there, so a scope needs no
 * greese.js and reduced motion needs no extra handling.
 */
import type { GreeseOptions, GreeseScope } from '../../utils/greese.ts'

/** Seconds between members when a scope doesn't say. */
export const SCOPE_STAGGER = 0.08

/** Elements whose entrance a scope orders: their own `enter`, played by CSS. */
const MEMBER = '.greese-Motion--enter'
const SCOPE = '.greese-Motion--scope'

export interface ScopeItem {
  el: HTMLElement
  scope: boolean | GreeseScope
}

export const scopeOptions = (scope: boolean | GreeseScope) =>
  typeof scope === 'object' ? scope : {}

/** The nearest scope above `el` (not `el` itself), if any. */
const owner = (el: Element): Element | null => el.parentElement?.closest(SCOPE) ?? null

/**
 * Orders every scope's members in document order, across any depth: the
 * member at position `n` starts `delay + n × stagger` seconds in, after the
 * scope's own start. A scope inside another takes one position in it and its
 * members start relative to that, so a section's contents play as one block
 * in the page's sequence. Outer scopes are handled first, so an inner one
 * already knows where it starts.
 *
 * Reads and writes only attributes and custom properties, never layout, so it
 * runs before the entrances' first frame.
 */
export const applyScopes = (items: readonly ScopeItem[]): void => {
  const ordered = [...items].sort((a, b) =>
    a.el === b.el
      ? 0
      : a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING
        ? -1
        : 1
  )
  const start = new Map<Element, number>()
  for (const { el, scope } of ordered) {
    const { stagger = SCOPE_STAGGER, delay = 0 } = scopeOptions(scope)
    const base = start.get(el) ?? 0
    let slot = 0
    // Members and nested scopes, in document order; the scope's own element
    // is skipped (its entrance, if any, is its own).
    for (const node of el.querySelectorAll<HTMLElement>(`${MEMBER}, ${SCOPE}`)) {
      if (node.classList.contains('greese-Motion--view') || owner(node) !== el) continue
      // Rounded to the millisecond: 0.1 + 2 × 0.1 isn't 0.3 in floating point.
      const at = Math.round((base + delay + slot * stagger) * 1000) / 1000
      slot++
      if (node.matches(SCOPE)) start.set(node, at)
      if (node.matches(MEMBER)) node.style.setProperty('--greese-motion-scope', `${at}s`)
    }
  }
}

/** Forgets what `applyScopes` set, when a scope goes away. */
export const clearScope = (el: HTMLElement): void => {
  for (const node of el.querySelectorAll<HTMLElement>(MEMBER)) {
    if (owner(node) === el) node.style.removeProperty('--greese-motion-scope')
  }
}

/**
 * Holds a scope's members until it scrolls into view, then lets them play. A
 * scope already in view isn't held. Returns the way to stop.
 */
export const holdUntilVisible = (el: HTMLElement, inViewport: boolean): (() => void) => {
  if (inViewport) return () => {}
  el.dataset.greeseScope = 'pending'
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return
      delete el.dataset.greeseScope
      observer.disconnect()
    },
    { threshold: 0.1 }
  )
  observer.observe(el)
  return () => {
    observer.disconnect()
    delete el.dataset.greeseScope
  }
}

/** Above the fold right now? Then holding a scope would only flash it. */
const inViewport = (el: Element): boolean => {
  const r = el.getBoundingClientRect()
  return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth
}

/**
 * The lazy half of the `scope` option (see the island): orders the scopes,
 * then releases their entrances, which the island held at their first frame
 * (`data-greese-scope='pending'`) until the start times were set. A scope that
 * waits for the viewport (`inView`) stays held until it scrolls in. The
 * cleanup of each goes on its `detach`.
 */
export const attachScopes = (
  items: Array<{ el: HTMLElement; options: GreeseOptions; detach?: () => void }>
): void => {
  applyScopes(items.map(({ el, options }) => ({ el, scope: options.scope! })))
  for (const item of items) {
    const { el } = item
    const wait = scopeOptions(item.options.scope!).inView
    const stop = wait ? holdUntilVisible(el, inViewport(el)) : () => {}
    if (!wait) delete el.dataset.greeseScope
    const detach = item.detach
    item.detach = () => {
      stop()
      clearScope(el)
      delete el.dataset.greeseScope
      detach?.()
    }
  }
}
