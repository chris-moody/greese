import {
  absolutize,
  arcToCubics,
  parsePath,
  type AbsoluteSegment,
  type Cubic,
  type PathData,
  type Point,
  type Segment,
} from '../path.ts'

/** Where a segment starts, and what its shorthand forms reflect. */
export interface SegmentContext {
  /** The current point before the segment: where it starts. */
  from: Point
  /** The current subpath's start, where `Z` returns. */
  subpathStart: Point
  /** The previous cubic's second control, for `S` to reflect. */
  cubicControl?: Point
  /** The previous quadratic's control, for `T` to reflect. */
  quadControl?: Point
}

const reflect = (control: Point | undefined, about: Point): Point =>
  control ? [2 * about[0] - control[0], 2 * about[1] - control[1]] : about

/** Where an absolute segment ends. */
export const segmentEnd = (segment: AbsoluteSegment, context: SegmentContext): Point => {
  switch (segment[0]) {
    case 'H':
      return [segment[1], context.from[1]]
    case 'V':
      return [context.from[0], segment[1]]
    case 'Z':
      return context.subpathStart
    default:
      return [
        segment[segment.length - 2] as number,
        segment[segment.length - 1] as number,
      ]
  }
}

/** Each segment's context, in order. */
export const segmentContexts = (
  segments: readonly AbsoluteSegment[]
): SegmentContext[] => {
  const out: SegmentContext[] = []
  let from: Point = [0, 0]
  let subpathStart: Point = [0, 0]
  let cubicControl: Point | undefined
  let quadControl: Point | undefined
  for (const segment of segments) {
    const context = { from, subpathStart, cubicControl, quadControl }
    out.push(context)
    const end = segmentEnd(segment, context)
    cubicControl = quadControl = undefined
    switch (segment[0]) {
      case 'M':
        subpathStart = end
        break
      case 'C':
        cubicControl = [segment[3], segment[4]]
        break
      case 'S':
        cubicControl = [segment[1], segment[2]]
        break
      case 'Q':
        quadControl = [segment[1], segment[2]]
        break
      case 'T':
        quadControl = reflect(context.quadControl, from)
        break
    }
    from = end
  }
  return out
}

/** A shorthand segment written out in full: `S` as `C`, `T` as `Q`. */
const expand = (segment: AbsoluteSegment, context: SegmentContext): AbsoluteSegment => {
  if (segment[0] === 'S') {
    const [c1x, c1y] = reflect(context.cubicControl, context.from)
    return ['C', c1x, c1y, segment[1], segment[2], segment[3], segment[4]]
  }
  if (segment[0] === 'T') {
    const [qx, qy] = reflect(context.quadControl, context.from)
    return ['Q', qx, qy, segment[1], segment[2]]
  }
  return segment
}

/** A segment as cubics: one, or one per quarter turn of an arc. */
export const segmentToCubics = (
  segment: AbsoluteSegment,
  context: SegmentContext
): Cubic[] => {
  const full = expand(segment, context)
  const p0 = context.from
  const end = segmentEnd(full, context)
  switch (full[0]) {
    case 'M':
      return []
    case 'C':
      return [[p0, [full[1], full[2]], [full[3], full[4]], end]]
    case 'Q': {
      const q: Point = [full[1], full[2]]
      return [
        [
          p0,
          [p0[0] + ((q[0] - p0[0]) * 2) / 3, p0[1] + ((q[1] - p0[1]) * 2) / 3],
          [end[0] + ((q[0] - end[0]) * 2) / 3, end[1] + ((q[1] - end[1]) * 2) / 3],
          end,
        ],
      ]
    }
    case 'A':
      return arcToCubics(p0, full[1], full[2], full[3], full[4], full[5], end)
    default:
      // Lines (L, H, V, Z): controls at thirds, so the shape doesn't change.
      return [
        [
          p0,
          [p0[0] + (end[0] - p0[0]) / 3, p0[1] + (end[1] - p0[1]) / 3],
          [p0[0] + ((end[0] - p0[0]) * 2) / 3, p0[1] + ((end[1] - p0[1]) * 2) / 3],
          end,
        ],
      ]
  }
}

const point = (c: Cubic, t: number): Point => {
  const u = 1 - t
  const [a, b, c2, d] = c
  return [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c2[0] + t * t * t * d[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c2[1] + t * t * t * d[1],
  ]
}

const lerp = (a: Point, b: Point, t: number): Point => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
]

