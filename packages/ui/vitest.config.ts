import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Per package: parallel runs sharing the root cache race to clear it.
  cacheDir: 'node_modules/.vitest',
  test: {
    environment: 'jsdom',
    // Several of these compile the kit's SCSS, whose cost grows with every
    // component stylesheet it carries. 5s was already marginal at 87 of them,
    // and went over once the suites run in parallel under turbo.
    testTimeout: 20_000,
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
})
