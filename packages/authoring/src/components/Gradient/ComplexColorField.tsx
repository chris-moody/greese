'use client'
import { useId, type JSX } from 'react'
import { ColorPicker, cx, EditableField, type ColorChannelSet } from '@greese/react'
import { withPaintType, type ComplexColorValue } from '../../core/paint/gradient.ts'
import { GradientEditor } from './GradientEditor.tsx'

export interface ComplexColorFieldProps {
  /** The field's name, above it: "Fill", "Stroke". */
  label: string
  /** The paint: a solid color, a gradient, or none. */
  value: ComplexColorValue
  /** Called with the changed paint. */
  onChange: (value: ComplexColorValue) => void
  /** Offers None, for a fill or stroke that may be left off. Only for a value whose renderer draws `none`. */
  allowNone?: boolean
  /** Offers Gradient. Off for a renderer whose paint is only a color. @default true */
  allowGradient?: boolean
  /**
   * Offers Current, the color of the text around it: a solid
   * `currentColor`, as SVG icons paint. Only for a renderer that has one.
   */
  allowCurrentColor?: boolean
  /** Stops every change and dims it. */
  disabled?: boolean
  /** Colors offered as one-tap swatches in the picker. */
  swatches?: readonly string[]
  /** Lets the reader save and clear swatches. */
  onSwatchesChange?: (swatches: readonly string[]) => void
  /** Numeric channel fields in the picker. @default ['hsb', 'rgb'] */
  channels?: readonly ColorChannelSet[]
  /**
   * Shows the solid color's picker in place, not behind a swatch: for a field
   * that already sits in a popover, which shouldn't open another.
   */
  inlinePicker?: boolean
  /** The kinds' names, translated or shortened. @default { solid: 'Solid', gradient: 'Gradient', none: 'None', current: 'Current' } */
  kindLabels?: { solid?: string; gradient?: string; none?: string; current?: string }
  /** Keeps `label` as the group's name but doesn't show it: for a row that names it already. */
  hideLabel?: boolean
  /** Classes for the field's root. */
  className?: string
}

const CHANNELS = ['hsb', 'rgb'] as const
const CURRENT = 'currentColor'

/**
 * A fill or stroke: Solid, Gradient or (with `allowNone`) None, then the
 * chosen kind's editor. Switching carries the color across: a solid becomes
 * a gradient's first stop, and a gradient's first stop the solid. With
 * `allowCurrentColor`, Current paints in the text's color.
 *
 * ```tsx
 * <ComplexColorField label="Fill" value={fill} onChange={setFill} allowNone />
 * ```
 */
export const ComplexColorField = ({
  label,
  value,
  onChange,
  allowNone,
  allowGradient = true,
  allowCurrentColor,
  disabled,
  swatches,
  onSwatchesChange,
  channels = CHANNELS,
  inlinePicker,
  kindLabels,
  hideLabel,
  className,
}: ComplexColorFieldProps): JSX.Element => {
  const id = useId()
  const kinds = [
    ...(allowCurrentColor
      ? [{ value: 'current', label: kindLabels?.current ?? 'Current' }]
      : []),
    { value: 'solid', label: kindLabels?.solid ?? 'Solid' },
    ...(allowGradient
      ? [{ value: 'gradient', label: kindLabels?.gradient ?? 'Gradient' }]
      : []),
    ...(allowNone ? [{ value: 'none', label: kindLabels?.none ?? 'None' }] : []),
  ]
  // currentColor is a solid as stored, its own kind as shown: it has no picker.
  const current = value.type === 'solid' && value.color === CURRENT
  const choose = (kind: string | number) => {
    if (kind === 'current') return onChange({ type: 'solid', color: CURRENT })
    if (kind === 'solid' && current) return onChange({ type: 'solid', color: '#000000' })
    onChange(withPaintType(value, kind as ComplexColorValue['type']))
  }

  return (
    <div
      role="group"
      aria-labelledby={id}
      className={cx('greese-ComplexColorField', className)}
    >
      <span id={id} className="greese-ComplexColorField-label" hidden={hideLabel}>
        {label}
      </span>
      <EditableField
        type="segmented"
        aria-label={`${label} kind`}
        options={kinds}
        value={current ? 'current' : value.type}
        disabled={disabled}
        onValueChange={choose}
      />
      {value.type === 'solid' && !current && inlinePicker && (
        <ColorPicker
          label={`${label} color`}
          value={value.color}
          disabled={disabled}
          eyedropper
          channels={channels}
          swatches={swatches}
          onSwatchesChange={onSwatchesChange}
          onValueChange={(color) => onChange({ type: 'solid', color })}
        />
      )}
      {value.type === 'solid' && !current && !inlinePicker && (
        <EditableField
          type="color"
          aria-label={`${label} color`}
          value={value.color}
          disabled={disabled}
          eyedropper
          channels={channels}
          swatches={swatches}
          onSwatchesChange={onSwatchesChange}
          onValueChange={(color) => color && onChange({ type: 'solid', color })}
        />
      )}
      {value.type === 'gradient' && (
        <GradientEditor
          value={value.gradient}
          disabled={disabled}
          onChange={(gradient) => onChange({ type: 'gradient', gradient })}
        />
      )}
    </div>
  )
}
