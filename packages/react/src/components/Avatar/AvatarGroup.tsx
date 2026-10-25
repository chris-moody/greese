import { Children, type ComponentPropsWithRef, type JSX, type ReactNode } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'
import type { ControlSize } from '../Button/Button.tsx'

// Its own file, without Avatar's 'use client': a group has no state, so it
// stays a Server Component even though the Avatars inside it are not.
export interface AvatarGroupProps extends ComponentPropsWithRef<'div'>, GreeseProps {
  /**
   * Show at most this many, then a "+N" count for the rest. A count of one
   * would take the place an avatar could have, so with only one left over
   * every avatar shows instead.
   */
  max?: number
  /** Size of every avatar in the group, overriding their own. @default 'md' */
  size?: ControlSize
  /** The Avatars, overlapping in order. */
  children: ReactNode
}

/**
 * Overlapping avatars, e.g. a document's collaborators. Give it an
 * `aria-label` such as "Shared with".
 *
 * ```tsx
 * <AvatarGroup max={3}>
 *   {team.map((p) => <Avatar key={p.id} name={p.name} src={p.photo} />)}
 * </AvatarGroup>
 * ```
 */
export const AvatarGroup = ({
  max,
  size = 'md',
  className,
  children,
  greese,
  ...props
}: AvatarGroupProps): JSX.Element => {
  const items = Children.toArray(children)
  // "+1" takes the space of the one avatar it stands for: show it instead.
  const shown = max !== undefined && items.length - max >= 2 ? items.slice(0, max) : items
  const hidden = items.length - shown.length
  const total = shown.length + (hidden > 0 ? 1 : 0)
  // Earlier avatars stack on top, so each one's face (or initials) stays
  // visible; DOM and reading order are unchanged.
  const layer = (index: number) => ({ zIndex: total - index })
  return withGreese(
    <div
      role="group"
      {...props}
      className={cx('greese-AvatarGroup', `greese-AvatarGroup--${size}`, className)}
    >
      {shown.map((item, i) => (
        <span key={i} className="greese-AvatarGroup-item" style={layer(i)}>
          {item}
        </span>
      ))}
      {hidden > 0 && (
        <span className="greese-AvatarGroup-item" style={layer(shown.length)}>
          <span
            className={cx(
              'greese-Avatar',
              `greese-Avatar--${size}`,
              'greese-Avatar--count'
            )}
          >
            <span
              role="img"
              aria-label={`${hidden} more`}
              className="greese-Avatar-fallback"
            >
              <span aria-hidden="true">+{hidden}</span>
            </span>
          </span>
        </span>
      )}
    </div>,
    greese
  )
}
