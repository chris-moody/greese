import {
  createContext,
  use,
  useEffect,
  useSyncExternalStore,
  type AnchorHTMLAttributes,
  type JSX,
} from 'react'

/**
 * Three routes, by path under the app's base: `/` (the homepage), `/studio`
 * (Theme Studio) and `/templates` (the gallery, and `/templates/<id>` for
 * each). A tiny History-API router: a library would cost more than the
 * page's whole routing, and a link is a plain anchor, so it works without
 * JavaScript and opens in a new tab as usual.
 */
export type Route = 'home' | 'studio' | 'templates'

/** The base the app is served from, with a trailing slash: `/` or `/greese/`. */
export const BASE = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`

/** The path under the base, without slashes at either end: `templates/finance`. */
const pathOf = (pathname: string): string =>
  (pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname).replace(
    /^\/|\/$/g,
    ''
  )

const routeOf = (pathname: string): Route => {
  const path = pathOf(pathname)
  if (path === 'studio') return 'studio'
  if (/^templates(\/[a-z0-9-]+)?$/.test(path)) return 'templates'
  return 'home'
}

/**
 * `studio` → `/greese/studio`; `home` → `/greese/`; `templates`, `finance` →
 * `/greese/templates/finance`; `studio` with `?tab=code` → `/greese/studio?tab=code`.
 */
export const hrefOf = (route: Route, hash = '', page = '', search = ''): string =>
  `${BASE}${route === 'home' ? '' : route}${page ? `/${page}` : ''}${search}${hash}`

const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  addEventListener('popstate', listener)
  return () => {
    listeners.delete(listener)
    removeEventListener('popstate', listener)
  }
}
const snapshot = (): string => location.pathname

export const useRoute = (): Route =>
  routeOf(useSyncExternalStore(subscribe, snapshot, () => BASE))

/** The query string, kept live (`?tab=motion`): it follows navigate() and the history. */
export const useQuery = (): string =>
  useSyncExternalStore(
    subscribe,
    () => location.search,
    () => ''
  )

/** The page under the route: `finance` at `/templates/finance`, else undefined. */
export const useSubpage = (): string | undefined =>
  pathOf(useSyncExternalStore(subscribe, snapshot, () => BASE)).split('/')[1]

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

export const navigate = (href: string): void => {
  const url = new URL(href, location.href)
  history.pushState(null, '', url.pathname + url.search + url.hash)
  listeners.forEach((listener) => listener())
  if (url.hash) scrollToHash(url.hash)
  else scrollTo({ top: 0 })
}

/**
 * An anchor that changes route without a page load. Modified clicks, other
 * targets and links off the app are left to the browser.
 */
export const RouteLink = ({
  to,
  hash,
  page,
  search,
  onClick,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: Route
  hash?: string
  /** A page under the route: a template's id. */
  page?: string
  /** A query string: `?tab=code`. */
  search?: string
}): JSX.Element => {
  const href = hrefOf(to, hash, page, search)
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event)
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          (props.target && props.target !== '_self')
        )
          return
        event.preventDefault()
        navigate(href)
      }}
    />
  )
}

/** Resets the scroll position when the route changes. */
export const ScrollOnRoute = (): null => {
  const route = useRoute()
  const page = useSubpage()
  useEffect(() => {
    if (!location.hash) scrollTo({ top: 0 })
  }, [route, page])
  return null
}

export const RouteContext = createContext<Route>('home')
export const useCurrentRoute = (): Route => use(RouteContext)
