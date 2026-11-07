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
  await expect(page.getByText('23 / 24')).toBeVisible({ timeout: 3000 })
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
})

test('pauses where it is', async ({ page }) => {
  await page.getByRole('button', { name: 'Play' }).click()
  await expect.poll(() => frame(page)).toBeGreaterThan(2)
  await page.getByRole('button', { name: 'Pause' }).click()
  const at = await frame(page)
  await page.waitForTimeout(300)
  expect(await frame(page)).toBe(at)
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
