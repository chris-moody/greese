import { expect, test, type Page } from '@playwright/test'

/**
 * The app's routing (ADR 0030): React Router under the site's own
 * vocabulary. A marker on `window` proves a link changed route without a
 * page load.
 */
const mark = (page: Page) =>
  page.evaluate(() => ((window as { routed?: boolean }).routed = true))
const stillLoaded = (page: Page) =>
  page.evaluate(() => (window as { routed?: boolean }).routed === true)

const current = (page: Page) =>
  page.locator('.site-nav-links').locator('[aria-current="page"]')

test('every route opens on a direct visit, and an unknown path is the homepage', async ({
  page,
}) => {
  await page.goto('/studio')
  await expect(page.locator('.site')).toHaveClass(/site--studio/)
  await expect(current(page)).toHaveText('Studio')

  await page.goto('/templates/finance')
  await expect(page.locator('.site')).toHaveClass(/site--templates/)
  await expect(current(page)).toHaveText('Templates')

  await page.goto('/docs/forms-button')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Button')

  await page.goto('/no-such-page')
  await expect(page.locator('.site')).toHaveClass(/site--home/)
})

test('links change route without a page load; back and forward follow', async ({
  page,
}) => {
  await page.goto('/')
  await mark(page)
  const links = page.locator('.site-nav-links')

  await links.getByRole('link', { name: 'Templates' }).click()
  await expect(page).toHaveURL(/\/templates$/)
  await expect(page.locator('.site')).toHaveClass(/site--templates/)

  await links.getByRole('link', { name: 'Docs' }).click()
  await expect(page).toHaveURL(/\/docs$/)
  await expect(current(page)).toHaveText('Docs')

  await page.goBack()
  await expect(page).toHaveURL(/\/templates$/)
  await expect(page.locator('.site')).toHaveClass(/site--templates/)
  await page.goForward()
  await expect(page).toHaveURL(/\/docs$/)
  expect(await stillLoaded(page)).toBe(true)
})

test('a new page starts at the top', async ({ page }) => {
  await page.goto('/templates')
  // The gallery is a lazy chunk: scroll once it's there (and tall enough).
  await expect(page.locator('#main a[href*="/templates/"]').first()).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() => {
        scrollTo({ top: 600 })
        return scrollY
      })
    )
    .toBeGreaterThan(0)
  await page.locator('.site-nav-links').getByRole('link', { name: 'Docs' }).click()
  await expect(page).toHaveURL(/\/docs$/)
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
})

test("a docs page's next link opens the next page under the same route", async ({
  page,
}) => {
  await page.goto('/docs/forms-button')
  await mark(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Button')
  const next = page.locator('a[rel="next"]')
  const title = (await next.textContent())!.trim()
  await next.click()
  await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('Button')
  expect(title).toContain((await page.getByRole('heading', { level: 1 }).textContent())!)
  expect(await stillLoaded(page)).toBe(true)
})

test("switching the studio's tab replaces the entry, so back leaves the studio", async ({
  page,
}) => {
  await page.goto('/templates')
  await page.locator('.site-nav-links').getByRole('link', { name: 'Studio' }).click()
  await expect(page).toHaveURL(/\/studio$/)
  await page.getByRole('tab', { name: 'Motion' }).click()
  await expect(page).toHaveURL(/\/studio\?tab=motion$/)
  await page.getByRole('tab', { name: 'Shapes' }).click()
  await expect(page).toHaveURL(/\/studio\?tab=shapes$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/templates$/)
})
