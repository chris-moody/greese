import { expect, test, type Page } from '@playwright/test'

/**
 * Responsive layout in a real browser: jsdom has no layout engine. Every
 * fixture is asserted at each breakpoint boundary.
 */
const WIDTHS = { xs: 375, sm: 600, md: 900, lg: 1200, xl: 1536 } as const
type Bp = keyof typeof WIDTHS
const atLeast = (bp: Bp, min: Bp) => WIDTHS[bp] >= WIDTHS[min]

const css = (page: Page, id: string, ...props: string[]) =>
  page.getByTestId(id).evaluate((el, names) => {
    const s = getComputedStyle(el)
    return Object.fromEntries(names.map((n) => [n, s.getPropertyValue(n)]))
  }, props)

const box = async (page: Page, id: string) => (await page.getByTestId(id).boundingBox())!
const tracks = async (page: Page, id: string) =>
  (await css(page, id, 'grid-template-columns'))['grid-template-columns']!.split(' ')
    .length

for (const [bp, width] of Object.entries(WIDTHS) as Array<[Bp, number]>) {
  test.describe(`at ${bp} (${width}px)`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/?page=layout')
      await page.getByTestId('stack-responsive').waitFor()
    })

    test('Stack resolves direction and gap per breakpoint', async ({ page }) => {
      expect(await css(page, 'stack-responsive', 'flex-direction', 'row-gap')).toEqual({
        'flex-direction': atLeast(bp, 'md') ? 'row' : 'column',
        'row-gap': atLeast(bp, 'lg') ? '13px' : '8px',
      })
    })

    test('nested Stacks never inherit a parent breakpoint value', async ({ page }) => {
      expect((await css(page, 'outer', 'row-gap'))['row-gap']).toBe(
        atLeast(bp, 'md') ? '32px' : 'normal'
      )
      expect((await css(page, 'inner-gap', 'row-gap'))['row-gap']).toBe('4px')
      expect((await css(page, 'inner-plain', 'row-gap'))['row-gap']).toBe('normal')
    })

    test('a value set only from md falls back to the default below it', async ({
      page,
    }) => {
      expect((await css(page, 'stack-md-only', 'flex-direction'))['flex-direction']).toBe(
        atLeast(bp, 'md') ? 'row' : 'column'
      )
    })

    test('Box style props apply, and unset sides keep browser defaults', async ({
      page,
    }) => {
      const b = await css(page, 'box', 'display', 'padding-top', 'max-width')
      expect(b.display).toBe(atLeast(bp, 'sm') ? 'block' : 'none')
      if (atLeast(bp, 'sm')) {
        expect(b['padding-top']).toBe(atLeast(bp, 'md') ? '32px' : '8px')
        expect(b['max-width']).toBe('320px')
      }
      // Only mt is set: the Container's own gutter must survive. Style props
      // are utilities, so a declared-but-unset prop would wipe it.
      expect(await css(page, 'box-partial', 'margin-top', 'padding-left')).toEqual({
        'margin-top': '16px',
        'padding-left': atLeast(bp, 'md') ? '32px' : '16px',
      })
    })

    test('Grid columns follow breakpoints; minChildWidth follows space', async ({
      page,
    }) => {
      expect(await tracks(page, 'grid-columns')).toBe(
        atLeast(bp, 'lg') ? 4 : atLeast(bp, 'sm') ? 2 : 1
      )
      // auto-fill: as many >=200px tracks (8px gaps) as the grid's width allows.
      const { width: gridWidth } = await box(page, 'grid-min')
      expect(await tracks(page, 'grid-min')).toBe(
        Math.max(1, Math.floor((gridWidth + 8) / 208))
      )
    })

    test('container-mode GridItems respond to the grid width, not the viewport', async ({
      page,
    }) => {
      // Both grids are 400px wide (< md). Only the container grid knows that.
      const [container, inContainer] = [
        await box(page, 'grid-container'),
        await box(page, 'item-in-container'),
      ]
      expect(inContainer.width).toBeCloseTo(container.width, 0)
      const [viewport, inViewport] = [
        await box(page, 'grid-viewport'),
        await box(page, 'item-in-viewport'),
      ]
      expect(inViewport.width).toBeCloseTo(
        atLeast(bp, 'md') ? viewport.width / 2 : viewport.width,
        0
      )
    })

    test('Show and Hide toggle with CSS alone', async ({ page }) => {
      const visible = (id: string) => page.getByTestId(id).isVisible()
      expect(await visible('show-above-md')).toBe(atLeast(bp, 'md'))
      expect(await visible('hide-above-md')).toBe(!atLeast(bp, 'md'))
      expect(await visible('show-sm-to-lg')).toBe(atLeast(bp, 'sm') && !atLeast(bp, 'lg'))
    })

    test('Container caps width; px overrides its gutter', async ({ page }) => {
      const c = await css(page, 'container', 'max-width', 'padding-left')
      expect(c['max-width']).toBe('600px')
      expect(c['padding-left']).toBe(atLeast(bp, 'md') ? '32px' : '16px')
      expect((await css(page, 'container-px', 'padding-left'))['padding-left']).toBe(
        '8px'
      )
    })

    test('AspectRatio holds its ratio before media loads; Spacer pushes apart', async ({
      page,
    }) => {
      const frame = await box(page, 'aspect')
      expect(frame.height).toBeCloseTo(atLeast(bp, 'md') ? 100 : 200, 0)
      const [row, last] = [await box(page, 'spacer-row'), await box(page, 'spacer-last')]
      expect(last.x + last.width).toBeCloseTo(row.x + row.width, 0)
    })
  })
}
