import { node, type SvgNode } from './node.ts'

/** A color stop: a color (spaced evenly with the others), or one with its own place. */
export type GradientStop =
  | string
  | {
      color: string
      /** Where it sits, in percent along the gradient. @default evenly spaced */
      offset?: number
      /** @default 1 */
      opacity?: number
    }

/** What every gradient takes. */
export interface GradientBase {
  /** The id to reference it by: `fill={url(id)}`. */
  id: string
  /** Two or more colors. */
  stops: readonly GradientStop[]
  /**
   * `'objectBoundingBox'` (fractions of the shape's box) or
   * `'userSpaceOnUse'` (the drawing's units). @default 'objectBoundingBox'
   */
  units?: 'objectBoundingBox' | 'userSpaceOnUse'
  /** What happens past the ends. @default 'pad' */
  spread?: 'pad' | 'reflect' | 'repeat'
  /** A `gradientTransform`. */
  transform?: string
}

/** A linear gradient, by angle or by its two points. */
export interface LinearGradientOptions extends GradientBase {
  /**
   * Its direction in degrees, as in CSS: 0 runs bottom to top, 90 left to
   * right, 180 top to bottom. Ignored when you give the points. @default 180
   */
  angle?: number
  /** Where the gradient line starts, x (overrides `angle`). */
  x1?: number | string
  /** Where the gradient line starts, y (overrides `angle`). */
  y1?: number | string
  /** Where the gradient line ends, x (overrides `angle`). */
  x2?: number | string
  /** Where the gradient line ends, y (overrides `angle`). */
  y2?: number | string
}

/** A radial gradient: its circle, and optionally a focal point inside it. */
export interface RadialGradientOptions extends GradientBase {
  /** The end circle's center, x. @default '50%' */
  cx?: number | string
  /** The end circle's center, y. @default '50%' */
  cy?: number | string
  /** The end circle's radius, where the last color is. @default '50%' */
  r?: number | string
  /** The focal point, where the first color is, x. @default the center */
  fx?: number | string
  /** The focal point, where the first color is, y. @default the center */
  fy?: number | string
  /** The focal circle's radius. @default 0 */
  fr?: number | string
}

const fix = (n: number) => Math.round(n * 1e4) / 1e4 || 0

/** The gradient line's points for an angle, in a unit box. */
export const angleToPoints = (
  angle: number
): { x1: number; y1: number; x2: number; y2: number } => {
  const rad = (angle * Math.PI) / 180
  const dx = Math.sin(rad) / 2
  const dy = -Math.cos(rad) / 2
  return { x1: fix(0.5 - dx), y1: fix(0.5 - dy), x2: fix(0.5 + dx), y2: fix(0.5 + dy) }
}

/** `<stop>` nodes for a list of stops; those without an offset are spaced evenly. */
export const gradientStops = (stops: readonly GradientStop[]): SvgNode[] =>
  stops.map((stop, i) => {
    const s = typeof stop === 'string' ? { color: stop } : stop
    const offset = s.offset ?? (stops.length > 1 ? (i / (stops.length - 1)) * 100 : 0)
    return node('stop', {
      offset: `${fix(offset)}%`,
      'stop-color': s.color,
      'stop-opacity': s.opacity,
    })
  })

const common = (o: GradientBase) => ({
  id: o.id,
  gradientUnits: o.units,
  spreadMethod: o.spread,
  gradientTransform: o.transform,
})

/**
 * A `<linearGradient>`.
 *
 * ```ts
 * linearGradient({ id: 'sky', angle: 135, stops: ['#38bdf8', '#6366f1'] })
 * ```
 */
export const linearGradient = (options: LinearGradientOptions): SvgNode => {
  const { x1, y1, x2, y2 } = options
  const points =
    (x1 ?? y1 ?? x2 ?? y2) ? { x1, y1, x2, y2 } : angleToPoints(options.angle ?? 180)
  return node(
    'linearGradient',
    { ...common(options), ...points },
    gradientStops(options.stops)
  )
}

/** A `<radialGradient>`. */
export const radialGradient = (options: RadialGradientOptions): SvgNode => {
  const { cx, cy, r, fx, fy, fr } = options
  return node(
    'radialGradient',
    { ...common(options), cx, cy, r, fx, fy, fr },
    gradientStops(options.stops)
  )
}

/** One `<stop>` as properties, for tweening. */
export class StopControl {
  readonly element: Element
  constructor(element: Element) {
    this.element = element
  }
  /** Where it sits, in percent. */
  get offset(): number {
    const value = this.element.getAttribute('offset') ?? '0'
    return value.endsWith('%') ? parseFloat(value) : parseFloat(value) * 100
  }
  set offset(value: number) {
    this.element.setAttribute('offset', `${fix(value)}%`)
  }
  /** Its color. */
  get color(): string {
    return this.element.getAttribute('stop-color') ?? 'black'
  }
  set color(value: string) {
    this.element.setAttribute('stop-color', value)
  }
  /** Its opacity, 0–1. */
  get opacity(): number {
    return parseFloat(this.element.getAttribute('stop-opacity') ?? '1')
  }
  set opacity(value: number) {
    this.element.setAttribute('stop-opacity', String(fix(value)))
  }
}

/**
 * A gradient element as properties: `angle` (linear gradients) and each
 * stop's `offset`, `color` and `opacity`, so a tween can turn or recolor it.
 *
 * ```ts
 * const sky = gradientControl(document.getElementById('sky')!)
 * animate(sky, { angle: [0, 360] }, { duration: 4, repeat: -1 })
 * animate(sky.stops[0], { color: '#f97316' })
 * ```
 */
export class GradientControl {
  readonly element: Element
  readonly stops: StopControl[]
  #angle: number

  constructor(element: Element) {
    this.element = element
    this.stops = [...element.querySelectorAll('stop')].map((s) => new StopControl(s))
    const n = (name: string, fallback: number) => {
      const v = element.getAttribute(name)
      return v === null ? fallback : v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v)
    }
    const dx = n('x2', 1) - n('x1', 0)
    const dy = n('y2', 0) - n('y1', 0)
    this.#angle = fix((Math.atan2(dx, -dy) * 180) / Math.PI)
  }

  /** The direction, in degrees as in CSS (linear gradients only). */
  get angle(): number {
    return this.#angle
  }
  set angle(value: number) {
    this.#angle = value
    for (const [k, v] of Object.entries(angleToPoints(value)))
      this.element.setAttribute(k, String(v))
  }
}

/** Controls a gradient element: see `GradientControl`. */
export const gradientControl = (element: Element): GradientControl =>
  new GradientControl(element)
