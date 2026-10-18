import type { ComponentPropsWithoutRef, JSX, Ref } from 'react'
import { cx } from '../../utils/cx.ts'
import {
  resolveResponsive,
  type Responsive,
  type ResponsiveConfig,
} from '../../utils/responsive.ts'
import { Slot } from '../Slot/Slot.tsx'
import type { FontSize, TextTone } from '../Text/Text.tsx'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface HeadingProps extends ComponentPropsWithoutRef<'h2'> {
  ref?: Ref<HTMLHeadingElement>
  /** Document outline level: renders `<h1>`–`<h6>`. @default 2 */
  level?: HeadingLevel
  /**
   * Visual size, independent of level. Defaults step up at `md`, so headings
   * are smaller on phones (level 1: 3xl → 4xl).
   */
  size?: Responsive<FontSize>
  tone?: TextTone
  /** Render your own element (e.g. a heading inside a `<summary>`) with heading styles. */
  asChild?: boolean
}

const SIZE: ResponsiveConfig = { block: 'sauce-Heading', prop: 'size' }

/**
 * A heading whose `level` sets the document outline and whose `size` sets the
 * look, so the two never have to fight. Long headings wrap balanced.
 */
export const Heading = ({
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
      'sauce-Heading',
      `sauce-Heading--level-${level}`,
      tone && `sauce-Text--${tone}`,
      className
    ),
    style,
  })
  const Root = (asChild ? Slot : `h${level}`) as typeof Slot
  return <Root {...props} className={resolved.className} style={resolved.style} />
}
