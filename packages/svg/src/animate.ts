import { pathSampler, type PathPoint } from './measure.ts'
import { morph, type MorphOptions, type PathMixer } from './morph.ts'
import { elementToPath, toPath, type PathInput } from './shapes.ts'
import { mixSlices, strokeControl, type Slice, type StrokeElement } from './stroke.ts'
import { tween, type Tween, type TweenOptions } from './tween.ts'

/** Draws an element's stroke from one slice to another. */
export const drawStroke = (
  element: StrokeElement,
  from: Slice,
  to: Slice,
  options?: TweenOptions
): Tween => {
  const control = strokeControl(element, from)
  return tween((t) => control.set(mixSlices(from, to, t)), options)
}

/** Where a fill or drain runs, in percent of the path. */
export interface StrokeRange extends TweenOptions {
  /** @default 0 */
  start?: number
  /** @default 100 */
  end?: number
}

/** Fills a stroke in from `start` to `end`: its head runs forward, its tail stays. */
export const fillStroke = (element: StrokeElement, options: StrokeRange = {}): Tween => {
  const { start = 0, end = 100, ...timing } = options
  return drawStroke(element, { start, end: start }, { start, end }, timing)
}

/**
 * Drains a stroke from `start` to `end`: its tail runs after the head until
 * nothing is left, so the line leaves the way it came in.
 */
export const drainStroke = (element: StrokeElement, options: StrokeRange = {}): Tween => {
  const { start = 0, end = 100, ...timing } = options
  return drawStroke(element, { start, end }, { start: end, end }, timing)
}

/** A marquee's dashes and speed. */
export interface MarqueeOptions extends TweenOptions {
  /** Dashes, evenly spaced around the path. @default 1 */
  count?: number
  /** Each dash's length, in percent of the path. @default 10 */
  size?: number
  /** Runs backwards along the path. @default false */
  reverse?: boolean
}

/**
 * Runs dashes along a stroke without end: `duration` is one lap of the gap
 * between dashes, so the loop is seamless. Linear and endless unless you
 * say otherwise.
 */
export const marqueeStroke = (
  element: StrokeElement,
  options: MarqueeOptions = {}
): Tween => {
  const { count = 1, size = 10, reverse = false, ...timing } = options
  const control = strokeControl(element, { start: 0, end: size, repeat: count })
  const lap = 100 / Math.max(1, count)
  return tween((t) => control.set({ offset: (reverse ? -t : t) * lap }), {
    ease: 'linear',
    repeat: -1,
    duration: 2,
    ...timing,
  })
}

/**
 * Morphs a path's `d` as a property: set `progress` from 0 (the source) to
 * 1 (the target), or tween it, as greese.js does:
 * `animate(morphControl(el, star, circle), { progress: 1 })`.
 */
export class MorphControl {
  readonly element: Element
  readonly #mixer: PathMixer
  #progress: number

  constructor(element: Element, from: PathInput, to: PathInput, options?: MorphOptions) {
    this.element = element
    this.#mixer = morph(from, to, options)
    this.#progress = 0
    this.progress = 0
  }

  /** How far it has morphed: 0 is the source, 1 the target. */
  get progress(): number {
    return this.#progress
  }
  set progress(value: number) {
    this.#progress = value
    this.element.setAttribute('d', this.#mixer(value))
  }
}

/** Controls a morph between two shapes on a `<path>`: see `MorphControl`. */
export const morphControl = (
  element: Element,
  from: PathInput,
  to: PathInput,
  options?: MorphOptions
): MorphControl => new MorphControl(element, from, to, options)

/**
 * Morphs a `<path>` from what it draws now (or `from`) to another shape,
 * then leaves the target's own path data in place.
 */
export const morphPath = (
  element: Element,
  to: PathInput,
  options: TweenOptions & MorphOptions & { from?: PathInput } = {}
): Tween => {
  const control = morphControl(
    element,
    options.from ?? elementToPath(element),
    to,
    options
  )
  const target = toPath(to, options.precision)
  return tween((t) => (control.progress = t), {
    ...options,
    onComplete: () => {
      element.setAttribute('d', target)
      options.onComplete?.()
    },
  })
}

/** How an element follows a path. */
export interface FollowOptions {
  /** Turns the element to face along the path. @default false */
  rotate?: boolean
  /** Degrees added to the facing, for artwork drawn pointing another way. @default 0 */
  angle?: number
  /** Decimals kept in the transform. @default 3 */
  precision?: number
}

/**
 * Moves an element along a path: set `progress` (0–100, percent of the
 * path's length) and its `transform` attribute places it there, facing
 * along the path with `rotate`. Draw the element around its own origin.
 */
export class FollowControl {
  readonly element: Element
  readonly #sample: (percent: number) => PathPoint
  readonly #options: FollowOptions
  #progress = 0

  constructor(element: Element, path: PathInput, options: FollowOptions = {}) {
    this.element = element
    this.#sample = pathSampler(toPath(path))
    this.#options = options
    this.progress = 0
  }

  /** Where the element is along the path, in percent. */
  get progress(): number {
    return this.#progress
  }
  set progress(value: number) {
    this.#progress = value
    const { rotate = false, angle = 0, precision = 3 } = this.#options
    const k = 10 ** precision
    const r = (n: number) => Math.round(n * k) / k || 0
    const p = this.#sample(value)
    this.element.setAttribute(
      'transform',
      `translate(${r(p.x)} ${r(p.y)})${rotate ? ` rotate(${r(p.angle + angle)})` : ''}`
    )
  }

  /** The point the element is at. */
  get point(): PathPoint {
    return this.#sample(this.#progress)
  }
}

/** Moves an element along a path: see `FollowControl`. */
export const followControl = (
  element: Element,
  path: PathInput,
  options?: FollowOptions
): FollowControl => new FollowControl(element, path, options)
