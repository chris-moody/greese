'use client'
import {
  useId,
  useCallback,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithRef,
  type JSX,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type RefCallback,
  type SyntheticEvent,
} from 'react'
import { useControllableState } from '../../hooks/useControllableState.ts'
import { cx } from '../../utils/cx.ts'
import { CloseIcon } from '@greese/icons'
import {
  resolveResponsive,
  type Responsive,
  type ResponsiveConfig,
} from '../../utils/responsive.ts'
import { IconButton } from '../IconButton/IconButton.tsx'
import { composeRefs, Slot } from '../Slot/Slot.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'
import type { ControlSize } from '../Button/Button.tsx'

interface ModalBaseProps extends Omit<ComponentPropsWithRef<'dialog'>, 'title' | 'open'> {
  /** Controlled open state. */
  open?: boolean
  /** Whether it starts open, when it keeps its own state. */
  defaultOpen?: boolean
  /**
   * Called with the new state when it opens or closes (Escape, the close button,
   * a backdrop click).
   */
  onOpenChange?: (open: boolean) => void
  /** An element (usually a Button) that opens it on click. */
  trigger?: ReactElement
  /** Required: names the dialog for assistive tech. */
  title: ReactNode
  /** Visually hide the title, keeping it as the accessible name. */
  hideTitle?: boolean
  /** A line under the title, announced when it opens. */
  description?: ReactNode
  /** Actions row, e.g. Cancel / Confirm buttons. */
  footer?: ReactNode
  /** Accessible name of the close button. @default 'Close' */
  closeLabel?: string
  /**
   * Drop the close button. Only for a dialog that is dismissed some other
   * visible way — a navigation drawer with its own toggle, say. Escape, a
   * click outside and (for a Drawer) a swipe still close it, but none of
   * those is discoverable on its own, so a dialog that asks something keeps
   * its button. @default false
   */
  hideClose?: boolean
}

const supportsClosedBy = () =>
  typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype

/**
 * Internal: the native `<dialog>` + `showModal()` behaviour behind Dialog and
 * Drawer. The browser provides the focus trap, the inert background, Escape,
 * the top layer and returning focus to the trigger on close.
 */
