import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { getSchemeScript } from '@greese/ui'

/**
 * Consumes @greese/react exactly as a published dependency: through its
 * package `exports`, i.e. the built dist/. Run `npm run build` at the root
 * first (turbo does this for you).
 */
export default defineConfig({
  build: {
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
    {
      // The pre-paint scheme script, as a real app would put it in <head>.
      name: 'greese-scheme-script',
      transformIndexHtml: () => [
        { tag: 'script', children: getSchemeScript(), injectTo: 'head-prepend' },
      ],
    },
  ],
})
