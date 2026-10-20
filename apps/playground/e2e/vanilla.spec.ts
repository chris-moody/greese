import { expect, test } from '@playwright/test'

/**
 * @greese/ui on its own (docs/adr/0014): a page of plain HTML, using the
 * classes the React components render, with no framework loaded. The
 * stylesheet themes it, and the color scheme switches through the same
 * attribute.
 */
test.describe('plain HTML with @greese/ui', () => {
  test('styles the markup, in both schemes', async ({ page }) => {
    await page.goto('/vanilla.html')
    const primary = page.getByTestId('primary')
    const background = () =>
      primary.evaluate((el) => getComputedStyle(el).backgroundColor)

    await page.evaluate(() => (document.documentElement.dataset.greeseScheme = 'light'))
    await expect.poll(background).toBe('rgb(37, 99, 235)')
    expect(await primary.evaluate((el) => getComputedStyle(el).borderRadius)).toBe('8px')

    await page.evaluate(() => (document.documentElement.dataset.greeseScheme = 'dark'))
    // The button transitions its colors, so wait for them to settle.
    await expect.poll(background).toBe('rgb(96, 165, 250)')
  })

  test('draws components from classes alone', async ({ page }) => {
    await page.goto('/vanilla.html')
    const card = page.getByTestId('card')
    expect(await card.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe('1px')
    expect(
      await page.locator('progress').evaluate((el) => el.getBoundingClientRect().width)
    ).toBeGreaterThan(50)
  })

  test('loads no framework: the page runs nothing of its own', async ({ page }) => {
    const scripts: string[] = []
    page.on('response', (r) => {
      if (r.request().resourceType() === 'script') scripts.push(r.url())
    })
    await page.goto('/vanilla.html')
    await page.waitForLoadState('networkidle')
    for (const url of scripts) {
      const body = await (await page.request.get(url)).text()
      expect(body.length, url).toBeLessThan(2000)
      expect(body).not.toMatch(/react/i)
    }
  })
})
