import type { JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { Box, type BoxProps } from '../Box/Box.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface ContainerProps extends GreeseProps, BoxProps {
  /** Maximum width, matching the breakpoint of the same name. @default 'lg' */
  size?: ContainerSize
}

/**
 * Centres content at a readable maximum width, with gutters that grow at `md`
 * and respect notches and rounded corners (safe-area insets).
 *
 * Accepts every Box style prop (`px` overrides the gutter) and `asChild`.
 */
export const Container = ({
  greese,
  size = 'lg',
  className,
  ...props
}: ContainerProps): JSX.Element =>
  withGreese(
    <Box
      {...props}
      className={cx('greese-Container', `greese-Container--size-${size}`, className)}
    />,
    greese
  )
