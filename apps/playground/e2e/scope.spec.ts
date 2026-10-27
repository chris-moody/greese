import { expect, test, type Page } from '@playwright/test'
import { openFixture } from './support.ts'

/**
 * Scopes (docs/adr/0017): a parent that decides when the entrances inside it
 * start, across depth, played by CSS. Long durations keep the animations
 * running while they're measured.
 */
test.beforeEach(({ page }) => openFixture(page, 'motion', (p) => p.getByTestId('enter')))

const delay = (page: Page, testId: string) =>
  page.getByTestId(testId).evaluate((el) => getComputedStyle(el).animationDelay)

test('a scope starts its entrances in order, nested scopes included', async ({
  page,
}) => {
  // Outer: delay 1s, 0.5s apart. Its members are First (slot 0), the inner
  // scope (slot 1) and Last (slot 2); the inner scope's own members follow
  // the inner position, 0.1s apart.
  await expect.poll(() => delay(page, 'scope-a')).toBe('1s')
  expect(await delay(page, 'scope-x')).toBe('1.5s')
  expect(await delay(page, 'scope-y')).toBe('1.6s')
  expect(await delay(page, 'scope-b')).toBe('2s')
})

test('a scope held until in view keeps its entrances at their first frame', async ({
  page,
}) => {
  const scope = page.getByTestId('scope-held')
  await expect(scope).toHaveAttribute('data-greese-scope', 'pending')
  expect(
    await page
      .getByTestId('held-a')
      .evaluate((el) => getComputedStyle(el).animationPlayState)
  ).toBe('paused')
  await scope.scrollIntoViewIfNeeded()
  await expect(scope).not.toHaveAttribute('data-greese-scope', 'pending')
  await expect
    .poll(() =>
      page.getByTestId('held-a').evaluate((el) => getComputedStyle(el).animationPlayState)
    )
    .toBe('running')
})
