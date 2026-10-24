import { mkdirSync, copyFileSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { NodePackageImporter } from 'sass-embedded'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { getSchemeScript } from '@greese/ui'
import { greeseUtilities } from '@greese/ui/vite'
import { kitSources } from './server/kitSources.ts'
import { studio } from './server/studio.ts'

/**
 * The greese web app: the homepage at `/`, Theme Studio at `/studio` and the
 * templates at `/templates`, one
 * client-routed app. `npm run studio` (from the repository root) runs it with
 * the studio's file access; built, it's static, for GitHub Pages.
 *
 * `base` is where the app is served from: `/` here, and the Pages workflow
 * sets GREESE_BASE to `/<repository>/`. Routes are paths under it, so the
 * build also writes `studio/index.html`, `templates/…/index.html` and
 * `404.html` as copies of the page:
 * a host with no rewrites (GitHub Pages) then serves the app for a direct
 * visit to `/studio` or any other path.
 *
 * The studio's preview (`preview.html`) is its own page, loaded in an iframe
 * so the theme being edited never restyles the editor.
 */
const ROOT = dirname(fileURLToPath(import.meta.url))

/** Each template's path, read from the registry, so a new one is served on a direct visit too. */
const TEMPLATE_IDS = [
  ...readFileSync(join(ROOT, 'src/templates/index.ts'), 'utf8').matchAll(/^ {4}id: '([a-z0-9-]+)'/gm),
].map((m) => m[1]!)

const fallbackPages = (): Plugin => ({
  name: 'greese-fallback-pages',
  apply: 'build',
  closeBundle() {
    const dist = join(ROOT, 'dist')
    const pages = ['studio', 'templates', ...TEMPLATE_IDS.map((id) => `templates/${id}`)]
    for (const page of pages) {
      mkdirSync(join(dist, page), { recursive: true })
      copyFileSync(join(dist, 'index.html'), join(dist, page, 'index.html'))
    }
    copyFileSync(join(dist, 'index.html'), join(dist, '404.html'))
  },
})

export default defineConfig({
  base: process.env.GREESE_BASE ?? '/',
  css: {
    preprocessorOptions: {
      // `pkg:@greese/ui/scss/kit` in the site's own styles: the breakpoints
      // (`greese.up(md)`) come from the library, not from numbers written here.
      scss: { importers: [new NodePackageImporter()] },
    },
  },
  plugins: [
    react(),
    studio(),
    kitSources(),
    // Only the utility classes the app's source uses (ADR 0019).
    greeseUtilities({
      content: ['index.html', 'preview.html', 'src/**/*.{ts,tsx}'],
    }) as Plugin,
    fallbackPages(),
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
        // connection: React, and GreeseUI's packages, are one chunk each.
        advancedChunks: {
          groups: [
            {
              name: 'react',
              test: /node_modules\/(react|react-dom|scheduler)\//,
              minShareCount: 1,
            },
            {
              name: 'greese',
              test: /packages\/(react|ui|js)\/(dist|src)\//,
              minShareCount: 2,
            },
          ],
        },
      },
    },
  },
  server: { port: 5180 },
})
