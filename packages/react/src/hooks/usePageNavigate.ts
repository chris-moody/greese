'use client'
import {
  addTransitionType,
  startTransition,
  useMemo,
  type MouseEvent,
} from 'react'
import {
  pageTransitionTypes,
  type PageNavigateOptions,
} from '../components/PageTransition/pageMotion.ts'

/** Your router's navigate: a path (or a history step), and whether to replace. */
export type RouterNavigate = (
  to: string | number,
  options?: { replace?: boolean }
) => unknown

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
 * transition and `PageTransition` knows which way the page went.
 *
 * ```tsx
 * const page = usePageNavigate(useNavigate())
 * <Link to="/docs" onClick={page.onLinkClick('/docs')}>Docs</Link>
 * ```
 */
export const usePageNavigate = (navigate: RouterNavigate): PageNavigate =>
  useMemo(() => {
    const go: PageNavigate['navigate'] = (to, options = {}) => {
      const types = pageTransitionTypes(location.href, to, options)
      startTransition(async () => {
        for (const type of types) addTransitionType(type)
        await (typeof to === 'number'
          ? navigate(to)
          : navigate(to, { replace: options.replace }))
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
        go(to, options)
      },
    }
  }, [navigate])
