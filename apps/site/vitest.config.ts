import { defineConfig } from 'vitest/config'
import { docsIndex } from './server/docsIndex.ts'
import { kitSources } from './server/kitSources.ts'

export default defineConfig({
  plugins: [kitSources(), docsIndex()],
  cacheDir: 'node_modules/.vitest',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
    // The library's compiled stylesheets are read as text (`?raw`), not processed.
    css: { include: [/packages\/ui\/dist\/css\//] },
  },
})
