import { flatten, type FlattenOptions } from './measure.ts'
import {
  absolutize,
  serializePath,
  type PathData,
  type Point,
  type Segment,
} from './path.ts'

/** A circle: center and radius. */
export interface CircleSpec {
  type: 'circle'
  /** Center, x. @default 0 */
  cx?: number
  /** Center, y. @default 0 */
  cy?: number
  /** Radius. */
  r: number
}

/** An ellipse: center and two radii. */
export interface EllipseSpec {
  type: 'ellipse'
  /** Center, x. @default 0 */
  cx?: number
  /** Center, y. @default 0 */
  cy?: number
  /** Radius along x. */
  rx: number
  /** Radius along y. */
  ry: number
}

/** A rectangle, with optionally rounded corners. */
export interface RectSpec {
  type: 'rect'
  /** Left edge. @default 0 */
  x?: number
  /** Top edge. @default 0 */
  y?: number
  /** Width. */
  width: number
  /** Height. */
  height: number
  /** Corner radius along x; `ry` defaults to it, as in SVG. */
  rx?: number
  /** Corner radius along y; `rx` defaults to it, as in SVG. */
  ry?: number
}

/** A straight line between two points. */
export interface LineSpec {
  type: 'line'
  /** Start, x. */
  x1: number
  /** Start, y. */
  y1: number
  /** End, x. */
  x2: number
  /** End, y. */
  y2: number
}

/** Points joined by straight lines: open (`polyline`) or closed (`polygon`). */
export interface PointsSpec {
  type: 'polyline' | 'polygon'
  /** The corners, in order. */
  points: readonly Point[]
}

/** A regular polygon: `sides` corners on a circle, the first at the top. */
export interface RegularPolygonSpec {
  type: 'regularPolygon'
  /** Center, x. @default 0 */
  cx?: number
  /** Center, y. @default 0 */
  cy?: number
  /** The radius of the circle the corners sit on. */
  r: number
  /** @default 6 */
  sides?: number
  /** Turns it clockwise, in degrees. @default 0 */
  rotation?: number
}

/** A star: `points` outer corners on radius `r`, with inner corners between. */
export interface StarSpec {
  type: 'star'
  /** Center, x. @default 0 */
  cx?: number
  /** Center, y. @default 0 */
  cy?: number
  /** The outer radius, where the points are. */
  r: number
  /** The inner radius, between the points. @default r / 2 */
  innerRadius?: number
  /** @default 5 */
  points?: number
  /** Turns it clockwise, in degrees. @default 0 */
  rotation?: number
}

/**
 * An arc of a circle or ellipse. Angles are degrees clockwise from the top
 * (12 o'clock); a negative `length` runs counter-clockwise.
 */
export interface ArcSpec {
  type: 'arc'
  /** Center, x. @default 0 */
  cx?: number
  /** Center, y. @default 0 */
  cy?: number
  /** Radius, for a circle's arc. */
  r?: number
  /** Radius along x, for an ellipse's arc. @default r */
  rx?: number
  /** Radius along y, for an ellipse's arc. @default rx */
  ry?: number
  /** Where it starts, in degrees from the top. @default 0 */
  start?: number
  /** How far it runs, in degrees. @default 360 */
  length: number
  /**
   * `'open'` is the curve alone; `'chord'` closes it with a straight line;
   * `'pie'` closes it through the center, as a slice. @default 'open'
   */
  close?: 'open' | 'chord' | 'pie'
}

/** Path data, as a spec. */
export interface PathSpec {
  type: 'path'
  /** Path data. */
  d: string
}

/** Any shape this package can draw, convert and morph. */
export type ShapeSpec =
  | CircleSpec
  | EllipseSpec
  | RectSpec
  | LineSpec
  | PointsSpec
  | RegularPolygonSpec
  | StarSpec
  | ArcSpec
  | PathSpec

/** What path functions accept: path data, segments, a builder, or a shape spec. */
export type PathInput = PathData | ShapeSpec

const RAD = Math.PI / 180

/** A point on an ellipse, `degrees` clockwise from the top. */
const polar = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  degrees: number
): Point => [cx + rx * Math.sin(degrees * RAD), cy - ry * Math.cos(degrees * RAD)]

const arcSegments = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  start: number,
  length: number
): Segment[] => {
  // One arc command can't draw a full turn (its endpoints would meet), and
  // flags are ambiguous at 180°, so each piece is at most half a turn.
  const count = Math.max(1, Math.ceil(Math.abs(length) / 180 - 1e-9))
  const step = length / count
  const sweep = length >= 0 ? 1 : 0
  const out: Segment[] = []
  for (let i = 1; i <= count; i++) {
    const [x, y] = polar(cx, cy, rx, ry, start + step * i)
    out.push(['A', rx, ry, 0, 0, sweep, x, y])
  }
  return out
}

const pointsSegments = (points: readonly Point[], closed: boolean): Segment[] => [
  ...points.map((p, i): Segment => [i ? 'L' : 'M', p[0], p[1]]),
  ...(closed && points.length ? [['Z'] as Segment] : []),
]

