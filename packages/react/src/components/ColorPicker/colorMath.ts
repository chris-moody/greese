/** Red, green and blue in `0`–`255`; alpha in `0`–`1`. */
export interface RgbColor {
  r: number
  g: number
  b: number
  a: number
}

/** Hue in `0`–`360`; saturation, value (brightness) and alpha in `0`–`1`. */
export interface HsvColor {
  h: number
  s: number
  v: number
  a: number
}

const clamp = (n: number, min: number, max: number): number =>
  Math.min(Math.max(n, min), max)
const hex2 = (n: number): string =>
  Math.round(clamp(n, 0, 255))
    .toString(16)
    .padStart(2, '0')

/**
 * Parses `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa` (the `#` is optional).
 * Returns `undefined` for anything else.
 */
export const parseHex = (input: string): RgbColor | undefined => {
  let hex = input.trim().replace(/^#/, '')
  if (!/^(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(hex)) return undefined
  if (hex.length <= 4) hex = [...hex].map((c) => c + c).join('')
  const n = (i: number): number => parseInt(hex.slice(i, i + 2), 16)
  return { r: n(0), g: n(2), b: n(4), a: hex.length === 8 ? n(6) / 255 : 1 }
}

/** `#rrggbb`, or `#rrggbbaa` when not fully opaque. Lower case. */
export const formatHex = ({ r, g, b, a }: RgbColor): string =>
  `#${hex2(r)}${hex2(g)}${hex2(b)}${a < 1 ? hex2(a * 255) : ''}`

export const hsvToRgb = ({ h, s, v, a }: HsvColor): RgbColor => {
  const f = (n: number): number => {
    const k = (n + h / 60) % 6
    return 255 * (v - v * s * Math.max(0, Math.min(k, 4 - k, 1)))
  }
  return { r: f(5), g: f(3), b: f(1), a }
}

/**
 * `hue` is kept when the colour has none (greys): dragging to the grey edge
 * of the picker must not send the hue slider back to red.
 */
export const rgbToHsv = ({ r, g, b, a }: RgbColor, hue = 0): HsvColor => {
  const [R, G, B] = [r / 255, g / 255, b / 255]
  const max = Math.max(R, G, B)
  const d = max - Math.min(R, G, B)
  let h = hue
  if (d > 0) {
    if (max === R) h = 60 * (((G - B) / d + 6) % 6)
    else if (max === G) h = 60 * ((B - R) / d + 2)
    else h = 60 * ((R - G) / d + 4)
  }
  return { h, s: max === 0 ? 0 : d / max, v: max, a }
}
