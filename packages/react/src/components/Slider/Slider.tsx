'use client'
import type { ChangeEvent, ComponentPropsWithRef, CSSProperties, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { useFieldControl } from '../Field/Field.tsx'

export interface SliderProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'size' | 'value' | 'defaultValue'
> {
  value?: number
  defaultValue?: number
  /** @default 0 */
  min?: number
  /** @default 100 */
  max?: number
  /** @default 1 */
  step?: number
  onValueChange?: (value: number) => void
  invalid?: boolean
}

const FILL = '--sauce-slider-fill'
const fill = (value: number, min: number, max: number): string => {
  const ratio = max > min ? (Math.min(Math.max(value, min), max) - min) / (max - min) : 0
  // Rounded to 0.01%: finer is invisible and float noise ("55.00000000000001%")
  // would otherwise leak into the DOM.
  return `${Math.round(ratio * 10_000) / 100}%`
}

/**
 * A native range input: arrow keys, Page Up/Down, Home/End and touch dragging
 * all work as the platform defines. Label it with a Field or `aria-label`.
 *
 * The filled part of the track is one CSS variable, written straight to the
 * element while dragging: no React re-render per step when uncontrolled.
 */
export const Slider = ({
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  onChange,
  invalid,
  className,
  style,
  id,
  required,
  disabled,
  'aria-describedby': describedBy,
  ...props
}: SliderProps): JSX.Element => {
  const control = useFieldControl({
    id,
    invalid,
    required,
    disabled,
    'aria-describedby': describedBy,
  })
  const initial = value ?? defaultValue ?? (min + max) / 2
  return (
    <input
      {...props}
      {...control}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      defaultValue={value === undefined ? initial : undefined}
      className={cx('sauce-Slider', className)}
      style={{ [FILL]: fill(initial, min, max), ...style } as CSSProperties}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        const next = event.target.valueAsNumber
        event.target.style.setProperty(FILL, fill(next, min, max))
        onChange?.(event)
        onValueChange?.(next)
      }}
    />
  )
}