const ModalBase = ({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  trigger,
  title,
  hideTitle,
  description,
  footer,
  closeLabel = 'Close',
  hideClose = false,
  className,
  children,
  ref,
  onCancel,
  onClose,
  onClick,
  ...props
}: ModalBaseProps): JSX.Element => {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })
  const dialog = useRef<HTMLDialogElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)
  const id = useId()

  useLayoutEffect(() => {
    const el = dialog.current
    if (!el) return
    if (open && !el.open) {
      // Remember who opened it. Safari doesn't focus buttons on click, so the
      // trigger is recorded on click; otherwise whatever has focus.
      if (!returnTo.current && document.activeElement !== document.body) {
        returnTo.current = document.activeElement as HTMLElement | null
      }
      // The scroll lock (Dialog.scss) removes the page scrollbar so the
      // backdrop and edge drawers reach the screen edge; pad by its width so
      // the page doesn't shift. Measured before the first modal locks.
      const root = document.documentElement
      if (!document.querySelector('.greese-Dialog:modal')) {
        root.style.setProperty(
          '--greese-scrollbar-gap',
          `${innerWidth - root.clientWidth}px`
        )
      }
      el.showModal()
    }
    if (!open && el.open) el.close()
  }, [open])

  return (
    <>
      {trigger && (
        <Slot
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={(event: MouseEvent<HTMLElement>) => {
            returnTo.current = event.currentTarget
            setOpen(true)
          }}
        >
          {trigger}
        </Slot>
      )}
      <dialog
        {...props}
        ref={composeRefs(dialog, ref)}
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-description` : undefined}
        closedby="any"
        className={className}
        onCancel={onCancel}
        onClose={(event: SyntheticEvent<HTMLDialogElement>) => {
          onClose?.(event)
          setOpen(false)
          // Browsers restore focus natively, except where the opener never had
          // focus (Safari, after a click), and WebKit still has focus inside
          // the closed dialog when this fires. Restore in those cases only;
          // never steal focus that has already moved on.
          const target = returnTo.current
          returnTo.current = null
          const active = document.activeElement
          const stranded =
            !active || active === document.body || event.currentTarget.contains(active)
          if (target?.isConnected && stranded) target.focus({ preventScroll: true })
        }}
        onClick={(event: MouseEvent<HTMLDialogElement>) => {
          onClick?.(event)
          // Backdrop clicks for browsers without `closedby` (they land on the
          // dialog element itself, outside its box).
          if (supportsClosedBy() || event.target !== event.currentTarget) return
          const box = event.currentTarget.getBoundingClientRect()
          const inside =
            event.clientX >= box.left &&
            event.clientX <= box.right &&
            event.clientY >= box.top &&
            event.clientY <= box.bottom
          if (!inside) setOpen(false)
        }}
      >
        <div className="greese-Dialog-header">
          <h2
            id={`${id}-title`}
            className={cx('greese-Dialog-title', hideTitle && 'greese-VisuallyHidden')}
          >
            {title}
          </h2>
          {!hideClose && (
            <IconButton
              label={closeLabel}
              size="sm"
              className="greese-Dialog-close"
              onClick={() => setOpen(false)}
            >
              <CloseIcon />
            </IconButton>
          )}
        </div>
        {description && (
          <p id={`${id}-description`} className="greese-Dialog-description">
            {description}
          </p>
        )}
        <div className="greese-Dialog-body">{children}</div>
        {footer && <div className="greese-Dialog-footer">{footer}</div>}
      </dialog>
    </>
  )
}

export interface DialogProps extends GreeseProps, ModalBaseProps {
  /** Maximum width. `full` fills the viewport on every screen. @default 'md' */
  size?: ControlSize | 'full'
}

/**
 * A modal dialog on native `<dialog>`: focus is trapped and returned, the page
 * behind is inert and stops scrolling (CSS only), Escape and backdrop clicks
 * dismiss. Its body scrolls when content is tall.
 *
 * ```tsx
 * <Dialog
 *   trigger={<Button>Delete project</Button>}
 *   title="Delete project?"
 *   description="This can't be undone."
 *   footer={<Button tone="negative" onClick={remove}>Delete</Button>}
 * />
 * ```
 */
export const Dialog = ({
  greese,
  size = 'md',
  className,
  ...props
}: DialogProps): JSX.Element =>
  withGreese(
    <ModalBase
      {...props}
      className={cx('greese-Dialog', `greese-Dialog--size-${size}`, className)}
    />,
    greese
  )

export type DrawerPlacement = 'start' | 'end' | 'top' | 'bottom'

export interface DrawerProps extends GreeseProps, ModalBaseProps {
  /**
   * The edge it slides from, per breakpoint if needed, e.g. a bottom sheet on
   * phones and a side panel from `md`: `{ xs: 'bottom', md: 'end' }`.
   * @default 'end'
   */
  placement?: Responsive<DrawerPlacement>
  /**
   * Drag the header (or a bottom sheet's handle) toward the edge to dismiss.
   * @default true
   */
  swipeToClose?: boolean
}

const PLACEMENT: ResponsiveConfig = { block: 'greese-Drawer', prop: 'placement' }

/**
 * A panel that slides in from an edge: the same native modal behaviour as
 * Dialog. Bottom placement is a mobile sheet, padded for the home indicator.
 */
export const Drawer = ({
  greese,
  placement = 'end',
  swipeToClose = true,
  className,
  style,
  ref,
  ...props
}: DrawerProps): JSX.Element => {
  const swipe = useSwipeToClose(swipeToClose)
  const resolved = resolveResponsive([[placement, PLACEMENT]], {
    className: cx('greese-Dialog', 'greese-Drawer', className),
    style,
  })
  return withGreese(
    <ModalBase
      {...props}
      ref={composeRefs<HTMLDialogElement>(swipe, ref)}
      className={resolved.className}
      style={resolved.style}
    />,
    greese
  )
}

type Edge = 'top' | 'bottom' | 'start' | 'end'

/** Which way a drag dismisses, given the edge the drawer is on. */
export const dismissDirection = (
  edge: string,
  rtl: boolean
): { axis: 'x' | 'y'; sign: 1 | -1 } | null => {
  switch (edge as Edge) {
    case 'bottom':
      return { axis: 'y', sign: 1 }
    case 'top':
      return { axis: 'y', sign: -1 }
    case 'end':
      return { axis: 'x', sign: rtl ? -1 : 1 }
    case 'start':
      return { axis: 'x', sign: rtl ? 1 : -1 }
    default:
      return null
  }
}

/** Should a drag of `distance` px over `ms` close a drawer `size` px deep? */
export const shouldDismiss = (distance: number, size: number, ms: number): boolean =>
  distance > size * 0.3 || (distance > 20 && distance / Math.max(ms, 1) > 0.5)

/**
 * Drag the header (or the sheet's handle) toward the edge to dismiss. The
 * edge comes from CSS (`--greese-drawer-edge`), so it follows a responsive
 * placement. Drags never start on the body, which keeps scrolling content.
 */
const useSwipeToClose = (enabled: boolean): RefCallback<HTMLDialogElement> =>
  useCallback(
    (dialog: HTMLDialogElement | null) => {
      if (!dialog || !enabled) return
      let drag: {
        id: number
        x: number
        y: number
        time: number
        axis: 'x' | 'y'
        sign: 1 | -1
        size: number
        distance: number
      } | null = null

      const reset = () => {
        dialog.style.transition = ''
        dialog.style.translate = ''
      }

      const down = (event: PointerEvent) => {
        const target = event.target as Element
        if (
          !target.closest('.greese-Dialog-header') ||
          target.closest('button, a, input, select, textarea')
        )
          return
        const styles = getComputedStyle(dialog)
        const direction = dismissDirection(
          styles.getPropertyValue('--greese-drawer-edge').trim(),
          styles.direction === 'rtl'
        )
        if (!direction) return
        const box = dialog.getBoundingClientRect()
        drag = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          time: event.timeStamp,
          ...direction,
          size: direction.axis === 'y' ? box.height : box.width,
          distance: 0,
        }
        dialog.setPointerCapture(event.pointerId)
      }

      const move = (event: PointerEvent) => {
        if (!drag || event.pointerId !== drag.id) return
        const raw = drag.axis === 'y' ? event.clientY - drag.y : event.clientX - drag.x
        drag.distance = Math.max(0, raw * drag.sign)
        const offset = `${drag.distance * drag.sign}px`
        dialog.style.transition = 'none'
        dialog.style.translate = drag.axis === 'y' ? `0 ${offset}` : `${offset} 0`
      }

      const up = (event: PointerEvent) => {
        if (!drag || event.pointerId !== drag.id) return
        const { distance, size, time } = drag
        drag = null
        dialog.style.transition = ''
        // Close first, then drop the inline offset: the exit transition then
        // continues from where the finger let go.
        if (
          event.type === 'pointerup' &&
          shouldDismiss(distance, size, event.timeStamp - time)
        ) {
          dialog.close()
        }
        dialog.style.translate = ''
      }

      dialog.addEventListener('pointerdown', down)
      dialog.addEventListener('pointermove', move)
      dialog.addEventListener('pointerup', up)
      dialog.addEventListener('pointercancel', up)
      return () => {
        dialog.removeEventListener('pointerdown', down)
        dialog.removeEventListener('pointermove', move)
        dialog.removeEventListener('pointerup', up)
        dialog.removeEventListener('pointercancel', up)
        reset()
      }
    },
    [enabled]
  )
