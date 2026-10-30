import { pathLength } from './measure.ts'
import { elementToPath } from './shapes.ts'

/**
 * The part of a stroke that's drawn, in percent of the path's length.
 *
 * - `start` to `end` is the drawn slice: `{ end: 100 }` is the whole stroke,
 *   `{ start: 40, end: 60 }` its middle fifth. When `end` is less than
 *   `start`, they swap.
 * - `offset` moves the slice along the path; past the end it wraps to the
 *   start, so on a closed path it runs round and round.
 * - `repeat` draws that many copies, evenly spaced around the path: a
 *   marquee of `repeat` dashes.
 */
export interface Slice {
  /** Where the drawn part starts, in percent. @default 0 */
  start?: number
  /** Where the drawn part ends, in percent. @default 100 */
  end?: number
  /** Moves the slice along the path, in percent; it wraps around. @default 0 */
  offset?: number
  /** Copies of the slice, evenly spaced along the path. @default 1 */
  repeat?: number
}

/** The two properties that draw a slice; set them as styles or attributes. */
export interface Dashes {
  strokeDasharray: string
  strokeDashoffset: string
}

// Far enough past the end that the next dash never shows.
const gapFor = (length: number) => length + 1
// Moves a dot-sized dash off a path's end, where round and square caps would
// otherwise draw it.
const EPSILON = 1e-3

const fix = (n: number) => {
  const r = Math.round(n * 1e4) / 1e4
  return r === 0 ? 0 : r
}

/**
 * The drawn intervals of a slice, in percent (0–100), sorted and merged:
 * wrapped copies split in two at the end.
 */
export const sliceIntervals = (slice: Slice): Array<[number, number]> => {
  const { start = 0, end = 100, offset = 0, repeat = 1 } = slice
  const lo = Math.min(start, end)
  const size = Math.max(start, end) - lo
  if (size <= 0) return []
  if (size >= 100) return [[0, 100]]
  const count = Math.max(1, Math.floor(repeat))
  const raw: Array<[number, number]> = []
  for (let k = 0; k < count; k++) {
    const a = (((lo + offset + (100 / count) * k) % 100) + 100) % 100
    const b = a + size
    if (b <= 100) raw.push([a, b])
    else raw.push([a, 100], [0, b - 100])
  }
  raw.sort((m, n) => m[0] - n[0])
  const merged: Array<[number, number]> = []
  for (const [a, b] of raw) {
    const last = merged[merged.length - 1]
    if (last && a <= last[1]) last[1] = Math.max(last[1], b)
    else merged.push([a, b])
  }
  return merged
}

/**
 * The `stroke-dasharray` and `stroke-dashoffset` that draw a slice of a path
 * `length` long, in the same units. With `length` 100 (the default) and the
 * element's `pathLength="100"`, there's nothing to measure, so it works in
 * CSS and on the server.
 *
 * A slice with no wraps and no copies is written as one dash and one gap,
 * moved by the offset, so CSS transitions and Web Animations interpolate
 * between two such slices exactly.
 */
export const dashes = (slice: Slice, length = 100): Dashes => {
  const { start = 0, end = 100, offset = 0, repeat = 1 } = slice
  const scale = length / 100
  const gap = fix(gapFor(length))
  const lo = Math.min(start, end)
  const size = Math.max(start, end) - lo
  const at = lo + offset
  if (size <= 0) {
    // Nothing drawn. A zero-length dash still shows a cap's dot, so one at
    // either end is moved just off the path.
    const p = Math.min(100, Math.max(0, at))
    const shift = p <= 0 ? EPSILON : p >= 100 ? -(length + EPSILON) : -p * scale
    return { strokeDasharray: `0 ${gap}`, strokeDashoffset: `${fix(shift)}` }
  }
  if (repeat <= 1 && at >= 0 && at + size <= 100) {
    return {
      strokeDasharray: `${fix(size * scale)} ${gap}`,
      strokeDashoffset: `${fix(-at * scale)}`,
    }
  }
  const intervals = sliceIntervals(slice)
  if (intervals.length === 1 && intervals[0]![0] === 0 && intervals[0]![1] === 100)
    return { strokeDasharray: `${fix(length)} ${gap}`, strokeDashoffset: '0' }
  // The pattern starts at the first dash; the last gap runs past the end.
  const values: number[] = []
  intervals.forEach(([a, b], i) => {
    const next = intervals[i + 1]
    values.push((b - a) * scale, next ? (next[0] - b) * scale : gapFor(length))
  })
  return {
    strokeDasharray: values.map(fix).join(' '),
    strokeDashoffset: `${fix(-intervals[0]![0] * scale)}`,
  }
}

/** Interpolates between two slices, property by property. */
export const mixSlices = (from: Slice, to: Slice, t: number): Slice => {
  const l = (a: number, b: number) => a + (b - a) * t
  return {
    start: l(from.start ?? 0, to.start ?? 0),
    end: l(from.end ?? 100, to.end ?? 100),
    offset: l(from.offset ?? 0, to.offset ?? 0),
    // Copies can't be fractional: they change at the end.
    repeat: t < 1 ? (from.repeat ?? 1) : (to.repeat ?? 1),
  }
}

