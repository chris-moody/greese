import type { ComponentPropsWithRef, CSSProperties, JSX } from 'react'
import { cx } from '../../utils/cx.ts'

export interface IconProps extends ComponentPropsWithRef<'span'> {
  /**
   * Accessible name. Without it the icon is decorative (`aria-hidden`), which
   * is right when text sits beside it.
   */
  label?: string
  /** Any CSS length. @default '1.25em' (scales with surrounding text) */
  size?: string
}

/**
 * Sizes and colours any icon (SVG from any set) consistently: it inherits the
 * text colour and scales with font size.
 *
 * ```tsx
 * <Icon><HeartSvg /></Icon>
 * <Icon label="Verified account"><BadgeCheck /></Icon>
 * ```
 */
export const Icon = ({
  label,
  size,
  className,
  style,
  ...props
}: IconProps): JSX.Element => (
  <span
    {...props}
    {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    className={cx('sauce-Icon', className)}
    style={size ? ({ '--sauce-icon-size': size, ...style } as CSSProperties) : style}
  />
)
