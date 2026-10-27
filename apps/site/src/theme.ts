import { createTheme } from '@greese/react'
import { palette } from '@greese/ui'
import type { ThemeSpec } from './studio/spec.ts'

const PRIMARY = 'var(--greese-color-primary)'
const ACCENT = 'var(--greese-color-accent)'
const WHITE = 'var(--greese-color-white)'
const PRIMARY_ACCENT = `color-mix(in oklab, ${PRIMARY} 55%, ${ACCENT})`

/**
 * The site's own colors, added to every theme the page wears: the comparison
 * chart's MUI series, the hero's glow and the logo's halo. They sit beside
 * the theme's tokens (`extend`), so they follow its scheme like any other.
 * The glows are the theme's own primary color, thinned out, so they're
 * orange under Greese and follow whatever primary a visitor picks; the
 * logo's is fainter on light pages, where a glow reads as a smudge.
 */
export const siteColors = {
  'site-mui': { light: palette.blue[600], dark: palette.blue[500] },
  'site-glow': {
    light: 'color-mix(in srgb, var(--greese-color-primary) 16%, transparent)',
    dark: 'color-mix(in srgb, var(--greese-color-primary) 14%, transparent)',
  },
  // The logo's gradient (logo/): the primary running into the accent and on
  // to a pale tint of it, as the artwork's cyan runs to lime. Lifted toward
  // white on light pages, where the light scheme's deeper shades went muddy.
  'site-logo-1': {
    light: `color-mix(in oklab, ${PRIMARY} 75%, ${WHITE})`,
    dark: PRIMARY,
  },
  'site-logo-2': {
    light: `color-mix(in oklab, ${PRIMARY_ACCENT} 70%, ${WHITE})`,
    dark: PRIMARY_ACCENT,
  },
  'site-logo-3': {
    light: `color-mix(in oklab, ${ACCENT} 60%, ${WHITE})`,
    dark: `color-mix(in oklab, ${ACCENT} 80%, ${WHITE})`,
  },
  'site-logo-4': {
    light: `color-mix(in oklab, ${ACCENT} 35%, ${WHITE})`,
    dark: `color-mix(in oklab, ${ACCENT} 45%, ${WHITE})`,
  },
  'site-logo-glow': {
    light: 'color-mix(in srgb, var(--greese-color-primary) 40%, transparent)',
    dark: 'color-mix(in srgb, var(--greese-color-primary) 85%, transparent)',
  },
} as const

/**
 * Greese, the official theme: greese ui with a warm orange primary, as a
 * studio spec. It's the page's own theme until a visitor picks another, the
 * first entry in the header's theme menu, and where `brand` below comes from.
 * Only the primary is set, by palette name: createTheme derives its readable
 * content color (WCAG AA) and strong shade, and the focus ring follows it.
 */
export const GREESE_SPEC: ThemeSpec = {
  tokens: { color: { primary: { light: 'orange-700', dark: 'orange-400' } } },
  components: {},
}

/**
 * The Greese theme, made the way an app would make one: built once at module
 * scope, from palette colors, named `greese`.
 */
export const brand = createTheme({
  name: 'greese',
  color: {
    primary: { light: palette.orange[700], dark: palette.orange[400] },
  },
  extend: { color: siteColors },
})
