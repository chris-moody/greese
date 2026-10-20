'use client'
import {
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type JSX,
  type ReactNode,
  type RefCallback,
} from 'react'
import { cx } from '../../utils/cx.ts'
import {
  neverToken,
  resolveResponsive,
  type Responsive,
  type ResponsiveConfig,
} from '../../utils/responsive.ts'
import { composeRefs } from '../Slot/Slot.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface ImageProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'img'>, 'placeholder'> {
  /** Required: describe the image, or `""` if it is decorative. */
  alt: string
  /** Width / height. Reserves space before loading, so nothing shifts (no CLS). */
  ratio?: Responsive<number | string>
  /**
   * How the image fills its ratio box: `cover` crops to fill, `contain` shows
   * all of it.
   * @default 'cover'
   */
  fit?: 'cover' | 'contain'
  /**
   * Shown behind the image until it paints: a colour, or a tiny blurred
   * data URL for a blur-up effect. Pure CSS, so it works before hydration.
   */
  placeholder?: string
  /** Rendered instead of the image if it fails to load. */
  fallback?: ReactNode
  /**
   * For the largest image above the fold (your LCP element): loads eagerly at
   * high priority instead of lazily.
   */
  priority?: boolean
  /** Rounded corners. */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'pill'
}

const RATIO: ResponsiveConfig = {
  block: 'greese-Image',
  prop: 'ratio',
  isToken: neverToken,
}

const isColor = (value: string) => !/^(data:|https?:|\/|\.)/.test(value)

/**
 * A responsive `<img>`: lazy by default, decoded off the main thread, with an
 * optional ratio frame, placeholder and error fallback. `srcSet`/`sizes` pass
 * through to the image.
 */
export const Image = ({
  greese,
  ratio,
  fit = 'cover',
  placeholder,
  fallback,
  priority,
  radius,
  className,
  style,
  ref,
  onError,
  loading,
  decoding,
  ...props
}: ImageProps): JSX.Element => {
  const [failed, setFailed] = useState(false)
  const resolved = resolveResponsive([[ratio, RATIO]], {
    className: cx(
      'greese-Image',
      ratio !== undefined && 'greese-Image--framed',
      fit === 'contain' && 'greese-Image--contain',
      radius && `greese-Image--radius-${radius}`,
      className
    ),
    style: placeholder
      ? ({
          [isColor(placeholder) ? 'backgroundColor' : 'backgroundImage']: isColor(
            placeholder
          )
            ? placeholder
            : `url("${placeholder}")`,
          ...style,
        } as CSSProperties)
      : style,
  })

  // An image that failed before hydration never fires onError in React.
  const detectEarlyFailure: RefCallback<HTMLImageElement> = (img) => {
    if (img?.complete && img.naturalWidth === 0 && img.currentSrc) setFailed(true)
  }

  if (failed && fallback !== undefined) {
    return (
      <span
        className={cx(resolved.className, 'greese-Image--fallback')}
        style={resolved.style}
      >
        {fallback}
      </span>
    )
  }

  return withGreese(
    <span className={resolved.className} style={resolved.style}>
      <img
        {...props}
        ref={composeRefs(ref, detectEarlyFailure)}
        loading={loading ?? (priority ? 'eager' : 'lazy')}
        decoding={decoding ?? (priority ? 'auto' : 'async')}
        fetchPriority={priority ? 'high' : props.fetchPriority}
        onError={(event) => {
          setFailed(true)
          onError?.(event)
        }}
      />
    </span>,
    greese
  )
}

/** Exported for tests: whether a placeholder is a colour rather than a URL. */
export const isPlaceholderColor = isColor
