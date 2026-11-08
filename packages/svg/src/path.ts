/** A point: `[x, y]`. */
export type Point = readonly [x: number, y: number]

/** Each absolute command's parameters, in the order SVG writes them. */
interface Parameters {
  M: [x: number, y: number]
  L: [x: number, y: number]
  H: [x: number]
  V: [y: number]
  C: [x1: number, y1: number, x2: number, y2: number, x: number, y: number]
  S: [x2: number, y2: number, x: number, y: number]
  Q: [x1: number, y1: number, x: number, y: number]
  T: [x: number, y: number]
  A: [
    rx: number,
    ry: number,
    rotation: number,
    largeArc: 0 | 1,
    sweep: 0 | 1,
    x: number,
    y: number,
  ]
  Z: []
}

/** An absolute path command: `M`, `L`, `H`, `V`, `C`, `S`, `Q`, `T`, `A` or `Z`. */
export type AbsoluteCommand = keyof Parameters
/** Any path command; lowercase is relative to the current point. */
export type Command = AbsoluteCommand | Lowercase<AbsoluteCommand>

/** One drawing command and its parameters: `['C', 0, 0, 10, 0, 10, 10]`. */
export type Segment = { [K in Command]: [K, ...Parameters[Uppercase<K>]] }[Command]
/** A segment whose command is absolute (uppercase). */
export type AbsoluteSegment = {
  [K in AbsoluteCommand]: [K, ...Parameters[K]]
}[AbsoluteCommand]

/** A cubic Bézier: start, two control points, end. */
export type Cubic = readonly [p0: Point, c1: Point, c2: Point, p3: Point]

/** One subpath as cubics only: what morphing and measuring work on. */
export interface CubicSubpath {
  start: Point
  curves: Cubic[]
  closed: boolean
}

const ARITY: Record<AbsoluteCommand, number> = {
  M: 2,
  L: 2,
  H: 1,
  V: 1,
  C: 6,
  S: 4,
  Q: 4,
  T: 2,
  A: 7,
  Z: 0,
}

const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i
const SEPARATOR = /^[\s,]+/

/**
 * Parses path data (`d`) into segments, following the SVG grammar: implicit
 * repeats (`M0 0 10 10` is a move then a line), compact numbers (`1.5.5`,
 * `-1-2`) and arc flags written without separators (`a1 1 0 00 1 1`).
 * Throws on anything it can't read, naming the position.
 */
export const parsePath = (d: string): Segment[] => {
  const segments: Segment[] = []
  let rest = d.trim()
  let command: Command | undefined
  const fail = (): never => {
    throw new SyntaxError(`Invalid path data at ${d.length - rest.length}: "${d}"`)
  }
  const skip = () => (rest = rest.replace(SEPARATOR, ''))
  const number = (flag: boolean): number => {
    skip()
    // Arc flags are one digit, and may run into what follows ("011").
    const match = flag ? /^[01]/.exec(rest) : NUMBER.exec(rest)
    if (!match) return fail()
    rest = rest.slice(match[0].length)
    return Number(match[0])
  }
  while ((skip(), rest)) {
    const letter = /^[MLHVCSQTAZ]/i.exec(rest)?.[0] as Command | undefined
    if (letter) rest = rest.slice(1)
    else if (!command || command === 'Z' || command === 'z') fail()
    let current = letter ?? command!
    // A move's implicit repeats are lines.
    if (!letter && (current === 'M' || current === 'm'))
      current = current === 'M' ? 'L' : 'l'
    const upper = current.toUpperCase() as AbsoluteCommand
    const values: number[] = []
    for (let i = 0; i < ARITY[upper]; i++)
      values.push(number(upper === 'A' && (i === 3 || i === 4)))
    segments.push([current, ...values] as Segment)
    command = current
  }
  return segments
}

const round = (n: number, precision: number): number => {
  const k = 10 ** precision
  const r = Math.round(n * k) / k
  // No "-0" in the output.
  return r === 0 ? 0 : r
}

/** Writes segments as path data, numbers rounded to `precision` decimals. */
export const serializePath = (segments: readonly Segment[], precision = 3): string =>
  segments
    .map(([command, ...values]) =>
      values.length
        ? `${command}${values.map((v) => round(v, precision)).join(' ')}`
        : command
    )
    .join('')

