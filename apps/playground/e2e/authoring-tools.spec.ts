import { expect, test } from '@playwright/test'
import { openFixture } from './support.ts'

/** @greese/authoring's Toolbar in real engines: the flyout is a top-layer popover. */
test.beforeEach(({ page }) =>
  openFixture(page, 'authoring-tools', (p) => p.getByRole('toolbar', { name: 'Tools' }))
)

test('one tab stop; the arrows move along the tools', async ({ page }) => {
  await page.getByRole('heading', { name: 'Tools' }).click()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Select' })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('button', { name: 'Rectangle' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('textbox', { name: 'Name' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('button', { name: 'Rectangle' })).toBeFocused()
})

test('the arrow across opens a group’s flyout, and Escape comes back', async ({
  page,
}) => {
  const group = page.getByRole('button', { name: 'Rectangle' })
  await group.focus()
  await page.keyboard.press('ArrowRight')
  const ellipse = page.getByRole('menuitem', { name: 'Ellipse (E)' })
  await expect(ellipse).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Rectangle (R)' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(ellipse).toBeHidden()
  await expect(group).toBeFocused()
})

test('choosing from the flyout picks the tool and shows it on the group', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Shapes tools' }).click()
  await page.getByRole('menuitem', { name: 'Ellipse (E)' }).click()
  await expect(page.getByTestId('active')).toHaveText('Active: ellipse')
  const group = page.getByRole('button', { name: 'Ellipse' })
  await expect(group).toHaveAttribute('aria-pressed', 'true')
  await expect(group).toBeFocused()
})

test('hotkeys pick tools, except while typing', async ({ page }) => {
  await page.getByRole('heading', { name: 'Tools' }).click()
  await page.keyboard.press('s')
  await expect(page.getByTestId('active')).toHaveText('Active: star')
  await page.getByRole('textbox', { name: 'Name' }).fill('v')
  await expect(page.getByTestId('active')).toHaveText('Active: star')
})
