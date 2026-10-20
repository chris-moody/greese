/**
 * Shared story data: sample images and lists. Components come from the
 * library (Tile) and icons from @greese-ui/icons, never from here, so every
 * story shows code a reader can copy.
 */

/** A small SVG "photo" for media stories (no network needed). */
export const art = (hue: number, ratio = '16 9') =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ratio}"><rect width="100%" height="100%" fill="hsl(${hue} 70% 60%)"/><circle cx="75%" cy="35%" r="15%" fill="hsl(${hue} 80% 85%)"/></svg>`
  )}`

export const countries = [
  'Argentina',
  'Australia',
  'Brasil',
  'Canada',
  "Côte d'Ivoire",
  'Denmark',
  'España',
  'France',
  'Germany',
  'India',
  'Japan',
  'México',
  'New Zealand',
  'Norway',
  'Portugal',
  'South Africa',
  'Sverige',
  'United Kingdom',
  'United States',
]
