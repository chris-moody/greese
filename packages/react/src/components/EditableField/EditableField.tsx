'use client'
import {
  useState,
  type CSSProperties,
  type FocusEvent,
  type JSX,
  type ReactNode,
} from 'react'
import { cx } from '../../utils/cx.ts'
import { type ControlSize } from '../Button/Button.tsx'
import { Checkbox } from '../Checkbox/Checkbox.tsx'
import { ColorPicker } from '../ColorPicker/ColorPicker.tsx'
import { Input } from '../Input/Input.tsx'
import { NumberField } from '../NumberField/NumberField.tsx'
import { Popover } from '../Popover/Popover.tsx'
import { Radio, RadioGroup } from '../Radio/Radio.tsx'
import { Segment, SegmentedControl } from '../SegmentedControl/SegmentedControl.tsx'
import { Select } from '../Select/Select.tsx'
import { Slider } from '../Slider/Slider.tsx'
import { Switch } from '../Switch/Switch.tsx'
import { useControllableState } from '../../hooks/useControllableState.ts'
import { Dial } from './Dial.tsx'
import {
  inferEditableFieldType,
  OPTION_TYPES,
  resolveDecimals,
  roundTo,
  wrapDegrees,
  type EditableFieldOption,
  type EditableFieldType,
  type EditableFieldValue,
} from './fieldValues.ts'
import { withGreese, type GreeseProps } from '../../utils/greese.ts'
import type { ColorChannelSet } from '../ColorPicker/colorMath.ts'

/** What every variant takes. */
interface CommonProps extends GreeseProps {
  /**
   * The field's name, shown beside the control and announced with it. Give
   * `aria-label` instead for a field a neighbouring heading already names.
   */
  label?: string
  /** The control's name when no `label` is shown. */
  'aria-label'?: string
  /** Keep the name for screen readers but don't show it. */
  hideLabel?: boolean
  /**
   * Name beside the control, or above it.
   * @default 'row'
   */
  layout?: 'row' | 'column'
  /** Height and text size of the control. @default 'sm' */
  size?: ControlSize
  /** Stops interaction and dims the field. */
  disabled?: boolean
  /**
   * True when the field stands for several things that disagree — a
   * multi-selection whose values differ. The control shows a placeholder in
   * place of a value; choosing one still reports it normally.
   */
  indeterminate?: boolean
  /** What a mixed field shows in place of a value. @default 'Mixed' */
  indeterminateLabel?: string
  /** Extra classes on the field's root. */
  className?: string
  /** Inline styles on the field's root. */
  style?: CSSProperties
}

/** What the text and number variants share. */
interface EntryProps extends CommonProps {
  /** Shown while the field is empty. */
  placeholder?: string
  /** A unit shown after the value: `px`, `%`, `°`. */
  unit?: string
}

/** A line of text. What a string value renders as when no `type` is given. */
export interface TextFieldVariantProps extends EntryProps {
  /** Renders a text input. Inferred from a string value. */
  type?: 'text'
  /** The text, when you control it. Pair with `onValueChange`. */
  value?: string
  /** The text it starts with, when it keeps its own state. */
  defaultValue?: string
  /** Called with the new text on every keystroke. */
  onValueChange?: (value: string) => void
}

/** A number with stepper buttons. What a number value renders as. */
export interface NumberFieldVariantProps extends EntryProps {
  /** Renders a number input. Inferred from a number value. */
  type?: 'number'
  /** The number, when you control it; `null` when empty. */
  value?: number | null
  /** The number it starts with, when it keeps its own state. */
  defaultValue?: number | null
  /** Called with the committed number, or `null` when cleared. */
  onValueChange?: (value: number | null) => void
  /** The lowest value the field accepts. */
  min?: number
  /** The highest value the field accepts. */
  max?: number
  /** What the arrows move by, and what typed values snap to. */
  step?: number
  /** How many decimal places to keep; widened to fit `step`. @default 2 */
  numDecimals?: number
  /** Let the field be cleared, reporting `null` instead of a number. */
  allowEmpty?: boolean
}