/** Splits a cubic at `t` (de Casteljau). */
export const splitCubic = (c: Cubic, t = 0.5): [Cubic, Cubic] => {
  const ab = lerp(c[0], c[1], t)
  const bc = lerp(c[1], c[2], t)
  const cd = lerp(c[2], c[3], t)
  const abc = lerp(ab, bc, t)
  const bcd = lerp(bc, cd, t)
  const mid = lerp(abc, bcd, t)
  return [
    [c[0], ab, abc, mid],
    [mid, bcd, cd, c[3]],
  ]
}

/**
 * A cubic as quadratics within `tolerance`: one where a quadratic fits, more
 * where it doesn't (halving until each fits, at most 8 deep).
 */
export const cubicToQuads = (c: Cubic, tolerance = 0.5, depth = 0): [Point, Point][] => {
  // The best single quadratic's control, and its distance from the cubic.
  const q: Point = [
    (3 * (c[1][0] + c[2][0]) - c[0][0] - c[3][0]) / 4,
    (3 * (c[1][1] + c[2][1]) - c[0][1] - c[3][1]) / 4,
  ]
  const error =
    (Math.sqrt(3) / 36) *
    Math.hypot(
      c[3][0] - 3 * c[2][0] + 3 * c[1][0] - c[0][0],
      c[3][1] - 3 * c[2][1] + 3 * c[1][1] - c[0][1]
    )
  if (error <= tolerance || depth >= 8) return [[q, c[3]]]
  const [a, b] = splitCubic(c)
  return [
    ...cubicToQuads(a, tolerance, depth + 1),
    ...cubicToQuads(b, tolerance, depth + 1),
  ]
}

/**
 * A cubic as a circular arc, when one fits within `tolerance` (in the path's
 * units): the circle through its ends and middle, checked along its length.
 * `null` when it isn't an arc.
 */
export const cubicToArc = (c: Cubic, tolerance = 0.5): AbsoluteSegment | null => {
  const [a, , , d] = c
  const m = point(c, 0.5)
  const det = 2 * (a[0] * (m[1] - d[1]) + m[0] * (d[1] - a[1]) + d[0] * (a[1] - m[1]))
  if (Math.abs(det) < 1e-9) return null
  const sq = (p: Point) => p[0] * p[0] + p[1] * p[1]
  const cx = (sq(a) * (m[1] - d[1]) + sq(m) * (d[1] - a[1]) + sq(d) * (a[1] - m[1])) / det
  const cy = (sq(a) * (d[0] - m[0]) + sq(m) * (a[0] - d[0]) + sq(d) * (m[0] - a[0])) / det
  const r = Math.hypot(a[0] - cx, a[1] - cy)
  for (let i = 1; i < 16; i++) {
    const p = point(c, i / 16)
    if (Math.abs(Math.hypot(p[0] - cx, p[1] - cy) - r) > tolerance) return null
  }
  // Sweep: which way it turns (y down, so a positive cross is clockwise).
  const cross = (m[0] - a[0]) * (d[1] - m[1]) - (m[1] - a[1]) * (d[0] - m[0])
  const sweep = cross > 0 ? 1 : 0
  // Large: the arc passes more than half the circle, its middle on the far
  // side of the chord from the centre.
  const side = (p: Point) => (d[0] - a[0]) * (p[1] - a[1]) - (d[1] - a[1]) * (p[0] - a[0])
  const large = Math.sign(side(m)) === Math.sign(side([cx, cy])) ? 1 : 0
  return ['A', r, r, 0, large, sweep, d[0], d[1]]
}

/** What `convertSegment` turns a segment into. */
export type SegmentTarget = 'L' | 'H' | 'V' | 'C' | 'S' | 'Q' | 'T' | 'A'

export interface ConvertSegmentOptions {
  /** How far a fitted curve (C to Q, C to A) may stray, in the path's units. @default 0.5 */
  tolerance?: number
}

const EPSILON = 1e-6
const near = (a: Point, b: Point, epsilon = 1e-3) =>
  Math.abs(a[0] - b[0]) < epsilon && Math.abs(a[1] - b[1]) < epsilon

/**
 * Converts one segment to another command, keeping the shape where the
 * conversion can: lines, quadratics and arcs to cubics exactly (an arc may
 * become several), cubics to quadratics and arcs by fitting, shorthands to
 * and from their full forms, lines to and from `H` and `V`, and any curve to
 * a straight line (the one that changes the shape, on purpose). A `S` or `T`
 * after the segment is written out in full first, since its shape came from
 * this one. Returns the whole path, absolute, or `null` where it can't be
 * done: a curve that isn't an arc to `A`, a slanted line to `H`, a cubic whose
 * first control isn't a reflection to `S`.
 *
 * ```ts
 * convertSegment('M0 0L30 0', 1, 'C') // [['M', 0, 0], ['C', 10, 0, 20, 0, 30, 0]]
 * ```
 */
