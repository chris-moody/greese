import { expect, test, type Page } from '@playwright/test'

/** Break and the components ported from GLOP, in real engines. */
test.beforeEach(async ({ page }) => {
  await page.goto('/?page=additions')
  await page.getByTestId('heading').waitFor()
})

const wide = (page: Page) => page.viewportSize()!.width >= 900
const box = async (page: Page, id: string) => (await page.getByTestId(id).boundingBox())!

test('Break: a line break from md, a non-breaking space below it', async ({ page }) => {
  const heading = page.getByTestId('heading')
  const display = (selector: string) =>
    heading.locator(selector).evaluate((el) => getComputedStyle(el).display)
  expect(await display('br')).toBe(wide(page) ? 'inline' : 'none')
  expect(await display('span')).toBe(wide(page) ? 'none' : 'inline')
  // The text is read once, either way.
  expect(await heading.innerText()).toMatch(/^Ship faster,(\n|\u00A0)on every screen$/)
})

test('AutoLayout: full width on phones; from md, items grow into spare room', async ({
  page,
}) => {
  const row = await box(page, 'autolayout')
  const [a, b, c, d] = await Promise.all(
    ['al-1', 'al-2', 'al-3', 'al-4'].map((id) => box(page, id))
  )
  if (!wide(page)) {
    for (const item of [a, b, c, d]) expect(item!.width).toBeCloseTo(row.width, 0)
    return
  }
  const gap = b!.x - (a!.x + a!.width)
  expect(gap).toBeCloseTo(12, 0) // space-3
  // Row 1 is full at 4 + 4 + 4: nothing grows, three equal columns.
  for (const item of [a, b, c])
    expect(item!.width).toBeCloseTo((row.width - 2 * gap) / 3, 0)
  expect(a!.y).toBe(c!.y)
  // Row 2 holds only the last item, which grows to its maxSize of 8.
  expect(d!.y).toBeGreaterThan(a!.y)
  expect(d!.width).toBeCloseTo((8 / 12) * row.width - (4 / 12) * gap, 0)
})

test('MaskedInput: formats as you type and backspaces over literals', async ({
  page,
}) => {
  const input = page.getByLabel('Phone')
  await input.click()
  await page.keyboard.type('5551234')
  await expect(input).toHaveValue('(555) 123-4___')
  await expect(page.getByTestId('phone-raw')).toHaveText('5551234')
  // Caret after the last digit: typing continues in place.
  await page.keyboard.type('567')
  await expect(input).toHaveValue('(555) 123-4567')
  // Backspace just after the dash removes the digit before it.
  await input.evaluate((el: HTMLInputElement) => el.setSelectionRange(10, 10))
  await page.keyboard.press('Backspace')
  await expect(input).toHaveValue('(555) 124-567_')
})

test('ColorPicker: drag or tap the area, keyboard, and swatches', async ({
  page,
  isMobile,
}) => {
  const area = page.getByRole('slider', { name: 'Saturation and brightness' })
  const rect = (await area.boundingBox())!
  if (isMobile) {
    // A few pixels in: the rounded corner itself isn't hit-testable.
    await page.touchscreen.tap(rect.x + 6, rect.y + 6)
  } else {
    // Start inside, finish beyond the corner: pointer capture keeps the drag.
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2)
    await page.mouse.down()
    await page.mouse.move(rect.x - 8, rect.y - 8, { steps: 4 })
    await page.mouse.up()
  }
  // Top-left: no saturation, full brightness.
  await expect(page.getByTestId('color')).toHaveText(
    isMobile ? /^#f[0-9a-f]f[0-9a-f]f[0-9a-f]$/ : '#ffffff'
  )
  await expect(area).toBeFocused()

  await page.keyboard.press('End') // full saturation
  await page.keyboard.press('PageDown') // no brightness
  await expect(page.getByTestId('color')).toHaveText('#000000')

  await page.getByRole('button', { name: '#00ff00' }).click()
  await expect(page.getByTestId('color')).toHaveText('#00ff00')
  await expect(page.getByLabel('Hex colour')).toHaveValue('00ff00')
})

test('ActionSelect: button and select joined into one control', async ({ page }) => {
  const button = page.getByRole('button', { name: 'New project' })
  const select = page.getByRole('combobox', { name: 'Project' })
  const b = (await button.boundingBox())!
  const s = (await select.locator('..').boundingBox())!
  expect(s.x).toBeCloseTo(b.x + b.width - 1, 0)
  expect(s.height).toBeCloseTo(b.height, 0)
  await button.click()
  await select.selectOption('b')
  await expect(page.getByTestId('project')).toHaveText('b / 1')
})
