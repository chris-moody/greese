'use client'
import {
  addTransitionType,
  startTransition,
  useEffect,
  useMemo,
  type MouseEvent,
} from 'react'
import { loadGreeseRuntime } from '../components/Motion/registry.ts'
import {
  elementsOf,
  exitPage,
  leavesLive,
  pagesOnScreen,
  query,
  timelineOf,
  type PageRegion,
} from '../components/PageTransition/pageExit.ts'
import {
  BACK,
  LIVE,
  PAGE,
  pageTransitionTypes,
  type PageNavigateOptions,
} from '../components/PageTransition/pageMotion.ts'
import { pairByLink } from '../components/PageTransition/shareLink.ts'

/**
 * Plays a page's live exit: its timeline through greese.js (a lazy chunk),
 * or its members' exits in CSS. Returns when it's over, and how to undo it.
 */
const leave = (page: PageRegion, back: boolean) => {
  const timeline = timelineOf(page, back)
  if (!timeline)
    return exitPage(page, back, page.config.order ?? themeOrder())
  let cancel = () => {}
  const done = loadGreeseRuntime().then((runtime) => {
    const played = runtime.playPageExit(timeline, elementsOf(page), (s) => query(page, s))
    cancel = played.cancel
    return played.done
  })
  return { done, restore: () => cancel() }
}

/**
 * After the new page has committed (it follows the exit's end by a task or
 * so; two frames are past it): the exit's styles come off. React keeps an
 * element that's in the same place on both pages, and without this it would
 * keep the exit's last frame, hidden; with its exit gone, its own entrance
 * plays again, as a new element's would.
 */
const afterCommit = (fn: () => void) => requestAnimationFrame(() => requestAnimationFrame(fn))

/** A theme role that decides something at the click, as the whole page has it. */
const role = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(`--greese-motion-${name}`).trim()

/** The theme's `page-mode`. */
const themeMode = () => role('page-mode')

/** The theme's `page-exit-order`, else `reverse`. */
const themeOrder = () =>
  (['reverse', 'document', 'together'] as const).find((o) => o === role('page-exit-order')) ??
  'reverse'

/**
 * Back and forward, held while a live page leaves: the Navigation API's
 * precommit handler keeps the old entry (and the old page) until the exit has
 * played, then the traversal commits and the router hears `popstate` as
 * usual. Only where the browser can defer a commit; elsewhere they change
 * the page at once. `focusReset: 'manual'`: intercepting mustn't move focus,
 * which a plain traversal never did.
 */
const holdTraversal = (event: Event) => {
  const e = event as NavigateEvent
  if (e.navigationType !== 'traverse' || !e.canIntercept || e.hashChange) return
  const current = navigation.currentEntry?.index ?? 0
  const back = e.destination.index < current
  const live = pagesOnScreen().filter((page) => leavesLive(page, themeMode(), back))
  if (!live.length) return
  e.intercept({
    focusReset: 'manual',
    precommitHandler: async () => {
      const exits = live.map((page) => leave(page, back))
      e.signal.addEventListener('abort', () => exits.forEach((exit) => exit.restore()))
      await Promise.all(exits.map((exit) => exit.done))
      afterCommit(() => exits.forEach((exit) => exit.restore()))
    },
  } as NavigationInterceptOptions)
}

/** Hook instances listening, so the one listener goes when the last does. */
let holding = 0

/**
 * Your router's navigate, by path: React Router's `useNavigate()`, Next.js's
 * `router.push`. Every router's takes this form; a history step
 * (`page.navigate(-1)`) goes to the browser's history instead, which routers
 * follow.
 */
export type RouterNavigate = (to: string, options?: { replace?: boolean }) => unknown

export interface PageNavigate {
  /**
   * Goes to `to` (or `-1`, back) as a page transition: the types a
   * `PageTransition` animates by (`greese-page`, its direction, how it moved
   * in the URL, and yours), then your router's navigate.
   */
  navigate: (to: string | number, options?: PageNavigateOptions) => void
  /**
   * A link's `onClick`, for your router's own link component: a plain click
   * goes through `navigate`; a modified click (a new tab) or a link elsewhere
   * is left to the browser.
   */
  onLinkClick: (
    to: string,
    options?: PageNavigateOptions
  ) => (event: MouseEvent<HTMLAnchorElement>) => void
}

/**
 * Navigates with page transitions (ADR 0029), with any router: give it your
 * router's navigate (React Router's `useNavigate()`, Next.js's
 * `router.push`). It adds the transition types inside an async transition
 * and awaits your navigate in it, so the router's own update joins the same
 * transition and `PageTransition` knows which way the page went. A page that
 * leaves live plays its exit first, while the router loads the next one.
 *
 * ```tsx
 * const page = usePageNavigate(useNavigate())
 * <Link to="/docs" onClick={page.onLinkClick('/docs')}>Docs</Link>
 * ```
 */
export const usePageNavigate = (navigate: RouterNavigate): PageNavigate => {
  useEffect(() => {
    if (!('navigation' in window && 'NavigationPrecommitController' in window)) return
    if (holding++ === 0) navigation.addEventListener('navigate', holdTraversal)
    return () => {
      if (--holding === 0) navigation.removeEventListener('navigate', holdTraversal)
    }
  }, [])
  return useMemo(() => {
    /** Navigates; `link` is the link followed, when one was. */
    const go = (to: string | number, options: PageNavigateOptions = {}, link?: Element) => {
      const types = pageTransitionTypes(location.href, to, options)
      const back = types.includes(BACK)
      // `<PageShare link>`: the old page's end is named now, before React's
      // snapshot of it; the new page's as it's inserted.
      if (types.includes(PAGE)) pairByLink(link ?? null, back)
      // Which pages leave live, decided now: the types must be added before
      // anything is awaited. The navigation's own mode, else each page's,
      // else the theme's `page-mode`.
      const theme = themeMode()
      const live = types.includes(PAGE)
        ? pagesOnScreen().filter((page) => leavesLive(page, options.mode ?? theme, back))
        : []
      if (live.length) types.push(LIVE)
      startTransition(async () => {
        for (const type of types) addTransitionType(type)
        // The router starts at once, so the next page loads while the old one
        // leaves; React commits the router's update with this transition,
        // once both are done.
        const navigation =
          typeof to === 'number' ? history.go(to) : navigate(to, { replace: options.replace })
        const exits = live.map((page) => leave(page, back))
        try {
          await Promise.all([navigation, ...exits.map((exit) => exit.done)])
        } finally {
          // A navigation that failed puts the page back at once; one that
          // succeeded, once the new page is in.
          afterCommit(() => exits.forEach((exit) => exit.restore()))
        }
      })
    }
    return {
      navigate: go,
      onLinkClick: (to, options) => (event) => {
        const link = event.currentTarget
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          (link.target && link.target !== '_self') ||
          link.hasAttribute('download') ||
          link.origin !== location.origin
        )
          return
        event.preventDefault()
        go(to, options, link)
      },
    }
  }, [navigate])
}
