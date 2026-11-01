import { expect, test } from '@playwright/test'
import { controlledBy, isTouch as touch, openFixture, shownAcross } from './support.ts'

/** ADR 0011's components in real engines: scrolling, dragging, the top layer. */
test.beforeEach(({ page }) =>
  openFixture(page, 'catalogue', (p) => p.getByRole('region', { name: 'Colors' }))
)

test('scroll carousel: one slide per view, snapped, and the index follows scrolling', async ({
  page,
}) => {
  const colors = page.getByRole('region', { name: 'Colors' })
  // The scrolling region, as the dots name it.
  const viewport = await controlledBy(colors.getByRole('button', { name: 'Slide 1' }))
  const slides = colors.getByRole('group', { name: /of 4/ })
  await expect(slides).toHaveCount(4)
  const view = (await viewport.boundingBox())!
  const first = (await slides.first().boundingBox())!
  expect(Math.abs(first.width - view.width)).toBeLessThan(1)

  // Scrolling (a swipe, a trackpad) moves the index and the dots.
  await viewport.evaluate((el) =>
    el.scrollTo({ left: el.clientWidth * 2, behavior: 'instant' })
  )
  await expect(page.getByTestId('slide')).toHaveText('2')
  await expect(colors.getByRole('button', { name: 'Slide 3' })).toHaveAttribute(
    'aria-current',
    'true'
  )
})

test('scroll carousel: dots and buttons scroll to a slide, snapped to its start', async ({
  page,
}) => {
  const colors = page.getByRole('region', { name: 'Colors' })
  // The scrolling region, as the dots name it.
  const viewport = await controlledBy(colors.getByRole('button', { name: 'Slide 1' }))
  await colors.getByRole('button', { name: 'Slide 4' }).click()
  await expect(page.getByTestId('slide')).toHaveText('3')
  // A smooth scroll across three slides: under a full parallel run, WebKit's
  // animation can take longer than the 5 s default to land.
  await expect
    .poll(
      () =>
        viewport.evaluate(
          (el) => el.scrollWidth - el.clientWidth - Math.abs(el.scrollLeft)
        ),
      { timeout: 15_000 }
    )
    .toBeLessThan(2)
  if (touch()) {
    // Phones swipe: the arrow buttons are hidden where nothing hovers.
    await expect(colors.getByRole('button', { name: 'Previous slide' })).toBeHidden()
    return
  }
  await colors.getByRole('button', { name: 'Previous slide' }).click()
  await expect(page.getByTestId('slide')).toHaveText('2')
  await expect(colors.getByRole('button', { name: 'Next slide' })).toBeEnabled()
})

test('scroll carousel: a controlled index moves the view to a slide already scrolled past', async ({
  page,
}) => {
  const carousel = page.getByRole('region', { name: 'Controlled' })
  const viewport = await controlledBy(carousel.getByRole('button', { name: 'Slide 1' }))
  const at = (slide: number) =>
    expect
      .poll(
        () =>
          viewport.evaluate((el, i) => {
            const children = el.children as HTMLCollectionOf<HTMLElement>
            return Math.abs(
              el.scrollLeft - (children[i]!.offsetLeft - children[0]!.offsetLeft)
            )
          }, slide),
        {
          timeout: 15_000,
        }
      )
      .toBeLessThan(2)
  // Swipe to the third slide and back to the first, as a user would.
  for (const slide of [2, 0]) {
    await viewport.evaluate((el, i) => {
      const children = el.children as HTMLCollectionOf<HTMLElement>
      el.scrollTo({
        left: children[i]!.offsetLeft - children[0]!.offsetLeft,
        behavior: 'instant',
      })
    }, slide)
    await expect(page.getByTestId('controlled')).toHaveText(String(slide))
  }
  // The page's own buttons, through `index`: both slides were seen before.
  await page.getByRole('button', { name: 'Forward' }).click()
  await at(1)
  await page.getByRole('button', { name: 'Forward' }).click()
  await expect(page.getByTestId('controlled')).toHaveText('2')
  await at(2)
})

