/**
 * Design tokens. The single source of truth for every visual value in greese ui.
 *
 * `scripts/build-css.ts` turns this module into dist/tokens.css and
 * dist/_tokens.scss; `createTheme()` overrides any of it at runtime-free cost.
 *
 * Semantic names (canvas, surface, fg, primary) rather than palette names
 * (blue-500) so light/dark and future rebrands change one layer, not markup.
 *
 * Imports only the palette, and only the hues it uses: the build script runs
 * this directly under Node's type stripping, so imports name their `.ts` file.
 */
import {
  azure,
  black,
  blue,
  gold,
  green,
  lavender,
  pink,
  red,
  steel,
  turquoise,
  white,
} from './palette.ts'

/** Light and dark values for one semantic role. */
export interface TokenPair {
  light: string
  dark: string
}

/**
 * Semantic color roles, light and dark. Every value is a palette color, read
 * from palette.ts so a change there reaches every role. The palette is one
 * export per hue, so a bundle carries only the hues named here, and only if
 * it uses `color` at all: the pure annotation tells bundlers that reading the
 * palette has no side effects, so an unused `color` drops its hues with it.
 * `white` and `black` are the ends of every ramp.
 *
 * The brand colors, in order: `primary` (what components use for
 * interactive emphasis: solid buttons, links, focus, selection),
 * `secondary`, `tertiary` and `accent`. Each has a `Strong` shade (hover,
 * text on the canvas) and a `Content` color for text and icons drawn on it,
 * which meets WCAG AA (4.5:1) against it in both schemes (tokens.test.ts).
 * `createTheme` derives both when a theme sets only the main color.
 */
export const color = /* @__PURE__ */ (() =>
  ({
    canvas: { light: white, dark: steel[999] },
    surface: { light: steel[50], dark: steel[900] },
    surfaceOverlay: { light: white, dark: steel[800] },
    fg: { light: steel[999], dark: steel[100] },
    fgMuted: { light: steel[700], dark: steel[400] },
    border: { light: steel[200], dark: steel[800] },
    borderStrong: { light: steel[400], dark: steel[700] },
    // The empty part of a progress bar, a slider or a radial progress: lighter
    // than the borders in dark mode, so it shows on the canvas and on surfaces.
    track: { light: steel[200], dark: steel[600] },
    primary: { light: blue[600], dark: blue[400] },
    primaryStrong: { light: blue[700], dark: blue[300] },
    primaryContent: { light: white, dark: steel[999] },
    secondary: { light: lavender[600], dark: lavender[400] },
    secondaryStrong: { light: lavender[700], dark: lavender[300] },
    secondaryContent: { light: white, dark: steel[999] },
    tertiary: { light: turquoise[700], dark: turquoise[400] },
    tertiaryStrong: { light: turquoise[800], dark: turquoise[300] },
    tertiaryContent: { light: white, dark: steel[999] },
    accent: { light: pink[600], dark: pink[400] },
    accentStrong: { light: pink[700], dark: pink[300] },
    accentContent: { light: white, dark: steel[999] },
    focusRing: {
      light: 'var(--greese-color-primary)',
      dark: 'var(--greese-color-primary-strong)',
    },
    positive: { light: green[700], dark: green[400] },
    negative: { light: red[700], dark: red[400] },
    negativeContent: { light: white, dark: steel[999] },
    warning: { light: gold[700], dark: gold[400] },
    info: { light: azure[700], dark: azure[400] },
    /** The ends of every ramp, the same in both schemes: ink and paper for anything drawn on a color. */
    white: { light: white, dark: white },
    black: { light: black, dark: black },
    /** Dims the page behind modal dialogs and drawers. */
    scrim: {
      light: 'color-mix(in srgb, var(--greese-color-black) 45%, transparent)',
      dark: 'color-mix(in srgb, var(--greese-color-black) 60%, transparent)',
    },
  }) as const satisfies Record<string, TokenPair>)()

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
  xl: '24px',
  pill: '999px',
  round: '50%',
} as const

/**
 * The radius roles: what each kind of part takes from the radius scale. The
 * components read these, never the scale directly, so a shape theme reassigns
 * a role (`control: var(--greese-radius-none)`) and every token keeps its
 * value (ADR 0025): `--greese-radius-md` is 8px under every theme.
 */
export const corner = {
  /** Buttons, segmented controls, file pickers. */
  control: 'var(--greese-radius-md)',
  /** Text fields and selects, OTP cells. */
  field: 'var(--greese-radius-md)',
  /** Cards, dialogs, fieldsets, lists, stats, chat bubbles. */
  surface: 'var(--greese-radius-lg)',
  /** Alerts, tiles, tables, code, media, popovers and menus. */
  panel: 'var(--greese-radius-md)',
  /** Small parts inside others: tabs, menu items, tooltips, keys, checkboxes. */
  inset: 'var(--greese-radius-sm)',
  /** Badges, chips, tracks, progress bars. */
  pill: 'var(--greese-radius-pill)',
  /**
   * Round parts that stand for something: knobs and thumbs, radios, step
   * markers, avatars, status dots.
   */
  round: 'var(--greese-radius-round)',
} as const

export const font = {
  body: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
} as const

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

export const lineHeight = { tight: '1.25', snug: '1.375', normal: '1.5' } as const

export const shadow = {
  sm: '0 1px 2px color-mix(in srgb, var(--greese-color-black) 8%, transparent)',
  md: '0 4px 12px color-mix(in srgb, var(--greese-color-black) 12%, transparent)',
  lg: '0 12px 32px color-mix(in srgb, var(--greese-color-black) 18%, transparent)',
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
 * `lineHeight.tight` is `--greese-line-height-tight`.
 */
export const scalarTokens = {
  space,
  radius,
  corner,
  font,
  fontWeight,
  lineHeight,
  shadow,
  zIndex,
  duration,
  easing,
} as const

export type ScalarGroup = keyof typeof scalarTokens

/**
 * Mobile-first breakpoints: each value is a `min-width` in px. The defaults
 * every responsive prop is resolved against.
 *
 * Media queries cannot read custom properties, so these are compile-time
 * constants in the CSS; changing them means recompiling the SCSS.
 */
export const breakpoints: Readonly<Record<Breakpoint, number>> = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
}

/**
 * The breakpoint names. Open for more: a build that adds keys to the SCSS
 * `$breakpoints` (`tablet: 700px`) tells TypeScript with
 *
 * ```ts
 * declare module '@greese/ui' {
 *   interface BreakpointKeys { tablet: true }
 * }
 * ```
 *
 * so `Responsive<T>` accepts `{ tablet: … }` too.
 */
export interface BreakpointKeys {
  xs: true
  sm: true
  md: true
  lg: true
  xl: true
}

export type Breakpoint = keyof BreakpointKeys

/** The built-in breakpoint keys, smallest first. */
export const breakpointKeys = Object.keys(breakpoints) as Breakpoint[]
