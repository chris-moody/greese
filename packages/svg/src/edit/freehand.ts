import { cubicsToPath, type Cubic, type Point } from '../path.ts'

/**
 * Evens out a pointer's jitter: each point averaged with up to `radius`
 * neighbours either side. The ends stay put, so the stroke starts and stops
 * where the pointer did.
 */
export const smoothPoints = (points: readonly Point[], radius = 2): Point[] =>
  points.map((p, i) => {
    if (i === 0 || i === points.length - 1 || radius <= 0) return p
    const r = Math.min(radius, i, points.length - 1 - i)
    let x = 0
    let y = 0
    for (let j = i - r; j <= i + r; j++) {
      x += points[j]![0]
      y += points[j]![1]
    }
    return [x / (2 * r + 1), y / (2 * r + 1)]
  })

type Vec = Point
const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1]]
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1]]
const scale = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k]
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1]
const dist = (a: Vec, b: Vec) => Math.hypot(a[0] - b[0], a[1] - b[1])
const normalize = (a: Vec): Vec => {
  const l = Math.hypot(a[0], a[1])
  return l ? [a[0] / l, a[1] / l] : [0, 0]
}

const bezier = (c: Cubic, t: number): Point => {
  const u = 1 - t
  return add(
    add(scale(c[0], u * u * u), scale(c[1], 3 * u * u * t)),
    add(scale(c[2], 3 * u * t * t), scale(c[3], t * t * t))
  )
}

/** The best cubic from `first` to `last` with the end tangents given, for parameters `u`. */
const generate = (
  points: readonly Point[],
  first: number,
  last: number,
  u: number[],
  t1: Vec,
  t2: Vec
): Cubic => {
  const p0 = points[first]!
  const p3 = points[last]!
  let c00 = 0
  let c01 = 0
  let c11 = 0
  let x0 = 0
  let x1 = 0
  for (let i = 0; i < u.length; i++) {
    const t = u[i]!
    const b1 = 3 * t * (1 - t) ** 2
    const b2 = 3 * t * t * (1 - t)
    const a1 = scale(t1, b1)
    const a2 = scale(t2, b2)
    c00 += dot(a1, a1)
    c01 += dot(a1, a2)
    c11 += dot(a2, a2)
    const rest = sub(points[first + i]!, bezier([p0, p0, p3, p3], t))
    x0 += dot(a1, rest)
    x1 += dot(a2, rest)
  }
  const det = c00 * c11 - c01 * c01
  let alpha1 = det ? (x0 * c11 - x1 * c01) / det : 0
  let alpha2 = det ? (c00 * x1 - c01 * x0) / det : 0
  // A degenerate fit falls back to handles a third of the way (Wu and Barsky).
  const segment = dist(p0, p3)
  if (alpha1 < segment * 1e-6 || alpha2 < segment * 1e-6) alpha1 = alpha2 = segment / 3
  return [p0, add(p0, scale(t1, alpha1)), add(p3, scale(t2, alpha2)), p3]
}

/** One Newton-Raphson step towards each point's nearest parameter on the curve. */
const reparameterize = (
  c: Cubic,
  points: readonly Point[],
  first: number,
  u: number[]
): number[] =>
  u.map((t, i) => {
    const p = points[first + i]!
    const d1: Cubic = [
      scale(sub(c[1], c[0]), 3),
      scale(sub(c[2], c[1]), 3),
      scale(sub(c[3], c[2]), 3),
      [0, 0],
    ]
    const q = bezier(c, t)
    const u2 = 1 - t
    const q1 = add(
      add(scale(d1[0], u2 * u2), scale(d1[1], 2 * u2 * t)),
      scale(d1[2], t * t)
    )
    const q2 = add(scale(sub(d1[1], d1[0]), 2 * u2), scale(sub(d1[2], d1[1]), 2 * t))
    const numerator = dot(sub(q, p), q1)
    const denominator = dot(q1, q1) + dot(sub(q, p), q2)
    return denominator ? t - numerator / denominator : t
  })

const chordLengths = (
  points: readonly Point[],
  first: number,
  last: number
): number[] => {
  const u = [0]
  for (let i = first + 1; i <= last; i++)
    u.push(u.at(-1)! + dist(points[i]!, points[i - 1]!))
  const total = u.at(-1)!
  return u.map((d) => (total ? d / total : 0))
}

/**
 * Fits cubics through points within `error` (in the points' units):
 * Schneider's method (Graphics Gems, 1990). Each run of points gets one cubic
 * if it fits, refined by Newton-Raphson, and is split at its worst point
 * where it doesn't, the tangent there kept smooth.
 *
 * ```ts
 * fitCubics(pointerPoints, 1.5)
 * ```
 */
export const fitCubics = (input: readonly Point[], error = 1): Cubic[] => {
  // Repeated points give no direction.
  const points = input.filter((p, i) => i === 0 || dist(p, input[i - 1]!) > 1e-9)
  if (points.length < 2) return []
  const out: Cubic[] = []
  const fit = (first: number, last: number, t1: Vec, t2: Vec) => {
    if (last - first === 1) {
      const d = dist(points[first]!, points[last]!) / 3
      out.push([
        points[first]!,
        add(points[first]!, scale(t1, d)),
        add(points[last]!, scale(t2, d)),
        points[last]!,
      ])
      return
    }
    let u = chordLengths(points, first, last)
    let curve = generate(points, first, last, u, t1, t2)
    for (let attempt = 0; ; attempt++) {
      let worst = 0
      let split = Math.floor((first + last) / 2)
      for (let i = 1; i < u.length - 1; i++) {
        const d = dist(bezier(curve, u[i]!), points[first + i]!) ** 2
        if (d > worst) {
          worst = d
          split = first + i
        }
      }
      if (worst < error * error) {
        out.push(curve)
        return
      }
      // Close: try a better parameterization before splitting.
      if (attempt >= 4 || worst > 4 * error * error) {
        const centre = normalize(sub(points[split - 1]!, points[split + 1]!))
        fit(first, split, t1, centre)
        fit(split, last, scale(centre, -1), t2)
        return
      }
      u = reparameterize(curve, points, first, u)
      curve = generate(points, first, last, u, t1, t2)
    }
  }
  const last = points.length - 1
  fit(
    0,
    last,
    normalize(sub(points[1]!, points[0]!)),
    normalize(sub(points[last - 1]!, points[last]!))
  )
  return out
}

export interface FreehandOptions {
  /** How far the curve may stray from the points. @default 1 */
  error?: number
  /** Neighbours averaged per point first; 0 for none. @default 2 */
  smoothing?: number
  /** Decimals in the path data. @default 2 */
  precision?: number
  /** Closes the path. */
  closed?: boolean
}

/**
 * A pencil stroke as path data: the pointer's points smoothed, then fitted
 * with as few cubics as stay within `error`.
 *
 * ```ts
 * path.setAttribute('d', freehandPath(points, { error: 2 }))
 * ```
 */
export const freehandPath = (
  points: readonly Point[],
  { error = 1, smoothing = 2, precision = 2, closed = false }: FreehandOptions = {}
): string => {
  const curves = fitCubics(smoothPoints(points, smoothing), error)
  if (!curves.length) return points.length ? `M${points[0]![0]} ${points[0]![1]}` : ''
  return cubicsToPath([{ start: curves[0]![0], curves, closed }], precision)
}
