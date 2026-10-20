import type { CSSProperties, JSX } from 'react'
import type { Breakpoint } from '@greese/ui'
import { cx } from '../../utils/cx.ts'
import {
  isSpaceToken,
  neverToken,
  resolveResponsive,
  spaceToCss,
  type Responsive,
  type ResponsiveConfig,
  type SpaceValue,
} from '../../utils/responsive.ts'
import { Box, type BoxProps } from '../Box/Box.tsx'

export interface AutoLayoutProps extends Omit<BoxProps, 'gap' | 'rowGap' | 'columnGap'> {
  /** Columns in a row: the unit for each item's `size`. @default 12 */
  columns?: number
  /** Space between items, both ways: a scale token (`0`–`8`) or any CSS length. */
  gap?: Responsive<SpaceValue>
  /** Space between rows, where it differs from `gap`. */
  rowGap?: Responsive<SpaceValue>
}

const A = 'greese-AutoLayout'
const GAP: ResponsiveConfig = {
  block: A,
  prop: 'gap',
  isToken: isSpaceToken,
  toCss: spaceToCss,
}
const ROW_GAP: ResponsiveConfig = {
  block: A,
  prop: 'row-gap',
  isToken: isSpaceToken,
  toCss: spaceToCss,
}

/**
 * Rows of items sized in columns that may grow into spare room: each item
 * takes at least `size` columns and stretches up to `maxSize`, wrapping to a
 * new row when it no longer fits. Both may change per breakpoint.
 *
 * ```tsx
 * <AutoLayout gap={3}>
 *   <AutoLayoutItem size={{ xs: 12, md: 4 }} maxSize={{ md: 6 }}>…</AutoLayoutItem>
 *   <AutoLayoutItem size={{ xs: 12, md: 4 }}>…</AutoLayoutItem>
 * </AutoLayout>
 * ```
 *
 * Grid suits fixed tracks; AutoLayout suits rows whose items share leftover
 * space, such as a form whose fields widen when a row has room.
 */
export const AutoLayout = ({
  columns,
  gap,
  rowGap,
  className,
  style,
  ...props
}: AutoLayoutProps): JSX.Element => {
  const resolved = resolveResponsive(
    [
      [gap, GAP],
      [rowGap, ROW_GAP],
    ],
    {
      className: cx(A, className),
      style:
        columns === undefined
          ? style
          : ({ '--greese-autolayout-columns': columns, ...style } as CSSProperties),
    }
  )
  return <Box {...props} className={resolved.className} style={resolved.style} />
}

type Size = Responsive<number>

export interface AutoLayoutItemProps extends BoxProps {
  /** Columns the item always takes. Unset: the whole row. */
  size?: Size
  /**
   * Columns the item may grow to when its row has room. Defaults to `size` at
   * each breakpoint, so an item never grows unless asked to.
   */
  maxSize?: Size
}

const I = 'greese-AutoLayoutItem'
const SIZE: ResponsiveConfig = { block: I, prop: 'size', isToken: neverToken }
const MAX: ResponsiveConfig = { block: I, prop: 'max', isToken: neverToken }

const order: readonly Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl']
const perBreakpoint = (v: Size): Partial<Record<Breakpoint, number>> =>
  typeof v === 'number' ? { xs: v } : v

/**
 * `maxSize` per breakpoint, falling back to that breakpoint's `size`: with
 * `size={{ xs: 12, md: 4 }}` and `maxSize={{ md: 6 }}`, xs stays fixed at 12.
 */
export const resolveMaxSize = (size: Size | undefined, maxSize: Size | undefined) => {
  if (size === undefined) return maxSize
  const sizes = perBreakpoint(size)
  const maxes = maxSize === undefined ? {} : perBreakpoint(maxSize)
  const out: Partial<Record<Breakpoint, number>> = {}
  for (const bp of order) {
    const v = maxes[bp] ?? sizes[bp]
    if (v !== undefined) out[bp] = v
  }
  return out
}

/** One item of an AutoLayout. */
export const AutoLayoutItem = ({
  size,
  maxSize,
  className,
  style,
  ...props
}: AutoLayoutItemProps): JSX.Element => {
  const resolved = resolveResponsive(
    [
      [size, SIZE],
      [resolveMaxSize(size, maxSize), MAX],
    ],
    { className: cx(I, className), style }
  )
  return <Box {...props} className={resolved.className} style={resolved.style} />
}