test('scroll carousel: reduced motion moves at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const colors = page.getByRole('region', { name: 'Colors' })
  const viewport = await controlledBy(colors.getByRole('button', { name: 'Slide 1' }))
  // The next frame after the click: a smooth scroll would still be on its way.
  const left = await colors.getByRole('button', { name: 'Slide 3' }).evaluate(
    (dot, view) =>
      new Promise<number>((resolve) => {
        ;(dot as HTMLElement).click()
        requestAnimationFrame(() => {
          const children = view.children as HTMLCollectionOf<HTMLElement>
          resolve(view.scrollLeft - (children[2]!.offsetLeft - children[0]!.offsetLeft))
        })
      }),
    await viewport.elementHandle()
  )
  expect(Math.abs(left)).toBeLessThan(2)
})

test('scroll carousel: vertical slides stack and scroll on y', async ({ page }) => {
  const carousel = page.getByRole('region', { name: 'Vertical' })
  const viewport = await controlledBy(carousel.getByRole('button', { name: 'Slide 1' }))
  const slides = carousel.getByRole('group', { name: /of 3/ })
  const [a, b] = [
    (await slides.nth(0).boundingBox())!,
    (await slides.nth(1).boundingBox())!,
  ]
  expect(Math.abs(a.x - b.x)).toBeLessThan(1)
  expect(b.y).toBeGreaterThan(a.y)
  const view = (await viewport.boundingBox())!
  expect(Math.abs(a.height - view.height)).toBeLessThan(1)

  await carousel.getByRole('button', { name: 'Slide 3' }).click()
  await expect
    .poll(
      () => viewport.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop),
      { timeout: 15_000 }
    )
    .toBeLessThan(2)
  await expect(carousel.getByRole('button', { name: 'Slide 3' })).toHaveAttribute(
    'aria-current',
    'true'
  )
  if (touch()) return
  // The buttons sit on the top and bottom edges, centred.
  const previous = (await carousel
    .getByRole('button', { name: 'Previous slide' })
    .boundingBox())!
  expect(
    Math.abs(previous.x + previous.width / 2 - (view.x + view.width / 2))
  ).toBeLessThan(2)
  expect(previous.y).toBeLessThan(view.y + view.height / 2)
  await carousel.getByRole('button', { name: 'Previous slide' }).click()
  await expect(carousel.getByRole('button', { name: 'Slide 2' })).toHaveAttribute(
    'aria-current',
    'true'
  )
})

test('diff: the divider follows the slider, by keyboard and pointer', async ({
  page,
}) => {
  const diff = page.getByTestId('diff')
  const slider = page.getByRole('slider', { name: 'Comparison' })
  await slider.focus()
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByTestId('split')).toHaveText('49')

  const box = (await diff.boundingBox())!
  const handle = (await diff.locator('.greese-Diff-handle').boundingBox())!
  expect(Math.abs(handle.x + handle.width / 2 - (box.x + box.width * 0.49))).toBeLessThan(
    3
  )

  // Drag the grip to a quarter of the way across.
  const y = box.y + box.height / 2
  if (touch()) {
    await page.touchscreen.tap(box.x + box.width * 0.49, y)
  } else {
    await page.mouse.move(box.x + box.width * 0.49, y)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.25, y, { steps: 8 })
    await page.mouse.up()
    await expect
      .poll(async () => Number(await page.getByTestId('split').textContent()))
      .toBeLessThan(30)
  }
  // The before side is clipped exactly at the divider.
  const split = Number(await page.getByTestId('split').textContent())
  expect(await shownAcross(diff.locator('.greese-Diff-item--before'))).toBe(split)
})

