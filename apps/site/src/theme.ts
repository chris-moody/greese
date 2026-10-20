import { createTheme } from '@greese-ui/react'

/**
 * The site's brand, made the way an app would make one: a theme built once
 * at module scope. GreeseUI's default primary is blue; the site's is warm
 * orange, so the page itself demonstrates theming. Only the primary colour
 * is set: createTheme derives its readable content colour (WCAG AA) and its
 * strong shade, and the focus ring follows it.
 */
export const brand = createTheme({
  name: 'greese-site',
  color: {
    primary: { light: '#c2410c', dark: '#fb923c' }, // orange-700, orange-400
  },
})

/**
 * The comparison chart's two series. GreeseUI's bars are the site's primary
 * orange; MUI's are its brand blue. Validated as a categorical pair (CVD
 * separation, contrast) on each scheme's canvas; in dark, the orange sits a
 * little above the lightness band the validator prefers, which the direct
 * value labels and legend cover.
 */
export const series = {
  greese: { light: '#c2410c', dark: '#fb923c' },
  mui: { light: '#2563eb', dark: '#3b82f6' },
} as const
