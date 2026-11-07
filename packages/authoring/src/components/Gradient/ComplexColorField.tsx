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
  /** The kinds' names, translated or shortened. @default { solid: 'Solid', gradient: 'Gradient', none: 'None' } */
  kindLabels?: { solid?: string; gradient?: string; none?: string }
  /** Keeps `label` as the group's name but doesn't show it: for a row that names it already. */
  hideLabel?: boolean
  /** Classes for the field's root. */
  className?: string
}

const CHANNELS = ['hsb', 'rgb'] as const

/**
 * A fill or stroke: Solid, Gradient or (with `allowNone`) None, then the
 * chosen kind's editor. Switching carries the color across: a solid becomes
 * a gradient's first stop, and a gradient's first stop the solid.
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
    { value: 'solid', label: kindLabels?.solid ?? 'Solid' },
    { value: 'gradient', label: kindLabels?.gradient ?? 'Gradient' },
    ...(allowNone ? [{ value: 'none', label: kindLabels?.none ?? 'None' }] : []),
  ]

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
        value={value.type}
        disabled={disabled}
        onValueChange={(kind) =>
          onChange(withPaintType(value, kind as ComplexColorValue['type']))
        }
      />
      {value.type === 'solid' && inlinePicker && (
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
      {value.type === 'solid' && !inlinePicker && (
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
