import { createTheme } from '@greese/react'
import { palette } from '@greese/ui'
import type { ThemeSpec } from './studio/spec.ts'

/**
 * The site's own colors, added to every theme the page wears: the comparison
 * chart's MUI series, and the hero's glow. They sit beside the theme's tokens
 * (`extend`), so they follow its scheme like any other.
 */
export const siteColors = {
  'site-mui': { light: palette.blue[600], dark: palette.blue[500] },
  'site-glow': {
    light: `color-mix(in srgb, ${palette.orange[700]} 16%, transparent)`,
    dark: `color-mix(in srgb, ${palette.orange[400]} 14%, transparent)`,
  },
} as const

/**
 * The site's brand, made the way an app would make one: a theme built once
 * at module scope, from palette colors. GreeseUI's default primary is blue;
 * the site's is warm orange, so the page itself demonstrates theming. Only
 * the primary color is set: createTheme derives its readable content color
 * (WCAG AA) and its strong shade, and the focus ring follows it. This is the
 * "Greese" theme in the header's theme menu (the studio's presets), which
 * the page wears until the visitor picks another.
 */
export const brand = createTheme({
  name: 'site',
  color: {
    primary: { light: palette.orange[700], dark: palette.orange[400] },
  },
  extend: { color: siteColors },
})

/** The same theme as a studio spec: what the header's theme menu starts from. */
export const SITE_SPEC: ThemeSpec = {
  tokens: { color: { primary: { light: 'orange-700', dark: 'orange-400' } } },
  components: {},
}
