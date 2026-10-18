import type { JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import {
  neverToken,
  resolveResponsive,
  type Responsive,
  type ResponsiveConfig,
} from '../../utils/responsive.ts'
import { Box, type BoxProps } from '../Box/Box.tsx'

export interface AspectRatioProps extends BoxProps {
  /** Width / height, e.g. `16 / 9` or `'4 / 3'`. Per breakpoint if needed. */
  ratio: Responsive<number | string>
  /** How a direct image or video child fills the frame. @default 'cover' */
  fit?: 'cover' | 'contain'
}

const RATIO: ResponsiveConfig = {
  block: 'greese-AspectRatio',
  prop: 'ratio',
  isToken: neverToken,
}

/**
 * A media frame with a fixed aspect ratio, reserving space before the media
 * loads so the layout never shifts (no CLS).
 *
 * ```tsx
 * <AspectRatio ratio={{ xs: 1, md: 16 / 9 }}><img src={src} alt="" /></AspectRatio>
 * ```
 */
export const AspectRatio = ({
  ratio,
  fit = 'cover',
  className,
  style,
  ...props
}: AspectRatioProps): JSX.Element => {
  const resolved = resolveResponsive([[ratio, RATIO]], {
    className: cx(
      'greese-AspectRatio',
      fit === 'contain' && 'greese-AspectRatio--contain',
      className
    ),
    style,
  })
  return <Box {...props} className={resolved.className} style={resolved.style} />
}
