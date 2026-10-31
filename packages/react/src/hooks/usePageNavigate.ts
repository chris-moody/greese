'use client'
import {
  addTransitionType,
  startTransition,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from 'react'
import { loadGreeseRuntime } from '../components/Motion/registry.ts'
import {
  elementsOf,
  EXIT_CAP,
  exitPage,
  inside,
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
  REPLACE,
  resolvePageRoute,
  keyframes,
  routeTypes,
  stripBase,
  type PageNavigateOptions,
  type PageRoute,
  type ResolvedPageRoute,
} from '../components/PageTransition/pageMotion.ts'
import { pairByLink } from '../components/PageTransition/shareLink.ts'

/**
 * Plays a page's live exit: its timeline through greese.js (a lazy chunk),
 * or its members' exits in CSS. Returns when it's over, and how to undo it.
 */
const leave = (page: PageRegion, back: boolean, routed?: boolean, force?: string) => {
  // A route's or a navigation's exit beats the page's timeline (level 2).
  const timeline = routed ? undefined : timelineOf(page, back)
  if (!timeline)
    return exitPage(page, back, page.config.order ?? themeOrder(), undefined, force)
  let cancel = () => {}
  const done = loadGreeseRuntime().then((runtime) => {
    const played = runtime.playPageExit(timeline, elementsOf(page), (s) => query(page, s))
    cancel = played.cancel
    return played.done
  })
  return { done, restore: () => cancel() }
}

/**
 * Once the new page has committed: the exit's styles come off. React keeps an
 * element that's in the same place on both pages, and without this it would
 * keep the exit's last frame, hidden; with its exit gone, its own entrance
 * plays again, as a new element's would. The commit must be the new page's:
 * React commits when the next page has rendered, which can be seconds after
 * the exit ends, and members put back before it flash in on the old page.
 *
 * A navigation through `usePageNavigate` knows its commit from React (the
 * hook's own update, in the same transition as the router's). Back and
 * forward (and `navigate(-1)`) don't: the router hears `popstate`, outside
 * that transition, so the commit is seen in the DOM, here. A page change
 * removes what the old page had, or changes its text. The old page can still
 * grow and update while it leaves (a homepage that mounts its sections in
 * turn, clicked before it has; React re-rendering its inputs), and that isn't
 * the commit: what it adds, and anything inside it, doesn't count, nor any
 * attribute. A page that didn't change lets go after `EXIT_CAP`,
 * unless the URL has moved on from `from` (the page before): the router has
 * changed it and the commit is coming, however slowly the next page renders
 * (a slow phone, a dev server), up to `COMMIT_CAP`.
 * The observer's callback is a microtask after the commit, before the
 * browser's snapshot of the new page.
 */
const afterCommit = (pages: PageRegion[], from: string, fn: () => void) => {
  const grown = new Set<Node>()
  const isGrown = (node: Node) => [...grown].some((g) => g.contains(node))
  const observer = new MutationObserver((records) => {
    // What a batch adds first: a record inside an insertion can come before
    // the insertion's own.
    for (const r of records) r.addedNodes.forEach((node) => grown.add(node))
    for (const r of records) {
      if (isGrown(r.target)) continue
      // Text that changed, or something the old page had, removed.
      const changed =
        r.type === 'characterData' || [...r.removedNodes].some((node) => !isGrown(node))
      if (changed)
        for (const page of pages) {
          // A child of the markers' parent is between them if the node before it is.
          const at = r.target === page.start.parentElement ? r.previousSibling : r.target
          if (at && (at === page.start || inside(page, at as Element))) return finish()
        }
    }
  })
  const finish = () => {
    observer.disconnect()
    clearTimeout(timer)
    fn()
  }
  for (const { start } of pages)
    observer.observe(start.parentElement!, {
      subtree: true,
      childList: true,
      characterData: true,
    })
  const started = Date.now()
  const page = (href: string) => href.split('#')[0]
  const cap = () =>
    page(location.href) !== page(from) && Date.now() - started < COMMIT_CAP
      ? (timer = setTimeout(cap, EXIT_CAP))
      : finish()
  let timer = setTimeout(cap, EXIT_CAP)
}

/** The longest a moved URL waits for its page to commit. */
const COMMIT_CAP = 10_000

/**
 * How far the screen is into the leaving pages, for their snapshots, which
 * show only the screenful that was in view (`--greese-page-scrolled`). Read
 * before the snapshot is taken, so at the click.
 */
const measureScrolled = () => {
  const tops = pagesOnScreen().flatMap((page) =>
    elementsOf(page).map((el) => el.getBoundingClientRect().top)
  )
  const scrolled = tops.length ? Math.max(0, -Math.min(...tops)) : 0
  document.documentElement.style.setProperty('--greese-page-scrolled', `${scrolled}px`)
}

/** A theme role that decides something at the click, as the whole page has it. */
const role = (name: string) =>
  getComputedStyle(document.documentElement)
    .getPropertyValue(`--greese-motion-${name}`)
    .trim()

/** The theme's `page-mode`. */
const themeMode = () => role('page-mode')

/** The theme's `page-exit-order`, else `reverse`. */
const themeOrder = () =>
  (['reverse', 'document', 'together'] as const).find(
    (o) => o === role('page-exit-order')
  ) ?? 'reverse'

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
  const from = location.href
  const current = navigation.currentEntry?.index ?? 0
  const back = e.destination.index < current
  const resolved = resolveRoute(routing, from, e.destination.url, back)
  writeRoute(resolved)
  const live = pagesOnScreen().filter((page) =>
    leavesLive(page, themeMode(), back, resolved.mode)
  )
  if (!live.length) return
  measureScrolled()
  e.intercept({
    focusReset: 'manual',
    precommitHandler: async () => {
      const exits = live.map((page) => leave(page, back, !!resolved.exit))
      e.signal.addEventListener('abort', () => exits.forEach((exit) => exit.restore()))
      await Promise.all(exits.map((exit) => exit.done))
      afterCommit(live, from, () => exits.forEach((exit) => exit.restore()))
    },
  } as NavigationInterceptOptions)
}

