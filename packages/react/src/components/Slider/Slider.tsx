'use client'
import type { ChangeEvent, ComponentPropsWithRef, CSSProperties, JSX } from 'react'
import { cx } from '../../utils/cx.ts'
import { useFieldControl } from '../Field/Field.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface SliderProps
  extends
    GreeseProps,
    Omit<ComponentPropsWithRef<'input'>, 'type' | 'size' | 'value' | 'defaultValue'> {
  /** The value, when you control it. Pair with `onValueChange`. */
  value?: number
  /** The starting value, when it keeps its own state. */
  defaultValue?: number
  /** The value at the inline start. @default 0 */
  min?: number
  /** The value at the inline end. @default 100 */
  max?: number
  /** The increment the arrow keys and dragging snap to. @default 1 */
  step?: number
  /** Called with the new value as it moves. */
  onValueChange?: (value: number) => void
  /**
   * Marks it invalid and colours it as an error. A surrounding Field's `error`
   * sets it too.
   */
  invalid?: boolean
}

const FILL = '--greese-slider-fill'
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
  greese,
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
  return withGreese(
    <input
      {...props}
      {...control}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      defaultValue={value === undefined ? initial : undefined}
      className={cx('greese-Slider', className)}
      style={{ [FILL]: fill(initial, min, max), ...style } as CSSProperties}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        const next = event.target.valueAsNumber
        event.target.style.setProperty(FILL, fill(next, min, max))
        onChange?.(event)
        onValueChange?.(next)
      }}
    />,
    greese
  )
}
