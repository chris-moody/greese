import {
  allDurationKeys,
  cssVar,
  decls,
  kebab,
  LAYER_ORDER,
  reducedMotionDecls,
  SCHEME_ATTR,
  THEME_ATTR,
  type Declarations,
} from './css.ts'
import { contentColor } from './contrast.ts'
import {
  mergeTypography,
  typography as defaultTypography,
  typographyByBreakpoint,
  type TypeSpec,
  type TypeVariant,
} from './typography.ts'
import {
  color,
  scalarTokens,
  type ColorRole,
  type ScalarGroup,
  type TokenPair,
} from './tokens.ts'

/** A color override: one value for both schemes, or a light/dark pair. */
export type ColorValue = string | TokenPair

/** Tokens the system doesn't have, by group: `{ color: { 'brand-ink': '#1b1340' } }`. */
export type ExtendTokens = {
  /** A new color role: one value, or a light/dark pair. */
  color?: Record<string, ColorValue>
} & {
  [G in ScalarGroup]?: Record<string, string>
}

export type ThemeOptions = {
  /** Scopes the theme: `[data-greese-theme="<name>"]`. Letters, digits, `-`. */
  name: string
  color?: Partial<Record<ColorRole, ColorValue>>
  /**
   * Adds tokens that don't exist yet, each declared as
   * `--greese-<group>-<key>` in this theme (in both schemes, for a color).
   * Names that already exist, and groups that don't, throw: set an existing
   * token through its group above.
   */
  extend?: ExtendTokens
  /**
   * Type system values by variant, then `base` or a breakpoint, then property
   * (`{ h1: { base: { size: '2rem' }, lg: { size: '4rem' } } }`). What you set
   * replaces the default at that point and the rest stays. The breakpoints are
   * the defaults' widths; a build with its own uses the SCSS kit's
   * `typography()` instead.
   */
  typography?: Partial<Record<TypeVariant, TypeSpec>>
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

/** Colors whose `Content` (and, where it exists, `Strong`) follow them. */
const DERIVED = ['primary', 'secondary', 'tertiary', 'accent', 'negative'] as const

const toPair = (value: ColorValue): TokenPair =>
  typeof value === 'string' ? { light: value, dark: value } : value

/**
 * Fills in what follows a brand color the theme set: its `Content` color,
 * the more readable of white and near-black (WCAG AA), measured per scheme,
 * and its `Strong` shade, mixed by the browser from the color itself
 * (darker in light, lighter in dark). Anything the theme sets wins, and a
 * color that can't be measured (not a hex) keeps the default content.
 */
export const deriveColors = (
  overrides: Partial<Record<ColorRole, ColorValue>>
): Partial<Record<ColorRole, ColorValue>> => {
  const out = { ...overrides }
  for (const role of DERIVED) {
    const main = overrides[role]
    if (main === undefined) continue
    const pair = toPair(main)
    const content = `${role}Content` as ColorRole
    if (overrides[content] === undefined) {
      const fallback = color[content] as TokenPair
      out[content] = {
        light: contentColor(pair.light) ?? fallback.light,
        dark: contentColor(pair.dark) ?? fallback.dark,
      }
    }
    const strong = `${role}Strong` as ColorRole
    if (strong in color && overrides[strong] === undefined) {
      const self = `var(${cssVar('color', role)})`
      out[strong] = {
        light: `color-mix(in oklab, ${self} 80%, #000)`,
        dark: `color-mix(in oklab, ${self} 70%, #fff)`,
      }
    }
  }
  return out
}

/**
 * Builds a theme: the default tokens with your overrides applied. Setting a
 * brand color (`primary`, `secondary`, `tertiary`, `accent`, `negative`)
 * also sets its `Content` and `Strong` colors unless you set them: see
 * {@link deriveColors}.
 *
 * ```ts
 * export const brand = createTheme({
 *   name: 'brand',
 *   color: { primary: { light: '#7c3aed', dark: '#c4b5fd' } },
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
  const {
    name,
    color: colorOverrides = {},
    extend = {},
    typography: typeChanges,
    ...scalarOverrides
  } = options
  if (!NAME.test(name)) {
    throw new Error(`createTheme: name must match ${NAME}, got ${JSON.stringify(name)}`)
  }

  const light: Declarations = []
  const dark: Declarations = []
  const colors = deriveColors(colorOverrides)
  for (const [role, fallback] of Object.entries(color) as Array<[ColorRole, TokenPair]>) {
    const prop = cssVar('color', role)
    const pair = toPair(colors[role] ?? fallback)
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

  addExtended(extend, base, light, dark)

  // Complete like the rest: every variant, the smallest screen's values with
  // the theme's tokens and the changes in media queries.
  const steps = typographyByBreakpoint(mergeTypography(defaultTypography, typeChanges))
  for (const [, list] of steps) for (const [prop, value] of list) check(prop, value)
  base.push(...steps.filter(([min]) => min === 0).flatMap(([, list]) => list))

  return {
    name,
    css: themeCss(
      name,
      base,
      light,
      dark,
      steps.filter(([min]) => min > 0)
    ),
  }
}

const TOKEN_KEY = /^[a-z0-9][a-z0-9-]*$/

/** Declares `extend`'s new tokens, refusing names that exist or groups that don't. */
const addExtended = (
  extend: ExtendTokens,
  base: Declarations,
  light: Declarations,
  dark: Declarations
): void => {
  for (const [group, values] of Object.entries(extend)) {
    const known: Record<string, unknown> | undefined =
      group === 'color'
        ? color
        : (scalarTokens as Record<string, Record<string, string>>)[group]
    if (!known) throw new Error(`createTheme: no token group ${group} to extend`)
    for (const [key, value] of Object.entries(values ?? {})) {
      const name = kebab(key)
      if (!TOKEN_KEY.test(name) || Object.keys(known).some((k) => kebab(k) === name)) {
        throw new Error(`createTheme: ${group} token ${key} is invalid or already exists`)
      }
      const prop = cssVar(group as ScalarGroup | 'color', name)
      if (group === 'color') {
        const pair = toPair(value as ColorValue)
        light.push([prop, check(prop, pair.light)])
        dark.push([prop, check(prop, pair.dark)])
      } else {
        base.push([prop, check(prop, value as string)])
      }
    }
  }
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
  dark: Declarations,
  media: Array<[number, Declarations]>
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
${media
  .map(
    ([min, list]) => `
  @media (width >= ${min}px) {
    ${T} {
${decls(list, '      ')}
    }
  }`
  )
  .join('\n')}
}
`
}
