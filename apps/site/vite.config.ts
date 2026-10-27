import { mkdirSync, copyFileSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { NodePackageImporter } from 'sass-embedded'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import { getSchemeScript } from '@greese/ui'
import { greeseUtilities } from '@greese/ui/vite'
import { docgenDocs } from './server/docgen.ts'
import { docsIndex, docsPages } from './server/docsIndex.ts'
import { kitSources } from './server/kitSources.ts'
import { prerenderHome } from './server/prerender.ts'
import { runtimeChunkGuard } from './server/runtimeChunk.ts'
import { storyNames } from './server/storyNames.ts'
import { studio } from './server/studio.ts'

/**
 * The greese web app: the homepage at `/`, Theme Studio at `/studio`, the
 * templates at `/templates` and the docs at `/docs`, one client-routed app. `npm run studio` (from the repository root) runs it with
 * the studio's file access; built, it's static, for GitHub Pages.
 *
 * `base` is where the app is served from: `/` here, and the Pages workflow
 * sets GREESE_BASE to `/<repository>/`. Routes are paths under it, so the
 * build also writes `studio/index.html`, `templates/…/index.html`,
 * `docs/…/index.html` and `404.html` as copies of the page:
 * a host with no rewrites (GitHub Pages) then serves the app for a direct
 * visit to `/studio` or any other path.
 *
 * The studio's preview (`preview.html`) is its own page, loaded in an iframe
 * so the theme being edited never restyles the editor.
 */
const ROOT = dirname(fileURLToPath(import.meta.url))

/** Each template's path, read from the registry, so a new one is served on a direct visit too. */
const TEMPLATE_IDS = [
  ...readFileSync(join(ROOT, 'src/templates/index.ts'), 'utf8').matchAll(
    /^ {4}id: '([a-z0-9-]+)'/gm
  ),
].map((m) => m[1]!)

type Graph = {
  getModuleInfo: (id: string) => {
    importedIds: readonly string[]
    dynamicallyImportedIds: readonly string[]
  } | null
}

/** The routes' own chunks: the homepage doesn't load them. */
const ROUTES = [
  'src/docs/DocsPage.tsx',
  'src/studio/StudioPage.tsx',
  'src/pages/Templates.tsx',
].map((file) => join(ROOT, file))
const reachSets = new WeakMap<object, Set<string>>()

/**
 * Everything the homepage can load: what `index.html` reaches, its own lazy
 * sections included, but not another route's page. Worked out once per build
 * (the entry's module info is the same object throughout a chunking pass).
 */
const homepageReaches = (ctx: Graph): Set<string> => {
  const entry = join(ROOT, 'index.html')
  const info = ctx.getModuleInfo(entry)
  if (!info) return new Set()
  let set = reachSets.get(info)
  if (set) return set
  set = new Set([entry])
  const queue = [entry]
  for (let id = queue.pop(); id !== undefined; id = queue.pop()) {
    const module = ctx.getModuleInfo(id)
    for (const next of [
      ...(module?.importedIds ?? []),
      ...(module?.dynamicallyImportedIds ?? []),
    ])
      if (!set.has(next) && !ROUTES.includes(next)) {
        set.add(next)
        queue.push(next)
      }
  }
  reachSets.set(info, set)
  return set
}

const fallbackPages = (): Plugin => ({
  name: 'greese-fallback-pages',
  apply: 'build',
  // The copies take the empty page first; then the homepage gets its HTML.
  async closeBundle() {
    const dist = join(ROOT, 'dist')
    const pages = [
      'studio',
      'templates',
      ...TEMPLATE_IDS.map((id) => `templates/${id}`),
      'docs',
      ...docsPages().pages.map((page) => `docs/${page.id}`),
    ]
    for (const page of pages) {
      mkdirSync(join(dist, page), { recursive: true })
      copyFileSync(join(dist, 'index.html'), join(dist, page, 'index.html'))
    }
    copyFileSync(join(dist, 'index.html'), join(dist, '404.html'))
    await prerenderHome(ROOT, dist)
  },
})

export default defineConfig({
  base: process.env.GREESE_BASE ?? '/',
  resolve: {
    alias: {
      // The docs' MDX and shared components use Storybook's blocks; in the app
      // they're its own (src/docs/blocks.tsx), drawn with greese ui.
      '@storybook/addon-docs/blocks': join(ROOT, 'src/docs/blocks.tsx'),
    },
  },
  css: {
    preprocessorOptions: {
      // `pkg:@greese/ui/scss/kit` in the site's own styles: the breakpoints
      // (`greese.up(md)`) come from the library, not from numbers written here.
      scss: { importers: [new NodePackageImporter()] },
    },
  },
  plugins: [
    // The docs' MDX pages (apps/docs/stories), compiled as Storybook does, with
    // GitHub-flavoured Markdown; before React's plugin, which handles the JSX.
    {
      enforce: 'pre',
      ...mdx({ remarkPlugins: [remarkGfm], providerImportSource: undefined }),
    },
    react({ include: /\.(mdx|[jt]sx?)$/ }),
    // The studio's file API is for the dev server, not the homepage's prerender.
    ...(process.env.GREESE_PRERENDER ? [] : [studio()]),
    kitSources(),
    docsIndex(),
    docgenDocs(),
    storyNames(),
    // Only the utility classes the app's source uses (ADR 0019).
    greeseUtilities({
      content: ['index.html', 'preview.html', 'src/**/*.{ts,tsx}'],
    }) as Plugin,
    fallbackPages(),
    runtimeChunkGuard(),
    {
      // The saved color scheme applies before first paint.
      name: 'greese-scheme-script',
      transformIndexHtml: (_html, ctx) =>
        ctx.filename.endsWith('index.html')
          ? [{ tag: 'script', children: getSchemeScript(), injectTo: 'head-prepend' }]
          : [],
    },
  ],
  build: {
    rollupOptions: {
      input: { index: join(ROOT, 'index.html'), preview: join(ROOT, 'preview.html') },
      output: {
        // The homepage and the lazy studio share many small components, which
        // would each become a chunk, and each chunk a round trip on a slow
        // connection: React, and greese ui's packages, are one chunk each.
        advancedChunks: {
          groups: [
            {
              name: 'react',
              test: /node_modules\/(react|react-dom|scheduler)\//,
              minShareCount: 1,
            },
            {
              // What the homepage uses, in one chunk. The rest of the library
              // (the docs use all of it, to name and run its components) stays
              // with the pages that use it, so the homepage never loads it.
              // effects-runtime, which both entries share, goes in with it: in
              // a chunk of its own it took Rolldown's runtime helpers onto an
              // import cycle (a blank page), or cost the homepage a request
              // (150 ms of LCP); runtimeChunkGuard checks for the cycle.
              name: (id, ctx) => (homepageReaches(ctx).has(id) ? 'greese' : null),
              // Scripts only: the library's stylesheets stay with what imports
              // them, the first screen's with the page and the rest lazy
              // (src/styles), or this chunk's CSS would block the first paint.
              test: /packages\/(react|ui|js)\/(dist|src)\/.*\.[jt]sx?$|\/src\/effects-runtime\.ts$/,
              minShareCount: 2,
            },
          ],
        },
      },
    },
  },
  server: { port: 5180 },
})
