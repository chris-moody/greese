import { expect, test, type Page } from '@playwright/test'

/** The Components tab, on a component, with its preview loaded. */
const open = async (page: Page, component: string) => {
  await page.goto('/studio')
  await page.getByRole('tab', { name: /components/i }).click()
  await page.getByLabel('Component', { exact: true }).selectOption(component)
  await expect(page.frameLocator('iframe').locator('.anatomy')).toBeVisible()
}

/** A computed style in the preview, inside the component and on a copy of the same markup outside it. */
const insideAndOutside = (page: Page, property: string) =>
  page
    .frameLocator('iframe')
    .locator('body')
    .evaluate((body, prop) => {
      const inside = body.querySelector('.anatomy .greese-Collapsible-trigger')!
      const lone = document.createElement('details')
      lone.className = 'greese-Collapsible'
      lone.innerHTML = '<summary class="greese-Collapsible-trigger">Alone</summary>'
      body.append(lone)
      const read = (el: Element) => getComputedStyle(el).getPropertyValue(prop)
      const result = { inside: read(inside), outside: read(lone.firstElementChild!) }
      lone.remove()
      return result
    }, property)

test('SCSS with the library’s imports applies inside the component, live, and nowhere else', async ({
  page,
}) => {
  await open(page, 'Accordion')
  const before = await insideAndOutside(page, 'color')
  await page.getByLabel('Accordion styles, SCSS').fill(`@use 'pkg:@greese/ui/scss/tones';
@use 'sass:list';
@use 'sass:map';

.greese-Collapsible-trigger {
  color: list.nth(map.get(tones.$tones, negative), 1);
}`)
  await expect
    .poll(async () => (await insideAndOutside(page, 'color')).inside)
    .not.toBe(before.inside)
  const after = await insideAndOutside(page, 'color')
  expect(after.outside).toBe(before.outside)
})

test('a library path copied from a component’s source is made portable, and an error is marked on its line', async ({
  page,
}) => {
  await open(page, 'Accordion')
  const box = page.getByLabel('Accordion styles, SCSS')
  await box.fill(
    `@use '../../styles/mixins';\n\n.greese-Collapsible-trigger {\n  gap: $nope;\n}`
  )
  await expect(box).toHaveValue(/@use 'pkg:@greese\/ui\/scss\/mixins';/)
  await expect(page.getByText(/Rewritten for your project/)).toBeVisible()
  await expect(page.getByText(/^Line 4: Undefined variable/)).toBeVisible()
  await expect(page.locator('.greese-CodeEditor-line[data-mark]')).toHaveCount(1)
})

test('the box starts as the family’s own SCSS; an edit applies inside the component only', async ({
  page,
}) => {
  await open(page, 'Accordion')
  const box = page.getByLabel('Accordion styles, SCSS')
  await expect(box).toHaveValue(/^@use 'pkg:@greese\/ui\/scss\/mixins';/)
  await expect(box).toHaveValue(/\/\/ src\/components\/Collapsible\/Collapsible\.scss/)
  await expect(box).not.toHaveValue(/@layer/)
  await expect(page.getByRole('button', { name: /^Reset Accordion/ })).toHaveCount(0)
  const text = await box.inputValue()
  await box.fill(text.replace('min-block-size: 2.75rem', 'min-block-size: 5rem'))
  await expect
    .poll(async () => (await insideAndOutside(page, 'min-block-size')).inside)
    .toBe('80px')
  expect((await insideAndOutside(page, 'min-block-size')).outside).toBe('44px')
  await page.getByRole('button', { name: 'Reset Accordion styles' }).click()
  await expect(box).toHaveValue(text)
})

test('the imports menu follows the box, and adds or removes an import', async ({
  page,
}) => {
  await open(page, 'Accordion')
  const box = page.getByLabel('Accordion styles, SCSS')
  await expect(box).toHaveValue(/^@use/)
  await page.getByRole('button', { name: /^Imports/ }).click()
  const map = page.getByRole('checkbox', { name: 'sass:map' })
  const mixins = page.getByRole('checkbox', { name: 'pkg:@greese/ui/scss/mixins' })
  await expect(mixins).toBeChecked()
  await expect(map).not.toBeChecked()
  await map.check()
  await expect(box).toHaveValue(/@use 'sass:map';/)
  await mixins.uncheck()
  await expect(box).not.toHaveValue(/@use 'pkg:@greese\/ui\/scss\/mixins'/)
  // Typed imports tick the box too.
  await page.keyboard.press('Escape')
  await box.fill(`@use 'sass:math';\n& { gap: 0; }`)
  await page.getByRole('button', { name: /^Imports/ }).click()
  await expect(page.getByRole('checkbox', { name: 'sass:math' })).toBeChecked()
  await expect(map).not.toBeChecked()
})

test('the anatomy’s disclosures start open and can be closed and opened again', async ({
  page,
}) => {
  for (const component of ['Accordion', 'AccordionItem', 'Collapsible']) {
    await open(page, component)
    const details = page.frameLocator('iframe').locator('.anatomy details').first()
    await expect(details).toHaveAttribute('open', '')
    await details.locator('summary').first().click()
    await expect(details).not.toHaveAttribute('open', '')
    await details.locator('summary').first().click()
    await expect(details).toHaveAttribute('open', '')
  }
})

test('the code box draws its text where you type and select it, scrolled or not', async ({
  page,
}) => {
  await open(page, 'Accordion')
  const box = page.getByLabel('Accordion styles, SCSS')
  await expect(box).toHaveValue(/^@use/)
  /** How far the coloured text of a line is from where the textarea puts it, in px. */
  const offset = (from: number) =>
    box.evaluate((ta: HTMLTextAreaElement, from) => {
      const lines = ta.value.split('\n')
      let n = from
      while (!lines[n - 1]!.trim()) n++
      const column = lines[n - 1]!.search(/\S/)
      const code = ta
        .closest('.greese-CodeEditor')!
        .querySelector('.greese-CodeEditor-layer code')!
      const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT)
      let line = 1
      let col = 0
      for (let text = walker.nextNode(); text; text = walker.nextNode())
        for (let i = 0; i < text.textContent!.length; i++) {
          if (line === n && col === column) {
            const range = document.createRange()
            range.setStart(text, i)
            range.setEnd(text, i + 1)
            const drawn = range.getBoundingClientRect()
            const style = getComputedStyle(ta)
            const box = ta.getBoundingClientRect()
            const context = document.createElement('canvas').getContext('2d')!
            context.font = style.font
            const typed = {
              x:
                box.x +
                parseFloat(style.paddingLeft) +
                column * context.measureText('x').width -
                ta.scrollLeft,
              y:
                box.y +
                parseFloat(style.paddingTop) +
                (n - 1) * parseFloat(style.lineHeight) -
                ta.scrollTop,
            }
            // The glyph box sits inside the line box: allow its half-leading.
            return { x: Math.abs(drawn.x - typed.x), y: Math.abs(drawn.y - typed.y) }
          }
          if (text.textContent![i] === '\n') {
            line++
            col = 0
          } else col++
        }
      throw new Error(`line ${n} not drawn`)
    }, from)
  const near = { x: expect.closeTo(0, 0), y: expect.any(Number) }
  const first = await offset(10)
  expect(first).toMatchObject(near)
  expect(first.y).toBeLessThan(4)
  // It keeps its rows and scrolls, with the coloured text following.
  await box.evaluate((ta) => {
    ta.scrollTop = 600
  })
  await expect.poll(async () => (await offset(50)).y).toBeLessThan(4)
  expect((await offset(50)).x).toBeLessThan(1)
})
