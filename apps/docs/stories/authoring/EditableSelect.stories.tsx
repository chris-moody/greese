import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { EditableSelect, unitOptions } from '@greese/authoring'
import { Text } from '@greese/react'

const meta = {
  title: 'Authoring/EditableSelect',
  component: EditableSelect<number>,
  args: {
    label: 'Zoom',
    hideLabel: false,
    value: 100,
    options: unitOptions([25, 50, 100, 200], '%'),
    onChange: () => undefined,
  },
  argTypes: { onChange: { control: false }, options: { control: false } },
} satisfies Meta<typeof EditableSelect<number>>
export default meta

type Story = StoryObj<typeof meta>

/**
 * Type a value or pick a preset: the arrow keys open them all, Enter keeps a
 * typed value that parses, and anything else goes back.
 */
export const Playground: Story = {
  render: function Playground(args) {
    const [zoom, setZoom] = useState(100)
    return (
      <div style={{ maxInlineSize: '12rem' }}>
        <EditableSelect {...args} value={zoom} onChange={setZoom} />
        <Text variant="caption">Zoom: {zoom}%</Text>
      </div>
    )
  },
}
