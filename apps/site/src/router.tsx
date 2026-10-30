import {
  createContext,
  use,
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type JSX,
} from 'react'
import { usePageNavigate, type PageNavigate } from '@greese/react'
import { preloadPage } from './pages/chunks.ts'
import {
  Link,
  useLocation,
  useMatches,
  useNavigate,
  useNavigationType,
  useParams,
} from 'react-router'

/**
 * Four routes, by path under the app's base: `/` (the homepage), `/studio`
 * (Theme Studio), `/templates` (the gallery, and `/templates/<id>` for each)
 * and `/docs` (the docs, and `/docs/<id>` for each page). React Router
 * routes them (ADR 0030; the table is src/routes.tsx): its navigations are
 * React transitions, which page transitions need (ADR 0029). This file is
 * the site's vocabulary over it, so pages name routes, not paths.
 */
export type Route = 'home' | 'studio' | 'templates' | 'docs'

/** What each route's `handle` carries: which of the four it is. */
export interface RouteHandle {
  route: Route
}

/** The base the app is served from, with a trailing slash: `/` or `/greese/`. */
export const BASE = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`

/** The router's own path for a route: `/templates/finance`, under the base. */
const pathOf = (route: Route, hash = '', page = '', search = ''): string =>
  `/${route === 'home' ? '' : route}${page ? `/${page}` : ''}${search}${hash}`

/**
 * `studio` → `/greese/studio`; `home` → `/greese/`; `templates`, `finance` →
 * `/greese/templates/finance`; `studio` with `?tab=code` → `/greese/studio?tab=code`.
 */
export const hrefOf = (route: Route, hash = '', page = '', search = ''): string =>
  `${BASE}${pathOf(route, hash, page, search).slice(1)}`

/** The route being shown: the deepest match's `handle` (an unknown path is home). */
export const useRoute = (): Route => {
  const matches = useMatches()
  for (let i = matches.length - 1; i >= 0; i--) {
    const handle = matches[i]!.handle as RouteHandle | undefined
    if (handle?.route) return handle.route
  }
  return 'home'
}

/** The page under the route: `finance` at `/templates/finance`, else undefined. */
export const useSubpage = (): string | undefined => useParams().page

/** Scrolls to `#id` once it exists: the page's sections mount a few at a time. */
const scrollToHash = (hash: string) => {
  const id = decodeURIComponent(hash.slice(1))
  if (!id) return scrollTo({ top: 0 })
  let tries = 0
  const timer = setInterval(() => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView()
      clearInterval(timer)
    } else if (++tries > 30) clearInterval(timer)
  }, 100)
}

/** The router's own path for an app href (`hrefOf`'s, base included). */
const routerPath = (href: string): string => {
  const url = new URL(href, location.href)
  const path = url.pathname.startsWith(BASE)
    ? `/${url.pathname.slice(BASE.length)}`
    : url.pathname
  return path + url.search + url.hash
}

/**
 * Page transitions' navigate (ADR 0029), made once by the app's shell and
 * shared: it takes app hrefs, so the direction and depth a navigation's types
 * say come from the URL as it is, base included, and hands React Router its
 * own path.
 */
export const PageNavigateContext = createContext<PageNavigate | null>(null)

/**
 * The shell's page navigate, for `PageNavigateContext`. The next page's
 * chunk and content load while the old page leaves, and the page change
 * waits for them: a page that commits still loading shows an empty fallback,
 * or a spinner with the footer under it, and that's what its entrance plays.
 */
export const useSitePageNavigate = (): PageNavigate => {
  const navigate = useNavigate()
  return usePageNavigate((to, options) => {
    const path = routerPath(to)
    return Promise.all([navigate(path, options), preloadPage(path)])
  })
}

/**
 * Navigates to an app href (`hrefOf`'s, base included): what search results
 * hold. A link should be a `RouteLink`; this is for code that has an href.
 */
export const useNavigateTo = (): ((href: string) => void) => {
  const page = use(PageNavigateContext)
  const navigate = useNavigate()
  return (href) => (page ? page.navigate(href) : void navigate(routerPath(href)))
}

/**
 * An anchor that changes route without a page load: React Router's `Link`,
 * addressed by route, through page transitions when the shell provides them.
 * Modified clicks, other targets and links off the app are left to the
 * browser.
 */
export const RouteLink = ({
  to,
  hash,
  page,
  search,
  onClick,
  ...props
}: Omit<ComponentProps<typeof Link>, 'to'> & {
  to: Route
  hash?: string
  /** A page under the route: a template's id. */
  page?: string
  /** A query string: `?tab=code`. */
  search?: string
}): JSX.Element => {
  const pages = use(PageNavigateContext)
  return (
    <Link
      {...props}
      to={pathOf(to, hash, page, search)}
      onClick={(event) => {
        onClick?.(event)
        // A plain click goes through page transitions (Link then leaves it).
        pages?.onLinkClick(hrefOf(to, hash, page, search))(event)
      }}
    />
  )
}

/**
 * Scrolls as the old router did, which React Router leaves to the app: a
 * new route or page starts at the top, and a link with a hash goes to its
 * section once it has mounted. Back and forward leave the browser's own
 * scroll restoration alone, unless the route changed. Layout effects: a page
 * transition's snapshot of the new page is taken after them, so it's already
 * at the top rather than jumping there after (ADR 0029).
 */
export const ScrollOnRoute = (): null => {
  const { key, hash } = useLocation()
  const type = useNavigationType()
  const route = useRoute()
  const page = useSubpage()
  useLayoutEffect(() => {
    if (type === 'PUSH') {
      if (hash) scrollToHash(hash)
      else scrollTo({ top: 0 })
    }
  }, [key, hash, type])
  // Not on the first render: a page that has just loaded is where the
  // browser put it, and scrolling there would force a layout during hydration.
  const first = useRef(true)
  useLayoutEffect(() => {
    if (first.current) first.current = false
    else if (!location.hash) scrollTo({ top: 0 })
  }, [route, page])
  return null
}
