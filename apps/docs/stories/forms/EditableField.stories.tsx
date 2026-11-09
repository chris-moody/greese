import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { EditableField, Stack, Text } from '@greese/react'

const meta = {
  title: 'Forms/EditableField',
  component: EditableField,
  args: { label: 'Nickname', defaultValue: 'Ada' },
} satisfies Meta<typeof EditableField>
export default meta

type Story = StoryObj<typeof meta>

/**
 * A string value with no `type` renders as text. Give the field a `label` and
 * it sits beside the control, which is the row a property panel is made of.
 * With `defaultValue` and no `value`, the field keeps its own state.
 */
export const Playground: Story = {}

/**
 * Leave `type` out and the value picks its own control: a string is text, a
 * number is a number field, a boolean is a checkbox, and a string that reads
 * as a hex color is a color field.
 */
export const Inferred: Story = {
  render: function Render() {
    const [name, setName] = useState('Ada')
    const [count, setCount] = useState<number | null>(12)
    const [on, setOn] = useState(true)
    const [fill, setFill] = useState<string | null>('#e11d48')
    return (
      <Stack gap={2}>
        <EditableField label="Name" value={name} onValueChange={setName} />
        <EditableField label="Count" value={count} onValueChange={setCount} />
        <EditableField label="Visible" value={on} onValueChange={setOn} />
        <EditableField label="Fill" value={fill ?? '#000000'} onValueChange={setFill} />
      </Stack>
    )
  },
}

/** Every control it can render, as a panel of property rows. */
export const EveryType: Story = {
  render: function Render() {
    const [text, setText] = useState('Layer 1')
    const [width, setWidth] = useState<number | null>(240)
    const [opacity, setOpacity] = useState(80)
    const [fill, setFill] = useState<string | null>('#3b82f6')
    const [angle, setAngle] = useState(45)
    const [locked, setLocked] = useState(false)
    const [loop, setLoop] = useState(true)
    const [align, setAlign] = useState<string | number>('center')
    const [blend, setBlend] = useState<string | number>('normal')
    const [fit, setFit] = useState<string | number>('cover')
    return (
      <Stack gap={2} style={{ maxInlineSize: '20rem' }}>
        <EditableField label="Name" value={text} onValueChange={setText} />
        <EditableField
          label="Width"
          type="number"
          value={width}
          unit="px"
          min={0}
          onValueChange={setWidth}
        />
        <EditableField
          label="Opacity"
          type="range"
          value={opacity}
          unit="%"
          onValueChange={setOpacity}
        />
        <EditableField
          label="Fill"
          type="color"
          value={fill}
          allowEmpty
          onValueChange={setFill}
        />
        <EditableField label="Angle" type="knob" value={angle} onValueChange={setAngle} />
        <EditableField
          label="Locked"
          type="checkbox"
          value={locked}
          onValueChange={setLocked}
        />
        <EditableField label="Loop" type="switch" value={loop} onValueChange={setLoop} />
        <EditableField
          label="Align"
          type="segmented"
          value={align}
          options={[
            { value: 'start', label: 'Start' },
            { value: 'center', label: 'Center' },
            { value: 'end', label: 'End' },
          ]}
          onValueChange={setAlign}
        />
        <EditableField
          label="Blend"
          type="select"
          value={blend}
          options={[
            { value: 'normal', label: 'Normal', group: 'Basic' },
            { value: 'multiply', label: 'Multiply', group: 'Darken' },
            { value: 'screen', label: 'Screen', group: 'Lighten' },
          ]}
          onValueChange={setBlend}
        />
        <EditableField
          label="Fit"
          type="choice"
          value={fit}
          options={[
            { value: 'cover', label: 'Cover' },
            { value: 'contain', label: 'Contain' },
          ]}
          onValueChange={setFit}
        />
      </Stack>
    )
  },
}

/**
 * `indeterminate` is for a field standing in for several things that disagree:
 * it shows a placeholder instead of a value, and choosing one still reports it.
 */
export const Mixed: Story = {
  render: function Render() {
    const [value, setValue] = useState<number | null>(null)
    return (
      <Stack gap={2}>
        <EditableField
          label="Rotation"
          type="number"
          value={value}
          indeterminate={value === null}
          allowEmpty
          unit="°"
          onValueChange={setValue}
        />
        <Text variant="p3" tone="muted">
          {value === null ? 'Several values' : `All now ${value}°`}
        </Text>
      </Stack>
    )
  },
}

/**
 * `layout="column"` puts the name above the control, for a form rather than a
 * dense panel.
 */
export const Column: Story = {
  render: function Render() {
    const [value, setValue] = useState('Ada')
    return (
      <EditableField
        label="Display name"
        layout="column"
        value={value}
        onValueChange={setValue}
      />
    )
  },
}

/**
 * The color field's picker takes ColorPicker's own options: numeric channels,
 * the eyedropper, and swatches the reader keeps.
 */
export const ColorOptions: Story = {
  render: function Render() {
    const [fill, setFill] = useState<string | null>('#8b5cf6')
    const [saved, setSaved] = useState<readonly string[]>(['#e11d48', '#3b82f6'])
    return (
      <EditableField
        label="Fill"
        type="color"
        value={fill}
        allowEmpty
        alpha
        eyedropper
        channels={['rgb']}
        swatches={saved}
        onSwatchesChange={setSaved}
        onValueChange={setFill}
      />
    )
  },
}

/** Every type dims and stops taking input when the field is disabled. */
export const Disabled: Story = { args: { disabled: true } }

/**
 * `clearable` puts an × inside a text, number or textarea field while it holds
 * something; a select gets a first option for its own cleared value
 * (`clearValue`, `''` unless you say) instead.
 */
export const Clearable: Story = {
  render: function Render() {
    const [name, setName] = useState('Ada')
    const [width, setWidth] = useState<number | null>(24)
    const [notes, setNotes] = useState('Two\nlines')
    const [cap, setCap] = useState<string | number>('round')
    return (
      <Stack gap={2} style={{ maxInlineSize: '20rem' }}>
        <EditableField label="Name" clearable value={name} onValueChange={setName} />
        <EditableField
          type="number"
          label="Width"
          clearable
          value={width}
          onValueChange={setWidth}
        />
        <EditableField
          type="textarea"
          label="Notes"
          layout="column"
          clearable
          value={notes}
          onValueChange={setNotes}
        />
        <EditableField
          type="select"
          label="Line cap"
          clearable
          clearLabel="No cap"
          value={cap}
          onValueChange={setCap}
          options={[
            { value: 'round', label: 'Round' },
            { value: 'square', label: 'Square' },
          ]}
        />
      </Stack>
    )
  },
}
