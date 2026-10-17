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
}

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

/** One responsive prop's value paired with its (module-level, static) config. */
export type ResponsiveEntry = readonly [
  value: Responsive<ResponsiveValue> | null | undefined,
  // Configs are invariant in T; `any` lets entries of different value types share an array.
  config: ResponsiveConfig<any>,
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

  const add = (
    config: ResponsiveConfig,
    bp: Breakpoint,
    value: ResponsiveValue
  ): void => {
    if (!config.isToken || config.isToken(value)) {
      const cls = responsiveClass(config.block, bp, config.prop, value)
      className = className ? `${className} ${cls}` : cls
    } else {
      vars ??= {}
      vars[responsiveVar(config.block, config.prop, bp)] = String(value)
    }
  }

  for (const [value, config] of entries) {
    if (value == null) continue
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
