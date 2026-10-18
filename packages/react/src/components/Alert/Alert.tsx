import type { ComponentPropsWithRef, JSX, ReactNode } from 'react'
import { cx } from '../../utils/cx.ts'
import { CloseGlyph } from '../../utils/glyphs.tsx'
import { IconButton } from '../IconButton/IconButton.tsx'

export type FeedbackTone = 'info' | 'positive' | 'warning' | 'negative' | 'neutral'

export interface AlertProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  /** @default 'info' */
  tone?: FeedbackTone
  /** @default 'soft' */
  variant?: 'soft' | 'outline'
  title?: ReactNode
  /** Leading icon from your icon set. Decorative: the text carries the meaning. */
  icon?: ReactNode
  /** Actions (buttons, links) shown after the message. */
  actions?: ReactNode
  /** Shows a dismiss button that calls this. */
  onDismiss?: () => void
  /** Accessible name for the dismiss button. @default 'Dismiss' */
  dismissLabel?: string
  /**
   * Announce to screen readers when it appears: `role="alert"` for negative
   * and warning tones, `role="status"` otherwise. Off by default, because a
   * message present on page load should not interrupt.
   */
  announce?: boolean
}

/** A message about the page or a task: info, success, warning or error. */
export const Alert = ({
  tone = 'info',
  variant = 'soft',
  title,
  icon,
  actions,
  onDismiss,
  dismissLabel = 'Dismiss',
  announce,
  className,
  children,
  ...props
}: AlertProps): JSX.Element => (
  <div
    role={
      announce
        ? tone === 'negative' || tone === 'warning'
          ? 'alert'
          : 'status'
        : undefined
    }
    {...props}
    className={cx(
      'sauce-Alert',
      `sauce-Alert--${tone}`,
      `sauce-Alert--${variant}`,
      className
    )}
  >
    {icon && (
      <span className="sauce-Alert-icon" aria-hidden="true">
        {icon}
      </span>
    )}
    <div className="sauce-Alert-body">
      {title && <p className="sauce-Alert-title">{title}</p>}
      {children && <div className="sauce-Alert-message">{children}</div>}
      {actions && <div className="sauce-Alert-actions">{actions}</div>}
    </div>
    {onDismiss && (
      <IconButton
        label={dismissLabel}
        size="sm"
        onClick={onDismiss}
        className="sauce-Alert-dismiss"
      >
        <CloseGlyph />
      </IconButton>
    )}
  </div>
)
