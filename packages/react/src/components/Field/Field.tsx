'use client'
import {
  createContext,
  use,
  useId,
  useMemo,
  type ComponentPropsWithRef,
  type JSX,
  type ReactNode,
} from 'react'
import { cx } from '../../utils/cx.ts'

interface FieldContextValue {
  id: string
  descriptionId?: string
  errorId?: string
  invalid?: boolean
  required?: boolean
  disabled?: boolean
}

const FieldContext = createContext<FieldContextValue | null>(null)

/** Props a control may set itself; each wins over the surrounding Field. */
export interface FieldControlProps {
  id?: string
  'aria-describedby'?: string
  invalid?: boolean
  required?: boolean
  disabled?: boolean
}

/**
 * Wires a control to its Field: shared id (for the label), description and
 * error via `aria-describedby`, `aria-invalid`, `required` and `disabled`.
 * Every SauceUI control calls it; use it to make your own controls Field-aware.
 */
export const useFieldControl = ({
  id,
  invalid,
  required,
  disabled,
  ...props
}: FieldControlProps) => {
  const field = use(FieldContext)
  const fallbackId = useId()
  const isInvalid = invalid ?? field?.invalid
  return {
    id: id ?? field?.id ?? fallbackId,
    'aria-describedby':
      cx(props['aria-describedby'], field?.descriptionId, isInvalid && field?.errorId) ||
      undefined,
    'aria-invalid': isInvalid || undefined,
    required: required ?? field?.required,
    disabled: disabled ?? field?.disabled,
  }
}

export interface FieldProps extends Omit<ComponentPropsWithRef<'div'>, 'id'> {
  /** The visible label. Always required: use `hideLabel` to hide it visually. */
  label: ReactNode
  /** Hint text below the label, announced with the control. */
  description?: ReactNode
  /** Error text. Setting it marks the control invalid. */
  error?: ReactNode
  /** Mark invalid without (or before) an error message. */
  invalid?: boolean
  required?: boolean
  disabled?: boolean
  /** Keep the label for screen readers but hide it on screen. */
  hideLabel?: boolean
  /** The control's id. Generated when omitted. */
  controlId?: string
}

/**
 * Label, description and error around one control, all wired up for
 * assistive tech. The control is the child:
 *
 * ```tsx
 * <Field label="Email" description="We never share it." error={errors.email}>
 *   <Input type="email" name="email" />
 * </Field>
 * ```
 */
export const Field = ({
  label,
  description,
  error,
  invalid,
  required,
  disabled,
  hideLabel,
  controlId,
  className,
  children,
  ...props
}: FieldProps): JSX.Element => {
  const generated = useId()
  const id = controlId ?? `${generated}-control`
  const descriptionId = description ? `${generated}-description` : undefined
  const errorId = error ? `${generated}-error` : undefined
  const isInvalid = invalid ?? Boolean(error)

  const context = useMemo(
    () => ({ id, descriptionId, errorId, invalid: isInvalid, required, disabled }),
    [id, descriptionId, errorId, isInvalid, required, disabled]
  )

  return (
    <div
      {...props}
      className={cx('sauce-Field', className)}
      data-invalid={isInvalid || undefined}
      data-disabled={disabled || undefined}
    >
      <label
        htmlFor={id}
        className={cx('sauce-Field-label', hideLabel && 'sauce-VisuallyHidden')}
      >
        {label}
        {required && (
          <span className="sauce-Field-required" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {description && (
        <p id={descriptionId} className="sauce-Field-description">
          {description}
        </p>
      )}
      <FieldContext value={context}>{children}</FieldContext>
      {error && (
        <p id={errorId} className="sauce-Field-error">
          {error}
        </p>
      )}
    </div>
  )
}
