import { expect, test, type Locator, type Page } from '@playwright/test'
import { box, openFixture } from './support.ts'

/** @greese/authoring's PanelDock in real engines: layout, splits and drag-to-dock need layout. */
test.beforeEach(({ page }) =>
  openFixture(page, 'authoring', (p) => p.getByRole('tab', { name: 'Layers' }))
)

/** A group, found through its tab panel's tab. */
const group = (page: Page, tab: string): Locator =>
  page.locator('[data-leaf-id]').filter({ has: page.getByRole('tab', { name: tab }) })

/** Presses, moves in steps (past the drag threshold), and releases. */
const drag = async (page: Page, from: Locator, to: { x: number; y: number }) => {
  // A narrow group's tab row scrolls: bring the tab out from under the collapse button.
  await from.scrollIntoViewIfNeeded()
  const start = await box(from)
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 8 })
  await page.mouse.up()
}

test('lays out the spec: tab group, stage, panel, left to right', async ({ page }) => {
  const left = await box(group(page, 'Layers'))
  const stage = await box(page.getByTestId('stage'))
  const right = await box(group(page, 'Properties'))
  expect(left.x + left.width).toBeLessThanOrEqual(stage.x + 1)
  expect(stage.x + stage.width).toBeLessThanOrEqual(right.x + 1)
  expect(stage.width).toBeGreaterThan(40)
  expect(Math.round(left.width)).toBe(120)
})

test('dragging a divider resizes its pane and keeps the size', async ({ page }) => {
  const divider = page.getByRole('separator', { name: 'Resize panes' }).first()
  const before = await box(group(page, 'Layers'))
  const handle = await box(divider)
  await drag(page, divider, { x: handle.x + 40, y: handle.y + handle.height / 2 })
  const after = await box(group(page, 'Layers'))
  expect(Math.round(after.width - before.width)).toBe(40)
  await expect(divider).toHaveAttribute('aria-valuenow', String(Math.round(after.width)))
})

test('dragging a tab onto another group joins it as a tab', async ({ page }) => {
  const target = await box(group(page, 'Properties'))
  await drag(page, page.getByRole('tab', { name: 'Library' }), {
    x: target.x + target.width / 2,
    y: target.y + target.height / 2,
  })
  const properties = group(page, 'Properties')
  await expect(properties.getByRole('tab')).toHaveText(['Properties', 'Library'])
  await expect(properties.getByRole('tab', { name: 'Library' })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  await expect(group(page, 'Layers').getByRole('tab')).toHaveText(['Layers'])
})

test('dragging a tab to the stage’s bottom splits the stage, with the panel below', async ({
  page,
}) => {
  const stage = await box(page.getByTestId('stage'))
  // Inside the stage's bottom drop zone, clear of the workspace's edge band.
  await drag(page, page.getByRole('tab', { name: 'Library' }), {
    x: stage.x + stage.width / 2,
    y: stage.y + stage.height * 0.85,
  })
  const library = await box(group(page, 'Library'))
  const after = await box(page.getByTestId('stage'))
  expect(library.y).toBeGreaterThanOrEqual(after.y + after.height - 1)
  // Only as wide as the stage was: the side columns are untouched.
  expect(Math.abs(library.width - stage.width)).toBeLessThanOrEqual(2)
  expect(after.height).toBeLessThan(stage.height)
})

test('dragging a tab to the workspace’s bottom edge docks it across the whole width', async ({
  page,
}) => {
  const workspace = await box(page.locator('.greese-PanelDock'))
  await drag(page, page.getByRole('tab', { name: 'Library' }), {
    x: workspace.x + workspace.width / 2,
    y: workspace.y + workspace.height - 4,
  })
  const library = await box(group(page, 'Library'))
  // Docked along the bottom, full width, and given room even in a short viewport.
  expect(Math.abs(library.width - workspace.width)).toBeLessThanOrEqual(2)
  expect(library.y + library.height).toBeGreaterThanOrEqual(
    workspace.y + workspace.height - 2
  )
  expect(library.height).toBeGreaterThan(100)
})

test('docking a FREE panel moves it: it stops floating, so there is one Notes', async ({
  page,
}) => {
  const target = await box(group(page, 'Properties'))
  await drag(page, page.getByRole('tab', { name: 'Notes' }), {
    x: target.x + target.width / 2,
    y: target.y + target.height / 2,
  })
  await expect(page.getByRole('tab', { name: 'Notes' })).toHaveCount(1)
  await expect(page.getByText('Notes body')).toHaveCount(1)
  await expect(group(page, 'Properties').getByRole('tab')).toHaveText([
    'Properties',
    'Notes',
  ])
})
