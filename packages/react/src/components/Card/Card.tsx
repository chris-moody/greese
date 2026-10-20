import type { JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import {
  neverToken,
  resolveResponsive,
  spaceToCss,
  type Responsive,
  type ResponsiveConfig,
  type SpaceValue,
} from '../../utils/responsive.ts'
import { Box, type BoxProps } from '../Box/Box.tsx'
import { withGreese } from '../../utils/greese.ts'

export interface CardProps extends BoxProps {
  /**
   * `outline` (a border), `elevated` (a shadow) or `filled` (a surface color,
   * no border).
   * @default 'outline'
   */
  variant?: 'outline' | 'elevated' | 'filled'
  /** Inner spacing; CardMedia bleeds through it. Default: 4, or 5 from `md`. */
  padding?: Responsive<SpaceValue>
  /**
   * Hover and press feedback, for cards that are one big link or button. Put
   * the link on the card with `asChild`.
   */
  interactive?: boolean
}

const PADDING: ResponsiveConfig = {
  block: 'greese-Card',
  prop: 'padding',
  isToken: neverToken,
  toCss: spaceToCss,
}

/**
 * A surface that groups related content. Lay out its contents with Stack.
 *
 * ```tsx
 * <Card>
 *   <CardMedia><img src={cover} alt="" /></CardMedia>
 *   <Stack gap={2}><Heading level={3}>Title</Heading><Text>…</Text></Stack>
 * </Card>
 * ```
 */
export const Card = ({
  variant = 'outline',
  padding,
  interactive,
  className,
  style,
  ...props
}: CardProps): JSX.Element => {
  const resolved = resolveResponsive([[padding, PADDING]], {
    className: cx(
      'greese-Card',
      `greese-Card--${variant}`,
      interactive && 'greese-Card--interactive',
      className
    ),
    style,
  })
  return <Box {...props} className={resolved.className} style={resolved.style} />
}

/**
 * Media that runs edge to edge in a Card, ignoring its padding. As the first
 * child it also takes the card's top corners.
 */
export const CardMedia = ({ greese, className, ...props }: BoxProps): JSX.Element =>
  withGreese(<Box {...props} className={cx('greese-CardMedia', className)} />, greese)
