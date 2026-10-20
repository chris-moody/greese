import type { ComponentPropsWithoutRef, JSX, Ref } from 'react'
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
   * Visual size, independent of level. Defaults step up at `md`, so headings
   * are smaller on phones (level 1: 3xl → 4xl).
   */
  size?: Responsive<FontSize>
  /** Text colour: neutral, muted, accent, positive, negative, warning or info. */
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
  size,
  tone,
  asChild,
  className,
  style,
  ...props
}: HeadingProps): JSX.Element => {
  const resolved = resolveResponsive([[size, SIZE]], {
    className: cx(
      'greese-Heading',
      `greese-Heading--level-${level}`,
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
