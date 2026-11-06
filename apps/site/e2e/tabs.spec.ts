import { expect, test } from '@playwright/test'

test('the Motion tab holds the effects and their stage; there is no Greese tab', async ({
  page,
}) => {
  await page.goto('/studio')
  await expect(page.getByRole('tab', { name: 'Greese' })).toHaveCount(0)
  await page.getByRole('tab', { name: 'Motion' }).click()
  await expect(page.getByRole('heading', { name: 'Effects', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Component defaults' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Compose a sequence' })).toBeVisible()
  await expect(page.locator('.studio-preview-frame')).toBeHidden()
  await page.getByRole('tab', { name: 'Tokens' }).click()
  await expect(page.locator('.studio-preview-frame')).toBeVisible()
})

test('the Output tab colours its code', async ({ page }) => {
  await page.goto('/studio')
  await page.getByRole('tab', { name: 'Output' }).click()
  const scss = page.locator('.studio-highlighted').first()
  await expect(scss.locator('.tok-at').first()).toBeVisible()
  await expect(scss).toContainText('@use')
})
