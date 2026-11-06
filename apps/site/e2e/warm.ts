import { chromium, type FullConfig } from '@playwright/test'

/**
 * Loads the studio, its preview and a docs page once before the tests: a cold dev server
 * compiles the editor, the preview and the stories it shows on first request,
 * which takes longer than a test waits, and every worker would race it.
 */
export default async function warm(config: FullConfig): Promise<void> {
  const { baseURL } = config.projects[0]!.use
  const browser = await chromium.launch()
  const page = await browser.newPage({ baseURL })
  await page.goto('/studio?tab=components')
  await page.frameLocator('iframe').locator('.anatomy').waitFor({ timeout: 120_000 })
  await page.goto('/docs/forms-button')
  await page.locator('.docs-canvas').first().waitFor({ timeout: 120_000 })
  await page.goto('/')
  await page.locator('.greese-Header').waitFor({ timeout: 60_000 })
  await browser.close()
}
