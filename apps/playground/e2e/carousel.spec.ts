import { expect, test, type Locator, type Page } from '@playwright/test'
import { controlledBy, openFixture } from './support.ts'

/**
 * Carousel in real engines: effects, swipes, reduced motion, and deep links
 * an app drives through a controlled `index` (the fixture's hash).
 */

const tour = (page: Page) => page.getByRole('region', { name: 'Tour' })

/** The label of the slide that isn't inert. */
const shown = (carousel: Locator) =>
  carousel.locator('.greese-CarouselSlide:not([inert])').getAttribute('aria-label')

/** The CSS animations and transitions running on a carousel's slides. */
const running = (carousel: Locator) =>
  carousel.evaluate((el) =>
    [...el.querySelectorAll('.greese-CarouselSlide')].flatMap((slide) =>
      slide.getAnimations().map((a) => ({
        slide: slide.getAttribute('aria-label'),
        kind: a.constructor.name,
        name: 'animationName' in a ? (a as CSSAnimation).animationName : undefined,
      }))
    )
  )

/** Presses a carousel's button and reads what runs on its slides, a frame later. */
const pressAndSample = (carousel: Locator, name: string) =>
  carousel.evaluate(
    (el, name) =>
      new Promise<{ slide: string | null; kind: string; name?: string }[]>((resolve) => {
        el.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!.click()
        requestAnimationFrame(() =>
          resolve(
            [...el.querySelectorAll('.greese-CarouselSlide')].flatMap((slide) =>
              slide.getAnimations().map((a) => ({
                slide: slide.getAttribute('aria-label'),
                kind: a.constructor.name,
                name:
                  'animationName' in a ? (a as CSSAnimation).animationName : undefined,
              }))
            )
          )
        )
      }),
    name
  )

test('opens on the slide the app gives it, from the first frame, with nothing animating', async ({
  page,
}) => {
  // Every frame from the start: which slide the carousel shows, once it's there.
  await page.addInitScript(() => {
    const seen: (string | null)[] = []
    ;(window as unknown as { seen: typeof seen }).seen = seen
    const frame = () => {
      const slide = document.querySelector(
        '[aria-label="Tour"] .greese-CarouselSlide:not([inert])'
      )
      if (slide) seen.push(slide.getAttribute('aria-label'))
      if (seen.length < 5) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  })
  await page.goto('/?page=catalogue#tour-2')
  await tour(page).waitFor()
  await expect.poll(() => page.evaluate(() => (window as any).seen.length)).toBe(5)
  expect(new Set(await page.evaluate(() => (window as any).seen))).toEqual(
    new Set(['2 of 3'])
  )
  await expect(tour(page)).not.toHaveAttribute('data-moved')
  expect(await running(tour(page))).toEqual([])
})

test.describe('once open', () => {
  test.beforeEach(({ page }) => openFixture(page, 'catalogue', tour))

  test('moves with the buttons, playing the theme entrance and exit, and tells the app', async ({
    page,
  }) => {
    const carousel = tour(page)
    const entries = await page.evaluate(() => history.length)
    // The base theme: the new slide slides in, the old one transitions out.
    const motion = await pressAndSample(carousel, 'Next slide')
    expect(await shown(carousel)).toBe('2 of 3')
    await expect(page).toHaveURL(/#tour-2$/)
    expect(motion).toContainEqual({
      slide: '2 of 3',
      kind: 'CSSAnimation',
      name: 'greese-carousel-in',
    })
    expect(motion.some((m) => m.slide === '1 of 3' && m.kind === 'CSSTransition')).toBe(
      true
    )
    // The old slide is hidden once it has gone.
    await expect
      .poll(() =>
        carousel
          .locator('.greese-CarouselSlide')
          .first()
          .evaluate((el) => getComputedStyle(el).visibility)
      )
      .toBe('hidden')
    // A move adds no history.
    expect(await page.evaluate(() => history.length)).toBe(entries)
  })

  test('follows the app when a link changes the slide', async ({ page }) => {
    await page.getByRole('link', { name: 'To the last stop' }).click()
    await expect.poll(() => shown(tour(page))).toBe('3 of 3')
    await expect(tour(page)).toHaveAttribute('data-moved')
  })

  test('named effects play on the slides', async ({ page }) => {
    const carousel = page.getByRole('region', { name: 'Faded' })
    const motion = await pressAndSample(carousel, 'Next slide')
    expect(motion).toContainEqual({
      slide: '2 of 2',
      kind: 'CSSAnimation',
      name: 'greese-fade-in',
    })
    const leaving = carousel.locator('.greese-CarouselSlide').first()
    await expect(leaving).toHaveClass(/greese-Motion--exit-fade-out/)
    await expect
      .poll(() => leaving.evaluate((el) => getComputedStyle(el).opacity))
      .toBe('0')
  })

  test('arrow keys and swipes move it', async ({ page }) => {
    const carousel = tour(page)
    const viewport = await controlledBy(carousel.getByRole('button', { name: 'Slide 1' }))
    await viewport.focus()
    await page.keyboard.press('ArrowRight')
    expect(await shown(carousel)).toBe('2 of 3')
    await page.keyboard.press('Home')
    expect(await shown(carousel)).toBe('1 of 3')

    // A touch swipe leftward is next; a mouse drag is not a swipe.
    const box = (await viewport.boundingBox())!
    const y = box.y + box.height / 2
    const swipe = async (pointerType: string) => {
      await viewport.dispatchEvent('pointerdown', {
        pointerType,
        clientX: box.x + box.width * 0.8,
        clientY: y,
      })
      await viewport.dispatchEvent('pointerup', {
        pointerType,
        clientX: box.x + box.width * 0.2,
        clientY: y,
      })
    }
    await swipe('mouse')
    expect(await shown(carousel)).toBe('1 of 3')
    await swipe('touch')
    expect(await shown(carousel)).toBe('2 of 3')
  })

  test('reduced motion changes slides at once', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const carousel = tour(page)
    await carousel.getByRole('button', { name: 'Next slide' }).click()
    expect(await shown(carousel)).toBe('2 of 3')
    expect(await running(carousel)).toEqual([])
    expect(
      await carousel
        .locator('.greese-CarouselSlide')
        .first()
        .evaluate((el) => getComputedStyle(el).visibility)
    ).toBe('hidden')
  })

  test('an app reducing motion (ThemeProvider motion="reduce") cuts slides and scrolls', async ({
    page,
  }) => {
    const carousel = page.getByRole('region', { name: 'Reduced', exact: true })
    await carousel.getByRole('button', { name: 'Next slide' }).click()
    expect(await shown(carousel)).toBe('2 of 2')
    const slide = carousel.locator('.greese-CarouselSlide').first()
    expect(
      await slide.evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration))
    ).toBeLessThan(0.001)
    await expect
      .poll(() => slide.evaluate((el) => getComputedStyle(el).visibility))
      .toBe('hidden')

    const scroller = page.getByRole('region', { name: 'Reduced scroll' })
    const viewport = await controlledBy(scroller.getByRole('button', { name: 'Slide 1' }))
    expect(await viewport.evaluate((el) => getComputedStyle(el).scrollBehavior)).toBe(
      'auto'
    )
    const left = await scroller.getByRole('button', { name: 'Slide 3' }).evaluate(
      (dot, view) =>
        new Promise<number>((resolve) => {
          ;(dot as HTMLElement).click()
          requestAnimationFrame(() =>
            resolve(view.scrollWidth - view.clientWidth - view.scrollLeft)
          )
        }),
      await viewport.elementHandle()
    )
    expect(Math.abs(left)).toBeLessThan(2)
  })
})
