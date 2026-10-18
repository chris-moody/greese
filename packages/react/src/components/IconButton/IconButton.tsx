import type { JSX, ReactNode } from 'react'
import { cx } from '../../utils/cx.ts'
import { Button, type ButtonProps } from '../Button/Button.tsx'

export interface IconButtonProps extends Omit<
  ButtonProps,
  'startIcon' | 'endIcon' | 'children' | 'fullWidth'
> {
  /**
   * The accessible name, required: an icon alone says nothing to a screen
   * reader. Applied as `aria-label`.
   */
  label: string
  /** The icon: any element, from any icon set. */
  children: ReactNode
}

/**
 * A square, icon-only button. SauceUI ships no icons, so bring any set.
 *
 * ```tsx
 * <IconButton label="Close dialog"><XIcon /></IconButton>
 * ```
 */
export const IconButton = ({
  label,
  variant = 'ghost',
  tone = 'neutral',
  className,
  children,
  ...props
}: IconButtonProps): JSX.Element => (
  <Button
    {...props}
    variant={variant}
    tone={tone}
    aria-label={label}
    className={cx('sauce-IconButton', className)}
  >
    <span className="sauce-Button-icon" aria-hidden="true">
      {children}
    </span>
  </Button>
)
