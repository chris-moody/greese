import { expect, test, type Page } from '@playwright/test'
import { computed } from './support.ts'

/** greese.js in real engines: computed-style reads, transforms, colors, playback. */
test.beforeEach(async ({ page }) => {
  await page.goto('/?page=motion')
  await page.waitForFunction(() => window.motion !== undefined)
})

const styleOf = <P extends string>(page: Page, id: string, ...props: P[]) =>
  computed(page.getByTestId(id), ...props)

test('seeks: reads computed starting values and writes transforms, colors and variables', async ({
  page,
}) => {
  await page.evaluate(() => {
    window.motion!.seek(0.5)
  })
  expect(await styleOf(page, 'box', 'translate', 'rotate')).toEqual({
    translate: '30px',
    rotate: '45deg',
  })
  await page.evaluate(() => {
    window.motion!.progress(1)
  })
  const end = await styleOf(
    page,
    'box',
    'translate',
    'background-color',
    '--greese-color-primary'
  )
  expect(end.translate).toBe('50px')
  expect(end['background-color']).toBe('rgb(0, 0, 255)')
  expect(end['--greese-color-primary']).toMatch(/^rgb\(0 255 0 \/ 1\)$/)
  // Components read the animated token: the button's tone follows it (after
  // the button's own color transition).
  const button = page.getByRole('button', { name: 'Primary' })
  await expect
    .poll(() => button.evaluate((el) => getComputedStyle(el).backgroundColor))
    .toBe('rgb(0, 255, 0)')
  await expect(page.getByTestId('count')).toHaveText('100')
  // Back to the start: original values return.
  await page.evaluate(() => {
    window.motion!.seek(0)
  })
  expect((await styleOf(page, 'box', 'background-color'))['background-color']).toBe(
    'rgb(255, 0, 0)'
  )
})

test('plays on the clock, reverses and scales time', async ({ page }) => {
  // The page's clock, faked from load: time moves only when the test says.
  await page.clock.install()
  await page.reload()
  await page.waitForFunction(() => window.motion !== undefined, null, { polling: 50 })
  // An installed clock still runs at real speed until paused; the fixture's
  // timeline is paused, so jumping ahead starts nothing.
  await page.clock.pauseAt(Date.now() + 60_000)
  await page.evaluate(() => {
    window.motion!.timeScale(4).play()
  })
  // 1 s of timeline at 4x: 0.1 s of clock is about 0.4 s of it (less the
  // frame playback waits for), and 0.3 s all of it. At 1x it would be 0.1.
  await page.clock.runFor(100)
  const early = await page.evaluate(() => window.motion!.progress())
  expect(early).toBeGreaterThan(0.3)
  expect(early).toBeLessThanOrEqual(0.4)
  await page.clock.runFor(200)
  expect(await page.evaluate(() => window.motion!.progress())).toBe(1)
  await page.evaluate(() => {
    window.motion!.reverse()
  })
  await page.clock.runFor(300)
  expect(await page.evaluate(() => window.motion!.time())).toBe(0)
  expect((await styleOf(page, 'box', 'translate')).translate).toBe('10px')
})

test('split text stays one readable string for assistive technology', async ({
  page,
}) => {
  const label = page.getByTestId('label')
  await expect(label.locator('[aria-hidden="true"] span span')).toHaveCount(10)
  // The accessible name is the original sentence, not ten letters.
  expect(
    await label.evaluate((el) => (el.firstElementChild as HTMLElement).textContent)
  ).toBe('Hello world')
  await page.evaluate(() => {
    window.motion!.seek(0)
  })
  const first = label.locator('[aria-hidden="true"] span span').first()
  expect(await first.evaluate((el) => getComputedStyle(el).opacity)).toBe('0')
})

test('split text keeps its markup: the link is still a named, working link', async ({
  page,
}) => {
  const linked = page.getByTestId('linked')
  await expect(linked.locator('[aria-hidden="true"] > span')).toHaveCount(4)
  const link = page.getByRole('link', { name: 'the docs' })
  await expect(link.locator('[aria-hidden="true"] > span')).toHaveCount(2)
  await link.click()
  await expect(page).toHaveURL(/#docs$/)
})

test('typing writes into the text nodes in reading order, keeping markup', async ({
  page,
}) => {
  const typed = page.getByTestId('typed')
  const at = async (p: number) => {
    await page.evaluate((progress) => {
      window.typed!.progress(progress)
    }, p)
    return typed.evaluate((el) => el.innerHTML)
  }
  expect(await at(0.25)).toBe('Type <em></em>')
  expect(await at(0.75)).toBe('Type into <em>emph</em>')
  expect(await at(1)).toBe('Type into <em>emphasis</em>')
})

test('mixed units blend smoothly: a px radius token to rem, a px width to vw', async ({
  page,
}) => {
  const at = async (p: number) => {
    await page.evaluate((progress) => {
      window.units!.progress(progress)
    }, p)
    return page.getByTestId('units').evaluate((el) => {
      const s = getComputedStyle(el)
      return { radius: parseFloat(s.borderTopLeftRadius), width: parseFloat(s.width) }
    })
  }
  const vw = await page.evaluate(() => innerWidth)
  const rem = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.documentElement).fontSize)
  )
  expect(await at(0)).toEqual({ radius: 16, width: 100 })
  // Halfway: exactly between, with no jump (16px → 2rem, 100px → 50vw).
  const mid = await at(0.5)
  expect(mid.radius).toBeCloseTo((16 + 2 * rem) / 2, 1)
  expect(mid.width).toBeCloseTo((100 + vw / 2) / 2, 0)
  const quarter = await at(0.25)
  expect(quarter.radius).toBeCloseTo(16 * 0.75 + 2 * rem * 0.25, 1)
  expect(await at(1)).toEqual({ radius: 2 * rem, width: vw / 2 })
})

test('useGreese scopes selectors, applies its build before paint and reverts on unmount', async ({
  page,
}) => {
  // Found by its text, not `.hook-item`: that's the selector under test.
  const item = (id: string) => page.getByTestId(id).getByText(id, { exact: true })
  const opacity = (id: string) =>
    item(id).evaluate((el) => Number(getComputedStyle(el).opacity))
  // A 10 s linear from(): only just started, so it was applied up front.
  expect(await opacity('hook-a')).toBeLessThan(0.2)
  await page.getByRole('button', { name: 'Pulse hook-a' }).click()
  await expect
    .poll(() => item('hook-a').evaluate((el) => parseFloat(el.style.scale)))
    .toBe(1.5)
  // The other instance's matching element is out of scope.
  expect(await item('hook-b').evaluate((el) => el.style.scale)).toBe('')
  await item('hook-a').evaluate(
    (el) => ((window as { hookItem?: Element }).hookItem = el)
  )
  await page.getByRole('button', { name: 'Unmount hook-a' }).click()
  const left = await page.evaluate(() => {
    const el = (window as unknown as { hookItem: HTMLElement }).hookItem
    return { scale: el.style.scale, opacity: Number(el.style.opacity || 1) }
  })
  expect(parseFloat(left.scale || '1')).toBe(1)
  expect(left.opacity).toBe(1)
})
