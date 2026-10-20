import type { ComponentPropsWithoutRef, JSX, Ref } from 'react'
import type { TypeVariant } from '@greese/ui'
import { cx } from '../../utils/cx.ts'
import {
  resolveResponsive,
  type Responsive,
  type ResponsiveConfig,
} from '../../utils/responsive.ts'
import { Slot } from '../Slot/Slot.tsx'
import type { FontSize, TextTone } from '../Text/Text.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface HeadingProps extends ComponentPropsWithoutRef<'h2'>, GreeseProps {
  /** The rendered heading element (or your element, with `asChild`). */
  ref?: Ref<HTMLHeadingElement>
  /** Document outline level: renders `<h1>`–`<h6>`. @default 2 */
  level?: HeadingLevel
  /**
   * A named text style from the theme's type system, independent of level:
   * `<Heading level={2} variant="h4">` is an `<h2>` that looks like an `h4`.
   * It sets size, weight, letter spacing and line height for every breakpoint,
   * and `size` is then ignored. Without one, the level's default look applies.
   */
  variant?: TypeVariant
  /**
   * Visual size, independent of level. Defaults step up at `md`, so headings
   * are smaller on phones (level 1: 3xl → 4xl). Ignored with a `variant`.
   */
  size?: Responsive<FontSize>
  /** Text color: neutral, muted, accent, positive, negative, warning or info. */
  tone?: TextTone
  /** Render your own element (e.g. a heading inside a `<summary>`) with heading styles. */
  asChild?: boolean
}

const SIZE: ResponsiveConfig = { block: 'greese-Heading', prop: 'size' }

/**
 * A heading whose `level` sets the document outline and whose `size` sets the
 * look, so the two never have to fight. Long headings wrap balanced.
 */
export const Heading = ({
  greese,
  level = 2,
  variant,
  size,
  tone,
  asChild,
  className,
  style,
  ...props
}: HeadingProps): JSX.Element => {
  const resolved = resolveResponsive([[variant ? undefined : size, SIZE]], {
    className: cx(
      'greese-Heading',
      variant ? `greese-Type--${variant}` : `greese-Heading--level-${level}`,
      tone && `greese-Text--${tone}`,
      className
    ),
    style,
  })
  const Root = (asChild ? Slot : `h${level}`) as typeof Slot
  return withGreese(
    <Root {...props} className={resolved.className} style={resolved.style} />,
    greese
  )
}
