'use client'
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type JSX,
  type KeyboardEvent,
} from 'react'
import { useControllableState } from '../../hooks/useControllableState.ts'
import { cx } from '../../utils/cx.ts'
import { MinusIcon, PlusIcon } from '@greese/icons'
import { composeRefs } from '../Slot/Slot.tsx'
import { TextField, type TextFieldProps } from '../TextField/TextField.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface NumberFieldProps
  extends
    GreeseProps,
    Omit<
      TextFieldProps,
      | 'type'
      | 'value'
      | 'defaultValue'
      | 'onChange'
      | 'endAdornment'
      | 'inputMode'
      | 'min'
      | 'max'
      | 'step'
    > {
  /** The number, when you control it; `null` when empty. Pair with `onValueChange`. */
  value?: number | null
  /** The starting number, when it keeps its own state; `null` for empty. */
  defaultValue?: number | null
  /** Called with the committed number, or `null` when cleared. */
  onValueChange?: (value: number | null) => void
  /** The lowest allowed value. Typed values are clamped to it on blur or Enter. */
  min?: number
  /** The highest allowed value. Typed values are clamped to it on blur or Enter. */
  max?: number
  /** Arrow keys and buttons move by this; values snap to it from `min`. @default 1 */
  step?: number
  /** Page Up / Page Down move by this. @default step × 10 */
  largeStep?: number
  /** Accessible name of the plus button. @default 'Increase' */
  incrementLabel?: string
  /** Accessible name of the minus button. @default 'Decrease' */
  decrementLabel?: string
}

const decimalsOf = (n: number) => (String(n).split('.')[1] ?? '').length

/** Parses user input: accepts a decimal comma; empty is `null`, junk is `NaN`. */
export const parseNumber = (text: string): number | null => {
  const trimmed = text.trim().replace(',', '.')
  if (trimmed === '') return null
  return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(trimmed) ? Number(trimmed) : NaN
}

/**
 * A number input with steppers, per the WAI-ARIA spinbutton pattern: a text
 * input (`inputMode="decimal"`, so phones show a number pad) rather than
 * `type="number"`, which scrolls values on wheel and mishandles locales.
 *
 * Arrow keys step, Page Up/Down step by `largeStep`, Home/End jump to
 * `min`/`max`. Typed values are clamped on blur or Enter; anything that isn't
 * a number reverts to the last valid value.
 *
 * ```tsx
 * <NumberField label="Guests" name="guests" min={1} max={12} defaultValue={2} />
 * ```
 */
export const NumberField = ({
  greese,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  min,
  max,
  step = 1,
  largeStep = step * 10,
  incrementLabel = 'Increase',
  decrementLabel = 'Decrease',
  className,
  onKeyDown,
  onBlur,
  onFocus,
  ref,
  disabled,
  readOnly,
  ...props
}: NumberFieldProps): JSX.Element => {
  const [value, setValue] = useControllableState<number | null>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  })
  const decimals = Math.max(decimalsOf(step), decimalsOf(min ?? 0))
  const format = (n: number | null) =>
    n === null ? '' : String(Number(n.toFixed(decimals)))
  const [text, setText] = useState(() => format(value))
  const [editing, setEditing] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  // Follow outside changes (controlled value) unless the user is mid-edit.
  // `editing` is a dependency so this also runs the moment the field is left:
  // a controlled parent may have declined what was committed (a cleared field
  // where empty means nothing, a value it clamps itself), and the text has to
  // go back to the value actually in force rather than sit there stale.
  useEffect(() => {
    if (!editing && document.activeElement !== input.current) {
      setText(value === null ? '' : String(Number(value.toFixed(decimals))))
    }
  }, [value, decimals, editing])

  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n))
  const snap = (n: number) => {
    const origin = min ?? 0
    return Number((Math.round((n - origin) / step) * step + origin).toFixed(decimals))
  }

  const apply = (next: number | null) => {
    setValue(next)
    setText(format(next))
  }

  const commit = () => {
    const parsed = parseNumber(text)
    if (Number.isNaN(parsed)) setText(format(value))
    else apply(parsed === null ? null : clamp(parsed))
  }

  const stepBy = (delta: number) => {
    const typed = parseNumber(text)
    const base = typed === null || Number.isNaN(typed) ? (value ?? min ?? 0) : typed
    apply(clamp(snap(base + delta)))
  }

  const locked = disabled || readOnly
  const atMin = value !== null && min !== undefined && value <= min
  const atMax = value !== null && max !== undefined && value >= max

  const stepper = (
    delta: number,
    label: string,
    blocked: boolean,
    glyph: JSX.Element
  ) => (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      disabled={locked || blocked}
      className="greese-NumberField-step"
      // Keep focus in the input while clicking.
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        stepBy(delta)
        input.current?.focus()
      }}
    >
      {glyph}
    </button>
  )

  return withGreese(
    <TextField
      {...props}
      ref={composeRefs(input, ref)}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      role="spinbutton"
      aria-valuenow={value ?? undefined}
      aria-valuemin={min}
      aria-valuemax={max}
      disabled={disabled}
      readOnly={readOnly}
      value={text}
      className={cx('greese-NumberField', className)}
      onChange={(event: ChangeEvent<HTMLInputElement>) => setText(event.target.value)}
      onFocus={(event: FocusEvent<HTMLInputElement>) => {
        setEditing(true)
        onFocus?.(event)
      }}
      onBlur={(event: FocusEvent<HTMLInputElement>) => {
        commit()
        setEditing(false)
        onBlur?.(event)
      }}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(event)
        if (event.defaultPrevented || locked) return
        const keys: Record<string, (() => void) | undefined> = {
          ArrowUp: () => stepBy(step),
          ArrowDown: () => stepBy(-step),
          PageUp: () => stepBy(largeStep),
          PageDown: () => stepBy(-largeStep),
          Home: min !== undefined ? () => apply(min) : undefined,
          End: max !== undefined ? () => apply(max) : undefined,
          Enter: commit,
        }
        const action = keys[event.key]
        if (!action) return
        if (event.key !== 'Enter') event.preventDefault()
        action()
      }}
      endAdornment={
        <span className="greese-NumberField-steppers">
          {stepper(-step, decrementLabel, atMin, <MinusIcon />)}
          {stepper(step, incrementLabel, atMax, <PlusIcon />)}
        </span>
      }
    />,
    greese
  )
}
