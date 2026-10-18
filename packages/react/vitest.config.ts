import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Per package: parallel runs sharing the root cache race to clear it.
  cacheDir: 'node_modules/.vitest',
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/**/index.ts'],
      reporter: ['text-summary', 'text'],
      thresholds: {
        // Every responsive component depends on this; it stays fully covered.
        'src/utils/responsive.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
})
