'use client'
import type { ComponentPropsWithRef, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import type { ControlSize } from '../Button/Button.tsx'
import { useFieldControl } from '../Field/Field.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface SelectProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'select'>, 'size'> {
  /**
   * Height, padding and text size: `sm`, `md` or `lg`. Text stays at least 16px
   * on touch screens.
   * @default 'md'
   */
  size?: ControlSize
  /**
   * Marks it invalid (`aria-invalid`) and colors it as an error. A surrounding
   * Field's `error` sets it too.
   */
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
  greese,
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
  return withGreese(
    <div
      className={cx('greese-Select', `greese-Select--size-${size}`, className)}
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
        className="greese-Select-control"
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <span className="greese-Select-chevron" aria-hidden="true" />
    </div>,
    greese
  )
}
