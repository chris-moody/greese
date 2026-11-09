/**
 * Where two cubics cross, as parameter pairs `[ta, tb]`. Lines (cubics
 * whose controls sit at thirds of the chord, which is how `toCubics` writes
 * them) are solved exactly, a curve against a line by the roots of a cubic,
 * and two curves by subdividing their control boxes. Curves that lie along
 * each other (a rect's edge on another's, the same circle's arc) give the
 * two ends of the stretch they share, never the stretch itself, so the
 * pieces between can be told apart by direction rather than by position.
 */
import type { Cubic, Point } from '../path.ts'

export type Hit = [ta: number, tb: number]

export const pointAt = (c: Cubic, t: number): Point => {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const d = 3 * u * t * t
  const e = t * t * t
  return [
    a * c[0][0] + b * c[1][0] + d * c[2][0] + e * c[3][0],
    a * c[0][1] + b * c[1][1] + d * c[2][1] + e * c[3][1],
  ]
}

export const tangentAt = (c: Cubic, t: number): Point => {
  const u = 1 - t
  const k = (i: 0 | 1) =>
    3 * u * u * (c[1][i] - c[0][i]) +
    6 * u * t * (c[2][i] - c[1][i]) +
    3 * t * t * (c[3][i] - c[2][i])
  const v: Point = [k(0), k(1)]
  // A cusp or a control on its end point: the chord still says which way.
  return v[0] || v[1] ? v : [c[3][0] - c[0][0], c[3][1] - c[0][1]]
}

/** The part of a cubic between `t0` and `t1` (de Casteljau, twice). */
export const subCubic = (c: Cubic, t0: number, t1: number): Cubic => {
  const split = (q: Cubic, t: number): [Cubic, Cubic] => {
    const l = (a: Point, b: Point): Point => [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
    ]
    const ab = l(q[0], q[1])
    const bc = l(q[1], q[2])
    const cd = l(q[2], q[3])
    const abc = l(ab, bc)
    const bcd = l(bc, cd)
    const p = l(abc, bcd)
    return [
      [q[0], ab, abc, p],
      [p, bcd, cd, q[3]],
    ]
  }
  const tail = t0 > 0 ? split(c, t0)[1] : c
  if (t1 >= 1) return tail
  return split(tail, (t1 - t0) / (1 - t0))[0]
}

const near = (a: Point, b: Point, tol: number) =>
  Math.abs(a[0] - b[0]) <= tol && Math.abs(a[1] - b[1]) <= tol

/** True for a straight cubic with its controls at thirds: `t` runs evenly along it. */
export const isLine = (c: Cubic, tol: number): boolean => {
  const third = (k: number): Point => [
    c[0][0] + ((c[3][0] - c[0][0]) * k) / 3,
    c[0][1] + ((c[3][1] - c[0][1]) * k) / 3,
  ]
  return near(c[1], third(1), tol) && near(c[2], third(2), tol)
}

/** True when the controls lie on the chord: drawn as a line, whatever its `t`. */
export const isStraight = (c: Cubic, tol: number): boolean => {
  const dx = c[3][0] - c[0][0]
  const dy = c[3][1] - c[0][1]
  const length = Math.hypot(dx, dy)
  if (!length) return near(c[1], c[0], tol) && near(c[2], c[0], tol)
  const off = (p: Point) =>
    Math.abs((p[0] - c[0][0]) * dy - (p[1] - c[0][1]) * dx) / length
  const along = (p: Point) =>
    ((p[0] - c[0][0]) * dx + (p[1] - c[0][1]) * dy) / length ** 2
  const inside = (p: Point) => along(p) >= -1e-9 && along(p) <= 1 + 1e-9
  return off(c[1]) <= tol && off(c[2]) <= tol && inside(c[1]) && inside(c[2])
}

type Box = [x0: number, y0: number, x1: number, y1: number]

const box = (c: Cubic): Box => {
  const xs = c.map((p) => p[0])
  const ys = c.map((p) => p[1])
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
}

export const boxesMeet = (a: Box, b: Box, tol: number) =>
  a[0] <= b[2] + tol && b[0] <= a[2] + tol && a[1] <= b[3] + tol && b[1] <= a[3] + tol

export const cubicBox = box

