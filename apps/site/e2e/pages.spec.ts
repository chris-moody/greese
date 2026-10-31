import { expect, test } from '@playwright/test'

/**
 * Theme Studio's page transitions (ADR 0029): the Motion tab edits a theme's
 * page roles and rules, its stage plays them, and the Code tab writes them.
 */
test('the Motion tab edits page transitions, its stage plays them, and the code has them', async ({
  page,
}) => {
  // The snapshot animations view transitions play, as each starts: on a busy
  // machine, `getAnimations()` at `ready` runs after the short ones are gone.
  await page.addInitScript(() => {
    const w = window as Window & { played?: string[] }
    document.addEventListener(
      'animationstart',
      (e) => {
        if (
          e.pseudoElement.startsWith('::view-transition') &&
          e.animationName.startsWith('greese-')
        )
          (w.played ??= []).push(e.animationName)
      },
      true
    )
  })
  await page.goto('/studio?tab=motion')
  await expect(page.getByRole('heading', { name: 'Pages', exact: true })).toBeVisible()
  await page.getByLabel('page-exit', { exact: true }).fill('scale-out')
  await page.getByLabel('page', { exact: true }).fill('pop-in')
  await page.getByLabel('Add a part of the page').fill('.studio-stage-pages p')
  await page.getByRole('button', { name: 'Add', exact: true }).last().click()
  await expect(page.locator('code', { hasText: '.studio-stage-pages p' })).toBeVisible()
  // The part's own exit; what it leaves out follows the page's roles.
  await page.getByLabel('exit', { exact: true }).fill('fade-out')

  const stage = page.locator('.studio-stage-pages')
  await stage.getByRole('button', { name: 'Next' }).click()
  await expect(stage).toContainText('Details')
  await expect
    .poll(() => page.evaluate(() => (window as Window & { played?: string[] }).played))
    .toEqual(
      expect.arrayContaining(['greese-scale-out', 'greese-pop-in', 'greese-fade-out'])
    )

  await page.getByRole('tab', { name: 'Code' }).click()
  const code = page.locator('.studio-highlighted').first()
  await expect(code).toContainText('page-exit: "scale-out"')
  await expect(code).toContainText('@include greese.page-transitions(')
  await expect(code).toContainText('".studio-stage-pages p"')
})
