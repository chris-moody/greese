import { expect, test } from '@playwright/test'

test('section links land with their section just below the sticky header', async ({
  page,
}) => {
  await page.goto('/')
  const menu = page.getByRole('dialog', { name: 'Homepage sections' })
  for (const name of ['Why', 'Speed', 'Components']) {
    // The sections are in the wordmark's menu, not the row.
    if (!(await menu.isVisible())) await page.locator('.site-home-toggle').click()
    await menu.getByRole('link', { name, exact: true }).click()
    await expect
      .poll(() =>
        page.evaluate((id) => {
          // Sections mount a few at a time: one not there yet is far away.
          const section = document.getElementById(id)
          if (!section) return Infinity
          const header = document
            .querySelector('.greese-Header')!
            .getBoundingClientRect().bottom
          return Math.abs(section.getBoundingClientRect().top - header)
        }, name.toLowerCase())
      )
      .toBeLessThan(2)
  }
})

test('the wordmark goes home and its arrow opens the sections on hover; the row keeps the pages', async ({
  page,
}) => {
  await page.goto('/templates')
  await expect(page.locator('.site-nav-links a')).toHaveText([
    'Docs',
    'Studio',
    'Templates',
  ])
  await page.locator('.site-home-toggle').hover()
  const menu = page.getByRole('dialog', { name: 'Homepage sections' })
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('link')).toHaveText([
    'Why',
    'Size',
    'Speed',
    'Motion',
    'Components',
  ])
  // Crossing to the menu keeps it open; leaving both closes it.
  await menu.getByRole('link', { name: 'Speed' }).hover()
  await expect(menu).toBeVisible()
  await page.mouse.move(900, 600)
  await expect(menu).toBeHidden()

  // Hovered open, a click on the arrow keeps it open; another closes it.
  await page.locator('.site-home-toggle').hover()
  await expect(menu).toBeVisible()
  await page.locator('.site-home-toggle').click()
  await page.mouse.move(900, 600)
  await expect(menu).toBeVisible()
  await page.locator('.site-home-toggle').click()
  await expect(menu).toBeHidden()

  await page.locator('.site-home').getByRole('link', { name: 'greese' }).click()
  await expect(page).toHaveURL(/localhost:\d+\/$/)
  // The homepage has the menu too.
  await expect(page.locator('.site-home-toggle')).toBeVisible()
})

test('search opens a dialog: typing filters, the arrows move, Enter opens', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Search' }).click()
  const dialog = page.getByRole('dialog', { name: 'Search' })
  const field = dialog.getByRole('combobox', { name: 'Search' })
  await expect(field).toBeFocused()
  // Nothing typed: the site's pages and sections.
  await expect(dialog.getByRole('option').first()).toHaveText(/Home/)

  await field.fill('fin')
  await expect(dialog.getByRole('option', { selected: true })).toHaveText(/Finance/)
  await field.fill('accordion')
  await expect(dialog.getByRole('option').first()).toHaveText(/^Accordion/)
  await field.press('ArrowDown')
  await expect(dialog.getByRole('option', { selected: true })).toHaveText(
    /^AccordionItem/
  )
  await field.fill('zzzz')
  await expect(dialog.getByRole('status')).toHaveText('No results for “zzzz”')

  await field.fill('finance')
  await field.press('Enter')
  await expect(page).toHaveURL(/\/templates\/finance$/)
  await expect(dialog).toBeHidden()

  // The shortcut opens it again, with the pick under Recent.
  await page.keyboard.press('ControlOrMeta+k')
  await expect(dialog).toBeVisible()
  await field.fill('')
  await expect(dialog.getByRole('group', { name: 'Recent' })).toContainText('Finance')
})

test('a link to a studio tab opens that tab, from the studio itself too', async ({
  page,
}) => {
  await page.goto('/studio')
  await expect(page.getByRole('tab', { name: 'Tokens' })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  await page.getByRole('button', { name: 'Search' }).click()
  const field = page.getByRole('combobox', { name: 'Search' })
  await field.fill('compiled')
  await field.press('Enter')
  await expect(page).toHaveURL(/\/studio\?tab=code$/)
  await expect(page.getByRole('tab', { name: 'Code' })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  await page.goBack()
  await expect(page.getByRole('tab', { name: 'Tokens' })).toHaveAttribute(
    'aria-selected',
    'true'
  )
})

test('the studio editor is headed by Inspect, Import and Save', async ({ page }) => {
  await page.goto('/studio')
  const editor = page.getByRole('complementary', { name: 'Theme editor' })
  await expect(editor.getByRole('switch', { name: 'Inspect' })).toBeVisible()
  await expect(editor.getByRole('button', { name: 'Save' })).toBeVisible()
  await expect(
    page.locator('.site-nav').getByRole('button', { name: 'Save' })
  ).toHaveCount(0)
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 760 } })

  test('the scheme is a select in the bar, and the menu is the pages over their sections', async ({
    page,
  }) => {
    await page.goto('/studio')
    await expect(page.locator('.site-home-toggle')).toHaveCount(0)
    // GitHub and search stay in the bar.
    await expect(
      page.locator('.site-nav').getByRole('link', { name: 'GitHub' })
    ).toBeVisible()
    await expect(
      page.locator('.site-nav').getByRole('button', { name: 'Search' })
    ).toBeVisible()
    const scheme = page.getByRole('combobox', { name: 'Color scheme' })
    await scheme.selectOption('dark')
    await expect(page.locator('html')).toHaveAttribute('data-greese-scheme', 'dark')

    await page.getByRole('button', { name: 'Menu' }).click()
    const menu = page.getByRole('dialog', { name: 'Menu' })
    // The whole screen, once it has slid in.
    await expect.poll(async () => Math.round((await menu.boundingBox())!.width)).toBe(375)
    await expect(menu.getByRole('link', { name: 'GitHub' })).toHaveCount(0)
    // The page on screen is open. A row's name goes to the page; the rest of
    // the row opens what's on it. No list repeats its page's own link.
    await expect(menu.getByRole('link', { name: 'Code' })).toBeVisible()
    await expect(menu.getByRole('link', { name: 'Finance' })).toBeHidden()
    await expect(
      menu.getByRole('link', { name: /^(All docs|All templates|Theme Studio)$/ })
    ).toHaveCount(0)
    const toggle = menu.getByRole('button', { name: /^Templates/ })
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(menu.getByRole('link', { name: 'Finance' })).toBeVisible()
    await expect(page).toHaveURL(/\/studio$/)
    await menu.getByRole('link', { name: 'Templates', exact: true }).click()
    await expect(page).toHaveURL(/\/templates$/)
    await expect(menu).toBeHidden()
  })
})
