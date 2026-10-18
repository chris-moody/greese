import type { ComponentPropsWithRef, JSX } from 'react'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'
import { cx } from '../../utils/cx.ts'
import { Slot } from '../Slot/Slot.tsx'

export interface MotionProps extends ComponentPropsWithRef<'div'>, GreeseProps {
  /** Animate your own element instead of a wrapping `<div>`. */
  asChild?: boolean
}

/**
 * The `greese` prop for any element: wrap it, or pass it as the child with
 * `asChild`. Every GreeseUI component already accepts `greese` directly.
 *
 * ```tsx
 * <Motion greese="fade-up"><img src={hero} alt="" /></Motion>
 * <Motion asChild greese={{ hover: 'lift' }}><a href="/pricing">Pricing</a></Motion>
 * ```
 */
export const Motion = ({
  asChild,
  greese,
  className,
  ...props
}: MotionProps): JSX.Element => {
  const Root = (asChild ? Slot : 'div') as typeof Slot
  return withGreese(
    <Root {...props} className={cx('greese-Motion', className)} />,
    greese
  )
}
