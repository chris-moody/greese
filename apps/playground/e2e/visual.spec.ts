import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

interface IndexEntry {
  id: string
  type: 'story' | 'docs'
}

const index = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('../../docs/storybook-static/index.json', import.meta.url)),
    'utf8'
  )
) as { entries: Record<string, IndexEntry> }

const stories = Object.values(index.entries).filter((entry) => entry.type === 'story')

for (const { id } of stories) {
  for (const scheme of ['light', 'dark'] as const) {
    test(`${id} (${scheme})`, async ({ page }) => {
      await page.goto(`/iframe.html?id=${id}&globals=scheme:${scheme}&viewMode=story`)
      // Attached, not visible: some stories correctly hide content (Show/Hide).
      await page.locator('#storybook-root > *').first().waitFor({ state: 'attached' })
      await page.waitForLoadState('networkidle')
      await page.evaluate(() => document.fonts.ready)
      await expect(page).toHaveScreenshot(`${id}-${scheme}.png`, { fullPage: true })
    })
  }
}
