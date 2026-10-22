import { breakpoints, type Breakpoint } from './tokens.ts'
import { kebab, type Declarations } from './css.ts'

/**
 * The type system: named text styles that change across breakpoints.
 *
 * Each variant has values for font size, weight, letter spacing and line
 * height, plus any of a few other text properties. They're custom properties,
 * `--greese-type-<variant>-<css-property>`, set mobile-first: `base` applies from the
 * smallest screen, and a value set at a breakpoint applies from there up until
 * a larger breakpoint sets another. Only values that change are written.
 * `.greese-Type--<variant>` applies a variant's properties to any element, and
 * Text and Heading take it as `variant`.
 */
export const typeVariants = [
  'p1',
  'p2',
  'p3',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  's1',
  's2',
  'caption',
  'button',
] as const

export type TypeVariant = (typeof typeVariants)[number]

/**
 * The four properties every variant has. Names are the CSS properties in
 * their JavaScript form (`fontSize` for `font-size`), as in React's `style`.
 */
export const typeCoreProps = [
  'fontSize',
  'fontWeight',
  'letterSpacing',
  'lineHeight',
] as const

/**
 * Other properties a variant may set: unset ones inherit, so a variant that
 * doesn't mention `textTransform` leaves `text-transform` alone.
 */
export const typeExtraProps = [
  'color',
  'fontFamily',
  'fontStyle',
  'textTransform',
  'fontFeatureSettings',
  'fontVariationSettings',
  'fontStretch',
  'textWrap',
  'wordSpacing',
  'fontVariantNumeric',
] as const

export const typeProps = [...typeCoreProps, ...typeExtraProps] as const

/** `fontSize` → `font-size`: the CSS property a type property sets. */
export const cssProperty = (prop: string): string => kebab(prop)

/** `font-size` → `fontSize`, for reading CSS back in. */
export const typePropName = (property: string): string =>
  property.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())

export type TypeCoreProp = (typeof typeCoreProps)[number]
export type TypeExtraProp = (typeof typeExtraProps)[number]
export type TypeProp = TypeCoreProp | TypeExtraProp

/** One breakpoint's values for a variant. */
export type TypeStyle = Partial<Record<TypeProp, string>>

/** A variant: `base`, and the changes at each breakpoint (`md: { fontSize: '3rem' }`). */
export type TypeSpec = { base?: TypeStyle } & Partial<Record<Breakpoint, TypeStyle>>

export type Typography = Record<TypeVariant, TypeSpec>

const t = (
  fontSize: string,
  fontWeight: string,
  lineHeight: string,
  letterSpacing = '0'
): TypeStyle => ({ fontSize, fontWeight, lineHeight, letterSpacing })

/** The defaults, in rem so they follow the user's text-size setting. */
export const typography: Typography = {
  h1: {
    base: { ...t('2.25rem', '700', '1.15', '-0.02em'), textWrap: 'balance' },
    md: { fontSize: '2.75rem' },
    lg: { fontSize: '3.5rem', lineHeight: '1.1' },
  },
  h2: {
    base: { ...t('1.875rem', '700', '1.2', '-0.015em'), textWrap: 'balance' },
    md: { fontSize: '2.25rem' },
    lg: { fontSize: '2.75rem' },
  },
  h3: {
    base: { ...t('1.5rem', '600', '1.25', '-0.01em'), textWrap: 'balance' },
    md: { fontSize: '1.75rem' },
    lg: { fontSize: '2rem' },
  },
  h4: {
    base: { ...t('1.25rem', '600', '1.3'), textWrap: 'balance' },
    md: { fontSize: '1.375rem' },
    lg: { fontSize: '1.5rem' },
  },
  h5: {
    base: { ...t('1.125rem', '600', '1.35'), textWrap: 'balance' },
    md: { fontSize: '1.25rem' },
  },
  h6: {
    base: { ...t('1rem', '600', '1.4'), textWrap: 'balance' },
    md: { fontSize: '1.0625rem' },
  },
  s1: { base: t('1.25rem', '500', '1.4'), md: { fontSize: '1.375rem' } },
  s2: { base: t('1.125rem', '500', '1.45') },
  p1: { base: t('1.125rem', '400', '1.6'), md: { fontSize: '1.25rem' } },
  p2: { base: t('1rem', '400', '1.55') },
  p3: { base: t('0.875rem', '400', '1.5') },
  caption: { base: t('0.75rem', '400', '1.4', '0.02em') },
  button: { base: t('0.9375rem', '600', '1.25') },
}

/** `--greese-type-h1-font-size`, for the type property `fontSize`. */
export const typeVar = (variant: string, prop: string): string =>
  `--greese-type-${variant}-${cssProperty(prop)}`

/**
 * The defaults with your changes on top, per variant and breakpoint: what you
 * set replaces the default at that exact point, and everything else (the other
 * breakpoints too) stays.
 */
export const mergeTypography = (
  base: Typography,
  changes: Partial<Record<TypeVariant, TypeSpec>> = {}
): Typography => {
  const out = { ...base }
  for (const [variant, spec] of Object.entries(changes) as Array<
    [TypeVariant, TypeSpec]
  >) {
    const merged: Record<string, TypeStyle> = {}
    for (const [point, style] of Object.entries({ ...out[variant] }))
      merged[point] = { ...style }
    for (const [point, style] of Object.entries(spec ?? {})) {
      merged[point] = { ...merged[point], ...style }
    }
    out[variant] = merged as TypeSpec
  }
  return out
}

/** Breakpoint keys, smallest first, with `base` for the smallest screen. */
const points = (widths: Record<string, number>): string[] =>
  Object.keys(widths).sort((a, b) => widths[a]! - widths[b]!)

/**
 * The declarations of each breakpoint, smallest first: `[min-width in px or
 * 0 for base, declarations]`. A breakpoint with nothing to say is left out.
 */
export const typographyByBreakpoint = (
  spec: Partial<Record<TypeVariant, TypeSpec>>,
  widths: Record<string, number> = breakpoints
): Array<[number, Declarations]> => {
  const out: Array<[number, Declarations]> = []
  for (const point of ['base', ...points(widths).filter((k) => widths[k]! > 0)]) {
    const list: Declarations = []
    for (const variant of typeVariants) {
      const style = (
        spec[variant] as Record<string, TypeStyle | undefined> | undefined
      )?.[point === 'base' ? 'base' : point]
      // The smallest breakpoint (xs, 0) is the same point as `base`.
      const extra =
        point === 'base'
          ? (spec[variant] as Record<string, TypeStyle | undefined> | undefined)?.xs
          : undefined
      for (const [prop, value] of Object.entries({ ...style, ...extra })) {
        if (value !== undefined && value !== '')
          list.push([typeVar(variant, prop), value])
      }
    }
    if (list.length) out.push([point === 'base' ? 0 : widths[point]!, list])
  }
  return out
}
