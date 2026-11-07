import { defineConfig } from 'vitest/config'
import { docsIndex } from './server/docsIndex.ts'
import { kitSources } from './server/kitSources.ts'
import { storyNames } from './server/storyNames.ts'

export default defineConfig({
  // storyNames as in the build: the Try it test checks the names the site prints.
  plugins: [kitSources(), docsIndex(), storyNames()],
  cacheDir: 'node_modules/.vitest',
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'],
    // Several of these compile the whole theme SCSS, once per shape or entry
    // point, so their cost grows with every component stylesheet the kit
    // carries. 5s was already marginal at 87 of them.
    testTimeout: 20_000,
    // The docs' tests read the story files through `import.meta.glob`, and the
    // persistent module cache keeps a glob's list from the run that cached it:
    // a new story was "not a function" until the cache was cleared.
    fsModuleCache: false,
    // The library's compiled stylesheets are read as text (`?raw`), not processed.
    css: { include: [/packages\/ui\/dist\/css\//] },
  },
})