/** Path data, segments, or anything with a `toString()` that gives path data (a builder). */
export type PathData = string | readonly Segment[] | { toString(): string }

const toSegments = (input: PathData): Segment[] =>
  typeof input === 'string'
    ? parsePath(input)
    : Array.isArray(input)
      ? (input as Segment[])
      : parsePath(String(input))

/**
 * Rewrites every segment in absolute coordinates, with the same commands
 * otherwise (`h` becomes `H`, `s` becomes `S`).
 */
export const absolutize = (input: PathData): AbsoluteSegment[] => {
  let x = 0
  let y = 0
  let startX = 0
  let startY = 0
  return toSegments(input).map((segment): AbsoluteSegment => {
    const [command, ...v] = segment as [Command, ...number[]]
    const relative = command !== command.toUpperCase()
    const upper = command.toUpperCase() as AbsoluteCommand
    const dx = relative ? x : 0
    const dy = relative ? y : 0
    let out: number[]
    switch (upper) {
      case 'H':
        out = [v[0]! + dx]
        x = out[0]!
        break
      case 'V':
        out = [v[0]! + dy]
        y = out[0]!
        break
      case 'A':
        out = [v[0]!, v[1]!, v[2]!, v[3]!, v[4]!, v[5]! + dx, v[6]! + dy]
        ;[x, y] = [out[5]!, out[6]!]
        break
      case 'Z':
        out = []
        ;[x, y] = [startX, startY]
        break
      default:
        out = v.map((n, i) => n + (i % 2 ? dy : dx))
        ;[x, y] = [out[out.length - 2]!, out[out.length - 1]!]
    }
    if (upper === 'M') [startX, startY] = [x, y]
    return [upper, ...out] as AbsoluteSegment
  })
}

/** A straight line as a cubic, controls at thirds so it moves evenly when morphed. */
const lineCubic = (a: Point, b: Point): Cubic => [
  a,
  [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3],
  [a[0] + ((b[0] - a[0]) * 2) / 3, a[1] + ((b[1] - a[1]) * 2) / 3],
  b,
]

/** An elliptical arc in center form: where its ellipse is, and the turn it draws. */
export interface ArcCenter {
  cx: number
  cy: number
  /** The radii, scaled up where the written ones can't reach the endpoints. */
  rx: number
  ry: number
  /** The ellipse's rotation, in radians. */
  phi: number
  /** The start angle and the signed turn, in radians, on the unrotated ellipse. */
  theta: number
  delta: number
}

/**
 * An arc segment's ellipse and turn: the SVG spec's endpoint-to-center
 * conversion (appendix B.2.4). `null` when the arc draws a straight line or
 * nothing (equal endpoints, a zero radius).
 */
export const arcCenter = (
  from: Point,
  rxIn: number,
  ryIn: number,
  rotation: number,
  largeArc: number,
  sweep: number,
  to: Point
): ArcCenter | null => {
  if (from[0] === to[0] && from[1] === to[1]) return null
  let rx = Math.abs(rxIn)
  let ry = Math.abs(ryIn)
  if (!rx || !ry) return null
  const phi = (rotation * Math.PI) / 180
  const cos = Math.cos(phi)
  const sin = Math.sin(phi)
  const hx = (from[0] - to[0]) / 2
  const hy = (from[1] - to[1]) / 2
  const x1 = cos * hx + sin * hy
  const y1 = -sin * hx + cos * hy
  // Radii too small for the endpoints are scaled up, as browsers do.
  const scale = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry)
  if (scale > 1) {
    rx *= Math.sqrt(scale)
    ry *= Math.sqrt(scale)
  }
  const sign = largeArc === sweep ? -1 : 1
  const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1
  const k = sign * Math.sqrt(Math.max(0, num / (rx * rx * y1 * y1 + ry * ry * x1 * x1)))
  const cx1 = (k * rx * y1) / ry
  const cy1 = (-k * ry * x1) / rx
  const cx = cos * cx1 - sin * cy1 + (from[0] + to[0]) / 2
  const cy = sin * cx1 + cos * cy1 + (from[1] + to[1]) / 2
  const angle = (ux: number, uy: number, vx: number, vy: number) =>
    Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
  const theta = angle(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry)
  let delta = angle((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry)
  if (!sweep && delta > 0) delta -= 2 * Math.PI
  if (sweep && delta < 0) delta += 2 * Math.PI
  return { cx, cy, rx, ry, phi, theta, delta }
}