/** Options for `strokeKeyframes`. */
export interface StrokeKeyframesOptions {
  /** The path's length, in the units of its dashes. @default 100 (with `pathLength="100"`) */
  length?: number
  /**
   * Frames between the two slices. Slices that wrap or repeat change their
   * dash count as they move, which Web Animations can't interpolate, so they
   * are sampled; simple slices need only their two ends. @default 'auto'
   */
  steps?: number | 'auto'
}

/**
 * Web Animations keyframes from one slice to another:
 * `el.animate(strokeKeyframes({ end: 0 }, { end: 100 }), 600)` draws a
 * stroke on. Set `pathLength="100"` on the element, or pass its `length`.
 */
export const strokeKeyframes = (
  from: Slice,
  to: Slice,
  options: StrokeKeyframesOptions = {}
): Dashes[] => {
  const { length = 100 } = options
  const a = dashes(from, length)
  const b = dashes(to, length)
  const simple =
    a.strokeDasharray.split(' ').length === 2 &&
    b.strokeDasharray.split(' ').length === 2 &&
    (from.repeat ?? 1) <= 1 &&
    (to.repeat ?? 1) <= 1 &&
    [from, to].every((s) => {
      const lo = Math.min(s.start ?? 0, s.end ?? 100) + (s.offset ?? 0)
      return lo >= 0 && lo + Math.abs((s.end ?? 100) - (s.start ?? 0)) <= 100
    })
  const steps =
    options.steps === 'auto' || options.steps === undefined
      ? simple
        ? 1
        : 60
      : options.steps
  return Array.from({ length: Math.max(1, steps) + 1 }, (_, i) =>
    dashes(mixSlices(from, to, i / Math.max(1, steps)), length)
  )
}

/** Any element with a stroke: a path, or a basic shape. */
export type StrokeElement = SVGGeometryElement | SVGElement

/** Measures a shape's length: the DOM's when it has one, otherwise its geometry's. */
export const measure = (el: StrokeElement): number => {
  const declared = parseFloat(el.getAttribute('pathLength') ?? '')
  if (Number.isFinite(declared) && declared > 0) return declared
  const geometry = el as SVGGeometryElement
  try {
    const length = geometry.getTotalLength?.()
    if (length) return length
  } catch {
    // Not rendered (in a closed <details>, or in jsdom): measured below.
  }
  return pathLength(elementToPath(el))
}

/**
 * A stroke's slice as properties: set `start`, `end`, `offset` or `repeat`
 * (percent, as in `Slice`) and the element's dashes follow. Any animation
 * library that tweens object properties can drive it; with greese.js:
 *
 * ```ts
 * const stroke = strokeControl(path, { end: 0 })
 * animate(stroke, { end: [0, 100] }, { duration: 1 }) // draws it on
 * ```
 */
export class StrokeControl implements Required<Slice> {
  readonly element: StrokeElement
  #slice: Required<Slice>
  #length: number

  constructor(element: StrokeElement, slice: Slice = {}) {
    this.element = element
    this.#length = measure(element)
    this.#slice = { start: 0, end: 100, offset: 0, repeat: 1, ...slice }
    this.#apply()
  }

  #apply() {
    const { strokeDasharray, strokeDashoffset } = dashes(this.#slice, this.#length)
    const style = (this.element as SVGElement).style
    style.strokeDasharray = strokeDasharray
    style.strokeDashoffset = strokeDashoffset
  }

  /** Where the drawn part starts, in percent. */
  get start(): number {
    return this.#slice.start
  }
  set start(value: number) {
    this.set({ start: value })
  }
  /** Where the drawn part ends, in percent. */
  get end(): number {
    return this.#slice.end
  }
  set end(value: number) {
    this.set({ end: value })
  }
  /** Moves the slice along the path, in percent; it wraps. */
  get offset(): number {
    return this.#slice.offset
  }
  set offset(value: number) {
    this.set({ offset: value })
  }
  /** Copies of the slice, evenly spaced. */
  get repeat(): number {
    return this.#slice.repeat
  }
  set repeat(value: number) {
    this.set({ repeat: value })
  }
  /** The path's length the dashes are measured in. */
  get length(): number {
    return this.#length
  }

  /** Sets several properties with one write. */
  set(slice: Slice): this {
    this.#slice = { ...this.#slice, ...slice }
    this.#apply()
    return this
  }

  /** Measures the element again, after its geometry changed. */
  refresh(): this {
    this.#length = measure(this.element)
    this.#apply()
    return this
  }

  /** Removes the dashes it set, so the stroke draws whole again. */
  clear(): void {
    const style = (this.element as SVGElement).style
    style.removeProperty('stroke-dasharray')
    style.removeProperty('stroke-dashoffset')
  }
}

/** Controls an element's stroke slice: see `StrokeControl`. */
export const strokeControl = (element: StrokeElement, slice?: Slice): StrokeControl =>
  new StrokeControl(element, slice)
