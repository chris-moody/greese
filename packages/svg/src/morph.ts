import { centroid, splitCubic } from './measure.ts'
import {
  cubicsToPath,
  toCubics,
  type Cubic,
  type CubicSubpath,
  type Point,
} from './path.ts'
import { toPath, type PathInput } from './shapes.ts'

/** How two shapes are matched up for morphing. */
export interface MorphOptions {
  /**
   * Line the target up with the source before morphing: a closed shape's
   * starting point is turned, and either shape's direction reversed, to
   * whichever pairing moves the points least. Without it, points travel to
   * their partners as drawn, which can twist. @default true
   */
  align?: boolean
  /** Decimals kept in the path data. @default 3 */
  precision?: number
}

const lerp = (a: Point, b: Point, t: number): Point => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
]

// A cheap length estimate, only to choose which curve to split next.
const estimate = (c: Cubic): number =>
  Math.hypot(c[1][0] - c[0][0], c[1][1] - c[0][1]) +
  Math.hypot(c[2][0] - c[1][0], c[2][1] - c[1][1]) +
  Math.hypot(c[3][0] - c[2][0], c[3][1] - c[2][1])

/** Splits the longest curves until there are `count`, so the shape is unchanged. */
const subdivide = (curves: Cubic[], count: number): Cubic[] => {
  const out = [...curves]
  while (out.length < count) {
    let longest = 0
    for (let i = 1; i < out.length; i++)
      if (estimate(out[i]!) > estimate(out[longest]!)) longest = i
    out.splice(longest, 1, ...splitCubic(out[longest]!))
  }
  return out
}

const reverse = (curves: Cubic[]): Cubic[] =>
  curves.map((c): Cubic => [c[3], c[2], c[1], c[0]]).reverse()

const cost = (a: Cubic[], b: Cubic[]): number =>
  a.reduce((sum, c, i) => {
    const d = b[i]!
    return c.reduce((s, p, j) => s + (p[0] - d[j]![0]) ** 2 + (p[1] - d[j]![1]) ** 2, sum)
  }, 0)

/** The target's curves turned and/or reversed to sit closest to the source's. */
const align = (a: Cubic[], b: Cubic[], closed: boolean): Cubic[] => {
  let best = b
  let lowest = cost(a, b)
  for (const candidate of [b, reverse(b)]) {
    // Only a closed loop can start anywhere.
    const turns = closed ? candidate.length : 1
    for (let k = 0; k < turns; k++) {
      const turned = [...candidate.slice(k), ...candidate.slice(0, k)]
      const c = cost(a, turned)
      if (c < lowest - 1e-9) {
        lowest = c
        best = turned
      }
    }
  }
  return best
}

const ensureCurve = (s: CubicSubpath): Cubic[] =>
  s.curves.length ? s.curves : [[s.start, s.start, s.start, s.start]]

/** A subpath shrunk to one point: what a shape with fewer parts grows from. */
const collapsed = (to: CubicSubpath): CubicSubpath => {
  const c = centroid(ensureCurve(to).map((curve) => curve[0]))
  return {
    start: c,
    curves: ensureCurve(to).map((): Cubic => [c, c, c, c]),
    closed: to.closed,
  }
}

/**
 * Brings two shapes to the same structure: as many subpaths (a missing one
 * grows from the center of its partner), as many cubic curves in each
 * (splitting the longest, which leaves the shape unchanged), and aligned.
 */
export const matchCubics = (
  from: PathInput,
  to: PathInput,
  options: Pick<MorphOptions, 'align'> = {}
): [CubicSubpath[], CubicSubpath[]] => {
  const a = toCubics(toPath(from))
  const b = toCubics(toPath(to))
  const count = Math.max(a.length, b.length)
  const outA: CubicSubpath[] = []
  const outB: CubicSubpath[] = []
  for (let i = 0; i < count; i++) {
    const sa = a[i] ?? collapsed(b[i]!)
    const sb = b[i] ?? collapsed(a[i]!)
    const n = Math.max(ensureCurve(sa).length, ensureCurve(sb).length)
    const ca = subdivide(ensureCurve(sa), n)
    let cb = subdivide(ensureCurve(sb), n)
    if (options.align ?? true) cb = align(ca, cb, sa.closed && sb.closed)
    outA.push({ start: ca[0]![0], curves: ca, closed: sa.closed })
    outB.push({ start: cb[0]![0], curves: cb, closed: sb.closed })
  }
  return [outA, outB]
}

/**
 * Two shapes as path data with the same commands and as many numbers, so
 * anything that tweens numbers inside strings can morph between them, such
 * as greese.js: `animate(el, { d: matchPaths(star, circle) })`.
 */
export const matchPaths = (
  from: PathInput,
  to: PathInput,
  options: MorphOptions = {}
): [string, string] => {
  const [a, b] = matchCubics(from, to, options)
  // Both written closed or open alike, so their commands are the same.
  const both = (s: CubicSubpath[], o: CubicSubpath[]) =>
    s.map((p, i) => ({ ...p, closed: p.closed && o[i]!.closed }))
  return [
    cubicsToPath(both(a, b), options.precision),
    cubicsToPath(both(b, a), options.precision),
  ]
}

/** Gives the path data at progress `t`: 0 is the source, 1 the target. */
export type PathMixer = (t: number) => string

/**
 * Morphs one shape into another: returns the path data at any progress,
 * from 0 (the source) to 1 (the target); values past either end
 * extrapolate, for overshooting eases.
 *
 * ```ts
 * const mixer = morph({ type: 'star', r: 40 }, { type: 'circle', r: 40 })
 * el.setAttribute('d', mixer(0.5))
 * ```
 */
export const morph = (
  from: PathInput,
  to: PathInput,
  options: MorphOptions = {}
): PathMixer => {
  const [a, b] = matchCubics(from, to, options)
  return (t) =>
    cubicsToPath(
      a.map((sa, i) => {
        const sb = b[i]!
        const curves = sa.curves.map(
          (c, j) => c.map((p, k) => lerp(p, sb.curves[j]![k]!, t)) as unknown as Cubic
        )
        return {
          start: curves[0]![0],
          curves,
          closed: t <= 0 ? sa.closed : t >= 1 ? sb.closed : sa.closed && sb.closed,
        }
      }),
      options.precision
    )
}

/**
 * Morphs through a list of shapes: progress runs from 0 (the first) to
 * `shapes.length - 1` (the last), and fractions mix the neighbours.
 */
export const morphSequence = (
  shapes: readonly PathInput[],
  options: MorphOptions = {}
): PathMixer => {
  if (!shapes.length) return () => ''
  const mixers: PathMixer[] = []
  for (let i = 0; i + 1 < shapes.length; i++)
    mixers.push(morph(shapes[i]!, shapes[i + 1]!, options))
  const only = toPath(shapes[0]!, options.precision)
  return (t) => {
    if (!mixers.length) return only
    const i = Math.min(mixers.length - 1, Math.max(0, Math.floor(t)))
    return mixers[i]!(t - i)
  }
}
