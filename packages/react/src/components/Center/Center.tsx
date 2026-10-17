import type { JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { Box, type BoxProps } from '../Box/Box.tsx'

export interface CenterProps extends BoxProps {
  /** Shrink to fit content (`inline-flex`) instead of filling the line. */
  inline?: boolean
}

/** Centres its children on both axes. Accepts every Box style prop and `asChild`. */
export const Center = ({ inline, className, ...props }: CenterProps): JSX.Element => (
  <Box
    {...props}
    className={cx('sauce-Center', inline && 'sauce-Center--inline', className)}
  />
)