const ring = (
  cx: number,
  cy: number,
  count: number,
  radius: (i: number) => number,
  rotation: number
): Point[] =>
  Array.from({ length: count }, (_, i) => {
    const r = radius(i)
    return polar(cx, cy, r, r, rotation + (360 / count) * i)
  })

/** A shape spec's segments, in absolute coordinates. */
export const shapeSegments = (spec: ShapeSpec): Segment[] => {
  switch (spec.type) {
    case 'circle':
    case 'ellipse': {
      const { cx = 0, cy = 0 } = spec
      const [rx, ry] = spec.type === 'circle' ? [spec.r, spec.r] : [spec.rx, spec.ry]
      return [['M', cx, cy - ry], ...arcSegments(cx, cy, rx, ry, 0, 360), ['Z']]
    }
    case 'rect': {
      const { x = 0, y = 0, width: w, height: h } = spec
      const rx = Math.min(Math.max(0, spec.rx ?? spec.ry ?? 0), w / 2)
      const ry = Math.min(Math.max(0, spec.ry ?? spec.rx ?? 0), h / 2)
      if (!rx || !ry) return [['M', x, y], ['H', x + w], ['V', y + h], ['H', x], ['Z']]
      return [
        ['M', x + rx, y],
        ['H', x + w - rx],
        ['A', rx, ry, 0, 0, 1, x + w, y + ry],
        ['V', y + h - ry],
        ['A', rx, ry, 0, 0, 1, x + w - rx, y + h],
        ['H', x + rx],
        ['A', rx, ry, 0, 0, 1, x, y + h - ry],
        ['V', y + ry],
        ['A', rx, ry, 0, 0, 1, x + rx, y],
        ['Z'],
      ]
    }
    case 'line':
      return [
        ['M', spec.x1, spec.y1],
        ['L', spec.x2, spec.y2],
      ]
    case 'polyline':
    case 'polygon':
      return pointsSegments(spec.points, spec.type === 'polygon')
    case 'regularPolygon': {
      const { cx = 0, cy = 0, r, sides = 6, rotation = 0 } = spec
      return pointsSegments(
        ring(cx, cy, Math.max(3, Math.round(sides)), () => r, rotation),
        true
      )
    }
    case 'star': {
      const { cx = 0, cy = 0, r, innerRadius = r / 2, points = 5, rotation = 0 } = spec
      const count = Math.max(2, Math.round(points)) * 2
      return pointsSegments(
        ring(cx, cy, count, (i) => (i % 2 ? innerRadius : r), rotation),
        true
      )
    }
    case 'arc': {
      const { cx = 0, cy = 0, start = 0, length, close = 'open' } = spec
      const rx = spec.rx ?? spec.r ?? 0
      const ry = spec.ry ?? spec.r ?? rx
      const [x, y] = polar(cx, cy, rx, ry, start)
      const arc = arcSegments(cx, cy, rx, ry, start, length)
      if (close === 'pie') return [['M', cx, cy], ['L', x, y], ...arc, ['Z']]
      return [['M', x, y], ...arc, ...(close === 'chord' ? [['Z'] as Segment] : [])]
    }
    case 'path':
      return absolutize(spec.d) as Segment[]
  }
}

const isSpec = (input: PathInput): input is ShapeSpec =>
  typeof input === 'object' && !Array.isArray(input) && 'type' in input

/**
 * Path data for anything path functions accept: a shape spec is drawn as a
 * path (circles start at the top and run clockwise); path data passes
 * through, and segments are written out.
 */
export const toPath = (input: PathInput, precision = 3): string =>
  isSpec(input)
    ? serializePath(shapeSegments(input), precision)
    : typeof input === 'string'
      ? input
      : Array.isArray(input)
        ? serializePath(input as Segment[], precision)
        : String(input)

const number = (el: Element, name: string, fallback = 0): number => {
  const value = parseFloat(el.getAttribute(name) ?? '')
  return Number.isFinite(value) ? value : fallback
}

/** Reads a `points` attribute (`"0,0 10,0 10 10"`) into points. */
export const parsePoints = (points: string): Point[] => {
  const n = points
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number)
  const out: Point[] = []
  for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i]!, n[i + 1]!])
  return out
}

/** Writes points as a `points` attribute. */
export const formatPoints = (points: readonly Point[], precision = 3): string => {
  const k = 10 ** precision
  const r = (v: number) => Math.round(v * k) / k || 0
  return points.map(([x, y]) => `${r(x)},${r(y)}`).join(' ')
}

/**
 * Reads a shape element (`<circle>`, `<ellipse>`, `<rect>`, `<line>`,
 * `<polyline>`, `<polygon>` or `<path>`) into a spec. Lengths are read as
 * user units; percentages aren't resolved.
 */
