'use client'
import {
  useRef,
  type ComponentPropsWithRef,
  type JSX,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { cx } from '../../utils/cx.ts'
import type { ControlSize } from '../Button/Button.tsx'
import { useFieldControl } from '../Field/Field.tsx'
import { composeRefs } from '../Slot/Slot.tsx'

export interface InputProps extends Omit<ComponentPropsWithRef<'input'>, 'size'> {
  /** @default 'md' */
  size?: ControlSize
  /** Mark invalid (also set by a surrounding Field's `error`). */
  invalid?: boolean
  /** Content inside the frame, before the text: an icon, a currency sign. */
  startAdornment?: ReactNode
  /** Content inside the frame, after the text: a unit, a clear button. */
  endAdornment?: ReactNode
}

/**
 * A native text-like `<input>` in a styled frame. `className` and `style` go
 * to the frame; every other prop (and `ref`) goes to the input itself, so it
 * works with native forms and form libraries as-is.
 */
export const Input = ({
  size = 'md',
  invalid,
  startAdornment,
  endAdornment,
  className,
  style,
  ref,
  id,
  required,
  disabled,
  'aria-describedby': describedBy,
  ...props
}: InputProps): JSX.Element => {
  const control = useFieldControl({
    id,
    invalid,
    required,
    disabled,
    'aria-describedby': describedBy,
  })
  const inputRef = useRef<HTMLInputElement>(null)

  // Clicking the frame or an adornment focuses the input, like a native field.
  const focusInput = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (
      target === inputRef.current ||
      target.closest('button, a, input, select, textarea')
    ) {
      return
    }
    event.preventDefault()
    inputRef.current?.focus()
  }

  return (
    <div
      className={cx('sauce-Input', `sauce-Input--size-${size}`, className)}
      style={style}
      data-invalid={control['aria-invalid']}
      data-disabled={control.disabled || undefined}
      onMouseDown={focusInput}
    >
      {startAdornment && <span className="sauce-Input-adornment">{startAdornment}</span>}
      <input
        {...props}
        {...control}
        ref={composeRefs(inputRef, ref)}
        className="sauce-Input-control"
      />
      {endAdornment && <span className="sauce-Input-adornment">{endAdornment}</span>}
    </div>
  )
}
