import { useId, ViewTransition, type JSX, type ReactNode } from 'react'
import type { LivePage } from './pageExit.ts'
import {
  isTimeline,
  pageClassMap,
  pageRulesCss,
  pageRulesId,
  type PageEffect,
  type PageMotion,
  type PageRule,
  type PageTimeline,
} from './pageMotion.ts'

export {
  pageClasses,
  pageClassMap,
  pageRulesCss,
  pageRulesId,
  pageTransitionTypes,
  matchPagePath,
  resolvePageRoute,
  shareClasses,
  shareName,
  type PageEffect,
  type ShareKey,
  type PageMotion,
  type PageNavigateOptions,
  type PageRoute,
  type PageRouteRule,
  type PageRule,
  type ResolvedPageRoute,
} from './pageMotion.ts'

export interface PageTransitionProps {
  /** How the new page arrives. @default 'theme' */
  enter?: PageEffect
  /**
   * How the old page leaves: an effect (played on its snapshot, or on its
   * members when it leaves live), or a timeline, a sequence or a map of
   * selector → sequence, which greese.js plays on the live page.
   * @default 'theme'
   */
  exit?: PageEffect | PageTimeline
  /** The page: a router's outlet, or the routes themselves. */
  children?: ReactNode
  /**
   * Going back (in the history, or up the URL): what changes from `enter` and
   * `exit`. Where a side follows the theme, it plays the theme's back roles.
   */
  back?: { enter?: PageEffect; exit?: PageEffect | PageTimeline }
  /**
   * Transition types of your own (added with `usePageNavigate`'s `types`, or
   * React's `addTransitionType`): how each plays, or `'none'`.
   */
  types?: Record<string, PageMotion | 'none'>
  /**
   * Parts of the page with motion of their own, by selector: `'still'` keeps
   * them in place (a header the change leaves alone), or their own `enter`,
   * `exit`, `duration`, `delay` and `ease`. Each match is a snapshot of its
   * own, so name sections, not every item of a long list.
   */
  rules?: Record<string, PageRule>
  /**
   * The boundary's view-transition name, for one `PageTransition` inside
   * another (a layout's and a page's).
   * @default 'auto'
   */
  name?: string
  /**
   * `snapshot`: the browser animates images of both pages. `live`: the old
   * page's members (its elements with greese entrances) play their exits on
   * the real page, one after another, while the next page loads; then the new
   * page arrives as in a snapshot, over what the exit left of the old one. `auto` leaves live when the page has members on
   * screen or a timeline, and as a snapshot otherwise. The theme's
   * `page-mode` decides when this doesn't.
   * @default 'auto'
   */
  mode?: 'auto' | 'snapshot' | 'live'
  /**
   * The order a live page's members leave in: `reverse` (the last first, so
   * the page empties back towards its top), `document` or `together`.
   * @default 'reverse'
   */
  order?: 'reverse' | 'document' | 'together'
  /** Seconds between a live page's members (the theme's `page-stagger`). */
  stagger?: number
}

/**
 * Animates page changes (ADR 0029): the old page leaves and the new one
 * arrives, played by the browser on snapshots of both, with greese's effects.
 * Put it around a router's outlet, and navigate with `usePageNavigate`, which
 * says which way a navigation goes. Anything else that updates the page (a
 * tab kept in the URL) changes it in place. Without a motion theme it's a
 * cross-fade; under reduced motion, and where the browser has no view
 * transitions (or React is older than 19.3), the page simply changes.
 *
 * A Server Component: everything it takes is data.
 *
 * ```tsx
 * <PageTransition back={{ enter: 'slideRight', exit: 'fadeOut' }} rules={{ 'header, footer': 'still' }}>
 *   <Outlet />
 * </PageTransition>
 * ```
 */
export const PageTransition = ({
  children,
  enter,
  exit,
  back,
  types,
  rules,
  name,
  mode,
  order,
  stagger,
}: PageTransitionProps): JSX.Element => {
  const id = useId()
  // The entrances play the effects' own keyframes, which come with the
  // greese-Motion stylesheet: naming it here makes this component's
  // stylesheet (css/PageTransition.css) import it.
  const rulesStyle = rules && Object.keys(rules).length > 0 && (
    // React hoists it into <head> once, however many pages render it.
    <style href={pageRulesId(rules)} precedence="greese">
      {pageRulesCss(rules)}
    </style>
  )
  // What usePageNavigate needs to make the page leave live: data on a marker,
  // since a Server Component has no context to share it through. Two empty
  // templates mark where the page starts and ends; they draw nothing and
  // wrap nothing, so the page's own layout and selectors are untouched.
  const live: LivePage = {
    mode,
    order,
    stagger,
    timeline: isTimeline(exit) ? exit : undefined,
    back: isTimeline(back?.exit) ? back.exit : undefined,
  }
  const snapshot: PageMotion = { enter, exit: isTimeline(exit) ? undefined : exit }
  const snapshotBack: PageMotion | undefined = back && {
    enter: back.enter,
    exit: isTimeline(back.exit) ? undefined : back.exit,
  }
  const page = ViewTransition ? (
    <ViewTransition name={name} default={pageClassMap(snapshot, snapshotBack, types)}>
      {children}
    </ViewTransition>
  ) : (
    // React before 19.3 has no ViewTransition: the page changes as before.
    children
  )
  return (
    <>
      <template data-greese-page={id} data-greese-config={JSON.stringify(live)} />
      {rulesStyle}
      {page}
      <template data-greese-page-end={id} />
    </>
  )
}
