import { expect, test } from '@playwright/test'

test('a docs page is a page of the app: its header, its theme, its examples', async ({
  page,
}) => {
  await page.goto('/docs/forms-button')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Button')
  // The app's own header, with Docs as the page it's on.
  await expect(
    page.locator('.site-nav-links').getByRole('link', { name: 'Docs' })
  ).toHaveAttribute('aria-current', 'page')
  // The examples render in the page, under the app's theme, not in a frame.
  const example = page.locator('.docs-canvas').first().getByRole('button')
  await expect(example).toHaveText('Save changes')
  expect(await example.evaluate((el) => !!el.closest('.site[data-greese-theme]'))).toBe(
    true
  )
  await expect(page.locator('iframe')).toHaveCount(0)
})

test('a scheme picked in the header applies to the docs, and stays', async ({ page }) => {
  await page.goto('/docs/guides-theming')
  // The page is a lazy chunk: wait for it before reading its colours.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.locator('.site-nav').getByRole('radio', { name: 'Dark' }).check()
  const canvas = () =>
    page.evaluate(() => getComputedStyle(document.querySelector('.docs-article')!).color)
  const dark = await canvas()
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.dataset.greeseScheme)).toBe(
    'dark'
  )
  expect(await canvas()).toBe(dark)
})

test("a page's controls drive its example, and its code follows", async ({ page }) => {
  await page.goto('/docs/forms-button')
  const example = page.locator('.docs-canvas').first().getByRole('button')
  await page
    .getByRole('radiogroup', { name: 'variant' })
    .getByRole('radio', { name: 'outline' })
    .click()
  await expect(example).toHaveClass(/greese-Button--outline/)
  await page.getByRole('textbox', { name: 'children' }).fill('Hello docs')
  await expect(example).toHaveText('Hello docs')
  await page
    .locator('.docs-story-bar')
    .first()
    .getByRole('button', { name: 'Show code' })
    .click()
  await expect(page.locator('.docs-story .docs-code-block').first()).toHaveText(
    '<Button variant="outline">Hello docs</Button>'
  )
})

test("the search opens a guide's section without leaving the app", async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => ((window as unknown as { stayed: boolean }).stayed = true))
  await page.locator('.site-nav').getByRole('button', { name: 'Search' }).first().click()
  await page.getByRole('combobox', { name: 'Search' }).fill('light and dark')
  await page
    .getByRole('option', { name: /Light and dark/ })
    .first()
    .click()
  await expect(page).toHaveURL(/\/docs\/guides-theming#light-and-dark$/)
  await expect(page.locator('#light-and-dark')).toBeInViewport()
  // Same document: the route changed, the page didn't load again.
  expect(
    await page.evaluate(() => (window as unknown as { stayed?: boolean }).stayed)
  ).toBe(true)
})

test('on a phone, the pages are a sheet that a link closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/docs/forms-button')
  await page.getByRole('button', { name: 'Docs pages' }).click()
  const sheet = page.locator('.docs-sidebar')
  await expect(sheet).toBeVisible()
  await sheet.getByRole('link', { name: 'Checkbox', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Checkbox')
  await expect(sheet).toBeHidden()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  ).toBe(0)
})
