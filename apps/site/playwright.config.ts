import { defineConfig, devices } from '@playwright/test'

/**
 * Theme Studio in a real browser: what compiles through the kit has to reach
 * the preview, scoped to the component it was written for. The studio is a
 * desktop tool on the dev server (its file API), so one engine and one
 * viewport.
 */
export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4320', ...devices['Desktop Chrome'] },
  webServer: {
    command: 'npx vite --port 4320 --strictPort',
    url: 'http://localhost:4320/studio',
    reuseExistingServer: !process.env.CI,
  },
})
