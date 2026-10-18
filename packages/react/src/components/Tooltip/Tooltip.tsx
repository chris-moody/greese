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

export interface TooltipProps {
  /** The tooltip text: supplementary, never essential (touch users won't see it). */
  content: ReactNode
  /** The element it describes: must be focusable (a Button, a link). */
  children: ReactElement
  /** @default 'top' */
  placement?: Placement
  /** Hover delay before showing, ms. Keyboard focus shows it at once. @default 400 */
  delay?: number
  className?: string
}

/**
 * A short description shown on hover (mouse) or keyboard focus, linked with
 * `aria-describedby`. Meets WCAG 1.4.13: it can be hovered without
 * disappearing and dismissed with Escape without moving focus.
 *
 * For icon-only buttons, the name still comes from the button's own label;
 * the tooltip adds a visible hint for sighted mouse users.
 */
export const Tooltip = ({
  content,
  children,
  placement = 'top',
  delay = 400,
  className,
}: TooltipProps): JSX.Element => {
  const id = useId()
  const tip = useRef<HTMLDivElement>(null)
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

  // Escape dismisses from anywhere, without moving focus.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hide()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      clearTimeout(timer.current)
    }
  })

  return (
    <>
      <Slot
        ref={anchor.triggerRef}
        aria-describedby={id}
        style={anchor.anchorStyle}
        onPointerEnter={(event: PointerEvent) =>
          event.pointerType === 'mouse' && show(delay)
        }
        onPointerLeave={() => hide(100)}
        onFocus={(event: FocusEvent<HTMLElement>) => {
          if (event.currentTarget.matches(':focus-visible')) show()
        }}
        onBlur={() => hide()}
      >
        {children}
      </Slot>
      <div
        id={id}
        ref={composeRefs<HTMLDivElement>(tip, anchor.floatingRef)}
        popover="manual"
        role="tooltip"
        className={cx('greese-Tooltip', className)}
        style={anchor.floatingStyle}
        onPointerEnter={() => clearTimeout(timer.current)}
        onPointerLeave={() => hide(100)}
      >
        {content}
      </div>
    </>
  )
}
