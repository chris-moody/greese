import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { getSchemeScript } from '@greese/ui'

/**
 * The greese homepage, a static site for GitHub Pages. `base: './'` keeps
 * every asset path relative, so it works at `user.github.io/<repo>/` (or any
 * other path) without knowing the repository name.
 */
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      // The saved color scheme applies before first paint.
      name: 'greese-scheme-script',
      transformIndexHtml: () => [
        { tag: 'script', children: getSchemeScript(), injectTo: 'head-prepend' },
      ],
    },
  ],
})
