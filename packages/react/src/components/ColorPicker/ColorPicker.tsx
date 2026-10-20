'use client'
import {
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type JSX,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { cx } from '../../utils/cx.ts'
import { MaskedInput } from '../MaskedInput/MaskedInput.tsx'
import {
  formatHex,
  hsvToRgb,
  parseHex,
  rgbToHsv,
  type HsvColor,
  type RgbColor,
} from './colorMath.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'

export interface ColorPickerProps
  extends GreeseProps, Omit<ComponentPropsWithRef<'div'>, 'defaultValue' | 'onChange'> {
  /** Hex color (`#rrggbb`, or `#rrggbbaa` with transparency), controlled. */
  value?: string
  /** Hex color, uncontrolled. @default '#3b82f6' */
  defaultValue?: string
  /** Called on every change with the hex color and its channels. */
  onValueChange?: (hex: string, color: RgbColor) => void
  /** Show the opacity slider; values gain an alpha pair when below 100%. */
  alpha?: boolean
  /** Preset colors offered as one-tap swatches. */
  swatches?: readonly string[]
  /** Name for the whole picker. @default 'Color' */
  label?: string
  /** Disables every part of the picker. */
  disabled?: boolean
}

const fromHex = (hex: string | undefined, hue = 0): HsvColor =>
  rgbToHsv(parseHex(hex ?? '') ?? { r: 59, g: 130, b: 246, a: 1 }, hue)
const toHex = (hsv: HsvColor, alpha: boolean): string =>
  formatHex({ ...hsvToRgb(hsv), a: alpha ? hsv.a : 1 })
const pct = (n: number): string => `${Math.round(n * 100)}%`
const clamp01 = (n: number): number => Math.min(Math.max(n, 0), 1)

/**
 * Picks a color: a saturation/brightness area, a hue slider, an optional
 * opacity slider, a hex field and preset swatches. Drag works with mouse, pen
 * and touch; every part works from the keyboard.
 *
 * ```tsx
 * <ColorPicker defaultValue="#e11d48" swatches={brand} onValueChange={setColor} />
 * ```
 *
 * For a compact field, put it in a Popover with a swatch button as trigger.
 */
export const ColorPicker = ({
  greese,
  value,
  defaultValue = '#3b82f6',
  onValueChange,
  alpha = false,
  swatches,
  label = 'Color',
  disabled,
  className,
  style,
  ...props
}: ColorPickerProps): JSX.Element => {
  const [hsv, setHsv] = useState(() => fromHex(value ?? defaultValue))
  // Follow a controlled value, unless it is the color we just reported (so
  // the hue survives a round trip through a grey).
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    if (value !== undefined && value.toLowerCase() !== toHex(hsv, alpha)) {
      setHsv(fromHex(value, hsv.h))
    }
  }
  const hex = toHex(hsv, alpha)
  const [draft, setDraft] = useState<string | null>(null)

  const update = (patch: Partial<HsvColor>) => {
    if (disabled) return
    const next = { ...hsv, ...patch }
    setHsv(next)
    setDraft(null)
    const nextHex = toHex(next, alpha)
    setSeen(value === undefined ? undefined : nextHex)
    onValueChange?.(nextHex, { ...hsvToRgb(next), a: alpha ? next.a : 1 })
  }
  const setFromHex = (input: string) => {
    const rgb = parseHex(input)
    if (rgb) update(rgbToHsv({ ...rgb, a: alpha ? rgb.a : 1 }, hsv.h))
  }

  // The area is one 2D control: pointer capture keeps a drag going outside it.
  const areaFrom = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    update({
      s: clamp01((event.clientX - rect.left) / rect.width),
      v: clamp01(1 - (event.clientY - rect.top) / rect.height),
    })
  }
  const areaKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 0.1 : 0.01
    const moves: Record<string, Partial<HsvColor>> = {
      ArrowLeft: { s: clamp01(hsv.s - step) },
      ArrowRight: { s: clamp01(hsv.s + step) },
      ArrowUp: { v: clamp01(hsv.v + step) },
      ArrowDown: { v: clamp01(hsv.v - step) },
      Home: { s: 0 },
      End: { s: 1 },
      PageUp: { v: 1 },
      PageDown: { v: 0 },
    }
    const move = moves[event.key]
    if (!move) return
    event.preventDefault()
    update(move)
  }

  const opaque = toHex({ ...hsv, a: 1 }, false)
  return withGreese(
    <div
      role="group"
      aria-label={label}
      {...props}
      className={cx('greese-ColorPicker', className)}
      data-disabled={disabled || undefined}
      style={
        {
          '--greese-colorpicker-hue': hsv.h,
          '--greese-colorpicker-color': opaque,
          '--greese-colorpicker-x': pct(hsv.s),
          '--greese-colorpicker-y': pct(1 - hsv.v),
          '--greese-colorpicker-current': hex,
          ...style,
        } as CSSProperties
      }
    >
      <div
        className="greese-ColorPicker-area"
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label="Saturation and brightness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv.s * 100)}
        aria-valuetext={`Saturation ${pct(hsv.s)}, brightness ${pct(hsv.v)}`}
        aria-disabled={disabled || undefined}
        onKeyDown={areaKeys}
        onPointerDown={(event) => {
          if (disabled || event.button !== 0) return
          event.currentTarget.setPointerCapture(event.pointerId)
          event.currentTarget.focus({ preventScroll: true })
          areaFrom(event)
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) areaFrom(event)
        }}
      >
        <span className="greese-ColorPicker-thumb" aria-hidden="true" />
      </div>

      <div className="greese-ColorPicker-controls">
        <span className="greese-ColorPicker-preview" aria-hidden="true" />
        <div className="greese-ColorPicker-sliders">
          <input
            type="range"
            className="greese-ColorPicker-hue"
            aria-label="Hue"
            min={0}
            max={359}
            value={Math.round(hsv.h) % 360}
            aria-valuetext={`${Math.round(hsv.h)} degrees`}
            disabled={disabled}
            onChange={(event) => update({ h: event.target.valueAsNumber })}
          />
          {alpha && (
            <input
              type="range"
              className="greese-ColorPicker-alpha"
              aria-label="Opacity"
              min={0}
              max={100}
              value={Math.round(hsv.a * 100)}
              aria-valuetext={pct(hsv.a)}
              disabled={disabled}
              onChange={(event) => update({ a: event.target.valueAsNumber / 100 })}
            />
          )}
        </div>
      </div>

      <MaskedInput
        className="greese-ColorPicker-hex"
        size="sm"
        aria-label="Hex color"
        mask="hhhhhh"
        maskChar=" "
        spellCheck={false}
        disabled={disabled}
        startAdornment="#"
        value={draft ?? hex.slice(1, 7)}
        onValueChange={(raw) => {
          if (raw.length === 6) setFromHex(raw + (alpha ? hex.slice(7) : ''))
          else setDraft(raw)
        }}
        onBlur={() => {
          if (draft?.length === 3) setFromHex(draft)
          setDraft(null)
        }}
      />

      {swatches && swatches.length > 0 && (
        <div className="greese-ColorPicker-swatches" role="group" aria-label="Presets">
          {swatches.map((swatch) => (
            <button
              key={swatch}
              type="button"
              className="greese-ColorPicker-swatch"
              style={{ '--greese-colorpicker-swatch': swatch } as CSSProperties}
              aria-label={swatch}
              aria-pressed={swatch.toLowerCase() === hex}
              disabled={disabled}
              onClick={() => setFromHex(swatch)}
            />
          ))}
        </div>
      )}
    </div>,
    greese
  )
}

export { formatHex, hsvToRgb, parseHex, rgbToHsv, type HsvColor, type RgbColor }
