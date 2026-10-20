import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Per package: parallel runs sharing the root cache race to clear it.
  cacheDir: 'node_modules/.vitest',
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
})
