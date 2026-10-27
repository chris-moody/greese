import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

const theme = (id: string) =>
  readFileSync(new URL(`../../../packages/ui/themes/${id}.css`, import.meta.url), 'utf8')

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

test('on a phone, the pages button stays under the header as the page scrolls', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/docs/forms-button')
  await expect(page.locator('.docs-canvas').first()).toBeVisible()
  await page.mouse.wheel(0, 2500)
  const trigger = page.getByRole('button', { name: 'Docs pages' })
  await expect(trigger).toBeInViewport()
  await expect(trigger).toHaveText('Pages')
  const header = (await page.locator('.site-nav').boundingBox())!
  const box = (await trigger.boundingBox())!
  expect(box.y).toBeGreaterThanOrEqual(header.y + header.height - 1)
  // At the frame's end, the word before the icon.
  expect(box.x + box.width).toBeGreaterThan(390 - 40)
})

test('every page ends with the footer', async ({ page }) => {
  for (const path of [
    '/docs/forms-button',
    '/studio',
    '/templates',
    '/templates/finance',
  ]) {
    await page.goto(path)
    await expect(page.locator('.site-footer')).toHaveCount(1)
  }
})

test('from md the pages are a column beside the page, under every motion theme', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1200, height: 800 })
  // A motion theme's drawer exit (Snappy's scales it to nothing, a wipe masks
  // it away) is for the sheet below md; the docked column is never closed.
  for (const id of ['snappy', 'gentle', 'wipe', 'pocket', 'depth']) {
    await page.goto('/docs/forms-button')
    await page.addStyleTag({ content: theme(id) })
    const sidebar = page.locator('.docs-sidebar')
    await expect(sidebar, id).toBeVisible()
    expect(
      await sidebar.evaluate((el) => {
        const s = getComputedStyle(el)
        return [s.scale, s.maskImage, Math.round(el.getBoundingClientRect().width)]
      }),
      id
    ).toEqual(['none', 'none', 240])
  }
})

for (const [path, sidebar, content] of [
  ['/docs/forms-button', '.docs-sidebar', '.docs-main'],
  ['/studio', '.studio-editor', '.studio-preview-frame'],
] as const)
  test(`from md, ${path}'s sidebar stays under the header to the end, the content isn't held to the screen, and the footer follows it`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(path)
    const footer = page.locator('.greese-Footer')
    await expect(footer).toBeAttached()
    // The footer is the content's own sibling, in the column beside the sidebar.
    expect(
      await page
        .locator(content)
        .evaluate(
          (el) =>
            el.parentElement === document.querySelector('.greese-Footer')?.parentElement
        )
    ).toBe(true)
    // The page scrolls: the content isn't fitted to the screen.
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollHeight))
      .toBeGreaterThan(1600)
    const top = (await page.locator(sidebar).boundingBox())!
    // The preview may still be growing as it loads: scroll to the footer itself.
    await footer.scrollIntoViewIfNeeded()
    await expect(footer).toBeInViewport()
    const bottom = (await page.locator(sidebar).boundingBox())!
    expect(Math.abs(bottom.y - top.y)).toBeLessThan(1)
    expect(Math.abs(bottom.height - top.height)).toBeLessThan(1)
  })

for (const [path, bar, trigger, sidebar] of [
  ['/docs/forms-button', '.docs-bar', 'Docs pages', '.docs-sidebar'],
  ['/studio', '.studio-drawer-bar', 'Theme editor', '.studio-editor'],
] as const)
  test(`below md, ${path}'s sidebar opens from a bar flush under the header that stays there, and the page scrolls`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto(path)
    const at = async () => (await page.locator(bar).boundingBox())!.y
    // No gap above the bar: it starts where the header ends (once the fonts
    // have settled the header's height).
    await expect
      .poll(async () => {
        const header = (await page.locator('.greese-Header').boundingBox())!
        return Math.abs((await at()) - (header.y + header.height))
      })
      .toBeLessThan(1)
    // The page itself scrolls (nothing is fitted to the screen), and the bar
    // stays where it was.
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollHeight))
      .toBeGreaterThan(1600)
    const before = await at()
    await page.locator('.greese-Footer').scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(800)
    expect(Math.abs((await at()) - before)).toBeLessThan(1)
    await expect(page.locator(sidebar)).toBeHidden()
    await page.locator(bar).getByRole('button', { name: trigger }).click()
    await expect(page.locator(sidebar)).toBeVisible()
  })
