/**
 * Subtracts one path's area from another's, keeping their curves: both are
 * split where they cross, the subject's pieces outside the cutter and the
 * cutter's pieces inside the subject are kept (the cutter's reversed, so a
 * hole winds against its outline), and the pieces are joined back into
 * closed subpaths. A circle cut from a circle comes back as arcs (cubics),
 * not as a polygon of many points.
 *
 * Open subpaths are lines, not areas, when `openPaths` is `'trim'`: what
 * lies inside the cutter is cut out of them, leaving gaps.
 *
 * Self-intersecting subjects are taken as drawn (their own crossings aren't
 * split), which is right for the outlines an editor makes.
 */
import {
  toCubics,
  serializePath,
  type Cubic,
  type PathData,
  type Point,
  type Segment,
} from '../path.ts'
import {
  cubicBox,
  intersect,
  isStraight,
  pointAt,
  subCubic,
  tangentAt,
} from './intersect.ts'

export interface SubtractOptions {
  /** How the subject's own subpaths fill: which of its loops are holes. @default 'nonzero' */
  fillRule?: 'nonzero' | 'evenodd'
  /**
   * What an open subpath is: `'close'` fills it as if closed (as SVG fills
   * it), `'trim'` treats it as a line and cuts gaps in it. @default 'close'
   */
  openPaths?: 'close' | 'trim'
  /** Decimal places written. @default 3 */
  precision?: number
}

export interface SubtractResult {
  /** The subject less the cutter, as path data; empty when nothing is left. */
  d: string
  /** False when the cutter missed the subject, and `d` is the subject as it was. */
  changed: boolean
}

interface Seg {
  curve: Cubic
  owner: 'a' | 'b'
  contour: number
  splits: number[]
}

interface Contour {
  segs: Seg[]
  closed: boolean
}

interface Piece {
  seg: Seg
  t0: number
  t1: number
  curve: Cubic
  /** Its place in its contour, and how many pieces that contour has. */
  order: number
  count: number
  keep: boolean
  reversed: boolean
}

interface Poly {
  points: Point[]
}

const line = (a: Point, b: Point): Cubic => [
  a,
  [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3],
  [a[0] + ((b[0] - a[0]) * 2) / 3, a[1] + ((b[1] - a[1]) * 2) / 3],
  b,
]

const same = (a: Point, b: Point, tol: number) =>
  Math.abs(a[0] - b[0]) <= tol && Math.abs(a[1] - b[1]) <= tol

const contoursOf = (
  input: PathData,
  owner: 'a' | 'b',
  trim: boolean,
  tol: number
): Contour[] =>
  toCubics(input).flatMap((s, contour): Contour[] => {
    const curves = s.curves.filter((c) => !c.every((p) => same(p, c[0], tol)))
    if (!curves.length) return []
    const closed = s.closed || !trim
    const end = curves[curves.length - 1]![3]
    if (closed && !same(end, curves[0]![0], tol)) curves.push(line(end, curves[0]![0]))
    return [
      { closed, segs: curves.map((curve) => ({ curve, owner, contour, splits: [] })) },
    ]
  })

const flattenInto = (c: Cubic, tol: number, out: Point[], depth = 0): void => {
  if (depth > 14 || isStraight(c, tol)) {
    out.push(c[3])
    return
  }
  flattenInto(subCubic(c, 0, 0.5), tol, out, depth + 1)
  flattenInto(subCubic(c, 0.5, 1), tol, out, depth + 1)
}

const polyOf = (contour: Contour, tol: number): Poly => {
  const points: Point[] = [contour.segs[0]!.curve[0]]
  for (const s of contour.segs) flattenInto(s.curve, tol, points)
  return { points }
}

const area = ({ points }: Poly) => {
  let sum = 0
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!
    const q = points[(i + 1) % points.length]!
    sum += p[0] * q[1] - q[0] * p[1]
  }
  return sum / 2
}

const winding = (polys: readonly Poly[], [x, y]: Point): number => {
  let w = 0
  for (const { points } of polys)
    for (let i = 0; i < points.length; i++) {
      const p = points[i]!
      const q = points[(i + 1) % points.length]!
      const side = (q[0] - p[0]) * (y - p[1]) - (x - p[0]) * (q[1] - p[1])
      if (p[1] <= y) {
        if (q[1] > y && side > 0) w++
      } else if (q[1] <= y && side < 0) w--
    }
  return w
}

/** The nearest point on any outline: how far, and which way the outline runs there. */
const nearest = (
  polys: readonly Poly[],
  p: Point
): { distance: number; direction: Point } => {
  let distance = Infinity
  let direction: Point = [0, 0]
  for (const { points } of polys)
    for (let i = 0; i < points.length; i++) {
      const a = points[i]!
      const b = points[(i + 1) % points.length]!
      const dx = b[0] - a[0]
      const dy = b[1] - a[1]
      const l2 = dx * dx + dy * dy
      const t = l2
        ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2))
        : 0
      const d = Math.hypot(a[0] + dx * t - p[0], a[1] + dy * t - p[1])
      if (d < distance) {
        distance = d
        direction = [dx, dy]
      }
    }
  return { distance, direction }
}

