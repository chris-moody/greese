/**
 * Paint as an editor stores it: a solid color, a gradient, or none, with the
 * pure maths the gradient editor needs. The shapes are Glop's, so its
 * documents load unchanged.
 */

/** A color stop: `offset` is 0–1 along the gradient's axis. */
export interface GradientColorStop {
  offset: number
  color: string
}

/**
 * A linear or radial gradient. Coordinates are fractions of the painted
 * shape's box (0,0 its top-left, 1,1 its bottom-right), as SVG's
 * `objectBoundingBox` and Pixi's local texture space read them, and are not
 * clamped: a gradient may reach past the box. A radial's inner circle
 * (`cx`, `cy`, `innerRadius`) is where the first stop is, its outer circle
 * where the last is. `rotation` is degrees clockwise from up, and `scaleY`
 * squashes it.
 */
export type GradientFill =
  | {
      type: 'linear'
      x0: number
      y0: number
      x1: number
      y1: number
      stops: GradientColorStop[]
    }
  | {
      type: 'radial'
      cx: number
      cy: number
      innerRadius: number
      outerCx: number
      outerCy: number
      outerRadius: number
      rotation: number
      scaleY: number
      stops: GradientColorStop[]
    }

/** A fill or stroke: a color, a gradient, or deliberately nothing. */
export type ComplexColorValue =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; gradient: GradientFill }
  | { type: 'none' }

/** A gradient has at least this many stops: the editor won't delete below it. */
export const MIN_GRADIENT_STOPS = 2

const wrap360 = (deg: number): number => ((deg % 360) + 360) % 360

/**
 * Which way a gradient points, in degrees clockwise from up: a radial's
 * `rotation`, or a linear's start-to-end line.
 */
export const gradientDirection = (value: GradientFill): number => {
  if (value.type === 'radial') return value.rotation
  const dx = value.x1 - value.x0
  const dy = value.y1 - value.y0
  if (dx === 0 && dy === 0) return 0
  return wrap360(Math.round((Math.atan2(dx, -dy) * 180) / Math.PI))
}

/**
 * The gradient turned to point `direction`: a radial's `rotation`, or a
 * linear's line turned about its middle, keeping its length.
 */
export const withGradientDirection = (
  value: GradientFill,
  direction: number
): GradientFill => {
  if (value.type === 'radial') return { ...value, rotation: direction }
  const cx = (value.x0 + value.x1) / 2
  const cy = (value.y0 + value.y1) / 2
  const half = Math.hypot(value.x1 - value.x0, value.y1 - value.y0) / 2 || 0.5
  const radians = (direction * Math.PI) / 180
  const dx = Math.sin(radians) * half
  const dy = -Math.cos(radians) * half
  return { ...value, x0: cx - dx, y0: cy - dy, x1: cx + dx, y1: cy + dy }
}

/**
 * The gradient as the other type, keeping its stops and place: a linear's
 * middle becomes a radial's centre and half its length the radius; a
 * radial's outer circle becomes a horizontal line across it.
 */
export const withGradientType = (
  value: GradientFill,
  type: GradientFill['type']
): GradientFill => {
  if (type === value.type) return value
  if (value.type === 'linear') {
    const cx = (value.x0 + value.x1) / 2
    const cy = (value.y0 + value.y1) / 2
    const outerRadius = Math.hypot(value.x1 - value.x0, value.y1 - value.y0) / 2 || 0.25
    return {
      type: 'radial',
      cx,
      cy,
      innerRadius: 0,
      outerCx: cx,
      outerCy: cy,
      outerRadius,
      rotation: 0,
      scaleY: 1,
      stops: value.stops,
    }
  }
  const { outerCx: cx, outerCy: cy, outerRadius: r } = value
  return { type: 'linear', x0: cx - r, y0: cy, x1: cx + r, y1: cy, stops: value.stops }
}

/**
 * A left-to-right gradient across the box, from `from` to black. Glop's
 * default ran to `x1: 100`, a hundred boxes wide, in a 0–1 space.
 */
export const defaultGradient = (from = '#ffffff'): GradientFill => ({
  type: 'linear',
  x0: 0,
  y0: 0.5,
  x1: 1,
  y1: 0.5,
  stops: [
    { offset: 0, color: from },
    { offset: 1, color: '#000000' },
  ],
})