/** The `t` of the point on `c` nearest `p`, and how far that is. */
export const closestT = (c: Cubic, p: Point): { t: number; distance: number } => {
  const d2 = (t: number) => {
    const q = pointAt(c, t)
    return (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2
  }
  let best = 0
  for (let i = 1; i <= 32; i++) if (d2(i / 32) < d2(best)) best = i / 32
  let lo = Math.max(0, best - 1 / 32)
  let hi = Math.min(1, best + 1 / 32)
  for (let i = 0; i < 60; i++) {
    const m1 = lo + (hi - lo) / 3
    const m2 = hi - (hi - lo) / 3
    if (d2(m1) < d2(m2)) hi = m2
    else lo = m1
  }
  const t = (lo + hi) / 2
  return { t, distance: Math.sqrt(d2(t)) }
}

/** Real roots of `a t³ + b t² + c t + d` in `[0, 1]`, widened by `slack`. */
export const cubicRoots = (
  a: number,
  b: number,
  c: number,
  d: number,
  slack = 1e-9
): number[] => {
  const scale = Math.max(Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d))
  if (!scale) return []
  ;[a, b, c, d] = [a / scale, b / scale, c / scale, d / scale]
  let roots: number[]
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) < 1e-12) roots = Math.abs(c) < 1e-12 ? [] : [-d / c]
    else {
      const disc = c * c - 4 * b * d
      if (disc < 0) roots = []
      else {
        const s = Math.sqrt(disc)
        roots = [(-c + s) / (2 * b), (-c - s) / (2 * b)]
      }
    }
  } else {
    // Cardano, on the depressed cubic t = x − b/3a.
    const p = (3 * a * c - b * b) / (3 * a * a)
    const q = (2 * b ** 3 - 9 * a * b * c + 27 * a * a * d) / (27 * a ** 3)
    const shift = -b / (3 * a)
    const disc = (q * q) / 4 + (p * p * p) / 27
    if (disc > 1e-15) {
      const s = Math.sqrt(disc)
      roots = [Math.cbrt(-q / 2 + s) + Math.cbrt(-q / 2 - s) + shift]
    } else if (disc > -1e-15) {
      const u = Math.cbrt(-q / 2)
      roots = [2 * u + shift, -u + shift]
    } else {
      const r = Math.sqrt(-p / 3)
      const phi = Math.acos(Math.max(-1, Math.min(1, (3 * q) / (2 * p * r))))
      roots = [0, 1, 2].map((k) => 2 * r * Math.cos((phi - 2 * Math.PI * k) / 3) + shift)
    }
    // Polish: Cardano loses digits near repeated roots.
    roots = roots.map((t) => {
      for (let i = 0; i < 4; i++) {
        const f = ((a * t + b) * t + c) * t + d
        const df = (3 * a * t + 2 * b) * t + c
        if (!df) break
        t -= f / df
      }
      return t
    })
  }
  return roots
    .filter((t) => t >= -slack && t <= 1 + slack)
    .map((t) => Math.min(1, Math.max(0, t)))
}

/** Where `a` and `b` lie along each other: the ends of the shared stretch, or nothing. */
const coincident = (a: Cubic, b: Cubic, tol: number): Hit[] | undefined => {
  const pairs: Hit[] = []
  const add = (ta: number, tb: number) => {
    if (!pairs.some(([x, y]) => Math.abs(x - ta) < 1e-7 && Math.abs(y - tb) < 1e-7))
      pairs.push([ta, tb])
  }
  for (const ta of [0, 1]) {
    const hit = closestT(b, pointAt(a, ta))
    if (hit.distance <= tol) add(ta, hit.t)
  }
  for (const tb of [0, 1]) {
    const hit = closestT(a, pointAt(b, tb))
    if (hit.distance <= tol) add(hit.t, tb)
  }
  if (pairs.length < 2) return
  pairs.sort((x, y) => x[0] - y[0])
  const first = pairs[0]!
  const last = pairs[pairs.length - 1]!
  if (last[0] - first[0] < 1e-6) return
  // The two meet at both ends of the stretch; they share it only if they
  // also meet all along it.
  for (const k of [0.25, 0.5, 0.75]) {
    const ta = first[0] + (last[0] - first[0]) * k
    if (closestT(b, pointAt(a, ta)).distance > tol * 4) return
  }
  return [first, last]
}

