import { toCubics, type Cubic, type PathData, type Point } from './path.ts'

/** A subpath flattened to straight lines. */
export interface Polyline {
  points: Point[]
  closed: boolean
}

/** How finely curves are flattened. */
export interface FlattenOptions {
  /**
   * The farthest a flattened curve may stray from the true one, in user
   * units. Smaller is more exact and makes more points. @default 0.1
   */
  tolerance?: number
}

/** Splits a cubic at `t` (de Casteljau). */
export const splitCubic = (c: Cubic, t = 0.5): [Cubic, Cubic] => {
  const l = (a: Point, b: Point): Point => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
  ]
  const ab = l(c[0], c[1])
  const bc = l(c[1], c[2])
  const cd = l(c[2], c[3])
  const abc = l(ab, bc)
  const bcd = l(bc, cd)
  const p = l(abc, bcd)
  return [
    [c[0], ab, abc, p],
    [p, bcd, cd, c[3]],
  ]
}

const distanceToLine = (p: Point, a: Point, b: Point): number => {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const length = Math.hypot(dx, dy)
  if (!length) return Math.hypot(p[0] - a[0], p[1] - a[1])
  return Math.abs((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / length
}

const flattenCubic = (c: Cubic, tolerance: number, out: Point[], depth = 0): void => {
  // A cubic lies within its control polygon: flat enough when the controls
  // are within tolerance of the chord.
  const flat =
    Math.max(distanceToLine(c[1], c[0], c[3]), distanceToLine(c[2], c[0], c[3])) <=
    tolerance
  if (flat || depth > 16) {
    out.push(c[3])
    return
  }
  const [a, b] = splitCubic(c)
  flattenCubic(a, tolerance, out, depth + 1)
  flattenCubic(b, tolerance, out, depth + 1)
}

/** Flattens a path into polylines, one per subpath. */
export const flatten = (input: PathData, options: FlattenOptions = {}): Polyline[] => {
  const tolerance = options.tolerance ?? 0.1
  return toCubics(input).map((s) => {
    const points: Point[] = [s.start]
    for (const c of s.curves) flattenCubic(c, tolerance, points)
    // The closing point repeats the start: drop it, `closed` says so.
    if (s.closed && points.length > 1) points.pop()
    return { points, closed: s.closed }
  })
}

const segments = (line: Polyline): Array<[Point, Point]> => {
  const { points, closed } = line
  const out: Array<[Point, Point]> = []
  for (let i = 1; i < points.length; i++) out.push([points[i - 1]!, points[i]!])
  if (closed && points.length > 1) out.push([points[points.length - 1]!, points[0]!])
  return out
}

/** A path's total length in user units: what `getTotalLength()` gives, without a DOM. */
export const pathLength = (input: PathData, options?: FlattenOptions): number =>
  flatten(input, options)
    .flatMap(segments)
    .reduce((sum, [a, b]) => sum + Math.hypot(b[0] - a[0], b[1] - a[1]), 0)

/** A point on a path, and the direction it travels there. */
export interface PathPoint {
  x: number
  y: number
  /** The tangent's direction in degrees, clockwise from the positive x axis. */
  angle: number
}

/**
 * Prepares a path for sampling: returns a function giving the point
 * `percent` (0–100) of the way along it, by length, measured once. Values
 * outside 0–100 clamp. Subpaths count in order, as `getPointAtLength()` does.
 */
export const pathSampler = (
  input: PathData,
  options?: FlattenOptions
): ((percent: number) => PathPoint) => {
  const lines = flatten(input, options)
  const all = lines.flatMap(segments)
  const lengths = all.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]))
  const total = lengths.reduce((s, l) => s + l, 0)
  const first = lines[0]?.points[0] ?? [0, 0]
  return (percent) => {
    let target = (Math.min(100, Math.max(0, percent)) / 100) * total
    for (let i = 0; i < all.length; i++) {
      const [a, b] = all[i]!
      const length = lengths[i]!
      if (target <= length || i === all.length - 1) {
        const t = length ? Math.min(1, target / length) : 0
        return {
          x: a[0] + (b[0] - a[0]) * t,
          y: a[1] + (b[1] - a[1]) * t,
          angle: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI,
        }
      }
      target -= length
    }
    return { x: first[0], y: first[1], angle: 0 }
  }
}

/** The point `percent` (0–100) of the way along a path, by length. See `pathSampler`. */
export const pointAt = (
  input: PathData,
  percent: number,
  options?: FlattenOptions
): PathPoint => pathSampler(input, options)(percent)

/** A box: `x`, `y`, `width`, `height`. */
export interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** A path's bounding box (of its flattened outline, so within `tolerance`). */
export const bounds = (input: PathData, options?: FlattenOptions): Box => {
  const points = flatten(input, options).flatMap((l) => l.points)
  if (!points.length) return { x: 0, y: 0, width: 0, height: 0 }
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y }
}

/** The center of a polygon's area (its vertex average when it has no area). */
export const centroid = (points: readonly Point[]): Point => {
  let area = 0
  let cx = 0
  let cy = 0
  for (let i = 0; i < points.length; i++) {
    const [x0, y0] = points[i]!
    const [x1, y1] = points[(i + 1) % points.length]!
    const cross = x0 * y1 - x1 * y0
    area += cross
    cx += (x0 + x1) * cross
    cy += (y0 + y1) * cross
  }
  if (Math.abs(area) < 1e-9) {
    const n = points.length || 1
    return [
      points.reduce((s, p) => s + p[0], 0) / n,
      points.reduce((s, p) => s + p[1], 0) / n,
    ]
  }
  return [cx / (3 * area), cy / (3 * area)]
}
