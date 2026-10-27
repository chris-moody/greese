import type {
  ComponentPropsWithoutRef,
  JSX,
  MouseEvent,
  MouseEventHandler,
  ReactNode,
  Ref,
} from 'react'
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

export type ButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost' | 'text'
export type ButtonTone = BrandTone | 'neutral' | 'negative'
export type ControlSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** What every button takes, whether it's a `<button>` or a link. */
export interface ButtonOwnProps extends GreeseProps {
  /**
   * Visual weight: `solid` for the main action, `soft`, `outline`, then `ghost`
   * for the least. `text` drops the box and takes the surrounding text's color,
   * so the button reads as plain text.
   * @default 'solid'
   */
  variant?: ButtonVariant
  /**
   * Color role: `accent`, a brand color (primary, secondary, tertiary),
   * `neutral`, or `negative` for destructive actions.
   * @default 'primary'
   */
  tone?: ButtonTone
  /**
   * Height, padding and text size: `xs`, `sm`, `md`, `lg` or `xl`. Touch targets stay at
   * least 44px.
   * @default 'md'
   */
  size?: ControlSize
  /** Fill the container's width, e.g. `{ xs: true, md: false }` on phones only. */
  fullWidth?: Responsive<boolean>
  /**
   * Shows a spinner and ignores clicks, but stays focusable (`aria-disabled`,
   * not `disabled`) so keyboard focus is not lost mid-action. A submit button
   * doesn't submit while it's loading.
   */
  loading?: boolean
  /** Decorative icon before the label. */
  startIcon?: ReactNode
  /** Decorative icon after the label. */
  endIcon?: ReactNode
}

/** A button that does something: a `<button>`, or your element with `asChild`. */
export interface ButtonActionProps
  extends ButtonOwnProps, Omit<ComponentPropsWithoutRef<'button'>, 'onClick'> {
  /** The rendered `<button>` (or your element, with `asChild`). */
  ref?: Ref<HTMLButtonElement>
  /** Called when it's pressed; never while it's loading or disabled. */
  onClick?: MouseEventHandler<HTMLButtonElement>
  /** A button that goes somewhere takes `href` instead of `onClick`. */
  href?: never
  /** Render your own element, e.g. a router `<Link>`, as the button. */
  asChild?: boolean
}

/** A button that goes somewhere: an `<a href>` that looks like a button. */
export interface ButtonLinkProps
  extends ButtonOwnProps, Omit<ComponentPropsWithoutRef<'a'>, 'onClick' | 'href'> {
  /** The rendered `<a>`. */
  ref?: Ref<HTMLAnchorElement>
  /** Where it goes: renders an `<a>` instead of a `<button>`. */
  href: string
  /** A link goes to its `href`; it takes no `onClick`. */
  onClick?: never
  /** Takes the link out of the tab order and the pointer's reach. */
  disabled?: boolean
  /** An `href` renders the link itself; use `asChild` without one for your own. */
  asChild?: never
}

/** A `<button>` with `onClick`, or a link with `href`, never both. */
export type ButtonProps = ButtonActionProps | ButtonLinkProps

/** `Omit` over each member of a union, so a props union keeps its either/or. */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never

const FULL_WIDTH: ResponsiveConfig = { block: 'greese-Button', prop: 'width' }

/**
 * A button. `type` defaults to `"button"`, so it never submits a form by
 * accident; pass `type="submit"` when it should. Server-component safe: it
 * blocks a loading or disabled press without script of its own, so it adds a
 * handler only around an `onClick` you pass (which only a client component can).
 *
 * ```tsx
 * <Button startIcon={<PlusIcon />}>Add item</Button>
 * <Button variant="outline" tone="negative" loading={deleting}>Delete</Button>
 * <Button href="/docs" variant="ghost">Docs</Button>
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
  // A link is an `<a>` of ours: it has no native `disabled`, as `asChild`.
  const link = props.href !== undefined
  const notButton = asChild || link
  const inert = loading || (notButton && disabled)
  const Root = (asChild ? Slot : link ? 'a' : 'button') as typeof Slot
  // A press is blocked with HTML and CSS, so a Server Component can render
  // this (it can't hand an element a function): a loading button is
  // `type="button"`, so it can't submit or reset its form, and a disabled
  // link or other `asChild` element leaves the tab order and the pointer
  // (Button.scss). Your `onClick` alone is wrapped, to skip it while inert.
  const handleClick =
    onClick &&
    ((event: MouseEvent<HTMLButtonElement>) => {
      if (inert) event.preventDefault()
      else onClick(event)
    })

  return withGreese(
    <Root
      {...props}
      ref={props.ref as Ref<HTMLElement>}
      className={resolved.className}
      style={resolved.style}
      // Native `disabled` only on real buttons and never while loading.
      {...(!notButton && {
        type: loading ? 'button' : (type ?? 'button'),
        disabled: disabled && !loading,
      })}
      {...(link && { type })}
      {...(notButton && disabled && { tabIndex: -1 })}
      aria-disabled={inert || undefined}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      onClick={handleClick}
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
