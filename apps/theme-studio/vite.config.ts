import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { studio } from './server/studio.ts'

/**
 * Theme Studio: the editor (index.html) and the preview it themes
 * (preview.html, in an iframe so the theme never restyles the editor).
 * `npm run studio` from the repository root; see README.md.
 */
export default defineConfig({
  plugins: [react(), studio()],
  build: {
    rollupOptions: { input: { index: 'index.html', preview: 'preview.html' } },
  },
  server: { port: 5180 },
})
