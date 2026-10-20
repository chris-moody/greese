import type { ComponentPropsWithRef, JSX, ReactNode } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'
import type { BrandTone } from '../../utils/tone.ts'

export interface ChatBubbleProps extends GreeseProps, ComponentPropsWithRef<'div'> {
  /** Which side it sits on: `end` for the reader's own messages. @default 'start' */
  side?: 'start' | 'end'
  /** Who wrote it, above the bubble. */
  author?: ReactNode
  /** When, beside the author. */
  time?: ReactNode
  /** Beside the bubble, usually an Avatar. */
  avatar?: ReactNode
  /** Below the bubble: "Delivered", "Seen". */
  footer?: ReactNode
  /**
   * The bubble's color: neutral, accent, a brand color (primary, secondary,
   * tertiary), positive, negative, warning or info. Defaults to `neutral` on
   * the start side and `accent` on the end side.
   */
  tone?: 'neutral' | BrandTone | 'positive' | 'negative' | 'warning' | 'info'
}

/**
 * One message in a conversation, with its author, time and status. Put the
 * messages in an element with `role="log"` so new ones are announced.
 *
 * ```tsx
 * <Stack role="log" aria-label="Messages" gap={3}>
 *   <ChatBubble author="Ada" time="09:12" avatar={<Avatar name="Ada" size="sm" />}>Ready?</ChatBubble>
 *   <ChatBubble side="end" footer="Seen">On my way.</ChatBubble>
 * </Stack>
 * ```
 */
export const ChatBubble = ({
  greese,
  side = 'start',
  author,
  time,
  avatar,
  footer,
  tone,
  className,
  children,
  ...props
}: ChatBubbleProps): JSX.Element =>
  withGreese(
    <div
      {...props}
      className={cx(
        'greese-ChatBubble',
        `greese-ChatBubble--${side}`,
        `greese-ChatBubble--${tone ?? (side === 'end' ? 'primary' : 'neutral')}`,
        className
      )}
    >
      {avatar && <div className="greese-ChatBubble-avatar">{avatar}</div>}
      {(author || time) && (
        <div className="greese-ChatBubble-header">
          {author && <span className="greese-ChatBubble-author">{author}</span>}
          {time && <span className="greese-ChatBubble-time">{time}</span>}
        </div>
      )}
      <div className="greese-ChatBubble-bubble">{children}</div>
      {footer && <div className="greese-ChatBubble-footer">{footer}</div>}
    </div>,
    greese
  )
