/**
 * The anatomy diagram's colors: one per nesting depth, each readable on the
 * page it's drawn on. Its outlines and leader lines are drawn in it, the
 * element list's tags are text in it, and each label is text on it, so every
 * color is chosen against the page's own background (the theme's canvas, in
 * either scheme) rather than fixed: at least 4.5:1, WCAG AA for small text,
 * which covers the 3:1 the lines need too. Pure, so it's unit-tested.
 */

export type Rgb = readonly [r: number, g: number, b: number]

/** WCAG 2's relative luminance of an sRGB color (channels 0–255). */
export const luminance = ([r, g, b]: Rgb): number => {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** WCAG 2's contrast ratio, 1 to 21. */
export const contrast = (a: Rgb, b: Rgb): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** OKLCH (L 0–1, C, hue in degrees) to sRGB, clipped to the gamut. */
export const oklchToRgb = (l: number, c: number, hue: number): Rgb => {
  const h = (hue * Math.PI) / 180
  const a = c * Math.cos(h)
  const b = c * Math.sin(h)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const linear = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
  return linear.map((v) => {
    const x = Math.min(1, Math.max(0, v))
    const s = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055
    return Math.round(s * 255)
  }) as unknown as Rgb
}

export interface AnatomyColor {
  /** Outlines, lines, the list's tags, and each label's background. */
  color: string
  /** A label's text on `color`. */
  on: string
}

const WHITE: Rgb = [255, 255, 255]
// Black, not a softer ink: a color that just reads on a black page reads
// under black text by the same ratio.
const INK: Rgb = [0, 0, 0]
const css = ([r, g, b]: Rgb) => `rgb(${r} ${g} ${b})`

/** Text on the page needs this much; lines need 3:1, which it covers. */
export const MIN_CONTRAST = 4.5

/**
 * A color for each depth, hues stepping round the wheel from blue, each as
 * vivid as it can be while it still reads on `background`: darkened on a
 * light page, lightened on a dark one.
 */
export const anatomyColors = (background: Rgb, depths: number): AnatomyColor[] => {
  const dark = luminance(background) < 0.18
  return Array.from({ length: depths }, (_, depth) => {
    const hue = (255 + depth * 55) % 360
    let rgb = oklchToRgb(0.6, 0.15, hue)
    // Step lightness away from the background until it's readable; the
    // ends (near black, near white) always are.
    for (
      let l = 0.6;
      contrast(rgb, background) < MIN_CONTRAST && l > 0 && l < 1;
      l += dark ? 0.01 : -0.01
    )
      rgb = oklchToRgb(l, 0.15, hue)
    const on = contrast(WHITE, rgb) >= contrast(INK, rgb) ? WHITE : INK
    return { color: css(rgb), on: css(on) }
  })
}

/** Any CSS color the browser can paint, as sRGB, with its alpha (0–1). */
const paint = (() => {
  let context: CanvasRenderingContext2D | null | undefined
  return (value: string): [Rgb, number] | undefined => {
    context ??= document.createElement('canvas').getContext('2d', {
      willReadFrequently: true,
    })
    if (!context) return undefined
    context.clearRect(0, 0, 1, 1)
    context.fillStyle = '#0000'
    context.fillStyle = value
    context.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data
    return [[r!, g!, b!], a! / 255]
  }
})()

/**
 * The opaque background behind `el`: the nearest ancestor that paints one,
 * then the page's, then white.
 */
export const backgroundOf = (el: Element): Rgb => {
  for (let at: Element | null = el; at; at = at.parentElement) {
    const painted = paint(getComputedStyle(at).backgroundColor)
    if (painted && painted[1] > 0.5) return painted[0]
  }
  return WHITE
}
