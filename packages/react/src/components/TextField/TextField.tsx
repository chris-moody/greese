import type { JSX, ReactNode } from 'react'
import { Field } from '../Field/Field.tsx'
import { Input, type InputProps } from '../Input/Input.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface TextFieldProps extends GreeseProps, InputProps {
  /** The visible label. Required: use `hideLabel` to hide it visually. */
  label: ReactNode
  /** Help text under the label, announced with the input. */
  description?: ReactNode
  /** Error text. Setting it marks the input invalid. */
  error?: ReactNode
  /** Keep the label for screen readers but hide it on screen. */
  hideLabel?: boolean
}

/**
 * Field + Input in one: the quick way to a labelled, accessible text input.
 * `className` and `style` go to the Field; the rest to the Input.
 *
 * ```tsx
 * <TextField label="Email" type="email" name="email" required error={errors.email} />
 * ```
 */
export const TextField = ({
  greese,
  label,
  description,
  error,
  hideLabel,
  required,
  disabled,
  invalid,
  className,
  style,
  id,
  ...props
}: TextFieldProps): JSX.Element =>
  withGreese(
    <Field
      label={label}
      description={description}
      error={error}
      hideLabel={hideLabel}
      required={required}
      disabled={disabled}
      invalid={invalid}
      controlId={id}
      className={className}
      style={style}
    >
      <Input {...props} />
    </Field>,
    greese
  )
