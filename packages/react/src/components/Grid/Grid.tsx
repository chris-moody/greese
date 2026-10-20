import type { JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import {
  isSpaceToken,
  neverToken,
  resolveResponsive,
  spaceToCss,
  type Responsive,
  type ResponsiveConfig,
  type ResponsiveEntry,
  type ResponsiveValue,
  type SpaceValue,
} from '../../utils/responsive.ts'
import { Box, type BoxProps } from '../Box/Box.tsx'

/** Column counts with pre-generated classes. */
export type GridColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

/** How many columns a cell spans: `1`–`12`, or `'full'` for the whole row. */
export type GridSize = GridColumnCount | 'full'

export interface GridProps extends Omit<BoxProps, 'gap'> {
  /**
   * Makes this element a grid: its children are laid out in its columns.
   * Without it, a Grid is a cell of the grid around it. One element can be
   * both, to nest grids.
   * @default false
   */
  container?: boolean
  /**
   * How many of the parent grid's columns this cell spans: `1`–`12`, or
   * `'full'` for the whole row, per breakpoint if you like
   * (`{ xs: 12, md: 6 }`).
   */
  size?: Responsive<GridSize>
  /**
   * With `container`: equal columns (`1`–`12`), or any `grid-template-columns`
   * value such as `'200px 1fr'`, per breakpoint if you like.
   */
  columns?: Responsive<GridColumnCount | (string & {})>
  /**
   * With `container`: fits as many columns as possible, each at least this
   * wide, so the grid is responsive without breakpoints. Overrides `columns`
   * where both apply.
   */
  minChildWidth?: Responsive<string>
  /**
   * With `container`: space between cells, a scale token (`0`–`8`) or any CSS
   * length, per breakpoint if you like.
   */
  gap?: Responsive<SpaceValue>
  /** With `container`: how cells align in the block axis (`align-items`). */
  align?: Responsive<'start' | 'center' | 'end' | 'stretch'>
  /** With `container`: how cells align in the inline axis (`justify-items`). */
  justify?: Responsive<'start' | 'center' | 'end' | 'stretch'>
  /**
   * With `container`: the cells' `size`s respond to this grid's own width
   * instead of the viewport's, so the same grid adapts in a sidebar or a
   * full-width page.
   */
  containerQueries?: boolean
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
const SIZE: ResponsiveConfig = { block: G, prop: 'size' }

/**
 * Two-dimensional CSS grid layout. `container` makes a grid; a Grid without
 * it is a cell that spans `size` columns. The same element can be both.
 *
 * ```tsx
 * <Grid container columns={12} gap={4}>
 *   <Grid size={{ xs: 12, md: 8 }}>…</Grid>
 *   <Grid size={{ xs: 12, md: 4 }}>…</Grid>
 * </Grid>
 * <Grid container minChildWidth="14rem" gap={4}>…</Grid>
 * ```
 *
 * Accepts every Box style prop and `asChild`. Server-component safe.
 */
export const Grid = ({
  container,
  size,
  columns,
  minChildWidth,
  gap,
  align,
  justify,
  containerQueries,
  className,
  style,
  ...props
}: GridProps): JSX.Element => {
  const entries: ResponsiveEntry[] = [[size, SIZE]]
  // Grid props only mean something on a grid.
  if (container)
    entries.push(
      [columns, COLUMNS],
      [minChildWidth, MIN_CHILD],
      [gap, GAP],
      [align, ALIGN],
      [justify, JUSTIFY]
    )
  const resolved = resolveResponsive(entries, {
    className: cx(
      G,
      container && `${G}--container`,
      container && containerQueries && `${G}--queries`,
      className
    ),
    style,
  })
  return <Box {...props} className={resolved.className} style={resolved.style} />
}
