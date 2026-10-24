'use client'
import {
  createContext,
  use,
  useId,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithRef,
  type JSX,
  type MouseEvent,
  type ReactNode,
  type ToggleEvent,
} from 'react'
import { useControllableState } from '../../hooks/useControllableState.ts'
import { useAnchoredPopover } from '../../utils/anchor.ts'
import { cx } from '../../utils/cx.ts'
import { PlusIcon } from '@greese/icons'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'
import { composeRefs } from '../Slot/Slot.tsx'

const CloseContext = createContext<() => void>(() => {})

export interface SpeedDialProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'div'>, 'popover' | 'onToggle'> {
  /** The main button's accessible name ("Create"). */
  label: string
  /** The main button's icon. Turns 45° while open. @default a plus */
  icon?: ReactNode
  /** Whether the actions are showing, when you control it. Pair with `onOpenChange`. */
  open?: boolean
  /** Whether it starts open, when it keeps its own state. */
  defaultOpen?: boolean
  /**
   * Called with the new state when it opens or closes (the button, an action,
   * Escape, a click outside).
   */
  onOpenChange?: (open: boolean) => void
  /**
   * `fixed` floats it in the bottom inline-end corner, clear of the home
   * indicator; `static` leaves it in the flow. @default 'fixed'
   */
  position?: 'fixed' | 'static'
  /** The actions: SpeedDialAction elements. */
  children: ReactNode
}

/**
 * A floating action button that opens a short stack of related actions
 * (FAB, speed dial). The stack is a native popover: Escape and a click
 * outside close it, and Tab moves from the button into the actions.
 *
 * ```tsx
 * <SpeedDial label="Create">
 *   <SpeedDialAction label="Document" icon={<DocIcon />} onClick={newDoc} />
 *   <SpeedDialAction label="Folder" icon={<FolderIcon />} onClick={newFolder} />
 * </SpeedDial>
 * ```
 */
export const SpeedDial = ({
  greese,
  label,
  icon = <PlusIcon />,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  position = 'fixed',
  className,
  style,
  children,
  ref,
  ...props
}: SpeedDialProps): JSX.Element => {
  const id = useId()
  const actions = useRef<HTMLDivElement>(null)
  const anchor = useAnchoredPopover('top-end', 12)
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })

  useLayoutEffect(() => {
    const el = actions.current
    if (!el) return
    const shown = el.matches(':popover-open')
    if (open && !shown) el.showPopover()
    if (!open && shown) el.hidePopover()
  }, [open])

  return withGreese(
    <div
      {...props}
      ref={ref}
      className={cx('greese-SpeedDial', `greese-SpeedDial--${position}`, className)}
      style={style}
    >
      <button
        ref={anchor.triggerRef}
        type="button"
        className="greese-SpeedDial-trigger"
        aria-label={label}
        aria-expanded={open}
        popoverTarget={id}
        style={anchor.anchorStyle}
      >
        <span className="greese-SpeedDial-icon" aria-hidden="true">
          {icon}
        </span>
      </button>
      <div
        id={id}
        ref={composeRefs<HTMLDivElement>(actions, anchor.floatingRef)}
        popover="auto"
        role="group"
        aria-label={label}
        className="greese-SpeedDial-actions"
        style={anchor.floatingStyle}
        onToggle={(event: ToggleEvent<HTMLDivElement>) =>
          setOpen(event.newState === 'open')
        }
      >
        <CloseContext value={() => setOpen(false)}>{children}</CloseContext>
      </div>
    </div>,
    greese
  )
}

export interface SpeedDialActionProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'button'>, 'children'> {
  /** Shown beside the icon, and its accessible name. */
  label: string
  /** The icon in the round button. Decorative: `label` names the action. */
  icon: ReactNode
}

/** One action in a SpeedDial. Choosing it closes the dial. */
export const SpeedDialAction = ({
  greese,
  label,
  icon,
  className,
  onClick,
  ...props
}: SpeedDialActionProps): JSX.Element => {
  const close = use(CloseContext)
  return withGreese(
    <button
      type="button"
      {...props}
      className={cx('greese-SpeedDialAction', className)}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (!event.defaultPrevented) close()
      }}
    >
      <span className="greese-SpeedDialAction-label">{label}</span>
      <span className="greese-SpeedDialAction-icon" aria-hidden="true">
        {icon}
      </span>
    </button>,
    greese
  )
}
