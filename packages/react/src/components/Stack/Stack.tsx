import type { JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import {
  isSpaceToken,
  resolveResponsive,
  spaceToCss,
  type Responsive,
  type ResponsiveConfig,
  type SpaceValue,
} from '../../utils/responsive.ts'
import { Box, type BoxProps } from '../Box/Box.tsx'

export type StackDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse'
export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'

export interface StackProps extends Omit<BoxProps, 'gap'> {
  /** Main axis. Mobile-first default: `column`. */
  direction?: Responsive<StackDirection>
  /** Space between children: a scale token (`0`–`8`) or any CSS length. */
  gap?: Responsive<SpaceValue>
  /** Cross-axis alignment (`align-items`). */
  align?: Responsive<StackAlign>
  /** Main-axis distribution (`justify-content`). */
  justify?: Responsive<StackJustify>
  wrap?: Responsive<'wrap' | 'nowrap' | 'wrap-reverse'>
}

const S = 'sauce-Stack'
const DIRECTION: ResponsiveConfig = { block: S, prop: 'direction' }
const GAP: ResponsiveConfig = {
  block: S,
  prop: 'gap',
  isToken: isSpaceToken,
  toCss: spaceToCss,
}
const ALIGN: ResponsiveConfig = { block: S, prop: 'align' }
const JUSTIFY: ResponsiveConfig = { block: S, prop: 'justify' }
const WRAP: ResponsiveConfig = { block: S, prop: 'wrap' }

/**
 * One-dimensional flex layout, vertical by default (mobile-first).
 *
 * ```tsx
 * <Stack direction={{ xs: 'column', md: 'row' }} gap={{ xs: 2, md: 4 }} align="center">
 * ```
 *
 * Accepts every Box style prop and `asChild`. Server-component safe.
 */
export const Stack = ({
  direction,
  gap,
  align,
  justify,
  wrap,
  className,
  style,
  ...props
}: StackProps): JSX.Element => {
  const resolved = resolveResponsive(
    [
      [direction, DIRECTION],
      [gap, GAP],
      [align, ALIGN],
      [justify, JUSTIFY],
      [wrap, WRAP],
    ],
    { className: cx(S, className), style }
  )
  return <Box {...props} className={resolved.className} style={resolved.style} />
}
