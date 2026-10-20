import { mkdirSync, copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { getSchemeScript } from '@greese/ui'
import { kitSources } from './server/kitSources.ts'
import { studio } from './server/studio.ts'

/**
 * The greese web app: the homepage at `/` and Theme Studio at `/studio`, one
 * client-routed app. `npm run studio` (from the repository root) runs it with
 * the studio's file access; built, it's static, for GitHub Pages.
 *
 * `base` is where the app is served from: `/` here, and the Pages workflow
 * sets GREESE_BASE to `/<repository>/`. Routes are paths under it, so the
 * build also writes `studio/index.html` and `404.html` as copies of the page:
 * a host with no rewrites (GitHub Pages) then serves the app for a direct
 * visit to `/studio` or any other path.
 *
 * The studio's preview (`preview.html`) is its own page, loaded in an iframe
 * so the theme being edited never restyles the editor.
 */
const ROOT = dirname(fileURLToPath(import.meta.url))

const fallbackPages = (): Plugin => ({
  name: 'greese-fallback-pages',
  apply: 'build',
  closeBundle() {
    const dist = join(ROOT, 'dist')
    mkdirSync(join(dist, 'studio'), { recursive: true })
    copyFileSync(join(dist, 'index.html'), join(dist, 'studio/index.html'))
    copyFileSync(join(dist, 'index.html'), join(dist, '404.html'))
  },
})

export default defineConfig({
  base: process.env.GREESE_BASE ?? '/',
  plugins: [
    react(),
    studio(),
    kitSources(),
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
    },
  },
  server: { port: 5180 },
})
