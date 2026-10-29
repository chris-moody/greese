import { useEffect, type ComponentProps, type JSX } from 'react'
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

/**
 * Navigates to an app href (`hrefOf`'s, base included): what search results
 * hold. A link should be a `RouteLink`; this is for code that has an href.
 */
export const useNavigateTo = (): ((href: string) => void) => {
  const navigate = useNavigate()
  return (href) => {
    const url = new URL(href, location.href)
    const path = url.pathname.startsWith(BASE)
      ? `/${url.pathname.slice(BASE.length)}`
      : url.pathname
    void navigate(path + url.search + url.hash)
  }
}

/**
 * An anchor that changes route without a page load: React Router's `Link`,
 * addressed by route. Modified clicks, other targets and links off the app
 * are left to the browser.
 */
export const RouteLink = ({
  to,
  hash,
  page,
  search,
  ...props
}: Omit<ComponentProps<typeof Link>, 'to'> & {
  to: Route
  hash?: string
  /** A page under the route: a template's id. */
  page?: string
  /** A query string: `?tab=code`. */
  search?: string
}): JSX.Element => <Link {...props} to={pathOf(to, hash, page, search)} />

/**
 * Scrolls as the old router did, which React Router leaves to the app: a
 * new route or page starts at the top, and a link with a hash goes to its
 * section once it has mounted. Back and forward leave the browser's own
 * scroll restoration alone, unless the route changed.
 */
export const ScrollOnRoute = (): null => {
  const { key, hash } = useLocation()
  const type = useNavigationType()
  const route = useRoute()
  const page = useSubpage()
  useEffect(() => {
    if (type === 'PUSH') {
      if (hash) scrollToHash(hash)
      else scrollTo({ top: 0 })
    }
  }, [key, hash, type])
  useEffect(() => {
    if (!location.hash) scrollTo({ top: 0 })
  }, [route, page])
  return null
}
