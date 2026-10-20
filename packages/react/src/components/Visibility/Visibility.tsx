import type { JSX, ReactNode } from 'react'
import type { Breakpoint } from '@greese/ui'
import { cx } from '../../utils/cx.ts'
import { Slot } from '../Slot/Slot.tsx'

/** Breakpoints that have a lower bound (everything but `xs`). */
export type BreakpointBoundary = Exclude<Breakpoint, 'xs'>

export interface VisibilityProps {
  /** From this breakpoint upward (inclusive). */
  above?: BreakpointBoundary
  /** Below this breakpoint (exclusive). */
  below?: BreakpointBoundary
  /** Apply to your element instead of a layout-neutral wrapper. */
  asChild?: boolean
  /** Classes for the wrapper, or for your element with `asChild`. */
  className?: string
  /** What to show or hide. */
  children?: ReactNode
}

const order: BreakpointBoundary[] = ['sm', 'md', 'lg', 'xl']

const render = (
  hideBelow: BreakpointBoundary | undefined,
  hideFrom: BreakpointBoundary | undefined,
  { asChild, className, children }: VisibilityProps,
  hideBetween?: [BreakpointBoundary, BreakpointBoundary]
): JSX.Element => {
  const Root = (asChild ? Slot : 'div') as typeof Slot
  return (
    <Root
      className={cx(
        !asChild && 'greese-Visibility',
        hideBelow && `greese-Visibility--hide-below-${hideBelow}`,
        hideFrom && `greese-Visibility--hide-from-${hideFrom}`,
        hideBetween && `greese-Visibility--hide-${hideBetween[0]}-to-${hideBetween[1]}`,
        className
      )}
    >
      {children}
    </Root>
  )
}

/**
 * Renders children only within a viewport range, using CSS alone: no
 * matchMedia, no hydration mismatch, server-component safe.
 *
 * ```tsx
 * <Show above="md"><DesktopNav /></Show>
 * <Show below="md"><MobileNav /></Show>
 * ```
 *
 * Hidden content stays in the DOM (as `display: none`), so it is not rendered
 * visually or announced. To skip rendering entirely, use `useBreakpoint()`.
 */
export const Show = (props: VisibilityProps): JSX.Element =>
  render(props.above, props.below, props)

/**
 * The inverse of Show: hides children from `above` upward and/or `below` a
 * breakpoint. With both, and `above` the smaller, it hides only between them.
 */
export const Hide = (props: VisibilityProps): JSX.Element => {
  const { above, below } = props
  // A range is an intersection, which two independent hide classes (a union)
  // can't express: they would hide at every width.
  if (above && below && order.indexOf(above) < order.indexOf(below)) {
    return render(undefined, undefined, props, [above, below])
  }
  return render(below, above, props)
}
