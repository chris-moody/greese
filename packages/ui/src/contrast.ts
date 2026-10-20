/**
 * WCAG 2 contrast, for picking text colors that stay readable on a theme's
 * brand colors. Hex colors only (`#rgb`, `#rrggbb`): anything else (a
 * `var()`, `oklch()`) can't be measured here, so callers keep their default.
 */

/** Light and dark ink for content on a color: white, or GreeseUI's near-black canvas. */
export const CONTENT_LIGHT = '#ffffff'
export const CONTENT_DARK = '#11171c' // steel-999

/** The WCAG AA minimum for normal text. */
export const AA = 4.5

/** WCAG relative luminance, 0 (black) to 1 (white), of `#rgb` or `#rrggbb`. */
export const luminance = (color: string): number | undefined => {
  let hex = /^#([0-9a-f]{3}){1,2}$/i.test(color) ? color.slice(1) : ''
  if (!hex) return undefined
  if (hex.length === 3) hex = hex.replace(/./g, '$&$&')
  return [0.2126, 0.7152, 0.0722].reduce((sum, weight, i) => {
    const s = parseInt(hex.slice(i * 2, i * 2 + 2), 16) / 255
    return sum + weight * (s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4)
  }, 0)
}

/** The WCAG contrast ratio of two hex colors (1–21), or undefined. */
export const contrastRatio = (a: string, b: string): number | undefined => {
  const la = luminance(a)
  const lb = luminance(b)
  if (la === undefined || lb === undefined) return undefined
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/**
 * The text color for content on `color`: white or near-black, whichever
 * contrasts more, as long as it reaches AA. Where neither does (a mid-tone
 * near the crossover), pure black: when white fails, black always passes.
 */
export const contentColor = (color: string): string | undefined => {
  if (luminance(color) === undefined) return undefined
  const light = contrastRatio(color, CONTENT_LIGHT)!
  const dark = contrastRatio(color, CONTENT_DARK)!
  return Math.max(light, dark) < AA
    ? '#000000'
    : light >= dark
      ? CONTENT_LIGHT
      : CONTENT_DARK
}
