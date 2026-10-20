import type { ComponentPropsWithoutRef, CSSProperties, JSX, Ref } from 'react'
import type { TypeVariant } from '@greese/ui'
import { cx } from '../../utils/cx.ts'
import {
  resolveResponsive,
  type Responsive,
  type ResponsiveConfig,
} from '../../utils/responsive.ts'
import { Slot } from '../Slot/Slot.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'
import type { BrandTone } from '../../utils/tone.ts'

export type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
export type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold'
export type TextTone =
  'neutral' | 'muted' | BrandTone | 'positive' | 'negative' | 'warning' | 'info'

export interface TextProps extends ComponentPropsWithoutRef<'p'>, GreeseProps {
  /** The rendered element: a `<p>`, or yours with `asChild`. */
  ref?: Ref<HTMLElement>
  /**
   * A named text style from the theme's type system (`p1`–`p3`, `s1`, `s2`,
   * `caption`, and the heading styles `h1`–`h6`): size, weight, letter spacing,
   * line height and more, set for every breakpoint. When set it owns those,
   * and `size` and `weight` are ignored; adjust a variant in the theme, or per
   * instance through its `--greese-type-<variant>-*` custom properties.
   */
  variant?: TypeVariant
  /** Font size from the scale, per breakpoint if needed. Ignored with a `variant`. */
  size?: Responsive<FontSize>
  /** Font weight: regular, medium, semibold or bold. Ignored with a `variant`. */
  weight?: FontWeight
  /**
   * Text color: neutral, muted, accent, a brand color (primary, secondary,
   * tertiary), positive, negative, warning or info.
   * @default 'neutral'
   */
  tone?: TextTone
  /** `true` cuts to one line with an ellipsis; a number clamps to that many lines. */
  truncate?: boolean | number
  /** Render another element (`<span>`, `<label>`, `<li>`) with Text's styling. */
  asChild?: boolean
}

const SIZE: ResponsiveConfig = { block: 'greese-Text', prop: 'size' }

/**
 * Body text: a `<p>` by default. Use `asChild` for any other element.
 *
 * ```tsx
 * <Text variant="p2">Body copy that follows the theme's type system.</Text>
 * <Text size={{ xs: 'sm', md: 'md' }} tone="muted" truncate={2}>…</Text>
 * <Text asChild weight="semibold"><span>inline</span></Text>
 * ```
 */
export const Text = ({
  greese,
  variant,
  size,
  weight,
  tone,
  truncate,
  asChild,
  className,
  style,
  ...props
}: TextProps): JSX.Element => {
  const resolved = resolveResponsive([[variant ? undefined : size, SIZE]], {
    className: cx(
      'greese-Text',
      variant && `greese-Type--${variant}`,
      !variant && weight && `greese-Text--${weight}`,
      tone && `greese-Text--${tone}`,
      truncate === true && 'greese-Text--truncate',
      typeof truncate === 'number' && 'greese-Text--clamp',
      className
    ),
    style:
      typeof truncate === 'number'
        ? ({ '--greese-text-lines': truncate, ...style } as CSSProperties)
        : style,
  })
  const Root = (asChild ? Slot : 'p') as typeof Slot
  return withGreese(
    <Root {...props} className={resolved.className} style={resolved.style} />,
    greese
  )
}