const lineLine = (a: Cubic, b: Cubic, tol: number): Hit[] => {
  const [p, , , p2] = a
  const [q, , , q2] = b
  const r: Point = [p2[0] - p[0], p2[1] - p[1]]
  const s: Point = [q2[0] - q[0], q2[1] - q[1]]
  const cross = r[0] * s[1] - r[1] * s[0]
  const qp: Point = [q[0] - p[0], q[1] - p[1]]
  const lr = Math.hypot(...r)
  const ls = Math.hypot(...s)
  if (!lr || !ls) return []
  if (Math.abs(cross) <= 1e-12 * lr * ls) {
    // Parallel: they meet only if they're on one line, along a stretch.
    const gap = Math.abs(qp[0] * r[1] - qp[1] * r[0]) / lr
    return gap <= tol ? (coincident(a, b, tol) ?? []) : []
  }
  const ta = (qp[0] * s[1] - qp[1] * s[0]) / cross
  const tb = (qp[0] * r[1] - qp[1] * r[0]) / cross
  const ea = lr ? tol / lr : 0
  const eb = ls ? tol / ls : 0
  if (ta < -ea || ta > 1 + ea || tb < -eb || tb > 1 + eb) return []
  return [[Math.min(1, Math.max(0, ta)), Math.min(1, Math.max(0, tb))]]
}

/** A curve `c` against the line `l`: roots of `c` in the line's own frame. */
const curveLine = (c: Cubic, l: Cubic, tol: number): Hit[] => {
  const [p, , , p2] = l
  const dx = p2[0] - p[0]
  const dy = p2[1] - p[1]
  const length = Math.hypot(dx, dy)
  if (!length) return []
  const off = c.map((q) => ((q[0] - p[0]) * dy - (q[1] - p[1]) * dx) / length)
  if (off.every((v) => Math.abs(v) <= tol)) return coincident(c, l, tol) ?? []
  const [d0, d1, d2, d3] = off as [number, number, number, number]
  const roots = cubicRoots(
    -d0 + 3 * d1 - 3 * d2 + d3,
    3 * d0 - 6 * d1 + 3 * d2,
    -3 * d0 + 3 * d1,
    d0
  )
  const hits: Hit[] = []
  for (const t of roots) {
    const q = pointAt(c, t)
    const s = ((q[0] - p[0]) * dx + (q[1] - p[1]) * dy) / length ** 2
    const e = tol / length
    if (s >= -e && s <= 1 + e) hits.push([t, Math.min(1, Math.max(0, s))])
  }
  return hits
}

const curveCurve = (a: Cubic, b: Cubic, tol: number): Hit[] => {
  const shared = coincident(a, b, tol)
  if (shared) return shared
  const hits: Hit[] = []
  let budget = 20000
  const visit = (
    ca: Cubic,
    a0: number,
    a1: number,
    cb: Cubic,
    b0: number,
    b1: number
  ) => {
    if (budget-- <= 0) return
    const ba = box(ca)
    const bb = box(cb)
    if (!boxesMeet(ba, bb, tol)) return
    const sa = Math.max(ba[2] - ba[0], ba[3] - ba[1])
    const sb = Math.max(bb[2] - bb[0], bb[3] - bb[1])
    if (sa <= tol && sb <= tol) {
      hits.push([(a0 + a1) / 2, (b0 + b1) / 2])
      return
    }
    if (sa >= sb) {
      const m = (a0 + a1) / 2
      visit(subCubic(ca, 0, 0.5), a0, m, cb, b0, b1)
      visit(subCubic(ca, 0.5, 1), m, a1, cb, b0, b1)
    } else {
      const m = (b0 + b1) / 2
      visit(ca, a0, a1, subCubic(cb, 0, 0.5), b0, m)
      visit(ca, a0, a1, subCubic(cb, 0.5, 1), m, b1)
    }
  }
  visit(a, 0, 1, b, 0, 1)
  // One crossing ends as a cluster of tiny boxes: keep one hit per cluster.
  hits.sort((x, y) => x[0] - y[0])
  const out: Hit[] = []
  for (const h of hits) {
    const last = out[out.length - 1]
    if (last && near(pointAt(a, last[0]), pointAt(a, h[0]), tol * 8)) continue
    out.push(h)
  }
  return out
}

/** Every place `a` and `b` meet, as `[ta, tb]`. */
export const intersect = (a: Cubic, b: Cubic, tol: number): Hit[] => {
  if (!boxesMeet(box(a), box(b), tol)) return []
  const la = isLine(a, tol)
  const lb = isLine(b, tol)
  if (la && lb) return lineLine(a, b, tol)
  if (lb) return curveLine(a, b, tol)
  if (la) return curveLine(b, a, tol).map(([tb, ta]) => [ta, tb])
  return curveCurve(a, b, tol)
}
