import { expect, test } from '@playwright/test'

test('VisuallyHidden is hidden on screen but names its button', async ({ page }) => {
  await page.goto('/?page=theming')
  const button = page.getByRole('button', { name: 'Close' })
  await expect(button).toBeVisible()

  const box = await page.getByText('Close').boundingBox()
  expect(box?.width).toBeLessThanOrEqual(1)
  expect(box?.height).toBeLessThanOrEqual(1)
})
