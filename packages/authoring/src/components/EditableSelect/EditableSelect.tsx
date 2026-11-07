'use client'
import type { JSX } from 'react'
import { Combobox, cx, type ComboboxProps } from '@greese/react'

/** A preset the list offers. */
export interface EditableSelectOption<T> {
  /** The value it sets. */
  value: T
  /** How it reads in the list: "100%". */
  label: string
}

export interface EditableSelectProps<T = number> extends Omit<
  ComboboxProps,
  'value' | 'defaultValue' | 'onValueChange' | 'options' | 'label' | 'filter'
> {
  /** The field's accessible name; shown only when `hideLabel` is false. */
  label: string
  /** The current value. */
  value?: T
  /** Presets to pick from; typing any other value works too. */
  options?: readonly EditableSelectOption<T>[]
  /** Called with a picked preset, or a typed value that parses. */
  onChange: (value: T) => void
  /**
   * Reads typed text as a value, or `undefined` to refuse it (the field goes
   * back to the value). Without it, a positive whole number, units ignored.
   */
  parse?: (text: string) => T | undefined
  /** Writes a value as text. Without it, `String(value)`. */
  format?: (value: T) => string
}

const parseNumber = (text: string): number | undefined => {
  const n = parseInt(text.replace(/[^\d.-]/g, ''), 10)
  return Number.isNaN(n) || n <= 0 ? undefined : n
}

/**
 * A value to type or pick from presets: zoom, a grid's interval, a tween's
 * bound. A combobox with free text: the arrow keys open the presets, Enter or
 * leaving keeps what was typed if it parses, and anything else goes back.
 * Numbers by default; `parse` and `format` make it any type.
 *
 * ```tsx
 * <EditableSelect label="Zoom" value={100} options={unitOptions([50, 100, 200], '%')} onChange={setZoom} />
 * ```
 */
export const EditableSelect = <T = number,>({
  label,
  value,
  options = [],
  onChange,
  parse,
  format,
  hideLabel = true,
  size = 'xs',
  className,
  ...props
}: EditableSelectProps<T>): JSX.Element => {
  const toText = (v: T) => (format ? format(v) : String(v))
  const read = parse ?? (parseNumber as unknown as (text: string) => T | undefined)
  return (
    <Combobox
      {...props}
      className={cx('greese-EditableSelect', className)}
      label={label}
      hideLabel={hideLabel}
      size={size}
      allowCustomValue
      // Typing offers only the preset it names exactly, so a typed value is
      // never swapped for one that merely starts the same ("1" isn't "10%").
      // The arrow keys and the toggle open every preset.
      filter={(option, text) => {
        const typed = text.trim().toLowerCase()
        return (
          option.value.toLowerCase() === typed || option.label.toLowerCase() === typed
        )
      }}
      value={value === undefined ? null : toText(value)}
      options={options.map((o) => ({ value: toText(o.value), label: o.label }))}
      onValueChange={(text) => {
        if (text === null) return
        const preset = options.find((o) => toText(o.value) === text)
        const next = preset ? preset.value : read(text)
        if (next !== undefined) onChange(next)
      }}
    />
  )
}

/** The presets for a list of numbers in a unit. */
export const unitOptions = (
  values: readonly number[],
  units: string
): EditableSelectOption<number>[] =>
  values.map((value) => ({ value, label: `${value}${units}` }))