const reverse = (c: Cubic): Cubic => [c[3], c[2], c[1], c[0]]

const splitPieces = (contour: Contour, tol: number): Piece[] => {
  const pieces: Piece[] = []
  for (const seg of contour.segs) {
    const ts = [0]
    for (const t of [...seg.splits].sort((x, y) => x - y)) {
      if (t <= 0 || t >= 1) continue
      const at = pointAt(seg.curve, t)
      if (same(at, pointAt(seg.curve, ts[ts.length - 1]!), tol)) continue
      ts.push(t)
    }
    if (ts.length > 1 && same(pointAt(seg.curve, ts[ts.length - 1]!), seg.curve[3], tol))
      ts.pop()
    ts.push(1)
    for (let i = 1; i < ts.length; i++) {
      const t0 = ts[i - 1]!
      const t1 = ts[i]!
      pieces.push({
        seg,
        t0,
        t1,
        curve: subCubic(seg.curve, t0, t1),
        order: 0,
        count: 0,
        keep: false,
        reversed: false,
      })
    }
  }
  pieces.forEach((p, i) => {
    p.order = i
    p.count = pieces.length
  })
  return pieces
}

/** Joins runs of pieces cut from one segment back into that segment's span. */
const mergeRuns = (pieces: readonly Piece[]): Cubic[] => {
  const out: Cubic[] = []
  let run: Piece | undefined
  let from = 0
  let to = 0
  const flush = () => {
    if (!run) return
    const c = subCubic(run.seg.curve, Math.min(from, to), Math.max(from, to))
    out.push(run.reversed ? reverse(c) : c)
  }
  for (const p of pieces) {
    const start = p.reversed ? p.t1 : p.t0
    const end = p.reversed ? p.t0 : p.t1
    if (
      run &&
      run.seg === p.seg &&
      run.reversed === p.reversed &&
      Math.abs(to - start) < 1e-12
    ) {
      to = end
      continue
    }
    flush()
    run = p
    from = start
    to = end
  }
  flush()
  return out
}

const writeSubpath = (
  curves: readonly Cubic[],
  closed: boolean,
  tol: number
): Segment[] => {
  const out: Segment[] = [['M', curves[0]![0][0], curves[0]![0][1]]]
  const last = curves.length - 1
  curves.forEach((c, i) => {
    // Z draws a closing line itself.
    if (closed && i === last && i > 0 && isStraight(c, tol)) return
    out.push(
      isStraight(c, tol)
        ? ['L', c[3][0], c[3][1]]
        : ['C', c[1][0], c[1][1], c[2][0], c[2][1], c[3][0], c[3][1]]
    )
  })
  if (closed) out.push(['Z'])
  return out
}

/**
 * The subject less the cutter's area, as one path: holes and separated
 * pieces become subpaths of it.
 *
 * ```ts
 * subtractPath('M0 0H10V10H0Z', 'M5 5H15V15H5Z').d // 'M0 0L10 0L10 5L5 5L5 10L0 10Z'
 * ```
 */
