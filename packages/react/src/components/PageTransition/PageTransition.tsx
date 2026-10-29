import { ViewTransition, type JSX, type ReactNode } from 'react'
import {
  pageClassMap,
  pageRulesCss,
  pageRulesId,
  type PageMotion,
  type PageRule,
} from './pageMotion.ts'

export {
  pageClasses,
  pageClassMap,
  pageRulesCss,
  pageRulesId,
  pageTransitionTypes,
  shareClasses,
  shareName,
  type PageEffect,
  type ShareKey,
  type PageMotion,
  type PageNavigateOptions,
  type PageRule,
} from './pageMotion.ts'

export interface PageTransitionProps extends PageMotion {
  /** The page: a router's outlet, or the routes themselves. */
  children?: ReactNode
  /**
   * Going back (in the history, or up the URL): what changes from `enter` and
   * `exit`. Where a side follows the theme, it plays the theme's back roles.
   */
  back?: PageMotion
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
}: PageTransitionProps): JSX.Element => {
  // The entrances play the effects' own keyframes, which come with the
  // greese-Motion stylesheet: naming it here makes this component's
  // stylesheet (css/PageTransition.css) import it.
  const rulesStyle = rules && Object.keys(rules).length > 0 && (
    // React hoists it into <head> once, however many pages render it.
    <style href={pageRulesId(rules)} precedence="greese">
      {pageRulesCss(rules)}
    </style>
  )
  // React before 19.3 has no ViewTransition: the page changes as before.
  if (!ViewTransition)
    return (
      <>
        {rulesStyle}
        {children}
      </>
    )
  return (
    <>
      {rulesStyle}
      <ViewTransition name={name} default={pageClassMap({ enter, exit }, back, types)}>
        {children}
      </ViewTransition>
    </>
  )
}
