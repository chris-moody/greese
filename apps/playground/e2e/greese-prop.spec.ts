import { expect, test, type Page } from '@playwright/test'
import { computed, frames, isTouch, leaves, openFixture, settled } from './support.ts'

/**
 * The `greese` prop in real engines: CSS presets, stagger, scroll reveals,
 * interactions, text effects and overlay exits. Long durations keep the CSS
 * animations running while they're measured.
 */
test.beforeEach(({ page }) => openFixture(page, 'motion', (p) => p.getByTestId('enter')))

const style = <P extends string>(page: Page, testId: string, ...props: P[]) =>
  computed(page.getByTestId(testId), ...props)

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
  // Long enough for the observer and the scroll check to have run.
  await frames(reveal, 10)
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

test('hover lifts with a mouse, never on touch; press squishes', async ({ page }) => {
  const isMobile = isTouch()
  const button = page.getByTestId('hover')
  if (isMobile) {
    await button.tap()
    await settled(button)
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

test('a hover that lifts the element away from a still pointer keeps it lifted', async ({
  page,
}) => {
  const isMobile = isTouch()
  test.skip(isMobile, 'hover is for fine pointers')
  const button = page.getByTestId('hover')
  await button.scrollIntoViewIfNeeded()
  const box = (await button.boundingBox())!
  // The bottom 2px: once the button has risen 4px, the pointer is under it.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height - 2)
  await expect
    .poll(async () => (await style(page, 'hover', 'translate')).translate)
    .toBe('0px -4px')
  // It stays risen, rather than settling back under the pointer and bouncing:
  // still for half a second of frames, and still lifted.
  await settled(button, { frames: 30 })
  expect((await style(page, 'hover', 'translate')).translate).toBe('0px -4px')
  // Leaving where it rests lets it settle.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height + 20)
  await expect
    .poll(async () => (await style(page, 'hover', 'translate')).translate)
    .toMatch(/^0px( 0px)?$/)
})

test('entering again while it settles keeps the resting box, so it lifts and stays', async ({
  page,
}) => {
  const isMobile = isTouch()
  test.skip(isMobile, 'hover is for fine pointers')
  const button = page.getByTestId('hover')
  await button.scrollIntoViewIfNeeded()
  const box = (await button.boundingBox())!
  const edge = { x: box.x + box.width / 2, y: box.y + box.height - 2 }
  const lifted = () => style(page, 'hover', 'translate').then((s) => s.translate)
  await page.mouse.move(edge.x, edge.y)
  await expect.poll(lifted).toBe('0px -4px')
  // Off, and straight back while it's still part-way down: the box it was
  // measured in is where it rests, not where it is mid-way.
  await page.mouse.move(edge.x, box.y + box.height + 40)
  await leaves(button, 'translate', '0px -4px') // it has started down
  await page.mouse.move(edge.x, box.y + box.height / 2)
  await page.mouse.move(edge.x, edge.y)
  await expect.poll(lifted).toBe('0px -4px')
  await settled(button, { frames: 30 })
  expect(await lifted()).toBe('0px -4px')
})

test('the pointer leaving the window from where it rests ends the hover', async ({
  page,
  browserName,
}) => {
  const isMobile = isTouch()
  test.skip(isMobile, 'hover is for fine pointers')
  // WebKit re-checks hover as the button settles back under the real pointer,
  // which a synthetic exit can't move out of the window: it enters again.
  test.skip(browserName === 'webkit', 'the real pointer stays in the window')
  const button = page.getByTestId('hover')
  await button.scrollIntoViewIfNeeded()
  const box = (await button.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height - 2)
  await expect
    .poll(async () => (await style(page, 'hover', 'translate')).translate)
    .toBe('0px -4px')
  // A small move below the risen button, still where it rests: every engine
  // now has the pointer off it, and the runtime watches the resting box.
  await page.mouse.move(box.x + box.width / 2 + 1, box.y + box.height - 1)
  expect((await style(page, 'hover', 'translate')).translate).toBe('0px -4px')
  // What the browser sends as the pointer leaves the window: nowhere to go.
  await page.evaluate(() => {
    dispatchEvent(new PointerEvent('pointerout', { relatedTarget: null }))
  })
  await expect
    .poll(async () => (await style(page, 'hover', 'translate')).translate)
    .toMatch(/^0px( 0px)?$/)
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
