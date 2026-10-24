'use client'
import { ChevronDownIcon } from '@greese/icons'
import type { ComponentPropsWithRef, JSX, ReactNode, SyntheticEvent } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface CollapsibleProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'details'>, 'title' | 'onToggle'> {
  /** The always-visible summary that toggles the content. */
  title: ReactNode
  /** Initial state when uncontrolled. */
  defaultOpen?: boolean
  /** Controlled state; pair with `onOpenChange`. */
  open?: boolean
  /** Called with the new state when it opens or closes. */
  onOpenChange?: (open: boolean) => void
  /**
   * Exclusive group name: only one `<details>` with the same name is open at
   * a time (native, no JS). Accordion sets it for you.
   */
  name?: string
  /**
   * The icon beside the title: the closed state's, or both states' when there
   * is no `openIcon`. `null` shows none. @default a downward chevron
   */
  icon?: ReactNode
  /** The open state's icon. With one, the two icons swap as it opens and closes. */
  openIcon?: ReactNode
  /**
   * How the icon changes state: `rotate` turns it (by
   * `--greese-collapsible-icon-turn`, 180deg), `fade` crossfades the closed
   * and open icons, `none` switches at once. Under reduced motion every one
   * switches at once.
   * @default 'rotate' with one icon, 'fade' with an `openIcon`
   */
  iconTransition?: CollapsibleIconTransition
}

export type CollapsibleIconTransition = 'rotate' | 'fade' | 'none'

/** The icon in a summary: one that turns, or a closed and an open one stacked. */
const CollapsibleIcon = ({
  icon,
  openIcon,
  transition,
}: {
  icon?: ReactNode
  openIcon?: ReactNode
  transition?: CollapsibleIconTransition
}): JSX.Element | null => {
  const closed =
    icon === undefined ? <ChevronDownIcon className="greese-Collapsible-chevron" /> : icon
  if (closed === null && openIcon == null) return null
  const mode = transition ?? (openIcon == null ? 'rotate' : 'fade')
  return (
    <span
      className={cx('greese-Collapsible-icon', `greese-Collapsible-icon--${mode}`)}
      aria-hidden="true"
    >
      <span className="greese-Collapsible-closedIcon">{closed}</span>
      {openIcon != null && (
        <span className="greese-Collapsible-openIcon">{openIcon}</span>
      )}
    </span>
  )
}

/**
 * Show/hide content behind a summary, on native `<details>`/`<summary>`:
 * keyboard, screen readers and find-in-page work without JavaScript, and the
 * content animates open where the browser supports it. The icon is yours to
 * change: one that turns, or one per state that crossfades.
 *
 * ```tsx
 * <Collapsible title="Details" icon={<PlusIcon />} openIcon={<MinusIcon />}>…</Collapsible>
 * ```
 */
export const Collapsible = ({
  greese,
  title,
  defaultOpen,
  open,
  onOpenChange,
  icon,
  openIcon,
  iconTransition,
  className,
  children,
  ...props
}: CollapsibleProps): JSX.Element =>
  withGreese(
    <details
      {...props}
      open={open ?? defaultOpen}
      className={cx('greese-Collapsible', className)}
      onToggle={(event: SyntheticEvent<HTMLDetailsElement>) => {
        const isOpen = event.currentTarget.open
        if (isOpen !== open) onOpenChange?.(isOpen)
      }}
    >
      <summary className="greese-Collapsible-trigger">
        <span className="greese-Collapsible-title">{title}</span>
        <CollapsibleIcon icon={icon} openIcon={openIcon} transition={iconTransition} />
      </summary>
      <div className="greese-Collapsible-content">{children}</div>
    </details>,
    greese
  )