/** The paint as another kind, carrying its color across where it can. */
export const withPaintType = (
  value: ComplexColorValue,
  type: ComplexColorValue['type']
): ComplexColorValue => {
  if (type === value.type) return value
  if (type === 'none') return { type: 'none' }
  if (type === 'gradient') {
    return {
      type: 'gradient',
      gradient: defaultGradient(value.type === 'solid' ? value.color : undefined),
    }
  }
  const first = value.type === 'gradient' ? value.gradient.stops[0]?.color : undefined
  return { type: 'solid', color: first ?? '#000000' }
}

/** Stops in order along the gradient. */
export const sortStops = (stops: readonly GradientColorStop[]): GradientColorStop[] =>
  [...stops].sort((a, b) => a.offset - b.offset)

/**
 * A paint as a CSS background, for a swatch: the color, or the gradient's
 * stops left to right (a radial's from the middle out). None is `null`: a
 * swatch shows it its own way.
 */
export const paintCss = (value: ComplexColorValue): string | null => {
  if (value.type === 'none') return null
  if (value.type === 'solid') return value.color
  if (value.gradient.type === 'linear') return gradientStopsCss(value.gradient.stops)
  return `radial-gradient(closest-side, ${sortStops(value.gradient.stops)
    .map((stop) => `${stop.color} ${Math.round(stop.offset * 1000) / 10}%`)
    .join(', ')})`
}

/** A CSS preview of the stops, left to right. */
export const gradientStopsCss = (stops: readonly GradientColorStop[]): string =>
  `linear-gradient(to right, ${sortStops(stops)
    .map((stop) => `${stop.color} ${Math.round(stop.offset * 1000) / 10}%`)
    .join(', ')})`

const rgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.slice(0, 6)
  const n = parseInt(full, 16) || 0
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const hex = (channels: number[]): string =>
  `#${channels
    .map((c) =>
      Math.round(Math.max(0, Math.min(255, c)))
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`

/**
 * The color a new stop at `offset` starts with: blended between its
 * neighbors by where it falls between them, or the end color past either end.
 */
export const colorAtOffset = (
  stops: readonly GradientColorStop[],
  offset: number
): string => {
  const sorted = sortStops(stops)
  const first = sorted[0]
  const last = sorted.at(-1)
  if (!first || !last) return '#ffffff'
  if (offset <= first.offset) return first.color
  if (offset >= last.offset) return last.color
  const i = sorted.findIndex((stop) => stop.offset >= offset)
  const a = sorted[i - 1]!
  const b = sorted[i]!
  const t = b.offset === a.offset ? 0 : (offset - a.offset) / (b.offset - a.offset)
  const [r1, g1, b1] = rgb(a.color)
  const [r2, g2, b2] = rgb(b.color)
  return hex([r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t])
}

/** A gradient as SVG writes it: the element, its attributes and its stops. */
export interface SvgGradient {
  tag: 'linearGradient' | 'radialGradient'
  attrs: Record<string, string>
  stops: Array<{ offset: string; 'stop-color': string }>
}

const svgNumber = (n: number) => String(Math.round(n * 1e4) / 1e4)

/**
 * The gradient as an SVG `<linearGradient>` or `<radialGradient>`, in the
 * shape's own box (`objectBoundingBox`, SVG's default), as the editor reads
 * its coordinates. A radial's outer circle is SVG's `cx`/`cy`/`r` and its
 * inner circle the focal `fx`/`fy`/`fr`; its rotation and squash become a
 * `gradientTransform` about the outer centre. Stops are sorted, as SVG
 * reads them in order.
 *
 * ```ts
 * gradientToSvg(defaultGradient('#38bdf8'))
 * // { tag: 'linearGradient', attrs: { x1: '0', y1: '0.5', x2: '1', y2: '0.5' }, stops: [...] }
 * ```
 */