/** A slider, with its value beside it. */
export interface RangeFieldVariantProps extends CommonProps {
  /** Renders a slider. */
  type: 'range'
  /** The value, when you control it. Pair with `onValueChange`. */
  value?: number
  /** The value it starts at, when it keeps its own state. */
  defaultValue?: number
  /** Called with the new value as the slider moves. */
  onValueChange?: (value: number) => void
  /** The value at the start of the track. @default 0 */
  min?: number
  /** The value at the end of the track. @default 100 */
  max?: number
  /** What dragging and the arrow keys snap to. @default 1 */
  step?: number
  /** Show the value after the slider. @default true */
  showValue?: boolean
  /** A unit shown after the value. */
  unit?: string
}

/** A color swatch that opens a ColorPicker. */
export interface ColorFieldVariantProps extends CommonProps {
  /** Renders a color swatch that opens a picker. */
  type: 'color'
  /** The color as hex, when you control it; `null` for no color. */
  value?: string | null
  /** The color it starts with, when it keeps its own state. */
  defaultValue?: string | null
  /** Called with the new hex color, or `null` when it is cleared. */
  onValueChange?: (value: string | null) => void
  /** Offer a "No color" button, which reports `null`. */
  allowEmpty?: boolean
  /** Colors offered as one-tap swatches in the picker. */
  swatches?: readonly string[]
  /** Setting it lets the reader save and clear swatches — see ColorPicker. */
  onSwatchesChange?: (swatches: readonly string[]) => void
  /** Numeric channel fields in the picker — see ColorPicker. */
  channels?: readonly ColorChannelSet[]
  /** Offer the screen eyedropper in the picker, where the browser has one. */
  eyedropper?: boolean
  /** Let the color carry transparency. */
  alpha?: boolean
}

/** A drag-to-rotate direction dial, in degrees clockwise from up. */
export interface KnobFieldVariantProps extends CommonProps {
  /** Renders a direction dial. */
  type: 'knob'
  /** The angle in degrees, when you control it: `0` points up, growing clockwise. */
  value?: number
  /** The angle it starts at, when it keeps its own state. */
  defaultValue?: number
  /** Called with the new angle, wrapped into 0–360. */
  onValueChange?: (value: number) => void
  /** Show an editable number beside the dial. @default true */
  showValue?: boolean
}

/** A checkbox. What a boolean value renders as when no `type` is given. */
export interface CheckboxFieldVariantProps extends CommonProps {
  /** Renders a checkbox. Inferred from a boolean value. */
  type?: 'checkbox'
  /** Whether it is checked, when you control it. Pair with `onValueChange`. */
  value?: boolean
  /** Whether it starts checked, when it keeps its own state. */
  defaultValue?: boolean
  /** Called with the new state. */
  onValueChange?: (value: boolean) => void
}

/** A switch: a checkbox's state, for something that takes effect at once. */
export interface SwitchFieldVariantProps extends CommonProps {
  /** Renders a switch. */
  type: 'switch'
  /** Whether it is on, when you control it. Pair with `onValueChange`. */
  value?: boolean
  /** Whether it starts on, when it keeps its own state. */
  defaultValue?: boolean
  /** Called with the new state. */
  onValueChange?: (value: boolean) => void
}

/** What the option-bearing variants share. */
interface OptionsProps extends CommonProps {
  /** The choices. Required: these variants render nothing without them. */
  options: readonly EditableFieldOption[]
  /** The chosen option's value, when you control it. Pair with `onValueChange`. */
  value?: string | number
  /** The option chosen at first, when it keeps its own state. */
  defaultValue?: string | number
  /** Called with the newly chosen option's value. */
  onValueChange?: (value: string | number) => void
}

/** A row of radios. */
export interface RadioFieldVariantProps extends OptionsProps {
  /** Renders a row of radios. */
  type: 'radio'
}

/** A dropdown. */
export interface SelectFieldVariantProps extends OptionsProps {
  /** Renders a dropdown. */
  type: 'select'
}

