import {
  allDurationKeys,
  cssVar,
  decls,
  LAYER_ORDER,
  reducedMotionDecls,
  SCHEME_ATTR,
  THEME_ATTR,
  type Declarations,
} from './css.ts'
import {
  color,
  scalarTokens,
  type ColorRole,
  type ScalarGroup,
  type TokenPair,
} from './tokens.ts'

/** A colour override: one value for both schemes, or a light/dark pair. */
export type ColorValue = string | TokenPair

export type ThemeOptions = {
  /** Scopes the theme: `[data-greese-theme="<name>"]`. Letters, digits, `-`. */
  name: string
  color?: Partial<Record<ColorRole, ColorValue>>
} & {
  [G in ScalarGroup]?: Partial<Record<keyof (typeof scalarTokens)[G], string>>
}

export interface Theme {
  readonly name: string
  /**
   * Static CSS for this theme, in `@layer greese.theme`. Generated once, here;
   * nothing is computed per render. ThemeProvider injects it, or serve it
   * yourself and set `data-greese-theme` on any element (`<html>` included).
   */
  readonly css: string
}

const NAME = /^[a-z][a-z0-9-]*$/i
// Theme values land inside a <style> element: refuse anything that could end a
// declaration, a rule, or the element itself.
const UNSAFE_VALUE = /[;{}<>]/

const check = (property: string, value: string): string => {
  if (UNSAFE_VALUE.test(value)) {
    throw new Error(
      `createTheme: invalid value for ${property}: ${JSON.stringify(value)}`
    )
  }
  return value
}

/**
 * Builds a theme: the default tokens with your overrides applied.
 *
 * ```ts
 * export const brand = createTheme({
 *   name: 'brand',
 *   color: { accent: { light: '#7c3aed', dark: '#c4b5fd' } },
 *   radius: { md: '12px' },
 * })
 * ```
 *
 * A theme is complete, not a delta: its CSS declares every token, so a
 * ThemeProvider renders exactly that theme whatever its ancestors are. Themes
 * do not stack; to extend one, create another with more overrides.
 *
 * Call it at module scope, not during render: the result is meant to be static.
 */
export const createTheme = (options: ThemeOptions): Theme => {
  const { name, color: colorOverrides = {}, ...scalarOverrides } = options
  if (!NAME.test(name)) {
    throw new Error(`createTheme: name must match ${NAME}, got ${JSON.stringify(name)}`)
  }

  const light: Declarations = []
  const dark: Declarations = []
  for (const [role, fallback] of Object.entries(color) as Array<[ColorRole, TokenPair]>) {
    const prop = cssVar('color', role)
    const value = colorOverrides[role] ?? fallback
    const pair = typeof value === 'string' ? { light: value, dark: value } : value
    light.push([prop, check(prop, pair.light)])
    dark.push([prop, check(prop, pair.dark)])
  }

  const base: Declarations = []
  for (const [group, defaults] of Object.entries(scalarTokens) as Array<
    [ScalarGroup, Record<string, string>]
  >) {
    const overrides: Record<string, string> = scalarOverrides[group] ?? {}
    for (const [key, fallback] of Object.entries(defaults)) {
      const prop = cssVar(group, key)
      base.push([prop, check(prop, overrides[key] ?? fallback)])
    }
  }

  return { name, css: themeCss(name, base, light, dark) }
}

/*
 * Every scheme boundary inside a ThemeProvider stamps both attributes on one
 * element, so these rules only need compound selectors on that element. The
 * `:root[scheme] T:not([scheme])` rules cover a scheme forced on <html> (by
 * useColorScheme) above a theme that sets none itself.
 *
 * Layer `greese.theme` sits above `greese.tokens`, so a theme beats the default
 * scheme rules on the same element regardless of specificity.
 */
const themeCss = (
  name: string,
  base: Declarations,
  light: Declarations,
  dark: Declarations
): string => {
  const T = `[${THEME_ATTR}='${name}']`
  const S = (scheme: string): string => `[${SCHEME_ATTR}='${scheme}']`
  return `${LAYER_ORDER}
@layer greese.theme {
  ${T} {
${decls([...base, ...light], '    ')}
  }

  @media (prefers-color-scheme: dark) {
    ${T}:not(${S('light')}) {
${decls(dark, '      ')}
    }
  }

  ${T}${S('dark')},
  :root${S('dark')} ${T}:not([${SCHEME_ATTR}]) {
${decls(dark, '    ')}
  }

  :root${S('light')} ${T}:not([${SCHEME_ATTR}]) {
${decls(light, '    ')}
  }

  @media (prefers-reduced-motion: reduce) {
    ${T} {
${decls(reducedMotionDecls(allDurationKeys), '      ')}
    }
  }
}
`
}
