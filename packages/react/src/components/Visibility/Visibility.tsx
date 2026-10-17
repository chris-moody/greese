import type { JSX, ReactNode } from 'react'
import type { Breakpoint } from '@sauce-ui/tokens'
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
  className?: string
  children?: ReactNode
}

const render = (
  hideBelow: BreakpointBoundary | undefined,
  hideFrom: BreakpointBoundary | undefined,
  { asChild, className, children }: VisibilityProps
): JSX.Element => {
  const Root = (asChild ? Slot : 'div') as typeof Slot
  return (
    <Root
      className={cx(
        !asChild && 'sauce-Visibility',
        hideBelow && `sauce-Visibility--hide-below-${hideBelow}`,
        hideFrom && `sauce-Visibility--hide-from-${hideFrom}`,
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

/** The inverse of Show: hides children from `above` upward and/or `below` a breakpoint. */
export const Hide = (props: VisibilityProps): JSX.Element =>
  render(props.below, props.above, props)
