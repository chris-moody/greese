import { expect, test, type Page } from '@playwright/test'

/** greese.js in real engines: computed-style reads, transforms, colours, playback. */
test.beforeEach(async ({ page }) => {
  await page.goto('/?page=motion')
  await page.waitForFunction(() => window.motion !== undefined)
})

const styleOf = (page: Page, id: string, ...props: string[]) =>
  page.getByTestId(id).evaluate((el, names) => {
    const s = getComputedStyle(el)
    return Object.fromEntries(names.map((n) => [n, s.getPropertyValue(n).trim()]))
  }, props)

test('seeks: reads computed starting values and writes transforms, colours and variables', async ({
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
    '--greese-color-accent'
  )
  expect(end.translate).toBe('50px')
  expect(end['background-color']).toBe('rgb(0, 0, 255)')
  expect(end['--greese-color-accent']).toMatch(/^rgb\(0 255 0 \/ 1\)$/)
  // Components read the animated token: the button's tone follows it (after
  // the button's own colour transition).
  const button = page.getByRole('button', { name: 'Accent' })
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

test('plays on the real clock, reverses and scales time', async ({ page }) => {
  const start = Date.now()
  await page.evaluate(async () => {
    window.motion!.timeScale(4).play()
    await window.motion!
  })
  // 1 s of timeline at 4x: about 0.25 s of real time.
  expect(Date.now() - start).toBeLessThan(900)
  expect(await page.evaluate(() => window.motion!.progress())).toBe(1)
  await page.evaluate(async () => {
    window.motion!.reverse()
    await window.motion!
  })
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
