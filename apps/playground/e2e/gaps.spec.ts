import { expect, test, type Page } from '@playwright/test'
import { atLeast, openFixture, settled } from './support.ts'

/** Phase 7 components in real engines. */
test.beforeEach(({ page }) =>
  openFixture(page, 'gaps', (p) => p.getByRole('combobox', { name: 'Country' }))
)

const wide = (page: Page) => atLeast(page, 'md')

test('combobox: type to filter, arrows and Enter select, popup anchored at full width', async ({
  page,
}) => {
  const input = page.getByRole('combobox', { name: 'Country' })
  await input.fill('ne')
  const listbox = page.getByRole('listbox')
  await expect(listbox).toBeVisible()
  await expect(page.getByRole('option')).toHaveText(['New Zealand'])

  const field = (await input.locator('..').boundingBox())!
  const popup = (await listbox.locator('..').boundingBox())!
  expect(popup.y).toBeGreaterThanOrEqual(field.y + field.height)
  expect(popup.width).toBeGreaterThanOrEqual(field.width - 1)

  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(input).toHaveValue('New Zealand')
  await expect(page.getByTestId('country')).toHaveText('nz')
  await expect(listbox).toBeHidden()
})

test('combobox: arrows open the full list, skip disabled options, Escape closes', async ({
  page,
}) => {
  const input = page.getByRole('combobox', { name: 'Country' })
  await input.focus()
  await page.keyboard.press('ArrowUp')
  await expect(page.getByRole('option')).toHaveCount(5)
  const active = () =>
    input.evaluate(
      (el) =>
        document.getElementById(el.getAttribute('aria-activedescendant')!)?.textContent
    )
  expect(await active()).toBe('New Zealand')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('listbox')).toBeHidden()
  await expect(input).toBeFocused()
})

test('segmented control: native arrow keys move the selection', async ({ page }) => {
  await page.getByRole('radio', { name: 'List' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('radio', { name: 'Grid' })).toBeChecked()
  await expect(page.getByRole('radio', { name: 'Grid' })).toBeFocused()
})

test('table: stacked cards on phones, a real table above sm', async ({ page }) => {
  const display = await page
    .getByTestId('row')
    .evaluate((el) => getComputedStyle(el).display)
  const label = await page
    .getByTestId('cell')
    .evaluate((el) => getComputedStyle(el, '::before').content)
  if (!atLeast(page, 'sm')) {
    expect(display).toBe('block')
    expect(label).toBe('"Number"')
  } else {
    expect(display).toBe('table-row')
  }
  // Table semantics survive either way.
  await expect(page.getByRole('table', { name: 'Invoices' })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'INV-001' })).toBeVisible()
})

/**
 * Drags the drawer header toward its edge. `distance` is capped just inside
 * the viewport (engines stop sending pointer moves beyond it); `slow` paces
 * the moves so the release isn't read as a flick.
 */
const dragHeader = async (page: Page, distance: number, slow = false) => {
  const header = page.getByRole('heading', { name: 'Filters' })
  const box = (await header.boundingBox())!
  const { width, height } = page.viewportSize()!
  const [x, y] = [box.x + box.width / 2, box.y + box.height / 2]
  const room = wide(page) ? width - x - 2 : height - y - 2
  const travel = Math.min(distance, room)
  const steps = 12
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (let i = 1; i <= steps; i++) {
    const d = (travel * i) / steps
    await page.mouse.move(wide(page) ? x + d : x, wide(page) ? y : y + d)
    // Paces the hand, not a wait: a fast release would read as a flick.
    if (slow) await page.waitForTimeout(40)
  }
  await page.mouse.up()
}

test('drawer: a short drag snaps back, a long drag dismisses', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === 'iphone',
    'mobile WebKit has no mouse pointer to drag with'
  )
  await page.getByRole('button', { name: 'Open sheet' }).click()
  const drawer = page.getByRole('dialog', { name: 'Filters' })
  await expect(drawer).toBeVisible()
  await settled(drawer)
  const rest = (await drawer.boundingBox())!

  await dragHeader(page, 30, true)
  // Snapped back: visible, and where it rested before the drag.
  await settled(drawer)
  await expect(drawer).toBeVisible()
  const back = (await drawer.boundingBox())!
  expect(back.x).toBeCloseTo(rest.x, 0)
  expect(back.y).toBeCloseTo(rest.y, 0)

  await dragHeader(page, 600)
  await expect(drawer).toBeHidden()
  await expect(page.getByRole('button', { name: 'Open sheet' })).toBeFocused()
})