/**
 * Where page transitions come from and go to: the router's config of the
 * latest hook that has one, which back and forward (heard outside any hook)
 * resolve their routes with.
 */
let routing: PageNavigateConfig | undefined

/**
 * Resolves a page change's routes (ADR 0029): both pages' route config at the
 * click, synchronously, and the navigation's own options over them.
 */
const resolveRoute = (
  config: PageNavigateConfig | undefined,
  from: string,
  to: string | undefined,
  back: boolean,
  options?: PageNavigateOptions
): ResolvedPageRoute => {
  const path = (url: string) =>
    stripBase(new URL(url, location.href).pathname, config?.base)
  const fromPath = path(from)
  const toPath = to === undefined ? undefined : path(to)
  const route = (p: string | undefined) =>
    p === undefined ? undefined : config?.route?.(p)
  return resolvePageRoute(
    { from: route(fromPath), to: route(toPath) },
    fromPath,
    toPath,
    back,
    options
  )
}

/**
 * The root variables the snapshots' route rules read (and live exits): this
 * click's, or removed, so a stale value is never left for the next
 * navigation. They stay until the next click, since the snapshot animates
 * after the commit.
 */
const writeRoute = (resolved: ResolvedPageRoute) => {
  for (const key of ['enter', 'exit', 'duration', 'ease'] as const) {
    const name = `--greese-page-${key}`
    if (resolved[key]) document.documentElement.style.setProperty(name, resolved[key])
    else document.documentElement.style.removeProperty(name)
  }
}

/** Where a history step lands, where the Navigation API can say. */
const stepUrl = (step: number): string | undefined =>
  'navigation' in window
    ? (navigation.entries()[(navigation.currentEntry?.index ?? 0) + step]?.url ??
      undefined)
    : undefined

/** Hook instances listening, so the one listener goes when the last does. */
let holding = 0

/**
 * Your router's navigate, by path: React Router's `useNavigate()`, Next.js's
 * `router.push`. Every router's takes this form; a history step
 * (`page.navigate(-1)`) goes to the browser's history instead, which routers
 * follow.
 */
