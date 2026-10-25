'use client'
import {
  useState,
  type ComponentPropsWithRef,
  type JSX,
  type ReactNode,
  type RefCallback,
} from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'
import type { ControlSize } from '../Button/Button.tsx'

export interface AvatarProps
  extends Omit<ComponentPropsWithRef<'span'>, 'children'>, GreeseProps {
  /** The person or thing: used for the alt text and the initials fallback. */
  name: string
  /**
   * Image URL. If it's missing or fails to load, initials from `name` (or
   * `fallback`) show instead.
   */
  src?: string
  /** Diameter: `xs` to `xl`, from 1.5rem to 4rem. @default 'md' */
  size?: ControlSize
  /**
   * `circle`, or `square` with rounded corners (for organisations and things).
   * @default 'circle'
   */
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

/**
 * A person's picture, falling back to their initials if missing or broken.
 *
 * ```tsx
 * <Avatar name="Ada Lovelace" src="/ada.jpg" />
 * ```
 */
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