export const convertSegment = (
  input: PathData,
  index: number,
  to: SegmentTarget,
  { tolerance = 0.5 }: ConvertSegmentOptions = {}
): AbsoluteSegment[] | null => {
  const segments = absolutize(input)
  const contexts = segmentContexts(segments)
  const segment = segments[index]
  const context = contexts[index]
  if (!segment || !context || segment[0] === 'M' || segment[0] === 'Z') return null

  // Pin the shorthand that follows, before this one changes under it.
  const next = segments[index + 1]
  if (next && (next[0] === 'S' || next[0] === 'T'))
    segments[index + 1] = expand(next, contexts[index + 1]!)

  const p0 = context.from
  const end = segmentEnd(segment, context)
  const full = expand(segment, context)
  const cubics = segmentToCubics(segment, context)
  let out: AbsoluteSegment[] | null

  switch (to) {
    case 'L':
      out = [['L', end[0], end[1]]]
      break
    case 'H':
      out =
        segment[0].match(/[LHV]/) && Math.abs(end[1] - p0[1]) < EPSILON
          ? [['H', end[0]]]
          : null
      break
    case 'V':
      out =
        segment[0].match(/[LHV]/) && Math.abs(end[0] - p0[0]) < EPSILON
          ? [['V', end[1]]]
          : null
      break
    case 'C':
      out = cubics.map((c): AbsoluteSegment => [
        'C',
        c[1][0],
        c[1][1],
        c[2][0],
        c[2][1],
        c[3][0],
        c[3][1],
      ])
      break
    case 'Q':
      out =
        full[0] === 'Q'
          ? [full]
          : segment[0].match(/[LHV]/)
            ? [['Q', (p0[0] + end[0]) / 2, (p0[1] + end[1]) / 2, end[0], end[1]]]
            : cubics.flatMap((c) =>
                cubicToQuads(c, tolerance).map(([q, p]): AbsoluteSegment => [
                  'Q',
                  q[0],
                  q[1],
                  p[0],
                  p[1],
                ])
              )
      break
    case 'S': {
      if (full[0] !== 'C') return null
      const implied = reflect(context.cubicControl, p0)
      out = near(implied, [full[1], full[2]])
        ? [['S', full[3], full[4], full[5], full[6]]]
        : null
      break
    }
    case 'T': {
      if (full[0] !== 'Q') return null
      const implied = reflect(context.quadControl, p0)
      out = near(implied, [full[1], full[2]]) ? [['T', full[3], full[4]]] : null
      break
    }
    case 'A':
      if (segment[0] === 'A') out = [segment]
      else {
        const arcs = cubics.length === 1 ? cubicToArc(cubics[0]!, tolerance) : null
        out = arcs && [arcs]
      }
      break
  }
  if (!out) return null
  segments.splice(index, 1, ...out)
  return segments
}

/**
 * The path with every segment relative (`l`, `c`…), or absolute with
 * `relative: false`. Shapes don't change; only how they're written.
 */
export const setRelative = (input: PathData, relative = true): Segment[] => {
  const segments = absolutize(input)
  if (!relative) return segments
  const contexts = segmentContexts(segments)
  return segments.map((s, i) => toRelative(s, contexts[i]!))
}

/** One segment written relative to where it starts. */
const toRelative = (segment: AbsoluteSegment, context: SegmentContext): Segment => {
  const [command, ...values] = segment
  const [x, y] = context.from
  switch (command) {
    case 'Z':
      return ['z']
    case 'H':
      return ['h', values[0]! - x]
    case 'V':
      return ['v', values[0]! - y]
    case 'A': {
      const [rx, ry, rotation, large, sweep, ex, ey] = values as number[]
      return ['a', rx!, ry!, rotation!, large as 0 | 1, sweep as 0 | 1, ex! - x, ey! - y]
    }
    default:
      return [
        command.toLowerCase(),
        ...(values as number[]).map((v, i) => v - (i % 2 ? y : x)),
      ] as Segment
  }
}

/**
 * Writes one segment relative or absolute, leaving the rest as written: what
 * an editor's per-segment toggle does.
 */
export const setSegmentRelative = (
  input: PathData,
  index: number,
  relative: boolean
): Segment[] => {
  const written =
    typeof input === 'string'
      ? parsePath(input)
      : Array.isArray(input)
        ? [...(input as Segment[])]
        : parsePath(String(input))
  const absolute = absolutize(written)
  const segment = absolute[index]
  if (!segment) return written
  written[index] = relative
    ? toRelative(segment, segmentContexts(absolute)[index]!)
    : segment
  return written
}
