import { lazy } from 'react'

/**
 * The footer, a chunk of its own: on every page, at the end of the page's
 * main column (the docs and the studio put it beside their sidebars); the
 * homepage brings its own after its sections.
 */
export const Footer = lazy(() =>
  import('./Footer.tsx').then((m) => ({ default: m.Footer }))
)
