import type { ComponentPropsWithoutRef, JSX, MouseEvent, ReactNode, Ref } from 'react'
import { cx } from '../../utils/cx.ts'
import {
  mapResponsive,
  resolveResponsive,
  type Responsive,
  type ResponsiveConfig,
} from '../../utils/responsive.ts'
import { Slot, Slottable } from '../Slot/Slot.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'
import type { BrandTone } from '../../utils/tone.ts'

export type ButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost'
export type ButtonTone = BrandTone | 'neutral' | 'negative'
export type ControlSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends GreeseProps, ComponentPropsWithoutRef<'button'> {
  /** The rendered `<button>` (or your element, with `asChild`). */
  ref?: Ref<HTMLButtonElement>
  /**
   * Visual weight: `solid` for the main action, `soft`, `outline`, then `ghost`
   * for the least.
   * @default 'solid'
   */
  variant?: ButtonVariant
  /**
   * Colour role: `accent`, a brand colour (primary, secondary, tertiary),
   * `neutral`, or `negative` for destructive actions.
   * @default 'primary'
   */
  tone?: ButtonTone
  /**
   * Height, padding and text size: `sm`, `md` or `lg`. Touch targets stay at
   * least 44px.
   * @default 'md'
   */
  size?: ControlSize
  /** Fill the container's width, e.g. `{ xs: true, md: false }` on phones only. */
  fullWidth?: Responsive<boolean>
  /**
   * Shows a spinner and ignores clicks, but stays focusable (`aria-disabled`,
   * not `disabled`) so keyboard focus is not lost mid-action.
   */
  loading?: boolean
  /** Decorative icon before the label. */
  startIcon?: ReactNode
  /** Decorative icon after the label. */
  endIcon?: ReactNode
  /** Render your own element, e.g. a router `<Link>`, as the button. */
  asChild?: boolean
}

const FULL_WIDTH: ResponsiveConfig = { block: 'greese-Button', prop: 'width' }

/**
 * A button. `type` defaults to `"button"`, so it never submits a form by
 * accident; pass `type="submit"` when it should.
 *
 * ```tsx
 * <Button startIcon={<PlusIcon />}>Add item</Button>
 * <Button variant="outline" tone="negative" loading={deleting}>Delete</Button>
 * <Button asChild variant="ghost"><a href="/docs">Docs</a></Button>
 * ```
 */
export const Button = ({
  greese,
  variant = 'solid',
  tone = 'primary',
  size = 'md',
  fullWidth,
  loading,
  startIcon,
  endIcon,
  asChild,
  disabled,
  type,
  onClick,
  className,
  style,
  children,
  ...props
}: ButtonProps): JSX.Element => {
  const resolved = resolveResponsive(
    [[mapResponsive(fullWidth, (full) => (full ? 'full' : 'auto')), FULL_WIDTH]],
    {
      className: cx(
        'greese-Button',
        `greese-Button--${variant}`,
        `greese-Button--${tone}`,
        `greese-Button--size-${size}`,
        className
      ),
      style,
    }
  )
  const inert = loading || (asChild && disabled)
  const Root = (asChild ? Slot : 'button') as typeof Slot

  return withGreese(
    <Root
      {...props}
      ref={props.ref as Ref<HTMLElement>}
      className={resolved.className}
      style={resolved.style}
      // Native `disabled` only on real buttons and never while loading.
      {...(!asChild && { type: type ?? 'button', disabled: disabled && !loading })}
      aria-disabled={inert || undefined}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        if (inert) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
    >
      {startIcon && (
        <span className="greese-Button-icon" aria-hidden="true">
          {startIcon}
        </span>
      )}
      <Slottable>{children}</Slottable>
      {endIcon && (
        <span className="greese-Button-icon" aria-hidden="true">
          {endIcon}
        </span>
      )}
    </Root>,
    greese
  )
}