/** An elliptical arc as cubics: its center form (`arcCenter`), then one cubic per quarter turn or less. */
export const arcToCubics = (
  from: Point,
  rxIn: number,
  ryIn: number,
  rotation: number,
  largeArc: number,
  sweep: number,
  to: Point
): Cubic[] => {
  if (from[0] === to[0] && from[1] === to[1]) return []
  const arc = arcCenter(from, rxIn, ryIn, rotation, largeArc, sweep, to)
  if (!arc) return [lineCubic(from, to)]
  const { cx, cy, rx, ry, theta, delta } = arc
  const cos = Math.cos(arc.phi)
  const sin = Math.sin(arc.phi)
  const count = Math.max(1, Math.ceil(Math.abs(delta) / (Math.PI / 2) - 1e-9))
  const step = delta / count
  const t = (4 / 3) * Math.tan(step / 4)
  const at = (a: number): Point => [
    cx + rx * Math.cos(a) * cos - ry * Math.sin(a) * sin,
    cy + rx * Math.cos(a) * sin + ry * Math.sin(a) * cos,
  ]
  const derivative = (a: number): Point => [
    -rx * Math.sin(a) * cos - ry * Math.cos(a) * sin,
    -rx * Math.sin(a) * sin + ry * Math.cos(a) * cos,
  ]
  const curves: Cubic[] = []
  for (let i = 0; i < count; i++) {
    const a0 = theta + step * i
    const a1 = a0 + step
    const p0 = i === 0 ? from : at(a0)
    const p3 = i === count - 1 ? to : at(a1)
    const d0 = derivative(a0)
    const d1 = derivative(a1)
    curves.push([
      p0,
      [p0[0] + t * d0[0], p0[1] + t * d0[1]],
      [p3[0] - t * d1[0], p3[1] - t * d1[1]],
      p3,
    ])
  }
  return curves
}

/**
 * Normalizes a path to cubics only, one list per subpath: lines, quadratics
 * and arcs become cubics, and a closed subpath's closing line is drawn as a
 * curve too, so every subpath can be morphed and measured the same way.
 */
export const toCubics = (input: PathData): CubicSubpath[] => {
  const subpaths: CubicSubpath[] = []
  let current: CubicSubpath | undefined
  let point: Point = [0, 0]
  // The last control point, reflected by S and T.
  let control: Point | undefined
  let quadControl: Point | undefined
  const push = (curve: Cubic) => {
    if (!current) {
      current = { start: point, curves: [], closed: false }
      subpaths.push(current)
    }
    current.curves.push(curve)
    point = curve[3]
  }
  for (const segment of absolutize(input)) {
    const [command, ...v] = segment as [AbsoluteCommand, ...number[]]
    let nextControl: Point | undefined
    let nextQuad: Point | undefined
    switch (command) {
      case 'M':
        point = [v[0]!, v[1]!]
        current = { start: point, curves: [], closed: false }
        subpaths.push(current)
        break
      case 'L':
        push(lineCubic(point, [v[0]!, v[1]!]))
        break
      case 'H':
        push(lineCubic(point, [v[0]!, point[1]]))
        break
      case 'V':
        push(lineCubic(point, [point[0], v[0]!]))
        break
      case 'C':
      case 'S': {
        const c1: Point =
          command === 'C'
            ? [v[0]!, v[1]!]
            : control
              ? [2 * point[0] - control[0], 2 * point[1] - control[1]]
              : point
        const rest = command === 'C' ? v.slice(2) : v
        nextControl = [rest[0]!, rest[1]!]
        push([point, c1, nextControl, [rest[2]!, rest[3]!]])
        break
      }
      case 'Q':
      case 'T': {
        const q: Point =
          command === 'Q'
            ? [v[0]!, v[1]!]
            : quadControl
              ? [2 * point[0] - quadControl[0], 2 * point[1] - quadControl[1]]
              : point
        const end: Point = command === 'Q' ? [v[2]!, v[3]!] : [v[0]!, v[1]!]
        nextQuad = q
        // Degree elevation: a quadratic is exactly this cubic.
        push([
          point,
          [
            point[0] + ((q[0] - point[0]) * 2) / 3,
            point[1] + ((q[1] - point[1]) * 2) / 3,
          ],
          [end[0] + ((q[0] - end[0]) * 2) / 3, end[1] + ((q[1] - end[1]) * 2) / 3],
          end,
        ])
        break
      }
      case 'A':
        for (const curve of arcToCubics(point, v[0]!, v[1]!, v[2]!, v[3]!, v[4]!, [
          v[5]!,
          v[6]!,
        ]))
          push(curve)
        break
      case 'Z':
        if (current) {
          const { start } = current
          if (point[0] !== start[0] || point[1] !== start[1])
            push(lineCubic(point, start))
          current.closed = true
          point = start
          // Drawing on after Z starts a new subpath at the same point.
          current = undefined
        }
        break
    }
    control = nextControl
    quadControl = nextQuad
  }
  return subpaths.filter((s) => s.curves.length || subpaths.length === 1)
}

