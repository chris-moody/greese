'use client'
import {
  useEffect,
  useRef,
  type ComponentPropsWithRef,
  type JSX,
  type KeyboardEvent,
  type ToggleEvent,
} from 'react'
import { useAnchoredPopover, type Placement } from '../../utils/anchor.ts'
import { cx } from '../../utils/cx.ts'
import { composeRefs } from '../Slot/Slot.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'
import { MenuContext } from './menuContext.ts'
import { menuItems, moveMenuFocus } from './menuKeys.ts'

/** Viewport coordinates a context menu opens at. */
export interface ContextMenuPoint {
  top: number
  left: number
}

export interface ContextMenuProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'div'>, 'popover' | 'onToggle'> {
  /**
   * What to anchor to, which is also whether it is open: viewport coordinates
   * (a `contextmenu` event's `clientY`/`clientX`) for a menu at the pointer,
   * an element to hang a submenu off, or `null` for closed.
   */
  anchor?: ContextMenuPoint | HTMLElement | null
  /**
   * Called when it closes itself — Escape, a click outside, or an item chosen.
   * Set `anchor` back to `null` in response; a context menu's open state
   * belongs to whatever decided to open it.
   */
  onClose?: () => void
  /**
   * Where it opens relative to the anchor. It flips if there's no room.
   * @default 'bottom-start'
   */
  placement?: Placement
  /** MenuItems and MenuSeparators. */
  children?: ComponentPropsWithRef<'div'>['children']
}

const isPoint = (anchor: ContextMenuProps['anchor']): anchor is ContextMenuPoint =>
  anchor !== null && anchor !== undefined && !(anchor instanceof HTMLElement)

/**
 * A menu opened at the pointer, or hung off an element as a submenu.
 *
 * Menu is a menu *button*: it owns a trigger and its own open state. A context
 * menu is the other shape — a right-click, a long-press or a parent item
 * decides when and where it opens — so this takes the anchor and the open
 * state as one prop and leaves the deciding to the caller. The items, the
 * keyboard behaviour and the surface are Menu's.
 *
 * It is a popover, so it sits in the top layer above any dialog or panel,
 * light-dismisses, and closes on Escape. Focus moves to the first item on
 * open and returns to where it was on close.
 *
 * ```tsx
 * const [at, setAt] = useState<ContextMenuPoint | null>(null)
 *
 * <div onContextMenu={(e) => { e.preventDefault(); setAt({ top: e.clientY, left: e.clientX }) }}>
 *   Right-click me
 * </div>
 * <ContextMenu anchor={at} onClose={() => setAt(null)}>
 *   <MenuItem onSelect={rename}>Rename</MenuItem>
 *   <MenuSeparator />
 *   <MenuItem tone="negative" onSelect={remove}>Delete</MenuItem>
 * </ContextMenu>
 * ```
 */
export const ContextMenu = ({
  greese,
  anchor = null,
  onClose,
  placement = 'bottom-start',
  className,
  style,
  ref,
  onKeyDown,
  children,
  ...props
}: ContextMenuProps): JSX.Element => {
  const menu = useRef<HTMLDivElement>(null)
  const point = useRef<HTMLSpanElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)
  const positioned = useAnchoredPopover(placement)
  const open = anchor !== null
  const at = isPoint(anchor) ? anchor : null

  // The anchor is either the caller's element or the zero-size span standing
  // in for the pointer position. Telling the hook which is the only thing
  // point-anchoring needs; everything after it is shared.
  const { triggerRef } = positioned
  useEffect(() => {
    triggerRef(isPoint(anchor) ? point.current : anchor)
  }, [triggerRef, anchor])

  /*
   * Shown and hidden from `anchor`, because the caller owns that state. Both
   * popover methods throw when the popover is already in the state asked for,
   * hence the checks.
   */
  useEffect(() => {
    const element = menu.current
    if (!element) return
    const showing = element.matches(':popover-open')
    if (open && !showing) {
      returnTo.current = document.activeElement as HTMLElement | null
      element.showPopover()
    } else if (!open && showing) {
      element.hidePopover()
    }
  }, [open, anchor])

  const close = () => menu.current?.hidePopover()

  const onMenuKey = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (!event.defaultPrevented) moveMenuFocus(event, close)
  }

  return withGreese(
    <MenuContext value={{ close }}>
      {/*
        The pointer position, as an anchor: zero-size and inert, it exists only
        so the menu has a box to be positioned against. Rendered while closed
        too, so it is attached before the menu is shown.
      */}
      {!(anchor instanceof HTMLElement) && (
        <span
          ref={point}
          aria-hidden
          className="greese-ContextMenu-point"
          style={{
            top: at?.top ?? 0,
            left: at?.left ?? 0,
            ...positioned.anchorStyle,
          }}
        />
      )}
      <div
        {...props}
        ref={composeRefs<HTMLDivElement>(menu, positioned.floatingRef, ref)}
        popover="auto"
        role="menu"
        className={cx('greese-Menu', 'greese-ContextMenu', className)}
        style={{ ...positioned.floatingStyle, ...style }}
        onKeyDown={onMenuKey}
        onToggle={(event: ToggleEvent<HTMLDivElement>) => {
          if (event.newState === 'open') {
            menuItems(event.currentTarget)[0]?.focus()
            return
          }
          // Closed. Either the caller asked for it, or the browser did —
          // Escape, or a click outside — and then the caller needs telling.
          returnTo.current?.focus()
          returnTo.current = null
          if (open) onClose?.()
        }}
      >
        {/* The items scroll in here, not the menu: same reason as Menu's. */}
        <div role="none" className="greese-Menu-viewport">
          {children}
        </div>
      </div>
    </MenuContext>,
    greese
  )
}
