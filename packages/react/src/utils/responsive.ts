import type { CSSProperties } from 'react'
import { breakpointKeys, space, type Breakpoint, type SpaceToken } from '@sauce-ui/tokens'

/**
 * A prop that takes one value, or a value per breakpoint (mobile-first: each
 * applies from its breakpoint upward until a larger one overrides it).
 *
 * ```tsx
 * <Stack direction={{ xs: 'column', md: 'row' }} gap={{ xs: 2, lg: '2.5rem' }} />
 * ```
 */
export type Responsive<T> = T | Partial<Record<Breakpoint, T>>

/** A spacing value: a scale token (`0`–`8`) or any CSS length. */
export type SpaceValue = SpaceToken | (string & {})

export type ResponsiveValue = string | number

export interface ResponsiveConfig<T extends ResponsiveValue = ResponsiveValue> {
  /** Component root class, e.g. `'sauce-Stack'`. */
  readonly block: string
  /** Prop segment in class and variable names, e.g. `'gap'`. */
  readonly prop: string
  /**
   * Whether a value has a pre-generated class (see the `responsive-prop` SCSS
   * mixin). Others become inline custom properties. Default: every value.
   */
  readonly isToken?: (value: T) => boolean
  /** CSS for a value set as an inline variable. Default: `String(value)`. */
  readonly toCss?: (value: T) => string
}

/**
 * "Uses" class, added whenever the prop is set at any breakpoint. The SCSS
 * hangs the prop's rules off it, so unset props cost nothing.
 */
export const responsivePropClass = (block: string, prop: string): string =>
  `${block}--${prop}`

/** Class that sets one breakpoint's value. Must match the SCSS mixin. */
export const responsiveClass = (
  block: string,
  bp: Breakpoint,
  prop: string,
  value: ResponsiveValue
): string => `${block}--${bp}-${prop}-${value}`

/** Custom property holding one breakpoint's value. Must match the SCSS mixin. */
export const responsiveVar = (block: string, prop: string, bp: Breakpoint): string =>
  `--${block.toLowerCase()}-${prop}-${bp}`

export const isSpaceToken = (value: ResponsiveValue): boolean =>
  typeof value === 'number' && Object.hasOwn(space, value)

/** A spacing value as CSS: tokens become `var(--sauce-space-N)`. */
export const spaceToCss = (value: ResponsiveValue): string =>
  typeof value === 'number' ? `var(--sauce-space-${value})` : value

/** For props whose values always go inline (no pre-generated classes). */
export const neverToken = (): boolean => false

/** Maps every breakpoint's value of a responsive prop, keeping its shape. */
export const mapResponsive = <T, U>(
  value: Responsive<T> | undefined,
  map: (value: T) => U
): Responsive<U> | undefined => {
  if (value === undefined) return undefined
  if (typeof value !== 'object' || value === null) return map(value as T)
  const out: Partial<Record<Breakpoint, U>> = {}
  for (const [bp, v] of Object.entries(value) as Array<[Breakpoint, T | undefined]>) {
    if (v !== undefined) out[bp] = map(v)
  }
  return out
}

/** One responsive prop's value paired with its (module-level, static) config. */
export type ResponsiveEntry = readonly [
  value: Responsive<ResponsiveValue> | null | undefined,
  // `never`: every ResponsiveConfig<T> is assignable here (its functions only
  // take values), so entries of different value types share one array.
  config: ResponsiveConfig<never>,
]

export interface ResolvedResponsive {
  className: string
  style: CSSProperties | undefined
}

const isPerBreakpoint = (
  value: Responsive<ResponsiveValue>
): value is Partial<Record<Breakpoint, ResponsiveValue>> => typeof value === 'object'

/**
 * Turns responsive props into the class names and inline custom properties
 * that the `responsive-prop` SCSS mixin reads. Pure and cheap: no CSS is
 * generated, nothing is injected, and `style` is only copied when a value needs
 * an inline variable.
 *
 * ```ts
 * const gap: ResponsiveConfig = { block: 'sauce-Stack', prop: 'gap', isToken: isSpaceToken }
 * const { className, style } = resolveResponsive([[props.gap, gap]], {
 *   className: cx('sauce-Stack', props.className),
 *   style: props.style,
 * })
 * // gap={{ xs: 2, md: '13px' }} →
 * //   className: 'sauce-Stack sauce-Stack--gap sauce-Stack--xs-gap-2'
 * //   style:     { '--sauce-stack-gap-md': '13px' }
 * ```
 *
 * `base.style` wins over generated variables, so callers can always override.
 */
export const resolveResponsive = (
  entries: readonly ResponsiveEntry[],
  base: { className?: string; style?: CSSProperties } = {}
): ResolvedResponsive => {
  let className = base.className ?? ''
  let vars: Record<string, string> | undefined

  const addClass = (cls: string): void => {
    className = className ? `${className} ${cls}` : cls
  }

  const add = (
    config: ResponsiveConfig,
    bp: Breakpoint,
    value: ResponsiveValue
  ): void => {
    if (!config.isToken || config.isToken(value)) {
      addClass(responsiveClass(config.block, bp, config.prop, value))
    } else {
      vars ??= {}
      vars[responsiveVar(config.block, config.prop, bp)] = config.toCss
        ? config.toCss(value)
        : String(value)
    }
  }

  for (const [value, entryConfig] of entries) {
    if (value == null) continue
    // Safe: each entry pairs a value with the config written for its type.
    const config = entryConfig as unknown as ResponsiveConfig
    addClass(responsivePropClass(config.block, config.prop))
    if (isPerBreakpoint(value)) {
      for (const bp of breakpointKeys) {
        const v = value[bp]
        if (v != null) add(config, bp, v)
      }
    } else {
      add(config, 'xs', value)
    }
  }

  return {
    className,
    style: vars ? ({ ...vars, ...base.style } as CSSProperties) : base.style,
  }
}
