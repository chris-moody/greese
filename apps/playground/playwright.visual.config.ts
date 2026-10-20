import { defineConfig } from '@playwright/test'

/**
 * Visual regression: every Storybook story, light and dark, phone and desktop.
 * Separate from the e2e config because it needs the built Storybook.
 *
 *   npm run test:visual            compare against baselines
 *   npm run test:visual:update     re-record baselines (review the diff!)
 *
 * Baselines are per platform (font rendering differs): __screenshots__/darwin
 * for local runs, __screenshots__/linux recorded by the Visual workflow in the
 * official Playwright image, which CI then compares against.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: 'visual.spec.ts',
  snapshotPathTemplate: '{testDir}/__screenshots__/{platform}/{projectName}/{arg}{ext}',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  fullyParallel: true,
  // threshold is the per-pixel color tolerance (0–1). Playwright's default
  // (0.2) treats pale tints as unchanged: a badge background stretching
  // across a card passed. Rendering here is deterministic, so be strict.
  expect: {
    toHaveScreenshot: {
      threshold: 0.02,
      maxDiffPixelRatio: 0.001,
      animations: 'disabled',
    },
  },
  use: {
    baseURL: 'http://localhost:4320',
    browserName: 'chromium',
    deviceScaleFactor: 1,
    // Snapshots show each story's final state: motion (the greese prop, text
    // effects) is skipped, and screenshots already finish CSS animations.
    reducedMotion: 'reduce',
  },
  projects: [
    {
      name: 'phone',
      use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
    },
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: 'vite preview --outDir ../docs/storybook-static --port 4320 --strictPort',
    url: 'http://localhost:4320/iframe.html',
    reuseExistingServer: !process.env.CI,
  },
})
