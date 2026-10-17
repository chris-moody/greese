import type { ComponentPropsWithoutRef, JSX, Ref } from 'react'
import { cx } from '../../utils/cx.ts'
import { resolveResponsive } from '../../utils/responsive.ts'
import { splitStyleProps, type BoxStyleProps } from '../../utils/styleProps.ts'
import { Slot } from '../Slot/Slot.tsx'

export interface BoxProps extends ComponentPropsWithoutRef<'div'>, BoxStyleProps {
  /** The `<div>`, or your element with `asChild`. */
  ref?: Ref<HTMLElement>
  /** Render your own element (a `<section>`, a router `<Link>`) instead of a `<div>`. */
  asChild?: boolean
}

/**
 * The base layout primitive: a `<div>` with typed, responsive style props.
 *
 * ```tsx
 * <Box p={{ xs: 4, md: 6 }} maxW="40rem" mx="auto" />
 * ```
 *
 * Style props resolve to classes and inline custom properties read by static
 * CSS; nothing is generated at runtime. Server-component safe.
 */
export const Box = (props: BoxProps): JSX.Element => {
  const [entries, { asChild, className, style, ...rest }] = splitStyleProps(props)
  const resolved = resolveResponsive(entries, {
    className: cx('sauce-Box', className),
    style,
  })
  // Typed as Slot: its HTMLElement ref and props fit both a <div> and asChild.
  const Root = (asChild ? Slot : 'div') as typeof Slot
  return <Root {...rest} className={resolved.className} style={resolved.style} />
}
