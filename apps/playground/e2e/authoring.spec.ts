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

test('dropping a tab on another tab puts it in front; on a tab’s trailing half, after it', async ({
  page,
}) => {
  const tab = (name: string) => page.getByRole('tab', { name })
  // Library onto Properties' trailing half: into that group, after it.
  let properties = await box(tab('Properties'))
  await drag(page, tab('Library'), {
    x: properties.x + (properties.width * 3) / 4,
    y: properties.y + properties.height / 2,
  })
  await expect(group(page, 'Properties').getByRole('tab')).toHaveText([
    'Properties',
    'Library',
  ])
  // Layers onto Properties' leading half: in front of it. The narrow group's
  // tab row scrolls; Properties, first, is brought back into view.
  await tab('Properties').scrollIntoViewIfNeeded()
  properties = await box(tab('Properties'))
  await drag(page, tab('Layers'), {
    x: properties.x + properties.width / 4,
    y: properties.y + properties.height / 2,
  })
  await expect(group(page, 'Properties').getByRole('tab')).toHaveText([
    'Layers',
    'Properties',
    'Library',
  ])
})

test('dropping a tab in the middle of its own group’s body floats it', async ({
  page,
}) => {
  const body = await box(group(page, 'Layers').locator('.greese-PanelGroup-body'))
  await drag(page, page.getByRole('tab', { name: 'Library' }), {
    x: body.x + body.width / 2,
    y: body.y + body.height / 2,
  })
  await expect(group(page, 'Layers').getByRole('tab')).toHaveText(['Layers'])
  await expect(
    page.locator('.greese-PanelDock-float').getByRole('tab', { name: 'Library' })
  ).toBeVisible()
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

test('a docked row or column is as deep as the drop was from the edge', async ({
  page,
}) => {
  const stage = await box(page.getByTestId('stage'))
  // A new row along the stage's bottom: the drop marks its top.
  const rowTop = stage.y + stage.height * 0.8
  await drag(page, page.getByRole('tab', { name: 'Library' }), {
    x: stage.x + stage.width / 2,
    y: rowTop,
  })
  const row = await box(group(page, 'Library'))
  expect(Math.abs(row.y - rowTop)).toBeLessThanOrEqual(8)
  expect(Math.abs(row.y + row.height - (stage.y + stage.height))).toBeLessThanOrEqual(2)

  // A new column on the stage's right: the drop marks its left side.
  const now = await box(page.getByTestId('stage'))
  const columnLeft = now.x + now.width * 0.8
  await drag(page, page.getByRole('tab', { name: 'Layers' }), {
    x: columnLeft,
    y: now.y + now.height / 2,
  })
  const column = await box(group(page, 'Layers'))
  // A narrow stage (a phone's) holds it at SplitPane's 80px minimum.
  const wanted = Math.max(80, now.x + now.width - columnLeft)
  expect(Math.abs(column.width - wanted)).toBeLessThanOrEqual(8)
})

test('a drop right at a pane’s edge still leaves the new pane room', async ({ page }) => {
  const stage = await box(page.getByTestId('stage'))
  // The stage's left edge meets the Layers column, not the workspace's wall.
  await drag(page, page.getByRole('tab', { name: 'Library' }), {
    x: stage.x + 6,
    y: stage.y + stage.height / 2,
  })
  // At least SplitPane's minimum, not a sliver.
  expect((await box(group(page, 'Library'))).width).toBeGreaterThanOrEqual(78)
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
