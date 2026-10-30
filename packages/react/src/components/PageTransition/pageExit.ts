/**
 * The live exit (ADR 0029, mode B): before a page change commits, the leaving
 * page's members play their exits on the real elements, one after another,
 * while the next page loads. usePageNavigate decides with it at the click
 * (transition types must be added before anything is awaited), so it's small
 * and loads with the hook. Like scopes, it only chooses: each member
 * gets an inline `animation` naming CSS keyframes (the exits' own, written by
 * @greese/ui's PageTransition stylesheet), so it needs no greese.js, and under
 * reduced motion, where those keyframes don't exist, nothing plays and the
 * page changes at once. Sequences and timeline maps go through the greese.js
 * runtime instead (greeseRuntime.ts, `playPageExit`).
 */

/** A page's live settings, written by `PageTransition` onto its start marker. */
export interface LivePage {
  mode?: 'auto' | 'snapshot' | 'live'
  /** The order members leave in. @default 'reverse' (the theme's `page-exit-order`) */
  order?: 'reverse' | 'document' | 'together'
  /** Seconds between members (the theme's `page-stagger`). */
  stagger?: number
  /** A sequence or a timeline map, played by greese.js instead of the members' exits. */
  timeline?: string | Record<string, string>
  /** The same, going back. */
  back?: string | Record<string, string>
}

/** A page `PageTransition` rendered: its settings and the elements between its markers. */
export interface PageRegion {
  config: LivePage
  start: Element
  end: Element
}

const START = 'template[data-greese-page]'

/** Elements with a greese entrance: a page's members, as a scope's are. */
export const MEMBER = '.greese-Motion--enter, .greese-Motion--view'

/** Between the markers, in document order. */
export const inside = ({ start, end }: PageRegion, el: Element) =>
  !!(start.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) &&
  !!(end.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING)

/**
 * The pages on screen, innermost first: a `PageTransition` inside another
 * (a page in a layout's) is the one that changes, so the outer one is left
 * out when an inner one is inside it.
 */
export const pagesOnScreen = (doc: Document = document): PageRegion[] => {
  const regions = [...doc.querySelectorAll<HTMLTemplateElement>(START)].flatMap((start) => {
    const end = start.parentElement?.querySelector(
      `template[data-greese-page-end="${start.dataset.greesePage ?? ''}"]`
    )
    const config = JSON.parse(start.dataset.greeseConfig ?? '{}') as LivePage
    return end ? [{ config, start, end }] : []
  })
  return regions.filter(
    (outer) => !regions.some((inner) => inner !== outer && inside(outer, inner.start))
  )
}

const onScreen = (el: Element) => {
  const r = el.getBoundingClientRect()
  return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && r.width > 0
}

/** A page's members on screen, outermost only (a member's own members leave with it). */
export const membersOf = (page: PageRegion): HTMLElement[] => {
  const parent = page.start.parentElement
  if (!parent) return []
  const all = [...parent.querySelectorAll<HTMLElement>(MEMBER)].filter((el) =>
    inside(page, el)
  )
  return all.filter(
    (el) => !all.some((other) => other !== el && other.contains(el)) && onScreen(el)
  )
}

/** The exit a member asked for itself (`greese={{ exit }}`), as its keyframes' name. */
const ownExit = (el: Element) => {
  for (const name of el.classList)
    if (name.startsWith('greese-Motion--exit-'))
      return `greese-${name.slice('greese-Motion--exit-'.length)}`
  return undefined
}

/** The theme's exit role for the direction, as a `var()` animation-name. */
const roleExit = (back: boolean) =>
  back
    ? 'var(--greese-motion-page-back-exit, var(--greese-motion-page-exit, greese-fade-out))'
    : 'var(--greese-motion-page-exit, greese-fade-out)'

/** The longest an exit holds a navigation, whatever its animations say. */
export const EXIT_CAP = 2000

/**
 * Plays a page's members' exits and resolves when they're over (or after
 * `EXIT_CAP`). Order: `reverse` (the last member leaves first, so the page
 * empties back towards its top), `document`, or `together`. Returns the
 * promise and a way to put the members back, for a navigation that fails.
 */
export const exitPage = (
  page: PageRegion,
  back: boolean,
  order = page.config.order ?? 'reverse',
  stagger = page.config.stagger
): { done: Promise<void>; restore: () => void } => {
  const members = membersOf(page)
  if (order === 'reverse') members.reverse()
  const gap =
    stagger !== undefined
      ? `${stagger}s`
      : 'var(--greese-motion-page-stagger, var(--greese-motion-stagger, 0.05s))'
  members.forEach((el, i) => {
    const delay = order === 'together' ? '0s' : `calc(${i} * ${gap})`
    el.style.animation = `${ownExit(el) ?? roleExit(back)} var(--greese-motion-page-duration, var(--greese-duration-normal)) var(--greese-motion-page-ease, var(--greese-ease-out)) ${delay} both`
  })
  // Reading the animations applies the styles just set, in one pass.
  const animations = members.flatMap((el) => el.getAnimations?.() ?? [])
  let timer: ReturnType<typeof setTimeout> | undefined
  const done = Promise.race([
    Promise.all(animations.map((a) => a.finished.catch(() => {}))),
    new Promise((resolve) => (timer = setTimeout(resolve, EXIT_CAP))),
  ]).then(() => clearTimeout(timer))
  return {
    done,
    restore: () => members.forEach((el) => el.style.removeProperty('animation')),
  }
}

/**
 * Whether a page leaves live: its own mode, else the theme's `page-mode`,
 * else `auto`, which is live when it has a timeline to play or members on
 * screen to leave, and a snapshot otherwise.
 */
export const leavesLive = (page: PageRegion, theme: string, back = false): boolean => {
  const mode =
    page.config.mode && page.config.mode !== 'auto' ? page.config.mode : theme || 'auto'
  if (mode === 'live') return true
  if (mode === 'snapshot') return false
  return timelineOf(page, back) !== undefined || membersOf(page).length > 0
}

/** The timeline a page leaves with in a direction, if it has one. */
export const timelineOf = (page: PageRegion, back: boolean) =>
  (back && page.config.back) || page.config.timeline

/** The page's own elements: the siblings between its markers. */
export const elementsOf = ({ start, end }: PageRegion): Element[] => {
  const els: Element[] = []
  for (let el = start.nextElementSibling; el && el !== end; el = el.nextElementSibling)
    if (el.tagName !== 'STYLE') els.push(el)
  return els
}

/** A selector's matches in the page, for a timeline map. */
export const query = (page: PageRegion, selector: string): Element[] =>
  [...(page.start.parentElement?.querySelectorAll(selector) ?? [])].filter((el) =>
    inside(page, el)
  )
