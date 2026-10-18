'use client'
import type { ComponentPropsWithRef, JSX, ReactNode, SyntheticEvent } from 'react'
import { cx } from '../../utils/cx.ts'

export interface CollapsibleProps extends Omit<
  ComponentPropsWithRef<'details'>,
  'title' | 'onToggle'
> {
  /** The always-visible summary that toggles the content. */
  title: ReactNode
  /** Initial state when uncontrolled. */
  defaultOpen?: boolean
  /** Controlled state; pair with `onOpenChange`. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * Exclusive group name: only one `<details>` with the same name is open at
   * a time (native, no JS). Accordion sets it for you.
   */
  name?: string
}

/**
 * Show/hide content behind a summary, on native `<details>`/`<summary>`:
 * keyboard, screen readers and find-in-page work without JavaScript, and the
 * content animates open where the browser supports it.
 */
export const Collapsible = ({
  title,
  defaultOpen,
  open,
  onOpenChange,
  className,
  children,
  ...props
}: CollapsibleProps): JSX.Element => (
  <details
    {...props}
    open={open ?? defaultOpen}
    className={cx('sauce-Collapsible', className)}
    onToggle={(event: SyntheticEvent<HTMLDetailsElement>) => {
      const isOpen = event.currentTarget.open
      if (isOpen !== open) onOpenChange?.(isOpen)
    }}
  >
    <summary className="sauce-Collapsible-trigger">
      <span className="sauce-Collapsible-title">{title}</span>
      <svg className="sauce-Collapsible-chevron" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M4 6l4 4 4-4" />
      </svg>
    </summary>
    <div className="sauce-Collapsible-content">{children}</div>
  </details>
)
