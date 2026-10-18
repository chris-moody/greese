import type { ComponentPropsWithoutRef, CSSProperties, JSX, Ref } from 'react'
import { cx } from '../../utils/cx.ts'
import {
  resolveResponsive,
  type Responsive,
  type ResponsiveConfig,
} from '../../utils/responsive.ts'
import { Slot } from '../Slot/Slot.tsx'

export type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
export type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold'
export type TextTone =
  'neutral' | 'muted' | 'accent' | 'positive' | 'negative' | 'warning' | 'info'

export interface TextProps extends ComponentPropsWithoutRef<'p'> {
  ref?: Ref<HTMLElement>
  /** Font size from the scale, per breakpoint if needed. */
  size?: Responsive<FontSize>
  weight?: FontWeight
  /** @default 'neutral' */
  tone?: TextTone
  /** `true` cuts to one line with an ellipsis; a number clamps to that many lines. */
  truncate?: boolean | number
  /** Render another element (`<span>`, `<label>`, `<li>`) with Text's styling. */
  asChild?: boolean
}

const SIZE: ResponsiveConfig = { block: 'sauce-Text', prop: 'size' }

/**
 * Body text: a `<p>` by default. Use `asChild` for any other element.
 *
 * ```tsx
 * <Text size={{ xs: 'sm', md: 'md' }} tone="muted" truncate={2}>…</Text>
 * <Text asChild weight="semibold"><span>inline</span></Text>
 * ```
 */
export const Text = ({
  size,
  weight,
  tone,
  truncate,
  asChild,
  className,
  style,
  ...props
}: TextProps): JSX.Element => {
  const resolved = resolveResponsive([[size, SIZE]], {
    className: cx(
      'sauce-Text',
      weight && `sauce-Text--${weight}`,
      tone && `sauce-Text--${tone}`,
      truncate === true && 'sauce-Text--truncate',
      typeof truncate === 'number' && 'sauce-Text--clamp',
      className
    ),
    style:
      typeof truncate === 'number'
        ? ({ '--sauce-text-lines': truncate, ...style } as CSSProperties)
        : style,
  })
  const Root = (asChild ? Slot : 'p') as typeof Slot
  return <Root {...props} className={resolved.className} style={resolved.style} />
}
