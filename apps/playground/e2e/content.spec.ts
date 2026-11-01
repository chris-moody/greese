import { expect, test } from '@playwright/test'
import { typography } from '@greese/ui'
import { atLeast, isTouch, openFixture, px, settled, style } from './support.ts'

/** Content, media and disclosure in real engines. */
test.beforeEach(({ page }) => openFixture(page, 'content', (p) => p.getByTestId('h1')))

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

test('collapsible: the height animates without a jump at either end', async ({
  page,
}) => {
  const animates = await page.evaluate(() =>
    CSS.supports('interpolate-size', 'allow-keywords')
  )
  test.skip(!animates, 'elsewhere it opens and closes at once')
  // The block below, sampled every frame while it opens and while it closes.
  const sample = () =>
    page.evaluate(
      () =>
        new Promise<number[]>((resolve) => {
          const details = document.querySelector<HTMLDetailsElement>(
            '[data-testid="collapsible"]'
          )!
          const after = document.querySelector('[data-testid="after-collapsible"]')!
          const tops = [after.getBoundingClientRect().top]
          const start = performance.now()
          details.open = !details.open
          const frame = () => {
            tops.push(after.getBoundingClientRect().top)
            if (performance.now() - start < 800) requestAnimationFrame(frame)
            else resolve(tops)
          }
          requestAnimationFrame(frame)
        })
    )
  for (const tops of [await sample(), await sample()]) {
    const steps = tops
      .slice(1)
      .map((top, i) => top - tops[i]!)
      .filter((s) => s !== 0)
    // One direction only, and easing out: a margin dropping out at the end
    // was a last step of 1em.
    expect(steps.every((s) => Math.sign(s) === Math.sign(steps[0]!))).toBe(true)
    expect(Math.abs(steps.at(-1)!)).toBeLessThan(6)
  }
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

test('headings step up at md and lg; text clamps to two lines', async ({ page }) => {
  const size = parseFloat(await style(page.getByTestId('h1'), 'font-size'))
  // The h1 variant steps up at md and lg.
  const { base, md, lg } = typography.h1
  const step = atLeast(page, 'lg') ? lg : atLeast(page, 'md') ? md : base
  expect(size).toBe(px(step!.fontSize!))

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

test('an interactive card stays risen under a pointer on its lower edge; media keeps its corners', async ({
  page,
}) => {
  test.skip(isTouch(), 'hover is for fine pointers')
  const card = page.getByTestId('card-link')
  await card.scrollIntoViewIfNeeded()
  const box = (await card.boundingBox())!
  // The bottom 1px: once the card has risen 2px, the pointer is below its box.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height - 1)
  await expect.poll(() => style(card, 'translate')).toBe('0px -2px')
  await settled(card)
  // Risen, the pointer is below the card's box: the strip under the card must
  // still be what's there, or a browser that re-checks hover would let the
  // card settle back under the pointer, rise again, and so on.
  const hit = await page.evaluate(
    ([x, y]) => !!document.elementFromPoint(x!, y!)?.closest('[data-testid="card-link"]'),
    [box.x + box.width / 2, box.y + box.height - 1]
  )
  expect(hit).toBe(true)
  const media = page.getByTestId('card-link-media')
  expect(await style(media, 'border-top-left-radius')).toBe(
    await style(card, 'border-top-left-radius')
  )
  expect(await style(media, 'overflow')).toBe('hidden')
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
