import type { JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { Box, type BoxProps } from '../Box/Box.tsx'

export interface TileProps extends BoxProps {
  /**
   * `filled` (a surface color with a hairline), `outline` (a border only) or
   * `dashed` (a dashed border, for empty slots and drop zones).
   * @default 'filled'
   */
  variant?: 'filled' | 'outline' | 'dashed'
}

/**
 * A plain, compact surface: a grid cell, a placeholder, a swatch, a small
 * dashboard tile. Padding comes from the style props (`p`, `px`…) and
 * defaults to a snug 3 × 4. For structured content (a title, media, actions,
 * padding that grows at md) use Card.
 *
 * ```tsx
 * <Grid columns={3} gap={3}>
 *   <Tile>One</Tile>
 *   <Tile variant="dashed">Drop files here</Tile>
 * </Grid>
 * ```
 *
 * Accepts every Box style prop and `asChild`. Server-component safe.
 */
export const Tile = ({
  variant = 'filled',
  className,
  ...props
}: TileProps): JSX.Element => (
  <Box {...props} className={cx('greese-Tile', `greese-Tile--${variant}`, className)} />
)
