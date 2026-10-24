import type { JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { Box, type BoxProps } from '../Box/Box.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface CenterProps extends GreeseProps, BoxProps {
  /** Shrink to fit content (`inline-flex`) instead of filling the line. */
  inline?: boolean
}

/**
 * Centres its children on both axes. Accepts every Box style prop and `asChild`.
 *
 * ```tsx
 * <Center style={{ minBlockSize: '20rem' }}>
 *   <Spinner label="Loading" />
 * </Center>
 * ```
 */
export const Center = ({
  greese,
  inline,
  className,
  ...props
}: CenterProps): JSX.Element =>
  withGreese(
    <Box
      {...props}
      className={cx('greese-Center', inline && 'greese-Center--inline', className)}
    />,
    greese
  )
