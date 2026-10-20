import { createTheme } from '@greese/react'
import { palette } from '@greese/ui'

/**
 * The site's brand, made the way an app would make one: a theme built once
 * at module scope, from palette colors. GreeseUI's default primary is blue;
 * the site's is warm orange, so the page itself demonstrates theming. Only
 * the primary color is set: createTheme derives its readable content color
 * (WCAG AA) and its strong shade, and the focus ring follows it. The two
 * `extend`ed colors are the site's own: the comparison chart's MUI series,
 * and the hero's glow.
 */
export const brand = createTheme({
  name: 'greese-site',
  color: {
    primary: { light: palette.orange[700], dark: palette.orange[400] },
  },
  extend: {
    color: {
      'site-mui': { light: palette.blue[600], dark: palette.blue[500] },
      'site-glow': {
        light: `color-mix(in srgb, ${palette.orange[700]} 16%, transparent)`,
        dark: `color-mix(in srgb, ${palette.orange[400]} 14%, transparent)`,
      },
    },
  },
})
