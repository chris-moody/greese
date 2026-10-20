import { defineConfig } from 'vitest/config'
import { kitSources } from './server/kitSources.ts'

export default defineConfig({
  plugins: [kitSources()],
  cacheDir: 'node_modules/.vitest',
  test: { environment: 'node', include: ['src/**/*.test.ts', 'server/**/*.test.ts'] },
})