test('otp field: typing and pasting fill the boxes, the code completes once', async ({
  page,
}) => {
  const input = page.getByRole('textbox', { name: 'Code' })
  await input.click()
  await page.keyboard.type('12a3')
  // The boxes are aria-hidden: what the eye reads, so found by their part.
  const slots = page.locator('.greese-OtpField-slot')
  await expect(slots).toHaveText(['1', '2', '3', '', '', ''])
  await page.keyboard.type('456')
  await expect(page.getByTestId('code')).toHaveText('123456')
  await expect(input).toHaveValue('123456')
  // Backspace edits from the end.
  await page.keyboard.press('Backspace')
  await expect(slots.nth(5)).toHaveText('')
})

test('rating: the fill follows the choice; click, tap, keys and halves', async ({
  page,
}) => {
  const rating = page.getByRole('group', { name: 'Rating', exact: true })
  await rating.scrollIntoViewIfNeeded()
  // What the stars draw: the filled row, clipped to the value.
  const fill = (group = rating) => shownAcross(group.locator('.greese-Rating-filled'))
  await expect.poll(() => fill()).toBe(40)

  await rating.getByRole('radio', { name: '2 stars' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(rating.getByRole('radio', { name: '3 stars' })).toBeChecked()

  // A click or tap anywhere on the fourth star chooses 4.
  const stars = (await rating.locator('.greese-Rating-items').boundingBox())!
  const at = (fraction: number) => ({
    x: stars.x + stars.width * fraction,
    y: stars.y + stars.height / 2,
  })
  const fourth = at(0.7)
  if (touch()) await page.touchscreen.tap(fourth.x, fourth.y)
  else await page.mouse.click(fourth.x, fourth.y)
  await expect(rating.getByRole('radio', { name: '4 stars' })).toBeChecked()
  await expect.poll(() => fill()).toBe(80)

  // Hovering previews, where there's a mouse; leaving restores the choice.
  if (!touch()) {
    const fifth = at(0.95)
    await page.mouse.move(fifth.x, fifth.y)
    await expect.poll(() => fill()).toBe(100)
    await page.mouse.move(stars.x - 40, stars.y - 40)
    await expect.poll(() => fill()).toBe(80)
  }

  // Halves: the left half of the third star is 2.5.
  const halves = page.getByRole('group', { name: 'Halves' })
  await halves.scrollIntoViewIfNeeded()
  const row = (await halves.locator('.greese-Rating-items').boundingBox())!
  const half = { x: row.x + row.width * 0.45, y: row.y + row.height / 2 }
  if (touch()) await page.touchscreen.tap(half.x, half.y)
  else await page.mouse.click(half.x, half.y)
  await expect(halves.getByRole('radio', { name: '2.5 stars' })).toBeChecked()
  await expect.poll(() => fill(halves)).toBe(50)
})

test('speed dial: opens its actions above the button in the top layer, Escape closes', async ({
  page,
}) => {
  const trigger = page.getByRole('button', { name: 'Create' })
  await trigger.click()
  const actions = page.getByRole('group', { name: 'Create' })
  await expect(actions).toBeVisible()
  expect(await actions.evaluate((el) => el.matches(':popover-open'))).toBe(true)
  const button = (await trigger.boundingBox())!
  const stack = (await actions.boundingBox())!
  expect(stack.y + stack.height).toBeLessThanOrEqual(button.y + 1)

  await page.keyboard.press('Escape')
  await expect(actions).toBeHidden()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')

  await trigger.click()
  await page.getByRole('button', { name: 'Folder' }).click()
  await expect(page.getByTestId('action')).toHaveText('folder')
  await expect(actions).toBeHidden()
})

test('swap: pressing swaps the visible face', async ({ page }) => {
  const swap = page.getByRole('button', { name: 'Dark mode' })
  const on = swap.locator('.greese-Swap-on')
  await expect.poll(() => on.evaluate((el) => getComputedStyle(el).opacity)).toBe('0')
  await swap.click()
  await expect(swap).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => on.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
})