export const elementToShape = (el: Element): ShapeSpec => {
  switch (el.localName) {
    case 'circle':
      return {
        type: 'circle',
        cx: number(el, 'cx'),
        cy: number(el, 'cy'),
        r: number(el, 'r'),
      }
    case 'ellipse':
      return {
        type: 'ellipse',
        cx: number(el, 'cx'),
        cy: number(el, 'cy'),
        rx: number(el, 'rx'),
        ry: number(el, 'ry'),
      }
    case 'rect': {
      const rx = el.hasAttribute('rx') ? number(el, 'rx') : undefined
      const ry = el.hasAttribute('ry') ? number(el, 'ry') : undefined
      return {
        type: 'rect',
        x: number(el, 'x'),
        y: number(el, 'y'),
        width: number(el, 'width'),
        height: number(el, 'height'),
        ...(rx !== undefined && { rx }),
        ...(ry !== undefined && { ry }),
      }
    }
    case 'line':
      return {
        type: 'line',
        x1: number(el, 'x1'),
        y1: number(el, 'y1'),
        x2: number(el, 'x2'),
        y2: number(el, 'y2'),
      }
    case 'polyline':
    case 'polygon':
      return { type: el.localName, points: parsePoints(el.getAttribute('points') ?? '') }
    case 'path':
      return { type: 'path', d: el.getAttribute('d') ?? '' }
    default:
      throw new TypeError(`<${el.localName}> is not a shape element`)
  }
}

/** A shape element's geometry as path data. */
export const elementToPath = (el: Element, precision = 3): string =>
  toPath(elementToShape(el), precision)

const close = (a: number, b: number) => Math.abs(a - b) < 1e-6

/**
 * The simple shape a path draws exactly, if it is one: straight lines make a
 * `line`, `polyline`, `polygon` or (axis-aligned, four corners) `rect`; two
 * half-turn arcs make a `circle` or `ellipse`. Anything else gives
 * `undefined`: use `pathToPolygons` to approximate it.
 */
export const pathToShape = (input: PathData): ShapeSpec | undefined => {
  const segments = absolutize(input)
  if (segments.filter(([c]) => c === 'M').length !== 1 || segments[0]?.[0] !== 'M') return
  const closed = segments[segments.length - 1]?.[0] === 'Z'
  const body = segments.slice(1, closed ? -1 : undefined)
  const start: Point = [segments[0][1], segments[0][2]]

  if (closed && body.length === 2 && body.every(([c]) => c === 'A')) {
    const [a, b] = body as Array<
      ['A', number, number, number, 0 | 1, 0 | 1, number, number]
    >
    const [ax, ay] = [a![6], a![7]]
    const cx = (start[0] + ax) / 2
    const cy = (start[1] + ay) / 2
    const [rx, ry] = [Math.abs(a![1]), Math.abs(a![2])]
    // A half turn each way around the same ellipse, axis-aligned, endpoints
    // on an axis: the same test for what `shapeSegments` writes.
    const onAxis =
      (close(start[0], ax) && close(Math.abs(start[1] - ay) / 2, ry)) ||
      (close(start[1], ay) && close(Math.abs(start[0] - ax) / 2, rx))
    if (
      onAxis &&
      close(a![3] % 180, 0) &&
      close(b![1], a![1]) &&
      close(b![2], a![2]) &&
      close(b![6], start[0]) &&
      close(b![7], start[1])
    ) {
      return close(rx, ry)
        ? { type: 'circle', cx, cy, r: rx }
        : { type: 'ellipse', cx, cy, rx, ry }
    }
    return
  }

  const points: Point[] = [start]
  for (const segment of body) {
    const last = points[points.length - 1]!
    if (segment[0] === 'L') points.push([segment[1], segment[2]])
    else if (segment[0] === 'H') points.push([segment[1], last[1]])
    else if (segment[0] === 'V') points.push([last[0], segment[1]])
    else return
  }
  // A closing line written out before Z repeats the start.
  const end = points[points.length - 1]!
  if (closed && points.length > 1 && close(end[0], start[0]) && close(end[1], start[1]))
    points.pop()
  if (!closed && points.length === 2)
    return {
      type: 'line',
      x1: start[0],
      y1: start[1],
      x2: points[1]![0],
      y2: points[1]![1],
    }
  if (closed && points.length === 4) {
    const xs = new Set(points.map((p) => p[0]))
    const ys = new Set(points.map((p) => p[1]))
    const alternates = points.every((p, i) => {
      const q = points[(i + 1) % 4]!
      return close(p[0], q[0]) !== close(p[1], q[1])
    })
    if (xs.size === 2 && ys.size === 2 && alternates) {
      const [x0, x1] = [...xs].sort((m, n) => m - n) as [number, number]
      const [y0, y1] = [...ys].sort((m, n) => m - n) as [number, number]
      return { type: 'rect', x: x0, y: y0, width: x1 - x0, height: y1 - y0 }
    }
  }
  return { type: closed ? 'polygon' : 'polyline', points }
}

/**
 * Approximates any path with straight lines: one `polygon` (closed) or
 * `polyline` (open) per subpath, curves flattened within `tolerance`.
 */
export const pathToPolygons = (
  input: PathInput,
  options?: FlattenOptions
): PointsSpec[] =>
  flatten(toPath(input), options).map((line) => ({
    type: line.closed ? 'polygon' : 'polyline',
    points: line.points,
  }))