/** Writes cubic subpaths as path data. */
export const cubicsToPath = (subpaths: readonly CubicSubpath[], precision = 3): string =>
  serializePath(
    subpaths.flatMap((s): Segment[] => [
      ['M', s.start[0], s.start[1]],
      ...s.curves.map((c): Segment => [
        'C',
        c[1][0],
        c[1][1],
        c[2][0],
        c[2][1],
        c[3][0],
        c[3][1],
      ]),
      ...(s.closed ? [['Z'] as Segment] : []),
    ]),
    precision
  )

/** Reverses a path's direction, subpath by subpath (as cubics). */
export const reversePath = (input: PathData, precision = 3): string =>
  cubicsToPath(
    toCubics(input).map((s) => {
      const curves = s.curves.map((c): Cubic => [c[3], c[2], c[1], c[0]]).reverse()
      return { start: curves[0]?.[0] ?? s.start, curves, closed: s.closed }
    }),
    precision
  )

/** A 2D affine transform, as SVG's `matrix(a b c d e f)`. */
export type Matrix = readonly [
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
]

/** What `transformPath` applies, in this order: scale, rotate, then translate, about `origin`. */
export interface TransformOptions {
  /** Moves the path by `[x, y]`. */
  translate?: Point
  /** Scales by one factor or `[x, y]`. */
  scale?: number | Point
  /** Rotates clockwise, in degrees. */
  rotate?: number
  /** The point scale and rotation are about. @default [0, 0] */
  origin?: Point
  /** Any other transform, applied after the rest. */
  matrix?: Matrix
}

const multiply = (m: Matrix, n: Matrix): Matrix => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
]

/**
 * Transforms a path's geometry (as cubics, so arcs stay exact under rotation
 * and uneven scales), rather than adding a `transform` attribute.
 */
export const transformPath = (
  input: PathData,
  options: TransformOptions,
  precision = 3
): string => {
  const [ox, oy] = options.origin ?? [0, 0]
  const [sx, sy] =
    typeof options.scale === 'number'
      ? [options.scale, options.scale]
      : (options.scale ?? [1, 1])
  const r = ((options.rotate ?? 0) * Math.PI) / 180
  const [tx, ty] = options.translate ?? [0, 0]
  let m: Matrix = [1, 0, 0, 1, -ox, -oy]
  m = multiply([sx, 0, 0, sy, 0, 0], m)
  m = multiply([Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0], m)
  m = multiply([1, 0, 0, 1, ox + tx, oy + ty], m)
  if (options.matrix) m = multiply(options.matrix, m)
  const apply = ([x, y]: Point): Point => [
    m[0] * x + m[2] * y + m[4],
    m[1] * x + m[3] * y + m[5],
  ]
  return cubicsToPath(
    toCubics(input).map((s) => ({
      start: apply(s.start),
      curves: s.curves.map((c) => c.map(apply) as unknown as Cubic),
      closed: s.closed,
    })),
    precision
  )
}
