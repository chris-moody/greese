import { breakpoints, type Breakpoint } from './tokens.ts'
import type { Declarations } from './css.ts'

/**
 * The type system: named text styles that change across breakpoints.
 *
 * Each variant has values for font size, weight, letter spacing and line
 * height, plus any of a few other text properties. They're custom properties,
 * `--greese-type-<variant>-<prop>`, set mobile-first: `base` applies from the
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

/** The four properties every variant has, and the CSS property each sets. */
export const typeCoreProps = {
  size: 'font-size',
  weight: 'font-weight',
  tracking: 'letter-spacing',
  leading: 'line-height',
} as const

/**
 * Other properties a variant may set: unset ones inherit, so a variant that
 * doesn't mention `transform` leaves `text-transform` alone.
 */
export const typeExtraProps = {
  family: 'font-family',
  style: 'font-style',
  transform: 'text-transform',
  features: 'font-feature-settings',
  variation: 'font-variation-settings',
  stretch: 'font-stretch',
  wrap: 'text-wrap',
  spacing: 'word-spacing',
  numeric: 'font-variant-numeric',
} as const

export const typeProps = { ...typeCoreProps, ...typeExtraProps } as const

export type TypeCoreProp = keyof typeof typeCoreProps
export type TypeExtraProp = keyof typeof typeExtraProps
export type TypeProp = TypeCoreProp | TypeExtraProp

/** One breakpoint's values for a variant. */
export type TypeStyle = Partial<Record<TypeProp, string>>

/** A variant: `base`, and the changes at each breakpoint (`md: { size: '3rem' }`). */
export type TypeSpec = { base?: TypeStyle } & Partial<Record<Breakpoint, TypeStyle>>

export type Typography = Record<TypeVariant, TypeSpec>

const t = (size: string, weight: string, leading: string, tracking = '0'): TypeStyle => ({
  size,
  weight,
  leading,
  tracking,
})

/** The defaults, in rem so they follow the user's text-size setting. */
export const typography: Typography = {
  h1: {
    base: { ...t('2.25rem', '700', '1.15', '-0.02em'), wrap: 'balance' },
    md: { size: '2.75rem' },
    lg: { size: '3.5rem', leading: '1.1' },
  },
  h2: {
    base: { ...t('1.875rem', '700', '1.2', '-0.015em'), wrap: 'balance' },
    md: { size: '2.25rem' },
    lg: { size: '2.75rem' },
  },
  h3: {
    base: { ...t('1.5rem', '600', '1.25', '-0.01em'), wrap: 'balance' },
    md: { size: '1.75rem' },
    lg: { size: '2rem' },
  },
  h4: {
    base: { ...t('1.25rem', '600', '1.3'), wrap: 'balance' },
    md: { size: '1.375rem' },
    lg: { size: '1.5rem' },
  },
  h5: {
    base: { ...t('1.125rem', '600', '1.35'), wrap: 'balance' },
    md: { size: '1.25rem' },
  },
  h6: {
    base: { ...t('1rem', '600', '1.4'), wrap: 'balance' },
    md: { size: '1.0625rem' },
  },
  s1: { base: t('1.25rem', '500', '1.4'), md: { size: '1.375rem' } },
  s2: { base: t('1.125rem', '500', '1.45') },
  p1: { base: t('1.125rem', '400', '1.6'), md: { size: '1.25rem' } },
  p2: { base: t('1rem', '400', '1.55') },
  p3: { base: t('0.875rem', '400', '1.5') },
  caption: { base: t('0.75rem', '400', '1.4', '0.02em') },
  button: { base: t('0.9375rem', '600', '1.25') },
}

/** `--greese-type-h1-size`. */
export const typeVar = (variant: string, prop: string): string =>
  `--greese-type-${variant}-${prop}`

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
