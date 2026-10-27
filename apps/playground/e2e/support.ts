import { test, type Locator, type Page } from '@playwright/test'
import { breakpoints, type Breakpoint } from '@greese/ui'

/** Opens a playground fixture page (`/?page=<name>`) and waits for `ready` on it. */
export const openFixture = async (
  page: Page,
  name: string,
  ready: (page: Page) => Locator
): Promise<void> => {
  await page.goto(`/?page=${name}`)
  await ready(page).waitFor()
}

/** Computed values of `props` (CSS names, custom properties included), trimmed. */
export const computed = <P extends string>(locator: Locator, ...props: P[]) =>
  locator.evaluate((el, names) => {
    const s = getComputedStyle(el)
    return Object.fromEntries(names.map((n) => [n, s.getPropertyValue(n).trim()]))
  }, props) as Promise<Record<P, string>>

/** One computed value. */
export const style = async (locator: Locator, prop: string): Promise<string> =>
  (await computed(locator, prop))[prop] ?? ''

/**
 * The element a control names in `aria-controls`: the region a carousel's
 * dots scroll, a tab's panel. Found through the accessibility relationship,
 * not a part class. An attribute selector, since React's ids aren't valid CSS.
 */
export const controlledBy = async (control: Locator): Promise<Locator> => {
  const id = await control.getAttribute('aria-controls')
  if (!id) throw new Error(`${control} has no aria-controls`)
  return control.page().locator(`[id="${id}"]`)
}

/** The element's box; it must be rendered. */
export const box = async (locator: Locator) => {
  const rect = await locator.boundingBox()
  if (!rect) throw new Error(`${locator} has no box`)
  return rect
}

/** Whether the viewport is at least the breakpoint, from @greese/ui's values. */
export const atLeast = (page: Page, breakpoint: Breakpoint): boolean =>
  page.viewportSize()!.width >= breakpoints[breakpoint]

/** Whether this project has a touch screen (Pixel 7, iPhone): no hover, taps. */
export const isTouch = (): boolean => !!test.info().project.use.hasTouch

/** A token length in px, with the browser's 16px root: `0.75rem` → 12. */
export const px = (length: string): number =>
  parseFloat(length) * (length.endsWith('rem') ? 16 : 1)

/** `#rrggbb` as browsers compute it: `rgb(r, g, b)`. */
export const rgb = (hex: string): string =>
  `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`

/**
 * Resolves once the element has stopped moving: its box and its transform,
 * opacity and translate unchanged for `frames` frames in a row. Covers CSS
 * transitions and animations and greese.js, which writes inline styles each
 * frame, so tests wait for the state instead of a guessed time. A larger
 * `frames` also proves it stays put (no bounce).
 */
export const settled = (locator: Locator, { frames = 3, timeout = 5000 } = {}) =>
  locator.evaluate(
    (el, { frames, timeout }) =>
      new Promise<void>((resolve, reject) => {
        const read = () => {
          const s = getComputedStyle(el)
          const r = el.getBoundingClientRect()
          return [
            r.x,
            r.y,
            r.width,
            r.height,
            s.translate,
            s.scale,
            s.rotate,
            s.opacity,
          ].join()
        }
        const end = performance.now() + timeout
        let last = read()
        let same = 0
        const tick = () => {
          const now = read()
          same = now === last ? same + 1 : 0
          last = now
          if (same >= frames) resolve()
          else if (performance.now() > end) reject(new Error('still moving'))
          else requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }),
    { frames, timeout }
  )

/** Resolves once `property`'s computed value is no longer `from`, checked every frame. */
export const leaves = (locator: Locator, property: string, from: string) =>
  locator.evaluate(
    (el, { property, from }) =>
      new Promise<void>((resolve) => {
        const tick = () => {
          if (getComputedStyle(el).getPropertyValue(property) !== from) resolve()
          else requestAnimationFrame(tick)
        }
        tick()
      }),
    { property, from }
  )

/** Resolves after `count` rendering frames: long enough for observers and scroll handlers to have run. */
export const frames = (locator: Locator, count: number) =>
  locator.evaluate(
    (_, count) =>
      new Promise<void>((resolve) => {
        let left = count
        const tick = () => (--left <= 0 ? resolve() : requestAnimationFrame(tick))
        requestAnimationFrame(tick)
      }),
    count
  )

/**
 * How much of the element a `clip-path: inset()` leaves showing across its
 * width, in %: what a rating's filled stars or a diff's before side draws.
 */
export const shownAcross = (locator: Locator): Promise<number> =>
  locator.evaluate((el) => {
    const inset = /inset\(([^)]*)\)/.exec(getComputedStyle(el).clipPath)?.[1]
    if (!inset) return 100
    const [, right = '0', , left = right] = inset.trim().split(/\s+/)
    const width = el.getBoundingClientRect().width
    const percent = (v: string) =>
      v.endsWith('%') ? parseFloat(v) : (parseFloat(v) / width) * 100
    return Math.round(100 - percent(right) - percent(left))
  })
