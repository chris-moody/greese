/**
 * What the kit derives for a brand colour, as hex, so the studio can show it:
 * the content colour (as `contentColor()`), and the strong shade the browser
 * computes from `color-mix(in oklab, <colour> 80%, #000)` in light and
 * `… 70%, #fff` in dark.
 */
import { contentColor } from '@greese/ui'

type Lab = [number, number, number]

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toGamma = (c: number) =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * Math.max(c, 0) ** (1 / 2.4) - 0.055

const hexToOklab = (hex: string): Lab => {
  const [r, g, b] = [1, 3, 5].map((i) =>
    toLinear(parseInt(hex.slice(i, i + 2), 16) / 255)
  ) as Lab
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

const oklabToHex = ([L, A, B]: Lab): string => {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  return `#${rgb
    .map((c) =>
      Math.round(Math.min(1, Math.max(0, toGamma(c))) * 255)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`
}

/** `color-mix(in oklab, a p%, b)` for two `#rrggbb` colours. */
export const mixOklab = (a: string, b: string, p: number): string => {
  const x = hexToOklab(a)
  const y = hexToOklab(b)
  return oklabToHex(x.map((v, i) => v * p + y[i]! * (1 - p)) as Lab)
}

/** The strong shade the kit derives in a scheme. */
export const derivedStrong = (hex: string, scheme: 'light' | 'dark'): string =>
  scheme === 'light' ? mixOklab(hex, '#000000', 0.8) : mixOklab(hex, '#ffffff', 0.7)

export const derivedContent = (hex: string): string | undefined => contentColor(hex)
