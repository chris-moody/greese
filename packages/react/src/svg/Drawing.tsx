import type { ComponentPropsWithRef, JSX } from 'react'
import { withGreese, type GreeseProps } from '../utils/greese.ts'
import { varsStyle, type VarsProps } from './vars.ts'

export interface DrawingProps
  extends GreeseProps, VarsProps, ComponentPropsWithRef<'svg'> {
  /**
   * What the drawing shows, for screen readers: it becomes an image
   * (`role="img"`) with this name. Without it, the drawing is decorative and
   * hidden from assistive technology.
   */
  label?: string
}

/**
 * An `<svg>` root for the drawing components: named as an image when it has
 * a `label`, hidden from screen readers when it doesn't, and animatable with
 * the `greese` prop like any other component.
 *
 * ```tsx
 * <Drawing viewBox="0 0 100 100" label="A star">
 *   <Path d={{ type: 'star', cx: 50, cy: 50, r: 40 }} fill="gold" />
 * </Drawing>
 * ```
 */
export const Drawing = ({
  greese,
  label,
  vars,
  style,
  children,
  ...props
}: DrawingProps): JSX.Element =>
  withGreese(
    // eslint-disable-next-line no-restricted-syntax -- a drawing's root, not an icon
    <svg
      xmlns="http://www.w3.org/2000/svg"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      {...props}
      style={varsStyle(vars, style)}
    >
      {children}
    </svg>,
    greese
  )