export type RouterNavigate = (to: string, options?: { replace?: boolean }) => unknown

export interface PageNavigateConfig {
  /**
   * A page's route config (`handle.greese` in React Router), by its path with
   * the base stripped. Called at the click for both pages, so it must answer
   * synchronously. Define it at module level, as you do the routes.
   */
  route?: (path: string) => PageRoute | undefined
  /** The app's base, stripped from paths before `route` and the patterns see them. @default '' */
  base?: string
}

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
export const usePageNavigate = (
  navigate: RouterNavigate,
  config?: PageNavigateConfig
): PageNavigate => {
  const route = config?.route
  const base = config?.base
  useEffect(() => {
    if (!route) return
    const mine = { route, base }
    routing = mine
    return () => {
      if (routing === mine) routing = undefined
    }
  }, [route, base])
  useEffect(() => {
    if (!('navigation' in window && 'NavigationPrecommitController' in window)) return
    if (holding++ === 0) navigation.addEventListener('navigate', holdTraversal)
    return () => {
      if (--holding === 0) navigation.removeEventListener('navigate', holdTraversal)
    }
  }, [])
  // The exits to take off when this hook's navigation commits: its update
  // (`setCommits`) is in the navigation's transition, with the router's, so
  // React commits them together, and this layout effect runs in that commit,
  // before the browser's snapshot of the new page. If the component goes in
  // the commit, its cleanup does it.
  const [commits, setCommits] = useState(0)
  const pending = useRef<Array<() => void>>([])
  const release = () => pending.current.splice(0).forEach((fn) => fn())
  useLayoutEffect(release, [commits])
  useLayoutEffect(() => release, [])
  return useMemo(() => {
    /** Navigates; `link` is the link followed, when one was. */
    const go = (
      to: string | number,
      options: PageNavigateOptions = {},
      link?: Element
    ) => {
      const from = location.href
      const types = pageTransitionTypes(from, to, options)
      const back = types.includes(BACK)
      // `<PageShare link>`: the old page's end is named now, before React's
      // snapshot of it; the new page's as it's inserted.
      if (types.includes(PAGE)) {
        pairByLink(link ?? null, back)
        measureScrolled()
      }
      // Which pages leave live, decided now: the types must be added before
      // anything is awaited. The navigation's own mode, else each page's,
      // else the theme's `page-mode`.
      const theme = themeMode()
      const step = typeof to === 'number'
      const isPage = types.includes(PAGE)
      const resolved = isPage
        ? resolveRoute({ route, base }, from, step ? stepUrl(to) : to, back, options)
        : {}
      if (isPage) writeRoute(resolved)
      const forced = options.exit !== 'theme' ? keyframes(options.exit) : undefined
      const live = isPage
        ? pagesOnScreen().filter((page) => leavesLive(page, theme, back, resolved.mode))
        : []
      // A replace changes the page in place: it has no entrance to play.
      if (live.length && !types.includes(REPLACE)) types.push(LIVE)
      // A replace changes in place: it has no snapshot for a route to shape.
      if (!types.includes(REPLACE)) types.push(...routeTypes(resolved))
      startTransition(async () => {
        for (const type of types) addTransitionType(type)
        // Commits with the router's update: before anything is awaited, so
        // it's in this transition.
        if (live.length && !step) setCommits((n) => n + 1)
        // The router starts at once, so the next page loads while the old one
        // leaves; React commits the router's update with this transition,
        // once both are done.
        const navigation = step
          ? history.go(to)
          : navigate(to, { replace: options.replace })
        const exits = live.map((page) => leave(page, back, !!resolved.exit, forced))
        const restore = () => exits.forEach((exit) => exit.restore())
        try {
          await Promise.all([navigation, ...exits.map((exit) => exit.done)])
        } catch (error) {
          // A navigation that failed puts the page back at once.
          restore()
          throw error
        }
        // One that succeeded, once the new page is in.
        if (!exits.length) return
        if (step) afterCommit(live, from, restore)
        else pending.current.push(restore)
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
  }, [navigate, route, base])
}
