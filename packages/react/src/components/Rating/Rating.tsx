'use client'
import {
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type JSX,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { useControllableState } from '../../hooks/useControllableState.ts'
import { cx } from '../../utils/cx.ts'
import { StarGlyph } from '../../utils/glyphs.tsx'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'
import type { ControlSize } from '../Button/Button.tsx'

export interface RatingProps
  extends
    GreeseProps,
    Omit<ComponentPropsWithRef<'fieldset'>, 'onChange' | 'defaultValue'> {
  /** Names the rating ("Your rating"). Hidden visually unless `hideLabel={false}`. */
  label: ReactNode
  /** Keep the label for screen readers but hide it on screen. @default true */
  hideLabel?: boolean
  /** Shared `name` for form submission; generated when omitted. */
  name?: string
  /** The rating, when you control it: 0 is none. Read-only ratings take any fraction (4.3). */
  value?: number
  /** The rating at first, when it keeps its own state. 0 is none. */
  defaultValue?: number
  /** Called with the new rating when the user chooses one (0 when cleared). */
  onValueChange?: (value: number) => void
  /** How many stars. @default 5 */
  max?: number
  /**
   * The smallest choice: whole stars, halves or quarters. Arrow keys move by
   * it, and pointing or dragging snaps to it.
   * @default 1
   */
  step?: 1 | 0.5 | 0.25
  /** Show a value, not ask for one: an image named "3.5 out of 5". */
  readOnly?: boolean
  /** Choosing the current rating again clears it to 0. @default false */
  allowClear?: boolean
  /** A rating must be chosen before the form submits. */
  required?: boolean
  /** Star size: `sm`, `md` or `lg`. On touch screens the row is at least 44px tall. @default 'md' */
  size?: ControlSize
  /** Replaces the star. Filled with `currentColor`. */
  icon?: ReactNode
  /** How each choice is read: `(n, max) => "3.5 stars"`. */
  getItemLabel?: (value: number, max: number) => string
}

const itemLabel = (n: number) => `${n} star${n === 1 ? '' : 's'}`

/**
 * The value under a point along the stars, rounded up to `step`: pointing
 * anywhere inside the third star of five, with whole steps, is 3.
 */
export const ratingAt = (fraction: number, max: number, step: number): number => {
  const raw = Math.min(1, Math.max(0, fraction)) * max
  return Math.min(max, Math.max(step, Math.ceil(raw / step - 1e-9) * step))
}

/**
 * A star rating on native radios: arrow keys change it and it submits with
 * forms. Whole, half or quarter stars (`step`); pointing previews a choice
 * and dragging scrubs, on touch too. `readOnly` displays any value exactly.
 *
 * ```tsx
 * <Rating label="Your rating" step={0.5} defaultValue={3.5} onValueChange={save} />
 * <Rating label="Average" readOnly value={4.3} />
 * ```
 */
export const Rating = ({
  greese,
  label,
  hideLabel = true,
  name,
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  max = 5,
  step = 1,
  readOnly,
  allowClear,
  required,
  size = 'md',
  icon = <StarGlyph />,
  getItemLabel = itemLabel,
  className,
  style,
  disabled,
  ...props
}: RatingProps): JSX.Element => {
  const generated = useId()
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange: onValueChange,
  })
  const [hover, setHover] = useState<number>()
  const dragged = useRef(false)
  // When touch last committed a value: the nudged click after it is ignored.
  const touched = useRef(0)
  const fromTouch = () => Date.now() - touched.current < 700
  const shown = Math.min(max, Math.max(0, hover ?? value))

  const stars = (
    // Two rows of icons; the filled one is clipped to the value.
    <span className="greese-Rating-stars" aria-hidden="true">
      {(['empty', 'filled'] as const).map((layer) => (
        <span key={layer} className={`greese-Rating-${layer}`}>
          {Array.from({ length: max }, (_, i) => (
            <span key={i} className="greese-Rating-icon">
              {icon}
            </span>
          ))}
        </span>
      ))}
    </span>
  )
  const fill = {
    '--greese-rating-fill': `${(shown / max) * 100}%`,
    ...style,
  } as CSSProperties
  const classes = cx('greese-Rating', `greese-Rating--${size}`, className)

  if (readOnly) {
    return withGreese(
      <div
        {...(props as Record<string, unknown>)}
        role="img"
        aria-label={`${typeof label === 'string' ? `${label}: ` : ''}${shown} out of ${max}`}
        className={cx(classes, 'greese-Rating--readonly')}
        style={fill}
      >
        {stars}
      </div>,
      greese
    )
  }

  // The value under the pointer, from its position along the row.
  const pointed = (event: PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
    const x = (event.clientX - box.left) / box.width
    return ratingAt(rtl ? 1 - x : x, max, step)
  }
  const values = Array.from({ length: Math.round(max / step) }, (_, i) => (i + 1) * step)

  return withGreese(
    <fieldset {...props} disabled={disabled} className={classes} style={fill}>
      <legend className={hideLabel ? 'greese-VisuallyHidden' : 'greese-Field-label'}>
        {label}
      </legend>
      <div
        className="greese-Rating-items"
        onPointerMove={(event) => {
          if (disabled) return
          if (event.pointerType === 'mouse' || event.buttons) {
            dragged.current ||= event.pointerType !== 'mouse' && event.buttons > 0
            setHover(pointed(event))
          }
        }}
        onPointerDown={(event) => {
          if (event.pointerType !== 'mouse') dragged.current = false
        }}
        onPointerUp={(event) => {
          if (disabled || event.pointerType === 'mouse') return
          // Touch and pen commit where the finger lifts, tap or drag. Their
          // own coordinates, not the click that follows: browsers nudge taps
          // to a "best" nearby target, unreliable with slices this thin.
          const n = pointed(event)
          setValue(allowClear && !dragged.current && n === value ? 0 : n)
          touched.current = Date.now()
          dragged.current = false
          setHover(undefined)
        }}
        onPointerLeave={() => setHover(undefined)}
      >
        {stars}
        <span className="greese-Rating-choices">
          {values.map((n) => (
            <label key={n} className="greese-Rating-choice">
              <input
                type="radio"
                className="greese-Rating-input"
                name={name ?? generated}
                value={n}
                required={required}
                checked={value === n}
                onChange={() => {
                  if (!fromTouch()) setValue(n)
                }}
                onClick={() => {
                  // A click on the checked radio fires no change event.
                  if (allowClear && value === n && !fromTouch()) setValue(0)
                }}
              />
              <span className="greese-VisuallyHidden">{getItemLabel(n, max)}</span>
            </label>
          ))}
        </span>
      </div>
    </fieldset>,
    greese
  )
}
