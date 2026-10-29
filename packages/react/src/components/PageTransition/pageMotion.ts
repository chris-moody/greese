/**
 * Page transitions' pure parts (ADR 0029): the view-transition classes a
 * `PageTransition` gives React, the CSS of its selector rules, the names of
 * shared elements and the transition types of a navigation. No React, so the
 * component stays a Server Component and these test on their own.
 */
import type { ViewTransitionClassPerType } from 'react'
import type { BuiltInEffect } from '@greese/ui/effects'
import type { Ease } from '@greese/js'
import { cssEase } from '../../utils/ease.ts'
import { hash } from '../../utils/share.ts'

export { shareClasses, shareName, type ShareKey } from '../../utils/share.ts'

/**
 * How one side of a page change plays: a built-in effect (an entrance for
 * `enter`, an exit for `exit`), `'theme'` for the motion theme's page roles,
 * or `'none'` to change without animating.
 */
export type PageEffect = BuiltInEffect | 'theme' | 'none'

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

/** Every greese navigation's type; the direction types say which way it went. */
export const PAGE = 'greese-page'
export const FORWARD = 'greese-forward'
export const BACK = 'greese-back'
export const REPLACE = 'greese-replace'

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
 * The class map for React's `<ViewTransition>`, by transition type. Only a
 * greese navigation's direction types animate: anything else that updates
 * the page in a transition (a tab kept in the URL, a filter) changes it in
 * place. React joins the classes of every active type it finds, so each
 * navigation carries exactly one direction type.
 */
export const pageClassMap = (
  motion: PageMotion,
  back?: PageMotion,
  types: Record<string, PageMotion | 'none'> = {}
): ViewTransitionClassPerType => ({
  [FORWARD]: pageClasses(motion),
  [BACK]: pageClasses({ ...motion, ...back }, true),
  ...Object.fromEntries(
    Object.entries(types).map(([type, m]) => [type, m === 'none' ? 'none' : pageClasses(m)])
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
      throw new Error(`PageTransition: the rule selector \`${selector}\` isn't a selector.`)
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
      rule.ease !== undefined && cssEase(rule.ease) && `animation-timing-function: ${cssEase(rule.ease)};`,
    ].filter(Boolean)
    if (pace.length)
      paced.push(
        `::view-transition-old(*.${own}), ::view-transition-new(*.${own}) { ${pace.join(' ')} }`
      )
  })
  if (paced.length)
    css.push(`@media (prefers-reduced-motion: no-preference) { ${paced.join(' ')} }`)
  return `@layer greese.utilities { ${css.join(' ')} }`
}

export interface PageNavigateOptions {
  /** Replace the history entry: the page changes in place, without a transition. */
  replace?: boolean
  /** Force the direction: `'back'` plays the theme's back transition. */
  direction?: 'forward' | 'back'
  /** Types of your own, for a `PageTransition`'s `types`. */
  types?: readonly string[]
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
  const way = moved > 0 ? 'greese-deeper' : moved < 0 ? 'greese-shallower' : 'greese-sibling'
  const dir = replace
    ? REPLACE
    : (direction ?? (moved < 0 ? 'back' : 'forward')) === 'back'
      ? BACK
      : FORWARD
  return [PAGE, dir, way, ...types]
}
