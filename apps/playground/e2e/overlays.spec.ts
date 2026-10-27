import { expect, test, type Page } from '@playwright/test'
import { atLeast, isTouch, openFixture, settled } from './support.ts'

/** Native top-layer behaviour (dialog, popover) and navigation, in real engines. */
test.beforeEach(({ page }) =>
  openFixture(page, 'overlays', (p) => p.getByTestId('appbar'))
)

const wide = (page: Page) => atLeast(page, 'md')

test('dialog: traps focus, blocks the page, locks scroll, and returns focus on Escape', async ({
  page,
}) => {
  const trigger = page.getByRole('button', { name: 'Open dialog' })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Edit profile' })
  await expect(dialog).toBeVisible()
  expect(
    await page.evaluate(() => getComputedStyle(document.documentElement).overflow)
  ).toBe('hidden')
  // The scrim covers the whole screen (the backdrop hit-tests as its dialog).
  expect(
    await page.evaluate(
      () =>
        document.elementFromPoint(innerWidth - 1, innerHeight / 2)?.closest('dialog') !==
        null
    )
  ).toBe(true)

  // Tab past the end: focus may pass through the browser's own UI (body), as
  // native modals do, but never reaches the page behind.
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab')
    const where = await page.evaluate(() =>
      document.activeElement === document.body
        ? 'browser'
        : document.activeElement?.closest('dialog')
          ? 'dialog'
          : 'page'
    )
    expect(where).not.toBe('page')
  }
  // The page behind is inert: clicks fall through to the backdrop.
  const outside = (await page.getByTestId('outside').boundingBox())!
  expect(
    await page.evaluate(
      ([x, y]) => document.elementFromPoint(x!, y!)?.getAttribute('data-testid'),
      [outside.x + 5, outside.y + 5]
    )
  ).not.toBe('outside')

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
  expect(
    await page.evaluate(() => getComputedStyle(document.documentElement).overflow)
  ).not.toBe('hidden')
})

test('dialog: the backdrop, Escape and the close button each dismiss it', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Open dialog' }).click()
  await page.mouse.click(5, 5)
  await expect(page.getByRole('dialog', { name: 'Edit profile' })).toBeHidden()

  const terms = page.getByRole('dialog', { name: 'Accept terms' })
  await page.getByRole('button', { name: 'Open terms' }).click()
  await page.keyboard.press('Escape')
  await expect(terms).toBeHidden()
  await page.getByRole('button', { name: 'Open terms' }).click()
  await terms.getByRole('button', { name: 'Close' }).click()
  await expect(terms).toBeHidden()
  await page.getByRole('button', { name: 'Open terms' }).click()
  await terms.getByRole('button', { name: 'I accept' }).click()
  await expect(terms).toBeHidden()
})

test('drawer: bottom sheet on phones, side panel from md', async ({ page }) => {
  await page.getByRole('button', { name: 'Open drawer' }).click()
  const drawer = page.getByRole('dialog', { name: 'Filters' })
  await expect(drawer).toBeVisible()
  await settled(drawer) // the slide-in has finished
  const box = (await drawer.boundingBox())!
  const { width, height } = page.viewportSize()!
  if (wide(page)) {
    expect(box.x + box.width).toBeCloseTo(width, 0)
    expect(box.height).toBeCloseTo(height, 0)
  } else {
    expect(box.y + box.height).toBeCloseTo(height, 0)
    expect(box.width).toBeCloseTo(width, 0)
  }
})

test('popover: anchored below its trigger, dismissed by clicking outside', async ({
  page,
}) => {
  const trigger = page.getByRole('button', { name: 'Open popover' })
  await trigger.click()
  const popover = page.getByTestId('popover')
  await expect(popover).toBeVisible()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  const t = (await trigger.boundingBox())!
  const p = (await popover.boundingBox())!
  expect(p.y).toBeGreaterThanOrEqual(t.y + t.height)
  expect(p.x).toBeCloseTo(t.x, 0)
  await page.getByTestId('outside').click()
  await expect(popover).toBeHidden()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
})

test('menu: keyboard open, arrows, Enter selects, Escape returns focus', async ({
  page,
}) => {
  const trigger = page.getByRole('button', { name: 'Actions' })
  await trigger.focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('menuitem', { name: 'Rename' })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('selected')).toHaveText('archive')
  await expect(page.getByRole('menu')).toBeHidden()

  await trigger.focus()
  await page.keyboard.press('ArrowUp')
  await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('tooltip: appears after a hover delay, flipping below when there is no room above', async ({
  page,
}) => {
  test.skip(isTouch(), 'hover tooltips are mouse-only')
  const trigger = page.getByRole('button', { name: 'Help' })
  const tip = page.getByRole('tooltip')
  await expect(trigger).toHaveAccessibleDescription('Opens the help centre')
  await trigger.hover()
  await expect(tip).toBeVisible()
  // The trigger is in the top bar: no room above, so flip-block puts it below.
  const t = (await trigger.boundingBox())!
  const b = (await tip.boundingBox())!
  expect(b.y).toBeGreaterThanOrEqual(t.y + t.height - 1)
  await page.keyboard.press('Escape')
  await expect(tip).toBeHidden()
})

test('toasts appear above an open modal and stay usable (not inert)', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Open dialog' }).click()
  await page
    .getByRole('dialog', { name: 'Edit profile' })
    .getByRole('button', { name: 'Toast' })
    .click()
  const item = page.locator('.greese-Toast', { hasText: 'Saved from dialog' })
  await expect(item).toBeVisible()
  const box = (await item.boundingBox())!
  const onTop = await page.evaluate(
    ([x, y]) => !!document.elementFromPoint(x!, y!)?.closest('.greese-Toast'),
    [box.x + box.width / 2, box.y + box.height / 2]
  )
  expect(onTop).toBe(true)
  await item.getByRole('button', { name: 'Dismiss' }).click()
  await expect(item).toBeHidden()
  await expect(page.getByRole('dialog', { name: 'Edit profile' })).toBeVisible()
})

test('sidebar: off-canvas with a trigger on phones, persistent from md', async ({
  page,
}) => {
  const sidebar = page.getByTestId('sidebar')
  const trigger = page.getByRole('button', { name: 'Open navigation' })
  if (wide(page)) {
    await expect(sidebar).toBeVisible()
    await expect(trigger).toBeHidden()
  } else {
    await expect(sidebar).toBeHidden()
    await trigger.click()
    await expect(sidebar).toBeVisible()
    await sidebar.getByRole('link', { name: 'Settings' }).click()
    await expect(sidebar).toBeHidden()
  }
})

test('app bar sticks to the top while scrolling', async ({ page }) => {
  await page.evaluate(() => scrollTo(0, 600))
  await page.waitForFunction(() => scrollY > 300)
  const box = (await page.getByTestId('appbar').boundingBox())!
  expect(box.y).toBeCloseTo(0, 0)
})

test('pagination condenses to previous / current / next on phones', async ({ page }) => {
  const pages = page.getByTestId('pagination').getByRole('button', { name: /^Page \d+$/ })
  const visible = await pages.evaluateAll(
    (els) => els.filter((el) => el.checkVisibility()).length
  )
  expect(visible).toBe(atLeast(page, 'sm') ? 5 : 1)
})
