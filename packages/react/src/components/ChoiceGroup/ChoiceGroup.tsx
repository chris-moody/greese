import { useId, type ComponentPropsWithRef, type JSX, type ReactNode } from 'react'
import { cx } from '../../utils/cx.ts'
import type { Responsive, SpaceValue } from '../../utils/responsive.ts'
import { Stack, type StackDirection } from '../Stack/Stack.tsx'

export interface ChoiceGroupProps extends Omit<
  ComponentPropsWithRef<'fieldset'>,
  'onChange' | 'defaultValue'
> {
  /** The group's name, rendered as the `<legend>`. */
  label: ReactNode
  description?: ReactNode
  /** Error text. Setting it marks every choice invalid. */
  error?: ReactNode
  invalid?: boolean
  /** Shows the required marker. */
  required?: boolean
  hideLabel?: boolean
  /** Layout of the choices. @default 'column' */
  direction?: Responsive<StackDirection>
  /** @default 3 */
  gap?: Responsive<SpaceValue>
}

/** Internal: the fieldset/legend shell shared by CheckboxGroup and RadioGroup. */
export const ChoiceGroupShell = ({
  label,
  description,
  error,
  required,
  hideLabel,
  direction = 'column',
  gap = 3,
  className,
  children,
  invalid: _invalid,
  ...props
}: Omit<ChoiceGroupProps, 'children'> & {
  children: (ids: { describedBy?: string }) => ReactNode
}): JSX.Element => {
  const id = useId()
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined
  return (
    <fieldset
      {...props}
      aria-describedby={cx(descriptionId, errorId) || undefined}
      className={cx('sauce-ChoiceGroup', className)}
    >
      <legend className={cx('sauce-Field-label', hideLabel && 'sauce-VisuallyHidden')}>
        {label}
        {required && (
          <span className="sauce-Field-required" aria-hidden="true">
            *
          </span>
        )}
      </legend>
      {description && (
        <p id={descriptionId} className="sauce-Field-description">
          {description}
        </p>
      )}
      <Stack direction={direction} gap={gap} wrap="wrap">
        {children({ describedBy: errorId })}
      </Stack>
      {error && (
        <p id={errorId} className="sauce-Field-error">
          {error}
        </p>
      )}
    </fieldset>
  )
}

/**
 * Internal: the text beside a Checkbox, Radio or Switch. Only the label text is
 * inside `<label>`, so the description is announced as a description, never
 * folded into the control's name.
 */
export const ChoiceText = ({
  htmlFor,
  label,
  description,
  descriptionId,
}: {
  htmlFor: string
  label?: ReactNode
  description?: ReactNode
  descriptionId: string
}): JSX.Element | null =>
  label || description ? (
    <span className="sauce-Checkbox-text">
      {label && (
        <label htmlFor={htmlFor} className="sauce-Checkbox-label">
          {label}
        </label>
      )}
      {description && (
        <span id={descriptionId} className="sauce-Checkbox-description">
          {description}
        </span>
      )}
    </span>
  ) : null
