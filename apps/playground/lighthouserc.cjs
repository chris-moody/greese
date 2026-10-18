/**
 * Lighthouse budgets for the playground pages (production build, mobile
 * emulation with simulated slow 4G and 4x CPU). Run: npm run lighthouse
 * (after npm run build). Uses Playwright's Chromium, so no extra browser.
 *
 * INP needs real interactions, so Lighthouse can't measure it in the lab;
 * Total Blocking Time is its lab proxy. Interactions are benchmarked
 * separately (npm run bench).
 */
const { chromium } = require('@playwright/test')

const pages = ['theming', 'layout', 'forms', 'content', 'overlays']

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'localhost:4310',
      url: pages.map((page) => `http://localhost:4310/?page=${page}`),
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
