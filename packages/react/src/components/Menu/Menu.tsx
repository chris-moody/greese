'use client'
import {
  createContext,
  isValidElement,
  use,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type JSX,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ToggleEvent,
} from 'react'
import { useAnchoredPopover, type Placement } from '../../utils/anchor.ts'
import { cx } from '../../utils/cx.ts'
import { composeRefs, Slot } from '../Slot/Slot.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'
import type { BrandTone } from '../../utils/tone.ts'

const MenuContext = createContext<{ close: () => void } | null>(null)

export interface MenuProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'div'>, 'popover' | 'onToggle'> {
  /** The menu button: usually a Button. */
  trigger: ReactElement
  /**
   * Where the menu opens relative to its trigger. It flips if there's no room.
   * @default 'bottom-start'
   */
  placement?: Placement
  /** Called with the new state when the menu opens or closes. */
  onOpenChange?: (open: boolean) => void
}

const items = (menu: HTMLElement) =>
  Array.from(
    menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')
  )

/**
 * A menu button, per the WAI-ARIA pattern: the trigger opens a list of
 * actions; arrows, Home/End and type-ahead move between them; Enter selects;
 * Escape or Tab closes and returns focus. Built on the Popover API.
 *
 * ```tsx
 * <Menu trigger={<Button variant="outline">Actions</Button>}>
 *   <MenuItem onSelect={rename}>Rename</MenuItem>
 *   <MenuSeparator />
 *   <MenuItem tone="negative" onSelect={remove}>Delete</MenuItem>
 * </Menu>
 * ```
 */
export const Menu = ({
  greese,
  trigger,
  placement = 'bottom-start',
  onOpenChange,
  className,
  style,
  ref,
  onKeyDown,
  ...props
}: MenuProps): JSX.Element => {
  const generated = useId()
  const triggerId =
    (isValidElement<{ id?: string }>(trigger) && trigger.props.id) ||
    `${generated}-trigger`
  const menuId = `${generated}-menu`
  const menu = useRef<HTMLDivElement>(null)
  const focusLast = useRef(false)
  const [open, setOpen] = useState(false)
  const anchor = useAnchoredPopover(placement)

  const close = () => menu.current?.hidePopover()

  const openWith = (last: boolean) => {
    focusLast.current = last
    menu.current?.showPopover()
  }

  const onMenuKey = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    const list = items(event.currentTarget)
    const at = list.indexOf(document.activeElement as HTMLElement)
    const focus = (i: number) => list[(i + list.length) % list.length]?.focus()

    if (event.key === 'ArrowDown') focus(at + 1)
    else if (event.key === 'ArrowUp') focus(at - 1)
    else if (event.key === 'Home') focus(0)
    else if (event.key === 'End') focus(list.length - 1)
    else if (event.key === 'Tab') return close()
    else if (event.key.length === 1 && /\S/.test(event.key)) {
      // Type-ahead: next item starting with the typed character.
      const key = event.key.toLowerCase()
      const order = [...list.slice(at + 1), ...list.slice(0, at + 1)]
      order
        .find((item) => item.textContent?.trim().toLowerCase().startsWith(key))
        ?.focus()
    } else return
    event.preventDefault()
  }

  return withGreese(
    <MenuContext value={{ close }}>
      <Slot
        ref={anchor.triggerRef}
        id={triggerId}
        popoverTarget={menuId}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        style={anchor.anchorStyle}
        onKeyDown={(event: KeyboardEvent) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            openWith(event.key === 'ArrowUp')
          }
        }}
      >
        {trigger}
      </Slot>
      <div
        {...props}
        id={menuId}
        ref={composeRefs<HTMLDivElement>(menu, anchor.floatingRef, ref)}
        popover="auto"
        role="menu"
        aria-labelledby={triggerId}
        className={cx('greese-Menu', className)}
        style={{ ...anchor.floatingStyle, ...style }}
        onKeyDown={onMenuKey}
        onToggle={(event: ToggleEvent<HTMLDivElement>) => {
          const isOpen = event.newState === 'open'
          setOpen(isOpen)
          onOpenChange?.(isOpen)
          if (isOpen) {
            const list = items(event.currentTarget)
            ;(focusLast.current ? list.at(-1) : list[0])?.focus()
            focusLast.current = false
          }
        }}
      />
    </MenuContext>,
    greese
  )
}

export interface MenuItemProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'button'>, 'onSelect'> {
  /** Called when chosen by click, Enter or Space; the menu then closes. */
  onSelect?: () => void
  /**
   * The item's color: `negative` for destructive actions, or a brand color
   * (primary, secondary, tertiary) to set one apart.
   * @default 'neutral'
   */
  tone?: 'neutral' | BrandTone | 'negative'
  /** Render a link (`<a>`, a router Link) as the item. */
  asChild?: boolean
}

/** One action in a Menu. Disabled items stay visible but are skipped by the keyboard. */
export const MenuItem = ({
  greese,
  onSelect,
  tone = 'neutral',
  asChild,
  disabled,
  className,
  onClick,
  ...props
}: MenuItemProps): JSX.Element => {
  const menu = use(MenuContext)
  const Root = (asChild ? Slot : 'button') as typeof Slot
  return withGreese(
    <Root
      {...(!asChild && { type: 'button' })}
      {...props}
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      className={cx(
        'greese-MenuItem',
        tone === 'negative' && 'greese-MenuItem--negative',
        className
      )}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        if (disabled) {
          event.preventDefault()
          return
        }
        onClick?.(event)
        if (event.defaultPrevented) return
        onSelect?.()
        menu?.close()
      }}
    />,
    greese
  )
}

/** A divider between groups of menu items. */
export const MenuSeparator = ({
  greese,
  className,
  ...props
}: ComponentPropsWithRef<'div'> & GreeseProps): JSX.Element =>
  withGreese(
    <div role="separator" {...props} className={cx('greese-MenuSeparator', className)} />,
    greese
  )
