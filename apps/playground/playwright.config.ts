import { defineConfig, devices } from '@playwright/test'

/**
 * Real-browser tests: jsdom has no layout engine, so anything responsive or
 * computed-style related is verified here instead of in Vitest.
 */
export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4310' },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4310',
    reuseExistingServer: !process.env.CI,
  },
})
