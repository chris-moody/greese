import type { ComponentPropsWithoutRef, JSX, Ref } from 'react'
import type { TypeVariant } from '@greese/ui'
import { cx } from '../../utils/cx.ts'
import { Slot } from '../Slot/Slot.tsx'
import type { TextTone } from '../Text/Text.tsx'
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
   * It sets size, weight, letter spacing and line height for every breakpoint.
   * @default the style of the level: `h1` for level 1, `h2` for level 2…
   */
  variant?: TypeVariant
  /** Text color: neutral, muted, accent, positive, negative, warning or info. */
  tone?: TextTone
  /** Render your own element (e.g. a heading inside a `<summary>`) with heading styles. */
  asChild?: boolean
}

/**
 * A heading whose `level` sets the document outline and whose `variant` sets
 * the look (the level's own style by default), so the two never have to fight.
 *
 * ```tsx
 * <Heading level={2} variant="h4">Billing</Heading>
 * ```
 */
export const Heading = ({
  greese,
  level = 2,
  variant = `h${level}`,
  tone,
  asChild,
  className,
  ...props
}: HeadingProps): JSX.Element => {
  const Root = (asChild ? Slot : `h${level}`) as typeof Slot
  return withGreese(
    <Root
      {...props}
      className={cx(
        'greese-Heading',
        `greese-Type--${variant}`,
        tone && `greese-Text--${tone}`,
        className
      )}
    />,
    greese
  )
}
