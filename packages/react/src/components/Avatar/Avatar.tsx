'use client'
import {
  Children,
  useState,
  type ComponentPropsWithRef,
  type JSX,
  type ReactNode,
  type RefCallback,
} from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

export interface AvatarProps
  extends Omit<ComponentPropsWithRef<'span'>, 'children'>, GreeseProps {
  /** The person or thing: used for the alt text and the initials fallback. */
  name: string
  src?: string
  /** @default 'md' */
  size?: AvatarSize
  /** @default 'circle' */
  shape?: 'circle' | 'square'
  /** Shown instead of initials when there is no image (an icon, say). */
  fallback?: ReactNode
}

/** "Ada Lovelace" → "AL"; "Prince" → "P". */
export const initials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const first = words[0]?.[0] ?? ''
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

/** A person's picture, falling back to their initials if missing or broken. */
export const Avatar = ({
  name,
  src,
  size = 'md',
  shape = 'circle',
  fallback,
  className,
  greese,
  ...props
}: AvatarProps): JSX.Element => {
  const [failedSrc, setFailedSrc] = useState<string>()
  const showImage = src && failedSrc !== src

  // A failure before hydration never reaches React's onError.
  const detectEarlyFailure: RefCallback<HTMLImageElement> = (img) => {
    if (img?.complete && img.naturalWidth === 0 && img.currentSrc) setFailedSrc(src)
  }

  return withGreese(
    <span
      {...props}
      className={cx(
        'greese-Avatar',
        `greese-Avatar--${size}`,
        shape === 'square' && 'greese-Avatar--square',
        className
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          ref={detectEarlyFailure}
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <span role="img" aria-label={name} className="greese-Avatar-fallback">
          {fallback ?? <span aria-hidden="true">{initials(name)}</span>}
        </span>
      )}
    </span>,
    greese
  )
}

export interface AvatarGroupProps extends ComponentPropsWithRef<'div'>, GreeseProps {
  /** Show at most this many, then a "+N" count. */
  max?: number
  /** @default 'md' */
  size?: AvatarSize
  children: ReactNode
}

/**
 * Overlapping avatars, e.g. a document's collaborators. Give it an
 * `aria-label` such as "Shared with".
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
  const shown = max !== undefined ? items.slice(0, max) : items
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
