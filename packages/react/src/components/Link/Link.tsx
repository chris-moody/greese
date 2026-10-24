import type { ComponentPropsWithoutRef, JSX, Ref } from 'react'
import { cx } from '../../utils/cx.ts'
import { Slot } from '../Slot/Slot.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'
import type { BrandTone } from '../../utils/tone.ts'

export interface LinkProps extends GreeseProps, ComponentPropsWithoutRef<'a'> {
  /** The rendered `<a>` (or your element, with `asChild`). */
  ref?: Ref<HTMLAnchorElement>
  /**
   * `accent` for links in text; `neutral` for links that shouldn't stand out
   * (footers, lists); or a brand color (primary, secondary, tertiary).
   * @default 'primary'
   */
  tone?: BrandTone | 'neutral'
  /**
   * `always` underlined, or only on `hover`. Inline links in text should stay
   * `always`.
   * @default 'always'
   */
  underline?: 'always' | 'hover'
  /** Style your router's link component: `<Link asChild><RouterLink to="/" /></Link>`. */
  asChild?: boolean
}

/**
 * An inline text link. Underlined by default: color alone is not enough to spot a link.
 *
 * ```tsx
 * <Link href="/pricing" underline="hover">Pricing</Link>
 * ```
 */
export const Link = ({
  greese,
  tone = 'primary',
  underline = 'always',
  asChild,
  className,
  ...props
}: LinkProps): JSX.Element => {
  const Root = (asChild ? Slot : 'a') as typeof Slot
  return withGreese(
    <Root
      {...props}
      className={cx(
        'greese-Link',
        `greese-Link--${tone}`,
        underline === 'hover' && 'greese-Link--underline-hover',
        className
      )}
    />,
    greese
  )
}
