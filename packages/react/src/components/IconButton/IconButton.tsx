import type { JSX, ReactNode } from 'react'
import { cx } from '../../utils/cx.ts'
import { Button, type ButtonProps } from '../Button/Button.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface IconButtonProps
  extends
    GreeseProps,
    Omit<ButtonProps, 'startIcon' | 'endIcon' | 'children' | 'fullWidth'> {
  /**
   * The accessible name, required: an icon alone says nothing to a screen
   * reader. Applied as `aria-label`.
   */
  label: string
  /** The icon: any element, from any icon set. */
  children: ReactNode
}

/**
 * A square, icon-only button. Bring any icon, from any set; `@greese/icons` has some.
 *
 * ```tsx
 * <IconButton label="Close dialog"><XIcon /></IconButton>
 * ```
 */
export const IconButton = ({
  greese,
  label,
  variant = 'ghost',
  tone = 'neutral',
  className,
  children,
  ...props
}: IconButtonProps): JSX.Element =>
  withGreese(
    <Button
      {...props}
      variant={variant}
      tone={tone}
      aria-label={label}
      className={cx('greese-IconButton', className)}
    >
      <span className="greese-Button-icon" aria-hidden="true">
        {children}
      </span>
    </Button>,
    greese
  )
