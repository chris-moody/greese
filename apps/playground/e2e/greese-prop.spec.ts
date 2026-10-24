import { expect, test, type Page } from '@playwright/test'

/**
 * The `greese` prop in real engines: CSS presets, stagger, scroll reveals,
 * interactions, text effects and overlay exits. Long durations keep the CSS
 * animations running while they're measured.
 */
test.beforeEach(async ({ page }) => {
  await page.goto('/?page=motion')
  await page.getByTestId('enter').waitFor()
})

const style = (page: Page, testId: string, ...props: string[]) =>
  page.getByTestId(testId).evaluate((el, names) => {
    const s = getComputedStyle(el)
    return Object.fromEntries(names.map((n) => [n, s.getPropertyValue(n)]))
  }, props)

test('enter presets are CSS animations, staggered per child', async ({ page }) => {
  expect((await style(page, 'enter', 'animation-name'))['animation-name']).toBe(
    'greese-fade-up'
  )
  const delays = await page
    .getByTestId('stagger')
    .locator('> span')
    .evaluateAll((spans) => spans.map((s) => getComputedStyle(s).animationDelay))
  expect(delays).toEqual(['0s', '0.1s', '0.2s'])
  // Motion variables set on an ancestor tune the presets beneath it.
  expect((await style(page, 'tuned', 'animation-duration'))['animation-duration']).toBe(
    '7s'
  )
  // The container itself doesn't animate when staggering.
  expect((await style(page, 'stagger', 'animation-name'))['animation-name']).toBe('none')
})

test('sequences play groups together, pause, then play the next group', async ({
  page,
}) => {
  const sequence = page.getByTestId('sequence')
  // Sequences are greese.js, not CSS.
  expect((await style(page, 'sequence', 'animation-name'))['animation-name']).toBe('none')
  // In the pause: both effects of the first group have finished.
  await expect
    .poll(async () => style(page, 'sequence', 'opacity', 'scale'), { intervals: [50] })
    .toEqual({ opacity: '1', scale: '1' })
  // Then the last group fades it out, and it stays out.
  await expect
    .poll(async () => (await style(page, 'sequence', 'opacity')).opacity)
    .toBe('0')
  await expect(sequence).toHaveText('In together, wait, out')
})

test('scroll reveals wait out of view, then play', async ({ page }) => {
  const reveal = page.getByTestId('reveal')
  await expect(reveal).toHaveAttribute('data-greese-view', 'pending')
  expect((await style(page, 'reveal', 'opacity')).opacity).toBe('0')
  // Its top just above the fold: partly visible, so it waits rather than
  // animating in cut off by the bottom edge.
  await reveal.evaluate((el) =>
    scrollBy(0, el.getBoundingClientRect().top - innerHeight + 24)
  )
  await page.waitForTimeout(300)
  await expect(reveal).toHaveAttribute('data-greese-view', 'pending')
  // Wholly in view, clear of the bottom edge: it plays.
  await reveal.evaluate((el) => el.scrollIntoView({ block: 'center' }))
  await expect(reveal).toHaveAttribute('data-greese-view', 'in')
  expect((await style(page, 'reveal', 'animation-name'))['animation-name']).toBe(
    'greese-fade-up'
  )
  // Text effects run on reveal and leave the real text behind.
  await page
    .getByTestId('count-text')
    .evaluate((el) => el.scrollIntoView({ block: 'center' }))
  await expect(page.getByTestId('count-text')).toHaveAttribute('data-greese-view', 'in')
  await expect(page.getByTestId('count-text')).toHaveText('2048')
  await expect(
    page.getByTestId('count-text').locator('[aria-hidden="true"]')
  ).toHaveCount(0)
})

test('hover lifts with a mouse, never on touch; press squishes', async ({
  page,
  isMobile,
}) => {
  const button = page.getByTestId('hover')
  if (isMobile) {
    await button.tap()
    await page.waitForTimeout(400)
    // A tap may press (squish, then release) but never leaves a hover lift.
    expect((await style(page, 'hover', 'translate')).translate).toMatch(
      /^(none|0px( 0px)?)$/
    )
    return
  }
  await button.hover()
  await expect
    .poll(async () => (await style(page, 'hover', 'translate')).translate)
    .toBe('0px -4px')
  await page.mouse.move(0, 0)
  // Back at rest (browsers serialise "0px 0px" as "0px").
  await expect
    .poll(async () => (await style(page, 'hover', 'translate')).translate)
    .toMatch(/^0px( 0px)?$/)
  await button.hover()
  await page.mouse.down()
  await expect.poll(async () => (await style(page, 'hover', 'scale')).scale).toBe('0.96')
  await page.mouse.up()
})

test('an overlay plays its enter preset and exits with its exit preset', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Open exit dialog' }).click()
  const dialog = page.getByRole('dialog', { name: 'Exit test' })
  await expect(dialog).toBeVisible()
  expect(await dialog.evaluate((el) => getComputedStyle(el).animationName)).toBe(
    'greese-scale-in'
  )
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  // Closed: the exit state the transition ran to (scaleOut ends at 0).
  expect(
    await page
      .locator('dialog.greese-Motion--exit-scale-out')
      .evaluate((el) => getComputedStyle(el).scale)
  ).toBe('0')
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('nothing animates or hides, and text stays as written', async ({ page }) => {
    expect((await style(page, 'enter', 'animation-name'))['animation-name']).toBe('none')
    const reveal = page.getByTestId('reveal')
    await reveal.scrollIntoViewIfNeeded()
    await expect(reveal).toHaveAttribute('data-greese-view', 'in')
    expect((await style(page, 'reveal', 'animation-name'))['animation-name']).toBe('none')
    expect((await style(page, 'reveal', 'opacity')).opacity).toBe('1')
    await expect(page.getByTestId('count-text')).toHaveText('2048')
  })
})
