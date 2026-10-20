import { useId, type ComponentPropsWithRef, type JSX, type ReactNode } from 'react'
import { cx } from '../../utils/cx.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface FieldsetProps extends GreeseProps, ComponentPropsWithRef<'fieldset'> {
  /** The group's title, read before each control in it. */
  legend: ReactNode
  /** Help for the whole group, announced with it. */
  description?: ReactNode
  /** An error for the group as a whole ("Choose a delivery slot"). */
  error?: ReactNode
  /** `plain` (no frame) or `card` (a padded surface with a border). @default 'plain' */
  variant?: 'plain' | 'card'
}

/**
 * Groups related fields under a title: a native `<fieldset>` and `<legend>`,
 * so each control is announced with the group's name, and `disabled`
 * disables every control inside.
 *
 * ```tsx
 * <Fieldset legend="Shipping address" description="Where we deliver.">
 *   <TextField label="Street" />
 *   <TextField label="City" />
 * </Fieldset>
 * ```
 */
export const Fieldset = ({
  greese,
  legend,
  description,
  error,
  variant = 'plain',
  className,
  children,
  'aria-describedby': describedBy,
  ...props
}: FieldsetProps): JSX.Element => {
  const id = useId()
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined
  return withGreese(
    <fieldset
      {...props}
      aria-describedby={cx(describedBy, descriptionId, errorId) || undefined}
      className={cx('greese-Fieldset', `greese-Fieldset--${variant}`, className)}
    >
      <legend className="greese-Fieldset-legend">{legend}</legend>
      {description && (
        <p id={descriptionId} className="greese-Fieldset-description">
          {description}
        </p>
      )}
      <div className="greese-Fieldset-content">{children}</div>
      {error && (
        <p id={errorId} className="greese-Fieldset-error">
          {error}
        </p>
      )}
    </fieldset>,
    greese
  )
}
