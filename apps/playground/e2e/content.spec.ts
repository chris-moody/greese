import { expect, test } from '@playwright/test'

/** Content, media and disclosure in real engines. */
test.beforeEach(async ({ page }) => {
  await page.goto('/?page=content')
  await page.getByTestId('h1').waitFor()
})

const style = (
  locator: ReturnType<import('@playwright/test').Page['getByTestId']>,
  prop: string
) => locator.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop)

test('exclusive accordion: keyboard opens an item and the browser closes the other', async ({
  page,
}) => {
  const shipping = page.locator('summary', { hasText: 'Shipping' })
  const returns = page.locator('summary', { hasText: 'Returns' })
  await page.keyboard.press('Shift')
  await shipping.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('Ships in two days.')).toBeVisible()

  await returns.click()
  await expect(page.getByText('Free returns for 30 days.')).toBeVisible()
  await expect(page.getByText('Ships in two days.')).toBeHidden()
})

for (const dir of ['ltr', 'rtl'] as const) {
  test(`tabs: arrow keys follow reading direction (${dir})`, async ({ page }) => {
    const tabs = page.getByTestId(dir)
    await tabs.getByRole('tab', { name: 'Alpha' }).focus()
    // "Forward" is ArrowRight in LTR, ArrowLeft in RTL.
    await page.keyboard.press(dir === 'ltr' ? 'ArrowRight' : 'ArrowLeft')
    await expect(tabs.getByRole('tab', { name: 'Beta' })).toBeFocused()
    await expect(tabs.getByRole('tabpanel')).toHaveText('Panel B')
    await page.keyboard.press('End')
    await expect(tabs.getByRole('tabpanel')).toHaveText('Panel C')
  })
}

test('headings step up at md; text clamps to two lines', async ({ page }) => {
  const width = page.viewportSize()!.width
  const size = parseFloat(await style(page.getByTestId('h1'), 'font-size'))
  expect(size).toBe(width >= 900 ? 36 : 30)

  const clamped = page.getByTestId('clamped')
  const lineHeight = parseFloat(await style(clamped, 'line-height'))
  const height = (await clamped.boundingBox())!.height
  expect(Math.round(height / lineHeight)).toBe(2)
})

test('card media bleeds through the padding to the inside of the border', async ({
  page,
}) => {
  const card = (await page.getByTestId('card').boundingBox())!
  const border = parseFloat(await style(page.getByTestId('card'), 'border-left-width'))
  const media = (await page.getByTestId('card-media').boundingBox())!
  expect(media.x).toBeCloseTo(card.x + border, 0)
  expect(media.width).toBeCloseTo(card.width - 2 * border, 0)
  expect(media.y).toBeCloseTo(card.y + border, 0)
})

test('priority images load eagerly at high priority', async ({ page }) => {
  const img = page.getByRole('img', { name: 'Hero' })
  await expect(img).toHaveAttribute('loading', 'eager')
  await expect(img).toHaveAttribute('fetchpriority', 'high')
})

test('reduced motion: skeleton stops shimmering, spinner pulses instead', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(await style(page.getByTestId('skeleton'), 'animation-name')).toBe('none')
  expect(await style(page.getByTestId('spinner'), 'animation-name')).toBe(
    'greese-spinner-pulse'
  )
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  expect(await style(page.getByTestId('spinner'), 'animation-name')).toBe(
    'greese-spinner-spin'
  )
})
