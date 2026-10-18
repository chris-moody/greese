'use client'
import { useLayoutEffect, useRef, useState, type ChangeEvent, type JSX } from 'react'
import { Input, type InputProps } from '../Input/Input.tsx'
import { composeRefs } from '../Slot/Slot.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

/**
 * Mask placeholders. Every other character in a mask is a literal, written
 * for the user: the parentheses and dash of `(999) 999-9999`.
 */
const TOKENS: Readonly<Record<string, RegExp>> = {
  '9': /\d/, // a digit
  a: /[a-z]/i, // a letter
  A: /[a-z]/i,
  h: /[\da-f]/i, // a hex digit
  H: /[\da-f]/i,
  '*': /[\da-z]/i, // a letter or digit
}

const tokenAt = (mask: string, i: number): RegExp | undefined => TOKENS[mask[i] ?? '']
const fitsAnyToken = (mask: string, c: string): boolean =>
  [...mask].some((m) => TOKENS[m]?.test(c))

/**
 * Formats raw characters against a mask. Unfilled placeholders become
 * `maskChar`; raw characters that fit no placeholder are skipped.
 *
 * ```ts
 * applyMask('5551234', '(999) 999-9999') // '(555) 123-4___'
 * ```
 */
export const applyMask = (raw: string, mask: string, maskChar = '_'): string => {
  let out = ''
  let r = 0
  for (let i = 0; i < mask.length; i++) {
    const token = tokenAt(mask, i)
    if (!token) {
      out += mask[i]
      continue
    }
    while (r < raw.length && !token.test(raw[r]!)) r++
    out += r < raw.length ? raw[r++] : maskChar
  }
  return out
}

/**
 * The raw characters of a masked value: only what sits in placeholder
 * positions, so literals that are also valid input (the 1 in `+1 999`) are
 * never mistaken for typing.
 *
 * ```ts
 * unmask('(555) 123-4___', '(999) 999-9999') // '5551234'
 * ```
 */
export const unmask = (masked: string, mask: string, maskChar = '_'): string => {
  let raw = ''
  for (let i = 0; i < Math.min(masked.length, mask.length); i++) {
    const c = masked[i]!
    if (tokenAt(mask, i) && c !== maskChar) raw += c
  }
  return raw
}

/** Whether every placeholder in the mask is filled by `raw`. */
export const isMaskComplete = (raw: string, mask: string, maskChar = '_'): boolean =>
  !applyMask(raw, mask, maskChar)
    .split('')
    .some((c, i) => c === maskChar && tokenAt(mask, i))

/** Index just after the `count`-th placeholder (0 → the first placeholder). */
const caretAfter = (mask: string, count: number, skipLiterals: boolean): number => {
  let seen = 0
  let i = 0
  for (; i < mask.length && seen < count; i++) if (tokenAt(mask, i)) seen++
  if (count === 0 || skipLiterals) while (i < mask.length && !tokenAt(mask, i)) i++
  return i
}

/** Placeholders filled before index `end`. */
const filledBefore = (display: string, mask: string, maskChar: string, end: number) =>
  unmask(display.slice(0, end), mask.slice(0, end), maskChar).length

/**
 * The raw value after an edit, found by diffing the new text against the old
 * display: what was typed or pasted lands between the untouched raw
 * characters on either side. Deleting only literals (Backspace just after a
 * dash) removes the placeholder character next to them instead.
 */
const applyEdit = (
  prev: string,
  next: string,
  mask: string,
  maskChar: string,
  backward: boolean
): { raw: string; caretCount: number; inserted: boolean } => {
  let start = 0
  while (start < prev.length && start < next.length && prev[start] === next[start])
    start++
  let prevEnd = prev.length
  let nextEnd = next.length
  while (prevEnd > start && nextEnd > start && prev[prevEnd - 1] === next[nextEnd - 1]) {
    prevEnd--
    nextEnd--
  }
  const prevRaw = unmask(prev, mask, maskChar)
  let before = filledBefore(prev, mask, maskChar, start)
  let after = prevRaw.length - filledBefore(prev, mask, maskChar, prevEnd)
  const typed = [...next.slice(start, nextEnd)]
    .filter((c) => c !== maskChar && fitsAnyToken(mask, c))
    .join('')

  const deletedNothing = before + after === prevRaw.length
  if (!typed && prevEnd > start && deletedNothing) {
    if (backward && before > 0) before--
    else if (!backward && after > 0) after--
  }
  return {
    raw: prevRaw.slice(0, before) + typed + prevRaw.slice(prevRaw.length - after),
    caretCount: before + typed.length,
    inserted: typed.length > 0,
  }
}