/** Radios for a few options, a dropdown for more: whichever suits the count. */
export interface ChoiceFieldVariantProps extends OptionsProps {
  /** Renders radios or a dropdown, by how many options there are. */
  type: 'choice'
  /** Up to this many options render as radios; beyond it, a dropdown. @default 3 */
  radioLimit?: number
}

/** A segmented control: one of a few options, side by side. */
export interface SegmentedFieldVariantProps extends OptionsProps {
  /** Renders a segmented control. */
  type: 'segmented'
}

/** Every shape EditableField takes. `type` narrows `value` and `onValueChange`. */
export type EditableFieldProps =
  | TextFieldVariantProps
  | NumberFieldVariantProps
  | RangeFieldVariantProps
  | ColorFieldVariantProps
  | KnobFieldVariantProps
  | CheckboxFieldVariantProps
  | SwitchFieldVariantProps
  | RadioFieldVariantProps
  | SelectFieldVariantProps
  | ChoiceFieldVariantProps
  | SegmentedFieldVariantProps

/** A `<select>`'s options, grouped wherever `group` changes. */
const asOptions = (list: readonly EditableFieldOption[]): ReactNode[] => {
  const out: ReactNode[] = []
  let open: EditableFieldOption[] | null = null
  let group: string | undefined
  const flush = () => {
    if (open && group !== undefined) {
      out.push(
        <optgroup key={`group-${group}-${out.length}`} label={group}>
          {open.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </optgroup>
      )
    }
    open = null
  }
  for (const option of list) {
    if (option.group !== group) {
      flush()
      group = option.group
      open = group === undefined ? null : []
    }
    if (open) open.push(option)
    else
      out.push(
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      )
  }
  flush()
  return out
}

/**
 * A field in a panel of them is read far more often than it is edited, and the
 * edit is usually a replacement, so focus selects what is there: typing
 * overwrites it without selecting first, and a click still places the caret.
 */
const selectAll = (event: FocusEvent<HTMLInputElement>): void => {
  event.currentTarget.select()
}

/**
 * The option's own `value`, found from the string a native control reports: an
 * `options` list may hold numbers, and `<option value={2}>` comes back `"2"`.
 */
const reselect = (
  list: readonly EditableFieldOption[],
  reported: string
): string | number =>
  list.find((option) => String(option.value) === reported)?.value ?? reported

/**
 * One field for a value of any kind: text, a number, a slider, a color, a
 * dial, a checkbox, a switch, radios, a dropdown or a segmented control. Give
 * it a `type` to say which, or leave it out and a string, number or boolean
 * picks its own.
 *
 * It is for a panel built from data — a property inspector, a settings
 * sheet — where what is being edited decides the control. For a control you
 * chose yourself, reach for that component (TextField, NumberField, Slider…)
 * directly.
 *
 * ```tsx
 * <EditableField label="Opacity" type="range" value={opacity} onValueChange={setOpacity} />
 * <EditableField label="Fill" type="color" value={fill} onValueChange={setFill} />
 * ```
 *
 * Give it a `label` or an `aria-label`: a field with neither has no name for a
 * screen reader. Focusing a text or number field selects its value, so typing
 * replaces it.
 */
export const EditableField = (props: EditableFieldProps): JSX.Element | null => {
  const { greese, label, hideLabel, layout = 'row', className, style } = props
  const [open, setOpen] = useState(false)
  // One piece of state for every variant: the value's own type is the
  // variant's business, and `commit` hands it back to the caller's callback.
  const [value, commit] = useControllableState<EditableFieldValue>({
    value: props.value,
    defaultValue: props.defaultValue ?? null,
    onChange: props.onValueChange as ((value: EditableFieldValue) => void) | undefined,
  })

  const type: EditableFieldType = props.type ?? inferEditableFieldType(value)
  const list = 'options' in props ? props.options : undefined
  if (OPTION_TYPES.includes(type) && (!list || list.length === 0)) return null

  const control = renderControl(props, {
    type,
    value,
    commit,
    name: label ?? props['aria-label'] ?? '',
    size: props.size ?? 'sm',
    indeterminateLabel: props.indeterminateLabel ?? 'Mixed',
    open,
    setOpen,
  })

  return withGreese(
    <div
      className={cx(
        'greese-EditableField',
        `greese-EditableField--${layout}`,
        `greese-EditableField--${type}`,
        props.indeterminate && 'greese-EditableField--mixed',
        className
      )}
      data-disabled={props.disabled || undefined}
      style={style}
    >
      {/*
        Decorative: the control carries the same text as its own (hidden)
        label or `aria-label`, so repeating it here as a real `<label>` would
        have screen readers announce the name twice.
      */}
      {label !== undefined && !hideLabel && (
        <span className="greese-EditableField-label" aria-hidden="true">
          {label}
        </span>
      )}
      {control}
    </div>,
    greese
  )
}

/** What a variant's renderer needs beyond the field's own props. */
interface Context {
  type: EditableFieldType
  /** The current value, whoever is holding it. */
  value: EditableFieldValue
  /** Reports a new value, and keeps it when the field is uncontrolled. */
  commit: (value: EditableFieldValue) => void
  /** The control's accessible name: the `label`, or the `aria-label`. */
  name: string
  size: ControlSize
  indeterminateLabel: string
  open: boolean
  setOpen: (open: boolean) => void
}

const renderControl = (props: EditableFieldProps, context: Context): ReactNode => {
  const { type, value, commit, name, size, indeterminateLabel } = context
  const { disabled, indeterminate } = props

  switch (type) {
    case 'number': {
      const field = props as NumberFieldVariantProps
      const decimals = resolveDecimals(field.step, field.numDecimals)
      return (
        <div className="greese-EditableField-control greese-EditableField-number">
          <NumberField
            label={name}
            hideLabel
            size={size}
            disabled={disabled}
            placeholder={indeterminate ? indeterminateLabel : field.placeholder}
            value={indeterminate || typeof value !== 'number' ? null : value}
            min={field.min}
            max={field.max}
            step={field.step}
            onValueChange={(next) => {
              // An emptied field only means `null` where the caller said so;
              // otherwise the value it had stands.
              if (next === null) {
                if (field.allowEmpty) commit(null)
                return
              }
              commit(roundTo(next, decimals))
            }}
            onFocus={selectAll}
          />
          {/* NumberField's own frame ends in its steppers, so the unit sits after it. */}
          {field.unit && (
            <span className="greese-EditableField-unit" aria-hidden="true">
              {field.unit}
            </span>
          )}
        </div>
      )
    }

    case 'range': {
      const field = props as RangeFieldVariantProps
      return (
        <div className="greese-EditableField-control greese-EditableField-range">
          <Slider
            aria-label={name || undefined}
            min={field.min}
            max={field.max}
            step={field.step}
            value={typeof value === 'number' ? value : (field.min ?? 0)}
            disabled={disabled}
            onValueChange={commit}
          />
          {field.showValue !== false && (
            <span className="greese-EditableField-value" aria-hidden="true">
              {indeterminate
                ? indeterminateLabel
                : `${Number(value ?? 0)}${field.unit ?? ''}`}
            </span>
          )}
        </div>
      )
    }

    case 'color': {
      const field = props as ColorFieldVariantProps
      const color = typeof value === 'string' ? value : null
      return (
        <Popover
          open={context.open}
          onOpenChange={context.setOpen}
          label={`${name || 'Color'} picker`}
          className="greese-EditableField-picker"
          trigger={
            <button
              type="button"
              className="greese-EditableField-control greese-EditableField-swatch"
              disabled={disabled}
              aria-label={name || 'Color'}
              data-none={color === null || undefined}
              data-mixed={indeterminate || undefined}
              style={
                {
                  '--greese-editablefield-swatch': color ?? 'transparent',
                } as CSSProperties
              }
            />
          }
        >
          <ColorPicker
            value={color ?? undefined}
            label={name || 'Color'}
            alpha={field.alpha}
            channels={field.channels}
            eyedropper={field.eyedropper}
            swatches={field.swatches}
            onSwatchesChange={field.onSwatchesChange}
            disabled={disabled}
            onValueChange={commit}
          />
          {field.allowEmpty && (
            <button
              type="button"
              className="greese-EditableField-none"
              onClick={() => {
                commit(null)
                context.setOpen(false)
              }}
            >
              No color
            </button>
          )}
        </Popover>
      )
    }

    case 'knob': {
      const field = props as KnobFieldVariantProps
      const angle = typeof value === 'number' ? value : 0
      return (
        <div className="greese-EditableField-control greese-EditableField-knob">
          <Dial
            value={angle}
            onValueChange={commit}
            label={name || 'Direction'}
            disabled={disabled}
          />
          {field.showValue !== false && (
            <NumberField
              className="greese-EditableField-readout"
              label={`${name || 'Direction'} in degrees`}
              hideLabel
              size={size}
              min={0}
              max={359.99}
              step={0.01}
              disabled={disabled}
              value={angle}
              onValueChange={(next) => commit(wrapDegrees(next ?? 0))}
              onFocus={selectAll}
            />
          )}
        </div>
      )
    }

    case 'checkbox': {
      return (
        <Checkbox
          className="greese-EditableField-control"
          aria-label={name || undefined}
          checked={value === true}
          indeterminate={indeterminate}
          disabled={disabled}
          onCheckedChange={commit}
        />
      )
    }

    case 'switch': {
      return (
        <Switch
          className="greese-EditableField-control"
          aria-label={name || undefined}
          checked={value === true}
          disabled={disabled}
          onCheckedChange={commit}
        />
      )
    }

    case 'select': {
      const field = props as SelectFieldVariantProps
      const chosen = value === null ? '' : String(value)
      return (
        <Select
          className="greese-EditableField-control"
          aria-label={name || undefined}
          size={size}
          disabled={disabled}
          value={indeterminate ? '' : chosen}
          placeholder={indeterminate ? indeterminateLabel : undefined}
          onChange={(event) => commit(reselect(field.options, event.target.value))}
        >
          {asOptions(field.options)}
        </Select>
      )
    }

    case 'radio': {
      const field = props as RadioFieldVariantProps
      return (
        <RadioGroup
          className="greese-EditableField-control"
          label={name}
          hideLabel
          direction="row"
          gap={2}
          disabled={disabled}
          value={value === null ? '' : String(value)}
          onValueChange={(next) => commit(reselect(field.options, next))}
        >
          {field.options.map((option) => (
            <Radio key={option.value} value={String(option.value)} label={option.label} />
          ))}
        </RadioGroup>
      )
    }

    case 'segmented': {
      const field = props as SegmentedFieldVariantProps
      return (
        <SegmentedControl
          className="greese-EditableField-control"
          label={name}
          size={size === 'lg' ? 'md' : 'sm'}
          disabled={disabled}
          value={value === null ? '' : String(value)}
          onValueChange={(next) => commit(reselect(field.options, next))}
        >
          {field.options.map((option) => (
            <Segment key={option.value} value={String(option.value)}>
              {option.label}
            </Segment>
          ))}
        </SegmentedControl>
      )
    }

    case 'choice': {
      const field = props as ChoiceFieldVariantProps
      const next: EditableFieldType =
        field.options.length <= (field.radioLimit ?? 3) ? 'radio' : 'select'
      return renderControl({ ...field, type: next } as EditableFieldProps, {
        ...context,
        type: next,
      })
    }

    default: {
      const field = props as TextFieldVariantProps
      return (
        <Input
          className="greese-EditableField-control"
          aria-label={name || undefined}
          size={size}
          disabled={disabled}
          endAdornment={field.unit}
          placeholder={indeterminate ? indeterminateLabel : field.placeholder}
          value={indeterminate || typeof value !== 'string' ? '' : value}
          onChange={(event) => commit(event.target.value)}
          onFocus={selectAll}
        />
      )
    }
  }
}
