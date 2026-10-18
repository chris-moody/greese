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
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled' } },
  use: {
    baseURL: 'http://localhost:4320',
    browserName: 'chromium',
    deviceScaleFactor: 1,
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
