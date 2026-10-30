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
 * Its CSS is the first screen's only (src/styles/firstScreen.ts), and the
 * build checks the HTML against it: a block the HTML uses but the list
 * leaves out fails the build.
 *
 * It renders through Vite's SSR loader with the app's own config, so the
 * same plugins, aliases and `base` apply; GREESE_PRERENDER leaves out what
 * only the dev server should run (the studio's file API).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const EMPTY_ROOT = '<div id="root"></div>'

/** The page with the app's HTML in its root. */
export const withRoot = (page: string, html: string): string => {
  if (!page.includes(EMPTY_ROOT))
    throw new Error(`index.html has no ${EMPTY_ROOT} to fill`)
  return page.replace(EMPTY_ROOT, `<div id="root">${html}</div>`)
}

/**
 * The stylesheets the HTML's blocks need, each with the ones it depends on
 * (`needs`), that the render-blocking list leaves out: they'd paint unstyled
 * until the rest of the library's CSS arrives. Only elements count: a
 * `<style>` the page renders (PageTransition's rules) names classes for
 * later, not for the first paint.
 */
export const missingBlocks = (
  html: string,
  critical: readonly string[],
  needs: (block: string) => readonly string[]
): string[] =>
  [
    ...new Set(
      [
        ...html
          .replace(/<style\b[^>]*>[^<]*<\/style>/g, '')
          .matchAll(/greese-([A-Z][A-Za-z]+)/g),
      ].flatMap((m) => needs(m[1]!))
    ),
  ]
    .filter((sheet) => !critical.includes(sheet))
    .sort()

/** The blocks src/styles/firstScreen.ts imports. */
export const criticalBlocks = (source: string): string[] =>
  [...source.matchAll(/^import '@greese\/ui\/css\/([A-Z]\w*)\.css'/gm)].map((m) => m[1]!)

const resolve = createRequire(import.meta.url).resolve
const UI_CSS = join(dirname(resolve('@greese/ui/package.json')), 'dist/css')
const REACT_CSS = join(dirname(resolve('@greese/react/package.json')), 'dist/css')

/**
 * The library's stylesheets a block needs: its component's per-component
 * stylesheet's imports (Switch: ChoiceGroup, Field, Switch), else its own.
 */
export const blockNeeds = (block: string): string[] => {
  const component = join(REACT_CSS, `${block}.css`)
  if (existsSync(component))
    return [...readFileSync(component, 'utf8').matchAll(/ui\/css\/(\w+)\.css/g)]
      .map((m) => m[1]!)
      .filter((sheet) => sheet !== 'core')
  return existsSync(join(UI_CSS, `${block}.css`)) ? [block] : []
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
      renderHome: () => Promise<string>
    }
    const html = await renderHome()
    const missing = missingBlocks(
      html,
      criticalBlocks(readFileSync(join(root, 'src/styles/firstScreen.ts'), 'utf8')),
      blockNeeds
    )
    if (missing.length)
      throw new Error(
        `The homepage's first screen uses ${missing.join(', ')}, which src/styles/firstScreen.ts doesn't load: add them there, or they paint unstyled.`
      )
    const file = join(dist, 'index.html')
    writeFileSync(file, withRoot(readFileSync(file, 'utf8'), html))
  } finally {
    await server.close()
    delete process.env.GREESE_PRERENDER
  }
}
