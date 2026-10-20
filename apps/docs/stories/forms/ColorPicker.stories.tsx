import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button, ColorPicker, Popover, Stack, Text } from '@greese/react'

const brand = [
  '#e11d48',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#111827',
]

const meta = {
  title: 'Forms/ColorPicker',
  component: ColorPicker,
  args: { defaultValue: '#3b82f6', swatches: brand },
} satisfies Meta<typeof ColorPicker>
export default meta

type Story = StoryObj<typeof meta>

/** Drag with mouse, pen or finger; arrows (Shift for bigger steps) on the area. */
export const Playground: Story = {}

export const WithOpacity: Story = { args: { alpha: true, defaultValue: '#8b5cf6b3' } }

/** A compact color field: a swatch button opening the picker in a Popover. */
export const InPopover: Story = {
  render: function Render() {
    const [color, setColor] = useState('#e11d48')
    return (
      <Popover
        label="Accent color"
        trigger={
          <Button variant="outline" tone="neutral">
            <span
              aria-hidden="true"
              style={{
                inlineSize: '1rem',
                blockSize: '1rem',
                borderRadius: '50%',
                background: color,
                boxShadow: 'inset 0 0 0 1px rgb(0 0 0 / 15%)',
              }}
            />
            Accent: {color}
          </Button>
        }
      >
        <ColorPicker value={color} onValueChange={setColor} swatches={brand} />
      </Popover>
    )
  },
}

export const Controlled: Story = {
  render: function Render() {
    const [color, setColor] = useState('#22c55e')
    return (
      <Stack gap={3}>
        <ColorPicker value={color} onValueChange={setColor} />
        <Text size="sm" tone="muted">
          Value: <code>{color}</code>
        </Text>
      </Stack>
    )
  },
}
