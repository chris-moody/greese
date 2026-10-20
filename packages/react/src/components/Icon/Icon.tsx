import type { ComponentPropsWithRef, CSSProperties, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface IconProps extends GreeseProps, ComponentPropsWithRef<'span'> {
  /**
   * Accessible name. Without it the icon is decorative (`aria-hidden`), which
   * is right when text sits beside it.
   */
  label?: string
  /** Any CSS length. @default '1.25em' (scales with surrounding text) */
  size?: string
}

/**
 * Sizes and colors any icon (SVG from any set) consistently: it inherits the
 * text color and scales with font size.
 *
 * ```tsx
 * <Icon><HeartSvg /></Icon>
 * <Icon label="Verified account"><BadgeCheck /></Icon>
 * ```
 */
export const Icon = ({
  greese,
  label,
  size,
  className,
  style,
  ...props
}: IconProps): JSX.Element =>
  withGreese(
    <span
      {...props}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      className={cx('greese-Icon', className)}
      style={size ? ({ '--greese-icon-size': size, ...style } as CSSProperties) : style}
    />,
    greese
  )
