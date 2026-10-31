/**
 * Page transitions' pure parts (ADR 0029): the view-transition classes a
 * `PageTransition` gives React, the CSS of its selector rules, the names of
 * shared elements and the transition types of a navigation. No React, so the
 * component stays a Server Component and these test on their own.
 */
import type { ViewTransitionClassPerType } from 'react'
import type { BuiltInEffect } from '@greese/ui/effects'
import type { Ease } from '@greese/js'
import type { GreeseSequence } from '../../utils/greese.ts'
import { cssEase } from '../../utils/ease.ts'
import { hash } from '../../utils/share.ts'

export { shareClasses, shareName, type ShareKey } from '../../utils/share.ts'

/**
 * How one side of a page change plays: a built-in effect (an entrance for
 * `enter`, an exit for `exit`), `'theme'` for the motion theme's page roles,
 * or `'none'` to change without animating.
 */
export type PageEffect = BuiltInEffect | 'theme' | 'none'

/**
 * A live exit played by greese.js: a sequence for the whole page
 * (`'fadeOut(0.2),+0.1,scaleOut'`), or a timeline map, selector → sequence,
 * whose entries start together, each keeping its own pauses and overlaps. A
 * single effect of your own is written as a call: `'wobble()'`.
 */
export type PageTimeline = GreeseSequence | Record<string, GreeseSequence | BuiltInEffect>

