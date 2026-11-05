/** Red, green and blue in `0`–`255`; alpha in `0`–`1`. */
export interface RgbColor {
  /** Red, 0–255. */
  r: number
  /** Green, 0–255. */
  g: number
  /** Blue, 0–255. */
  b: number
  /** Opacity, 0–1. */
  a: number
}

/** Hue in `0`–`360`; saturation, value (brightness) and alpha in `0`–`1`. */
export interface HsvColor {
  /** Hue in degrees, 0–360. */
  h: number
  /** Saturation, 0–1. */
  s: number
  /** Value (brightness), 0–1. */
  v: number
  /** Opacity, 0–1. */
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
 * `hue` is kept when the color has none (greys): dragging to the grey edge
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

/** Hue in `0`–`360`; saturation, lightness and alpha in `0`–`1`. */
export interface HslColor {
  /** Hue in degrees, 0–360. */
  h: number
  /** Saturation, 0–1. */
  s: number
  /** Lightness, 0–1. */
  l: number
  /** Opacity, 0–1. */
  a: number
}

/** HSV and HSL share a hue, so the conversion is only saturation and the third axis. */
export const hsvToHsl = ({ h, s, v, a }: HsvColor): HslColor => {
  const l = v * (1 - s / 2)
  const m = Math.min(l, 1 - l)
  return { h, s: m === 0 ? 0 : (v - l) / m, l, a }
}

/** The inverse of {@link hsvToHsl}. */
export const hslToHsv = ({ h, s, l, a }: HslColor): HsvColor => {
  const v = l + s * Math.min(l, 1 - l)
  return { h, s: v === 0 ? 0 : 2 * (1 - l / v), v, a }
}

/**
 * Which numeric channels a picker can show beside its hex field: red/green/blue
 * `0`–`255`, or hue `0`–`360` with the other two as percentages.
 */
export type ColorChannelSet = 'rgb' | 'hsl' | 'hsb'

/** One numeric channel: how it's labelled and the largest value it takes. */
export interface ColorChannel {
  /** The one-letter name shown in the field. */
  label: string
  /** The highest value the channel accepts; the lowest is always 0. */
  max: number
  /** Its accessible name, spelled out. */
  name: string
}

/** The channels each set shows, in order. */
export const COLOR_CHANNELS: Readonly<Record<ColorChannelSet, readonly ColorChannel[]>> =
  {
    rgb: [
      { label: 'R', max: 255, name: 'Red' },
      { label: 'G', max: 255, name: 'Green' },
      { label: 'B', max: 255, name: 'Blue' },
    ],
    hsl: [
      { label: 'H', max: 360, name: 'Hue' },
      { label: 'S', max: 100, name: 'Saturation' },
      { label: 'L', max: 100, name: 'Lightness' },
    ],
    hsb: [
      { label: 'H', max: 360, name: 'Hue' },
      { label: 'S', max: 100, name: 'Saturation' },
      { label: 'B', max: 100, name: 'Brightness' },
    ],
  }

/** A color's three numbers in one channel set, rounded for display. */
export const channelValues = (
  hsv: HsvColor,
  set: ColorChannelSet
): [number, number, number] => {
  if (set === 'rgb') {
    const { r, g, b } = hsvToRgb(hsv)
    return [Math.round(r), Math.round(g), Math.round(b)]
  }
  if (set === 'hsl') {
    const { h, s, l } = hsvToHsl(hsv)
    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)]
  }
  return [Math.round(hsv.h), Math.round(hsv.s * 100), Math.round(hsv.v * 100)]
}

/**
 * The color three channel numbers describe. `hue` is kept for a grey, the way
 * {@link rgbToHsv} keeps it, so typing `0` into saturation doesn't throw the
 * hue slider back to red.
 */
export const channelsToHsv = (
  [x, y, z]: readonly [number, number, number],
  set: ColorChannelSet,
  { h: hue, a }: HsvColor
): HsvColor => {
  if (set === 'rgb') return rgbToHsv({ r: x, g: y, b: z, a }, hue)
  if (set === 'hsl') return hslToHsv({ h: x, s: y / 100, l: z / 100, a })
  return { h: x, s: y / 100, v: z / 100, a }
}
