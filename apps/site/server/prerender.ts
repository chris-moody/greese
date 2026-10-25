/**
 * Puts the homepage's HTML into the built index.html, so its first screen
 * paints from HTML and CSS before any JavaScript runs; main.tsx hydrates it.
 *
 * Without it the page was an empty shell until React had loaded and
 * rendered: about 300 kB of JavaScript, then the first paint at 2.1 s on
 * Lighthouse's phone profile (over the 2 s budget before the hero even
 * appeared). Only `/` is rendered: the routes' copies of the page
 * (studio/index.html, docs/…) keep the empty root, so they never show the
 * homepage's HTML first.
 *
 * It renders through Vite's SSR loader with the app's own config, so the
 * same plugins, aliases and `base` apply; GREESE_PRERENDER leaves out what
 * only the dev server should run (the studio's file API).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const EMPTY_ROOT = '<div id="root"></div>'

/** The page with the app's HTML in its root. */
export const withRoot = (page: string, html: string): string => {
  if (!page.includes(EMPTY_ROOT))
    throw new Error(`index.html has no ${EMPTY_ROOT} to fill`)
  return page.replace(EMPTY_ROOT, `<div id="root">${html}</div>`)
}

export const prerenderHome = async (root: string, dist: string): Promise<void> => {
  const { createServer } = await import('vite')
  process.env.GREESE_PRERENDER = '1'
  const server = await createServer({
    root,
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    logLevel: 'error',
  })
  try {
    const { renderHome } = (await server.ssrLoadModule('/src/prerender.tsx')) as {
      renderHome: () => string
    }
    const file = join(dist, 'index.html')
    writeFileSync(file, withRoot(readFileSync(file, 'utf8'), renderHome()))
  } finally {
    await server.close()
    delete process.env.GREESE_PRERENDER
  }
}
