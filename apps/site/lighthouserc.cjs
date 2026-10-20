/**
 * Lighthouse budgets for the homepage, the same as the playground's (mobile
 * emulation, simulated slow 4G, 4x CPU). Run: npm run lighthouse -w site
 * (after npm run build). Uses Playwright's Chromium, so no extra browser.
 */
const { chromium } = require('@playwright/test')

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'localhost:4330',
      url: ['http://localhost:4330/'],
      numberOfRuns: 3,
      chromePath: chromium.executablePath(),
      settings: { chromeFlags: '--headless=new --no-sandbox' },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'total-blocking-time': ['error', { maxNumericValue: 100 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
      },
    },
    upload: { target: 'filesystem', outputDir: './lighthouse-report' },
  },
}
