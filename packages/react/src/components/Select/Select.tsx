'use client'
import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import type { ControlSize } from '../Button/Button.tsx'
import { useFieldControl } from '../Field/Field.tsx'

export interface SelectProps extends Omit<ComponentPropsWithRef<'select'>, 'size'> {
  /** @default 'md' */
  size?: ControlSize
  invalid?: boolean
  /** Shown until a choice is made; not itself selectable. */
  placeholder?: string
}

/**
 * A native `<select>`: the platform picker on phones, full keyboard support,
 * autofill. Options are plain `<option>` / `<optgroup>` children. `className`
 * and `style` go to the frame; the rest to the select.
 */
export const Select = ({
  size = 'md',
  invalid,
  placeholder,
  className,
  style,
  id,
  required,
  disabled,
  'aria-describedby': describedBy,
  defaultValue,
  value,
  children,
  ...props
}: SelectProps): JSX.Element => {
  const control = useFieldControl({
    id,
    invalid,
    required,
    disabled,
    'aria-describedby': describedBy,
  })
  return (
    <div
      className={cx('sauce-Select', `sauce-Select--size-${size}`, className)}
      style={style}
      data-invalid={control['aria-invalid']}
      data-disabled={control.disabled || undefined}
    >
      <select
        {...props}
        {...control}
        value={value}
        // With a placeholder and no value, start on the placeholder.
        defaultValue={
          value === undefined && defaultValue === undefined && placeholder
            ? ''
            : defaultValue
        }
        className="sauce-Select-control"
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <span className="sauce-Select-chevron" aria-hidden="true" />
    </div>
  )
}
