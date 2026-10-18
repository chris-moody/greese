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
    // The CSS relies on Baseline 2024 features (@property, container queries,
    // cascade layers): verify them in every engine, not just Chromium.
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // iOS Safari smoke test: WebKit with a phone viewport and touch.
    { name: 'iphone', use: { ...devices['iPhone 15'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4310',
    reuseExistingServer: !process.env.CI,
  },
})
