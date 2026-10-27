import { expect, test } from '@playwright/test'
import { atLeast, openFixture, settled } from './support.ts'

/**
 * Overlays with scrollbars that take space (Windows, macOS with a mouse).
 * Playwright hides scrollbars by default, so this file launches without that
 * flag; only Chromium honours it, and other engines skip.
 */
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } })

test.beforeEach(({ page }) =>
  openFixture(page, 'overlays', (p) => p.getByTestId('appbar'))
)

test('modal scroll lock: no gutter strip and no shift with space-taking scrollbars', async ({
  page,
}) => {
  // Scrollbars that take space, as on Windows or macOS with a mouse attached.
  await page.addStyleTag({
    content: '::-webkit-scrollbar { width: 15px; background: #ccc }',
  })
  await page.evaluate(() => {
    document.body.style.minHeight = '3000px'
  })
  const gap = await page.evaluate(() => innerWidth - document.documentElement.clientWidth)
  test.skip(gap === 0, 'this engine draws overlay scrollbars only')
  const content = () =>
    page.evaluate(() => document.body.firstElementChild!.getBoundingClientRect().width)
  const before = await content()

  await page.getByRole('button', { name: 'Open drawer' }).click()
  const drawer = page.getByRole('dialog', { name: 'Filters' })
  await expect(drawer).toBeVisible()
  await settled(drawer)
  // The scrollbar goes (so the top layer spans the screen), the page is padded
  // by its width (so nothing shifts), and an end drawer meets the screen edge.
  expect(
    await page.evaluate(() => innerWidth - document.documentElement.clientWidth)
  ).toBe(0)
  expect(await content()).toBe(before)
  if (atLeast(page, 'md')) {
    const box = (await drawer.boundingBox())!
    expect(box.x + box.width).toBeCloseTo(await page.evaluate(() => innerWidth), 0)
  }
})
