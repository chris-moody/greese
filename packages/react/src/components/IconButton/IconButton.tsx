import type { JSX, ReactNode } from 'react'
import { cx } from '../../utils/cx.ts'
import {
  Button,
  type ButtonActionProps,
  type ButtonLinkProps,
  type ButtonProps,
  type DistributiveOmit,
} from '../Button/Button.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

type Dropped = 'startIcon' | 'endIcon' | 'children' | 'fullWidth'

/** What every icon button takes, whether it's a `<button>` or a link. */
export interface IconButtonOwnProps extends GreeseProps {
  /**
   * The accessible name, required: an icon alone says nothing to a screen
   * reader. Applied as `aria-label`.
   */
  label: string
  /** The icon: any element, from any icon set. */
  children: ReactNode
}

/** An icon button that does something, with `onClick`. */
export interface IconButtonActionProps
  extends IconButtonOwnProps, Omit<ButtonActionProps, Dropped> {}

/** An icon button that goes somewhere, with `href`. */
export interface IconButtonLinkProps
  extends IconButtonOwnProps, Omit<ButtonLinkProps, Dropped> {}

/** An icon button with `onClick`, or a link with `href`, never both. */
export type IconButtonProps = IconButtonActionProps | IconButtonLinkProps

/**
 * A square, icon-only button. Bring any icon, from any set; `@greese/icons` has some.
 *
 * ```tsx
 * <IconButton label="Close dialog" onClick={close}><XIcon /></IconButton>
 * <IconButton label="GitHub" href="https://github.com/…"><GitHubIcon /></IconButton>
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
      {...(props as DistributiveOmit<ButtonProps, Dropped>)}
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
