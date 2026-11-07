import { expect, test, type Page } from '@playwright/test'
import { openFixture } from './support.ts'

/** @greese/authoring's Timeline in real engines: its clock is a greese.js timeline on the shared ticker. */
test.beforeEach(({ page }) =>
  openFixture(page, 'authoring-timeline', (p) => p.getByRole('button', { name: 'Play' }))
)

/** The playhead's frame, from the corner's "frame / count" readout. */
const frame = async (page: Page) => {
  const text = await page.getByText(/^\d+ \/ 24$/).textContent()
  return Number(text!.split('/')[0])
}

test('plays through the frames, and stops at the end without loop', async ({ page }) => {
  await page.getByRole('button', { name: 'Play' }).click()
  await expect.poll(() => frame(page)).toBeGreaterThan(3)
  // A second of frames, with room for a loaded machine (WebKit missed 3 s
  // under the full suite): this checks where it stops, not how fast.
  await expect(page.getByText('23 / 24')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
})

test('pauses where it is', async ({ page }) => {
  await page.getByRole('button', { name: 'Play' }).click()
  await expect.poll(() => frame(page)).toBeGreaterThan(2)
  await page.getByRole('button', { name: 'Pause' }).click()
  const at = await frame(page)
  // Twenty rendered frames: at 24 fps a playing clock would have moved.
  await page.evaluate(
    () =>
      new Promise<void>((done) => {
        let left = 20
        const next = () => (--left ? requestAnimationFrame(next) : done())
        requestAnimationFrame(next)
      })
  )
  expect(await frame(page)).toBe(at)
})

test('the playhead is a slider: arrows, Home and End move it', async ({ page }) => {
  const playhead = page.getByRole('slider', { name: 'Playhead' })
  await playhead.focus()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await expect(playhead).toHaveAttribute('aria-valuenow', '2')
  await page.keyboard.press('End')
  await expect(page.getByText('23 / 24')).toBeVisible()
  await page.keyboard.press('Home')
  await expect(playhead).toHaveAttribute('aria-valuenow', '0')
})

test('Escape with nothing selected is the page’s', async ({ page }) => {
  await page.getByRole('slider', { name: 'Playhead' }).focus()
  const prevented = await page.evaluate(() => {
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    })
    document.body.dispatchEvent(event)
    return event.defaultPrevented
  })
  expect(prevented).toBe(false)
})

test('loops when Loop is on', async ({ page }) => {
  await page.getByRole('button', { name: 'Loop' }).click()
  await page.getByRole('button', { name: 'Play' }).click()
  // Past the end and round again: a frame lower than one already seen.
  let highest = 0
  await expect
    .poll(
      async () => {
        const now = await frame(page)
        const wrapped = now < highest
        highest = Math.max(highest, now)
        return wrapped
      },
      // Often: a lap is a second, and polling once a second would see the
      // same frame every lap.
      { timeout: 4000, intervals: [50] }
    )
    .toBe(true)
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
})
