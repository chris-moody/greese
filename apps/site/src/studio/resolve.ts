import { color, palette, type PaletteHue, type PaletteShade } from '@greese/ui'

/** `#abc`/`#aabbcc` only: what `<input type="color">` can show. */
const HEX = /^#([0-9a-f]{3}){1,2}$/i

const expand = (hex: string) =>
  hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join('')}` : hex

/** Every palette name, `lavender-600`, which the kit compiles to its color. */
export const PALETTE_NAMES = Object.entries(palette).flatMap(([hue, shades]) =>
  Object.keys(shades).map((shade) => `${hue}-${shade}`)
)

/**
 * The hex a value shows as: itself, a palette name's color, or a color
 * role's default in `scheme` (`var(--greese-color-primary)`). Undefined for
 * what can't be resolved here (`color-mix()`, `oklch()`).
 */
export const resolveColor = (
  value: string,
  scheme: 'light' | 'dark' = 'light',
  depth = 0
): string | undefined => {
  if (HEX.test(value)) return expand(value)
  const [, hue, shade] = /^([a-z]+)-(\d+)$/.exec(value) ?? []
  if (hue && hue in palette)
    return palette[hue as PaletteHue][Number(shade) as PaletteShade]
  const [, role] = /^var\(--greese-color-([a-z-]+)\)$/.exec(value) ?? []
  const camel = role?.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
  if (camel && camel in color && depth < 3)
    return resolveColor(color[camel as keyof typeof color][scheme], scheme, depth + 1)
  return undefined
}
