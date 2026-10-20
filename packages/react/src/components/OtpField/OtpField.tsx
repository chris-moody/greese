'use client'
import {
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type JSX,
} from 'react'
import { useControllableState } from '../../hooks/useControllableState.ts'
import { cx } from '../../utils/cx.ts'
import type { ControlSize } from '../Button/Button.tsx'
import { useFieldControl } from '../Field/Field.tsx'
import { composeRefs } from '../Slot/Slot.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface OtpFieldProps
  extends
    GreeseProps,
    Omit<
      ComponentPropsWithRef<'input'>,
      'size' | 'value' | 'defaultValue' | 'maxLength' | 'type'
    > {
  /** How many characters the code has. @default 6 */
  length?: number
  /** The code typed so far, when you control it. Pair with `onValueChange`. */
  value?: string
  /** The starting code, when it keeps its own state. */
  defaultValue?: string
  /** Called with the code as it changes, already filtered to the allowed characters. */
  onValueChange?: (value: string) => void
  /** Called once the code is complete, with it. */
  onComplete?: (value: string) => void
  /** Which characters it accepts. @default 'numeric' */
  mode?: 'numeric' | 'alphanumeric'
  /** Show dots instead of the characters. */
  mask?: boolean
  /** Size of the boxes: `sm`, `md` or `lg`. @default 'md' */
  size?: ControlSize
  /**
   * Marks it invalid and outlines the boxes as an error. A surrounding Field's
   * `error` sets it too.
   */
  invalid?: boolean
}

/** Keeps the characters `mode` allows, upper-cased, up to `length`. */
export const sanitizeOtp = (
  text: string,
  length: number,
  mode: 'numeric' | 'alphanumeric'
): string =>
  (mode === 'numeric' ? text.replace(/\D/g, '') : text.replace(/[^a-z0-9]/gi, ''))
    .toUpperCase()
    .slice(0, length)

/**
 * A one-time code, drawn as a box per character. It's one native input
 * underneath (`autocomplete="one-time-code"`), so SMS autofill, paste and
 * password managers work, and screen readers hear a single field. Label it
 * with a Field.
 *
 * ```tsx
 * <Field label="Verification code" description="We sent it to your phone.">
 *   <OtpField onComplete={verify} />
 * </Field>
 * ```
 */
export const OtpField = ({
  greese,
  length = 6,
  value: valueProp,
  defaultValue = '',
  onValueChange,
  onComplete,
  mode = 'numeric',
  mask,
  size = 'md',
  invalid,
  className,
  style,
  ref,
  id,
  required,
  disabled,
  onChange,
  onFocus,
  onBlur,
  'aria-describedby': describedBy,
  ...props
}: OtpFieldProps): JSX.Element => {
  const control = useFieldControl({
    id,
    invalid,
    required,
    disabled,
    'aria-describedby': describedBy,
  })
  const input = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  })

  const change = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event)
    const next = sanitizeOtp(event.target.value, length, mode)
    setValue(next)
    if (next.length === length && next !== value) onComplete?.(next)
  }

  // Typing always goes at the end: the boxes have no caret of their own.
  const toEnd = () => {
    const el = input.current
    if (el) el.setSelectionRange(el.value.length, el.value.length)
  }

  return withGreese(
    <div
      className={cx(
        'greese-OtpField',
        `greese-OtpField--size-${size}`,
        focused && 'greese-OtpField--focused',
        className
      )}
      style={style}
      data-invalid={control['aria-invalid']}
      data-disabled={control.disabled || undefined}
    >
      <input
        autoComplete="one-time-code"
        inputMode={mode === 'numeric' ? 'numeric' : 'text'}
        pattern={mode === 'numeric' ? `\\d{${length}}` : `[A-Za-z0-9]{${length}}`}
        spellCheck={false}
        autoCapitalize="characters"
        {...props}
        {...control}
        ref={composeRefs(input, ref)}
        type={mask ? 'password' : 'text'}
        maxLength={length}
        value={value}
        className="greese-OtpField-input"
        onChange={change}
        onSelect={toEnd}
        onFocus={(event) => {
          onFocus?.(event)
          setFocused(true)
          toEnd()
        }}
        onBlur={(event) => {
          onBlur?.(event)
          setFocused(false)
        }}
      />
      {Array.from({ length }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cx(
            'greese-OtpField-slot',
            focused &&
              (i === value.length || (i === length - 1 && value.length === length)) &&
              'greese-OtpField-slot--active'
          )}
        >
          {value[i] ? (mask ? '•' : value[i]) : ''}
        </span>
      ))}
    </div>,
    greese
  )
}
