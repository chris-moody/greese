import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '@greese/react'
import { accentStyle } from './accent.ts'

export interface AccentIconProps extends ComponentPropsWithRef<'span'> {
  /** The environment's hue, an OKLCH hue in degrees: its icon takes the theme's primary color, turned to it. */
  hue: number
}

/**
 * Tints an icon with an environment's accent, through `currentColor`. The
 * color is derived from the hue in CSS, per scheme; every Glop studio had a
 * copy of this.
 *
 * ```tsx
 * <AccentIcon hue={210}><FilmIcon /></AccentIcon>
 * ```
 */
export const AccentIcon = ({
  hue,
  className,
  style,
  ...props
}: AccentIconProps): JSX.Element => (
  <span
    {...props}
    className={cx('greese-AccentIcon', className)}
    style={accentStyle(hue, style)}
  />
)