/** Whether an exit is a timeline (played live by greese.js) rather than an effect (CSS). */
export const isTimeline = (exit: unknown): exit is PageTimeline =>
  typeof exit === 'object' || (typeof exit === 'string' && /[+,(]/.test(exit))

/** How a page change plays: the new page's entrance and the old page's exit. */
export interface PageMotion {
  /** How the new page arrives. @default 'theme' */
  enter?: PageEffect
  /** How the old page leaves. @default 'theme' */
  exit?: PageEffect
}

/**
 * A selector rule: `'still'` keeps the matched elements in place (a header
 * the change leaves alone), or their own effects and pace.
 */
export type PageRule =
  | 'still'
  | (PageMotion & {
      /** Seconds, or a duration token. */
      duration?: number | 'fast' | 'normal' | 'slow'
      /** Seconds before they play. */
      delay?: number
      /** Any ease CSS can play (a named ease or a cubic Bézier). */
      ease?: Ease
    })

/**
 * How a page change plays when one route rule matches (ADR 0029, routes and
 * navigations): a page's `to` and `from` rules, and a navigation's own options.
 */
export type PageRouteRule = PageMotion & {
  /** Seconds, or a duration token. */
  duration?: number | 'fast' | 'normal' | 'slow'
  /** Any ease CSS can play (a named ease or a cubic Bézier). */
  ease?: Ease
  /** Whether the page being left leaves live or as a snapshot. */
  mode?: 'snapshot' | 'live'
  /** What changes going back (in the history, or up the URL). */
  back?: PageMotion
}

/**
 * A route's page transitions, by the path at the other end. Patterns are
 * `/settings`, `/user/:id`, a middle `*` (one segment), `/settings/*` (the page and
 * everything below it) and `*`.
 */
export interface PageRoute {
  /** Leaving this page for a matching path. */
  to?: Record<string, PageRouteRule>
  /** Arriving at this page from a matching path. */
  from?: Record<string, PageRouteRule>
}

/** Every greese navigation's type; the direction types say which way it went. */
export const PAGE = 'greese-page'
export const FORWARD = 'greese-forward'
export const BACK = 'greese-back'
export const REPLACE = 'greese-replace'
/** A page that left live: its exit has played, so no snapshot plays over it. */
export const LIVE = 'greese-live'

const BASE = 'greese-PageTransition'

/**
 * An effect's class-name form (`fadeUp` → `fade-up`), as effect-classes'
 * `effectClass`, whose module would bring every effect's name with it.
 */
const effectClass = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

/**
 * The view-transition classes for one direction: the theme's class where a
 * side follows the theme, an effect's class where it names one. `'none'`
 * when neither side animates, which React reads as "don't name it".
 */
export const pageClasses = (
  { enter = 'theme', exit = 'theme' }: PageMotion,
  back = false
): string => {
  if (enter === 'none' && exit === 'none') return 'none'
  const classes = [BASE]
  if (enter === 'theme' || exit === 'theme')
    classes.push(`${BASE}--theme${back ? '-back' : ''}`)
  if (enter !== 'theme') classes.push(`${BASE}--enter-${effectClass(enter)}`)
  if (exit !== 'theme') classes.push(`${BASE}--exit-${effectClass(exit)}`)
  return classes.join(' ')
}

/**
 * A whole page's classes, not a rule's part: its snapshots show only the
 * screenful in view (`--page`).
 */
const whole = (classes: string) =>
  classes === 'none' ? 'none' : `${classes} ${BASE}--page`

/**
 * The class map for React's `<ViewTransition>`, by transition type. Only a
 * greese navigation's direction types animate: anything else that updates
 * the page in a transition (a tab kept in the URL, a filter) changes it in
 * place. React joins the classes of every active type it finds, so each
 * navigation carries exactly one direction type. A page that left live adds
 * `--left` to its direction's classes: the new page still arrives, and what
 * the exit left of the old one fades beneath it.
 */
export const pageClassMap = (
  motion: PageMotion,
  back?: PageMotion,
  types: Record<string, PageMotion | 'none'> = {}
): ViewTransitionClassPerType => ({
  [FORWARD]: whole(pageClasses(motion)),
  [BACK]: whole(pageClasses({ ...motion, ...back }, true)),
  [LIVE]: `${BASE}--left`,
  [ROUTE_ENTER]: `${BASE}--route-enter`,
  [ROUTE_EXIT]: `${BASE}--route-exit`,
  [ROUTE_PACE]: `${BASE}--route-pace`,
  ...Object.fromEntries(
    Object.entries(types).map(([type, m]) => [
      type,
      m === 'none' ? 'none' : whole(pageClasses(m)),
    ])
  ),
  default: 'none',
})

/** The rules' id: their classes' prefix, and the key React hoists their `<style>` by. */
export const pageRulesId = (rules: Record<string, PageRule>): string =>
  `greese-page-${hash(JSON.stringify(rules))}`

const duration = (value: NonNullable<Exclude<PageRule, 'still'>['duration']>) =>
  typeof value === 'number' ? `${value}s` : `var(--greese-duration-${value})`

/**
 * Selector rules as CSS (the kit's `page-transitions()` writes the same for a
 * theme): the matched elements are named only while a greese page change
 * runs, so other view transitions never capture them, and each rule's pace
 * is a class of its own. Selectors are the app's own code, never user input;
 * one that could close the `<style>` it's written into is refused.
 */
export const pageRulesCss = (rules: Record<string, PageRule>): string => {
  const prefix = pageRulesId(rules)
  const css: string[] = []
  const paced: string[] = []
  Object.entries(rules).forEach(([selector, rule], i) => {
    if (/[<>{};]/.test(selector))
      throw new Error(
        `PageTransition: the rule selector \`${selector}\` isn't a selector.`
      )
    const own = `${prefix}-${i + 1}`
    const classes =
      rule === 'still'
        ? `${BASE} ${BASE}--still`
        : `${pageClasses(rule).replace(/^none$/, `${BASE} ${BASE}--enter-none ${BASE}--exit-none`)} ${own}`
    css.push(
      `:root:active-view-transition-type(${PAGE}) :is(${selector}) { view-transition-name: match-element; view-transition-class: ${classes}; }`
    )
    if (rule === 'still') return
    const pace = [
      rule.duration !== undefined && `animation-duration: ${duration(rule.duration)};`,
      rule.delay !== undefined && `animation-delay: ${rule.delay}s;`,
      rule.ease !== undefined &&
        cssEase(rule.ease) &&
        `animation-timing-function: ${cssEase(rule.ease)};`,
    ].filter(Boolean)
    if (pace.length)
      paced.push(
        `html::view-transition-old(*.${own}), html::view-transition-new(*.${own}) { ${pace.join(' ')} }`
      )
  })
  if (paced.length)
    css.push(`@media (prefers-reduced-motion: no-preference) { ${paced.join(' ')} }`)
  return `@layer greese.utilities { ${css.join(' ')} }`
}

export interface PageNavigateOptions {
  /** How the new page arrives on this navigation, over every route and the theme. */
  enter?: PageEffect
  /** How the old page leaves on this navigation, over every route and the theme. */
  exit?: PageEffect
  /** Seconds, or a duration token, for this navigation. */
  duration?: PageRouteRule['duration']
  /** The ease of this navigation. */
  ease?: Ease
  /** Replace the history entry: the page changes in place, without a transition. */
  replace?: boolean
  /** Force the direction: `'back'` plays the theme's back transition. */
  direction?: 'forward' | 'back'
  /** Types of your own, for a `PageTransition`'s `types`. */
  types?: readonly string[]
  /** How this navigation plays, over the page's and the theme's `mode`. */
  mode?: 'snapshot' | 'live'
}

const depth = (path: string) => path.split('/').filter(Boolean).length

/**
 * A navigation's transition types: `greese-page`, its direction
 * (`greese-forward`, `greese-back`, or `greese-replace`), and how it moved in
 * the URL (`greese-deeper`, `greese-shallower`, `greese-sibling`). Back is
 * going back in the history or up the URL. A change of hash or query alone
 * isn't a page change, and gets no types (only your own).
 */
export const pageTransitionTypes = (
  from: string,
  to: string | number,
  { replace, direction, types = [] }: PageNavigateOptions = {}
): string[] => {
  if (typeof to === 'number')
    return [PAGE, direction === 'forward' || to > 0 ? FORWARD : BACK, ...types]
  const before = new URL(from)
  const after = new URL(to, from)
  if (before.pathname === after.pathname) return [...types]
  const moved = Math.sign(depth(after.pathname) - depth(before.pathname))
  const way =
    moved > 0 ? 'greese-deeper' : moved < 0 ? 'greese-shallower' : 'greese-sibling'
  const dir = replace
    ? REPLACE
    : (direction ?? (moved < 0 ? 'back' : 'forward')) === 'back'
      ? BACK
      : FORWARD
  return [PAGE, dir, way, ...types]
}

/** Types of the sides a route or a navigation overrides, each only when it does. */
export const ROUTE_ENTER = 'greese-route-enter'
export const ROUTE_EXIT = 'greese-route-exit'
export const ROUTE_PACE = 'greese-route-pace'

/** The options of a navigation that shape its route. */
export type PageRouteOptions = Pick<
  PageNavigateOptions,
  'enter' | 'exit' | 'duration' | 'ease' | 'mode'
>

/** What a route and a navigation settle for one page change, ready for CSS. */
export interface ResolvedPageRoute {
  /** An entrance's keyframes name (`greese-wipe-left`), or `none`. */
  enter?: string
  /** An exit's keyframes name, or `none`. */
  exit?: string
  /** A CSS time. */
  duration?: string
  /** A CSS easing. */
  ease?: string
  /** How the old page leaves. */
  mode?: 'snapshot' | 'live'
}

/** The path without the app's base. */
export const stripBase = (path: string, base = ''): string =>
  base && path.startsWith(base) && !/[^/]/.test(path[base.length] ?? '/')
    ? path.slice(base.length) || '/'
    : path

/**
 * How well a pattern matches a path, or `undefined` when it doesn't: each
 * segment counts less than the one before (literal 3, `:param` or a middle
 * `*` 2, a trailing `*` 1), so the most specific pattern scores highest and
 * a longer one wins a tie. A trailing `*` takes the page itself and
 * everything below it.
 */
const score = (pattern: string, path: string): number | undefined => {
  if (/[?#]/.test(pattern))
    throw new Error(`usePageNavigate: \`${pattern}\` isn't a page pattern.`)
  const parts = pattern.split('/').filter(Boolean)
  const have = path.split('/').filter(Boolean)
  const tail = parts.at(-1) === '*'
  if (tail ? have.length < parts.length - 1 : have.length !== parts.length) return
  let total = 0
  for (const [i, part] of parts.entries()) {
    const w = part === '*' ? (i === parts.length - 1 ? 1 : 2) : part[0] === ':' ? 2 : 3
    if (w === 3 && part !== have[i]) return
    total += w / 4 ** i
  }
  return total
}

/** Whether a route pattern matches a path (a trailing slash is ignored). */
export const matchPagePath = (pattern: string, path: string): boolean =>
  score(pattern, path) !== undefined

/** The most specific rule matching the path; source order breaks a tie. */
export const matchPageRule = (
  rules: Record<string, PageRouteRule> | undefined,
  path: string
): PageRouteRule | undefined => {
  let best: PageRouteRule | undefined
  let top = -1
  for (const [pattern, rule] of Object.entries(rules ?? {})) {
    const s = score(pattern, path)
    if (s !== undefined && s > top) [best, top] = [rule, s]
  }
  return best
}

/** An effect as the keyframes it plays; `theme` and nothing leave the side alone. */
export const keyframes = (effect?: PageEffect) =>
  effect && (effect === 'none' ? effect : `greese-${effectClass(effect)}`)

const time = (value: NonNullable<PageRouteRule['duration']>) =>
  typeof value === 'number' ? `${value}s` : `var(--greese-duration-${value})`

/**
 * What a page change plays (ADR 0029): the leaving page's `to` rule for the
 * arriving path and the arriving page's `from` rule for the leaving one,
 * each side taken from its owner (the exit and `mode` from the leaving
 * page's rule first, the entrance from the arriving page's first), then the
 * navigation's own options over both. Paths come without the app's base.
 */
export const resolvePageRoute = (
  { from, to }: { from: PageRoute | undefined; to: PageRoute | undefined },
  fromPath: string,
  toPath: string | undefined,
  back = false,
  options: PageRouteOptions = {}
): ResolvedPageRoute => {
  // Going back merges the rule's `back` over it.
  const rule = (r: PageRouteRule | undefined) =>
    back && r?.back ? { ...r, ...r.back } : r
  const leaving = rule(toPath === undefined ? undefined : matchPageRule(from?.to, toPath))
  const arriving = rule(matchPageRule(to?.from, fromPath))
  // The first rule that names the side; `theme` names nothing.
  const first = <K extends keyof PageRouteRule>(
    key: K,
    ...rules: Array<PageRouteRule | undefined>
  ) =>
    rules.map((r) => r?.[key]).find((v) => v !== undefined && v !== 'theme') as
      PageRouteRule[K] | undefined
  const duration = first('duration', options, arriving, leaving)
  const ease = first('ease', options, arriving, leaving)
  return {
    enter: keyframes(first('enter', options, arriving, leaving)),
    exit: keyframes(first('exit', options, leaving, arriving)),
    duration: duration === undefined ? undefined : time(duration),
    ease: ease === undefined ? undefined : cssEase(ease),
    mode: first('mode', options, leaving, arriving),
  }
}

/** The types a resolved route adds: one for each part it overrides. */
export const routeTypes = ({
  enter,
  exit,
  duration,
  ease,
}: ResolvedPageRoute): string[] => [
  ...(enter ? [ROUTE_ENTER] : []),
  ...(exit ? [ROUTE_EXIT] : []),
  ...(duration || ease ? [ROUTE_PACE] : []),
]
