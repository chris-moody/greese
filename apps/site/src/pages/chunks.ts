import { createElement, use, type ComponentType, type JSX } from 'react'

/**
 * The pages' chunks, each fetched once: what the routes render (src/routes.tsx),
 * and what a page change fetches before it commits (`preloadPage`), so the
 * next page arrives whole rather than as an empty fallback, or a spinner with
 * the footer under it (ADR 0029).
 */

/**
 * A load, run once. Its promise is marked fulfilled when it resolves, as
 * React reads a settled promise: `use` then returns at once, where
 * `React.lazy` would suspend for a microtask every first render, and a
 * Suspense boundary mounting with the page would show its fallback.
 */
export const once = <T>(load: () => Promise<T>): (() => Promise<T>) => {
  let promise: Promise<T> | undefined
  return () => {
    if (!promise) {
      const p = load()
      void p.then(
        (value) => Object.assign(p, { status: 'fulfilled', value }),
        () => {}
      )
      promise = p
    }
    return promise
  }
}

/** A component from a chunk: suspends until it's loaded, then renders it at once. */
export const fromChunk = <M>(
  load: () => Promise<M>,
  pick: (module: M) => ComponentType
): (() => JSX.Element) => {
  const Chunk = (): JSX.Element => createElement(pick(use(load())))
  return Chunk
}

export const loadStudio = once(() => import('../studio/StudioPage.tsx'))
export const loadTemplates = once(() => import('./Templates.tsx'))
export const loadDocs = once(() => import('../docs/DocsPage.tsx'))
export const loadFooter = once(() => import('../sections/Footer.tsx'))

/** The longest a page change waits for the next page: after it, it commits loading. */
const PRELOAD_CAP = 3000

/**
 * Fetches what the page at a router path renders, its chunk, the footer and
 * its content (a docs page's stories or MDX, a template), and resolves when
 * they're in, or after `PRELOAD_CAP`. Never rejects: a failure is the
 * page's to show.
 */
export const preloadPage = (path: string): Promise<unknown> => {
  const [, route, page] = new URL(path, location.href).pathname.split('/')
  const load =
    route === 'studio'
      ? loadStudio()
      : route === 'templates'
        ? loadTemplates().then((m) => page && m.preloadTemplate(page))
        : route === 'docs'
          ? loadDocs().then((m) => m.preloadDocsPage(page))
          : undefined
  if (!load) return Promise.resolve()
  return Promise.race([
    Promise.all([load, loadFooter()]).catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, PRELOAD_CAP)),
  ])
}
