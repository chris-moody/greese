'use client'
import {
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type CSSProperties,
  type JSX,
} from 'react'
import { cx } from '../../utils/cx.ts'
import type { ControlSize } from '../Button/Button.tsx'
import { useFieldControl } from '../Field/Field.tsx'
import { Tooltip } from '../Tooltip/Tooltip.tsx'
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
   * A bubble above the thumb showing the value: `auto` while the slider is
   * hovered, focused or being dragged, `always` for one that never hides, or
   * `off`. Off by default, because showing the value means re-rendering as the
   * thumb moves, which a slider otherwise avoids.
   * @default 'off'
   */
  valueLabel?: 'auto' | 'always' | 'off'
  /**
   * A unit shown after the value in the bubble, and spoken with it: `%`, `px`,
   * `°`. @default ''
   */
  unit?: string
  /**
   * The thumb's size and the track's thickness: `xs` through `xl`, matching
   * every other control so a row of them lines up. @default 'md'
   */
  size?: ControlSize
  /**
   * Marks it invalid and colors it as an error. A surrounding Field's `error`
   * sets it too.
   */
  invalid?: boolean
}

const FILL = '--greese-slider-fill'
const RATIO = '--greese-slider-ratio'

/** The two variables the track's gradient and the bubble's anchor read. */
const track = (
  value: number,
  min: number,
  max: number
): Record<string, string | number> => ({
  [FILL]: `${ratioOf(value, min, max) * 100}%`,
  [RATIO]: ratioOf(value, min, max),
})

const ratioOf = (value: number, min: number, max: number): number => {
  const ratio = max > min ? (Math.min(Math.max(value, min), max) - min) / (max - min) : 0
  // Rounded to 0.0001: finer is invisible and float noise
  // ("0.5500000000000001") would otherwise leak into the DOM.
  return Math.round(ratio * 10_000) / 10_000
}

/**
 * A native range input: arrow keys, Page Up/Down, Home/End and touch dragging
 * all work as the platform defines. Label it with a Field or `aria-label`.
 *
 * The filled part of the track is one CSS variable, written straight to the
 * element while dragging: no React re-render per step when uncontrolled.
 *
 * ```tsx
 * <Field label="Volume">
 *   <Slider name="volume" defaultValue={40} />
 * </Field>
 * ```
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
  valueLabel = 'off',
  unit = '',
  size = 'md',
  invalid,
  className,
  style,
  id,
  required,
  disabled,
  'aria-describedby': describedBy,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onPointerUp,
  onFocus,
  onBlur,
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
  const labelled = valueLabel !== 'off'
  // With a bubble the two variables go on the wrapper, not the input: a
  // custom property inherits down, and the bubble's anchor is the input's
  // sibling, so it could not read them from the input itself.
  const wrap = useRef<HTMLSpanElement>(null)

  // Only tracked when there is a bubble to put it in: the point of writing the
  // fill straight to the element is that an uncontrolled slider does not
  // re-render per step, and a label gives that up.
  const [shown, setShown] = useState(initial)
  const [active, setActive] = useState(false)
  const current = value ?? shown
  const text = `${current}${unit}`

  const input = withGreese(
    <input
      {...props}
      {...control}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      defaultValue={value === undefined ? initial : undefined}
      // The bubble is presentational, so the value it shows is spoken from
      // here instead — with its unit, which `aria-valuenow` cannot carry.
      aria-valuetext={unit ? text : undefined}
      className={cx('greese-Slider', `greese-Slider--size-${size}`, className)}
      style={
        {
          ...(labelled ? undefined : track(initial, min, max)),
          ...style,
        } as CSSProperties
      }
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        const next = event.target.valueAsNumber
        const ratio = ratioOf(next, min, max)
        const host = labelled ? wrap.current : event.target
        host?.style.setProperty(FILL, `${ratio * 100}%`)
        host?.style.setProperty(RATIO, String(ratio))
        if (labelled) setShown(next)
        onChange?.(event)
        onValueChange?.(next)
      }}
      onPointerDown={(event) => {
        if (labelled) setActive(true)
        onPointerDown?.(event)
      }}
      onPointerEnter={(event) => {
        if (labelled && event.pointerType === 'mouse') setActive(true)
        onPointerEnter?.(event)
      }}
      onPointerLeave={(event) => {
        // A finger leaves as it lifts; only a mouse leaving ends the drag.
        if (labelled && event.pointerType === 'mouse') setActive(false)
        onPointerLeave?.(event)
      }}
      onPointerUp={(event) => {
        if (labelled && event.pointerType !== 'mouse') setActive(false)
        onPointerUp?.(event)
      }}
      onFocus={(event) => {
        if (labelled) setActive(true)
        onFocus?.(event)
      }}
      onBlur={(event) => {
        if (labelled) setActive(false)
        onBlur?.(event)
      }}
    />,
    // The slider is the component's own box in both shapes, so the `greese`
    // prop animates the same element whether or not there is a bubble.
    greese
  )

  if (!labelled) return input

  return (
    <span
      ref={wrap}
      className="greese-Slider-wrap"
      style={track(initial, min, max) as CSSProperties}
    >
      {input}
      {/*
        The tooltip hangs off a zero-size span sitting at the thumb, not off
        the input, so the bubble follows the value instead of floating over
        the middle of the track. The span needs no focus or hover of its own
        because `open` is driven from here — which is also why a tooltip may
        anchor to something unfocusable in this one case.
      */}
      <Tooltip
        content={text}
        open={valueLabel === 'always' || active}
        describe={false}
        placement="top"
      >
        <span className="greese-Slider-thumbAnchor" aria-hidden="true" />
      </Tooltip>
    </span>
  )
}
