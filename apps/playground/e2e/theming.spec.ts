import { expect, test, type Page } from '@playwright/test'
import { color, palette, radius } from '@greese/ui'
import { rgb } from './support.ts'

/**
 * Real-browser check of the theming model (docs/adr/0002): nested themes and
 * schemes, OS preference, page scheme forced on <html>, and persistence.
 */
const PRIMARY = {
  default: { light: rgb(color.primary.light), dark: rgb(color.primary.dark) },
  brand: { light: rgb(palette.lavender[600]), dark: rgb(palette.lavender[300]) },
}
const SURFACE = {
  default: { light: rgb(color.surface.light), dark: rgb(color.surface.dark) },
  brand: rgb(palette.gold[100]), // single value: same in both schemes
}

type Mode = 'light' | 'dark'

const read = (page: Page, id: string) =>
  page.getByTestId(id).evaluate((el) => {
    const s = getComputedStyle(el)
    return { primary: s.color, surface: s.backgroundColor, radius: s.borderRadius }
  })

/** What every probe should resolve to, given the page's effective scheme. */
const expected = (page: Mode, os: Mode) => ({
  default: {
    primary: PRIMARY.default[page],
    surface: SURFACE.default[page],
    radius: radius.md,
  },
  'plain-dark': {
    primary: PRIMARY.default.dark,
    surface: SURFACE.default.dark,
    radius: radius.md,
  },
  brand: { primary: PRIMARY.brand[page], surface: SURFACE.brand, radius: radius.md },
  'brand-dark': {
    primary: PRIMARY.brand.dark,
    surface: SURFACE.brand,
    radius: radius.md,
  },
  // Themes replace, never stack: `rounded` inside `brand` is defaults + rounded.
  'rounded-in-dark': {
    primary: PRIMARY.default.dark,
    surface: SURFACE.default.dark,
    radius: '2px',
  },
  'brand-light-in-dark': {
    primary: PRIMARY.brand.light,
    surface: SURFACE.brand,
    radius: radius.md,
  },
  // scheme="system" follows the OS even when the page scheme is forced.
  'brand-system': {
    primary: PRIMARY.brand[os],
    surface: SURFACE.brand,
    radius: radius.md,
  },
})

const assertAll = async (page: Page, pageMode: Mode, os: Mode) => {
  for (const [id, want] of Object.entries(expected(pageMode, os))) {
    expect(await read(page, id), `${id} (page ${pageMode}, OS ${os})`).toEqual(want)
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/?page=theming')
  await page.evaluate(() => localStorage.clear())
  await page.getByTestId('default').waitFor()
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
        await page.evaluate(() => document.documentElement.dataset.greeseScheme)
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
        document.documentElement.dataset.greeseScheme
    })
  })
  await page.reload()
  expect(await page.evaluate(() => (window as unknown as { early?: string }).early)).toBe(
    'dark'
  )
  await assertAll(page, 'dark', 'light')
})
