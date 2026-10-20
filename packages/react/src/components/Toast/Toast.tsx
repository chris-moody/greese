'use client'
import { createPortal } from 'react-dom'
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithRef,
  type JSX,
  type ReactNode,
} from 'react'
import { cx } from '../../utils/cx.ts'
import { CloseGlyph } from '../../utils/glyphs.tsx'
import { Button } from '../Button/Button.tsx'
import { IconButton } from '../IconButton/IconButton.tsx'
import type { BrandTone } from '../../utils/tone.ts'

export type ToastTone =
  'neutral' | BrandTone | 'info' | 'positive' | 'warning' | 'negative'

export interface ToastOptions {
  /** The message, in bold. */
  title: ReactNode
  /** A second, muted line. */
  description?: ReactNode
  /**
   * Colour and meaning: neutral, a brand colour (primary, secondary,
   * tertiary), info, positive, warning or negative.
   * @default 'neutral'
   */
  tone?: ToastTone
  /** One action button, e.g. Undo. Choosing it dismisses the toast. */
  action?: { label: string; onClick: () => void }
  /** Auto-dismiss after this many ms; `Infinity` to stay. Paused on hover and focus. @default 5000 */
  duration?: number
  /** Text announced to screen readers, if `title` is not plain text. */
  announcement?: string
}

export type ToastRecord = ToastOptions &
  Required<Pick<ToastOptions, 'tone' | 'duration'>> & {
    id: number
  }

// A tiny external store: toast() works from anywhere, no provider needed.
let records: ToastRecord[] = []
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const EMPTY: ToastRecord[] = []

/**
 * Shows a toast; returns its id. Render one `<Toaster />` near the app root.
 *
 * ```ts
 * toast({ title: 'Message archived', action: { label: 'Undo', onClick: restore } })
 * toast({ title: "Couldn't save", tone: 'negative' })
 * ```
 */
export const toast = (options: ToastOptions): number => {
  const record: ToastRecord = {
    tone: 'neutral',
    duration: 5000,
    ...options,
    id: nextId++,
  }
  records = [...records, record]
  emit()
  return record.id
}

/** Dismisses one toast, or all of them. */
toast.dismiss = (id?: number): void => {
  records = id === undefined ? [] : records.filter((r) => r.id !== id)
  emit()
}

/**
 * The topmost open modal dialog, if any. Everything outside a modal is inert
 * (not clickable, hidden from assistive tech), so the Toaster moves inside it
 * while it is open: still drawn above it, but now usable and announced.
 */
const useModalHost = (): HTMLElement | null => {
  const [host, setHost] = useState<HTMLElement | null>(null)
  useEffect(() => {
    const update = () => {
      let modals: NodeListOf<HTMLElement>
      try {
        modals = document.querySelectorAll('dialog:modal')
      } catch {
        modals = document.querySelectorAll('dialog[open]') // engines without :modal
      }
      setHost(modals[modals.length - 1] ?? null)
    }
    const observer = new MutationObserver(update)
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['open'],
    })
    update()
    return () => observer.disconnect()
  }, [])
  return host
}

const announcementOf = (record: ToastRecord): string =>
  record.announcement ??
  [record.title, record.description].filter((part) => typeof part === 'string').join('. ')

export interface ToasterProps extends Omit<ComponentPropsWithRef<'section'>, 'popover'> {
  /** At most this many on screen; older ones queue. @default 3 */
  max?: number
  /** Accessible name of the region. @default 'Notifications' */
  label?: string
  /** Accessible name of each dismiss button. @default 'Dismiss' */
  dismissLabel?: string
}

/**
 * Where toasts appear: bottom centre on phones, bottom end from `md`. Lives in
 * the top layer, above open dialogs, and announces each toast politely
 * (assertively for negative ones) through live regions that are always
 * present, so screen readers reliably pick them up.
 */
export const Toaster = ({
  max = 3,
  label = 'Notifications',
  dismissLabel = 'Dismiss',
  className,
  ...props
}: ToasterProps): JSX.Element => {
  const all = useSyncExternalStore(
    subscribe,
    () => records,
    () => EMPTY
  )
  const visible = all.slice(0, max)
  const region = useRef<HTMLElement>(null)
  const [announced, setAnnounced] = useState({ polite: '', assertive: '' })
  const lastId = useRef(0)
  const host = useModalHost()

  // Show while there are toasts. Re-show on each new one so it stacks above
  // anything opened since, and after moving into or out of a modal.
  useLayoutEffect(() => {
    const el = region.current
    if (!el) return
    const open = el.matches(':popover-open')
    const isNew = all.at(-1)?.id !== lastId.current
    if (visible.length && (!open || isNew)) {
      if (open) el.hidePopover()
      el.showPopover()
    } else if (!visible.length && open) {
      el.hidePopover()
    }
  }, [all, visible.length, host])

  useEffect(() => {
    const newest = all.at(-1)
    if (!newest || newest.id === lastId.current) return
    lastId.current = newest.id
    const text = announcementOf(newest)
    setAnnounced(
      newest.tone === 'negative'
        ? { polite: '', assertive: text }
        : { polite: text, assertive: '' }
    )
  }, [all])

  const content = (
    <>
      <span className="greese-VisuallyHidden" aria-live="polite">
        {announced.polite}
      </span>
      <span className="greese-VisuallyHidden" aria-live="assertive">
        {announced.assertive}
      </span>
      <section
        {...props}
        ref={region}
        popover="manual"
        aria-label={label}
        className={cx('greese-Toaster', className)}
      >
        <ol className="greese-Toaster-list">
          {visible.map((record) => (
            <ToastItem key={record.id} record={record} dismissLabel={dismissLabel} />
          ))}
        </ol>
      </section>
    </>
  )
  return host ? createPortal(content, host) : content
}

const ToastItem = ({
  record,
  dismissLabel,
}: {
  record: ToastRecord
  dismissLabel: string
}) => {
  const [paused, setPaused] = useState(false)
  const remaining = useRef(record.duration)

  useEffect(() => {
    if (paused || !Number.isFinite(remaining.current)) return
    const started = Date.now()
    const timer = setTimeout(() => toast.dismiss(record.id), remaining.current)
    return () => {
      clearTimeout(timer)
      remaining.current -= Date.now() - started
    }
  }, [paused, record.id])

  return (
    <li
      className={cx('greese-Toast', `greese-Toast--${record.tone}`)}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="greese-Toast-body">
        <p className="greese-Toast-title">{record.title}</p>
        {record.description && (
          <p className="greese-Toast-description">{record.description}</p>
        )}
      </div>
      {record.action && (
        <Button
          size="sm"
          variant="soft"
          tone="neutral"
          onClick={() => {
            record.action!.onClick()
            toast.dismiss(record.id)
          }}
        >
          {record.action.label}
        </Button>
      )}
      <IconButton label={dismissLabel} size="sm" onClick={() => toast.dismiss(record.id)}>
        <CloseGlyph />
      </IconButton>
    </li>
  )
}
