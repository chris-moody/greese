import { createTheme } from '@greese/react'
import { palette } from '@greese/ui'
import type { ThemeSpec } from './studio/spec.ts'

/**
 * The site's own colors, added to every theme the page wears: the comparison
 * chart's MUI series, and the hero's glow. They sit beside the theme's tokens
 * (`extend`), so they follow its scheme like any other. The glow is the
 * theme's own primary color, thinned out, so it's orange under Greese and
 * follows whatever primary a visitor picks.
 */
export const siteColors = {
  'site-mui': { light: palette.blue[600], dark: palette.blue[500] },
  'site-glow': {
    light: 'color-mix(in srgb, var(--greese-color-primary) 16%, transparent)',
    dark: 'color-mix(in srgb, var(--greese-color-primary) 14%, transparent)',
  },
} as const

/**
 * Greese, the official theme: GreeseUI with a warm orange primary, as a
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
