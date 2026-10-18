import type { ComponentPropsWithoutRef, JSX, Ref } from 'react'
import { cx } from '../../utils/cx.ts'
import { Slot } from '../Slot/Slot.tsx'

export interface LinkProps extends ComponentPropsWithoutRef<'a'> {
  ref?: Ref<HTMLAnchorElement>
  /** @default 'accent' */
  tone?: 'accent' | 'neutral'
  /** @default 'always' */
  underline?: 'always' | 'hover'
  /** Style your router's link component: `<Link asChild><RouterLink to="/" /></Link>`. */
  asChild?: boolean
}

/** An inline text link. Underlined by default: colour alone is not enough to spot a link. */
export const Link = ({
  tone = 'accent',
  underline = 'always',
  asChild,
  className,
  ...props
}: LinkProps): JSX.Element => {
  const Root = (asChild ? Slot : 'a') as typeof Slot
  return (
    <Root
      {...props}
      className={cx(
        'greese-Link',
        `greese-Link--${tone}`,
        underline === 'hover' && 'greese-Link--underline-hover',
        className
      )}
    />
  )
}
