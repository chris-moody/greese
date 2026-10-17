import { expect, test, type Page } from '@playwright/test'

/**
 * Real-browser check of the theming model (docs/adr/0002): nested themes and
 * schemes, OS preference, page scheme forced on <html>, and persistence.
 */
const ACCENT = {
  default: { light: 'rgb(37, 99, 235)', dark: 'rgb(96, 165, 250)' },
  brand: { light: 'rgb(124, 58, 237)', dark: 'rgb(196, 181, 253)' },
}
const SURFACE = {
  default: { light: 'rgb(245, 246, 248)', dark: 'rgb(20, 24, 29)' },
  brand: 'rgb(254, 243, 199)', // single value: same in both schemes
}

type Mode = 'light' | 'dark'

const read = (page: Page, id: string) =>
  page.getByTestId(id).evaluate((el) => {
    const s = getComputedStyle(el)
    return { accent: s.color, surface: s.backgroundColor, radius: s.borderRadius }
  })

/** What every probe should resolve to, given the page's effective scheme. */
const expected = (page: Mode, os: Mode) => ({
  default: {
    accent: ACCENT.default[page],
    surface: SURFACE.default[page],
    radius: '8px',
  },
  'plain-dark': {
    accent: ACCENT.default.dark,
    surface: SURFACE.default.dark,
    radius: '8px',
  },
  brand: { accent: ACCENT.brand[page], surface: SURFACE.brand, radius: '8px' },
  'brand-dark': { accent: ACCENT.brand.dark, surface: SURFACE.brand, radius: '8px' },
  // Themes replace, never stack: `rounded` inside `brand` is defaults + rounded.
  'rounded-in-dark': {
    accent: ACCENT.default.dark,
    surface: SURFACE.default.dark,
    radius: '2px',
  },
  'brand-light-in-dark': {
    accent: ACCENT.brand.light,
    surface: SURFACE.brand,
    radius: '8px',
  },
  // scheme="system" follows the OS even when the page scheme is forced.
  'brand-system': { accent: ACCENT.brand[os], surface: SURFACE.brand, radius: '8px' },
})

const assertAll = async (page: Page, pageMode: Mode, os: Mode) => {
  for (const [id, want] of Object.entries(expected(pageMode, os))) {
    expect(await read(page, id), `${id} (page ${pageMode}, OS ${os})`).toEqual(want)
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
})

for (const os of ['light', 'dark'] as const) {
  test(`OS ${os}: page follows the OS, then honours a forced scheme`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: os })
    await page.reload()
    await expect(page.getByTestId('resolved')).toHaveText(os)
    await assertAll(page, os, os)

    for (const forced of ['light', 'dark'] as const) {
      await page.getByRole('button', { name: forced, exact: true }).click()
      await expect(page.getByTestId('scheme')).toHaveText(forced)
      expect(
        await page.evaluate(() => document.documentElement.dataset.sauceScheme)
      ).toBe(forced)
      await assertAll(page, forced, os)
    }

    await page.getByRole('button', { name: 'system', exact: true }).click()
    await expect(page.getByTestId('scheme')).toHaveText('system')
    await assertAll(page, os, os)
  })
}

test('a saved scheme is applied before first paint on reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.getByRole('button', { name: 'dark', exact: true }).click()

  // Record the attribute as the very first script sees it, before React runs.
  await page.addInitScript(() => {
    document.addEventListener('readystatechange', () => {
      ;(window as unknown as { early?: string }).early ??=
        document.documentElement.dataset.sauceScheme
    })
  })
  await page.reload()
  expect(await page.evaluate(() => (window as unknown as { early?: string }).early)).toBe(
    'dark'
  )
  await assertAll(page, 'dark', 'light')
})

test('theme CSS is injected once per theme, in <head>', async ({ page }) => {
  const hrefs = await page
    .locator('head style[data-href^="sauce-theme-"]')
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-href')))
  expect(hrefs.sort()).toEqual(['sauce-theme-brand', 'sauce-theme-rounded'])
})
