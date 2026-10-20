import {
  createContext,
  use,
  useEffect,
  useSyncExternalStore,
  type AnchorHTMLAttributes,
  type JSX,
} from 'react'

/**
 * Two routes, by path under the app's base: `/` (the homepage) and
 * `/studio` (Theme Studio). A tiny History-API router: a library would cost
 * more than the page's whole routing, and a link is a plain anchor, so it
 * works without JavaScript and opens in a new tab as usual.
 */
export type Route = 'home' | 'studio'

/** The base the app is served from, with a trailing slash: `/` or `/greese/`. */
export const BASE = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`

const routeOf = (pathname: string): Route => {
  const path = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname
  return /^studio\/?$/.test(path.replace(/^\//, '')) ? 'studio' : 'home'
}

/** `studio` → `/greese/studio`; `home` → `/greese/`. */
export const hrefOf = (route: Route, hash = ''): string =>
  `${BASE}${route === 'studio' ? 'studio' : ''}${hash}`

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
  onClick,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: Route
  hash?: string
}): JSX.Element => {
  const href = hrefOf(to, hash)
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
  useEffect(() => {
    if (!location.hash) scrollTo({ top: 0 })
  }, [route])
  return null
}

export const RouteContext = createContext<Route>('home')
export const useCurrentRoute = (): Route => use(RouteContext)
