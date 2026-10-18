'use client'
import {
  useId,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithRef,
  type JSX,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type SyntheticEvent,
} from 'react'
import { useControllableState } from '../../hooks/useControllableState.ts'
import { cx } from '../../utils/cx.ts'
import { CloseGlyph } from '../../utils/glyphs.tsx'
import {
  resolveResponsive,
  type Responsive,
  type ResponsiveConfig,
} from '../../utils/responsive.ts'
import { IconButton } from '../IconButton/IconButton.tsx'
import { composeRefs, Slot } from '../Slot/Slot.tsx'

interface ModalBaseProps extends Omit<ComponentPropsWithRef<'dialog'>, 'title' | 'open'> {
  /** Controlled open state. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** An element (usually a Button) that opens it on click. */
  trigger?: ReactElement
  /** Required: names the dialog for assistive tech. */
  title: ReactNode
  /** Visually hide the title, keeping it as the accessible name. */
  hideTitle?: boolean
  description?: ReactNode
  /** Actions row, e.g. Cancel / Confirm buttons. */
  footer?: ReactNode
  /** @default 'Close' */
  closeLabel?: string
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
        <div className="sauce-Dialog-header">
          <h2
            id={`${id}-title`}
            className={cx('sauce-Dialog-title', hideTitle && 'sauce-VisuallyHidden')}
          >
            {title}
          </h2>
          <IconButton
            label={closeLabel}
            size="sm"
            className="sauce-Dialog-close"
            onClick={() => setOpen(false)}
          >
            <CloseGlyph />
          </IconButton>
        </div>
        {description && (
          <p id={`${id}-description`} className="sauce-Dialog-description">
            {description}
          </p>
        )}
        <div className="sauce-Dialog-body">{children}</div>
        {footer && <div className="sauce-Dialog-footer">{footer}</div>}
      </dialog>
    </>
  )
}

export interface DialogProps extends ModalBaseProps {
  /** Maximum width. `full` fills the viewport on every screen. @default 'md' */
  size?: 'sm' | 'md' | 'lg' | 'full'
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
  size = 'md',
  className,
  ...props
}: DialogProps): JSX.Element => (
  <ModalBase
    {...props}
    className={cx('sauce-Dialog', `sauce-Dialog--size-${size}`, className)}
  />
)

export type DrawerPlacement = 'start' | 'end' | 'top' | 'bottom'

export interface DrawerProps extends ModalBaseProps {
  /**
   * The edge it slides from, per breakpoint if needed, e.g. a bottom sheet on
   * phones and a side panel from `md`: `{ xs: 'bottom', md: 'end' }`.
   * @default 'end'
   */
  placement?: Responsive<DrawerPlacement>
}

const PLACEMENT: ResponsiveConfig = { block: 'sauce-Drawer', prop: 'placement' }

/**
 * A panel that slides in from an edge: the same native modal behaviour as
 * Dialog. Bottom placement is a mobile sheet, padded for the home indicator.
 */
export const Drawer = ({
  placement = 'end',
  className,
  style,
  ...props
}: DrawerProps): JSX.Element => {
  const resolved = resolveResponsive([[placement, PLACEMENT]], {
    className: cx('sauce-Dialog', 'sauce-Drawer', className),
    style,
  })
  return <ModalBase {...props} className={resolved.className} style={resolved.style} />
}