export interface MaskedInputProps
  extends GreeseProps, Omit<InputProps, 'value' | 'defaultValue' | 'maxLength'> {
  /**
   * The pattern. Placeholders: `9` a digit, `a`/`A` a letter, `h`/`H` a hex
   * digit, `*` a letter or digit. Anything else is a literal the user never
   * types: `(999) 999-9999`, `#hhhhhh`, `AA-9999`.
   */
  mask: string
  /** Shown in unfilled placeholders. @default '_' */
  maskChar?: string
  /** The raw value (placeholder characters only), controlled. */
  value?: string
  /** The raw value, uncontrolled. */
  defaultValue?: string
  /** Called with the raw value and the formatted text on every edit. */
  onValueChange?: (raw: string, masked: string) => void
}

/**
 * A text input that formats as you type against a pattern: phone numbers,
 * card numbers, codes. Value in and out is the raw characters; the user sees
 * and edits the formatted text, and the caret skips over literals.
 *
 * ```tsx
 * <Field label="Phone">
 *   <MaskedInput mask="(999) 999-9999" placeholder="(555) 123-4567" />
 * </Field>
 * ```
 *
 * The phone keypad opens for digit-only masks. In a form, the field submits
 * the formatted text; read the raw value from `onValueChange` if you need it.
 */
export const MaskedInput = ({
  greese,
  mask,
  maskChar = '_',
  value,
  defaultValue = '',
  onValueChange,
  onChange,
  inputMode,
  ref,
  ...props
}: MaskedInputProps): JSX.Element => {
  const [ownRaw, setOwnRaw] = useState(defaultValue)
  const raw = value ?? ownRaw
  // Empty shows the placeholder (or nothing), not a row of mask characters.
  const display = raw ? applyMask(raw, mask, maskChar) : ''
  const inputRef = useRef<HTMLInputElement>(null)
  const pendingCaret = useRef<number | null>(null)
  const digitsOnly = [...mask].every((m) => !TOKENS[m] || m === '9')

  // React puts the caret at the end on a controlled update; put it back.
  useLayoutEffect(() => {
    const input = inputRef.current
    if (pendingCaret.current === null || !input || document.activeElement !== input)
      return
    input.setSelectionRange(pendingCaret.current, pendingCaret.current)
    pendingCaret.current = null
  })

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputType = (event.nativeEvent as InputEvent).inputType ?? ''
    const edit = applyEdit(
      display,
      event.target.value,
      mask,
      maskChar,
      inputType !== 'deleteContentForward'
    )
    // Through the mask and back: drops characters that fit no position and
    // anything beyond the last placeholder.
    const nextRaw = unmask(applyMask(edit.raw, mask, maskChar), mask, maskChar)
    const masked = nextRaw ? applyMask(nextRaw, mask, maskChar) : ''
    const caretCount = Math.min(edit.caretCount, nextRaw.length)
    pendingCaret.current = masked ? caretAfter(mask, caretCount, edit.inserted) : 0
    if (value === undefined) setOwnRaw(nextRaw)
    onChange?.(event)
    onValueChange?.(nextRaw, masked)
    // Unchanged raw (a rejected character): no re-render will restore the text.
    if (nextRaw === raw) {
      event.target.value = display
      const at = display ? caretAfter(mask, caretCount, false) : 0
      event.target.setSelectionRange(at, at)
      pendingCaret.current = null
    }
  }

  return withGreese(
    <Input
      autoComplete="off"
      {...props}
      ref={composeRefs(inputRef, ref)}
      inputMode={inputMode ?? (digitsOnly ? 'numeric' : undefined)}
      value={display}
      onChange={handleChange}
    />,
    greese
  )
}
