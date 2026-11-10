import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin, type Rollup } from 'vite'
import react from '@vitejs/plugin-react'
import { getSchemeScript } from '@greese/ui'

/**
 * Preloads the `?page=` page's chunks and stylesheets from the HTML, as a
 * router preloads a route's. Without it they only start downloading once
 * main.js has loaded and run, a waterfall Lighthouse's LCP pays for on every
 * page, and that says nothing about the library.
 */
const pagePreloads = (): Plugin => ({
  name: 'playground-page-preloads',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler(_html, { bundle, chunk }) {
      if (!bundle || chunk?.name !== 'main') return
      const source = readFileSync(new URL('./src/main.tsx', import.meta.url), 'utf8')
      const pages = [
        ...source.matchAll(
          /['"]?([\w-]+)['"]?\s*:\s*\(\)\s*=>\s*import\(\s*'\.\/(pages\/[^']+)'\s*\)/g
        ),
      ]
      if (!pages.length) throw new Error('playground-page-preloads: no pages in main.tsx')
      const chunks = Object.values(bundle).filter(
        (c): c is Rollup.OutputChunk => c.type === 'chunk'
      )
      const loaded = new Set([chunk.fileName, ...chunk.imports])
      const files: Record<string, string[]> = {}
      for (const [, name, path] of pages) {
        const page = chunks.find((c) => c.facadeModuleId?.endsWith(`/src/${path}`))
        if (!page) throw new Error(`playground-page-preloads: no chunk for ${path}`)
        const all = new Set<string>()
        const add = (c: Rollup.OutputChunk) => {
          if (all.has(c.fileName) || loaded.has(c.fileName)) return
          all.add(c.fileName)
          for (const css of c.viteMetadata?.importedCss ?? []) all.add(css)
          for (const file of c.imports) add(bundle[file] as Rollup.OutputChunk)
        }
        add(page)
        files[name!] = [...all]
      }
      // `crossOrigin` as Vite's loader sets it on the stylesheets it inserts:
      // a preload is only used by a request in the same mode.
      const script = `{const f=${JSON.stringify(files)},p=f[new URLSearchParams(location.search).get('page')]??f.theming;for(const u of p){const l=document.createElement('link');if(u.endsWith('.css')){l.rel='preload';l.as='style'}else l.rel='modulepreload';l.crossOrigin='';l.href='/'+u;document.head.append(l)}}`
      return [{ tag: 'script', children: script, injectTo: 'head' }]
    },
  },
})

/**
 * Consumes @greese/react exactly as a published dependency: through its
 * package `exports`, i.e. the built dist/. Run `npm run build` at the root
 * first (turbo does this for you).
 */
export default defineConfig({
  build: {
    // Every engine the playground tests supports modulepreload: the polyfill
    // would only be one more request on every page.
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        // Plain HTML on @greese/ui alone: proves the CSS needs no framework.
        vanilla: fileURLToPath(new URL('./vanilla.html', import.meta.url)),
      },
    },
  },
  plugins: [
    react(),
    pagePreloads(),
    {
      // The pre-paint scheme script, as a real app would put it in <head>.
      name: 'greese-scheme-script',
      transformIndexHtml: () => [
        { tag: 'script', children: getSchemeScript(), injectTo: 'head-prepend' },
      ],
    },
  ],
})
