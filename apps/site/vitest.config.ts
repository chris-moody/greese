import { defineConfig } from 'vitest/config'
import { docsIndex } from './server/docsIndex.ts'
import { kitSources } from './server/kitSources.ts'

export default defineConfig({
  plugins: [kitSources(), docsIndex()],
  cacheDir: 'node_modules/.vitest',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
    // Several of these compile the whole theme SCSS, once per shape or entry
    // point, so their cost grows with every component stylesheet the kit
    // carries. 5s was already marginal at 87 of them.
    testTimeout: 20_000,
    // The library's compiled stylesheets are read as text (`?raw`), not processed.
    css: { include: [/packages\/ui\/dist\/css\//] },
  },
})
