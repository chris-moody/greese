import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { kitSources } from './server/kitSources.ts'
import { studio } from './server/studio.ts'

/**
 * Theme Studio: the editor (index.html) and the preview it themes
 * (preview.html, in an iframe so the theme never restyles the editor).
 * `npm run studio` from the repository root; see README.md. Built, it's the
 * hosted studio for GitHub Pages (src/hosted.ts): `base: './'` keeps asset
 * paths relative, so it works under /<repo>/studio/.
 */
export default defineConfig({
  base: './',
  plugins: [react(), studio(), kitSources()],
  build: {
    rollupOptions: { input: { index: 'index.html', preview: 'preview.html' } },
  },
  server: { port: 5180 },
})
