/**
 * Shared CSS-generation primitives. Used by the build script (default tokens)
 * and by createTheme() (theme overrides), so both name and structure custom
 * properties identically.
 */
import { duration, type ScalarGroup } from './tokens.ts'

/**
 * Cascade layer order for everything GreeseUI emits. Every stylesheet we produce
 * (tokens, components, themes) starts with this statement, so the order holds
 * no matter which sheet the browser sees first. Unlayered consumer CSS beats
 * all of it.
 *
 * `greese.overrides` holds build-time component overrides (the SCSS kit's
 * `component()` and `motion()`): above the components they restyle, below
 * the utilities, so style props and the `greese` prop still win.
 */
export const LAYER_ORDER =
  '@layer greese.reset, greese.tokens, greese.theme, greese.base, greese.components, greese.overrides, greese.utilities;'

export const SCHEME_ATTR = 'data-greese-scheme'
export const THEME_ATTR = 'data-greese-theme'

/** `surfaceOverlay` -> `surface-overlay`, `2xl` -> `2xl`. */
export const kebab = (value: string): string =>
  value.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)

/** The custom property for a token: `cssVar('fontSize', 'lg')` -> `--greese-font-size-lg`. */
export const cssVar = (group: ScalarGroup | 'color', key: string | number): string =>
  `--greese-${kebab(group)}-${kebab(String(key))}`

export type Declarations = Array<[property: string, value: string]>

/** Renders declarations at the given indent. */
export const decls = (list: Declarations, indent: string): string =>
  list.map(([p, v]) => `${indent}${p}: ${v};`).join('\n')

/** Declarations collapsing every duration under reduced motion. */
export const reducedMotionDecls = (keys: Iterable<string>): Declarations =>
  [...keys].map((k) => [cssVar('duration', k), '0.01ms'])

export const allDurationKeys = Object.keys(duration)
