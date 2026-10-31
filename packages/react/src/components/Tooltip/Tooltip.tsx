'use client'
import {
  useEffect,
  useId,
  useRef,
  type FocusEvent,
  type JSX,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import { useAnchoredPopover, type Placement } from '../../utils/anchor.ts'
import { cx } from '../../utils/cx.ts'
import { composeRefs, Slot } from '../Slot/Slot.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface TooltipProps extends GreeseProps {
  /** The tooltip text: supplementary, never essential (a touch user sees it only if they tap). */
  content: ReactNode
  /** The element it describes: must be focusable (a Button, a link). */
  children: ReactElement
  /** Where it shows relative to its child. It flips if there's no room. @default 'top' */
  placement?: Placement
  /** Hover delay before showing, ms. Keyboard focus shows it at once. @default 400 */
  delay?: number
  /**
   * On touch and pen, tapping the child shows the tooltip as well as doing
   * what the child does; tapping it again, anywhere else, or Escape hides
   * it. Turn it off for a control tapped so often the hint gets in the way.
   * @default true
   */
  openOnTap?: boolean
  /** Classes for the tooltip itself (the floating text), not its child. */
  className?: string
}

/**
 * A short description shown on hover (mouse), keyboard focus or a tap (touch),
 * linked with `aria-describedby`. Meets WCAG 1.4.13: it can be hovered without
 * disappearing and dismissed with Escape without moving focus.
 *
 * For icon-only buttons, the name still comes from the button's own label;
 * the tooltip adds a visible hint for sighted mouse users.
 *
 * ```tsx
 * <Tooltip content="Copy link">
 *   <IconButton label="Copy link"><CopyIcon /></IconButton>
 * </Tooltip>
 * ```
 */
export const Tooltip = ({
  greese,
  content,
  children,
  placement = 'top',
  delay = 400,
  openOnTap = true,
  className,
}: TooltipProps): JSX.Element => {
  const id = useId()
  const tip = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const anchor = useAnchoredPopover(placement)

  const show = (after = 0) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (tip.current && !tip.current.matches(':popover-open')) tip.current.showPopover()
    }, after)
  }
  const hide = (after = 0) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (tip.current?.matches(':popover-open')) tip.current.hidePopover()
    }, after)
  }
  // A finger leaves as it lifts: only a mouse leaving hides it.
  const leave = (event: PointerEvent) => event.pointerType === 'mouse' && hide(100)

  // Escape dismisses from anywhere, without moving focus. A tap anywhere but
  // the child or the tooltip dismisses one a tap opened: a manual popover has
  // no light dismiss, and iOS doesn't focus a tapped button, so no blur hides it.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hide()
    }
    const onPointerDown = (event: globalThis.PointerEvent) => {
      const target = event.target as Node
      if (!trigger.current?.contains(target) && !tip.current?.contains(target)) hide()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
      clearTimeout(timer.current)
    }
  })

  return (
    <>
      <Slot
        ref={composeRefs<HTMLElement>(trigger, anchor.triggerRef)}
        aria-describedby={id}
        style={anchor.anchorStyle}
        onPointerEnter={(event: PointerEvent) =>
          event.pointerType === 'mouse' && show(delay)
        }
        onPointerLeave={leave}
        // A tap toggles it. A scroll that starts on the child cancels the
        // pointer rather than lifting it, so it doesn't count as a tap.
        onPointerUp={(event: PointerEvent) => {
          if (openOnTap && event.pointerType !== 'mouse')
            if (tip.current?.matches(':popover-open')) hide()
            else show()
        }}
        onFocus={(event: FocusEvent<HTMLElement>) => {
          if (event.currentTarget.matches(':focus-visible')) show()
        }}
        onBlur={() => hide()}
      >
        {children}
      </Slot>
      {withGreese(
        <div
          id={id}
          ref={composeRefs<HTMLDivElement>(tip, anchor.floatingRef)}
          popover="manual"
          role="tooltip"
          className={cx('greese-Tooltip', className)}
          style={anchor.floatingStyle}
          onPointerEnter={() => clearTimeout(timer.current)}
          onPointerLeave={leave}
        >
          {content}
        </div>,
        greese
      )}
    </>
  )
}
