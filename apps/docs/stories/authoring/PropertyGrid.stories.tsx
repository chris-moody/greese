import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { EditableField } from '@greese/react'
import { PropertyGrid } from '@greese/authoring'
import '@greese/authoring/styles.css'

const meta = {
  title: 'Authoring/PropertyGrid',
  component: PropertyGrid,
  args: { columns: 1 },
  argTypes: { columns: { control: { type: 'number', min: 1, max: 3 } } },
} satisfies Meta<typeof PropertyGrid>
export default meta

type Story = StoryObj<typeof meta>

/** A panel's properties: the names line up in one column, the controls in the next. */
export const Playground: Story = {
  render: function Playground(args) {
    const [name, setName] = useState('Star')
    const [opacity, setOpacity] = useState(80)
    const [visible, setVisible] = useState(true)
    return (
      <PropertyGrid {...args} style={{ maxInlineSize: '20rem' }}>
        <EditableField label="Name" value={name} onValueChange={setName} />
        <EditableField
          type="range"
          label="Opacity"
          min={0}
          max={100}
          value={opacity}
          onValueChange={setOpacity}
        />
        <EditableField
          type="switch"
          label="Visible"
          value={visible}
          onValueChange={setVisible}
        />
      </PropertyGrid>
    )
  },
}

/** Two to a row: each X beside its Y, every pair aligned with the rows above. */
export const Pairs: Story = {
  args: { columns: 2 },
  render: function Pairs(args) {
    const [box, setBox] = useState({ x: 10, y: 20, width: 120, height: 80 })
    const field = (label: string, key: keyof typeof box) => (
      <EditableField
        type="number"
        label={label}
        unit="px"
        value={box[key]}
        onValueChange={(next) => next !== null && setBox({ ...box, [key]: next })}
      />
    )
    return (
      <PropertyGrid {...args} style={{ maxInlineSize: '24rem' }}>
        {field('X', 'x')}
        {field('Y', 'y')}
        {field('Width', 'width')}
        {field('Height', 'height')}
      </PropertyGrid>
    )
  },
}