export const gradientToSvg = (value: GradientFill): SvgGradient => {
  const stops = sortStops(value.stops).map((s) => ({
    offset: svgNumber(s.offset),
    'stop-color': s.color,
  }))
  if (value.type === 'linear')
    return {
      tag: 'linearGradient',
      attrs: {
        x1: svgNumber(value.x0),
        y1: svgNumber(value.y0),
        x2: svgNumber(value.x1),
        y2: svgNumber(value.y1),
      },
      stops,
    }
  const { outerCx: cx, outerCy: cy } = value
  const turned = value.rotation % 360 !== 0
  const squashed = value.scaleY !== 1
  const transform =
    turned || squashed
      ? [
          `translate(${svgNumber(cx)} ${svgNumber(cy)})`,
          turned && `rotate(${svgNumber(value.rotation)})`,
          squashed && `scale(1 ${svgNumber(value.scaleY)})`,
          `translate(${svgNumber(-cx)} ${svgNumber(-cy)})`,
        ]
          .filter(Boolean)
          .join(' ')
      : undefined
  return {
    tag: 'radialGradient',
    attrs: {
      cx: svgNumber(cx),
      cy: svgNumber(cy),
      r: svgNumber(value.outerRadius),
      fx: svgNumber(value.cx),
      fy: svgNumber(value.cy),
      ...(value.innerRadius ? { fr: svgNumber(value.innerRadius) } : {}),
      ...(transform ? { gradientTransform: transform } : {}),
    },
    stops,
  }
}

/** A length as a fraction: `'50%'` is 0.5, `'0.3'` is 0.3; `fallback` when unset or unreadable. */
const fraction = (value: string | undefined, fallback: number): number => {
  if (value === undefined || value.trim() === '') return fallback
  const n = parseFloat(value)
  if (Number.isNaN(n)) return fallback
  return value.trim().endsWith('%') ? n / 100 : n
}

/** A stop's color with its `stop-opacity` folded in, where it's a hex color. */
const stopColor = (color: string, opacity: string | undefined): string => {
  const alpha = opacity === undefined ? 1 : Math.max(0, Math.min(1, fraction(opacity, 1)))
  if (alpha >= 1 || !/^#[0-9a-f]{6}$/i.test(color)) return color
  return `${color}${Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0')}`
}

/**
 * An SVG `<linearGradient>` or `<radialGradient>` read back for the gradient
 * editor: the inverse of `gradientToSvg`, with SVG's defaults where an
 * attribute is unset (a linear runs left to right, a radial is centred). A
 * `gradientTransform` `gradientToSvg` wrote is read back as rotation and
 * squash; any other is left out. A stop's `stop-opacity` joins its color. With
 * fewer than two stops of its own (one that borrows another's by `href`), it
 * gets `defaultGradient`'s.
 *
 * ```ts
 * gradientFromSvg('linearGradient', { x2: '1' }, [{ offset: '0', 'stop-color': '#fff' }, …])
 * ```
 */
export const gradientFromSvg = (
  tag: string,
  attrs: Readonly<Record<string, string | undefined>>,
  stops: ReadonlyArray<Readonly<Record<string, string | undefined>>>
): GradientFill | null => {
  if (tag !== 'linearGradient' && tag !== 'radialGradient') return null
  const read = stops.map((s) => ({
    offset: Math.max(0, Math.min(1, fraction(s.offset, 0))),
    color: stopColor(s['stop-color'] ?? '#000000', s['stop-opacity']),
  }))
  const own = read.length >= MIN_GRADIENT_STOPS ? read : defaultGradient().stops
  if (tag === 'linearGradient')
    return {
      type: 'linear',
      x0: fraction(attrs.x1, 0),
      y0: fraction(attrs.y1, 0),
      x1: fraction(attrs.x2, 1),
      y1: fraction(attrs.y2, 0),
      stops: own,
    }
  const cx = fraction(attrs.cx, 0.5)
  const cy = fraction(attrs.cy, 0.5)
  const transform = attrs.gradientTransform ?? ''
  const rotation = parseFloat(/rotate\(\s*(-?[\d.]+)/.exec(transform)?.[1] ?? '0')
  const scaleY = parseFloat(/scale\(\s*1[\s,]+(-?[\d.]+)/.exec(transform)?.[1] ?? '1')
  return {
    type: 'radial',
    cx: fraction(attrs.fx, cx),
    cy: fraction(attrs.fy, cy),
    innerRadius: fraction(attrs.fr, 0),
    outerCx: cx,
    outerCy: cy,
    outerRadius: fraction(attrs.r, 0.5),
    rotation,
    scaleY,
    stops: own,
  }
}
