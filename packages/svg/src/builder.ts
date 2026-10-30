import { serializePath, type Point, type Segment } from './path.ts'
import { shapeSegments, type ArcSpec, type ShapeSpec } from './shapes.ts'

/** How a path builder writes. */
export interface PathBuilderOptions {
  /**
   * Coordinates you pass to the drawing commands are relative to the current
   * point (lowercase commands). Shapes are always placed absolutely.
   * @default false
   */
  relative?: boolean
  /** Decimals kept when written as path data. @default 3 */
  precision?: number
}

/**
 * Builds path data by chaining commands, and whole shapes, onto one path.
 *
 * ```ts
 * const d = path().moveTo(0, 0).lineTo(40, 0).arc({ cx: 40, cy: 20, r: 20, start: 0, length: 180 })
 *   .close().toString()
 * ```
 */
export class PathBuilder {
  readonly segments: Segment[] = []
  readonly #relative: boolean
  readonly #precision: number

  constructor(options: PathBuilderOptions = {}) {
    this.#relative = options.relative ?? false
    this.#precision = options.precision ?? 3
  }

  #add(command: Segment[0], ...values: number[]): this {
    const letter = this.#relative ? command.toLowerCase() : command.toUpperCase()
    this.segments.push([letter, ...values] as Segment)
    return this
  }

  /** Moves the pen without drawing, starting a new subpath. */
  moveTo(x: number, y: number): this {
    return this.#add('M', x, y)
  }
  /** A straight line. */
  lineTo(x: number, y: number): this {
    return this.#add('L', x, y)
  }
  /** A horizontal line to `x`. */
  horizontalTo(x: number): this {
    return this.#add('H', x)
  }
  /** A vertical line to `y`. */
  verticalTo(y: number): this {
    return this.#add('V', y)
  }
  /** A cubic Bézier, with two control points. */
  curveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number): this {
    return this.#add('C', x1, y1, x2, y2, x, y)
  }
  /** A cubic Bézier whose first control point mirrors the last curve's (`S`). */
  smoothCurveTo(x2: number, y2: number, x: number, y: number): this {
    return this.#add('S', x2, y2, x, y)
  }
  /** A quadratic Bézier, with one control point. */
  quadTo(x1: number, y1: number, x: number, y: number): this {
    return this.#add('Q', x1, y1, x, y)
  }
  /** A quadratic Bézier whose control point mirrors the last one (`T`). */
  smoothQuadTo(x: number, y: number): this {
    return this.#add('T', x, y)
  }
  /** SVG's elliptical arc command (`A`), as written in path data. */
  arcTo(
    rx: number,
    ry: number,
    rotation: number,
    largeArc: boolean,
    sweep: boolean,
    x: number,
    y: number
  ): this {
    return this.#add('A', rx, ry, rotation, +largeArc, +sweep, x, y)
  }
  /** Closes the subpath with a line back to its start. */
  close(): this {
    return this.#add('Z')
  }

  /** Appends a whole shape as its own subpath, in absolute coordinates. */
  shape(spec: ShapeSpec): this {
    this.segments.push(...shapeSegments(spec))
    return this
  }
  /**
   * An arc by center, start angle and length, in degrees clockwise from the
   * top: easier than `arcTo`'s endpoints and flags.
   */
  arc(spec: Omit<ArcSpec, 'type'>): this {
    return this.shape({ type: 'arc', ...spec })
  }
  /** A circle. */
  circle(cx: number, cy: number, r: number): this {
    return this.shape({ type: 'circle', cx, cy, r })
  }
  /** An ellipse. */
  ellipse(cx: number, cy: number, rx: number, ry: number): this {
    return this.shape({ type: 'ellipse', cx, cy, rx, ry })
  }
  /** A rectangle, optionally with rounded corners. */
  rect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius?: number | Point
  ): this {
    const [rx, ry] = typeof radius === 'number' ? [radius, radius] : (radius ?? [0, 0])
    return this.shape({ type: 'rect', x, y, width, height, rx, ry })
  }
  /** Points joined by lines; `closed` makes a polygon. */
  points(points: readonly Point[], closed = false): this {
    return this.shape({ type: closed ? 'polygon' : 'polyline', points })
  }
  /** A regular polygon, its first corner at the top. */
  regularPolygon(cx: number, cy: number, r: number, sides = 6, rotation = 0): this {
    return this.shape({ type: 'regularPolygon', cx, cy, r, sides, rotation })
  }
  /** A star, its first point at the top. */
  star(
    cx: number,
    cy: number,
    r: number,
    innerRadius = r / 2,
    points = 5,
    rotation = 0
  ): this {
    return this.shape({ type: 'star', cx, cy, r, innerRadius, points, rotation })
  }

  /** Removes every segment. */
  clear(): this {
    this.segments.length = 0
    return this
  }

  /** The path data. */
  toString(): string {
    return serializePath(this.segments, this.#precision)
  }
}

/** Starts a path builder: `path().moveTo(0, 0).lineTo(10, 10).toString()`. */
export const path = (options?: PathBuilderOptions): PathBuilder =>
  new PathBuilder(options)