export const subtractPath = (
  subject: PathData,
  cutter: PathData,
  options: SubtractOptions = {}
): SubtractResult => {
  const precision = options.precision ?? 3
  const trim = options.openPaths === 'trim'
  const original = Array.isArray(subject)
    ? serializePath(subject, precision)
    : String(subject)
  // Tolerances scale with the drawing, so an icon's 16 units and a poster's
  // 2000 behave alike.
  const boxes = [...toCubics(subject), ...toCubics(cutter)].flatMap((s) =>
    s.curves.map(cubicBox)
  )
  if (!boxes.length) return { d: original, changed: false }
  const size = Math.max(
    Math.max(...boxes.map((b) => b[2])) - Math.min(...boxes.map((b) => b[0])),
    Math.max(...boxes.map((b) => b[3])) - Math.min(...boxes.map((b) => b[1])),
    1e-9
  )
  const tol = size * 1e-7
  const join = size * 1e-5
  const onEdge = size * 1e-4
  const flat = size * 1e-5

  const a = contoursOf(subject, 'a', trim, tol)
  const b = contoursOf(cutter, 'b', false, tol)
  if (!a.length || !b.length) return { d: original, changed: false }
  const aClosed = a.filter((c) => c.closed)
  const aPolys = aClosed.map((c) => polyOf(c, flat))
  const bPolys = b.map((c) => polyOf(c, flat))
  const turn = (contour: Contour) => {
    contour.segs = contour.segs.map((s) => ({ ...s, curve: reverse(s.curve) })).reverse()
  }

  if (options.fillRule === 'evenodd') {
    // Under evenodd a loop inside another is a hole whichever way it winds,
    // but joining pieces needs holes to wind against their outlines: turn
    // each loop by how deeply it's nested.
    const signs = aPolys.map((p, i) => {
      const depth = aPolys.filter(
        (q, j) => j !== i && winding([q], p.points[0]!) !== 0
      ).length
      return depth % 2 ? -1 : 1
    })
    aClosed.forEach((contour, i) => {
      if (Math.sign(area(aPolys[i]!)) === signs[i]) return
      turn(contour)
      aPolys[i] = polyOf(contour, flat)
    })
  }

  // A hole must wind against the outline it's cut from, or `nonzero` fills
  // it back in: turn the cutter to the subject's way round.
  const main = aPolys.reduce<Poly | undefined>(
    (m, p) => (!m || Math.abs(area(p)) > Math.abs(area(m)) ? p : m),
    undefined
  )
  const way = main ? Math.sign(area(main)) : 1
  b.forEach((contour, i) => {
    if (Math.sign(area(bPolys[i]!)) === way || !way) return
    turn(contour)
    bPolys[i] = polyOf(contour, flat)
  })

  const aSegs = a.flatMap((c) => c.segs)
  const bSegs = b.flatMap((c) => c.segs)
  for (const sa of aSegs)
    for (const sb of bSegs)
      for (const [ta, tb] of intersect(sa.curve, sb.curve, tol)) {
        sa.splits.push(ta)
        sb.splits.push(tb)
      }

  const insideA = (p: Point) => {
    const w = winding(aPolys, p)
    return options.fillRule === 'evenodd' ? w % 2 !== 0 : w !== 0
  }
  let changed = false
  const aPieces = a.map((contour) => {
    const pieces = splitPieces(contour, join)
    for (const p of pieces) {
      const mid = pointAt(p.curve, 0.5)
      const edge = nearest(bPolys, mid)
      if (edge.distance <= onEdge) {
        // Along the cutter's edge: an outline running against the cutter's
        // has the subject on the far side, outside the cut, so it stays.
        const t = tangentAt(p.curve, 0.5)
        p.keep =
          !contour.closed || t[0] * edge.direction[0] + t[1] * edge.direction[1] < 0
      } else p.keep = winding(bPolys, mid) === 0
      if (!p.keep) changed = true
    }
    return pieces
  })
  const bPieces = b.map((contour) => {
    const pieces = splitPieces(contour, join)
    for (const p of pieces) {
      const mid = pointAt(p.curve, 0.5)
      p.keep = nearest(aPolys, mid).distance > onEdge && insideA(mid)
      p.reversed = true
      if (p.keep) changed = true
    }
    return pieces
  })
  if (!changed) return { d: original, changed: false }

  const segments: Segment[] = []
  // Open subpaths: each run of kept pieces is a line of its own.
  a.forEach((contour, i) => {
    if (contour.closed) return
    let run: Piece[] = []
    const flush = () => {
      if (run.length) segments.push(...writeSubpath(mergeRuns(run), false, tol))
      run = []
    }
    for (const p of aPieces[i]!) {
      if (p.keep) run.push(p)
      else flush()
    }
    flush()
  })

  // Closed: follow kept pieces end to start until each loop closes.
  const kept = [
    ...a.flatMap((c, i) => (c.closed ? aPieces[i]!.filter((p) => p.keep) : [])),
    ...bPieces.flat().filter((p) => p.keep),
  ]
  const startOf = (p: Piece) => (p.reversed ? p.curve[3] : p.curve[0])
  const endOf = (p: Piece) => (p.reversed ? p.curve[0] : p.curve[3])
  const follows = (p: Piece, q: Piece) =>
    p.seg.owner === q.seg.owner &&
    p.seg.contour === q.seg.contour &&
    (p.reversed
      ? (q.order + 1) % q.count === p.order
      : (p.order + 1) % p.count === q.order)
  const used = new Set<Piece>()
  for (const first of kept) {
    if (used.has(first)) continue
    used.add(first)
    const chain = [first]
    for (;;) {
      const last = chain[chain.length - 1]!
      const end = endOf(last)
      if (
        same(end, startOf(first), join) &&
        (chain.length > 1 || same(first.curve[0], first.curve[3], join))
      )
        break
      const next =
        kept.find(
          (q) => !used.has(q) && follows(last, q) && same(startOf(q), end, join)
        ) ?? kept.find((q) => !used.has(q) && same(startOf(q), end, join))
      if (!next) break
      used.add(next)
      chain.push(next)
    }
    segments.push(...writeSubpath(mergeRuns(chain), true, tol))
  }
  return { d: segments.length ? serializePath(segments, precision) : '', changed: true }
}
