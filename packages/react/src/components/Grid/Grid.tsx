import type { JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import {
  isSpaceToken,
  neverToken,
  resolveResponsive,
  spaceToCss,
  type Responsive,
  type ResponsiveConfig,
  type ResponsiveValue,
  type SpaceValue,
} from '../../utils/responsive.ts'
import { Box, type BoxProps } from '../Box/Box.tsx'

/** Column counts with pre-generated classes. */
export type GridColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export interface GridProps extends Omit<BoxProps, 'gap'> {
  /**
   * Equal columns (`1`–`12`), or any `grid-template-columns` value such as
   * `'200px 1fr'`.
   */
  columns?: Responsive<GridColumnCount | (string & {})>
  /**
   * Fits as many columns as possible, each at least this wide: responsive
   * without breakpoints. Overrides `columns` where both apply.
   */
  minChildWidth?: Responsive<string>
  /** Space between cells: a scale token (`0`–`8`) or any CSS length. */
  gap?: Responsive<SpaceValue>
  /** Cell alignment in the block axis (`align-items`). */
  align?: Responsive<'start' | 'center' | 'end' | 'stretch'>
  /** Cell alignment in the inline axis (`justify-items`). */
  justify?: Responsive<'start' | 'center' | 'end' | 'stretch'>
  /**
   * Makes the grid a size container: GridItem `span`s then respond to the
   * grid's own width instead of the viewport, so the same grid adapts in a
   * sidebar or a full-width page.
   */
  container?: boolean
}

const G = 'greese-Grid'
const isColumnToken = (v: ResponsiveValue): boolean =>
  typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 12
const COLUMNS: ResponsiveConfig = { block: G, prop: 'columns', isToken: isColumnToken }
const MIN_CHILD: ResponsiveConfig = { block: G, prop: 'min-child', isToken: neverToken }
const GAP: ResponsiveConfig = {
  block: G,
  prop: 'gap',
  isToken: isSpaceToken,
  toCss: spaceToCss,
}
const ALIGN: ResponsiveConfig = { block: G, prop: 'align' }
const JUSTIFY: ResponsiveConfig = { block: G, prop: 'justify' }

/**
 * Two-dimensional CSS grid layout.
 *
 * ```tsx
 * <Grid columns={{ xs: 1, sm: 2, lg: 4 }} gap={4}>…</Grid>
 * <Grid minChildWidth="14rem" gap={4}>…</Grid>
 * ```
 *
 * Accepts every Box style prop and `asChild`. Server-component safe.
 */
export const Grid = ({
  columns,
  minChildWidth,
  gap,
  align,
  justify,
  container,
  className,
  style,
  ...props
}: GridProps): JSX.Element => {
  const resolved = resolveResponsive(
    [
      [columns, COLUMNS],
      [minChildWidth, MIN_CHILD],
      [gap, GAP],
      [align, ALIGN],
      [justify, JUSTIFY],
    ],
    { className: cx(G, container && `${G}--container`, className), style }
  )
  return <Box {...props} className={resolved.className} style={resolved.style} />
}

export type GridSpan = GridColumnCount | 'full'

export interface GridItemProps extends BoxProps {
  /** Columns to span (`1`–`12`), or `'full'` for the whole row. */
  span?: Responsive<GridSpan>
}

const SPAN: ResponsiveConfig = { block: 'greese-GridItem', prop: 'span' }

/** A Grid cell that spans columns, per breakpoint or per container width. */
export const GridItem = ({
  span,
  className,
  style,
  ...props
}: GridItemProps): JSX.Element => {
  const resolved = resolveResponsive([[span, SPAN]], {
    className: cx('greese-GridItem', className),
    style,
  })
  return <Box {...props} className={resolved.className} style={resolved.style} />
}
