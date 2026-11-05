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
  /**
   * Whether it is shown, when you drive it yourself: `true` keeps it up,
   * `false` turns it off entirely. Leave it out for the hover, focus and tap
   * behaviour above; setting it replaces that, so the tooltip shows exactly
   * when you say.
   */
  open?: boolean
  /**
   * Whether it describes its child (`role="tooltip"` and `aria-describedby`).
   * Turn it off when the child already exposes the same thing — a slider's
   * value is in `aria-valuetext`, so a bubble repeating it would be announced
   * twice. @default true
   */
  describe?: boolean
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
  open,
  describe = true,
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

  // Driven from outside: follow `open` and leave the interaction alone.
  // Shown and hidden directly rather than through the timer — a delay belongs
  // to hovering, and a caller that says "open" means now. The popover is told
  // on every render, not just on a change, because the element only exists
  // after the first one.
  useEffect(() => {
    if (open === undefined) return
    clearTimeout(timer.current)
    const el = tip.current
    if (!el) return
    if (open && !el.matches(':popover-open')) el.showPopover()
    if (!open && el.matches(':popover-open')) el.hidePopover()
  })

  // Escape dismisses from anywhere, without moving focus. A tap anywhere but
  // the child or the tooltip dismisses one a tap opened: a manual popover has
  // no light dismiss, and iOS doesn't focus a tapped button, so no blur hides it.
  useEffect(() => {
    // Escape would fight an `open` the caller controls.
    if (open !== undefined) return
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
        aria-describedby={describe ? id : undefined}
        style={anchor.anchorStyle}
        {...(open === undefined && {
          onPointerEnter: (event: PointerEvent) =>
            event.pointerType === 'mouse' && show(delay),
          onPointerLeave: leave,
          // A tap toggles it. A scroll that starts on the child cancels the
          // pointer rather than lifting it, so it doesn't count as a tap.
          onPointerUp: (event: PointerEvent) => {
            if (openOnTap && event.pointerType !== 'mouse')
              if (tip.current?.matches(':popover-open')) hide()
              else show()
          },
          onFocus: (event: FocusEvent<HTMLElement>) => {
            if (event.currentTarget.matches(':focus-visible')) show()
          },
          onBlur: () => hide(),
        })}
      >
        {children}
      </Slot>
      {withGreese(
        <div
          id={describe ? id : undefined}
          ref={composeRefs<HTMLDivElement>(tip, anchor.floatingRef)}
          popover="manual"
          role={describe ? 'tooltip' : 'presentation'}
          className={cx('greese-Tooltip', className)}
          style={anchor.floatingStyle}
          {...(open === undefined && {
            onPointerEnter: () => clearTimeout(timer.current),
            onPointerLeave: leave,
          })}
        >
          {content}
        </div>,
        greese
      )}
    </>
  )
}
