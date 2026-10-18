'use client'
import {
  useId,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithRef,
  type JSX,
  type ReactElement,
  type ToggleEvent,
} from 'react'
import { useControllableState } from '../../hooks/useControllableState.ts'
import { useAnchoredPopover, type Placement } from '../../utils/anchor.ts'
import { cx } from '../../utils/cx.ts'
import { composeRefs, Slot } from '../Slot/Slot.tsx'

export interface PopoverProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'popover' | 'onToggle'
> {
  /** The element that toggles it: usually a Button. */
  trigger: ReactElement
  /** @default 'bottom-start' */
  placement?: Placement
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Accessible name for the popover, if its content has no heading. */
  label?: string
}

/**
 * Non-modal floating content anchored to a trigger, on the native Popover
 * API: top layer, click-outside and Escape to close, and Tab order that flows
 * from the trigger into the content. Positioned by CSS anchor positioning.
 */
export const Popover = ({
  trigger,
  placement = 'bottom-start',
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  label,
  className,
  style,
  ref,
  ...props
}: PopoverProps): JSX.Element => {
  const id = useId()
  const popover = useRef<HTMLDivElement>(null)
  const anchor = useAnchoredPopover(placement)
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })

  useLayoutEffect(() => {
    const el = popover.current
    if (!el) return
    const shown = el.matches(':popover-open')
    if (open && !shown) el.showPopover()
    if (!open && shown) el.hidePopover()
  }, [open])

  return (
    <>
      <Slot
        ref={anchor.triggerRef}
        popoverTarget={id}
        aria-expanded={open}
        aria-haspopup="dialog"
        style={anchor.anchorStyle}
      >
        {trigger}
      </Slot>
      <div
        {...props}
        id={id}
        ref={composeRefs<HTMLDivElement>(popover, anchor.floatingRef, ref)}
        popover="auto"
        role="dialog"
        aria-label={label}
        className={cx('greese-Popover', className)}
        style={{ ...anchor.floatingStyle, ...style }}
        onToggle={(event: ToggleEvent<HTMLDivElement>) =>
          setOpen(event.newState === 'open')
        }
      />
    </>
  )
}
