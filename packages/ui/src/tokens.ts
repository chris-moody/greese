/**
 * Design tokens. The single source of truth for every visual value in GreeseUI.
 *
 * `scripts/build-css.ts` turns this module into dist/tokens.css and
 * dist/_tokens.scss; `createTheme()` overrides any of it at runtime-free cost.
 *
 * Semantic names (canvas, surface, fg, primary) rather than palette names
 * (blue-500) so light/dark and future rebrands change one layer, not markup.
 *
 * Keep this file free of runtime imports: the build script runs it directly
 * under Node's type stripping.
 */
/** Light and dark values for one semantic role. */
export interface TokenPair {
  light: string
  dark: string
}

/**
 * Semantic color roles, light and dark. Hues are palette colors, named in
 * the comments (palette.test.ts checks they match); written out rather than
 * read from palette.ts, so `createTheme` and anything else that imports
 * `color` doesn't carry the palette. The greys are GreeseUI's own.
 *
 * The brand colors, in order: `primary` (what components use for
 * interactive emphasis: solid buttons, links, focus, selection),
 * `secondary`, `tertiary` and `accent`. Each has a `Strong` shade (hover,
 * text on the canvas) and a `Content` color for text and icons drawn on it,
 * which meets WCAG AA (4.5:1) against it in both schemes (tokens.test.ts).
 * `createTheme` derives both when a theme sets only the main color.
 */
export const color = {
  canvas: { light: '#ffffff', dark: '#0b0d10' },
  surface: { light: '#f5f6f8', dark: '#14181d' },
  surfaceOverlay: { light: '#ffffff', dark: '#1c2127' },
  fg: { light: '#14181d', dark: '#e9edf2' },
  fgMuted: { light: '#5b6572', dark: '#9aa5b1' },
  border: { light: '#dfe3e8', dark: '#2a3038' },
  borderStrong: { light: '#b8c0ca', dark: '#4a5360' },
  primary: { light: '#2771e0', dark: '#81b2ff' }, // blue-600, blue-400
  primaryStrong: { light: '#1356b8', dark: '#aaccff' }, // blue-700, blue-300
  primaryContent: { light: '#ffffff', dark: '#0b0d10' },
  secondary: { light: '#7e5bd0', dark: '#b69fff' }, // lavender-600, lavender-400
  secondaryStrong: { light: '#6443ab', dark: '#cdbfff' }, // lavender-700, lavender-300
  secondaryContent: { light: '#ffffff', dark: '#0b0d10' },
  tertiary: { light: '#007069', dark: '#5dcec5' }, // turquoise-700, turquoise-400
  tertiaryStrong: { light: '#00544f', dark: '#94e1da' }, // turquoise-800, turquoise-300
  tertiaryContent: { light: '#ffffff', dark: '#0b0d10' },
  accent: { light: '#c13b7b', dark: '#ff81b6' }, // pink-600, pink-400
  accentStrong: { light: '#9c2661', dark: '#ffaecd' }, // pink-700, pink-300
  accentContent: { light: '#ffffff', dark: '#0b0d10' },
  focusRing: {
    light: 'var(--greese-color-primary)',
    dark: 'var(--greese-color-primary-strong)',
  },
  positive: { light: '#007231', dark: '#61cf7e' }, // green-700, green-400
  negative: { light: '#ae0914', dark: '#ff8b7f' }, // red-700, red-400
  negativeContent: { light: '#ffffff', dark: '#0b0d10' },
  warning: { light: '#8a5f00', dark: '#feb93d' }, // gold-700, gold-400
  info: { light: '#00668f', dark: '#5ac0f7' }, // azure-700, azure-400
  /** Dims the page behind modal dialogs and drawers. */
  scrim: { light: 'rgb(11 13 16 / 0.45)', dark: 'rgb(0 0 0 / 0.6)' },
} as const satisfies Record<string, TokenPair>

export type ColorRole = keyof typeof color

/** Spacing scale, indexed: `space[2]` is `--greese-space-2`. */
export const space = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.5rem',
  6: '2rem',
  7: '3rem',
  8: '4rem',
} as const

export type SpaceToken = keyof typeof space

export const radius = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '16px',
  pill: '999px',
} as const

export const font = {
  body: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
} as const

export const fontSize = {
  xs: '0.75rem',
  sm: '0.875rem',
  md: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
} as const

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

export const lineHeight = { tight: '1.25', snug: '1.375', normal: '1.5' } as const

export const shadow = {
  sm: '0 1px 2px rgb(0 0 0 / 0.08)',
  md: '0 4px 12px rgb(0 0 0 / 0.12)',
  lg: '0 12px 32px rgb(0 0 0 / 0.18)',
} as const

export const zIndex = {
  dropdown: '1000',
  sticky: '1100',
  overlay: '1300',
  modal: '1400',
  popover: '1500',
  toast: '1600',
  tooltip: '1700',
} as const

/** Collapsed to near-zero under `prefers-reduced-motion: reduce`. */
export const duration = { fast: '120ms', normal: '200ms', slow: '320ms' } as const

export const easing = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  enter: 'cubic-bezier(0, 0, 0, 1)',
  exit: 'cubic-bezier(0.3, 0, 1, 1)',
} as const

/**
 * Scheme-independent token groups, keyed by the custom-property group name:
 * `fontSize.lg` is `--greese-font-size-lg`.
 */
export const scalarTokens = {
  space,
  radius,
  font,
  fontSize,
  fontWeight,
  lineHeight,
  shadow,
  zIndex,
  duration,
  easing,
} as const

export type ScalarGroup = keyof typeof scalarTokens

/**
 * Mobile-first breakpoints: each value is a `min-width` in px. Matches MUI's
 * defaults so responsive props port across unchanged.
 *
 * Media queries cannot read custom properties, so these are compile-time
 * constants in the CSS; changing them means recompiling the SCSS.
 */
export const breakpoints = { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } as const

export type Breakpoint = keyof typeof breakpoints

/** Breakpoint keys, smallest first. */
export const breakpointKeys = Object.keys(breakpoints) as Breakpoint[]
